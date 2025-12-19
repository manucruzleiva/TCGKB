# TODO - TCG Knowledge Base

> **Leyenda de Estimados:**
> - 🎯 **Tokens**: Consumo estimado de tokens de Claude para implementar
> - ⏱️ **Tiempo**: Tiempo estimado de desarrollo

---

## Prioridad 1: UX/UI

### Navegación / Menú
- [x] **Hamburger Menu Refresh:**
  - Eliminar ícono hamburguesa, usar logo de la app como invocador
  - Agregar sección Changelog
  - Agregar sección Roadmap
- [x] **Roadmap Automático desde TODO.md:**
  - Script/endpoint que parsea TODO.md
  - Extrae secciones de Prioridad 1, 2, 3
  - Genera JSON con items pendientes/completados
  - Página /roadmap que muestra el progreso público
  - Actualización automática al hacer deploy
- [x] **Changelog con commits de Staging:** `~50K tokens | ~3.5h`
  - Endpoint que consulta GitHub API para commits de `stage` branch
  - Mostrar lista de commits recientes con mensaje, autor, fecha
  - Filtrar commits por tipo (feat, fix, refactor, etc.)
  - Indicador visual de "En desarrollo" vs "En producción"
  - Sección "Próximamente" con commits pendientes de merge a main
  - Auto-refresh periódico o webhook de GitHub
  - Agrupación por fecha o por feature

### Homepage Refresh
- [x] Cambiar emoji de rayo ⚡ por Pokebola para Pokemon
- [x] Cambiar hanafuda 🎴 por logo de Riftbound
- [x] Separar cantidad de cartas en stats MVP (Pokemon vs Riftbound)
- [x] Refinar diseño general del homepage
- [x] Destacar que Riftbound está 100% soportado

### Smart Mentions System
- [x] **Fase 1: Asistencia Contextual**
  - Al escribir @ en página de carta, mostrar primero atributos de ESA carta
  - Pokemon: mostrar ataques y habilidades
  - Riftbound: mostrar card text
  - Luego mostrar búsqueda global
  - Pasar `contextCard` desde CardDetail → CommentList → CommentComposer
- [x] **Fase 2: Doble Iconografía en Chips**
  - Logo de origen (Pokebola o Logo Riftbound)
  - Icono de categoría (sprite Pokemon, runa Riftbound, ⚔️ ataques, ✨ habilidades)
  - Crear componente GameLogo.jsx
  - Modificar CardMentionLink.jsx
- [x] **Fase 3: Desambiguación Visual**
  - Carta: Chip azul con borde sólido
  - Ataque: Chip rojo/naranja con gradiente
  - Habilidad: Chip púrpura con gradiente
  - Tag/Dominio: Chip con borde punteado
  - Encabezados en dropdown agrupando por tipo
- [x] **Tooltip Horizontal para Atributos:**
  - Cuando mención incluye atributo (ataque/habilidad)
  - Layout horizontal: carta a la izquierda, atributo a la derecha
  - En vez del layout vertical actual
  - Más compacto y legible

### Sistema de Avatares
- [x] Búsqueda de Pokémon para avatar - permitir buscar todos los Pokémon en todas sus formas
- [x] Elegir background del avatar (colores, patrones, etc.)
- [x] Sprites de entrenadores como opción de avatar (usando Pokemon Showdown sprites)
- [x] Sprites de backgrounds como opción (añadidos 32 gradientes temáticos)

### Relationship Map
- [x] RELATIONSHIP MAP en hamburger menu:
  - Canvas con zoom in/out
  - Mostrar cartas que tengan comentarios
  - Si un comentario tiene @ referenciando carta/habilidad/ataque, mostrar flecha de conexión

### Sistema de Reprints
- [x] **Modelo de datos para Reprints:** `~35K tokens | ~2.5h`
  - Campo `reprintGroup` o `canonicalId` que agrupa cartas equivalentes
  - Identificar reprints por: mismo nombre + mismo texto de ataque/habilidad
  - Diferenciar: reprint exacto vs alternate art vs promo version
  - Tipos de reprint: `exact`, `alternate_art`, `promo`, `special_art`
