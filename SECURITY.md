# Seguridad de Itinera 2.6.0

## Copias

- Solo un usuario autenticado puede crear una copia.
- Las copias privadas requieren que el usuario ya tenga acceso al original.
- Las copias públicas requieren un token válido y un enlace habilitado.
- La operación se ejecuta en una transacción para evitar copias parciales.
- Los colaboradores y permisos del original nunca se heredan.
- La nueva copia nace con el enlace público desactivado.
- Cada copia recibe identificadores y token de compartición nuevos.

## Notificaciones

- Los datos de usuario se escapan antes de introducirlos en HTML.
- La clave de Resend solo se almacena en `.env.production`.
- Los fallos del proveedor no exponen secretos en la respuesta HTTP ni bloquean la operación principal.
- `MAIL_FROM` debe utilizar un remitente verificado.

## Estado de dependencias

Las auditorías completas y de producción de frontend y backend no detectaron vulnerabilidades en esta release.
