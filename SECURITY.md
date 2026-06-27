# Seguridad de Itinera 2.7.5

- Contraseñas almacenadas con Argon2id.
- Sesiones opacas y tokens almacenados mediante hash SHA-256.
- Cookies `HttpOnly`, `Secure` y `SameSite` configurables.
- CORS restringido a orígenes autorizados.
- Cabeceras de seguridad mediante Helmet.
- Limitación de peticiones en autenticación y API.
- Validación de entradas con Zod.
- Consultas parametrizadas mediante Drizzle ORM.
- Eliminación permanente limitada al propietario real del itinerario.
- Ocultar un viaje compartido solo crea una preferencia personal; nunca elimina el original.
- El frontend decide mostrar la acción de ocultación comparando el propietario real con el usuario autenticado.
- La configuración sensible permanece fuera del repositorio en `.env.production` con permisos `600`.
