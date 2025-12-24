# TCGKB - System Architecture

> **Source of Truth** for system architecture, tech stack, and data models.
> Last updated: 2025-12-21

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TCGKB ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐   │
│  │   Browser   │────▶│   Vercel    │────▶│     Serverless Functions    │   │
│  │  (React)    │◀────│   Edge      │◀────│      (Express.js API)       │   │
│  └─────────────┘     └─────────────┘     └──────────────┬──────────────┘   │
│         │                                               │                   │
│         │ Socket.io                                     │                   │
│         └───────────────────────────────────────────────┤                   │
│                                                         ▼                   │
│                                          ┌─────────────────────────────┐   │
│                                          │      MongoDB Atlas          │   │
│                                          │  ┌─────────────────────┐    │   │
│                                          │  │ Users, Comments,    │    │   │
│                                          │  │ Reactions, Decks,   │    │   │
│                                          │  │ Collections, Cache  │    │   │
│                                          │  └─────────────────────┘    │   │
│                                          └─────────────────────────────┘   │
│                                                         │                   │
│                          ┌──────────────────────────────┼──────────────┐   │
│                          ▼                              ▼              ▼   │
│               ┌─────────────────┐          ┌─────────────┐   ┌──────────┐ │
│               │ Pokemon TCG API │          │ Riftbound   │   │ PokeAPI  │ │
│               │ pokemontcg.io   │          │ riftcodex   │   │ sprites  │ │
│               └─────────────────┘          └─────────────┘   └──────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + Vite | UI Framework + Build Tool |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Routing** | React Router 6 | Client-side routing |
| **State** | React Context | Global state (Auth, Theme, Language) |
| **Real-time** | Socket.io-client | Live updates |
| **Backend** | Express.js | REST API |
| **Database** | MongoDB + Mongoose | Data persistence |
| **Auth** | JWT | Stateless authentication |
| **PWA** | Service Worker + Cache API | Offline support, installability |
| **Deploy** | Vercel | Serverless hosting |
| **Testing** | Playwright | E2E tests |

---

## PWA Architecture

TCGKB is a Progressive Web App with offline-first capabilities:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PWA ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│  │   React App     │────▶│  Service Worker │────▶│    Cache API        │   │
│  │  (UI Layer)     │◀────│  (sw.js v1.1.0) │◀────│  (Multi-strategy)   │   │
│  └────────┬────────┘     └────────┬────────┘     └─────────────────────┘   │
│           │                       │                                         │
│           ▼                       ▼                                         │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │ Connectivity    │     │   Cache Stores  │                               │
│  │ Context         │     │  - static-v1.1  │                               │
│  │ (online/offline)│     │  - images-v1.1  │                               │
│  └─────────────────┘     │  - api-v1.1     │                               │
│                          │  - fonts-v1.1   │                               │
│                          └─────────────────┘                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CACHE STRATEGIES                              │   │
│  ├──────────────────┬──────────────────┬───────────────────────────────┤   │
│  │ Cache-First      │ Network-First    │ Stale-While-Revalidate       │   │
│  │ (Static assets)  │ (API calls)      │ (Card images)                 │   │
│  │ (Fonts)          │                  │                               │   │
│  └──────────────────┴──────────────────┴───────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Implemented Features (Phase 1 + Phase 4)

| Feature | Status | Location |
|---------|--------|----------|
| **Service Worker** | ✅ Implemented | `/frontend/public/sw.js` |
| **Manifest** | ✅ Implemented | `/frontend/public/manifest.json` |
| **ConnectivityContext** | ✅ Implemented | `/frontend/src/contexts/ConnectivityContext.jsx` |
| **OfflineBanner** | ✅ Implemented | `/frontend/src/components/common/OfflineBanner.jsx` |
| **InstallPrompt** | ✅ Implemented | `/frontend/src/components/common/InstallPrompt.jsx` |
| **Offline Fallback** | ✅ Implemented | `/frontend/public/offline.html` |
| **Cache Strategies** | ✅ Implemented | Static, Images, API, Fonts |
| **IndexedDB** | ⏳ Pending | Phase 2 |
| **Background Sync** | ⏳ Pending | Phase 3 |

### Cache Strategy Details

| Resource Type | Strategy | Cache Name | TTL |
|---------------|----------|------------|-----|
| HTML, JS, CSS | Cache-First | `tcgkb-static-v1.1.0` | Versioned |
| Card Images | Stale-While-Revalidate | `tcgkb-images-v1.1.0` | 30 days |
| API (GET) | Network-First with fallback | `tcgkb-api-v1.1.0` | 7 days |
| Web Fonts | Cache-First | `tcgkb-fonts-v1.1.0` | Versioned |

