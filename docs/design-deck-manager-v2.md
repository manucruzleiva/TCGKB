# Design: Deck Manager V2 - Enhanced Import, Validation & Community

## Summary

Evolución del Deck Manager existente para añadir: importación inteligente con auto-detección de juego y formato, validación de estructura por TCG/formato, filtros visuales con iconos toggle, sistema de auto-tagging en tiempo real con imágenes, y navegación entre "Mis Decks" y "Comunidad".

## User Stories

1. **Como jugador**, quiero importar mi deck pegando un string de texto para no tener que agregar cartas una por una.
2. **Como jugador**, quiero que el sistema detecte automáticamente de qué juego y formato es mi deck.
3. **Como jugador**, quiero ver si mi deck cumple las reglas del formato sin recibir popups molestos.
4. **Como coleccionista**, quiero que mi deck tenga un badge "El Primero" si soy el primero en registrar esa composición exacta.
5. **Como miembro de la comunidad**, quiero navegar decks públicos de otros usuarios para inspirarme.
6. **Como creador**, quiero ver las reacciones y comentarios de mis decks en tiempo real.

---

## Reglas de Estructura por TCG y Formato

### Pokemon TCG - Standard/Expanded
| Regla | Valor |
|-------|-------|
| Total de cartas | Exactamente 60 |
| Copias máximas | 4 por nombre (excepto Basic Energy) |
| Basic Pokémon mínimo | Al menos 1 |
| ACE SPEC máximo | 1 en todo el deck |
| Radiant Pokémon máximo | 1 en todo el deck |

