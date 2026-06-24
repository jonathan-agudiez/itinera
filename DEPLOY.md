# Despliegue de v2.3.0

Esta actualización conserva `.env.production`, usuarios, contraseñas, itinerarios y el volumen PostgreSQL. Incluye la migración aditiva `0002_entry_colors.sql`.

## 1. Subida desde PowerShell

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.3.0.zip" `
  root@178.104.205.43:/root/
```

Entrar al servidor:

```powershell
ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Verificación del paquete

```bash
ls -lh /root/itinera-v2.3.0.zip
sha256sum /root/itinera-v2.3.0.zip
```

El valor debe coincidir con el archivo `itinera-v2.3.0.zip.sha256` entregado junto al ZIP.

## 3. Copia de seguridad de PostgreSQL

```bash
cd /opt/itinera-v2

mkdir -p /opt/backups/itinera-v2
BACKUP="/opt/backups/itinera-v2/pre-v2.3.0-$(date +%Y%m%d-%H%M%S).sql"

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
rm -rf /opt/releases/itinera-v2.3.0
mkdir -p /opt/releases/itinera-v2.3.0

unzip -q \
  /root/itinera-v2.3.0.zip \
  -d /opt/releases/itinera-v2.3.0

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.3.0/ \
  /opt/itinera-v2/

cd /opt/itinera-v2
chmod 600 .env.production

cat VERSION.txt
ls -lh backend/migrations/0002_entry_colors.sql
stat -c '%a %U:%G %n' .env.production
```

Valores esperados:

```text
2.3.0
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

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  up -d \
  --no-deps \
  --force-recreate \
  api

sleep 25
```

PostgreSQL no se recrea. Al arrancar, la API aplica automáticamente `0002_entry_colors.sql`.

## 7. Verificación de migración y servicios

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
echo "=== MIGRACIÓN Y ARRANQUE ==="
docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  logs --tail=250 api \
  | grep -E 'Applied migration: 0002_entry_colors.sql|Itinera API started|Administrator verified'

echo
echo "=== LIVE ==="
curl -fsS \
  https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/live

echo
echo "=== READY ==="
curl -fsS \
  https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/ready

echo
echo "=== ITINERA V1 ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
  https://itinera-api.178-104-205-43.sslip.io/api/v1/health/live

echo
echo "=== YIELDSOFT ==="
curl -sS -o /dev/null -w "HTTP %{http_code}\n" \
  https://app.yieldsoft.net
```

El endpoint `live` debe indicar `"version":"2.3.0"`; `ready`, Itinera v1 y Yieldsoft deben responder correctamente.

## 8. Actualización de GitHub y Netlify

1. Descomprimir `itinera-v2.3.0.zip` en Windows.
2. Abrir el repositorio de Itinera en GitHub.
3. Seleccionar **Add file → Upload files**.
4. Entrar en la carpeta extraída y arrastrar todo su contenido, no la carpeta contenedora.
5. Confirmar que `frontend/`, `backend/`, `netlify.toml` y `VERSION.txt` quedan en la raíz.
6. Usar el mensaje:

```text
v2.3.0: agenda horaria, colores y overlays
```

Netlify desplegará el frontend automáticamente. No es necesario modificar Caddy, la URL pública o CORS.

## 9. Comprobación funcional

- Recargar Netlify con `Ctrl + F5`.
- Confirmar las filas desde 05:00 hasta 00:00.
- Añadir un plan desde una celda horaria y elegir uno de los doce colores.
- Editar el plan y comprobar que conserva el color.
- Abrir colaboradores y eliminación mediante sus iconos.
- Revisar la agenda desde móvil.
- Imprimir en A4 apaisado con gráficos de fondo y comprobar que todo aparece en una sola hoja.
