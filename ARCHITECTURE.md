# Arquitectura de Itinera 2.7.4

## Portfolio personal y ocultación

La relación `itinerary_hidden_by_users` almacena preferencias personales de visibilidad:

- clave primaria compuesta por `itinerary_id` y `user_id`;
- borrado en cascada si desaparece el usuario o el itinerario;
- no modifica el itinerario, sus planes, el propietario ni los permisos;
- `GET /api/v1/itineraries` filtra únicamente los itinerarios compartidos que el usuario haya ocultado.

La operación se expone mediante:

```text
POST /api/v1/itineraries/:id/hide
```

En `/dashboard`, el frontend muestra el botón **Quitar de mis itinerarios** cuando `itinerary.ownerId !== authenticatedUser.id`. Esta regla representa directamente la propiedad real y evita depender del texto o estado visual de los permisos.

El endpoint exige acceso previo al itinerario y rechaza al propietario. El propietario conserva dos opciones: mantener el itinerario o eliminarlo definitivamente.

Cuando el propietario vuelve a añadir explícitamente a un colaborador, la preferencia de ocultación se elimina y el viaje reaparece en su portfolio.

## Propiedad y eliminación

La eliminación permanente se autoriza comparando `itineraries.owner_id` con el usuario autenticado. El rol de administrador no sustituye la propiedad para esta operación.

Las copias siguen el mismo modelo: el usuario que copia recibe un itinerario con UUID nuevo y se convierte en su propietario.

## Impresión A4

La hoja A4 apaisada conserva el diseño de v2.7.1:

1. Cabecera editorial de 22 mm, sin logotipo ni nombre de marca.
2. Fondo neutro y limpio.
3. Tabla de días en columnas iguales con alternancia muy sutil.
4. Tarjetas pastel coherentes con los colores de los planes.
5. Tipografía y densidad adaptativas según el máximo de planes por día.

Todo el diseño se aplica dentro de `@media print`, sin afectar a escritorio ni móvil.
