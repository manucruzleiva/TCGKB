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
- [x] Configurar deploy basado en GitHub (auto-deploy en push a main)
- [x] integracion de dominio tcgkb.app from namecheap

## Mejoras Pendientes

### Funcionalidad
- [ ] Extreme caching with sync routines
- [x] Add PokeAPI sprites (chips de mención @ muestran sprite del Pokémon)
- [ ] Add a reliable Riftbound API source of data

### UI/UX
- [ ] RELATIONSHIP MAP en hamburger menu:
  - Canvas con zoom in/out
  - Mostrar cartas que tengan comentarios
  - Si un comentario tiene @ referenciando carta/habilidad/ataque, mostrar flecha de conexión

## Completado Esta Sesión
- Integración de dominio tcgkb.app con Namecheap + Vercel
- PokeAPI sprites en chips de mención @ (servicio + componente PokemonSprite)
- Fix endpoint /api/bugs en api/index.js (era /api/bug-reports)

## Completado Sesiones Anteriores
- Fix API URL para producción (runtime detection en lugar de build-time)
- Fix rate limiter blocking login en serverless
- Configuración completa de Vercel con variables de entorno
- SPA routing funcionando
- Fix JWT_EXPIRES_IN inválido que bloqueaba registro
- Trust proxy configurado para rate limiter en Vercel
- Removed duplicate Mongoose indexes (email, username)
- Configurar deploy de Vercel basado en repo de GitHub
- Agregar "GLC" a format tags (backend + frontend)
- Remover "Tabla de Tipos" (TypeChart page)
- Mejores mensajes de error en login (códigos específicos + bilingüe)
- Renombrar "Bug Reports" a "Dev Dashboard" con health monitoring

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
- Dev Dashboard ahora incluye monitoreo de salud de API y Database
