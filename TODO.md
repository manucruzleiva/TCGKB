# TODO - TCG Knowledge Base

## Prioridad 1: UX/UI

### Navegación / Menú
- [ ] **Hamburger Menu Refresh:**
  - Eliminar ícono hamburguesa, usar logo de la app como invocador
  - Agregar sección Changelog
  - Agregar sección Roadmap
- [ ] **Roadmap Automático desde TODO.md:**
  - Script/endpoint que parsea TODO.md
  - Extrae secciones de Prioridad 1, 2, 3
  - Genera JSON con items pendientes/completados
  - Página /roadmap que muestra el progreso público
  - Actualización automática al hacer deploy

### Homepage Refresh
- [ ] Cambiar emoji de rayo ⚡ por Pokebola para Pokemon
- [ ] Cambiar hanafuda 🎴 por logo de Riftbound
- [ ] Separar cantidad de cartas en stats MVP (Pokemon vs Riftbound)
- [ ] Refinar diseño general del homepage
- [ ] Destacar que Riftbound está 100% soportado

### Smart Mentions System
- [ ] **Fase 1: Asistencia Contextual**
  - Al escribir @ en página de carta, mostrar primero atributos de ESA carta
  - Pokemon: mostrar ataques y habilidades
  - Riftbound: mostrar card text
  - Luego mostrar búsqueda global
  - Pasar `contextCard` desde CardDetail → CommentList → CommentComposer
- [ ] **Fase 2: Doble Iconografía en Chips**
  - Logo de origen (Pokebola o Logo Riftbound)
  - Icono de categoría (sprite Pokemon, runa Riftbound, ⚔️ ataques, ✨ habilidades)
  - Crear componente GameLogo.jsx
  - Modificar CardMentionLink.jsx
- [ ] **Fase 3: Desambiguación Visual**
  - Carta: Chip azul con borde sólido
  - Ataque: Chip rojo/naranja con gradiente
  - Habilidad: Chip púrpura con gradiente
  - Tag/Dominio: Chip con borde punteado
  - Encabezados en dropdown agrupando por tipo

### Sistema de Avatares
- [ ] Búsqueda de Pokémon para avatar - permitir buscar todos los Pokémon en todas sus formas
- [ ] Elegir background del avatar (colores, patrones, etc.)
- [ ] Sprites de entrenadores como opción de avatar (investigar fuente de sprites)
- [ ] Sprites de backgrounds como opción (investigar disponibilidad)

### Relationship Map
- [ ] RELATIONSHIP MAP en hamburger menu:
  - Canvas con zoom in/out
  - Mostrar cartas que tengan comentarios
  - Si un comentario tiene @ referenciando carta/habilidad/ataque, mostrar flecha de conexión

### Catálogo (/catalog)
- [ ] Página de catálogo completo de cartas
- [ ] Filtros por TCG (Pokemon / Riftbound)
- [ ] Filtros por set, tipo, rareza, etc.
- [ ] Vista grid/list toggle
- [ ] Paginación o infinite scroll

### Binder / Colección Personal
- [ ] **Modelo de datos:**
  - Usuario puede marcar cantidad de cada carta que posee (0 a N)
  - Concepto PLAYSET: máximo jugable en deck (Pokemon: 4, Riftbound: 3)
  - Indicador visual si tiene playset completo
- [ ] **UI en página de carta:**
  - Botón/contador para agregar carta a colección
  - Mostrar "tienes X de Y (playset)"
- [ ] **Página /binder o /collection:**
  - Ver todas las cartas que el usuario posee
  - Filtrar por TCG, set, completitud de playset
  - Stats: total cartas, valor de colección (si aplica)
- [ ] **Decks sugeridos:**
  - Basado en cartas que el usuario posee
  - Mostrar % de completitud de decks populares
  - Sugerir cartas faltantes para completar decks

### Sistema de Fans de Artistas
- [ ] **Modelo Artist:**
  - Nombre del artista
  - Contador de fans
  - Lista de usuarios fans
- [ ] **UI en página de carta:**
  - Nombre del artista clickeable
  - Mostrar cantidad de fans del artista
  - Click para hacerse fan (toggle)
  - Cambio visual cuando eres fan (highlight, icono, etc.)
- [ ] **Página de artista (opcional):**
  - Ver todas las cartas de un artista
  - Ranking de artistas más populares

---

## Prioridad 2: Funcionalidad

### Decks
- [ ] Import Deck - botón directo en Decks para importar decks de Riftbound o Pokemon

### Autenticación / Usuario
- [ ] User data chips - reemplazar chip 'admin' por tags actuales (mod/dev/ambos)
- [ ] Change email - requiere input del email actual para mayor seguridad
- [ ] Login con username - permitir login con username además de correo
- [ ] Username único - validar que no existan duplicados al registrar o cambiar username

### Ranking Híbrido de Popularidad
- [ ] Endpoint `GET /api/cards/popular` - Top cartas por reacciones/comentarios
- [ ] Cachear resultado (actualizar cada hora)
- [ ] Si query vacío: Top 1 más popular + mix aleatorio del pool top 50
- [ ] Fórmula: `thumbsUp - thumbsDown + comments.count`
- [ ] Agregación que suma reacciones por carta (incluyendo atributos)
- [ ] Endpoint `GET /api/stats/popularity`

---

## Prioridad 3: Backend / Infraestructura

### Dev Dashboard
- [ ] Agregar health check de todos los endpoints API
- [ ] Lista de reportes - filtrar por asignatario
- [ ] Lista de reportes - filtrar por estado
- [ ] Lista de reportes - sort oldest/newest
- [ ] SLA tracking:
  - Tiempo desde NEW → Processing
  - Tiempo desde Processing → Closed
  - Tracking completo del ciclo de vida del reporte

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

---

## Completado

### Deployment en Vercel
- [x] Deploy inicial a Vercel
- [x] Configurar variables de entorno (MONGODB_URI, JWT_SECRET, etc.)
- [x] Whitelist IPs de MongoDB Atlas (0.0.0.0/0)
- [x] Fix SPA routing (vercel.json rewrites)
- [x] Fix rate limiter para serverless (aumentado a 100 req/15min)
- [x] Login funcionando en producción
- [x] Registro funcionando en producción
- [x] Configurar deploy basado en GitHub (auto-deploy en push a main)
- [x] Integración de dominio tcgkb.app from namecheap

### Funcionalidad Completada
- [x] Extreme caching with sync routines
- [x] Add PokeAPI sprites (chips de mención @ muestran sprite del Pokémon)
- [x] Add a reliable Riftbound API source of data

### Esta Sesión
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

### Sesiones Anteriores
- Fix API URL para producción (runtime detection en lugar de build-time)
- Fix rate limiter blocking login en serverless
- Configuración completa de Vercel con variables de entorno
- SPA routing funcionando
- Fix JWT_EXPIRES_IN inválido que bloqueaba registro
- Trust proxy configurado para rate limiter en Vercel
- Removed duplicate Mongoose indexes (email, username)
- Agregar "GLC" a format tags (backend + frontend)
- Remover "Tabla de Tipos" (TypeChart page)
- Mejores mensajes de error en login (códigos específicos + bilingüe)
- Renombrar "Bug Reports" a "Dev Dashboard" con health monitoring

---

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
- Dev Dashboard ahora incluye monitoreo de salud de API y Database
- El endpoint `/api/cards/batch` permite obtener hasta 60 cartas en paralelo
