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
- [x] Extreme caching with sync routines
- [x] Add PokeAPI sprites (chips de mención @ muestran sprite del Pokémon)
- [x] Add a reliable Riftbound API source of data
- [ ] Import Deck - botón directo en Decks para importar decks de Riftbound o Pokemon

### Sistema de Avatares
- [ ] Búsqueda de Pokémon para avatar - permitir buscar todos los Pokémon en todas sus formas
- [ ] Elegir background del avatar (colores, patrones, etc.)
- [ ] Sprites de entrenadores como opción de avatar (investigar fuente de sprites)
- [ ] Sprites de backgrounds como opción (investigar disponibilidad)

### Autenticación / Usuario
- [ ] User data chips - reemplazar chip 'admin' por tags actuales (mod/dev/ambos)
- [ ] Change email - requiere input del email actual para mayor seguridad
- [ ] Login con username - permitir login con username además de correo
- [ ] Username único - validar que no existan duplicados al registrar o cambiar username

### Dev Dashboard
- [ ] Agregar health check de todos los endpoints API (verificar cada endpoint está saludable)
- [ ] Lista de reportes - filtrar por asignatario
- [ ] Lista de reportes - filtrar por estado
- [ ] Lista de reportes - sort oldest/newest
- [ ] SLA tracking:
  - Tiempo desde NEW → Processing
  - Tiempo desde Processing → Closed
  - Tracking completo del ciclo de vida del reporte

### UI/UX
- [ ] RELATIONSHIP MAP en hamburger menu:
  - Canvas con zoom in/out
  - Mostrar cartas que tengan comentarios
  - Si un comentario tiene @ referenciando carta/habilidad/ataque, mostrar flecha de conexión

### Sistema de Reputación
- [ ] **Obtención de puntos:**
  - Participar/generar conversaciones (comentarios)
  - Usar sistema @ en comentarios (menciones)
  - Recibir reacciones positivas en comentarios
  - Reaccionar a cartas, ataques, habilidades, comentarios
  - Reportar bug que pasa a procesamiento (+puntos)
  - Bug desestimado (-puntos, penalización)
  - Crear decks originales
  - Recibir reacciones positivas en decks
- [ ] **Penalización por moderación:**
  - Comentario moderado = penalización fuerte de puntos
  - Sistema de rollback si comentario es restaurado
  - Registro en ledger de la penalización y posible reversión
- [ ] **Deck Hash System:**
  - Generar hash único por composición de deck
  - Verificar unicidad al crear/modificar deck
  - Detectar decks duplicados/copiados
- [ ] **Ledger de Puntos:**
  - Registro histórico de todas las transacciones de puntos
  - Inspección por mods (quién, cuándo, por qué)
  - Detalle de cada evento que generó puntos
- [ ] **Wither System (Decay):**
  - Puntos tienen fecha de expiración (2 meses después de obtenidos)
  - Puntos "marchitan" (wither) y no cuentan al total
  - Cron job para procesar decay automáticamente
  - Historial mantiene registro pero marca como expired

## Completado Esta Sesión
- **Riftbound API Integration:**
  - Verificado que api.riftcodex.com funciona (656 cartas disponibles)
  - Creado script de caching `npm run cache:riftbound`
  - Endpoint POST `/api/mod/cache/sync/riftbound` para sync desde UI
- **Pokemon Cache Super Sync:**
  - Endpoint POST `/api/mod/cache/sync/pokemon` para sync de cartas Standard (Scarlet & Violet)
  - Filtrado por regulation marks válidos (G, H, I, J, K)
- **Cache Management Dashboard:**
  - Nueva sección en Dev Dashboard para gestión de cache
  - Stats de Pokemon y Riftbound (cantidad de cartas, último sync)
  - Botones de sync manual para Pokemon y Riftbound
  - Verificación de integridad del cache vs fuentes
- **Daily Cache Sync Cron:**
  - Script `npm run cache:daily` para sync diario automatizado
  - Endpoint `/api/cron/daily-sync` para Vercel Cron
  - Configurado cron en vercel.json (6AM UTC diario)
  - Verificación de cartas faltantes y sync automático
- **Mejoras adicionales:**
  - maxDuration aumentado a 60s para operaciones de sync
  - Endpoint GET `/api/mod/cache/verify` para verificar desviaciones
  - Autenticación por CRON_SECRET para endpoint de cron

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
- El endpoint `/api/cards/batch` permite obtener hasta 60 cartas en paralelo (una llamada vs N secuenciales)
