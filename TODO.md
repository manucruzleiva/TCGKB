# TODO

> **Leyenda de Estimados:**
> - 🎯 **Tokens**: Consumo estimado de tokens de Claude para implementar
> - ⏱️ **Tiempo**: Tiempo estimado de desarrollo

---

## Prioridad 1: UX/UI

### Bugs Críticos
- [ ] **Fix Sync Manual Pokemon (Dev Dashboard):** `~15K tokens | ~1h`
  - Error: "Cannot read properties of undefined (reading 'length')"
  - Revisar endpoint POST `/api/mod/cache/sync/pokemon`
  - Verificar respuesta de Pokemon TCG API
  - Agregar validación de datos antes de acceder a `.length`
  - Mejorar manejo de errores con mensaje descriptivo
- [ ] **Cachear TODAS las cartas Pokemon (no solo Standard):** `~25K tokens | ~2h`
  - Remover filtro de regulation marks (G, H, I, J, K)
  - Cachear todas las cartas disponibles en Pokemon TCG API
  - Paginación para manejar ~15,000+ cartas
  - Sync incremental (solo cartas nuevas/actualizadas)
  - Mostrar progreso en Dev Dashboard durante sync masivo
  - Considerar límites de rate de la API
- [ ] **Fix User Activity no se muestra:** `~15K tokens | ~1h`
  - La página de usuario `/user/:username` no muestra actividad
  - Revisar endpoint GET `/api/users/:username/activity`
  - Verificar que UserActivity.jsx esté consumiendo datos correctamente
  - Revisar si hay error en el fetch o en el rendering
- [ ] **Fix Bug Reports - Tabla no muestra todos los tickets:** `~10K tokens | ~0.5h`
  - El contador muestra 2 tickets pero la tabla solo muestra 1
  - Revisar endpoint que trae los bug reports
  - Verificar paginación o filtrado incorrecto
  - Revisar rendering de la tabla en DevDashboard
- [ ] **Fix Mobile: Buscador no visible en modo vertical:** `~20K tokens | ~1.5h`
  - BUG CRÍTICO: App inutilizable en mobile vertical
  - El search bar tiene `hidden md:block`, se oculta en pantallas pequeñas
  - Agregar ícono de lupa visible en mobile para invocar búsqueda
  - Crear overlay/modal de búsqueda para mobile
  - Mantener funcionalidad de autocomplete en mobile
- [ ] **Refactor Header: Mover theme/language al user dropdown:** `~15K tokens | ~1h`
  - Remover ThemeSwitcher y LanguageSwitcher de la nav bar principal
  - Agregar toggles de theme/language dentro del dropdown del usuario
  - Ubicarlos sobre el link de Settings
  - Simplifica el header, especialmente en mobile
- [ ] **Fix User Dropdown: Remover email visible:** `~5K tokens | ~0.25h`
  - El email no debería mostrarse en el dropdown (privacidad)
  - Mantener solo username y avatar en el header del dropdown
- [ ] **Agregar link "Mi Página" en user dropdown:** `~10K tokens | ~0.5h`
  - Link a `/user/:username` del usuario autenticado
  - Mostrar colección del usuario y su actividad
  - Ver comentarios y reacciones del usuario
  - Ubicar debajo del username en el dropdown

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
- [x] **Fase 2: Doble Iconografía en Chips**
- [x] **Fase 3: Desambiguación Visual**
- [x] **Tooltip Horizontal para Atributos**

### Sistema de Avatares
- [x] Búsqueda de Pokémon para avatar
- [x] Elegir background del avatar (colores, patrones, etc.)
- [ ] Sprites de entrenadores como opción de avatar `~15K tokens | ~1h`
- [ ] Sprites de backgrounds como opción `~20K tokens | ~1.5h`

### Relationship Map
- [x] RELATIONSHIP MAP en hamburger menu

### Sistema de Reprints
- [ ] **Modelo de datos para Reprints:** `~35K tokens | ~2.5h`
  - Campo `reprintGroup` o `canonicalId` que agrupa cartas equivalentes
  - Identificar reprints por: mismo nombre + mismo texto de ataque/habilidad
  - Diferenciar: reprint exacto vs alternate art vs promo version
  - Tipos de reprint: `exact`, `alternate_art`, `promo`, `special_art`
