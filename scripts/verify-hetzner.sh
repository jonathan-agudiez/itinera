#!/usr/bin/env sh
set -eu

COMPOSE="docker compose --env-file .env.production -f docker-compose.hetzner.yml"

$COMPOSE ps
$COMPOSE exec -T api node -e "fetch('http://127.0.0.1:4000/api/v1/health/live').then(async r=>{console.log(await r.text()); if(!r.ok)process.exit(1)})"
$COMPOSE exec -T api node -e "fetch('http://127.0.0.1:4000/api/v1/health/ready').then(async r=>{console.log(await r.text()); if(!r.ok)process.exit(1)})"
