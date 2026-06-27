# Despliegue de Itinera v2.7.4

Esta versión hace visible en `/dashboard` la acción **Quitar de mis itinerarios** para viajes ajenos compartidos y restaura únicamente la vista A4/PDF al diseño de v2.7.1.

No incluye migraciones nuevas. Conserva la migración ya existente `0003_itinerary_hidden_by_users.sql`.

## 1. Subir el ZIP desde PowerShell

```powershell
Test-Path "C:\Users\Atoms\Downloads\itinera-v2.7.4.zip"
```

```powershell
Get-FileHash `
  "C:\Users\Atoms\Downloads\itinera-v2.7.4.zip" `
  -Algorithm SHA256
```

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.7.4.zip" `
  root@178.104.205.43:/root/
```

```powershell
ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Verificar el paquete en Hetzner

```bash
ls -lh /root/itinera-v2.7.4.zip
sha256sum /root/itinera-v2.7.4.zip
```

El hash debe coincidir con `itinera-v2.7.4.zip.sha256`.

## 3. Copia de seguridad de PostgreSQL

```bash
cd /opt/itinera-v2

mkdir -p /opt/backups/itinera-v2
BACKUP="/opt/backups/itinera-v2/pre-v2.7.4-$(date +%Y%m%d-%H%M%S).sql"

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$BACKUP"

ls -lh "$BACKUP"
```

## 4. Instalación protegida

```bash
set -e

test -f /root/itinera-v2.7.4.zip
test -f /opt/itinera-v2/.env.production

rm -rf /opt/releases/itinera-v2.7.4
mkdir -p /opt/releases/itinera-v2.7.4

unzip -q \
  /root/itinera-v2.7.4.zip \
  -d /opt/releases/itinera-v2.7.4

test -f /opt/releases/itinera-v2.7.4/VERSION.txt
test -f /opt/releases/itinera-v2.7.4/docker-compose.hetzner.yml
test -f /opt/releases/itinera-v2.7.4/backend/package.json
test -f /opt/releases/itinera-v2.7.4/backend/migrations/0003_itinerary_hidden_by_users.sql
test -f /opt/releases/itinera-v2.7.4/frontend/package.json
test "$(cat /opt/releases/itinera-v2.7.4/VERSION.txt)" = "2.7.4"

cp /opt/itinera-v2/.env.production /root/itinera-v2.env.production.v2.7.4
chmod 600 /root/itinera-v2.env.production.v2.7.4

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.7.4/ \
  /opt/itinera-v2/

cp /root/itinera-v2.env.production.v2.7.4 /opt/itinera-v2/.env.production
chmod 600 /opt/itinera-v2/.env.production

cd /opt/itinera-v2
cat VERSION.txt
stat -c '%a %U:%G %n' .env.production
```

Resultado esperado:

```text
2.7.4
600 root:root .env.production
```

## 5. Validar, construir y recrear la API

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  config --quiet \
  && echo "Docker Compose válido"

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

## 6. Verificar backend

```bash
curl -fsS https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/live
echo
curl -fsS https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/ready
```

`live` debe indicar `"version":"2.7.4"`.

## 7. Actualizar GitHub y Netlify

1. Descomprime `itinera-v2.7.4.zip` en Windows.
2. Abre el repositorio de Itinera en GitHub.
3. Selecciona **Add file → Upload files**.
4. Arrastra el contenido interior de la carpeta extraída.
5. Comprueba que `backend/`, `frontend/`, `netlify.toml` y `VERSION.txt` quedan en la raíz.
6. Usa el mensaje:

```text
v2.7.4: botón visible en dashboard y A4 restaurado
```

Netlify desplegará el frontend automáticamente.

## 8. Pruebas funcionales

### Botón en dashboard

1. Entra con un usuario colaborador.
2. Abre `/dashboard`.
3. En la tarjeta de un itinerario cuyo propietario sea otro usuario debe aparecer **Quitar de mis itinerarios**.
4. Confirma la acción y verifica que desaparece solo de ese portfolio.
5. Comprueba con el propietario que el original sigue intacto.

### PDF A4

1. Abre un itinerario y pulsa imprimir.
2. Confirma que la composición coincide con v2.7.1: fondo neutro, cabecera sin marca y tarjetas pastel discretas.
3. Activa **Gráficos de fondo** al guardar como PDF.