- [ ] **Algoritmo de detección automática:** `~45K tokens | ~3h`
  - Comparar nombre de carta (normalizado, sin sufijos de set)
  - Comparar texto de ataques/habilidades (fuzzy match para variaciones menores)
  - Comparar stats (HP, daño, costo de energía)
  - Script de análisis masivo para cartas existentes en cache
  - Marcar como "pendiente de revisión" si match es parcial
- [ ] **Botón "Discover Reprints" en Dev Dashboard:** `~20K tokens | ~1.5h`
  - Botón en Dev Dashboard para ejecutar detección masiva
  - Endpoint POST `/api/mod/reprints/discover`
  - Mostrar progreso de análisis (X de Y cartas procesadas)
  - Reporte de reprints encontrados con estadísticas
  - Opción de revisar/aprobar matches parciales
- [ ] **UI en página de carta - Carrusel de reprints:** `~45K tokens | ~3h`
  - Remover contador x/2 de esquina superior izquierda de imagen
  - Swipe o click para ciclar entre imágenes de reprints
  - Mobile: interacción 50/50 - click izquierdo = atrás, derecho = adelante
  - Mostrar thumbnails de opciones debajo de imagen principal
  - Actualizar atributo "number" al cambiar de reprint
  - Indicador de tipo (exact/alt art/promo)
  - Badge "X versiones disponibles" en card header
- [ ] **Filtros y búsqueda por reprints:** `~25K tokens | ~2h`
  - En catálogo: toggle "Mostrar solo una versión por carta"
  - Filtro "Solo alternate arts"
  - Búsqueda que agrupa reprints en resultados
  - Contador de versiones en resultados de búsqueda

### Página de Carta (Card Details)
- [ ] **Parsing de sprites en card text (Riftbound):** `~20K tokens | ~1.5h`
  - Detectar tokens como `:rb_might:`, `:rb_grace:`, etc. en el texto
  - Reemplazar por sprites correspondientes de runas
  - Usar assets de Drive/librería de recursos existente
  - Aplicar en descripción de carta, efectos, habilidades
- [ ] **Sprites para atributos Domain y Might (Riftbound):** `~15K tokens | ~1h`
  - Atributo Domain: mostrar sprite de la runa correspondiente
  - Atributo Might: mostrar sprite de might
  - Usar assets de Drive para obtener sprites
  - Consistente con el sistema de sprites en card text
- [ ] **Fix line breaks en card text:** `~10K tokens | ~0.5h`
  - Detectar punto seguido sin espacio (`.X` donde X es mayúscula)
  - Insertar salto de línea automático
  - Ejemplo: "battlefield.Friendly" → "battlefield.\nFriendly"
  - Mejorar legibilidad del texto de cartas

### Catálogo (/catalog)
- [x] Página de catálogo completo de cartas
- [x] Filtros por TCG (Pokemon / Riftbound)
- [x] Filtros por set, tipo, rareza, etc.
- [x] Vista grid/list toggle
- [x] Infinite scroll
- [ ] **Filtros TCG con iconos visuales (no dropdown):** `~25K tokens | ~2h`
  - Reemplazar dropdown de TCG por íconos clickeables
  - Pokebola para Pokemon, logo Riftbound para Riftbound
  - Full color = mostrando cartas de ese TCG
  - Grayscale = filtrando/ocultando cartas de ese TCG
  - Toggle al hacer click en el ícono
- [ ] **Filtros por subtipo con sprites:** `~35K tokens | ~2.5h`
  - Pokemon: filtros por tipo de carta (Grass, Fire, Water, etc.)
  - Usar sprites oficiales de tipos Pokemon (NO emojis)
  - Riftbound: filtros por runas usando sprites existentes
  - Full color = mostrando, Grayscale = filtrando
  - Comportamiento toggle al hacer click en sprite

### Binder / Colección Personal
- [x] **Modelo de datos** (playset tracking)
- [x] **UI en página de carta** (contador, barra de progreso)
- [x] **Página /collection** (filtros, stats, grid/list)
- [ ] **Fix playset Riftbound - debe ser x/3 no x/4:** `~10K tokens | ~0.5h`
  - Riftbound usa playset de 3 cartas, no 4 como Pokemon
  - Detectar TCG de la carta y ajustar máximo de playset
  - Actualizar UI de barra de progreso y contador
