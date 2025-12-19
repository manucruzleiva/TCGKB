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

## Support / Monetization

TCGKB uses GitHub Sponsors for community support. This keeps the project ad-free and user-focused.

### Support Components

| Component | Location | Description |
|-----------|----------|-------------|
| **Footer Link** | Footer, next to GitHub link | Heart icon + "Apoyar/Support" text |
| **Support Button** | Floating, bottom-right (above bug button) | Pink heart button, opens GitHub Sponsors |
| **Support Page** | `/support` | Full page explaining project costs and tiers |

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

#### Support Button (Floating)
```
                                    ┌─────┐
                                    │  ❤️ │  ← SupportButton (z-41)
                                    └─────┘
                                    ┌─────┐
                                    │  🐛 │  ← BugReportButton (z-40)
                                    └─────┘
```
- Position: `fixed bottom-24 right-4`
- Style: Pink gradient, white heart icon
- Behavior: Opens GitHub Sponsors in new tab

#### Support Page (`/support`)
Sections:
1. **Hero**: Title + subtitle with heart emoji
2. **Why Support**: List of benefits (servers, features, no ads)
3. **Monthly Costs**: Visual breakdown with progress bars
4. **Tier Cards**: 3-column grid (1 on mobile)
5. **CTA Button**: Large "Support on GitHub Sponsors" button
6. **Supporters Wall**: (Phase 2) Grid of supporter names

### i18n Keys Required
```javascript
support: {
  footerLink: 'Apoyar' / 'Support',
  buttonTooltip: 'Apoya TCGKB' / 'Support TCGKB',
  pageTitle: 'Apoya TCGKB' / 'Support TCGKB',
  pageSubtitle: 'Ayuda a mantener este proyecto vivo',
  whySupport: { title, reason1, reason2, reason3, reason4 },
  costs: { title, hosting, database, apis, domain },
  tiers: { title, supporter, champion, hero },
  cta: { primary, oneTime },
  thanks: { title, anonymous }
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `Footer.jsx` | MODIFY | Add heart link next to GitHub |
| `SupportButton.jsx` | CREATE | Floating support button component |
| `Support.jsx` | CREATE | Support page in `/pages` |
| `App.jsx` | MODIFY | Add `/support` route |
| `es.js` | MODIFY | Add support translations |
| `en.js` | MODIFY | Add support translations |

### Implementation Priority
1. **P0**: Footer link (30 min) - Quick win, immediate visibility
2. **P0**: i18n translations (30 min) - Required for all components
3. **P1**: Support page (2-3 hours) - Main content
4. **P1**: Support button (1 hour) - Additional visibility
5. **P2**: Supporters wall (Phase 2) - Requires GitHub API

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
