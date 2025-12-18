# TODO - TCG Knowledge Base

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
- [ ] **UI en página de carta:** `~30K tokens | ~2h`
  - Sección "Otras versiones de esta carta"
  - Mostrar thumbnail de cada reprint con set y rareza
  - Indicador de tipo (exact/alt art/promo)
  - Click para navegar al reprint
  - Badge "X versiones disponibles" en card header
- [ ] **Filtros y búsqueda por reprints:** `~25K tokens | ~2h`
  - En catálogo: toggle "Mostrar solo una versión por carta"
  - Filtro "Solo alternate arts"
  - Búsqueda que agrupa reprints en resultados
  - Contador de versiones en resultados de búsqueda

### Catálogo (/catalog)
- [x] Página de catálogo completo de cartas
- [x] Filtros por TCG (Pokemon / Riftbound)
- [x] Filtros por set, tipo, rareza, etc.
- [x] Vista grid/list toggle
- [x] Infinite scroll

### Binder / Colección Personal
- [x] **Modelo de datos** (playset tracking)
- [x] **UI en página de carta** (contador, barra de progreso)
- [x] **Página /collection** (filtros, stats, grid/list)
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

### Dev Dashboard
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
| P1: UX/UI | ~535K tokens | ~38h |
| P2: Funcionalidad | ~165K tokens | ~12h |
| P3: Backend/Infra | ~495K tokens | ~34.5h |
| **TOTAL** | **~1,195K tokens** | **~84.5h** |

> **Nota**: Estos estimados asumen implementación desde cero con Claude.
> El consumo real puede variar según iteraciones, debugging y cambios de scope.

---

## Notas Técnicas
- El rate limiter usa memoria in-memory que no persiste entre invocaciones serverless
- Para producción seria considerar Redis store
- La URL de API se detecta en runtime: localhost -> localhost:3001, producción -> /api
- Dev Dashboard ahora incluye monitoreo de salud de API y Database
- El endpoint `/api/cards/batch` permite obtener hasta 60 cartas en paralelo