- [ ] **Contador de colección más discreto en carta:** `~15K tokens | ~1h`
  - Actualmente ocupa demasiado espacio visual
  - Diseño más compacto/minimalista
  - Mantener funcionalidad de incrementar/decrementar
  - Considerar badge pequeño o mini contador inline
- [ ] **Decks sugeridos:** `~60K tokens | ~4h`
  - Basado en cartas que el usuario posee
  - Mostrar % de completitud de decks populares
  - Sugerir cartas faltantes para completar decks

### Sistema de Fans de Artistas
- [ ] **Modelo Artist:** `~25K tokens | ~2h`
  - Nombre del artista
  - Contador de fans
  - Lista de usuarios fans
- [ ] **UI en página de carta - Toggle de fan en nombre:** `~30K tokens | ~2h`
  - Nombre del artista ES el botón de toggle (no emoji separado)
  - Click en nombre = toggle fan on/off
  - Cuando es fan: mostrar ❤️ al inicio y final del nombre (ej: "❤️ Artist Name ❤️")
  - Cuando no es fan: solo nombre normal
  - Mostrar cantidad de fans del artista
- [ ] **Página de artista (opcional):** `~35K tokens | ~2.5h`
  - Ver todas las cartas de un artista
  - Ranking de artistas más populares

### Overhaul de Diseño Gráfico
- [ ] **Rediseño de identidad visual:** `~30K tokens | ~2h`
- [ ] **Componentes UI mejorados:** `~40K tokens | ~3h`
- [ ] **Animaciones y transiciones:** `~25K tokens | ~2h`
- [ ] **Responsive design audit:** `~35K tokens | ~2.5h`
- [ ] **Iconografía consistente:** `~20K tokens | ~1.5h`

---

## Prioridad 2: Funcionalidad

### Decks
- [ ] **Import Deck:** `~35K tokens | ~2.5h`
  - Botón directo en Decks para importar decks de Riftbound o Pokemon

### Autenticación / Usuario
- [x] User data chips - reemplazar chip 'admin' por tags actuales
- [ ] Change email `~20K tokens | ~1.5h`
- [x] Login con username
- [x] Username único (case-insensitive)

### Ranking Híbrido de Popularidad
- [ ] Endpoint `GET /api/cards/popular` `~30K tokens | ~2h`
- [ ] Cachear resultado `~15K tokens | ~1h`
- [ ] Lógica de query vacío `~20K tokens | ~1.5h`
- [ ] Fórmula de popularidad `~25K tokens | ~2h`
- [ ] Endpoint `GET /api/stats/popularity` `~20K tokens | ~1.5h`

---

## Prioridad 3: Backend / Infraestructura

### Mod Dashboard Mejoras
- [ ] **Fichas adicionales en dashboard:** `~20K tokens | ~1.5h`
  - Ficha de Developers (cantidad de devs activos)
  - Ficha de Total Interactions (comentarios + reacciones)
  - Ficha de Mods (cantidad de moderadores)
- [ ] **Gráficas incrementales (acumulativas):** `~35K tokens | ~2.5h`
  - Cambiar de "cuántos ese día" a "cuántos tenemos al día de la fecha"
  - Comentarios: línea acumulativa de total histórico
  - Reacciones: línea acumulativa de total histórico
  - Actividad: línea acumulativa
  - Toggle para ver incremental vs diario (opcional)
- [ ] **Users Over Time segmentado:** `~25K tokens | ~2h`
  - Separar en líneas/áreas diferentes:
    - Users totales
    - Users inactivos
    - Developers
    - Mods
  - Leyenda con colores distintivos
  - Hover muestra breakdown por categoría

### Dev Dashboard
- [ ] **API Endpoints - Vista compacta:** `~15K tokens | ~1h`
  - Visualización más compacta de métodos (GET/POST/PUT/DELETE en badges pequeños)
  - Agrupar endpoints por recurso (/cards, /users, /comments, etc.)
  - Tooltip en icono de candado explicando: "Requiere autenticación" / "Solo admin"
  - Expandir/colapsar grupos de endpoints
