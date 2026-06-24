# Despliegue de v2.5.0

Esta actualización conserva `.env.production`, usuarios, contraseñas, itinerarios, planes y el volumen PostgreSQL. No incorpora una migración nueva.

## 1. Subida desde PowerShell

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.5.0.zip" `
  root@178.104.205.43:/root/
```

Entrar al servidor:

```powershell
ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Verificación del paquete

```bash
ls -lh /root/itinera-v2.5.0.zip
sha256sum /root/itinera-v2.5.0.zip
```

El valor debe coincidir con `itinera-v2.5.0.zip.sha256`.

## 3. Copia de seguridad de PostgreSQL

```bash
cd /opt/itinera-v2

mkdir -p /opt/backups/itinera-v2
BACKUP="/opt/backups/itinera-v2/pre-v2.5.0-$(date +%Y%m%d-%H%M%S).sql"

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$BACKUP"

ls -lh "$BACKUP"
```

## 4. Instalación de la release

```bash
rm -rf /opt/releases/itinera-v2.5.0
mkdir -p /opt/releases/itinera-v2.5.0

unzip -q \
  /root/itinera-v2.5.0.zip \
  -d /opt/releases/itinera-v2.5.0

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.5.0/ \
  /opt/itinera-v2/

cd /opt/itinera-v2
chmod 600 .env.production

cat VERSION.txt
stat -c '%a %U:%G %n' .env.production
```

Valores esperados:

```text
2.5.0
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

El endpoint `live` debe indicar `"version":"2.5.0"`; `ready`, Itinera v1 y Yieldsoft deben responder correctamente.

## 8. Actualización de GitHub y Netlify

1. Descomprimir `itinera-v2.5.0.zip` en Windows.
2. Abrir el repositorio de Itinera en GitHub.
3. Seleccionar **Add file → Upload files**.
4. Entrar en la carpeta extraída y arrastrar todo su contenido, no la carpeta contenedora.
5. Confirmar que `frontend/`, `backend/`, `netlify.toml` y `VERSION.txt` quedan en la raíz.
6. Usar el mensaje:

```text
v2.5.0: rediseño visual inspirado en iOS
```

Netlify desplegará el frontend automáticamente. No es necesario modificar Caddy, la URL pública ni CORS.

## 9. Comprobación funcional

- Recargar Netlify con `Ctrl + F5`.
- Comprobar la barra flotante en escritorio.
- Comprobar la barra inferior en móvil.
- Abrir creación, edición, colaboradores y configuración para revisar las hojas inferiores.
- Comprobar modo claro y oscuro.
- Revisar el calendario en escritorio y la vista diaria móvil.
- Imprimir en A4 apaisado con gráficos de fondo y encabezados/pies desactivados.