### Service Worker Lifecycle

1. **Install**: Precache static assets (`/`, `/index.html`, `/manifest.json`, icons, `/offline.html`)
2. **Activate**: Clean up old cache versions (anything not `v1.1.0`)
3. **Fetch**: Route requests to appropriate cache strategy based on resource type
4. **Update**: Automatic service worker update detection and activation

---

## Directory Structure

```
TCGKB/
├── api/                          # Vercel serverless entry point
│   └── index.js                  # Express app for Vercel
├── frontend/                     # React application
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── auth/             # Login, Register forms
│   │   │   ├── cards/            # CardDetail, CardGrid, CardSearch
│   │   │   ├── comments/         # CommentComposer, CommentList, CommentItem
│   │   │   ├── common/           # Button, Input, Spinner, EmojiPicker
│   │   │   ├── dashboard/        # KPIDashboard, ReputationConfig
│   │   │   ├── decks/            # DeckImportModal, DeckValidationIndicator
│   │   │   └── layout/           # Header, Footer
│   │   ├── pages/                # Route pages
│   │   ├── services/             # API service modules
│   │   ├── contexts/             # React contexts
│   │   ├── hooks/                # Custom hooks
│   │   ├── i18n/                 # ES/EN translations
│   │   └── App.jsx               # Main app with routes
│   └── package.json
├── backend/                      # Express API server
│   ├── src/
│   │   ├── controllers/          # Route handlers
│   │   ├── routes/               # API route definitions
│   │   ├── models/               # MongoDB schemas
│   │   ├── services/             # Business logic
│   │   ├── middleware/           # Auth, Admin, RateLimiter
│   │   ├── config/               # Database, Socket.io config
│   │   ├── utils/                # Logger, MemoryCache, DeckHash
│   │   └── index.js              # Express server
│   └── package.json
├── docs/                         # Documentation (you are here)
│   ├── architecture.md           # This file
│   ├── api.md                    # API endpoints
│   ├── security.md               # Security documentation
│   ├── features/                 # Feature specifications
│   └── engineering/              # Technical notes
├── scripts/                      # Cache sync scripts
├── .github/                      # GitHub Actions workflows
├── .claude/                      # Agent configuration (local)
├── package.json                  # Monorepo root
├── vercel.json                   # Vercel config
├── CLAUDE.md                     # AI development guidelines
└── README.md                     # Project overview
```

---

## Data Models

### User
```javascript
{
  email: String,           // Unique
  username: String,        // Unique
  password: String,        // bcrypt hashed
  role: 'user' | 'moderator' | 'dev',
  preferences: {
    theme: 'light' | 'dark',
    language: 'es' | 'en',
    dateFormat: String
  },
  canComment: Boolean,     // Restriction flag
  canReact: Boolean,       // Restriction flag
  isActive: Boolean,       // Account status
  avatar: {
    emoji: String,
    gradient: String
  }
}
```

### CardCache
```javascript
{
  cardId: String,          // External TCG ID
  tcg: 'pokemon' | 'riftbound',
  data: Object,            // Cached card JSON
  viewCount: Number,
  expiresAt: Date          // 7-day TTL
}
```

### Comment
```javascript
{
  targetType: 'card' | 'deck',
  cardId: String,          // If card comment
  deckId: ObjectId,        // If deck comment
  userId: ObjectId,        // Author
  content: String,
  parentId: ObjectId,      // For nesting
  path: String,            // Materialized path
  depth: Number,
  cardMentions: [String]   // @ mentions
}
```

### Reaction
```javascript
{
  targetType: 'card' | 'comment',
  targetId: String,
  emoji: String,
  userId: ObjectId,        // Optional (null = anonymous)
  fingerprint: String      // Device ID for anonymous
}
```

### Deck
```javascript
{
  userId: ObjectId,        // Creator
  name: String,
  description: String,
  tags: [String],
  tcgSystem: 'pokemon' | 'riftbound',  // Locks deck to single TCG
  cards: [{
    cardId: String,
    quantity: Number
  }],
  compositionHash: String  // For duplicate detection
}
```

### Collection
```javascript
{
  userId: ObjectId,
  cards: [{
    cardId: String,
    quantity: Number
  }]
}
```

### ReputationLedger
```javascript
{
  userId: ObjectId,
  action: String,
  points: Number,
  timestamp: Date,
  metadata: Object
}
```

---

## User Roles & Permissions

### Role Hierarchy

```
user → moderator → dev
```