- [ ] **External Data Resources - Pre-cargados:** `~20K tokens | ~1.5h`
  - Mostrar sources pre-cargados (Pokemon TCG API, Riftbound API, PokeAPI)
  - URLs y descripción de cada source visibles sin fetch
  - Botón "Check" que verifica disponibilidad de cada repo/API
  - Indicador de estado: ✅ Online / ❌ Offline / ⏳ Checking
  - Último check timestamp
- [ ] **System Health - Commit ID por ambiente:** `~15K tokens | ~1h`
  - Mostrar commit ID actual en Production (main)
  - Mostrar commit ID actual en Staging (stage)
  - Endpoint que consulta GitHub API o variable de entorno VERCEL_GIT_COMMIT_SHA
  - Link al commit en GitHub
  - Comparar si staging está adelante de production
- [ ] Health check de todos los endpoints API `~25K tokens | ~2h`
- [ ] Lista de reportes - filtrar por asignatario `~15K tokens | ~1h`
- [ ] Lista de reportes - filtrar por estado `~15K tokens | ~1h`
- [ ] Lista de reportes - sort oldest/newest `~10K tokens | ~0.5h`
- [ ] SLA tracking `~40K tokens | ~3h`

### Bug Reporter - Integraciones
- [ ] **Integración con GitHub Issues:** `~45K tokens | ~3h`
- [ ] **Integración con TODO.md:** `~35K tokens | ~2.5h`
- [ ] **Auto-clasificación de bugs:** `~30K tokens | ~2h`

### Sistema de Reputación
- [ ] **Obtención de puntos:** `~50K tokens | ~4h`
- [ ] **Penalización por moderación:** `~30K tokens | ~2h`
- [ ] **Configuración de Pesos (Mod Dashboard):** `~45K tokens | ~3h`
- [ ] **Aplicación Reactiva de Pesos:** `~55K tokens | ~4h`
- [ ] **Deck Hash System:** `~25K tokens | ~2h`
- [ ] **Ledger de Puntos:** `~35K tokens | ~2.5h`
- [ ] **Wither System (Decay):** `~40K tokens | ~3h`

---

## Completado

### Deployment en Vercel
- [x] Deploy inicial a Vercel
- [x] Configurar variables de entorno
- [x] Whitelist IPs de MongoDB Atlas
- [x] Fix SPA routing
- [x] Fix rate limiter para serverless
- [x] Login/Registro funcionando en producción
- [x] Auto-deploy en push a main
- [x] Integración de dominio tcgkb.app

### Funcionalidad Completada
- [x] Extreme caching with sync routines
- [x] PokeAPI sprites en chips de mención
- [x] Riftbound API source of data
- [x] Hamburger Menu con logo como invocador
- [x] Roadmap automático desde TODO.md
- [x] Sistema de Avatares (búsqueda Pokemon + backgrounds)
- [x] Relationship Map (canvas SVG interactivo)
- [x] Catálogo con filtros e infinite scroll
- [x] Binder / Colección Personal completo
- [x] Staging favicon grayscale

### Sesiones Anteriores
- Fix API URL para producción
- Fix rate limiter blocking login en serverless
- Fix JWT_EXPIRES_IN inválido
- Trust proxy configurado
- Removed duplicate Mongoose indexes
- Agregar "GLC" a format tags
- Remover "Tabla de Tipos"
- Mejores mensajes de error en login
- Renombrar "Bug Reports" a "Dev Dashboard"

---

## Resumen de Estimados

| Prioridad | Tokens Estimados | Tiempo Estimado |
|-----------|------------------|-----------------|
| P1: UX/UI | ~800K tokens | ~56h |
| P2: Funcionalidad | ~165K tokens | ~12h |
| P3: Backend/Infra | ~625K tokens | ~44h |
| **TOTAL** | **~1,590K tokens** | **~112h** |

> **Nota**: Estos estimados asumen implementación desde cero con Claude.
> El consumo real puede variar según iteraciones, debugging y cambios de scope.

---

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
- Dev Dashboard ahora incluye monitoreo de salud de API y Database
- El endpoint `/api/cards/batch` permite obtener hasta 60 cartas en paralelo