- [x] **Algoritmo de detección automática:** `~45K tokens | ~3h`
  - Comparar nombre de carta (normalizado, sin sufijos de set)
  - Comparar texto de ataques/habilidades (fuzzy match para variaciones menores)
  - Comparar stats (HP, daño, costo de energía)
  - Script de análisis masivo para cartas existentes en cache
  - Marcar como "pendiente de revisión" si match es parcial
- [x] **UI en página de carta:** `~30K tokens | ~2h`
  - Sección "Otras versiones de esta carta"
  - Mostrar thumbnail de cada reprint con set y rareza
  - Indicador de tipo (exact/alt art/promo)
  - Click para navegar al reprint
  - Badge "X versiones disponibles" en card header
- [x] **Filtros y búsqueda por reprints:** `~25K tokens | ~2h`
  - En catálogo: toggle "Mostrar solo una versión por carta"
  - Filtro "Solo alternate arts"
  - Contador de versiones en resultados de búsqueda

### Catálogo (/catalog)
- [x] Página de catálogo completo de cartas
- [x] Filtros por TCG (Pokemon / Riftbound)
- [x] Filtros por set, tipo, rareza, etc.
- [x] Vista grid/list toggle
- [x] Paginación o infinite scroll

### Binder / Colección Personal
- [x] **Modelo de datos:**
  - Usuario puede marcar cantidad de cada carta que posee (0 a N)
  - Concepto PLAYSET: máximo jugable en deck (Pokemon: 4, Riftbound: 3)
  - Indicador visual si tiene playset completo
- [x] **UI en página de carta:**
  - Botón/contador para agregar carta a colección
  - Mostrar "tienes X de Y (playset)"
- [x] **Página /binder o /collection:**
  - Ver todas las cartas que el usuario posee
  - Filtrar por TCG, set, completitud de playset
  - Stats: total cartas, valor de colección (si aplica)
- [x] **Decks sugeridos:** `~60K tokens | ~4h`
  - Basado en cartas que el usuario posee
  - Mostrar % de completitud de decks populares
  - Sugerir cartas faltantes para completar decks

### Sistema de Fans de Artistas
- [x] **Modelo Artist:** `~25K tokens | ~2h`
  - Nombre del artista
  - Contador de fans
  - Lista de usuarios fans
- [x] **UI en página de carta:** `~30K tokens | ~2h`
  - Nombre del artista clickeable
  - Mostrar cantidad de fans del artista
  - Click para hacerse fan (toggle)
  - Cambio visual cuando eres fan (highlight, icono, etc.)
- [ ] **Página de artista (opcional):** `~35K tokens | ~2.5h`
  - Ver todas las cartas de un artista
  - Ranking de artistas más populares

### Overhaul de Diseño Gráfico
- [x] **Rediseño de identidad visual:** `~30K tokens | ~2h`
  - Paleta de colores expandida (primary, success, warning, error, pokemon, riftbound)
  - Tipografía unificada (Inter, Cal Sans, JetBrains Mono)
  - Espaciado y grid system coherente
- [x] **Componentes UI mejorados:** `~40K tokens | ~3h`
  - Botones con estados hover/active/disabled consistentes (btn-primary, btn-secondary, btn-ghost, btn-danger, btn-success, btn-outline)
  - Inputs y forms con mejor feedback visual (input-field, input-label, input-error)
  - Cards y containers con sombras/bordes unificados (card, card-hover, card-bordered, card-glass)
  - Badges, dropdowns, tooltips, tabs, toggles, progress bars, avatars
- [x] **Animaciones y transiciones:** `~25K tokens | ~2h`
  - Transiciones suaves (fade-in, fade-in-up, slide-in-right, scale-in)
  - Micro-interacciones (pulse-subtle, bounce-subtle, shimmer)
  - Skeleton loading states animados
