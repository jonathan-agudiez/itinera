# Itinera v2.3.0

Actualización centrada en convertir el itinerario en una agenda horaria compacta y visual.

## Incluido

- Veinte filas horarias: 05:00, 06:00 y sucesivas hasta 23:00, terminando en 00:00.
- Días como columnas adaptadas al ancho disponible, sin scroll horizontal.
- Línea temporal móvil con un día por pantalla.
- Creación rápida desde cualquier celda horaria.
- Colaboración y zona de peligro trasladadas a overlays accesibles desde iconos.
- Botones principales compactos con iconografía de trazo tipo Lucide.
- Paleta de doce colores para cada plan.
- Persistencia del color mediante una nueva migración PostgreSQL.
- Contraseñas desde 6 caracteres; se admiten PIN numéricos de 6 cifras.
- Impresión completa en un único A4 apaisado, con todas las filas y columnas.

## Compatibilidad

- La base de datos existente se conserva.
- La migración `0002_entry_colors.sql` asigna `sage` a los planes anteriores.
- No hay que cambiar Caddy, Netlify, la URL pública ni CORS.
