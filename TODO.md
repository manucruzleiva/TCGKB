# TODO - TCGKB

---

## ROADMAP

> Features de alto nivel para visibilidad pública. Considera migrar a GitHub Projects.

### En Progreso
- 🔧 **Bugs Críticos** - Fixes de UX en mobile y dashboards
- 🎨 **Sistema de Sprites** - Reemplazar emojis por sprites oficiales (energías, runas)
- 🃏 **Deck Builder** - Constructores para Riftbound y Pokemon

### Próximamente
- 🔄 **Sistema de Reprints** - Detectar y mostrar versiones alternativas de cartas
- 👤 **Sistema de Fans de Artistas** - Seguir artistas favoritos
- ⚖️ **Card Legality Tracking** - Legalidad y rotación de sets (Riftbound)
- 🏆 **Sistema de Reputación** - Puntos, decay, y ledger

### Futuro
- 📊 **GitHub Projects Integration** - Migrar gestión de proyecto
- 🎯 **Ranking Híbrido de Popularidad** - Algoritmo de cartas populares
- 🎨 **Overhaul de Diseño Gráfico** - Rediseño visual completo

---

## PENDING TASKS

> **Leyenda:** `~XXK tokens | ~Xh` = Estimado de consumo Claude + tiempo

### Bugs Críticos
- [ ] Fix Sync Manual Pokemon (Dev Dashboard) `~15K | ~1h`
- [ ] Cachear TODAS las cartas Pokemon (no solo Standard) `~25K | ~2h`
- [ ] Fix User Activity no se muestra `~15K | ~1h`
- [ ] Fix Bug Reports - Tabla no muestra todos los tickets `~10K | ~0.5h`
- [ ] Fix Mobile: Buscador no visible en modo vertical `~20K | ~1.5h`
- [ ] Fix User Dropdown: Remover email visible `~5K | ~0.25h`
- [ ] Fix playset Riftbound - debe ser x/3 no x/4 `~10K | ~0.5h`
- [ ] Fix line breaks en card text `~10K | ~0.5h`
- [ ] Fix Popular Comments en conexión (Relationship Map) `~20K | ~1.5h`

### Header / Navegación
- [ ] Refactor Header: Mover theme/language al user dropdown `~15K | ~1h`
- [ ] Agregar link "Mi Página" en user dropdown `~10K | ~0.5h`
- [ ] Changelog con commits de Staging `~50K | ~3.5h`

### Smart Mentions
- [ ] Expandir @ para más atributos de carta `~40K | ~3h`

### Sistema de Avatares
- [ ] Sprites de entrenadores como opción `~15K | ~1h`
- [ ] Sprites de backgrounds como opción `~20K | ~1.5h`
- [ ] Runas de Riftbound como opción de avatar `~15K | ~1h`

### Relationship Map
- [ ] Modal de conexión - Datos completos `~25K | ~2h`
- [ ] Canvas full screen (sin spacers) `~15K | ~1h`
- [ ] Layers con sprites TCG (no iconos) `~20K | ~1.5h`

### Sistema de Reprints
- [ ] Modelo de datos para Reprints `~35K | ~2.5h`
- [ ] Algoritmo de detección automática `~45K | ~3h`
- [ ] Botón "Discover Reprints" en Dev Dashboard `~20K | ~1.5h`
- [ ] Poblar reprints para Pokemon `~30K | ~2h`
- [ ] UI en página de carta - Carrusel de reprints `~45K | ~3h`
- [ ] Filtros y búsqueda por reprints `~25K | ~2h`

### Página de Carta
- [ ] Parsing de sprites en card text (Riftbound) `~20K | ~1.5h`
- [ ] Sprites para atributos Domain y Might `~15K | ~1h`
- [ ] Sprites de energía en ataques Pokemon `~25K | ~2h`

### Catálogo
- [ ] Filtros TCG con iconos visuales (no dropdown) `~25K | ~2h`
- [ ] Filtros por subtipo con sprites `~35K | ~2.5h`

