# Despliegue de v2.5.4

Esta actualización conserva `.env.production`, usuarios, contraseñas, itinerarios, planes y el volumen PostgreSQL. No incorpora migraciones.

## 1. Subida desde PowerShell

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.5.4.zip" `
  root@178.104.205.43:/root/
```

Entrar al servidor:

```powershell
ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Verificación del paquete

```bash
ls -lh /root/itinera-v2.5.4.zip
sha256sum /root/itinera-v2.5.4.zip
```

El valor debe coincidir con `itinera-v2.5.4.zip.sha256`.

## 3. Copia de seguridad de PostgreSQL

```bash
cd /opt/itinera-v2

mkdir -p /opt/backups/itinera-v2
BACKUP="/opt/backups/itinera-v2/pre-v2.5.4-$(date +%Y%m%d-%H%M%S).sql"

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$BACKUP"

ls -lh "$BACKUP"
```

## 4. Instalación segura de la release

El bloque se detiene antes de `rsync` si el ZIP falta o la release no contiene la estructura esperada.

```bash
set -e

test -f /root/itinera-v2.5.4.zip

rm -rf /opt/releases/itinera-v2.5.4
mkdir -p /opt/releases/itinera-v2.5.4

unzip -q \
  /root/itinera-v2.5.4.zip \
  -d /opt/releases/itinera-v2.5.4

test -f /opt/releases/itinera-v2.5.4/VERSION.txt
test -f /opt/releases/itinera-v2.5.4/docker-compose.hetzner.yml
test -f /opt/releases/itinera-v2.5.4/backend/package.json
test -f /opt/releases/itinera-v2.5.4/frontend/package.json
test "$(cat /opt/releases/itinera-v2.5.4/VERSION.txt)" = "2.5.4"
test -f /opt/itinera-v2/.env.production

cp /opt/itinera-v2/.env.production /root/itinera-v2.env.production.v2.5.4
chmod 600 /root/itinera-v2.env.production.v2.5.4

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.5.4/ \
  /opt/itinera-v2/

cp /root/itinera-v2.env.production.v2.5.4 /opt/itinera-v2/.env.production
chmod 600 /opt/itinera-v2/.env.production

cd /opt/itinera-v2
cat VERSION.txt
stat -c '%a %U:%G %n' .env.production
```

Valores esperados:

```text
2.5.4
600 root:root .env.production
```

## 5. Validación de Compose

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  config --quiet \
  && echo "Docker Compose válido"
```

## 6. Build y recreación exclusiva de la API

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

## 7. Verificación del backend

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
echo "=== LOGS API ==="
docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  logs --tail=200 api

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
echo "=== ITINERA V1 ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
  https://itinera-api.178-104-205-43.sslip.io/api/v1/health/live

echo
echo "=== YIELDSOFT ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
  https://app.yieldsoft.net
```

El endpoint `live` debe indicar `"version":"2.5.4"`; `ready`, Itinera v1 y Yieldsoft deben responder correctamente.

## 8. Actualización de GitHub y Netlify

1. Descomprimir `itinera-v2.5.4.zip` en Windows.
2. Abrir el repositorio de Itinera en GitHub.
3. Seleccionar **Add file → Upload files**.
4. Entrar en la carpeta extraída y arrastrar todo su contenido, no la carpeta contenedora.
5. Confirmar que `frontend/`, `backend/`, `netlify.toml` y `VERSION.txt` quedan en la raíz.
6. Usar el mensaje:

```text
v2.5.4: navegación móvil inferior y PDF refinado
```

Netlify desplegará el frontend automáticamente. No es necesario modificar Caddy, la URL pública ni CORS.

## 9. Comprobación visual

- Recargar `https://poca-broma.netlify.app` con `Ctrl + F5`.
- Confirmar que las tarjetas son ligeramente menos altas.
- Revisar que las cabeceras de fecha son mayores sin cambios en el contenedor.
- En móvil, confirmar que no existe logo en la parte superior y que la navegación flota fija abajo.
- Abrir los formularios móviles y comprobar el margen lateral de sus overlays.
- Exportar a PDF A4 apaisado y verificar que conserva la tabla completa con tarjetas compactas.
