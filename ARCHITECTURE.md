# Arquitectura de Itinera 2.3.0

## Topología de producción

```text
Navegador
  │
  ├── aplicación estática ── Netlify / React + Vite
  │
  └── /api/* ─────────────── HTTPS / Caddy en Hetzner
                                  │
                                  └── itinera-v2-api:4000 / Fastify
                                            │
                                            └── PostgreSQL 17 privado
```

## Separación de responsabilidades

`frontend/` es una SPA estática sin secretos de base de datos. `backend/` controla autenticación, permisos, validación, transacciones, auditoría y persistencia.

## Modelo de agenda

El mismo conjunto de planes alimenta tres presentaciones:

- Escritorio: matriz con una columna por día y veinte filas horarias, de 05:00 a 00:00.
- Móvil: un solo día por pantalla con una línea temporal vertical y las mismas veinte franjas.
- Impresión: matriz completa compactada en A4 apaisado y limitada a una sola página.

Los planes se agrupan por la hora de inicio. Las horas entre 01:00 y 04:59 se muestran en la fila final de 00:00 para evitar que un plan existente quede oculto.

## Colores de planes

Cada plan guarda un token de color validado dentro de una paleta cerrada de doce valores. El frontend traduce ese token a fondo, borde y acento visual. No se aceptan colores arbitrarios enviados por el cliente.

## Autenticación

El navegador recibe un token de sesión opaco en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`. PostgreSQL almacena únicamente su hash SHA-256. Las contraseñas continúan procesándose mediante Argon2id.

La política de uso privado permite contraseñas desde 6 caracteres. La reducción de complejidad no modifica el hash Argon2id, los límites de frecuencia ni la revocación de sesiones.

## Compartición y autorización

- `OWNER`: control completo.
- `WRITE`: lectura y CRUD de planes.
- `READ`: lectura registrada.
- `PUBLIC`: lectura mediante token.
- `ADMIN`: gestión global.

Cada ruta privada calcula el acceso en el servidor.

## Migraciones

`backend/src/db/migrate.ts` aplica en orden todos los SQL no registrados en `schema_migrations`. La versión 2.3.0 añade `0002_entry_colors.sql`, que crea `itinerary_entries.color` con valor inicial `sage`.

## Aislamiento del despliegue

Producción utiliza el proyecto Compose `itinera_v2`, la red privada propia, el volumen `itinera_v2_postgres_data` y el alias de gateway `itinera-v2-api`. No sustituye los contenedores de Itinera v1 ni de Yieldsoft.