- [x] **Responsive design audit:** `~35K tokens | ~2.5h`
  - Mejora de header para móviles (búsqueda expandible)
  - Botón de búsqueda móvil con overlay
  - Espaciado reducido en móviles (py-3 vs py-4)
- [x] **Iconografía consistente:** `~20K tokens | ~1.5h`
  - Clases de badge por tipo (badge-primary, badge-pokemon, badge-riftbound)
  - Tamaños consistentes (avatar-sm/md/lg/xl)
  - Colores que respetan el tema activo

---

## Prioridad 2: Funcionalidad

### Decks
- [x] Import Deck `~35K tokens | ~2.5h`
  - Botón directo en Decks para importar decks de Riftbound o Pokemon

### Autenticación / Usuario
- [x] User data chips - reemplazar chip 'admin' por tags actuales (mod/dev/ambos)
- [x] Change email `~20K tokens | ~1.5h`
  - Requiere password actual para mayor seguridad (ya implementado)
- [x] Login con username - permitir login con username además de correo
- [x] Username único - validar que no existan duplicados al registrar o cambiar username (case-insensitive)

### Ranking Híbrido de Popularidad
- [x] Endpoint `GET /api/cards/popular` `~30K tokens | ~2h`
  - Top cartas por reacciones/comentarios
- [x] Fórmula de popularidad `~25K tokens | ~2h`
  - `thumbsUp - thumbsDown + (comments * 2) + mentions`
  - Incluye menciones (@) como factor de popularidad
  - Agregación que suma reacciones por carta
- [ ] Cachear resultado `~15K tokens | ~1h`
  - Actualizar cada hora (opcional, para optimización)
- [ ] Lógica de query vacío `~20K tokens | ~1.5h`
  - Top 1 más popular + mix aleatorio del pool top 50 (opcional)
- [ ] Endpoint `GET /api/stats/popularity` `~20K tokens | ~1.5h`
  - Stats agregados de popularidad (opcional)

---

## Prioridad 3: Backend / Infraestructura

### Dev Dashboard
- [ ] Health check de todos los endpoints API `~25K tokens | ~2h`
- [ ] Lista de reportes - filtrar por asignatario `~15K tokens | ~1h`
- [ ] Lista de reportes - filtrar por estado `~15K tokens | ~1h`
- [ ] Lista de reportes - sort oldest/newest `~10K tokens | ~0.5h`
- [ ] SLA tracking `~40K tokens | ~3h`
  - Tiempo desde NEW → Processing
  - Tiempo desde Processing → Closed
  - Tracking completo del ciclo de vida del reporte

### Bug Reporter - Integraciones
- [ ] **Integración con GitHub Issues:** `~45K tokens | ~3h`
  - Botón "Crear Issue en GitHub" desde Dev Dashboard
  - Mapear campos del bug report a formato de Issue
  - Incluir screenshot como imagen en el issue
  - Labels automáticos (bug, from-app, prioridad)
  - Sincronizar estado: cuando Issue se cierra, actualizar bug report
  - GitHub API con token de servicio
- [ ] **Integración con TODO.md:** `~35K tokens | ~2.5h`
  - Botón "Agregar al Roadmap" desde Dev Dashboard
  - Generar item formateado con estimado sugerido
  - Elegir prioridad (P1/P2/P3) y sección
  - Commit automático al archivo TODO.md
  - Webhook o GitHub Action para push
- [ ] **Auto-clasificación de bugs:** `~30K tokens | ~2h`
  - Analizar descripción del bug con heurísticas
  - Sugerir prioridad automáticamente
  - Detectar duplicados potenciales
  - Tags automáticos según página/componente afectado

### Sistema de Reputación
- [ ] **Obtención de puntos:** `~50K tokens | ~4h`
  - Participar/generar conversaciones (comentarios)
  - Usar sistema @ en comentarios (menciones)
  - Recibir reacciones positivas en comentarios
  - Reaccionar a cartas, ataques, habilidades, comentarios
  - Reportar bug que pasa a procesamiento (+puntos)
  - Bug desestimado (-puntos, penalización)
  - Crear decks originales
  - Recibir reacciones positivas en decks
