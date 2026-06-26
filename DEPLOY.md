# Despliegue de v2.6.0

Esta versión corrige la gestión de colaboradores, añade copias independientes de itinerarios y notificaciones administrativas por correo. Conserva usuarios, contraseñas, itinerarios, planes y el volumen PostgreSQL. No incorpora migraciones.

Actualiza primero Hetzner y después GitHub/Netlify, porque el nuevo frontend utiliza endpoints añadidos en v2.6.0.

## 1. Subida desde PowerShell

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.6.0.zip" `
  root@178.104.205.43:/root/
```

```powershell
ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Verificación del paquete

```bash
ls -lh /root/itinera-v2.6.0.zip
sha256sum /root/itinera-v2.6.0.zip
```

El valor debe coincidir con `itinera-v2.6.0.zip.sha256`.

## 3. Copia de seguridad de PostgreSQL

```bash
cd /opt/itinera-v2

mkdir -p /opt/backups/itinera-v2
BACKUP="/opt/backups/itinera-v2/pre-v2.6.0-$(date +%Y%m%d-%H%M%S).sql"

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$BACKUP"

ls -lh "$BACKUP"
```

## 4. Configurar las notificaciones por correo

Las notificaciones se envían a `ADMIN_EMAIL`. Comprueba la configuración sin mostrar la clave completa:

```bash
cd /opt/itinera-v2

grep -E '^(ADMIN_EMAIL|MAIL_FROM)=' .env.production

awk -F= '/^RESEND_API_KEY=/{
  if (length($2) > 0) print "RESEND_API_KEY=<CONFIGURADA>";
  else print "RESEND_API_KEY=<VACÍA>";
}' .env.production
```

Para recibir correos reales, `.env.production` debe contener:

```env
ADMIN_EMAIL=jonathan.agudiez@gmail.com
RESEND_API_KEY=re_TU_CLAVE
MAIL_FROM=Itinera <notificaciones@TU_DOMINIO_VERIFICADO>
```

Edita el archivo si hace falta:

```bash
nano /opt/itinera-v2/.env.production
```

Guarda con `Ctrl+O`, confirma con `Enter` y sal con `Ctrl+X`. Después:

```bash
chmod 600 /opt/itinera-v2/.env.production
```

Sin `RESEND_API_KEY`, Itinera registra los avisos en los logs, pero no puede entregarlos por email. El remitente de `MAIL_FROM` debe estar verificado por el proveedor.

## 5. Instalación segura de la release

El bloque se detiene antes de `rsync` si el ZIP falta o la release no contiene la estructura esperada.

```bash
set -e

test -f /root/itinera-v2.6.0.zip

rm -rf /opt/releases/itinera-v2.6.0
mkdir -p /opt/releases/itinera-v2.6.0

unzip -q \
  /root/itinera-v2.6.0.zip \
  -d /opt/releases/itinera-v2.6.0

test -f /opt/releases/itinera-v2.6.0/VERSION.txt
test -f /opt/releases/itinera-v2.6.0/docker-compose.hetzner.yml
test -f /opt/releases/itinera-v2.6.0/backend/package.json
test -f /opt/releases/itinera-v2.6.0/frontend/package.json
test "$(cat /opt/releases/itinera-v2.6.0/VERSION.txt)" = "2.6.0"
test -f /opt/itinera-v2/.env.production

cp /opt/itinera-v2/.env.production /root/itinera-v2.env.production.v2.6.0
chmod 600 /root/itinera-v2.env.production.v2.6.0

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.6.0/ \
  /opt/itinera-v2/

cp /root/itinera-v2.env.production.v2.6.0 /opt/itinera-v2/.env.production
chmod 600 /opt/itinera-v2/.env.production

cd /opt/itinera-v2
cat VERSION.txt
stat -c '%a %U:%G %n' .env.production
```

Valores esperados:

```text
2.6.0
600 root:root .env.production
```

## 6. Validación de Compose

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  config --quiet \
  && echo "Docker Compose válido"
```

## 7. Build y recreación exclusiva de la API

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  build --no-cache api
```

Cuando termine:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  up -d \
  --no-deps \
  --force-recreate \
  api

sleep 25
```

PostgreSQL no se recrea. Tampoco se modifican Itinera v1, Caddy ni Yieldsoft.

## 8. Verificación del backend

```bash
cd /opt/itinera-v2

echo "=== VERSIÓN ==="
cat VERSION.txt

echo
echo "=== CONTENEDORES V2 ==="
docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  ps

echo
echo "=== LIVE ==="
curl -fsS \
  https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/live

echo
echo
echo "=== READY ==="
curl -fsS \
  https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/ready

echo
echo
echo "=== LOGS API ==="
docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  logs --tail=200 api
```

El endpoint `live` debe indicar `"version":"2.6.0"`.

## 9. Probar el correo administrativo

Comprueba primero que la clave llegó al contenedor:

```bash
docker exec itinera_v2-api-1 sh -lc '
  if [ -n "$RESEND_API_KEY" ]; then
    echo "Resend configurado";
  else
    echo "Resend desactivado: falta RESEND_API_KEY";
  fi
'
```

Con Resend configurado, envía un mensaje de prueba:

```bash
docker exec -i itinera_v2-api-1 \
  node --input-type=module <<'NODE'
import { config } from './dist/config.js';
import { sendMail } from './dist/services/mail.js';

if (!config.ADMIN_EMAIL) throw new Error('ADMIN_EMAIL no está configurado');

await sendMail({
  to: config.ADMIN_EMAIL,
  subject: 'Prueba de notificaciones de Itinera',
  html: '<p>Las notificaciones administrativas de Itinera v2.6.0 funcionan correctamente.</p>',
});

console.log(`Correo de prueba enviado a ${config.ADMIN_EMAIL}`);
NODE
```

## 10. Actualización de GitHub y Netlify

1. Descomprimir `itinera-v2.6.0.zip` en Windows.
2. Abrir el repositorio de Itinera en GitHub.
3. Seleccionar **Add file → Upload files**.
4. Entrar en la carpeta extraída y arrastrar todo su contenido, no la carpeta contenedora.
5. Confirmar que `frontend/`, `backend/`, `netlify.toml` y `VERSION.txt` quedan en la raíz.
6. Usar el mensaje:

```text
v2.6.0: copias de itinerarios y notificaciones
```

Netlify desplegará automáticamente. No hay que modificar Caddy, CORS ni la URL pública.

## 11. Pruebas funcionales

- Crear un usuario nuevo y comprobar que llega el aviso al administrador.
- Añadir ese usuario como colaborador con permiso de edición y confirmar que no aparece el error de `currentTarget`.
- Entrar con el colaborador y editar un plan.
- Pulsar el icono de copiar desde un itinerario al que tenga acceso.
- Confirmar que la copia aparece en sus itinerarios como propiedad suya.
- Modificar la copia y comprobar que el original permanece intacto.
- Abrir un enlace público, iniciar sesión y copiarlo.
- Confirmar la llegada del aviso por correo después de cada copia.
