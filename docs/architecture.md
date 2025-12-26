# TCGKB - System Architecture

> **Source of Truth** for system architecture, tech stack, and data models.
> Last updated: 2025-12-20

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
| **Deploy** | Vercel | Serverless hosting |
| **Testing** | Playwright | E2E tests |

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
| **Pokemon TCG API** | Card data for Pokemon | 20k/day |
| **Riftbound API** | Card data for Riftbound | TBD |
| **PokeAPI** | Pokemon sprites | Unlimited |
| **GitHub API** | Bug reports, changelog, roadmap | 5k/hour |

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

---

## Related Documentation

- [API Endpoints](./api.md)
- [Security](./security.md)
- [Feature Specs](./features/)
- [Engineering Notes](./engineering/)
