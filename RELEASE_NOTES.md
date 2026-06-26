# Itinera v2.6.0

## Corregido

- El formulario de colaboradores ya no intenta usar `event.currentTarget` después de una operación asíncrona. Se conserva la referencia al formulario antes del `await`, por lo que `reset()` funciona correctamente.

## Añadido

- Copia independiente de itinerarios desde la vista privada.
- Copia independiente desde enlaces públicos compartidos.
- Redirección al inicio de sesión cuando una persona no autenticada intenta copiar un itinerario público.
- Copia transaccional de todos los planes, manteniendo fechas, horas, descripciones, ubicaciones, categorías, colores y orden.
- Auditoría `ITINERARY_COPIED` con origen, propietario original y número de planes copiados.
- Aviso al administrador después de un nuevo registro.
- Aviso al administrador después de una copia de itinerario.

## Comportamiento de las copias

- El usuario que copia se convierte en propietario de la nueva versión.
- Los colaboradores no se copian.
- El enlace público queda desactivado inicialmente.
- La nueva versión puede editarse sin afectar al itinerario original.
- El título recibe el sufijo `(copia)`.

## Base de datos

No hay migraciones nuevas ni cambios de esquema.
