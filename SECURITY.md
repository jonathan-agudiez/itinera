# Notas de seguridad

## Controles implementados

- Hash de contraseñas mediante Argon2id.
- Sesiones opacas; los tokens sin procesar no se persisten.
- Cookies `HttpOnly`, `Secure` y `SameSite=Lax` en producción.
- Lista permitida de CORS y comprobación de origen en operaciones mutables.
- Límites globales y específicos para autenticación.
- Cabeceras Helmet y Caddy.
- Tokens de recuperación de un solo uso, con caducidad y almacenados como hash.
- Revocación de sesiones tras cambio o recuperación de contraseña.
- Permisos comprobados en el servidor.
- Bloqueo optimista en la edición colaborativa.
- Auditoría de acciones relevantes.
- PostgreSQL no publica su puerto en producción.
- Los colores de planes se limitan a doce tokens validados.

## Política de contraseñas de esta instalación

A petición del propietario, registro, cambio y recuperación aceptan claves desde 6 caracteres, por lo que un PIN numérico de 6 cifras es válido. Esta política es adecuada únicamente para el uso privado previsto y ofrece menos resistencia frente a intentos de adivinación que una contraseña larga.

Argon2id, los límites de frecuencia y la protección de sesiones permanecen activos. Para una exposición pública amplia se recomienda recuperar una longitud mínima superior.

## Secretos

No se debe subir `.env.production`. El repositorio contiene únicamente `.env.production.example`.
