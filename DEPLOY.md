# Deployment of Itinera v2.0.0

This release is deliberately deployed beside v1. It uses a new compose project, a new PostgreSQL volume and a new Caddy hostname. Do not stop or delete v1 until v2 has passed functional testing.

## 1. Upload from PowerShell

```powershell
scp -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 `
  "C:\Users\Atoms\Downloads\itinera-v2.0.0.zip" `
  root@178.104.205.43:/root/

ssh -i C:\Users\Atoms\.ssh\yieldsoft_hetzner_ed25519 root@178.104.205.43
```

## 2. Install the release

```bash
rm -rf /opt/releases/itinera-v2.0.0
mkdir -p /opt/releases/itinera-v2.0.0
unzip -q /root/itinera-v2.0.0.zip -d /opt/releases/itinera-v2.0.0

mkdir -p /opt/itinera-v2
rsync -a --delete \
  --exclude='.env.production' \
  /opt/releases/itinera-v2.0.0/ \
  /opt/itinera-v2/

cd /opt/itinera-v2
cat VERSION.txt
```

Expected: `2.0.0`.

## 3. Create secrets

```bash
cd /opt/itinera-v2
umask 077

POSTGRES_PASSWORD="$(openssl rand -hex 32)"
ADMIN_PASSWORD="$(openssl rand -base64 24 | tr -d '\n')"

cat > .env.production <<EOF_ENV
NODE_ENV=production
PORT=4000
APP_NAME=Itinera
PUBLIC_APP_URL=https://YOUR-NETLIFY-SITE.netlify.app
CORS_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app
COOKIE_SECURE=true
COOKIE_DOMAIN=
SESSION_TTL_DAYS=30
POSTGRES_DB=itinera_v2
POSTGRES_USER=itinera_v2
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
DATABASE_URL=postgresql://itinera_v2:${POSTGRES_PASSWORD}@postgres:5432/itinera_v2
ADMIN_EMAIL=jonathan.agudiez@gmail.com
ADMIN_PASSWORD=${ADMIN_PASSWORD}
ADMIN_DISPLAY_NAME=Jonathan
RESEND_API_KEY=
MAIL_FROM=Itinera <no-reply@example.com>
EOF_ENV

chmod 600 .env.production
printf 'Email: %s\nPassword: %s\n' 'jonathan.agudiez@gmail.com' "$ADMIN_PASSWORD" > /root/itinera-v2-admin-credentials.txt
chmod 600 /root/itinera-v2-admin-credentials.txt
unset POSTGRES_PASSWORD ADMIN_PASSWORD
```

Replace the Netlify URL after the first frontend deployment, then recreate the API.

## 4. Validate and build

```bash
cd /opt/itinera-v2

docker compose --env-file .env.production -f docker-compose.hetzner.yml config --quiet

docker compose --env-file .env.production -f docker-compose.hetzner.yml pull postgres

docker compose --env-file .env.production -f docker-compose.hetzner.yml build --no-cache api

docker compose --env-file .env.production -f docker-compose.hetzner.yml up -d postgres api
```

## 5. Verify the isolated API

```bash
cd /opt/itinera-v2
sleep 20

docker compose --env-file .env.production -f docker-compose.hetzner.yml ps
docker compose --env-file .env.production -f docker-compose.hetzner.yml logs --tail=200 api
sh scripts/verify-hetzner.sh

docker exec yieldsoft-gateway-1 \
  wget -qO- http://itinera-v2-api:4000/api/v1/health/live
```

## 6. Add the v2 Caddy hostname

Back up `/opt/yieldsoft/deploy/gateway/Caddyfile`, append `deploy/caddy/itinera-v2-api.Caddyfile`, validate it and rebuild only the gateway.

```bash
cd /opt/yieldsoft
cp deploy/gateway/Caddyfile "deploy/gateway/Caddyfile.backup-$(date +%Y%m%d-%H%M%S)"

cat /opt/itinera-v2/deploy/caddy/itinera-v2-api.Caddyfile >> deploy/gateway/Caddyfile

docker run --rm \
  -v /opt/yieldsoft/deploy/gateway/Caddyfile:/etc/caddy/Caddyfile:ro \
  caddy:2.8-alpine \
  caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

docker compose --env-file .env.production -f docker-compose.prod.yml build gateway
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --no-deps gateway
```

Then verify:

```bash
curl -fsS https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/live
curl -fsS https://itinera-v2-api.178-104-205-43.sslip.io/api/v1/health/ready
curl -sS -o /dev/null -w 'Yieldsoft HTTP %{http_code}\n' https://app.yieldsoft.net
```

## 7. GitHub and Netlify

Push the clean repository to GitHub. In Netlify, import the repository; `netlify.toml` sets `frontend` as the base directory, runs `npm ci && npm run build`, publishes `frontend/dist`, proxies `/api/*` to the v2 API and configures SPA fallback.

After Netlify assigns the final URL, edit `/opt/itinera-v2/.env.production`:

```dotenv
PUBLIC_APP_URL=https://YOUR-SITE.netlify.app
CORS_ORIGINS=https://YOUR-SITE.netlify.app
```

Recreate only v2 API:

```bash
cd /opt/itinera-v2
docker compose --env-file .env.production -f docker-compose.hetzner.yml up -d --no-deps --force-recreate api
```

## 8. Final checks

Register a normal user, create and edit an itinerary, double-click a day and activity, rotate and open the public link, add a read collaborator and a write collaborator, change a password, test the administrator panel and verify account deletion in a disposable account.

Only after these tests should v1 be considered for decommissioning.
