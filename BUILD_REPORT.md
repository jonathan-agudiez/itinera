# Informe de build — Itinera v2.7.5

Verificación realizada sobre la release completa:

- Frontend: `npm ci`, `npm run typecheck` y `npm run build` correctos.
- Backend: `npm ci`, `npm run typecheck` y `npm run build` correctos.
- Pruebas backend: 12/12 superadas.
- Auditoría de dependencias de producción frontend: 0 vulnerabilidades.
- Auditoría de dependencias de producción backend: 0 vulnerabilidades.

Cambios funcionales verificados:

- `/dashboard`: la acción para quitar un itinerario ajeno se muestra solo como icono, conservando `aria-label` y `title`.
- `@media print`: texto negro sólido, borde exterior negro, tipografía proporcionalmente mayor y sombras desactivadas para evitar tramas de semitono.
