# Despliegue completo de Itinera v2.7.6

Release completa para Hetzner y GitHub/Netlify. No incorpora migraciones nuevas; conserva `0003_itinerary_hidden_by_users.sql`.

## 1. PowerShell en Windows

```powershell
Test-Path "C:\Users\Atoms\Downloads\itinera-v2.7.6.zip"
```

```powershell
Get-FileHash `
  "C:\Users\Atoms\Downloads\itinera-v2.7.6.zip" `
  -Algorithm SHA256
```

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.7.6.zip" `
  root@178.104.205.43:/root/
```

```powershell
ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  root@178.104.205.43
```

## 2. Verificar el ZIP en Hetzner

```bash
ls -lh /root/itinera-v2.7.6.zip
sha256sum /root/itinera-v2.7.6.zip
```

El hash debe coincidir con `itinera-v2.7.6.zip.sha256`.

## 3. Copia de seguridad de PostgreSQL

```bash
cd /opt/itinera-v2
mkdir -p /opt/backups/itinera-v2
BACKUP="/opt/backups/itinera-v2/pre-v2.7.6-$(date +%Y%m%d-%H%M%S).sql"

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  exec -T postgres \
  sh -lc 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$BACKUP"

ls -lh "$BACKUP"
test -s "$BACKUP" && echo "Backup correcto"
```

## 4. Instalar la release protegida

```bash
set -e

test -f /root/itinera-v2.7.6.zip
test -f /opt/itinera-v2/.env.production

rm -rf /opt/releases/itinera-v2.7.6
mkdir -p /opt/releases/itinera-v2.7.6

unzip -q \
  /root/itinera-v2.7.6.zip \
  -d /opt/releases/itinera-v2.7.6

test -f /opt/releases/itinera-v2.7.6/VERSION.txt
test -f /opt/releases/itinera-v2.7.6/docker-compose.hetzner.yml
test -f /opt/releases/itinera-v2.7.6/backend/package.json
test -f /opt/releases/itinera-v2.7.6/backend/migrations/0003_itinerary_hidden_by_users.sql
test -f /opt/releases/itinera-v2.7.6/frontend/package.json
test "$(cat /opt/releases/itinera-v2.7.6/VERSION.txt)" = "2.7.6"

cp /opt/itinera-v2/.env.production /root/itinera-v2.env.production.v2.7.6
chmod 600 /root/itinera-v2.env.production.v2.7.6

rsync -a --delete \
  --exclude='.env.production' \
  --exclude='.env.production.backup-*' \
  /opt/releases/itinera-v2.7.6/ \
  /opt/itinera-v2/

cp /root/itinera-v2.env.production.v2.7.6 /opt/itinera-v2/.env.production
chmod 600 /opt/itinera-v2/.env.production

cd /opt/itinera-v2
cat VERSION.txt
stat -c '%a %U:%G %n' .env.production
```

Resultado esperado:

```text
2.7.6
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

## 6. Verificar backend y correo

```bash
cd /opt/itinera-v2

docker compose \
  --env-file .env.production \
  -f docker-compose.hetzner.yml \
  ps

curl -fsS https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/live
echo
curl -fsS https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/ready
echo

docker exec itinera_v2-api-1 sh -lc '
if [ -n "$RESEND_API_KEY" ]; then
  echo "RESEND_API_KEY=<CONFIGURADA>"
else
  echo "RESEND_API_KEY=<VACÍA>"
fi
'
```

`live` debe indicar `"version":"2.7.6"` y `ready` debe indicar `"database":"up"`.

## 7. GitHub y Netlify

1. Descomprime `itinera-v2.7.6.zip` en Windows.
2. Abre la raíz del repositorio de Itinera en GitHub.
3. Pulsa **Add file → Upload files**.
4. Arrastra el contenido interior de la carpeta extraída.
5. Comprueba que `backend/`, `frontend/`, `netlify.toml` y `VERSION.txt` quedan en la raíz.
6. Usa el mensaje:

```text
v2.7.6: icono de ocultar y contraste A4 de impresión
```

7. Espera a que Netlify muestre el despliegue como **Published**.
8. Recarga `https://poca-broma.netlify.app` con `Ctrl + F5`.

## 8. Comprobaciones funcionales

- En `/dashboard`, los itinerarios ajenos muestran únicamente el icono para quitarlos de la vista personal.
- La acción conserva su tooltip y etiqueta accesible.
- En impresión A4, las horas, descripciones y demás textos se ven negros.
- El borde exterior de la tabla es negro y no presenta sombra.
- La tipografía es mayor en todos los niveles de densidad de impresión.
- Activa **Gráficos de fondo** en el diálogo de impresión para conservar las tarjetas pastel.
