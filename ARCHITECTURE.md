# Arquitectura de Itinera 2.6.0

## Copia de itinerarios

El backend ofrece dos operaciones autenticadas:

- `POST /api/v1/itineraries/:id/copy`
- `POST /api/v1/itineraries/shared/:token/copy`

La primera exige acceso al itinerario como propietario, administrador o colaborador. La segunda exige que el enlace público siga habilitado.

La copia se realiza dentro de una transacción PostgreSQL:

1. Se lee el conjunto ordenado de planes del original.
2. Se crea un nuevo itinerario cuyo propietario es el usuario autenticado.
3. Se insertan copias nuevas de todos los planes.
4. No se copian colaboradores ni sesiones.
5. Se genera un token de compartición independiente y se deja desactivado el acceso público.

Los identificadores del itinerario y de cada plan son nuevos, por lo que las ediciones posteriores quedan totalmente aisladas del original.

## Notificaciones administrativas

`notifyAdmin()` utiliza `ADMIN_EMAIL` como destinatario y delega la entrega en `sendMail()`.

- Con `RESEND_API_KEY`: se realiza la entrega mediante la API de Resend.
- Sin `RESEND_API_KEY`: el contenido se registra en logs para desarrollo y diagnóstico.
- Los errores del proveedor se capturan y registran; no revierten registros ni copias ya completados.
- Los valores introducidos por usuarios se escapan antes de incorporarse al HTML del correo.

## Frontend

La vista privada muestra una acción de copia en la barra del itinerario. La vista pública muestra la misma acción; si no existe sesión, redirige a `/login` y conserva la URL compartida como destino de retorno.

## Colaboradores

El formulario captura la referencia al elemento HTML antes del primer `await`. Esto evita que el evento sintético pierda `currentTarget` durante la petición y permite limpiar el formulario tras guardar el permiso.