- [ ] **Penalización por moderación:** `~30K tokens | ~2h`
  - Comentario moderado = penalización fuerte de puntos
  - Sistema de rollback si comentario es restaurado
  - Registro en ledger de la penalización y posible reversión
- [ ] **Configuración de Pesos (Mod Dashboard):** `~45K tokens | ~3h`
  - UI en dashboard para configurar puntos por cada acción
  - Tabla de acciones con peso editable (ej: comentario=5pts, mención=2pts)
  - Decay configurable por tipo de acción (ej: comentario=60días, reacción=30días)
  - Preview de impacto antes de aplicar cambios
- [ ] **Aplicación Reactiva de Pesos:** `~55K tokens | ~4h`
  - Al cambiar pesos, recalcular puntos de todos los usuarios
  - Job en background para recálculo masivo
  - Notificación a usuarios si su reputación cambia significativamente
  - Historial de cambios de configuración (quién, cuándo, qué cambió)
- [ ] **Deck Hash System:** `~25K tokens | ~2h`
  - Generar hash único por composición de deck
  - Verificar unicidad al crear/modificar deck
  - Detectar decks duplicados/copiados
- [ ] **Ledger de Puntos:** `~35K tokens | ~2.5h`
  - Registro histórico de todas las transacciones de puntos
  - Inspección por mods (quién, cuándo, por qué)
  - Detalle de cada evento que generó puntos
- [ ] **Wither System (Decay):** `~40K tokens | ~3h`
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
- **Hamburger Menu Refresh:**
  - Logo de la app como invocador del menú (eliminado ícono hamburguesa)
  - Agregadas secciones Roadmap, Relationship Map y Catálogo
- **Roadmap Automático:**
  - Endpoint GET /api/stats/roadmap que parsea TODO.md desde GitHub
  - Página /roadmap con progreso visual por prioridad y sección
- **Sistema de Avatares Mejorado:**
  - Búsqueda de Pokémon (todos los ~1500 disponibles via PokeAPI)
  - 16 backgrounds de gradiente personalizables
  - Campo avatarBackground agregado al modelo User
- **Relationship Map:**
  - Endpoint GET /api/stats/relationship-map
  - Página /relationship-map con canvas SVG interactivo
  - Zoom/pan con rueda del ratón y arrastre
  - Visualización de conexiones entre cartas basadas en menciones @
- **Catálogo de Cartas:**
  - Endpoints GET /api/cards/catalog y /api/cards/catalog/filters
  - Página /catalog con filtros (TCG, set, tipo, rareza)
  - Vistas grid/list toggle
  - Paginación completa
- **Binder / Colección Personal:**
  - Modelo Collection con cantidad de cartas, playset tracking
  - Endpoints: GET/POST/PUT/DELETE /api/collection/*
  - UI de contador en página de carta con barra de progreso de playset
  - Página /collection con estadísticas, filtros y vistas grid/list
  - Playset: Pokemon=4, Riftbound=3
- **Staging Favicon:**
  - Script que convierte favicon a grayscale en staging.tcgkb.app
  - Título cambia a [STAGING] TCG KB

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

## Resumen de Estimados

| Prioridad | Tokens Estimados | Tiempo Estimado |
|-----------|------------------|-----------------|
| P1: UX/UI | ~845K tokens | ~59.5h |
| P2: Funcionalidad | ~165K tokens | ~12h |
| P3: Backend/Infra | ~495K tokens | ~34.5h |
| **TOTAL** | **~1,505K tokens** | **~106h** |

> **Nota**: Estos estimados asumen implementación desde cero con Claude.
> El consumo real puede variar según iteraciones, debugging y cambios de scope.

---

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
- Dev Dashboard ahora incluye monitoreo de salud de API y Database
- El endpoint `/api/cards/batch` permite obtener hasta 60 cartas en paralelo
