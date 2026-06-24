# Itinera v2.4.0

Actualización centrada en simplificar el itinerario y sustituir la estética recargada por una interfaz más sobria y editorial.

## Incluido

- Eliminación completa de la cuadrícula por horas.
- Columnas naturales por fecha, con planes ordenados por hora de inicio.
- Eliminación de «Día 1», «Día 2» y equivalentes en escritorio, móvil e impresión.
- Creación mediante fecha inicial y número de días.
- Duración editable entre 1 y 10 días.
- Protección de datos al acortar un itinerario con planes fuera del nuevo intervalo.
- Menú principal exclusivamente iconográfico con atributos accesibles y tooltip nativo.
- Tarjetas de plan sin icono de reloj, categoría, indicador de edición ni adornos innecesarios.
- Revisión visual de radios, sombras, espacios, tipografía y estados de interacción.
- Vista móvil diaria simplificada.
- Impresión compacta en un único A4 apaisado.

## Compatibilidad

- No hay migraciones nuevas.
- Se conserva `0002_entry_colors.sql` para instalaciones limpias y despliegues aún no migrados.
- El backend admite temporalmente el antiguo campo `endDate` para evitar fallos durante el despliegue escalonado.
- No es necesario cambiar Caddy, Netlify, la URL pública ni CORS.
