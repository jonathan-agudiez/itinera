# Itinera v2.5.0

Actualización visual completa que sustituye el diseño editorial anterior por una interfaz inspirada en el lenguaje actual de iOS y Liquid Glass.

## Incluido

- Fondo ambiental con profundidad y color suave.
- Barra de navegación flotante translúcida en escritorio.
- Barra inferior flotante en móvil con soporte para zonas seguras.
- Material de cristal aplicado con moderación a navegación, overlays y superficies elevadas.
- Botones en cápsula, controles circulares y estados de pulsación más naturales.
- Formularios con agrupación visual de estilo nativo.
- Modales convertidos en hojas inferiores en móvil.
- Calendario, tarjetas de plan y selector diario rediseñados.
- Tarjetas de viajes y panel de administración adaptados al mismo sistema.
- Modo oscuro automático.
- Respeto por reducción de movimiento y reducción de transparencia.
- Fallback para navegadores sin desenfoque de fondo.
- Impresión A4 sin cristal, navegación ni fondos ambientales.
- Eliminación de CSS visual heredado y duplicado.

## Compatibilidad

- No hay migraciones nuevas.
- Se conserva `0002_entry_colors.sql` para instalaciones limpias y despliegues aún no migrados.
- No es necesario cambiar Caddy, Netlify, la URL pública ni CORS.
- Los datos y credenciales existentes se conservan.
