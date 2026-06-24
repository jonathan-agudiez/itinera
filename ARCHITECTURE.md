# Arquitectura de Itinera 2.5.2

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
- Móvil: una fecha por pantalla con navegación anterior, siguiente y selector directo.
- Impresión: todas las fechas en columnas compactas dentro de un A4 apaisado.

Los planes siempre se ordenan por hora de inicio y `sort_order`.

## Sistema visual 2.5.2

La interfaz se apoya en un conjunto único de tokens CSS inspirado en los patrones actuales de iOS:

- Materiales translúcidos reservados para navegación, toolbars, overlays y superficies elevadas.
- Contenido legible sobre superficies con contraste controlado.
- Radios concéntricos y controles circulares o en cápsula.
- Barra flotante superior en escritorio y navegación flotante inferior en móvil.
- Hojas inferiores para formularios móviles y diálogos centrados en escritorio.
- Tipografía del sistema con jerarquía clara y espaciado compacto.
- Modo oscuro mediante `prefers-color-scheme`.
- Compatibilidad con reducción de movimiento y reducción de transparencia.
- Fallback opaco cuando el navegador no admite `backdrop-filter`.

Las acciones iconográficas conservan `aria-label` y `title`. Las tarjetas de plan no introducen iconos decorativos. Su jerarquía se construye únicamente con hora, título, ubicación, descripción, peso tipográfico y una guía cromática lateral discreta.

La impresión reutiliza la misma estructura visual del planning y aplica tres niveles de densidad en función del número máximo de planes por día: relajado, medio y denso. El resto de la aplicación se oculta al imprimir.

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

La versión 2.5.2 no añade ninguna migración. `0002_entry_colors.sql` continúa formando parte del historial para instalaciones limpias.

## Aislamiento del despliegue

Producción utiliza el proyecto Compose `itinera_v2`, el volumen `itinera_v2_postgres_data` y el alias de gateway `itinera-v2-api`. No sustituye los contenedores de Itinera v1 ni de Yieldsoft.


## Decisiones visuales de v2.5.2

- Se elimina cualquier adaptación automática a modo oscuro y se declara `color-scheme: light`.
- Las tarjetas de planes mantienen su paleta y borde, pero usan mayor altura y una escala tipográfica más contrastada.
- En móvil se conserva una fecha por pantalla y se incrementa la legibilidad de hora, título y descripción.
- La descripción es obligatoria en la validación del cliente y de la API.
