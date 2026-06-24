# Actualización de Itinera v2.0.0 a v2.1.0

Esta actualización conserva la base de datos, las cuentas, los itinerarios, las credenciales y `.env.production`. No requiere cambios en Caddy ni nuevas migraciones.

## 1. Subir el ZIP desde PowerShell

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.1.0.zip" `
  root@178.104.205.43:/root/

ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Instalar la nueva release conservando secretos

```bash
rm -rf /opt/releases/itinera-v2.1.0
mkdir -p /opt/releases/itinera-v2.1.0
unzip -q /root/itinera-v2.1.0.zip -d /opt/releases/itinera-v2.1.0

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.1.0/ \
  /opt/itinera-v2/

cd /opt/itinera-v2
cat VERSION.txt
```

Resultado esperado: `2.1.0`.

## 3. Validar configuración

```bash
cd /opt/itinera-v2

stat -c '%a %U:%G %n' .env.production

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  config --quiet \
  && echo "Docker Compose válido"
```

`.env.production` debe seguir mostrando permisos `600 root:root`.

## 4. Reconstruir exclusivamente la API

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  build --no-cache api

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  up -d \
  --no-deps \
  --force-recreate \
  api

sleep 20
```

No se recrea PostgreSQL y no se toca Yieldsoft, Caddy ni Itinera v1.

## 5. Verificar backend

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  ps

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  logs --tail=200 api

curl -fsS \
  https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/live

echo

curl -fsS \
  https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/ready
```

El endpoint `live` debe indicar la versión `2.1.0`.

## 6. Actualizar GitHub y Netlify

En GitHub, abrir el repositorio de Itinera y seleccionar:

1. **Add file**.
2. **Upload files**.
3. Arrastrar el contenido de la carpeta `itinera-v2.1.0`, no la carpeta contenedora.
4. Confirmar el commit con el mensaje `v2.1.0: interfaz española, calendario adaptable e impresión A4`.

Netlify detectará el commit y desplegará automáticamente el frontend mediante `netlify.toml`.

## 7. Verificación funcional

- Abrir la URL de Netlify y forzar recarga con `Ctrl + F5`.
- Confirmar que toda la interfaz aparece en castellano.
- Abrir un itinerario de diez días y verificar que no existe scroll horizontal.
- Probar resoluciones de escritorio y móvil.
- Pulsar **Imprimir itinerario**.
- Confirmar A4 apaisado, colores de fondo activados y que solo aparece el itinerario.
- Verificar inicio de sesión, edición, enlace compartido y panel de administración.
