# Arquitectura de Itinera 2.5.4

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

`frontend/` es una SPA estática sin secretos de base de datos. `backend/` controla autenticación, permisos, validación, auditoría y persistencia.

## Modelo de itinerario

PostgreSQL conserva `start_date` y `end_date`. La interfaz solicita `startDate` y `dayCount`; la API calcula la fecha final y valida una duración inclusiva de entre 1 y 10 días.

La edición de duración es segura: antes de acortar o desplazar el intervalo, el backend comprueba si existen planes fuera de las nuevas fechas. Si los hay, devuelve un conflicto y no modifica el itinerario.

El mismo conjunto de planes alimenta tres presentaciones:

- Escritorio: una columna por fecha, sin filas horarias y sin scroll horizontal.
- Móvil: una fecha por pantalla, navegación de fechas y barra principal flotante inferior.
- A4/PDF: todas las fechas dentro de la misma tabla, con densidad exclusiva de impresión.

Los planes siempre se ordenan por hora de inicio y `sort_order`.

## Sistema visual 2.5.4

- Interfaz exclusivamente en modo claro mediante `color-scheme: light only`.
- Tipografía del sistema y superficies translúcidas inspiradas en la jerarquía visual de iOS.
- Barra superior en escritorio.
- Barra flotante fija inferior en móvil, sin marca duplicada y con soporte de áreas seguras.
- Hojas inferiores móviles con margen lateral, de modo que los formularios no contacten con los bordes de la pantalla.
- Tarjetas de plan sin iconografía decorativa; la jerarquía depende de hora, título, ubicación, descripción, escala y peso.
- Compatibilidad con reducción de movimiento y reducción de transparencia.
- Fallback opaco cuando el navegador no admite `backdrop-filter`.

La impresión conserva la estructura completa del planning. Las reglas de `@media print` reducen exclusivamente la altura, el espaciado y la tipografía de las tarjetas del PDF, sin alterar las vistas interactivas.

## Autenticación

El navegador recibe un token de sesión opaco en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`. PostgreSQL almacena únicamente su hash SHA-256. Las contraseñas se procesan mediante Argon2id y admiten desde 6 caracteres.

## Compartición y autorización

- `OWNER`: control completo.
- `WRITE`: lectura y CRUD de planes.
- `READ`: lectura registrada.
- `PUBLIC`: lectura mediante token.
- `ADMIN`: gestión global.

Cada ruta privada calcula el acceso en el servidor.

## Migraciones

La versión 2.5.4 no añade ninguna migración. `0002_entry_colors.sql` continúa formando parte del historial para instalaciones limpias.

## Aislamiento del despliegue

Producción utiliza el proyecto Compose `itinera_v2`, el volumen `itinera_v2_postgres_data` y el alias de gateway `itinera-v2-api`. No sustituye los contenedores de Itinera v1 ni de Yieldsoft.