### Colección / Binder
- [ ] Contador de colección más discreto `~15K | ~1h`
- [ ] Decks sugeridos `~60K | ~4h`
- [ ] Import colección desde TCGCollector `~45K | ~3h`

### Sistema de Fans de Artistas
- [ ] Modelo Artist `~25K | ~2h`
- [ ] UI Toggle de fan en nombre del artista `~30K | ~2h`
- [ ] Página de artista (opcional) `~35K | ~2.5h`
- [ ] Link a catálogo filtrado por artista `~20K | ~1.5h`

### Overhaul de Diseño
- [ ] Rediseño de identidad visual `~30K | ~2h`
- [ ] Componentes UI mejorados `~40K | ~3h`
- [ ] Animaciones y transiciones `~25K | ~2h`
- [ ] Responsive design audit `~35K | ~2.5h`
- [ ] Iconografía consistente `~20K | ~1.5h`

### Decks
- [ ] Import Deck Riftbound (TCG Arena format) `~45K | ~3h`
- [ ] Import Deck Pokemon `~35K | ~2.5h`
- [ ] Deck Builder para Riftbound `~80K | ~6h`
- [ ] Deck Builder para Pokemon `~60K | ~4h`
- [ ] Página Decks - Filtros por juego `~30K | ~2h`
- [ ] Sistema de Tags para Decks `~45K | ~3h`
- [ ] Auto-tagging de Decks (TYPE) `~25K | ~2h`
- [ ] Vista de Deck - Info del creador `~20K | ~1.5h`
- [ ] Decks públicos del usuario `~25K | ~2h`
- [ ] Confirmación al eliminar deck `~10K | ~0.5h`

### Usuario / Auth
- [ ] Change email `~20K | ~1.5h`

### Ranking de Popularidad
- [ ] Endpoint GET /api/cards/popular `~30K | ~2h`
- [ ] Cachear resultado `~15K | ~1h`
- [ ] Lógica de query vacío `~20K | ~1.5h`
- [ ] Fórmula de popularidad `~25K | ~2h`
- [ ] Endpoint GET /api/stats/popularity `~20K | ~1.5h`

### Mod Dashboard
- [ ] Fichas adicionales (devs, interactions, mods) `~20K | ~1.5h`
- [ ] Gráficas incrementales (acumulativas) `~35K | ~2.5h`
- [ ] Users Over Time segmentado `~25K | ~2h`
- [ ] Sistema de cierre de cuenta (CLOSED tag) `~40K | ~3h`
- [ ] Reactivación de cuenta cerrada `~30K | ~2h`

### Dev Dashboard
- [ ] API Endpoints - Vista compacta `~15K | ~1h`
- [ ] External Data Resources - Pre-cargados `~20K | ~1.5h`
- [ ] System Health - Commit ID por ambiente `~15K | ~1h`
- [ ] Health check de todos los endpoints API `~25K | ~2h`
- [ ] Lista de reportes - filtrar por asignatario `~15K | ~1h`
- [ ] Lista de reportes - filtrar por estado `~15K | ~1h`
- [ ] Lista de reportes - sort oldest/newest `~10K | ~0.5h`
- [ ] SLA tracking `~40K | ~3h`

### Bug Reporter
- [ ] Integración con GitHub Issues `~45K | ~3h`
- [ ] Integración con TODO.md `~35K | ~2.5h`
- [ ] Auto-clasificación de bugs `~30K | ~2h`

### Card Legality (Riftbound)
- [ ] Modelo de datos para Sets y Legalidad `~35K | ~2.5h`
- [ ] Card-level legality `~25K | ~2h`
- [ ] Auto-update de legalidad `~20K | ~1.5h`
- [ ] UI de legalidad en página de carta `~15K | ~1h`
- [ ] Filtro de legalidad en catálogo `~15K | ~1h`

