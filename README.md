# TCGKB - Trading Card Game Knowledge Base

A full-stack multi-TCG platform for card search, community discussion, and collection management.

**Production**: [tcgkb.app](https://tcgkb.app) | **Staging**: [staging.tcgkb.app](https://staging.tcgkb.app)

---

## System Architecture

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
│   │   │   └── layout/           # Header
│   │   ├── pages/                # Route pages (21 pages)
│   │   ├── services/             # API service modules (10 services)
│   │   ├── contexts/             # React contexts (5 contexts)
│   │   ├── hooks/                # Custom hooks (3 hooks)
│   │   ├── i18n/                 # ES/EN translations
│   │   └── App.jsx               # Main app with routes
│   └── package.json
├── backend/                      # Express API server
│   ├── src/
│   │   ├── controllers/          # Route handlers (13 controllers)
│   │   ├── routes/               # API route definitions (13 routes)
│   │   ├── models/               # MongoDB schemas (12 models)
│   │   ├── services/             # Business logic (3 services)
│   │   ├── middleware/           # Auth, Admin, RateLimiter, ErrorHandler
│   │   ├── config/               # Database, Socket.io config
│   │   ├── utils/                # Logger, MemoryCache, DeckHash
│   │   └── index.js              # Express server
│   └── package.json
├── scripts/                      # Cache sync scripts
├── assets/                       # Logo and icon images
├── docs/                         # Documentation
├── .github/                      # GitHub Actions workflows
│   └── workflows/                # CI/CD automation
├── package.json                  # Monorepo root (npm workspaces)
├── vercel.json                   # Vercel deployment config
├── CLAUDE.md                     # AI assistant instructions
└── README.md                     # This file
```

---

## Core Features

### Multi-TCG Card System
- **Transparent search** across Pokemon TCG + Riftbound
- **7-day MongoDB cache** with TTL auto-expiration
- **Fuzzy search** with Levenshtein distance (1-2 char tolerance)
- **Regulation mark filtering** (G, H, I, J, K only)
- **Reprints detection** and alternate art linking

### Community Features
- **Nested comments** with unlimited depth
- **@ mentions** for cards with ability references
- **Emoji reactions** on cards and comments
- **Anonymous reactions** without login required
- **Real-time updates** via Socket.io

### User System
- **JWT authentication** (7-day sessions)
- **Role-based access** (user, moderator, admin)
- **User preferences** (theme, language, date format)
- **Custom avatars** with gradient backgrounds
- **Reputation system** with points and decay

### Deck Builder
- **Create/manage decks** for any supported TCG
- **Import/export** functionality
- **Deck comments** and sharing
- **Collection tracking** with quantities

See [Deck Manager V2 Technical Spec](#deck-manager-v2) for detailed implementation.

### Admin Tools
- **KPI Dashboard** with platform analytics
- **Moderation queue** for comments
- **User management** and restrictions
- **Cache management** and manual sync
- **Bug report system** with GitHub integration

### Bug Report System

The platform includes a floating bug report button that allows users to submit issues directly to GitHub.

**Component**: `frontend/src/components/common/BugReportButton.jsx`

#### Features
| Feature | Description |
|---------|-------------|
| **Floating Button** | Red circular button fixed at bottom-right (z-index: 40) |
| **Auto Screenshot** | Captures page via `html2canvas` when modal opens |
| **GitHub Integration** | Creates issue via `POST /api/github/issues` |
| **Auto-Classification** | Debounced API call analyzes title/description for priority |
| **Duplicate Detection** | Compares against existing issues, shows potential matches |
| **Context Capture** | Includes theme, URL, screen size, user agent |
| **i18n Support** | Full Spanish/English translations |

#### Flow
```
User clicks bug button
        │
        ▼
┌───────────────────┐
│  Hide button      │
│  Capture screenshot│
│  Show modal       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  User fills form  │──▶ Debounced classify API (800ms)
│  Title + Desc     │◀── Shows priority suggestion
└─────────┬─────────┘◀── Shows duplicate warnings
          │
          ▼
┌───────────────────┐
│  Submit           │
│  POST /github/issues│
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  Success screen   │──▶ Link to GitHub issue
│  Auto-close 5s    │
└───────────────────┘
```

#### API Integration

**Classify** (`POST /api/github/classify`):
```json
{
  "title": "Button not working",
  "description": "When I click...",
  "pageUrl": "/card/xyz"
}
// Returns: priority suggestion + potential duplicates
```

**Create Issue** (`POST /api/github/issues`):
```json
{
  "title": "Button not working",
  "description": "When I click...",
  "screenshot": "data:image/jpeg;base64,...",
  "pageUrl": "/card/xyz",
  "userAgent": "Mozilla/5.0...",
  "theme": "dark",
  "language": "en",
  "screenSize": "1920x1080"
}
// Creates GitHub issue with all context
```

#### Visibility
- Button visible for **all users** (authenticated and anonymous)
- Anonymous users can report bugs (creates issue without user attribution)

### Roadmap System

**Page**: `/roadmap`
**Component**: `frontend/src/pages/Roadmap.jsx`

#### Features
| Feature | Description |
|---------|-------------|
| **GitHub Project V2** | Fetches items from GitHub Project via GraphQL API |
| **Status Grouping** | Groups by: In Progress, Planned, Backlog, Done |
| **Progress Bar** | Shows % of completed items |
| **Labels Display** | Shows GitHub labels with colors |
| **Toggle Completed** | Button to show/hide completed items |

#### API Integration

**Endpoint**: `GET /api/github/project`
**Backend**: `getProjectItems()` in `github.controller.js`
**GraphQL API**: Uses GitHub Projects V2 API

#### Environment Variables
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_TOKEN` | Yes | - | Must have `read:project` scope |
| `GITHUB_PROJECT_NUMBER` | No | 2 | GitHub Project V2 number |

#### Data Flow
```
Frontend                        Backend                     GitHub
   │                              │                            │
   │  GET /api/github/project     │                            │
   ├─────────────────────────────▶│                            │
   │                              │  GraphQL query             │
   │                              ├───────────────────────────▶│
   │                              │◀───────────────────────────┤
   │  { items, byStatus, stats }  │                            │
   │◀─────────────────────────────┤                            │
```

#### Response Structure
```json
{
  "success": true,
  "data": {
    "project": { "id": "...", "title": "TCGKB Roadmap" },
    "items": [...],
    "byStatus": {
      "backlog": [...],
      "planned": [...],
      "inProgress": [...],
      "done": [...]
    },
    "stats": {
      "total": 20,
      "completed": 5,
      "inProgress": 3,
      "planned": 7,
      "backlog": 5,
      "progress": 25
    }
  }
}
```

#### Troubleshooting
| Error | Cause | Solution |
|-------|-------|----------|
| Empty roadmap | Token missing `read:project` scope | Regenerate token with scope |
| 404 Project not found | Wrong `GITHUB_PROJECT_NUMBER` | Verify project number in Vercel |
| 401 Unauthorized | Invalid or expired token | Check `GITHUB_TOKEN` in Vercel env |

---

## Data Models

```
User
  ├── email, username, password (hashed)
  ├── role (user | moderator | admin)
  ├── preferences { theme, language, dateFormat }
  ├── canComment, canReact (restriction flags)
  └── avatar { emoji, gradient }

CardCache
  ├── cardId (external TCG ID)
  ├── tcg (pokemon | riftbound)
  ├── data (cached card JSON)
  ├── viewCount
  └── expiresAt (7-day TTL)

Comment
  ├── targetType (card | deck)
  ├── cardId | deckId
  ├── userId (author)
  ├── content
  ├── parentId (for nesting)
  ├── path (materialized path)
  ├── depth
  └── cardMentions[]

Reaction
  ├── targetType (card | comment)
  ├── targetId
  ├── emoji
  ├── userId (optional, null = anonymous)
  └── fingerprint (device ID for anonymous)

Deck
  ├── userId (creator)
  ├── name, description, tags
  ├── tcg (pokemon | riftbound)
  ├── cards [{ cardId, quantity }]
  └── hash (for duplicate detection)

Collection
  ├── userId
  └── cards [{ cardId, quantity }]

ReputationLedger
  ├── userId
  ├── action, points, timestamp
  └── metadata
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, get JWT |
| GET | `/api/auth/me` | Current user |

### Cards
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cards` | List cards (paginated) |
| GET | `/api/cards/:id` | Card detail |
| GET | `/api/cards/search` | Search for @ mentions |
| GET | `/api/cards/stats` | Card statistics |

### Comments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/comments/:cardId` | Get comment tree |
| POST | `/api/comments` | Create comment |
| PUT | `/api/comments/:id` | Edit comment |
| DELETE | `/api/comments/:id` | Delete comment |
| PATCH | `/api/comments/:id/hide` | Toggle visibility |

### Reactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/reactions` | Add reaction |
| DELETE | `/api/reactions` | Remove reaction |
| GET | `/api/reactions/:type/:id` | Get aggregated |

### Decks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/decks` | List user decks |
| POST | `/api/decks` | Create deck |
| POST | `/api/decks/parse` | Parse deck string, detect TCG/format |
| GET | `/api/decks/:id` | Deck detail |
| PUT | `/api/decks/:id` | Update deck |
| DELETE | `/api/decks/:id` | Delete deck |

### Admin/Moderation
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mod/pending` | Pending comments |
| PATCH | `/api/mod/comments/:id` | Moderate comment |
| GET | `/api/stats/kpi` | Platform KPIs |
| GET | `/api/stats/activity` | User activity |

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | System health |
| GET | `/api/health/sources` | External API status |

### GitHub Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/github/config` | Check if GitHub is configured |
| GET | `/api/github/project` | Get project items (roadmap) |
| GET | `/api/github/changelog` | Get changelog (commits) |
| GET | `/api/github/commits` | Get commits from branch |
| POST | `/api/github/issues` | Create bug report issue |
| POST | `/api/github/classify` | Classify bug (priority, duplicates) |
| GET | `/api/github/issues` | List issues (auth required) |
| GET | `/api/github/stats` | Issue statistics (auth required) |

---

## External Integrations

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| **Pokemon TCG API** | Card data for Pokemon | 20k/day |
| **Riftbound API** | Card data for Riftbound | TBD |
| **PokeAPI** | Pokemon sprites | Unlimited |
| **GitHub API** | Bug reports, changelog | 5k/hour |

---

## Deployment

### Branch Strategy
- `main` → Production (tcgkb.app)
- `stage` → Staging (staging.tcgkb.app)
- `claude/*` → Feature branches (auto-pipeline)

### Vercel Configuration
```json
{
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/index.js": { "memory": 1024, "maxDuration": 60 }
  },
  "crons": [
    { "path": "/api/cron/daily-sync", "schedule": "0 6 * * *" }
  ]
}
```

### Environment Variables

**Backend**:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key
- `JWT_EXPIRES_IN` - Token expiration (7d)
- `POKEMON_TCG_API_KEY` - Pokemon TCG API key
- `CORS_ORIGIN` - Allowed origins
- `NODE_ENV` - production | development

**GitHub Integration**:
- `GITHUB_TOKEN` - GitHub Personal Access Token (requires `repo`, `read:project` scopes)
- `GITHUB_OWNER` - GitHub username (default: `manucruzleiva`)
- `GITHUB_REPO` - Repository name (default: `TCGKB`)
- `GITHUB_PROJECT_NUMBER` - GitHub Project V2 number for roadmap (default: `2`)

**Frontend**:
- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io URL

---

## Development

### Quick Start
```bash
# Install dependencies
npm install

# Start development (frontend + backend)
npm run dev

# Frontend only: http://localhost:5173
npm run dev:frontend

# Backend only: http://localhost:3001
npm run dev:backend
```

### Build & Test
```bash
# Production build
npm run build

# Run E2E tests
npm run test

# Visual test UI
npm run test:ui
```

### Cache Management
```bash
# Sync Pokemon cards
npm run sync:pokemon

# Daily cache sync (runs via cron)
/api/cron/daily-sync
```

---

## SDLC Automation Workflow

This project uses Claude Code agents via GitHub Actions for automated development.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AGENT PIPELINE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Human: "I want feature X"                                                  │
│              │                                                              │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │ @design │ ──→ Update README.md (architecture)                     │
│         └────┬────┘ ──→ Create GitHub Project item                          │
│              │      ──→ Log token usage                                     │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │  @dev   │ ──→ Create branch: claude/<id>-<name>                   │
│         └────┬────┘ ──→ Implement feature (1 commit = 1 item)               │
│              │      ──→ Log token usage                                     │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │   @qa   │ ──→ Run Playwright tests                                │
│         └────┬────┘ ──→ Write new tests                                     │
│              │      ──→ FAIL? Create bug Issue → @dev loops                 │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │  @docs  │ ──→ Update CHANGELOG.md                                 │
│         └────┬────┘ ──→ Add inline comments                                 │
│              │      ──→ Update API docs                                     │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │ @clean  │ ──→ Fix lint, dead code                                 │
│         └────┬────┘ ──→ Refactor inconsistencies                            │
│              │      ──→ Act as developer (full context)                     │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │  Human  │ ──→ Review PR                                           │
│         └────┬────┘ ──→ Merge to staging                                    │
│              │      ──→ Test on staging.tcgkb.app                           │
│              ▼                                                              │
│         ┌─────────┐                                                         │
│         │  Human  │ ──→ Merge staging to main                               │
│         └─────────┘ ──→ Production auto-deploy                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Roles

| Agent | Responsibility | Trigger |
|-------|----------------|---------|
| **@design** | Architecture, Project items | Human wish/comment |
| **@dev** | Implementation, bug fixes | Project item ready |
| **@qa** | Testing, test creation | Push to `claude/*` |
| **@docs** | Documentation, changelog | QA passes |
| **@clean** | Lint, refactor, cleanup | Docs complete |

### Token Tracking

Each agent logs usage to the Issue/Project item:

```markdown
## Token Usage Log

| Agent | Tokens | Timestamp |
|-------|--------|-----------|
| @design | 8,200 | 2024-12-19 10:00 |
| @dev | 15,400 | 2024-12-19 10:30 |
| @qa | 9,100 | 2024-12-19 11:00 |
| @docs | 4,300 | 2024-12-19 11:15 |
| @clean | 6,200 | 2024-12-19 11:30 |
| **Total** | **43,200** | |
```

Project items use cost estimate labels: `cost-5000`, `cost-10000`, `cost-25000`

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

## Security Measures

- **Password hashing**: bcryptjs with salt rounds
- **JWT validation**: Required for authenticated routes
- **Rate limiting**: express-rate-limit on sensitive endpoints
- **CORS**: Strict origin whitelisting
- **Helmet**: Security headers
- **Input validation**: validator library
- **Role-based access**: Middleware checks for admin/mod routes

---

## UX Design Principles

TCGKB targets **efficiency-focused users** who value speed and minimal UI clutter.

### Core Principles
| Principle | Description |
|-----------|-------------|
| **Minimal floating elements** | Only ONE floating button (BugReportButton). No stacking. |
| **Footer for secondary actions** | Support, GitHub, version info go in footer |
| **Fast navigation** | Header menu for primary nav, no modals for simple actions |
| **Consistent patterns** | Same component patterns across all pages |

### What NOT to do
- Multiple floating buttons (clutters screen)
- Modals for simple links (just open in new tab)
- Animations that delay user actions
- Hidden features behind hover states

---

## Support / Monetization

TCGKB uses GitHub Sponsors for community support. This keeps the project ad-free and user-focused.

### Support Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Footer Link** | Footer, next to GitHub link | Heart icon + "Apoyar/Support" text |
| **Support Page** | `/support` | Full page explaining project costs and tiers |

> **Note**: No floating support button. Footer link is sufficient and keeps UI clean.

### GitHub Sponsors URL
- **Main**: `https://github.com/sponsors/manucruzleiva`
- **One-time**: `https://github.com/sponsors/manucruzleiva?frequency=one-time`

### Support Tiers

| Tier | Price | Benefits |
|------|-------|----------|
| **Supporter** | $3/month | Badge on profile, name on supporters list |
| **Champion** | $5/month | All above + early access to features |
| **Hero** | $10/month | All above + name in footer + suggest features |

### UI Specifications

#### Footer Link
```
┌─────────────────────────────────────────────────────────────┐
│  © 2024 TCGKB    [GitHub] GitHub    ❤️ Apoyar    Version   │
└─────────────────────────────────────────────────────────────┘
```
- Icon: Heart (pink/rose color)
- Opens in new tab with `rel="noopener noreferrer"`

#### Support Page (`/support`)
Sections:
1. **Hero**: Title + subtitle with heart emoji
2. **Why Support**: List of benefits (servers, features, no ads)
3. **Monthly Costs**: Visual breakdown with progress bars
4. **Tier Cards**: 3-column grid (1 on mobile)
5. **CTA Button**: Large "Support on GitHub Sponsors" button
6. **Supporters Wall**: (Phase 2) Grid of supporter names

### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `Footer.jsx` | DONE | Heart link next to GitHub |
| `Support.jsx` | DONE | Support page in `/pages` |
| `App.jsx` | MODIFY | Remove SupportButton, keep route |
| `SupportButton.jsx` | DELETE | Not needed - footer link is sufficient |

---

## Deck Manager V2

Enhanced deck management system with import, validation, and community features.

### TCG Format Rules

#### Pokemon TCG - Standard Format (2025)

**Regulation Marks**: Cards must have regulation mark **G**, **H**, or **I** to be legal.

| Regulation | Status | Sets |
|------------|--------|------|
| F | ❌ Rotated out (April 2025) | Sword & Shield era |
| G | ✅ Legal | Scarlet & Violet base onwards |
| H | ✅ Legal | Paldea Evolved onwards |
| I | ✅ Legal | Shrouded Fable onwards |

**Deck Rules**:
| Rule | Value |
|------|-------|
| Total cards | Exactly 60 |
| Max copies per card | 4 (except Basic Energy) |
| Min Basic Pokémon | At least 1 |
| Max ACE SPEC | 1 per deck |
| Max Radiant Pokémon | 1 per deck |

**Reprints Rule**: Old versions of cards without regulation marks can still be used if a legal reprint exists. Example: Rare Candy from Sun & Moon is legal because Rare Candy SVI has regulation mark G.

**Sources**: [Pokemon.com 2025 Rotation](https://www.pokemon.com/us/pokemon-news/2025-pokemon-tcg-standard-format-rotation-announcement), [JustInBasil Rotation Guide](https://www.justinbasil.com/rotation/g-on/introduction)

#### Pokemon TCG - Gym Leader Challenge (GLC)

| Rule | Value |
|------|-------|
| Total cards | Exactly 60 |
| Max copies per card | **1 (Singleton)** |
| Basic Energy | Unlimited |
| Pokémon type | **Single type only** |
| Rule Box Pokémon | **BANNED** (ex, V, VSTAR, VMAX, Radiant) |
| ACE SPEC | **BANNED** |
| Card pool | Expanded (Black & White onwards) |

**Special Rules**:
- Professor Juniper / Sycamore / Research: only 1 of the 3
- Boss's Orders / Lysandre: only 1 of the 2
- Dual-type Pokémon allowed if one type matches deck

**Sources**: [GLC Official Rules](https://gymleaderchallenge.com/rules), [GLC FAQ](https://gymleaderchallenge.com/faq)

#### Riftbound TCG - Constructed

| Component | Quantity |
|-----------|----------|
| Main Deck | Exactly 40 cards |
| Legend | Exactly 1 |
| Battlefields | Exactly 3 |
| Runes | Exactly 12 |
| Max copies | 3 per card |
| Sideboard | 0 or 8 cards |

**Domain Restriction**: Only cards from Legend's 2 domains allowed.

**Domains**: Fury, Calm, Mind, Body, Order, Chaos

**Note**: Riftbound currently has no rotation - all cards are legal.

**Sources**: [Riftbound Core Rules](https://riftbound.gg/core-rules/), [Riot Riftbound Guide](https://riftbound.leagueoflegends.com/en-us/news/rules-and-releases/gameplay-guide-core-rules/)

### Reprints Handling

Cards with the **same name from different sets** count together for copy limits.

```
2 Professor's Research SVI 189
2 Professor's Research PAL 172
= 4 copies of "Professor's Research" ✓ Valid

3 Professor's Research SVI 189
2 Professor's Research PAL 172
= 5 copies of "Professor's Research" ⚠️ Invalid
```

**Name Normalization**:
- "Professor's Research (Professor Oak)" → "Professor's Research"
- "Boss's Orders (Cyrus)" → "Boss's Orders"

**Exceptions**:
- `Pikachu` ≠ `Pikachu ex` (different cards)
- Basic Energy has no copy limit

### Import Formats

#### Pokemon TCG Live
```
Pokémon: 12
4 Pikachu ex SVI 057
4 Raichu SVI 058

Trainer: 36
4 Professor's Research SVI 189

Energy: 12
8 Electric Energy SVE 004
```

#### Pokemon TCG Pocket
```
Pikachu ex x2
Raichu x2
```

#### Riftbound (tcg-arena.fr style)
```
1 Leona, Determined
3 Clockwork Keeper
6 Order Rune
1 Grove of the God-Willow
```

### DeckImportModal Component

**Component**: `frontend/src/components/decks/DeckImportModal.jsx`

Modal for importing decks with real-time preview and auto-detection.

#### Features
| Feature | Description |
|---------|-------------|
| **Real-time Preview** | Parses deck as user types (500ms debounce) |
| **TCG Detection** | Shows Pokemon or Riftbound badge |
| **Format Detection** | Shows Standard, GLC, Expanded, Constructed |
| **Input Format Detection** | Identifies Pokemon TCG Live, Pocket, or Riftbound format |
| **Card Breakdown** | Visual bar showing Pokémon/Trainer/Energy distribution |
| **Parse Warnings** | Shows lines that couldn't be parsed |
| **Auto-Tagging** | Automatically adds detected format tag to deck |

#### UI Flow
```
┌─────────────────────────────────────────────────────┐
│  Importar Mazo                               [X]    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │ Pokémon: 12                                   │  │
│  │ 4 Pikachu ex SVI 057                          │  │
│  │ ...                                           │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  [Pokemon] [Standard] [Pokemon TCG Live] (60%)      │
│                                                     │
│  Vista previa: 60 cartas                            │
│  ■■■■■■■■░░░░░░░░░░░░░░░░░░░░░░░░ Pokémon: 12      │
│  ■■■■■■■■■■■■■■■■■■■■░░░░░░░░░░░░ Trainer: 36      │
│  ■■■■■■░░░░░░░░░░░░░░░░░░░░░░░░░░ Energy: 12       │
│                                                     │
│  4 cartas únicas                                    │
│                                                     │
│  [Cancelar]                        [Importar Mazo]  │
└─────────────────────────────────────────────────────┘
```

#### Integration
```jsx
import DeckImportModal from '../components/decks/DeckImportModal'

<DeckImportModal
  isOpen={showImportModal}
  onClose={() => setShowImportModal(false)}
  onImport={(importData) => {
    // importData.cards - Array of parsed cards
    // importData.tcg - "pokemon" | "riftbound"
    // importData.format - "standard" | "glc" | etc.
    // importData.breakdown - { pokemon, trainer, energy }
    // importData.stats - { totalCards, uniqueCards }
  }}
/>
```

#### API Integration
Uses `POST /api/decks/parse` endpoint for server-side parsing and detection.

### DeckBuilder Interactions

| Action | Result |
|--------|--------|
| Left Click | Add 1 copy |
| Right Click | Remove 1 copy |
| Ctrl + Click | Set exact quantity |
| Drag & Drop | Add card to deck |

### Auto-Detection

**Format Detection** (real-time):
- Detects Standard, GLC, Expanded based on cards
- Updates automatically as user edits deck

**Auto-Tagging** (real-time):
- Pokemon: Energy types, Pokémon types, mechanics (ex, V, etc.)
- Riftbound: Domains, Champion name

### Visual Filters

Toggle icons to show/hide card types:
- **Active**: Full color icon
- **Inactive**: Grayscale icon

Pokemon filters: Fire, Water, Grass, Electric, Psychic, Fighting, Dark, Steel, Dragon, Colorless

Riftbound filters: Fury, Calm, Mind, Body, Order, Chaos

### Community Features

| Feature | Description |
|---------|-------------|
| **My Decks / Community tabs** | Browse personal or public decks |
| **Voting** | 👍/👎 only (no emoji reactions) |
| **Read-only mode** | View others' decks without editing |
| **Comments** | Discuss decks |
| **"El Primero" badge** | First deck with unique hash |

**No limit** on public decks per user.

### Asset Repositories

| Type | Repository | License |
|------|------------|---------|
| Pokemon Type Icons | [duiker101/pokemon-type-svg-icons](https://github.com/duiker101/pokemon-type-svg-icons) | MIT |
| Pokemon Assets | [waydelyle/pokemon-assets](https://github.com/waydelyle/pokemon-assets) | MIT |
| Riftbound Card Data | [OwenMelbz Gist](https://gist.github.com/OwenMelbz/e04dadf641cc9b81cb882b4612343112) | - |
| Riftbound Official | [Riot Developer Portal](https://developer.riotgames.com/docs/riftbound) | API Key |

### Validation Indicators

Deck validation is shown **inline** (no popups):
- ✅ Green: Valid deck
- ⚠️ Yellow: Issues (deck can still be saved)

```
┌────────────────────────────────────────────┐
│  Deck: My Pikachu Deck        [52/60] ⚠️   │
│  Format: [Standard]                        │
│  ⚠️ Missing 8 cards                        │
│  ⚠️ Needs at least 1 Basic Pokémon         │
│  Tags: [Electric] [ex]                     │
└────────────────────────────────────────────┘
```

### API Endpoints (New)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/decks/parse` | Parse deck string, detect TCG/format | No |
| GET | `/api/decks/community` | List public decks | No |
| POST | `/api/decks/:id/vote` | Vote 👍/👎 | No* |

*Anonymous votes allowed (fingerprint-based)

#### POST /api/decks/parse

Parses a deck string and auto-detects the TCG and format.

**Request:**
```json
{
  "deckString": "Pokémon: 12\n4 Pikachu ex SVI 057\n4 Raichu SVI 058\n\nTrainer: 36\n4 Professor's Research SVI 189\n\nEnergy: 12\n8 Electric Energy SVE 004"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tcg": "pokemon",
    "format": "standard",
    "formatConfidence": 60,
    "formatReason": "Default format (60 cards with standard structure)",
    "inputFormat": "pokemon-tcg-live",
    "cards": [
      {
        "cardId": "svi-057",
        "name": "Pikachu ex",
        "quantity": 4,
        "setCode": "svi",
        "setNumber": "057",
        "supertype": "Pokémon"
      }
    ],
    "breakdown": {
      "pokemon": 8,
      "trainer": 4,
      "energy": 8,
      "unknown": 0
    },
    "stats": {
      "totalCards": 20,
      "uniqueCards": 4
    },
    "errors": []
  }
}
```

**Supported Input Formats:**
| Format | `inputFormat` value | Detection |
|--------|---------------------|-----------|
| Pokemon TCG Live | `pokemon-tcg-live` | Section headers (Pokémon/Trainer/Energy) |
| Pokemon TCG Pocket | `pokemon-tcg-pocket` | "Name x2" pattern |
| Riftbound | `riftbound` | "1 Name" pattern + keywords |
| Generic | `generic` | Fallback parser |

**Detected TCGs:** `pokemon`, `riftbound`

**Detected Formats:**
- Pokemon: `standard`, `glc`, `expanded`
- Riftbound: `constructed`

---

## Contributing

See [SDLC Automation Workflow](#sdlc-automation-workflow) for the automated pipeline.

For manual contributions:
1. Create branch from `stage`
2. Make changes
3. Open PR to `stage`
4. After review, merge to `stage`
5. Test on staging.tcgkb.app
6. Merge `stage` to `main` for production

---

## License

MIT
