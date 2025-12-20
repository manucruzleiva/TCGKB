# Deck Manager V2 - Implementation Notes

## Date: 2025-12-20

## Overview
DM-V2 is a major enhancement to the deck management system adding community features, real-time validation, and interactive card management.

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