**Fuentes**: [Pokemon.com Rules](https://www.pokemon.com/us/strategy/designing-a-deck-from-scratch), [JustInBasil Limits](https://www.justinbasil.com/guide/limits)

### Pokemon TCG - Gym Leader Challenge (GLC)
| Regla | Valor |
|-------|-------|
| Total de cartas | Exactamente 60 |
| Copias máximas | **1 por nombre** (Singleton) |
| Basic Energy | Ilimitado |
| Tipo de Pokémon | **Un solo tipo** (ej: solo Fire) |
| Rule Box Pokémon | **PROHIBIDO** (ex, V, VSTAR, VMAX, Radiant) |
| ACE SPEC | **PROHIBIDO** |
| Card pool | Expanded (Black & White onwards) |

**Reglas especiales GLC**:
- Professor Juniper, Professor Sycamore, Professor's Research: solo 1 de los 3
- Boss's Orders y Lysandre: solo 1 de los 2
- Dual-type Pokémon permitidos si uno de sus tipos coincide con el deck

**Fuentes**: [Gym Leader Challenge Rules](https://gymleaderchallenge.com/rules), [GLC FAQ](https://gymleaderchallenge.com/faq), [Bulbapedia GLC](https://bulbapedia.bulbagarden.net/wiki/Gym_Leader_Challenge_format_(TCG))

### Pokemon TCG - Legacy
| Regla | Valor |
|-------|-------|
| Total de cartas | Exactamente 60 |
| Card pool | HeartGold SoulSilver → Legendary Treasures (fijo) |
| Reglas | Siguen las reglas actuales del TCG |

**Fuentes**: [Bulbapedia Legacy](https://bulbapedia.bulbagarden.net/wiki/Legacy_format_(TCG))

### Riftbound TCG - Constructed
| Componente | Cantidad |
|------------|----------|
| Main Deck | Exactamente 40 cartas |
| Legend | Exactamente 1 |
| Battlefields | Exactamente 3 |
| Runes | Exactamente 12 |
| Copias máximas | 3 por nombre |
| Sideboard (opcional) | 0 u 8 cartas |

**Restricción de Dominio**: Solo cartas de los 2 dominios del Legend elegido.

**Dominios disponibles**: Fury, Calm, Mind, Body, Order, Chaos

**Fuentes**: [Riftbound Core Rules](https://riftbound.gg/core-rules/), [Riftbound Deckbuilding 101](https://riftbound.gg/deckbuilding-101-building-your-first-riftbound-deck/), [Riot Riftbound Rules](https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/gameplay-guide-core-rules/)

---

## Formatos de Import Soportados

### Pokemon TCG Live Format
```
Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 058
4 Squirtle SVI 007

Trainer: 36
4 Professor's Research SVI 189
4 Boss's Orders PAL 172

Energy: 12
8 Electric Energy SVE 004
4 Double Turbo Energy BRS 151
```

### Pokemon TCG Pocket Format
```
Pikachu ex x2
Raichu x2
Professor's Research x2
```

### Riftbound Format (tcg-arena.fr style)
```
1 Leona, Determined
1 Leona, Radiant Dawn
2 Leona, Determined
3 Clockwork Keeper
3 Stalwart Poro
3 Solari Shieldbearer
3 Sunlit Guardian
3 Fiora, Victorious
2 Sett, Kingpin
6 Order Rune
6 Calm Rune
1 Grove of the God-Willow
1 Monastery of Hirana
1 Windswept Hillock
3 Defy
3 En Garde
3 Rune Prison
3 Discipline
1 Facebreaker
1 Zenith Blade
3 Call to Glory
1 Mystic Reversal
1 Zhonya's Hourglass
```

**Detección automática de componentes Riftbound**:
- Legends: Cartas con `cardType: ["Legend"]`
- Battlefields: Cartas con `cardType: ["Battlefield"]`
- Runes: Cartas con `cardType: ["Rune"]` o nombre termina en "Rune"
- Main Deck: Todo lo demás (Unit, Spell, Gear)

---

## Asset Repositories

### Pokemon TCG Type Icons (SVG)

| Repositorio | URL | Licencia |
|-------------|-----|----------|
| **duiker101/pokemon-type-svg-icons** | [GitHub](https://github.com/duiker101/pokemon-type-svg-icons) | MIT |
| **partywhale/pokemon-type-icons** | [GitHub](https://github.com/partywhale/pokemon-type-icons) | Recreation de BDSP/SV |
| **waydelyle/pokemon-assets** | [GitHub](https://github.com/waydelyle/pokemon-assets) | MIT |

**Iconos necesarios (11 tipos TCG)**:
- Fire, Water, Grass, Electric, Psychic, Fighting
- Dark, Steel, Dragon, Fairy, Colorless

### Riftbound Icons

| Recurso | URL | Notas |
|---------|-----|-------|
| **Riot Developer Portal** | [API](https://developer.riotgames.com/docs/riftbound) | Requiere API key approval |
| **OwenMelbz/Riftbound Cards Gist** | [Gist](https://gist.github.com/OwenMelbz/e04dadf641cc9b81cb882b4612343112) | JSON con 310+ cartas |
| **Piltover Archive** | [piltoverarchive.com](https://piltoverarchive.com/) | Card library + deck builder |

**Dominios a iconizar (6)**:
- Fury, Calm, Mind, Body, Order, Chaos

**Card Types a iconizar**:
- Unit, Spell, Gear, Rune, Legend, Battlefield

---

## Architecture Impact

### Frontend Changes

#### Nuevos Componentes
- [ ] `DeckImportModal.jsx` - Modal para pegar deck string con preview
- [ ] `DeckValidationIndicator.jsx` - Indicador visual de validez (inline, no modal)
- [ ] `DeckFilterBar.jsx` - Barra de filtros con iconos toggle (grayscale)
- [ ] `DeckTagBadges.jsx` - Badges de tags con imágenes (no emojis)
- [ ] `OriginalBadge.jsx` - Badge "El Primero" para decks originales
- [ ] `DeckTabs.jsx` - Tabs "Mis Decks" | "Comunidad"
- [ ] `DeckReactionButtons.jsx` - Solo 👍/👎 (thumbs up/down)

#### Componentes a Modificar
- [ ] `DeckList.jsx` - Añadir tabs, mostrar reacciones en tiempo real
- [ ] `DeckBuilder.jsx` - Import, filtros, validación, interacciones de cards
- [ ] `DeckDetail.jsx` - Modo read-only para decks ajenos, 👍/👎

#### Interacciones de Cartas en DeckBuilder

| Acción | Resultado |
|--------|-----------|
| **Left Click** | Añadir 1 copia de la carta al deck |
| **Right Click** | Reducir 1 copia de la carta del deck |
| **Ctrl + Click** | Abrir input para elegir cantidad deseada |
| **Drag & Drop** | Arrastrar carta desde resultados al deck |

#### Assets Necesarios
```
/assets/icons/
├── pokemon/
│   ├── types/
│   │   ├── fire.svg
│   │   ├── water.svg
│   │   ├── grass.svg
│   │   ├── electric.svg
│   │   ├── psychic.svg
│   │   ├── fighting.svg
│   │   ├── dark.svg
│   │   ├── steel.svg
│   │   ├── dragon.svg
│   │   ├── fairy.svg
│   │   └── colorless.svg
│   └── supertypes/
│       ├── pokemon.svg (pokeball)
│       ├── trainer.svg (bag)
│       └── energy.svg (lightning)
├── riftbound/
│   ├── domains/
│   │   ├── fury.svg
│   │   ├── calm.svg
│   │   ├── mind.svg
│   │   ├── body.svg
│   │   ├── order.svg
│   │   └── chaos.svg
│   └── cardtypes/
│       ├── unit.svg
│       ├── spell.svg
│       ├── gear.svg
│       ├── rune.svg
│       ├── legend.svg
│       └── battlefield.svg
└── badges/
    ├── original.svg (El Primero)
    └── invalid.svg (warning)
```

### Backend Changes

#### Nuevos Endpoints
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/decks/parse` | Parsear string, detectar TCG/formato, preview | No |
| GET | `/api/decks/community` | Listar decks públicos | No |
| POST | `/api/decks/:id/vote` | Votar 👍/👎 en deck | No* |
| GET | `/api/decks/:id/votes` | Obtener votos del deck | No |

*Votos anónimos permitidos (fingerprint-based como reactions)

#### Manejo de Reprints (CRÍTICO para validación)

En Pokemon TCG, cartas con el **mismo nombre pero de diferentes sets** cuentan como la misma carta para el límite de copias.

**Ejemplo**:
```
2 Professor's Research SVI 189
2 Professor's Research PAL 172
= 4 copias de "Professor's Research" (válido)

3 Professor's Research SVI 189
2 Professor's Research PAL 172
= 5 copias de "Professor's Research" (INVÁLIDO - excede límite de 4)
```

**Implementación**:
```javascript
function validateCopyLimits(deck, format) {
  const maxCopies = format === 'glc' ? 1 : 4
  const errors = []

  // Agrupar cartas por NOMBRE (ignorando set/número)
  const cardsByName = {}
  deck.cards.forEach(card => {
    const baseName = normalizeCardName(card.name)
    if (!cardsByName[baseName]) {
      cardsByName[baseName] = { total: 0, cards: [] }
    }
    cardsByName[baseName].total += card.quantity
    cardsByName[baseName].cards.push(card)
  })

  // Validar límites
  Object.entries(cardsByName).forEach(([name, data]) => {
    // Excepción: Basic Energy no tiene límite
    const isBasicEnergy = data.cards[0].subtypes?.includes('Basic') &&
                          data.cards[0].supertype === 'Energy'

    if (!isBasicEnergy && data.total > maxCopies) {
      errors.push({
        code: 'EXCEEDS_COPY_LIMIT',
        message: `${name}: ${data.total}/${maxCopies} copias`,
        cards: data.cards.map(c => c.cardId)
      })
    }
  })

  return errors
}

function normalizeCardName(name) {
  // Normalizar variantes como "Professor's Research (Professor Oak)"
  // a solo "Professor's Research" para conteo correcto
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim()
}
```

**UI/UX para Reprints**:
```
┌─────────────────────────────────────────────────────────────┐
│  Tu Deck                                                    │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  Professor's Research                         [4/4] ✓       │
│    ├─ SVI 189 x2                                            │
│    └─ PAL 172 x2                                            │
│                                                              │
│  Boss's Orders                                [5/4] ⚠️      │
│    ├─ PAL 172 x3                                            │
│    └─ BRS 132 x2  ← Problema: excede límite                 │
└─────────────────────────────────────────────────────────────┘

Comportamiento:
- Agrupar visualmente reprints del mismo nombre
- Mostrar contador total vs límite
- Marcar en amarillo si excede
- Permitir guardar pero indicar que es inválido
```

**Casos especiales Pokemon TCG**:
| Caso | Regla |
|------|-------|
| Professor's Research (Oak) vs (Turo) | **Mismo nombre base** → cuentan juntos |
| Pikachu vs Pikachu ex | **Nombres diferentes** → se cuentan separado |
| Boss's Orders (Cyrus) vs (Ghetsis) | **Mismo nombre base** → cuentan juntos |
| Basic Energy (cualquier set) | **Sin límite** |

---

#### Validaciones por Formato (en tiempo real)

```javascript
// Detectar formato automáticamente mientras se construye
function detectPokemonFormat(deck) {
  const hasRuleBox = deck.cards.some(c => c.subtypes?.some(s =>
    ['ex', 'V', 'VSTAR', 'VMAX', 'GX', 'EX', 'Radiant'].includes(s)
  ))
  const hasAceSpec = deck.cards.some(c => c.subtypes?.includes('ACE SPEC'))
  const pokemonTypes = new Set(deck.cards
    .filter(c => c.supertype === 'Pokémon')
    .flatMap(c => c.types || [])
  )
  const isSingleton = deck.cards.every(c => c.quantity === 1 || c.supertype === 'Energy')

  if (isSingleton && !hasRuleBox && !hasAceSpec && pokemonTypes.size === 1) {
    return 'glc'
  }
  // Check card pool for legacy vs standard vs expanded...
  return 'standard' // default
}
```

#### Schema Modifications (Deck.js)
```javascript
{
  // Existing fields...

  // Formato detectado/seleccionado
  format: {
    type: String,
    enum: ['standard', 'expanded', 'glc', 'legacy', 'unlimited', 'constructed'],
    default: 'standard'
  },

  // Indicador de deck original (primer hash)
  isOriginal: {
    type: Boolean,
    default: false
  },

  // Errores de validación (para mostrar sin bloquear)
  validationErrors: [{
    code: String,  // 'NEEDS_BASIC_POKEMON', 'EXCEEDS_COPY_LIMIT', etc
    message: String,
    cardId: String  // opcional, para errores específicos de carta
  }],

  // Estado de validez
  isValid: {
    type: Boolean,
    default: true
  },

  // Auto-tags generados (actualizados en tiempo real)
  autoTags: [{
    value: String,    // 'fire', 'water', 'fury', 'calm'
    category: String  // 'energy-type', 'pokemon-type', 'domain', 'mechanic'
  }],

  // Votos (👍/👎 solamente)
  votes: {
    up: { type: Number, default: 0 },
    down: { type: Number, default: 0 }
  },

  // Estructura expandida para Riftbound
  structure: {
    // Pokemon
    pokemon: Number,
    trainer: Number,
    energy: Number,
    // Riftbound
    mainDeck: Number,
    legend: { cardId: String, name: String, domains: [String] },
    battlefields: [{ cardId: String, name: String }],
    runes: [{ cardId: String, name: String }],
    sideboard: [{ cardId: String, name: String, quantity: Number }]
  }
}
```

---

## UI/UX Design

### Principios (CRÍTICO)
- **NO popups/modals para errores** - Solo indicadores inline
- **Imágenes limpias, NO emojis** - SVGs elegantes para tipos/tags
- **Toggle visual** - Iconos a color = activo, grayscale = inactivo
- **Tabs simples** - "Mis Decks" | "Comunidad", sin animaciones
- **Feedback en tiempo real** - Tags y formato se actualizan mientras editas

### Filtros Visuales (DeckBuilder)

```
┌─────────────────────────────────────────────────────────────┐
│  Tipos:     [🔥] [💧] [🌿] [⚡] [🔮] [👊] [🌙] [⚙️] [🐉] [⭐]│
│  Supertipos: [⚪] [🎒] [⚡]                                  │
│               Poke  Trainer Energy                          │
│                                                             │
│  Formato detectado: [Standard] ← Actualiza en tiempo real   │
│  Tags auto: [Fire] [Electric] [ex]                          │
└─────────────────────────────────────────────────────────────┘

Comportamiento:
- Click en icono → Toggle grayscale
- Grayscale = ese tipo NO se muestra en resultados de búsqueda
- Formato cambia automáticamente basado en cartas seleccionadas
- Tags se actualizan en vivo
```

### Card Interactions

```
┌────────────────────────────────────────┐
│  Search Results         │  Your Deck   │
│  ┌─────┐ ┌─────┐       │  ┌─────┐     │
│  │Card │ │Card │       │  │Card │ x4  │
│  │ A   │ │ B   │  ──►  │  │ A   │     │
│  └─────┘ └─────┘       │  └─────┘     │
│   ▲                     │   ▲          │
│   │                     │   │          │
│   Left-click: +1        │   Right-click: -1
│   Ctrl+click: set qty   │   Ctrl+click: set qty
│   Drag: add to deck     │              │
└────────────────────────────────────────┘
```

### Indicador de Validez y Formato (inline, tiempo real)

```
┌─────────────────────────────────────────────────────────────┐
│  Deck: Mi Deck Pikachu                                      │
│  ─────────────────────────────────────────────────────────  │
│  Formato: [Standard ▼]  Estado: [52/60] ⚠️                  │
│                                                              │
│  ⚠️ Faltan 8 cartas para 60                                 │
│  ⚠️ Necesita al menos 1 Pokémon Básico                      │
│                                                              │
│  Tags: [🔥 Fire] [⚡ Electric] [ex]  ← Actualizan en vivo   │
└─────────────────────────────────────────────────────────────┘

El formato cambia automáticamente:
- Si quitas todos los Rule Box y pones singleton → GLC detectado
- Si agregas un ex → Standard/Expanded
```

### Vista Personal de Decks (tiempo real)

```
┌─────────────────────────────────────────────────────────────┐
│  [Mis Decks]  [Comunidad]                                   │
│  ──────────                                                  │
│                                                              │
│  ┌────────────────────────────────────────────┐             │
│  │  🏆 Pikachu Control        [Standard]      │             │
│  │  ────────────────────────────────────────  │             │
│  │  [🔥] [⚡]                                 │             │
│  │                                            │             │
│  │  👍 24  👎 3   💬 12 comentarios           │  ← Real-time│
│  │  👁️ 156 vistas   📋 8 copias              │             │
│  └────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### Reacciones (Solo 👍/👎)

```
┌─────────────────────────────────────────────────────────────┐
│  Deck por @OtroUsuario                                      │
│  ─────────────────────────────────────────────────────────  │
│                                                              │
│  [👍 24]  [👎 3]     ← Click para votar (toggle)            │
│                                                              │
│  Solo un voto por usuario (up o down, no ambos)             │
│  Anónimos pueden votar (fingerprint-based)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Auto-Tagging Logic (Tiempo Real)

### Pokemon Decks
```javascript
function generatePokemonAutoTags(deck) {
  const tags = []

  // Por tipos de energía usados
  const energyTypes = new Set()
  deck.cards.forEach(card => {
    if (card.supertype === 'Energy' && card.subtypes?.includes('Basic')) {
      energyTypes.add(card.name.replace(' Energy', '').toLowerCase())
    }
  })
  energyTypes.forEach(type => tags.push({ value: type, category: 'energy-type' }))

  // Por tipos de Pokémon
  const pokemonTypes = new Set()
  deck.cards.forEach(card => {
    if (card.supertype === 'Pokémon') {
      card.types?.forEach(type => pokemonTypes.add(type.toLowerCase()))
    }
  })
  pokemonTypes.forEach(type => tags.push({ value: type, category: 'pokemon-type' }))

  // Por mecánicas especiales
  if (deck.cards.some(c => c.subtypes?.includes('ex')))
    tags.push({ value: 'ex', category: 'mechanic' })
  if (deck.cards.some(c => c.subtypes?.includes('V')))
    tags.push({ value: 'v', category: 'mechanic' })
  if (deck.cards.some(c => c.subtypes?.includes('VSTAR')))
    tags.push({ value: 'vstar', category: 'mechanic' })
  if (deck.cards.some(c => c.subtypes?.includes('Radiant')))
    tags.push({ value: 'radiant', category: 'mechanic' })
  if (deck.cards.some(c => c.subtypes?.includes('ACE SPEC')))
    tags.push({ value: 'ace-spec', category: 'mechanic' })

  return tags
}

function detectFormat(deck) {
  const hasRuleBox = deck.cards.some(c =>
    c.subtypes?.some(s => ['ex', 'V', 'VSTAR', 'VMAX', 'GX', 'EX', 'Radiant'].includes(s))
  )
  const hasAceSpec = deck.cards.some(c => c.subtypes?.includes('ACE SPEC'))
  const pokemonTypes = new Set(deck.cards.filter(c => c.supertype === 'Pokémon').flatMap(c => c.types || []))
  const maxCopies = Math.max(...deck.cards.map(c => c.quantity))
  const isSingleton = maxCopies === 1 || deck.cards.every(c =>
    c.quantity === 1 || (c.supertype === 'Energy' && c.subtypes?.includes('Basic'))
  )

  if (isSingleton && !hasRuleBox && !hasAceSpec && pokemonTypes.size === 1) {
    return 'glc'
  }
  return 'standard' // Default, puede refinarse con análisis de card pool
}
```

### Riftbound Decks
```javascript
function generateRiftboundAutoTags(deck) {
  const tags = []

  // Por dominios del Legend
  if (deck.structure?.legend?.domains) {
    deck.structure.legend.domains.forEach(domain => {
      tags.push({ value: domain.toLowerCase(), category: 'domain' })
    })
  }

  // Por Champion/Legend name
  if (deck.structure?.legend?.name) {
    tags.push({ value: deck.structure.legend.name.toLowerCase(), category: 'champion' })
  }

  return tags
}
```

---

## Decisiones Confirmadas

| Pregunta | Decisión |
|----------|----------|
| Límite de decks públicos por usuario | **Sin límite** |
| Sistema de reacciones | **Solo 👍/👎** (no emojis múltiples) |
| Formato de import Riftbound | **tcg-arena.fr style** (cantidad + nombre) |
| Iconos de tipos | **Usar repositorios MIT** (duiker101, partywhale) |
| Detección de formato | **Automática en tiempo real** |

---

## Acceptance Criteria

### Import
- [ ] Usuario puede pegar string y ver preview antes de crear
- [ ] Sistema detecta automáticamente si es Pokemon o Riftbound
- [ ] Sistema detecta formato (Standard, GLC, etc.) automáticamente
- [ ] Nombre es opcional (se genera uno si está vacío)
- [ ] Hash se calcula y compara con existentes
- [ ] Badge "El Primero" se asigna si hash es nuevo

### Interacciones de Cartas
- [ ] Left-click añade 1 copia
- [ ] Right-click reduce 1 copia
- [ ] Ctrl+click abre input de cantidad
- [ ] Drag & drop funciona para añadir cartas

### Filtros Visuales
- [ ] Iconos toggle muestran/ocultan tipos de cartas
- [ ] Grayscale indica filtro desactivado
- [ ] Cambios son instantáneos

### Validación y Tags (Tiempo Real)
- [ ] Errores se muestran inline, NO en modal/popup
- [ ] Deck se puede guardar aunque sea inválido
- [ ] Formato se detecta y actualiza en vivo
- [ ] Tags se generan y actualizan en vivo
- [ ] Indicador visual claro de estado (verde/amarillo)

### Reprints
- [ ] Cartas con mismo nombre de diferentes sets se agrupan visualmente
- [ ] Contador muestra total de copias vs límite (ej: "4/4")
- [ ] Validación cuenta reprints juntos para límite de copias
- [ ] Nombres con variantes (ej: "Professor's Research (Oak)") se normalizan

### Comunidad
- [ ] Tab "Comunidad" muestra solo decks públicos
- [ ] Decks ajenos abren en modo read-only
- [ ] Usuarios pueden comentar en decks públicos
- [ ] Sistema de votos 👍/👎 funciona (anónimos incluidos)

### Vista Personal
- [ ] Mis decks muestran votos en tiempo real
- [ ] Mis decks muestran conteo de comentarios en tiempo real
- [ ] Estadísticas (vistas, copias) visibles

---

## Estimated Complexity

| Área | Archivos | Dificultad |
|------|----------|------------|
| Import Modal + Parser | 3-4 | Media |
| Card Interactions (click/drag) | 2-3 | Media |
| Filtros Visuales | 2-3 | Baja |
| Validación por TCG/Formato | 3-4 | Alta |
| Detección de formato en tiempo real | 1-2 | Media |
| Auto-tagging tiempo real | 1-2 | Media |
| Tabs + Community | 2-3 | Baja |
| Sistema de votos 👍/👎 | 2-3 | Baja |
| Assets (iconos SVG) | 20+ | Baja |
| Real-time updates (Socket.io) | 2-3 | Media |

**Total archivos afectados**: ~20-25
**Riesgo**: Medio (el sistema de decks ya existe, es extensión)

---

## Implementation Status

> **Last Updated**: 2025-12-20 (Sprint by @raj)

### Completed (PRs Merged to Stage)

| Issue | PR | Description | Status |
|-------|-----|-------------|--------|
| #36 | [#80](https://github.com/manucruzleiva/TCGKB/pull/80) | Card Enrichment Service | ✅ Merged |
| #37 | [#81](https://github.com/manucruzleiva/TCGKB/pull/81) | Real-time validation with enriched cards | ✅ Merged |

### Implementation Details

#### Card Enrichment Service (`backend/src/services/cardEnricher.service.js`)

| Function | Purpose |
|----------|---------|
| `enrichDeckCards(cards, tcg)` | Batch enriches parsed cards with CardCache metadata |
| `hasRuleBox(card)` | Checks if card is ex, V, VSTAR, VMAX, Radiant |
| `isBasicPokemon(card)` | Checks if card is Basic Pokémon using subtypes |
| `isAceSpec(card)` | Checks if card is ACE SPEC using subtypes |
| `isStandardLegal(card, marks)` | Checks regulation mark validity |
| `getPokemonTypes(cards)` | Extracts unique Pokémon types for GLC validation |

**Performance**: <500ms for 60-card deck (uses `$in` batch query)

#### Modified Controller (`backend/src/controllers/deck.controller.js`)

The `parseDeck` endpoint now:
1. Parses deck string → `deckParser.service.js`
2. Enriches cards with metadata → `cardEnricher.service.js`
3. Validates with enriched data → `deckValidator.js`
4. Returns enrichment stats in response

---

## GitHub Project Items (Tickets)

### Epic: Deck Manager V2

| # | Título | Prioridad | Estimación | Status |
|---|--------|-----------|------------|--------|
| 1 | Crear endpoint POST /api/decks/parse con detección de TCG/formato | Alta | 4h | ✅ Done |
| 2 | Implementar DeckImportModal con preview y detección automática | Alta | 5h | ✅ Done |
| 3 | Añadir validación Pokemon Standard (60 cards, 4 copies, ACE SPEC, Radiant) | Alta | 3h | ✅ Done |
| 3b | Implementar agrupación de reprints por nombre para validación de copias | Alta | 3h | ✅ Done |
| 4 | Añadir validación Pokemon GLC (singleton, single type, no rule box) | Alta | 3h | ✅ Done |
| 5 | Añadir validación Riftbound (40+1+3+12, domain restriction) | Alta | 3h | ✅ Done |
| 6 | Implementar detección de formato en tiempo real | Alta | 3h | ✅ Done |
| 7 | Implementar auto-tagging en tiempo real | Media | 3h | Pending |
| 8 | Crear DeckValidationIndicator component (inline, real-time) | Media | 2h | ✅ Done |
| 9 | Implementar card interactions (left/right/ctrl click, drag&drop) | Media | 4h | Pending |
| 10 | Implementar filtros visuales con iconos toggle + grayscale | Media | 4h | Pending |
| 11 | Integrar SVG assets de tipos Pokemon (desde repositorios MIT) | Media | 2h | Pending |
| 12 | Crear SVG assets de dominios Riftbound | Media | 3h | Pending |
| 13 | Añadir tabs "Mis Decks" / "Comunidad" en DeckList | Media | 2h | Pending |
| 14 | Crear endpoint GET /api/decks/community | Media | 2h | Pending |
| 15 | Implementar sistema de votos 👍/👎 (backend + frontend) | Media | 3h | ✅ Done |
| 16 | Implementar modo read-only para decks ajenos | Baja | 2h | Pending |
| 17 | Añadir real-time updates para votos/comentarios (Socket.io) | Media | 3h | Pending |
| 18 | Añadir badge "El Primero" para decks originales | Baja | 1h | Pending |
| 19 | Añadir i18n para todas las nuevas strings | Media | 2h | Partial |
| 20 | Tests E2E para import flow y validaciones | Baja | 4h | Pending |
| 21 | **Card Enrichment Service** (#36) | Alta | 3h | ✅ Done |
| 22 | **Real-time Validation** (#37) | Alta | 2h | ✅ Done |

**Total estimado**: ~61 horas de desarrollo
**Completado**: ~35 horas (~57%)

---

## References

### Pokemon TCG
- [Pokemon.com Deckbuilding Guide](https://www.pokemon.com/us/strategy/designing-a-deck-from-scratch)
- [JustInBasil Card Limits](https://www.justinbasil.com/guide/limits)
- [Gym Leader Challenge Rules](https://gymleaderchallenge.com/rules)
- [GLC FAQ](https://gymleaderchallenge.com/faq)
- [Bulbapedia GLC](https://bulbapedia.bulbagarden.net/wiki/Gym_Leader_Challenge_format_(TCG))
- [Bulbapedia Legacy](https://bulbapedia.bulbagarden.net/wiki/Legacy_format_(TCG))
- [2025 Expanded Format](https://www.pokemon.com/us/strategy/a-deep-dive-into-the-2025-pokemon-tcg-expanded-format)

### Riftbound TCG
- [Riftbound Core Rules](https://riftbound.gg/core-rules/)
- [Riftbound Deckbuilding 101](https://riftbound.gg/deckbuilding-101-building-your-first-riftbound-deck/)
- [Riot Riftbound Developer Portal](https://developer.riotgames.com/docs/riftbound)
- [Riftbound Deck Construction Wiki](https://riftbound.wiki.fextralife.com/Deck+Construction)
- [Piltover Archive](https://piltoverarchive.com/)

### Asset Repositories
- [duiker101/pokemon-type-svg-icons](https://github.com/duiker101/pokemon-type-svg-icons) - MIT License
- [partywhale/pokemon-type-icons](https://github.com/partywhale/pokemon-type-icons) - SVG icons
- [waydelyle/pokemon-assets](https://github.com/waydelyle/pokemon-assets) - MIT License
- [OwenMelbz/Riftbound Cards Gist](https://gist.github.com/OwenMelbz/e04dadf641cc9b81cb882b4612343112) - Card data JSON
