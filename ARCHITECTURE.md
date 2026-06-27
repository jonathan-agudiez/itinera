# Arquitectura de Itinera 2.7.6

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

En `/dashboard`, el frontend presenta esta acción como un botón circular con el icono `eye-off` cuando `itinerary.ownerId !== authenticatedUser.id`. El texto visible se omite para conservar una interfaz limpia, pero permanecen `aria-label` y `title` para accesibilidad y ayuda contextual.

El endpoint exige acceso previo al itinerario y rechaza al propietario. Cuando el propietario vuelve a añadir explícitamente al colaborador, la preferencia de ocultación se elimina y el viaje reaparece en su portfolio.

## Propiedad y eliminación

La eliminación permanente se autoriza comparando `itineraries.owner_id` con el usuario autenticado. El rol de administrador no sustituye la propiedad para esta operación.

Las copias siguen el mismo modelo: el usuario que copia recibe un itinerario con UUID nuevo y se convierte en su propietario.

## Impresión A4

La hoja A4 apaisada mantiene la composición de v2.7.1, con estos ajustes exclusivos de impresión:

1. Cabecera editorial sin logotipo ni nombre de marca.
2. Tabla completa con borde exterior negro sólido.
3. Todos los textos de cabecera, días y planes en negro sólido y opacidad completa.
4. Tipografía aumentada proporcionalmente en modos relajado, medio y denso.
5. Sombras y filtros desactivados en impresión para reducir tramas y artefactos de semitono.
6. Fondos y colores pastel de las tarjetas conservados mediante `print-color-adjust: exact`.

El texto se mantiene vectorial al guardar como PDF. La resolución física final depende del controlador y de la impresora, no de una propiedad CSS.
