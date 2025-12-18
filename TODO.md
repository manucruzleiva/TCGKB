# TODO - TCG Knowledge Base

## En Progreso / Urgente

### Deployment en Vercel
- [x] Deploy inicial a Vercel
- [x] Configurar variables de entorno (MONGODB_URI, JWT_SECRET, etc.)
- [x] Whitelist IPs de MongoDB Atlas (0.0.0.0/0)
- [x] Fix SPA routing (vercel.json rewrites)
- [x] Fix rate limiter para serverless (aumentado a 100 req/15min)
- [x] Login funcionando en producción
- [x] Registro funcionando en producción
  - Problema: JWT_EXPIRES_IN tenía valor inválido en Vercel
  - Fix: Código más robusto + actualizar env var a "7d"

## Mejoras Pendientes

### Funcionalidad
- [ ] Extreme caching with sync routines
- [ ] Add PokeAPI sprites
- [ ] Add a reliable Riftbound API source of data
- [ ] Mejores mensajes de error en login (especificar si el correo no está registrado, si falla por error interno o por credenciales incorrectas)

### UI/UX
- [ ] Remover totalmente "tabla de tipos" - no es lo que se solicitó
- [ ] RELATIONSHIP MAP en hamburger menu:
  - Canvas con zoom in/out
  - Mostrar cartas que tengan comentarios
  - Si un comentario tiene @ referenciando carta/habilidad/ataque, mostrar flecha de conexión
- [ ] Agregar "GLC" a format tags

### DevOps
- [ ] Configurar deploy de Vercel basado en repo de GitHub
  - Así los deployments se trackean con cambios en el repo
  - Puede requerir eliminar y recrear proyecto en Vercel
- [ ] Cambiar nombre "Bug Report Dashboard" por "Dev Dashboard":
  - Ver bugs reportados
  - Estado de salud de APIs internas
  - Current deploy (commit de GitHub de la versión en producción)

## Completado Esta Sesión
- Fix API URL para producción (runtime detection en lugar de build-time)
- Fix rate limiter blocking login en serverless
- Configuración completa de Vercel con variables de entorno
- SPA routing funcionando
- Fix JWT_EXPIRES_IN inválido que bloqueaba registro
- Trust proxy configurado para rate limiter en Vercel
- Removed duplicate Mongoose indexes (email, username)

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
