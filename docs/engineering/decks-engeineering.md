# Deck Builder - Engineering Documentation

> **Engineering Documentation** - Complete technical reference for Deck Builder feature
>
> **Last Updated:** 2025-12-24
>
> **Status:** ✅ Production Ready

---

## Table of Contents

1. [Technical Wireframe](#technical-wireframe)
2. [Architecture Overview](#architecture-overview)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Component Reference](#component-reference)
5. [Implementation History](#implementation-history)
6. [Performance & Security](#performance--security)

---

## Technical Wireframe

### Complete System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DECK BUILDER FEATURE                                │
│                          Full Stack Architecture                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  FRONTEND LAYER                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  DeckBuilder.jsx (Main Component - 1065 lines)                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  STATE MANAGEMENT                                             │   │   │
│  │  │  • name, description, isPublic                                │   │   │
│  │  │  • cards: [{cardId, quantity, name, supertype, imageSmall}]  │   │   │
│  │  │  • tcgSystem: 'pokemon' | 'riftbound' (locked on first card)│   │   │
│  │  │  • tags: string[] (max 10)                                    │   │   │
│  │  │  • searchQuery, searchResults, searching                      │   │   │
│  │  │  • activeTypes, activeDomains (visual filters)               │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  CARD INTERACTIONS                                            │   │   │
│  │  │  Left Click    → addCard(+1)                                  │   │   │
│  │  │  Right Click   → removeCard(-1)                               │   │   │
│  │  │  Ctrl+Click    → setQuantity(input)                           │   │   │
│  │  │  Drag & Drop   → handleCardDrop()                             │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │  VALIDATION LOGIC                                             │   │   │
│  │  │  Pokemon TCG:                                                 │   │   │
│  │  │    • 60 cards total (min)                                     │   │   │
│  │  │    • 4 copies per card (60 for basic energy)                 │   │   │
│  │  │    • Grouped by supertype (Pokémon/Trainer/Energy)           │   │   │
│  │  │  Riftbound TCG:                                               │   │   │
│  │  │    • 40 main + 1 legend + 3 battlefields + 12 runes = 56     │   │   │
│  │  │    • 3 copies per non-rune card                              │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ Uses                                    │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SUB-COMPONENTS                                                      │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────┐ │   │
│  │  │ DeckImportModal    │  │ DeckCardInteractive│  │ TypeIcon /    │ │   │
│  │  │ (476 lines)        │  │ (306 lines)        │  │ DomainIcon    │ │   │
│  │  │                    │  │                    │  │               │ │   │
│  │  │ • Paste deck text  │  │ • Card UI with    │  │ • SVG icons   │ │   │
│  │  │ • Real-time parse  │  │   interactions     │  │ • Filter bars │ │   │
│  │  │ • Format detection │  │ • Drag/drop       │  │ • Grayscale   │ │   │
│  │  │ • Preview & import │  │ • Quantity input  │  │   toggle      │ │   │
│  │  └────────────────────┘  └────────────────────┘  └───────────────┘ │   │
│  │  ┌────────────────────┐  ┌────────────────────┐  ┌───────────────┐ │   │
│  │  │ DeckAutoTags       │  │ VoteButtons        │  │ DeckDropZone  │ │   │
│  │  │                    │  │                    │  │               │ │   │
│  │  │ • Auto-detect tags │  │ • 👍/👎 voting    │  │ • Drag target │ │   │
│  │  │ • Type icons       │  │ • Real-time counts │  │ • Visual      │ │   │
│  │  │ • Domain icons     │  │ • Socket.io        │  │   feedback    │ │   │
│  │  └────────────────────┘  └────────────────────┘  └───────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    │ API Calls                               │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  SERVICES LAYER                                                      │   │
│  │  ┌────────────────────┐  ┌────────────────────┐                     │   │
│  │  │ deckService.js     │  │ cardService.js     │                     │   │
│  │  │ (328 lines)        │  │ (120 lines)        │                     │   │
│  │  │                    │  │                    │                     │   │
│  │  │ • createDeck()     │  │ • searchCards()    │                     │   │
│  │  │ • updateDeck()     │  │ • getCardsByIds()  │                     │   │
│  │  │ • parseDeck()      │  │ • Offline cache    │                     │   │
│  │  │ • exportDeck()     │  │   (IndexedDB)      │                     │   │
│  │  │ • voteDeck()       │  │                    │                     │   │
│  │  │ • copyDeck()       │  │                    │                     │   │
│  │  └────────────────────┘  └────────────────────┘                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────── ───┘
                                     │
                                     │ HTTP/REST
                                     │
┌────────────────────────────────────▼─────────────────────────────────────────┐
│  BACKEND LAYER                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  ROUTES (deck.routes.js - 50 lines)                                │     │
│  │                                                                     │     │
│  │  Public Routes (optionalAuth):                                     │     │
│  │    GET  /decks                    - List decks                     │     │
│  │    GET  /decks/:id                - View deck                      │     │
│  │    POST /decks/parse              - Parse deck string (no auth!)   │     │
│  │    GET  /:id/export               - Export deck                    │     │
│  │                                                                     │     │
│  │  Protected Routes (auth required):                                 │     │
│  │    POST   /decks                  - Create deck                    │     │
│  │    PUT    /:id                    - Update deck                    │     │
│  │    DELETE /:id                    - Delete deck                    │     │
│  │    POST   /:id/copy               - Copy/fork deck                 │     │
│  │    POST   /:id/vote               - Vote deck                      │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                     │                                        │
│                                     │ Controller                             │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  CONTROLLER (deck.controller.js - 1256 lines)                      │     │
│  │  ┌──────────────────────────────────────────────────────────────┐ │     │
│  │  │  KEY FUNCTIONS                                                │ │     │
│  │  │                                                                │ │     │
│  │  │  createDeck()        - Create with duplicate detection        │ │     │
│  │  │    ├─ generateDeckHash() for compositionHash                  │ │     │
│  │  │    ├─ enrichDeckCards() (optional)                            │ │     │
│  │  │    └─ Check isOriginal (first with this hash)                │ │     │
│  │  │                                                                │ │     │
│  │  │  parseDeck()         - Parse deck string                      │ │     │
│  │  │    ├─ detectInputFormat (TCG Live/Pocket/Riftbound)           │ │     │
│  │  │    ├─ parseFormat() extract cards                             │ │     │
│  │  │    ├─ detectTCG() identify Pokemon/Riftbound                  │ │     │
│  │  │    ├─ detectFormat() Standard/Expanded/GLC                    │ │     │
│  │  │    ├─ enrichDeckCards() add metadata                          │ │     │
│  │  │    ├─ validateDeck() check legality                           │ │     │
│  │  │    └─ Return reprintGroups with violations                    │ │     │
│  │  │                                                                │ │     │
│  │  │  updateDeck()        - Update + recalculate hash              │ │     │
│  │  │  exportDeck()        - Export to TCG Live/Arena format        │ │     │
│  │  │  voteDeck()          - Vote system (up/down, fingerprint)     │ │     │
│  │  │  copyDeck()          - Fork with copiedFrom link              │ │     │
│  │  └──────────────────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                     │                                        │
│                                     │ Uses                                   │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  UTILITIES & SERVICES                                              │     │
│  │  ┌────────────────────┐  ┌────────────────────┐                   │     │
│  │  │ deckParser.js      │  │ cardEnricher.js    │                   │     │
│  │  │ (614 lines)        │  │                    │                   │     │
│  │  │                    │  │                    │                   │     │
│  │  │ • Format detection │  │ • enrichDeckCards()│                   │     │
│  │  │ • TCG detection    │  │ • hasRuleBox()     │                   │     │
│  │  │ • Confidence score │  │ • isBasicPokemon() │                   │     │
│  │  │ • Card extraction  │  │ • isAceSpec()      │                   │     │
│  │  │                    │  │ • Batch $in query  │                   │     │
│  │  └────────────────────┘  └────────────────────┘                   │     │
│  │  ┌────────────────────┐  ┌────────────────────┐                   │     │
│  │  │ validation.js      │  │ rateLimiter.js     │                   │     │
│  │  │                    │  │                    │                   │     │
│  │  │ • validateCardId() │  │ • collectionLimiter│                   │     │
│  │  │ • sanitizeHtml()   │  │ • buildDisarmLimiter                   │     │
│  │  │ • validateQuantity()│  │ • syncLimiter      │                   │     │
│  │  │ • XSS prevention   │  │ • DoS prevention   │                   │     │
│  │  └────────────────────┘  └────────────────────┘                   │     │
│  └────────────────────────────────────────────────────────────────────┘     │
│                                     │                                        │
│                                     │ Database                               │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  MODELS (Deck.js - 150+ lines)                                     │     │
│  │  ┌──────────────────────────────────────────────────────────────┐ │     │
│  │  │  SCHEMA                                                       │ │     │
│  │  │  {                                                            │ │     │
│  │  │    name: String (max 100)                                    │ │     │
│  │  │    description: String (max 2000)                            │ │     │
│  │  │    cards: [{                                                 │ │     │
│  │  │      cardId: String,                                         │ │     │
│  │  │      quantity: Number (1-60),                                │ │     │
│  │  │      name: String,                                           │ │     │
│  │  │      supertype: String,  // Pokemon/Trainer/Energy or       │ │     │
│  │  │                          // Legend/Battlefield/Rune          │ │     │
│  │  │      imageSmall: String                                      │ │     │
│  │  │    }],                                                        │ │     │
│  │  │    userId: ObjectId (ref: User),                             │ │     │
│  │  │    isPublic: Boolean,                                        │ │     │
│  │  │    tags: [String],  // Predefined list                       │ │     │
│  │  │    views: Number,                                            │ │     │
│  │  │    copies: Number,                                           │ │     │
│  │  │    compositionHash: String,  // Duplicate detection          │ │     │
│  │  │    isOriginal: Boolean,      // "El Primero" badge           │ │     │
│  │  │    copiedFrom: ObjectId,     // Link to original             │ │     │
│  │  │    tcgSystem: 'pokemon' | 'riftbound'                        │ │     │
│  │  │  }                                                            │ │     │
│  │  │                                                               │ │     │
│  │  │  Virtuals:                                                   │ │     │
│  │  │    • totalCards - Sum of quantities                          │ │     │
│  │  │    • breakdown - {pokemon, trainer, energy} counts           │ │     │
│  │  └──────────────────────────────────────────────────────────────┘ │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     │ Stores
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│  DATABASE LAYER                                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────┐     │
│  │  MongoDB Collections                                                │     │
│  │                                                                     │     │
│  │  decks                                                              │     │
│  │  ├── _id: ObjectId                                                 │     │
│  │  ├── name, description, isPublic                                   │     │
│  │  ├── cards: [{cardId, quantity, ...}]                              │     │
│  │  ├── userId → User reference                                       │     │
│  │  ├── compositionHash (indexed for duplicate detection)             │     │
│  │  ├── isOriginal (indexed for badge queries)                        │     │
│  │  └── tcgSystem (indexed for TCG-specific queries)                  │     │
│  │                                                                     │     │
│  │  deckVotes                                                          │     │
│  │  ├── deckId → Deck reference                                       │     │
│  │  ├── userId → User reference (optional)                            │     │
│  │  ├── fingerprint: String (for anonymous)                           │     │
│  │  └── vote: 'up' | 'down'                                           │     │
│  │                                                                     │     │
│  │  cardCache (for enrichment)                                        │     │
│  │  ├── id: String (cardId)                                           │     │
│  │  ├── name, supertype, subtypes                                     │     │
│  │  ├── types, images                                                 │     │
│  │  └── tcgSystem                                                     │     │
│  └────────────────────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│  REAL-TIME LAYER (Socket.io)                                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Events:                                                                     │
│    • deck:vote:updated → { deckId, counts: { up, down } }                   │
│    • deck:comment:new  → { deckId, comment }                                │
│                                                                               │
│  Listeners (Frontend):                                                       │
│    • VoteButtons.jsx - Updates vote counts without page refresh             │
│    • DeckDetail.jsx  - Shows new comments in real-time                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### System Components

DM-V2 is a major enhancement to the deck management system adding community features, real-time validation, and interactive card management.

**V3 Development** (In Progress - Pre-Phase 0):
- Input validation framework
- V3-specific rate limiting
- MongoDB transaction framework (pending)
- Collection schema V3 (pending)

## Components Implemented

### 1. Community Decks (#28, #29)

**Backend**: `backend/src/controllers/deck.controller.js`
- `getCommunityDecks()` - Lists public decks with pagination, filtering, sorting
- Query params: `page`, `limit`, `tcg`, `format`, `sort`
- Sort options: `recent` (default), `popular` (viewCount), `votes`
- Aggregates vote counts from DeckVote collection

**Frontend**: `frontend/src/pages/DeckList.jsx`
- Tabbed interface: "Mis Mazos" / "Comunidad"
- Separate data loading for each tab
- Active filters display with clear button
- Pagination with Previous/Next

### 2. Auto-Tagging (#22)

**Component**: `frontend/src/components/decks/DeckAutoTags.jsx`

Generates tags automatically from deck content:
- **Format**: standard, expanded, glc, unlimited
- **Energy Type**: Based on energy cards (fire, water, grass, etc.)
- **Pokemon Type**: Based on Pokemon card types
- **Mechanic**: ex-focused, v-focused, vstar, vmax, single-prize, lost-zone
- **Domain** (Riftbound): fury, calm, mind, body, order, chaos
- **Champion** (Riftbound): Extracted from card names

Uses `TypeIcon` and `DomainIcon` for visual display.

### 3. Card Interactions (#23)

**Component**: `frontend/src/components/decks/DeckCardInteractive.jsx`

Interactive card management:
- **Left click**: +1 quantity
- **Right click**: -1 quantity (with confirmation at 0)
- **Ctrl + click**: Set exact quantity via dialog
- **Drag & drop**: Move cards between zones

Includes `DeckDropZone` component for drag targets.

### 4. Visual Filters (#24)

**Components**:
- `frontend/src/components/icons/TypeIcon.jsx` - TypeFilterBar
- `frontend/src/components/icons/DomainIcon.jsx` - DomainFilterBar

Filter bars with grayscale toggle:
- Active types show in color
- Inactive types show grayscale
- Click to toggle filter
- Multiple selections allowed

### 5. SVG Type Icons (#26, #27)

**Pokemon Types** (`TypeIcon.jsx`):
- 11 types: fire, water, grass, electric, psychic, fighting, dark, steel, dragon, fairy, colorless
- SVG paths with proper colors
- Tailwind sizing classes

**Riftbound Domains** (`DomainIcon.jsx`):
- 6 domains: fury, calm, mind, body, order, chaos
- SVG icons with domain colors
- Same interface as TypeIcon

### 6. Read-Only Mode (#31)

**Component**: `frontend/src/pages/DeckDetail.jsx`

```javascript
const isOwner = user && deck && (deck.userId._id === user._id || deck.userId === user._id)
```

- Non-owners see: Copy, Export buttons only
- Owners/Admins see: Edit, Delete buttons
- Cards display but not editable for non-owners

### 7. Real-Time Updates (#32)

**Backend**: Socket.io broadcasts in deck.controller.js
```javascript
io.emit('deck:vote:updated', { deckId, counts })
```

**Frontend**: Socket listeners in components
- `VoteButtons.jsx`: Listens to `deck:vote:updated`
- Updates vote counts without page refresh
- Works for all viewers of same deck

### 8. Badge "El Primero" (#33)

**Schema**: `isOriginal` field on Deck model

**Display**:
- `DeckList.jsx`: Shows trophy emoji with tooltip
- `DeckDetail.jsx`: Shows badge near deck name

Computed on deck creation based on card hash uniqueness.

### 9. Voting System

**Backend**:
- `voteDeck()` - Toggle vote (up/down)
- `getDeckVotes()` - Get vote counts
- Supports both authenticated and anonymous (fingerprint) voting
- DeckVote model with user/fingerprint reference

**Frontend**: `VoteButtons.jsx`
- Upvote/downvote buttons with counts
- Real-time updates via Socket.io
- Optimistic UI updates

## Architecture

```
DeckList.jsx
├── DeckImportModal.jsx
│   └── DeckValidationIndicator.jsx
├── DeckAutoTags.jsx
│   ├── TypeIcon.jsx
│   └── DomainIcon.jsx
├── TypeFilterBar (from TypeIcon.jsx)
└── VoteButtons.jsx

DeckDetail.jsx
├── DeckAutoTags.jsx
├── VoteButtons.jsx
└── DeckCardInteractive.jsx
    └── DeckDropZone.jsx

DeckBuilder.jsx
├── DeckAutoTags.jsx
├── DeckValidationIndicator.jsx
└── DeckCardInteractive.jsx
```

## i18n Keys

All new strings added to both `es.js` and `en.js`:
- `decks.tabs.*` - Tab labels
- `decks.vote.*` - Voting labels
- `decks.originalBadge.*` - Badge tooltip
- `deckAutoTags.*` - All tag types and values

## Performance

- Community endpoint uses MongoDB aggregation for vote counts
- Batch card fetching for deck import (~5-10x faster)
- Socket.io for real-time without polling
- Type icons use inline SVG (no external requests)

## Security

- isOwner check prevents unauthorized edits
- Anonymous voting uses fingerprint to prevent spam
- Vote toggling prevents double-voting
- Public/private visibility enforced on all endpoints

---

## Sprint 2 Bug Fixes (2025-12-20)

### #85 - Bug Report Button Hidden in Modals

**Problem**: BugReportButton (z-40) was behind DeckImportModal (z-50).

**Fix**: `frontend/src/components/common/BugReportButton.jsx`
```javascript
// Changed from z-40 to z-[60]
className="fixed bottom-4 right-4 z-[60] ..."
```

### #86 - Import Cards Not Showing Thumbnails

**Problem**: handleImport set `imageSmall: null` instead of using enriched data.

**Fix**: `frontend/src/pages/DeckBuilder.jsx`
```javascript
imageSmall: card.imageSmall || null  // Use enriched image from parse
```

### #87 - Bulk Add Input Appends Instead of Replaces

**Problem**: Ctrl+click quantity input showed "13" when typing "3" (appended).

**Fix**: `frontend/src/components/decks/DeckCardInteractive.jsx`
```javascript
<input
  onFocus={(e) => e.target.select()}  // Auto-select for replacement
  ...
/>
```

### #88 - Error Saving Edited Deck

**Problems**:
1. Mongoose quantity validation failed (max: 4, but Energy needs up to 60)
2. `tcgSystem` not being saved on update

**Fixes**:
- `backend/src/models/Deck.js`: Changed `quantity.max` from 4 to 60
- `backend/src/controllers/deck.controller.js`: Added tcgSystem to updateDeck

```javascript
// Model
quantity: { max: 60 }  // Allow up to 60 for Basic Energy

// Controller
const { name, description, cards, isPublic, tags, importString, tcgSystem } = req.body
if (tcgSystem) deck.tcgSystem = tcgSystem
```

### #89 - Export Formatting Wrong

**Problem**: Export was just `quantity cardId` without proper sections.

**Fix**: `frontend/src/services/deckService.js` - Rewrote formatToTCGLive
```javascript
// Output format:
// Pokémon: 12
// 4 Pikachu ex
// ...
// Trainer: 36
// 4 Professor's Research
// ...
// Energy: 12
// 8 Electric Energy
```

### #91 - Filter Bar Not Switching Pokemon/Riftbound

**Problem**: Filter bar showed Pokemon types even for Riftbound decks.

**Fix**: `frontend/src/pages/DeckBuilder.jsx`
- Added `activeDomains` state and `toggleDomainFilter` function
- Conditional rendering based on `tcgSystem`

```jsx
{tcgSystem === 'riftbound' ? (
  <DomainFilterBar domains={ALL_DOMAINS} activeDomains={activeDomains} ... />
) : (
  <TypeFilterBar types={ALL_TYPES} activeTypes={activeTypes} ... />
)}
```

---

## Sprint 3 Fixes (2025-12-20)

### #137 - Right-Click Not Working on Deck Cards

**Problem**: Right-click on cards in deck mode didn't reduce quantity when hover overlay was visible.

**Fix**: `frontend/src/components/decks/DeckCardInteractive.jsx`
```jsx
{/* Hover controls - onContextMenu to handle right-click on overlay */}
<div
  className="absolute inset-0 bg-black/70 ..."
  onContextMenu={handleContextMenu}  // Added
>
```

### #138 - Escape Key for Quantity Input

**Problem**: No way to cancel quantity input without clicking outside.

**Fix**: `frontend/src/components/decks/DeckCardInteractive.jsx`
```javascript
const handleQuantityKeyDown = (e) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    setShowQuantityInput(false)
  }
}

// Added to both inputs
<input onKeyDown={handleQuantityKeyDown} ... />
```

### #124 - Header Navigation Refactor

**Problem**: All navigation hidden in hamburger menu, even on desktop.

**Fix**: `frontend/src/components/layout/Header.jsx`

**Desktop (lg+):**
- Logo is now a direct link to Home
- Visible nav: Cards, Decks, Roadmap
- "More" dropdown for secondary links (Artists, Changelog, Relationship Map)
- Active page highlighting with primary color

**Mobile (<lg):**
- Hamburger menu with all links
- Icon changes to X when open

```jsx
{/* Desktop Navigation */}
<nav className="hidden lg:flex items-center gap-1">
  <Link to="/catalog" className={activeStyles}>Cards</Link>
  <Link to="/decks" className={activeStyles}>Decks</Link>
  <Link to="/roadmap" className={activeStyles}>Roadmap</Link>
  <div>More ▼</div>
</nav>

{/* Mobile Hamburger */}
<div className="lg:hidden">
  <button>☰</button>
</div>
```

---

## Sprint 4 Fixes (2025-12-20)

### #144 - Auto-Name Deck on Import

**Problem**: Importing a deck without providing a name showed an error instead of auto-generating one.

**Fix**: `frontend/src/pages/DeckList.jsx`
```javascript
// Auto-generate name if not provided (#144)
const deckName = importName.trim() || (language === 'es' ? 'Mazo sin título' : 'Untitled Deck')
```

### #145 - Import Only Getting 52/60 Cards

**Problems**:
1. Parser rejected cards with quantity > 4 (energy cards lost)
2. Card IDs generated incorrectly (e.g., "gimmighoul-ssp-97" instead of "ssp-97")

**Fixes**: `backend/src/controllers/deck.controller.js`

```javascript
// 1. Allow up to 60 copies per card (was capped at 4)
if (quantity > 0 && quantity <= 60 && cardId) {
  existing.quantity = Math.min(existing.quantity + quantity, 60)
}

// 2. Properly extract SET-NUMBER format
// "4 Gimmighoul SSP 97" -> cardId: "ssp-97", name: "Gimmighoul"
const setNumberMatch = cardInfo.match(/^(.+?)\s+([A-Z]{2,5})\s+(\d{1,4})$/i)
if (setNumberMatch) {
  name = setNumberMatch[1].trim()
  cardId = setNumberMatch[2].toLowerCase() + '-' + setNumberMatch[3]
}
```

### #146 - Visibility Toggle Button

**Problem**: No quick way to toggle deck visibility (public/private) from the deck list.

**Fix**: `frontend/src/pages/DeckList.jsx`

Added clickable toggle button on "My Decks" tab:
- Shows eye icon (open/closed) with Public/Private label
- Click to toggle visibility without opening deck
- Uses existing `deckService.updateDeck` API

```jsx
{activeTab === 'mine' ? (
  <button onClick={(e) => handleToggleVisibility(e, deck._id, deck.isPublic)}>
    {deck.isPublic ? '👁 Public' : '🚫 Private'}
  </button>
) : (
  <span>{deck.isPublic ? 'Public' : 'Private'}</span>
)}

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

> **Last Updated**: 2025-12-20 (Status Review by @cuervo)

### Completed (PRs Merged to Stage)

| Issue | PR | Description | Status |
|-------|-----|-------------|--------|
| #14 | - | POST /api/decks/parse con detección de TCG/formato | ✅ Done |
| #15 | - | DeckImportModal con preview y detección automática | ✅ Done |
| #16 | - | Validación Pokemon Standard (60 cards, 4 copies, ACE SPEC, Radiant) | ✅ Done |
| #17 | - | Agrupación de reprints por nombre para validación de copias | ✅ Done |
| #18 | - | Validación Pokemon GLC (singleton, single type, no rule box) | ✅ Done |
| #19 | - | Validación Riftbound (40+1+3+12, domain restriction) | ✅ Done |
| #20 | - | Detección de formato en tiempo real | ✅ Done |
| #25 | - | DeckValidationIndicator component (inline, real-time) | ✅ Done |
| #30 | - | Sistema de votos 👍/👎 (backend + frontend) | ✅ Done |
| #36 | [#80](https://github.com/manucruzleiva/TCGKB/pull/80) | Card Enrichment Service | ✅ Merged |
| #37 | [#81](https://github.com/manucruzleiva/TCGKB/pull/81) | Real-time validation with enriched cards | ✅ Merged |

### Pending (Issues Reopened)

| Issue | Description | Priority | Tests Ready |
|-------|-------------|----------|-------------|
| #22 | Auto-tagging en tiempo real | Media | ✅ `deck-features.spec.js` |
| #23 | Card interactions (left/right/ctrl click, drag&drop) | Media | ✅ `deck-features.spec.js` |
| #24 | Filtros visuales con iconos toggle + grayscale | Media | ✅ `deck-features.spec.js` |
| #26 | Integrar SVG assets de tipos Pokemon (repositorios MIT) | Media | N/A |
| #27 | Crear SVG assets de dominios Riftbound | Media | N/A |
| #28 | Tabs 'Mis Decks' / 'Comunidad' en DeckList | Media | ✅ `decks.spec.js` |
| #29 | GET /api/decks/community endpoint | Media | ✅ `deck-api.spec.js` |
| #31 | Modo read-only para decks ajenos | Baja | ✅ `deck-features.spec.js` |
| #32 | Real-time updates para votos/comentarios (Socket.io) | Media | ✅ `deck-features.spec.js` |
| #33 | Badge 'El Primero' para decks originales | Baja | ✅ `deck-features.spec.js` |
| #34 | i18n para todas las nuevas strings | Media | ✅ `deck-features.spec.js` |
| #35 | Tests E2E para import flow y validaciones | Baja | Self |

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

| # | Issue | Título | Prioridad | Estimación | Status |
|---|-------|--------|-----------|------------|--------|
| 1 | #14 | Crear endpoint POST /api/decks/parse con detección de TCG/formato | Alta | 4h | ✅ Done |
| 2 | #15 | Implementar DeckImportModal con preview y detección automática | Alta | 5h | ✅ Done |
| 3 | #16 | Añadir validación Pokemon Standard (60 cards, 4 copies, ACE SPEC, Radiant) | Alta | 3h | ✅ Done |
| 3b | #17 | Implementar agrupación de reprints por nombre para validación de copias | Alta | 3h | ✅ Done |
| 4 | #18 | Añadir validación Pokemon GLC (singleton, single type, no rule box) | Alta | 3h | ✅ Done |
| 5 | #19 | Añadir validación Riftbound (40+1+3+12, domain restriction) | Alta | 3h | ✅ Done |
| 6 | #20 | Implementar detección de formato en tiempo real | Alta | 3h | ✅ Done |
| 7 | #22 | Implementar auto-tagging en tiempo real | Media | 3h | 🔄 Open |
| 8 | #25 | Crear DeckValidationIndicator component (inline, real-time) | Media | 2h | ✅ Done |
| 9 | #23 | Implementar card interactions (left/right/ctrl click, drag&drop) | Media | 4h | 🔄 Open |
| 10 | #24 | Implementar filtros visuales con iconos toggle + grayscale | Media | 4h | 🔄 Open |
| 11 | #26 | Integrar SVG assets de tipos Pokemon (desde repositorios MIT) | Media | 2h | 🔄 Open |
| 12 | #27 | Crear SVG assets de dominios Riftbound | Media | 3h | 🔄 Open |
| 13 | #28 | Añadir tabs "Mis Decks" / "Comunidad" en DeckList | Media | 2h | 🔄 Open |
| 14 | #29 | Crear endpoint GET /api/decks/community | Media | 2h | 🔄 Open |
| 15 | #30 | Implementar sistema de votos 👍/👎 (backend + frontend) | Media | 3h | ✅ Done |
| 16 | #31 | Implementar modo read-only para decks ajenos | Baja | 2h | 🔄 Open |
| 17 | #32 | Añadir real-time updates para votos/comentarios (Socket.io) | Media | 3h | 🔄 Open |
| 18 | #33 | Añadir badge "El Primero" para decks originales | Baja | 1h | 🔄 Open |
| 19 | #34 | Añadir i18n para todas las nuevas strings | Media | 2h | 🔄 Open (Partial) |
| 20 | #35 | Tests E2E para import flow y validaciones | Baja | 4h | 🔄 Open |
| 21 | #36 | **Card Enrichment Service** | Alta | 3h | ✅ Done |
| 22 | #37 | **Real-time Validation** | Alta | 2h | ✅ Done |

**Total estimado**: ~61 horas de desarrollo
**Completado**: ~35 horas (~57%)
**Pendiente**: ~26 horas (12 issues reopened)

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

# Deck Builder - Batch Import Optimization

## Date: 2025-12-17

## Problem
The Deck Builder import feature was extremely slow because it fetched card details one by one using sequential API calls. A typical deck with 15-30 unique cards would take 5-10+ seconds to import.

## Solution
Created a batch endpoint `/api/cards/batch` that accepts an array of card IDs and returns all card data in a single request with parallel internal fetches.

## Changes Made

### Backend

#### `backend/src/controllers/cards.controller.js`
- Added `getCardsByIds` function
- Accepts POST request with `{ ids: string[] }`
- Uses `Promise.allSettled` to fetch cards in parallel
- Returns `{ cards: {[cardId]: CardData}, notFound: string[] }`
- Limited to 60 cards max (one deck)

#### `backend/src/routes/cards.routes.js`
- Added route: `POST /cards/batch`
- Uses existing `generalLimiter` rate limiting

### Frontend

#### `frontend/src/services/cardService.js`
- Added `getCardsByIds(ids: string[])` method

#### `frontend/src/pages/DeckBuilder.jsx`
- Refactored `handleImport` to use batch endpoint
- Added `importing` state for loading indicator
- Shows spinner and "Importing..." text during import
- Disabled cancel/import buttons during import

## Performance Impact
- **Before**: ~250ms per card * 20 unique cards = ~5 seconds
- **After**: Single batch request ~500-1000ms (parallel fetches internally)
- **Improvement**: ~5-10x faster

## API Contract

### Request
```http
POST /api/cards/batch
Content-Type: application/json

{
  "ids": ["sv1-25", "sv1-189", "sv1-257"]
}
```

### Response
```json
{
  "success": true,
  "data": {
    "cards": {
      "sv1-25": {
        "id": "sv1-25",
        "name": "Pikachu ex",
        "supertype": "Pokemon",
        "images": { "small": "...", "large": "..." },
        "set": { "name": "Scarlet & Violet" },
        "tcgSystem": "pokemon"
      }
    },
    "notFound": ["invalid-id"]
  }
}
```

## Notes
- The batch endpoint uses the existing `unifiedTCGService.getCardById` which has 3-level caching (memory, MongoDB, API)
- Cards in cache will be returned nearly instantly
- Non-cached cards are fetched in parallel from external APIs

---

## Deck Manager V3 - Pre-Phase 0 Implementation
### Date: 2025-12-22

## Security Foundation

### 1. Input Validation Framework

**File**: `backend/src/utils/validation.js`

Created comprehensive validation utilities to prevent injection attacks and data corruption:

#### Validation Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `validateCardId(cardId, CardCache)` | Validates card ID format and existence in database | `{valid, error?, card?}` |
| `sanitizeHtml(input, options)` | Strips all HTML tags using DOMPurify | Sanitized string |
| `validateQuantity(quantity, options)` | Validates and clamps quantity (0-1000) | `{valid, value?, error?}` |
| `validateObjectId(id)` | Validates MongoDB ObjectId format | `{valid, error?}` |
| `validateTcgSystem(tcgSystem)` | Validates TCG system (pokemon/riftbound) | `{valid, value?, error?}` |
| `validateDeckStatus(status)` | Validates deck status (draft/built) | `{valid, value?, error?}` |

#### Security Features

- **CardId Validation**: Regex format check + database existence verification
- **XSS Prevention**: DOMPurify strips all HTML tags, allows plain text only
- **Injection Prevention**: Parameterized queries required, no string concatenation
- **Input Sanitization**: Trim whitespace, limit length (default: 1000 chars)
- **Type Safety**: Strict type checking for all inputs

#### Usage Example

```javascript
import { validateCardId, sanitizeHtml, validateQuantity } from '../utils/validation.js'
import CardCache from '../models/CardCache.js'

// Validate card ID
const cardValidation = await validateCardId(req.body.cardId, CardCache)
if (!cardValidation.valid) {
  return res.status(400).json({ success: false, error: cardValidation.error })
}

// Sanitize user input
const deckName = sanitizeHtml(req.body.name, { maxLength: 100 })
const description = sanitizeHtml(req.body.description, { maxLength: 500 })

// Validate quantity
const qtyValidation = validateQuantity(req.body.quantity, { min: 1, max: 60 })
if (!qtyValidation.valid) {
  return res.status(400).json({ success: false, error: qtyValidation.error })
}
```

#### Test Coverage

**File**: `backend/src/utils/validation.test.js`

- 40+ test cases covering all validation functions
- Edge cases: null, undefined, malformed input, XSS attempts
- Security tests: HTML injection, NoSQL injection patterns
- Performance: <1ms per validation

---

### 2. V3 Rate Limiting

**File**: `backend/src/middleware/rateLimiter.middleware.js`

Extended rate limiting middleware with V3-specific limits to prevent DoS and abuse.

#### Rate Limit Configuration

| Limiter | Window | Max Requests | Key | Purpose |
|---------|--------|--------------|-----|---------|
| `collectionLimiter` | 1 hour | 100 | userId | Prevent collection spam |
| `buildDisarmLimiter` | 1 hour | 20 | userId | Prevent transaction abuse |
| `syncLimiter` | 1 hour | 10 | userId | Prevent sync spam |
| `autoSaveLimiter` | 1 minute | 20 | userId | Backup for client debounce |

#### Implementation Details

- **Key Generator**: Uses `req.user._id` for authenticated users, falls back to `req.ip` for anonymous
- **Standard Headers**: Returns `RateLimit-*` headers for client-side handling
- **Error Messages**: Clear, actionable messages for users
- **Serverless Compatible**: Uses in-memory store (consider Redis for multi-instance deployments)

#### Security Benefits

- **DoS Prevention**: Limits high-cost operations (transactions, syncs)
- **Spam Prevention**: Prevents users from flooding collection with fake cards
- **Resource Protection**: Prevents database overload from rapid auto-saves
- **Fair Usage**: Ensures reasonable limits for all users

#### Usage in Routes

```javascript
import { collectionLimiter, buildDisarmLimiter, syncLimiter, autoSaveLimiter } from '../middleware/rateLimiter.middleware.js'

// Apply to collection routes
router.post('/collections/cards', authMiddleware, collectionLimiter, addCardController)

// Apply to build/disarm routes
router.post('/decks/:id/build', authMiddleware, buildDisarmLimiter, buildDeckController)
router.post('/decks/:id/disarm', authMiddleware, buildDisarmLimiter, disarmDeckController)

// Apply to sync routes
router.post('/decks/:id/sync', authMiddleware, syncLimiter, syncDeckController)

// Apply to auto-save
router.put('/decks/:id', authMiddleware, autoSaveLimiter, updateDeckController)
```

#### Rate Limit Violations

When rate limit exceeded:
- **HTTP Status**: 429 Too Many Requests
- **Headers**: `Retry-After` header with seconds until reset
- **Response**: `{ message: "Too many [operation]. Please try again in [time]." }`
- **Logging**: Violations logged for monitoring (future: alert on sustained abuse)

---

## Next Steps (Pre-Phase 0 Remaining)

1. **MongoDB Transaction Framework** (1 day)
   - Create `backend/src/utils/transaction.js`
   - withTransaction helper with 5s timeout
   - Automatic rollback on error
   - Cleanup script for orphaned "in_use" cards

2. **Security Test Suite** (1 day)
   - Injection tests (NoSQL, XSS)
   - Authorization tests (can't build with others' collections)
   - Rate limiting tests
   - Input validation tests

3. **Threat Model Documentation** (4 hours)
   - Update `docs/security.md`
   - Document 7 attack vectors and mitigations
   - OWASP compliance checklist
   - Security testing strategy

4. **@bob Security Review** (Required before Phase 0)
   - Review validation framework
   - Review rate limiting configuration
   - Penetration testing
   - Approval required to proceed

---

## Dependencies Installed

```bash
npm install --save isomorphic-dompurify  # Server-side HTML sanitization
```

**express-rate-limit**: Already installed (v7.5.0)

---

## Performance Notes

### Validation Performance
- CardId validation: <10ms (includes DB query)
- HTML sanitization: <1ms for typical input (1000 chars)
- Quantity validation: <0.1ms (pure computation)

### Rate Limiting Overhead
- In-memory store: <1ms per request
- Key generation: <0.1ms
- **Note**: Consider MongoDB/Redis store for multi-instance deployments (Vercel serverless)

---

## Security Considerations

### OWASP Coverage (Pre-Phase 0)

| Category | Status | Implementation |
|----------|--------|----------------|
| **A01 Access Control** | ⏳ Pending | Auth middleware (Phase 1) |
| **A03 Injection** | ✅ Complete | validateCardId, parameterized queries |
| **A04 Insecure Design** | ⏳ Pending | Transaction framework (next) |
| **A05 Misconfiguration** | ✅ Complete | Rate limiting, error handling |
| **A07 Auth Failures** | ✅ Complete | JWT validation on all routes |
| **A08 Data Integrity** | ⏳ Pending | Validation on sync (Phase 2) |
| **A09 Logging Failures** | ✅ Complete | Logger utility, rate limit logging |

### Known Limitations

1. **Rate Limiting in Serverless**: In-memory store doesn't persist across cold starts
   - **Mitigation**: Acceptable for MVP, monitor for abuse
   - **Future**: Migrate to MongoDB/Redis store if needed

2. **CardId Validation Performance**: DB query on every validation
   - **Mitigation**: Cache card IDs in memory (future optimization)
   - **Current**: <10ms is acceptable

3. **DOMPurify Bundle Size**: Adds ~45KB to backend bundle
   - **Mitigation**: Only imported in validation utils
   - **Impact**: Negligible for serverless (bundle included in function)

