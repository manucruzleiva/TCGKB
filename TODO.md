# TODO - TCG Knowledge Base

> **Leyenda de Estimados:**
> - 🎯 **Tokens**: Consumo estimado de tokens de Claude para implementar
> - ⏱️ **Tiempo**: Tiempo estimado de desarrollo

---

## Prioridad 1: UX/UI

### Navegación / Menú
- [ ] **Hamburger Menu Refresh:** `~15K tokens | ~1h`
  - Eliminar ícono hamburguesa, usar logo de la app como invocador
  - Agregar sección Changelog
  - Agregar sección Roadmap
- [ ] **Roadmap Automático desde TODO.md:** `~35K tokens | ~2.5h`
  - Script/endpoint que parsea TODO.md
  - Extrae secciones de Prioridad 1, 2, 3
  - Genera JSON con items pendientes/completados
  - Página /roadmap que muestra lista de features por prioridad
  - Sin barra de progreso general (solo lista de items)
  - Actualización automática al hacer deploy
- [ ] **Changelog con commits de Staging:** `~50K tokens | ~3.5h`
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
- [ ] Búsqueda de Pokémon para avatar `~25K tokens | ~2h`
  - Permitir buscar todos los Pokémon en todas sus formas
- [ ] Elegir background del avatar `~20K tokens | ~1.5h`
  - Colores, patrones, etc.
- [ ] Sprites de entrenadores como opción de avatar `~15K tokens | ~1h`
  - Investigar fuente de sprites
- [ ] Sprites de backgrounds como opción `~15K tokens | ~1h`
  - Investigar disponibilidad

### Relationship Map
- [ ] **RELATIONSHIP MAP en hamburger menu:** `~80K tokens | ~6h`
  - Canvas con zoom in/out
  - Mostrar cartas que tengan comentarios
  - Si un comentario tiene @ referenciando carta/habilidad/ataque, mostrar flecha de conexión

### Sistema de Reprints
- [ ] **Modelo de datos para Reprints:** `~40K tokens | ~3h`
  - Campo `reprintGroup` o `canonicalId` que agrupa cartas equivalentes
  - Identificar reprints por: mismo nombre + mismo texto de ataque/habilidad
  - Diferenciar: reprint exacto vs alternate art vs promo version
  - Tipos de reprint: `exact`, `alternate_art`, `promo`, `special_art`
  - **Datos COMPARTIDOS entre reprints (por canonicalId):**
    - Comentarios y reacciones (engagement unificado)
    - Stats de jugabilidad (HP, ataques, habilidades, costos)
    - Nombre canónico de la carta
  - **Datos ÚNICOS por versión:**
    - Artista de la carta
    - Set y número de carta
    - Rareza
    - Arte/imagen
    - Fans del artista
- [ ] **Algoritmo de detección automática:** `~45K tokens | ~3h`
  - Comparar nombre de carta (normalizado, sin sufijos de set)
  - Comparar texto de ataques/habilidades (fuzzy match para variaciones menores)
  - Comparar stats (HP, daño, costo de energía)
  - Script de análisis masivo para cartas existentes en cache
  - Marcar como "pendiente de revisión" si match es parcial
- [ ] **Carrusel de Artes (UI principal):** `~50K tokens | ~4h`
  - Click en arte de carta → mostrar siguiente versión (carousel)
  - Indicador de dots/pills mostrando versión actual (1/5, 2/5, etc.)
  - Swipe en móvil para cambiar arte
  - Transición suave entre artes (fade o slide)
  - Mantener visible: nombre artista actual, set, rareza de versión mostrada
  - Info de jugabilidad permanece estática (no cambia con el arte)
  - Botón "Ver todas las versiones" → abre galería completa
- [ ] **Engagement unificado por canonicalId:** `~35K tokens | ~2.5h`
  - Comentarios se guardan con `canonicalId`, no con `cardId` individual
  - Reacciones a la carta se agregan al grupo de reprints
  - Contador de comentarios muestra total del grupo
  - Al comentar, se asocia al canonicalId
  - Migración de comentarios existentes a canonicalId
- [ ] **Sección de Artistas por versión:** `~30K tokens | ~2h`
  - Mostrar artista de la versión actualmente visible en carrusel
  - Botón "Fan" específico por artista (no por carta)
  - "Este arte por [Artista] - X fans"
  - Al cambiar arte en carrusel, actualiza info del artista
- [ ] **Filtros y búsqueda por reprints:** `~25K tokens | ~2h`
  - En catálogo: toggle "Mostrar solo una versión por carta"
  - Filtro "Solo alternate arts"
  - Búsqueda que agrupa reprints en resultados
  - Contador de versiones en resultados de búsqueda

### Catálogo (/catalog)
- [ ] Página de catálogo completo de cartas `~50K tokens | ~4h`
  - **Filtros por TCG con logos como botones:**
    - Botón con logo Pokebola para Pokemon
    - Botón con logo Riftbound para Riftbound
    - Toggle visual (activo/inactivo) con highlight
  - Filtros por set, tipo, rareza, etc.
  - Vista grid/list toggle
  - **Infinite scroll** (no paginación tradicional)
    - Cargar 20-30 cartas iniciales
    - Detectar scroll near-bottom → cargar más
    - Skeleton loaders mientras carga
    - "No hay más cartas" al final