### Sistema de Reputación
- [ ] Obtención de puntos `~50K | ~4h`
- [ ] Penalización por moderación `~30K | ~2h`
- [ ] Configuración de Pesos (Mod Dashboard) `~45K | ~3h`
- [ ] Aplicación Reactiva de Pesos `~55K | ~4h`
- [ ] Deck Hash System `~25K | ~2h`
- [ ] Ledger de Puntos `~35K | ~2.5h`
- [ ] Wither System (Decay) `~40K | ~3h`

### Infraestructura / Meta
- [ ] **Migrar a GitHub Projects** `~30K | ~2h`
  - Crear proyecto en GitHub
  - Migrar items del TODO a Issues
  - Configurar board Kanban (Backlog, In Progress, Done)
  - Actualizar endpoint /roadmap para leer GitHub API
  - Automatizaciones (mover cards al cerrar PRs)

---

## COMPLETED TASKS

### Deployment
- [x] Deploy inicial a Vercel
- [x] Configurar variables de entorno
- [x] Whitelist IPs de MongoDB Atlas
- [x] Fix SPA routing
- [x] Fix rate limiter para serverless
- [x] Login/Registro funcionando en producción
- [x] Auto-deploy en push a main
- [x] Integración de dominio tcgkb.app

### Navegación / Menú
- [x] Hamburger Menu con logo como invocador
- [x] Roadmap automático desde TODO.md

### Homepage
- [x] Cambiar emoji de rayo por Pokebola
- [x] Cambiar hanafuda por logo Riftbound
- [x] Separar stats Pokemon vs Riftbound
- [x] Refinar diseño general
- [x] Destacar soporte Riftbound 100%

### Smart Mentions
- [x] Fase 1: Asistencia Contextual
- [x] Fase 2: Doble Iconografía en Chips
- [x] Fase 3: Desambiguación Visual
- [x] Tooltip Horizontal para Atributos

### Sistema de Avatares
- [x] Búsqueda de Pokémon para avatar
- [x] Elegir background del avatar

### Relationship Map
- [x] RELATIONSHIP MAP en hamburger menu

### Catálogo
- [x] Página de catálogo completo
- [x] Filtros por TCG (Pokemon / Riftbound)
- [x] Filtros por set, tipo, rareza
- [x] Vista grid/list toggle
- [x] Infinite scroll

### Colección / Binder
- [x] Modelo de datos (playset tracking)
- [x] UI en página de carta
- [x] Página /collection

### Usuario / Auth
- [x] User data chips con tags actuales
- [x] Login con username
- [x] Username único (case-insensitive)

### Backend
- [x] Extreme caching with sync routines
- [x] PokeAPI sprites en chips
- [x] Riftbound API source of data
- [x] Staging favicon grayscale

### Fixes Históricos
- [x] Fix API URL para producción
- [x] Fix rate limiter blocking login
- [x] Fix JWT_EXPIRES_IN inválido
- [x] Trust proxy configurado
- [x] Removed duplicate Mongoose indexes
- [x] Agregar "GLC" a format tags
- [x] Remover "Tabla de Tipos"
- [x] Mejores mensajes de error en login
- [x] Renombrar "Bug Reports" a "Dev Dashboard"

---

## Resumen de Estimados

| Categoría | Tokens | Tiempo |
|-----------|--------|--------|
| Bugs Críticos | ~130K | ~9h |
| Features UX/UI | ~925K | ~66h |
| Funcionalidad | ~505K | ~36h |
| Backend/Infra | ~835K | ~59h |
| **TOTAL** | **~2,395K** | **~170h** |

---

## Notas Técnicas
- Rate limiter: memoria in-memory (considerar Redis para prod)
- API URL: runtime detection (localhost → localhost:3001, prod → /api)
- Dev Dashboard: monitoreo de salud de API y Database
- Batch endpoint: `/api/cards/batch` hasta 60 cartas en paralelo