| Role | Description | Access Level |
|------|-------------|--------------|
| `user` | Standard authenticated user | Basic features |
| `moderator` | Community moderator | + Moderation tools |
| `dev` | Developer/Admin | Full system access |

### Permission Matrix

| Action | Anonymous | user | moderator | dev |
|--------|-----------|------|-----------|-----|
| View cards/decks | ✅ | ✅ | ✅ | ✅ |
| Search cards | ✅ | ✅ | ✅ | ✅ |
| React to cards | ✅* | ✅ | ✅ | ✅ |
| Comment on cards | ❌ | ✅ | ✅ | ✅ |
| Create/edit own decks | ❌ | ✅ | ✅ | ✅ |
| View public decks | ✅ | ✅ | ✅ | ✅ |
| Moderation queue | ❌ | ❌ | ✅ | ❌ |
| Hide/show comments | ❌ | ❌ | ✅ | ❌ |
| Manage restrictions | ❌ | ❌ | ✅ | ❌ 
| Promote/demote users | ❌ | ❌ | ✅ | ❌ |
| KPI Dashboard | ❌ | ❌ | ❌ | ✅ |

*Anonymous reactions use fingerprint instead of userId

### Restriction Flags

| Flag | Effect | Applied By |
|------|--------|------------|
| `canComment: false` | Cannot post comments | moderator, dev |
| `canReact: false` | Cannot add reactions | moderator, dev |
| `isActive: false` | Account disabled | dev only |

---

## External Integrations

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| **TCGdex API** | Card data for Pokemon | Unlimited (faster) |
| **Riftbound API** | Card data for Riftbound | TBD |
| **PokeAPI** | Pokemon sprites | Unlimited |
| **GitHub API** | Bug reports, changelog, roadmap | 5k/hour |

---

## External Asset Repositories

| Resource | Type | URL | Description |
|----------|------|-----|-------------|
| **Riftbound Icons** | Google Drive | [Riftbound Assets](https://drive.google.com/drive/u/0/folders/11V-sIN0JMAT-gADkSoPOhzuavmLwQUqB) | Official Riftbound TCG icon set (domain icons, card types, etc.) |
| **Bulbapedia TCG** | Wiki | [Pokemon TCG Wiki](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Trading_Card_Game) | Pokemon TCG reference, rules, mechanics, card types |
| **Bulbapedia Energy** | Wiki | [Energy Cards](https://bulbapedia.bulbagarden.net/wiki/Energy_card_(TCG)) | Energy type icons, special energy info |
| **Bulbapedia Items** | Wiki | [Rare Candy](https://bulbapedia.bulbagarden.net/wiki/Rare_Candy) | Item card reference icons |

### Local Icon Assets

Located in `frontend/public/assets/icons/`:

| Folder | Contents | Source |
|--------|----------|--------|
| `pokemon-types/` | 11 energy type SVGs (fire, water, grass, etc.) | Bulbapedia |
| `pokemon-cardtypes/` | Card type SVGs (Pokemon, Trainer, Item, Stadium) | Bulbapedia |
| `riftbound-domains/` | 6 domain SVGs (fury, calm, mind, body, order, chaos) | Google Drive |
| `riftbound-types/` | Card type SVGs (unit, spell, battlefield, item) | Google Drive |

> **Note**: These are external resources not controlled by TCGKB. Always verify availability and licensing before use.

---

## Architecture Decisions

### Why Multi-TCG?
- Future-proof: Adding new TCGs only requires a new service adapter
- Unified search: Users don't need to know which TCG a card belongs to
- Shared infrastructure: Comments, reactions, decks work across all TCGs

### Why MongoDB?
- Flexible schema for varying card structures across TCGs
- TTL indexes for automatic cache expiration
- Document model matches card data structure

### Why Socket.io?
- Real-time comments and reactions without polling
- Room-based subscriptions (per card/deck)
- Automatic reconnection with fallback

### Why Vercel Serverless?
- Zero-config deployment from Git
- Automatic scaling
- Edge network for global performance
- Cron jobs for cache sync

### Why JWT over Sessions?
- Stateless = scales horizontally
- Works with serverless (no session store needed)
- 7-day expiration balances security and UX

### Why TCGdex over pokemontcg.io?
- Faster response times (no rate limiting issues)
- More reliable uptime (no 504 timeouts)
- 14 languages supported
- Includes regulation marks for Standard format filtering
- Better set coverage (197 sets vs 170)

---

## Related Documentation

- [API Endpoints](./api.md)
- [Security](./security.md)
- [Feature Specs](./features/)
- [Engineering Notes](./engineering/)