### Binder / Colección Personal
- [ ] **Modelo de datos:** `~30K tokens | ~2h`
  - Usuario puede marcar cantidad de cada carta que posee (0 a N)
  - Concepto PLAYSET: máximo jugable en deck (Pokemon: 4, Riftbound: 3)
  - Indicador visual si tiene playset completo
- [ ] **UI en página de carta:** `~25K tokens | ~2h`
  - Botón/contador para agregar carta a colección
  - Mostrar "tienes X de Y (playset)"
- [ ] **Página /binder o /collection:** `~45K tokens | ~3h`
  - Ver todas las cartas que el usuario posee
  - Filtrar por TCG, set, completitud de playset
  - Stats: total cartas, valor de colección (si aplica)
- [ ] **Decks sugeridos:** `~60K tokens | ~4h`
  - Basado en cartas que el usuario posee
  - Mostrar % de completitud de decks populares
  - Sugerir cartas faltantes para completar decks

### Sistema de Fans de Artistas
- [ ] **Modelo Artist:** `~25K tokens | ~2h`
  - Nombre del artista
  - Contador de fans
  - Lista de usuarios fans
- [ ] **UI en página de carta:** `~30K tokens | ~2h`
  - Nombre del artista clickeable
  - Mostrar cantidad de fans del artista
  - Click para hacerse fan (toggle)
  - Cambio visual cuando eres fan (highlight, icono, etc.)
- [ ] **Página de artista (opcional):** `~35K tokens | ~2.5h`
  - Ver todas las cartas de un artista
  - Ranking de artistas más populares

### Overhaul de Diseño Gráfico
- [ ] **Rediseño de identidad visual:** `~30K tokens | ~2h`
  - Definir paleta de colores consistente (light/dark mode)
  - Tipografía unificada
  - Espaciado y grid system coherente
- [ ] **Componentes UI mejorados:** `~40K tokens | ~3h`
  - Botones con estados hover/active/disabled consistentes
  - Inputs y forms con mejor feedback visual
  - Cards y containers con sombras/bordes unificados
- [ ] **Animaciones y transiciones:** `~25K tokens | ~2h`
  - Transiciones suaves entre páginas
  - Micro-interacciones en botones y elementos
  - Loading states animados
- [ ] **Responsive design audit:** `~35K tokens | ~2.5h`
  - Revisar breakpoints móvil/tablet/desktop
  - Mejorar navegación móvil
  - Optimizar layouts para pantallas pequeñas
- [ ] **Iconografía consistente:** `~20K tokens | ~1.5h`
  - Set de íconos unificado (mismo estilo)
  - Tamaños consistentes
  - Colores que respeten el tema activo

### Staging Environment
- [ ] **Watermark "STAGING" visual:** `~15K tokens | ~1h`
  - Texto "STAGING" como máscara diagonal sobre toda la página
  - CSS `pointer-events: none` (no interactivo)
  - Opacidad baja (~10-15%) para no obstruir UI
  - Posición fija, no se mueve con scroll
  - Solo renderiza si `VITE_ENV === 'staging'` o URL es staging.tcgkb.app
  - Color rojo/naranja sutil para diferenciarlo de producción

---

## Prioridad 2: Funcionalidad

### Decks
- [ ] Import Deck `~35K tokens | ~2.5h`
  - Botón directo en Decks para importar decks de Riftbound o Pokemon

### Autenticación / Usuario
- [x] User data chips - reemplazar chip 'admin' por tags actuales (mod/dev/ambos)
- [ ] Change email `~20K tokens | ~1.5h`
  - Requiere input del email actual para mayor seguridad
- [x] Login con username - permitir login con username además de correo
- [x] Username único - validar que no existan duplicados al registrar o cambiar username (case-insensitive)

### Ranking Híbrido de Popularidad
- [ ] Endpoint `GET /api/cards/popular` `~30K tokens | ~2h`
  - Top cartas por reacciones/comentarios
- [ ] Cachear resultado `~15K tokens | ~1h`
  - Actualizar cada hora
- [ ] Lógica de query vacío `~20K tokens | ~1.5h`
  - Top 1 más popular + mix aleatorio del pool top 50
- [ ] Fórmula de popularidad `~25K tokens | ~2h`
  - `thumbsUp - thumbsDown + comments.count + mentions.count`
  - Agregar menciones (@) como factor de popularidad
  - Agregación que suma reacciones por carta (incluyendo atributos)
- [ ] Endpoint `GET /api/stats/popularity` `~20K tokens | ~1.5h`

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

## Resumen de Estimados

| Prioridad | Tokens Estimados | Tiempo Estimado |
|-----------|------------------|-----------------|
| P1: UX/UI | ~945K tokens | ~67h |
| P2: Funcionalidad | ~165K tokens | ~12h |
| P3: Backend/Infra | ~495K tokens | ~34.5h |
| **TOTAL** | **~1,605K tokens** | **~113.5h** |

> **Nota**: Estos estimados asumen implementación desde cero con Claude.
> El consumo real puede variar según iteraciones, debugging y cambios de scope.

---

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
- Dev Dashboard ahora incluye monitoreo de salud de API y Database
- El endpoint `/api/cards/batch` permite obtener hasta 60 cartas en paralelo
