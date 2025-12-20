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
- **Regulation mark filtering** (G, H, I, J, K only) (for PTCGL only)
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
- **Roadmap** to show users the development work
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

### Deploy Commands
```bash
# Automatic (recommended): Push to branch triggers deploy
git push origin stage  # → staging.tcgkb.app
git push origin main   # → tcgkb.app (requires PR)

# Manual CLI deploy
vercel --prod          # Deploy to production
vercel                 # Deploy preview

# Verify deployment
curl https://tcgkb.app/api/health
vercel logs --follow   # Watch live logs
```

### Serverless Entry Point
The `api/index.js` file re-exports the Express app for Vercel serverless:
```javascript
// api/index.js - Vercel requires functions in /api/ root
import app from '../backend/api/index.js'
export default app
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

**GitHub Actions Secrets**:
- `SECURITY_PAT` - PAT for security automation (requires `repo`, `security_events` scopes). See [Security Automation](#security-automation).

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

### Security Automation

Automated workflow that converts Dependabot security alerts into tracked GitHub Issues.

**Workflow**: `.github/workflows/security-check.yml`

#### Features
| Feature | Description |
|---------|-------------|
| **Auto-Issue Creation** | Creates GitHub Issue for each new Dependabot alert |
| **Priority Labels** | Assigns P0-P3 labels based on severity |
| **Duplicate Detection** | Skips alerts that already have an issue |
| **Daily Schedule** | Runs at 8:00 AM UTC daily |
| **Manual Trigger** | Can be run on-demand via workflow_dispatch |

#### Priority Mapping
| Severity | Label | Color | SLA |
|----------|-------|-------|-----|
| Critical | `P0-Critical` | Red | Immediate |
| High | `P1-High` | Orange | 24-48h |
| Medium | `P2-Medium` | Yellow | 1 week |
| Low | `P3-Low` | Green | 2 weeks |

#### Issue Labels
Each created issue receives:
- `security` - For filtering security issues
- `dependabot` - Source identification
- `P0-P3` - Priority based on severity

#### Configuration Required

**Secret**: `SECURITY_PAT` (Personal Access Token)

Required scopes:
- `repo` - Full repository access
- `security_events` - Read security alerts

**Setup steps:**
1. Create PAT: https://github.com/settings/tokens/new?scopes=repo,security_events
2. Add as secret: Repository → Settings → Secrets → Actions → `SECURITY_PAT`

#### Manual Execution
```bash
# Trigger workflow manually
gh workflow run security-check.yml

# Check run status
gh run list --workflow=security-check.yml --limit 1
```

#### Flow Diagram
```
┌─────────────────────────────────────────────────────────────────┐
│                 SECURITY ALERT AUTOMATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Dependabot ────▶ GitHub Action ────▶ Issue Created            │
│     Alert              │              with Priority Label        │
│                        │                                         │
│   Schedule: 8am UTC    │                                         │
│   Manual: workflow_dispatch                                      │
│                        │                                         │
│                        ▼                                         │
│              @bob reviews ──▶ @raj implements fix                │
│                                                                  │
│   ⚠️ Security issues are filtered from public roadmap           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

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

#### Reprint Grouping UI

The DeckImportModal displays a collapsible "Copy limits" section that groups cards by normalized name:

```
┌─────────────────────────────────────────────────────────────────┐
│  Copy limits (4 unique cards) [1 exceed limit]           [▼]   │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Professor's Research                            [4/4] ✓   │  │
│  │   ├─ SVI 189 ×2                                           │  │
│  │   └─ PAL 172 ×2                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Boss's Orders                                   [5/4] ⚠️  │  │
│  │   ├─ PAL 172 ×3                                           │  │
│  │   └─ BRS 132 ×2                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Lightning Energy                                [8] ∞     │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Status indicators**:
| Status | Color | Icon | Description |
|--------|-------|------|-------------|
| `valid` | Gray | - | Under limit |
| `at_limit` | Green | ✓ | At max copies |
| `exceeded` | Yellow | ⚠️ | Over limit (still saveable) |
| `unlimited` | Blue | ∞ | Basic Energy (no limit) |

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

Modal for importing decks with real-time preview, auto-detection, and **validation**.

#### Features
| Feature | Description |
|---------|-------------|
| **Real-time Preview** | Parses deck as user types (500ms debounce) |
| **Real-time Validation** | Validates deck structure against format rules (see [Card Enrichment](#card-enrichment-real-time-validation)) |
| **TCG Detection** | Shows Pokemon or Riftbound badge |
| **Format Detection** | Auto-detects Standard, GLC, Expanded, Constructed |
| **Format Override** | Dropdown to manually override detected format |
| **Input Format Detection** | Identifies Pokemon TCG Live, Pocket, or Riftbound format |
| **Card Breakdown** | Visual bar showing Pokémon/Trainer/Energy distribution |
| **Copy Limits** | Collapsible section showing reprint grouping ([see above](#reprint-grouping-ui)) |
| **Parse Warnings** | Shows lines that couldn't be parsed |
| **Validation Errors** | Shows deck rule violations inline (not popup) |
| **Auto-Tagging** | Automatically adds detected format tag to deck |

#### Real-time Format Detection

The format is auto-detected based on deck composition:

| Condition | Detected Format |
|-----------|----------------|
| Singleton deck, no Rule Box Pokemon | GLC |
| Contains Expanded-era sets | Expanded |
| Default for 60-card Pokemon deck | Standard |
| Contains Riftbound keywords | Constructed |

**Manual Override**: Users can select a different format from the dropdown. When overridden:
- Shows "Manual" badge next to format selector
- Validation rules update immediately (e.g., copy limits change from 4 to 1 for GLC)
- Confidence indicator is hidden
- `isFormatOverride: true` is included in parse result

#### Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECK IMPORT FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  User pastes       500ms         POST /api/decks/parse                      │
│  deck text ─────► debounce ─────► ┌───────────────────────────────────┐    │
│                                   │ 1. deckParser.js                  │    │
│                                   │    - Extract cards from text      │    │
│                                   │    - Detect TCG (Pokemon/Riftbound)│    │
│                                   │    - Detect format (Standard/GLC) │    │
│                                   ├───────────────────────────────────┤    │
│                                   │ 2. cardEnricher.service.js        │    │
│                                   │    - Query CardCache for metadata │    │
│                                   │    - Add supertype, subtypes, etc │    │
│                                   ├───────────────────────────────────┤    │
│                                   │ 3. deckValidator.js               │    │
│                                   │    - Validate against format rules│    │
│                                   │    - Return errors/warnings       │    │
│                                   └───────────────┬───────────────────┘    │
│                                                   │                         │
│                                                   ▼                         │
│  DeckImportModal ◄──────────────────────────────────                        │
│  ┌─────────────────────────────────────────────────────┐                    │
│  │ Shows: Preview + Breakdown + Validation Status      │                    │
│  └─────────────────────────────────────────────────────┘                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### UI Flow (with Validation)
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
│  ┌─────────────────────────────────────────────┐    │
│  │ ✅ Mazo válido                    [60/60]   │    │
│  │ Basic Pokémon: 4  │ ACE SPEC: 1/1           │    │
│  └─────────────────────────────────────────────┘    │
│  OR                                                 │
│  ┌─────────────────────────────────────────────┐    │
│  │ ⚠️ Mazo inválido                  [52/60]   │    │
│  │ Errores:                                    │    │
│  │ • El mazo debe tener exactamente 60 cartas  │    │
│  │ • El mazo debe tener al menos 1 Basic Pokémon│   │
│  └─────────────────────────────────────────────┘    │
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
    // importData.cards - Array of enriched cards (with metadata)
    // importData.tcg - "pokemon" | "riftbound"
    // importData.format - "standard" | "glc" | etc.
    // importData.breakdown - { pokemon, trainer, energy }
    // importData.stats - { totalCards, uniqueCards }
    // importData.validation - { isValid, errors, warnings, summary }
  }}
/>
```

#### API Integration
Uses `POST /api/decks/parse` endpoint for server-side parsing, enrichment, and validation.

**Request Flow:**
1. **Parse** deck text → extract cards
2. **Enrich** cards with CardCache metadata → add supertype, subtypes, types
3. **Validate** against format rules → return errors/warnings

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

### Validation Rules

#### Pokemon Standard
| Rule | Requirement |
|------|-------------|
| Total cards | Exactly 60 |
| Copy limit | Max 4 per name (except Basic Energy) |
| Basic Pokémon | At least 1 required |
| ACE SPEC | Max 1 per deck |
| Radiant Pokémon | Max 1 per deck |
| Regulation marks | G, H, I only (current rotation) |

#### Pokemon GLC (Gym Leader Challenge)
| Rule | Requirement |
|------|-------------|
| Total cards | Exactly 60 |
| Copy limit | 1 per name (Singleton, except Basic Energy) |
| Pokémon type | Single type only |
| Rule Box | Prohibited (ex, V, VSTAR, VMAX, Radiant) |
| ACE SPEC | Prohibited |

#### Riftbound Constructed
| Rule | Requirement |
|------|-------------|
| Main Deck | Exactly 40 cards |
| Legend | Exactly 1 |
| Battlefields | Exactly 3 |
| Runes | Exactly 12 |
| Copy limit | Max 3 per name |
| Sideboard | 0 or 8 cards (optional) |

### DeckValidationIndicator Component

**Component**: `frontend/src/components/decks/DeckValidationIndicator.jsx`

> **Used by**: [DeckImportModal](#deckimportmodal-component) to show validation results inline.

Displays real-time validation status inline (never as popup/modal).

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `validation` | Object | `{ isValid, errors, warnings, summary }` |
| `format` | String | Detected format (standard, glc, etc.) |
| `compact` | Boolean | Show compact version (default: false) |

#### Usage
```jsx
import DeckValidationIndicator from '../components/decks/DeckValidationIndicator'

<DeckValidationIndicator
  validation={parseResult.validation}
  format={parseResult.format}
  compact={false}
/>
```

### DeckCardInteractive Component

**Component**: `frontend/src/components/decks/DeckCardInteractive.jsx`

Interactive card component for deck building with full mouse and drag support.

#### Features
| Interaction | Mode: Search | Mode: Deck |
|-------------|--------------|------------|
| Left Click | Add 1 copy | Show hover controls |
| Right Click | - | Remove 1 copy |
| Ctrl + Click | Set quantity modal | Set quantity modal |
| Drag | Start drag | - |

#### Props
| Prop | Type | Description |
|------|------|-------------|
| `card` | Object | Card data with id, name, images, supertype, quantity |
| `mode` | String | `'search'` or `'deck'` |
| `onAdd` | Function | `(card, quantity) => void` |
| `onRemove` | Function | `(cardId) => void` |
| `onDelete` | Function | `(cardId) => void` |
| `onSetQuantity` | Function | `(cardId, quantity) => void` |
| `maxQuantity` | Number | Max copies allowed (default: 4, 60 for energy) |
| `draggable` | Boolean | Enable drag (default: true) |

#### Usage
```jsx
import DeckCardInteractive, { DeckDropZone } from '../components/decks/DeckCardInteractive'

// Search results (draggable cards)
<DeckCardInteractive
  card={searchResult}
  mode="search"
  onAdd={handleAdd}
  draggable={true}
/>

// Deck cards (with controls)
<DeckDropZone onDrop={handleDrop}>
  <DeckCardInteractive
    card={deckCard}
    mode="deck"
    onAdd={handleAdd}
    onRemove={handleRemove}
    onDelete={handleDelete}
    onSetQuantity={handleSetQty}
  />
</DeckDropZone>
```

### API Endpoints (New)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/decks/parse` | Parse deck string, detect TCG/format | No |
| GET | `/api/decks/community` | List public decks | No |
| POST | `/api/decks/:id/vote` | Vote 👍/👎 | No* |

*Anonymous votes allowed (fingerprint-based)

#### POST /api/decks/parse

Parses a deck string, auto-detects TCG/format, and validates against format rules.

**Request:**
```json
{
  "deckString": "Pokémon: 12\n4 Pikachu ex SVI 057\n...",
  "format": null,
  "validate": true
}
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `deckString` | String | required | The deck text to parse |
| `format` | String | `null` | Manual format override (`standard`, `glc`, `expanded`, `constructed`) |
| `validate` | Boolean | `true` | Run format validation |

**Response:**
```json
{
  "success": true,
  "data": {
    "tcg": "pokemon",
    "format": "standard",
    "autoDetectedFormat": "standard",
    "isFormatOverride": false,
    "formatConfidence": 70,
    "formatReasons": ["Standard rotation sets"],
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
    "reprintGroups": [
      {
        "normalizedName": "pikachu ex",
        "displayName": "Pikachu ex",
        "totalQuantity": 4,
        "limit": 4,
        "isBasicEnergy": false,
        "exceedsLimit": false,
        "status": "at_limit",
        "cards": [
          { "name": "Pikachu ex", "setCode": "SVI", "number": "057", "quantity": 4 }
        ]
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
      "uniqueCards": 4,
      "uniqueNames": 4,
      "groupsExceedingLimit": 0
    },
    "errors": [],
    "validation": {
      "isValid": false,
      "format": "standard",
      "errors": [
        {
          "type": "card_count",
          "message": "Deck must have exactly 60 cards (currently 20)",
          "current": 20,
          "expected": 60
        }
      ],
      "warnings": [],
      "summary": {
        "totalCards": 20,
        "basicPokemon": 2,
        "aceSpecs": 0,
        "radiants": 0,
        "uniqueCards": 4
      }
    }
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

### Card Enrichment (Real-time Validation)

> **Context**: This service is a critical component of the [DeckImportModal](#deckimportmodal-component) real-time validation feature. It enables accurate deck validation by enriching parsed cards with metadata from CardCache.

The deck parser extracts text data, but validation requires card metadata. The **Card Enrichment** service bridges this gap.

#### The Problem

```
Parser Output:           Validator Needs:
┌──────────────────┐     ┌──────────────────┐
│ name: "Pikachu"  │     │ supertype        │ ← Missing!
│ setCode: "SVI"   │     │ subtypes         │ ← Missing!
│ setNumber: "057" │     │ types            │ ← Missing!
│ quantity: 4      │     │ regulationMark   │ ← Missing!
└──────────────────┘     └──────────────────┘
```

Without metadata, these validations **CANNOT** work:
- "At least 1 Basic Pokémon" (needs `subtypes: ["Basic"]`)
- "No Rule Box in GLC" (needs `subtypes` for ex, V detection)
- "Single Pokémon type in GLC" (needs `types` array)
- "Regulation mark check" (needs `regulationMark` field)

#### Solution: Card Enrichment Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   deckParser.js  │────▶│cardEnricher.js   │────▶│ deckValidator.js │
│                  │     │                  │     │                  │
│ Extracts:        │     │ Adds from Cache: │     │ Validates:       │
│ - name           │     │ - supertype      │     │ - 60 cards       │
│ - setCode        │     │ - subtypes       │     │ - 4 copy limit   │
│ - setNumber      │     │ - types          │     │ - Basic Pokémon  │
│ - quantity       │     │ - regulationMark │     │ - ACE SPEC       │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │   CardCache DB   │
                         │ Batch query $in  │
                         └──────────────────┘
```

#### Service: `cardEnricher.service.js`

**Location**: `backend/src/services/cardEnricher.service.js`

| Function | Description |
|----------|-------------|
| `enrichDeckCards(cards, tcg)` | Main function - enriches parsed cards with CardCache metadata |
| `generatePossibleIds(card)` | Generates card IDs to search (e.g., `svi-057`, `svi-57`) |
| `batchLookupCards(ids)` | Single DB call with `$in` operator for performance |
| `lookupByName(name)` | Fallback for cards without set codes (limited to 10) |
| `getEnrichmentRate(cards)` | Returns % of cards successfully enriched |

#### Performance Requirements

| Metric | Target | Reason |
|--------|--------|--------|
| Enrichment time | <500ms | Must complete within 500ms debounce window |
| DB calls | 1 | Use `$in` batch query, not individual lookups |
| Name fallbacks | Max 10 | Prevent slow queries for Pocket format |

#### Enriched Card Structure

```javascript
// Before enrichment
{
  cardId: "svi-057",
  name: "Pikachu ex",
  quantity: 4,
  setCode: "svi",
  setNumber: "057",
  supertype: null  // Only known if from section header
}

// After enrichment
{
  cardId: "svi-057",
  name: "Pikachu ex",
  quantity: 4,
  setCode: "svi",
  setNumber: "057",
  supertype: "Pokémon",      // ✅ From CardCache
  subtypes: ["Basic", "ex"], // ✅ From CardCache
  types: ["Lightning"],      // ✅ From CardCache
  regulationMark: "G",       // ✅ From CardCache
  _enriched: true            // ✅ Flag for tracking
}
```

#### Enrichment Stats Response

```json
{
  "enrichment": {
    "total": 15,
    "enriched": 14,
    "notFound": 1,
    "durationMs": 123
  }
}
```

#### Related Issues

| Issue | Description |
|-------|-------------|
| [#36](https://github.com/manucruzleiva/TCGKB/issues/36) | DM-V2-21: Card Enrichment Service implementation |
| [#37](https://github.com/manucruzleiva/TCGKB/issues/37) | DM-V2-22: Real-time validation in DeckImportModal |

---

## Progressive Web App (PWA)

TCGKB is a fully offline-capable Progressive Web App with mobile-first design.

### PWA Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PWA ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│  │   React App     │────▶│  Service Worker │────▶│    Cache API        │   │
│  │  (UI Layer)     │◀────│  (sw.js)        │◀────│  (Static + Dynamic) │   │
│  └────────┬────────┘     └────────┬────────┘     └─────────────────────┘   │
│           │                       │                                         │
│           ▼                       ▼                                         │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │ Connectivity    │     │   IndexedDB     │                               │
│  │ Context         │     │  (Card Cache)   │                               │
│  │ (online/offline)│     │  (Deck Cache)   │                               │
│  └─────────────────┘     └─────────────────┘                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CACHE STRATEGIES                              │   │
│  ├──────────────────┬──────────────────┬───────────────────────────────┤   │
│  │ Cache-First      │ Network-First    │ Stale-While-Revalidate       │   │
│  │ (Static assets)  │ (API calls)      │ (Card images)                 │   │
│  └──────────────────┴──────────────────┴───────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Offline Mode UX

#### Core Principle
**"Always available, clearly communicated"** - Users can access cached content anytime with clear visual feedback about connectivity status.

#### Offline Banner

When offline, a persistent banner appears at the top of the screen:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚡ Sin conexión - Mostrando contenido guardado                    [Retry]   │
└─────────────────────────────────────────────────────────────────────────────┘
│                                HEADER                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                CONTENT                                       │
```

**Banner States:**
| State | Color | Icon | Message (ES) | Message (EN) |
|-------|-------|------|--------------|--------------|
| Offline | `bg-yellow-500` | ⚡ | Sin conexión - Mostrando contenido guardado | Offline - Showing cached content |
| Reconnecting | `bg-blue-500` | 🔄 | Reconectando... | Reconnecting... |
| Back Online | `bg-green-500` | ✅ | Conexión restaurada | Connection restored |

**Behavior:**
- Banner appears immediately when connection is lost
- "Back Online" banner auto-dismisses after 3 seconds
- Retry button triggers manual reconnection attempt
- Banner is sticky at top, above header (z-index: 50)

#### Visual Indicators for Offline Features

All UI elements that require connectivity show clear visual cues:

```
┌────────────────────────────────────────────────────┐
│  💬 Comentarios                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ (Modo offline: solo lectura)                 │  │  ← Gray overlay when offline
│  │                                              │  │
│  │  📝 Escribir comentario...  [Deshabilitado]  │  │  ← Disabled input
│  │                                              │  │
│  │  💬 Comentario cacheado 1                    │  │  ← Cached comments visible
│  │  💬 Comentario cacheado 2                    │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**Feature Availability Matrix:**

| Feature | Online | Offline | Offline Behavior |
|---------|--------|---------|------------------|
| **View cards** | ✅ | ✅ | From IndexedDB cache |
| **Search cards** | ✅ | ✅ | Local search in cached cards |
| **View decks** | ✅ | ✅ | From IndexedDB cache |
| **Edit my decks** | ✅ | ✅ | Local edits, sync when online |
| **View comments** | ✅ | ✅ | Cached comments only |
| **Write comments** | ✅ | ❌ | Disabled with tooltip |
| **Add reactions** | ✅ | ❌ | Disabled, show cached counts |
| **Login/Register** | ✅ | ❌ | Redirect to offline notice |
| **View settings** | ✅ | ✅ | Full access |
| **Change settings** | ✅ | ✅ | Local save, sync when online |
| **Import deck** | ✅ | ⚠️ | Parse works, validation limited |

**Disabled Element Styling:**
```css
/* Offline-disabled elements */
.offline-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
  position: relative;
}

.offline-disabled::after {
  content: "Requires internet";
  position: absolute;
  /* tooltip styling */
}
```

### ConnectivityContext

New React context to manage connectivity state across the app.

**Location**: `frontend/src/contexts/ConnectivityContext.jsx`

**API:**
```jsx
const {
  isOnline,           // boolean - current connection state
  wasOffline,         // boolean - was offline in this session (for sync)
  lastOnline,         // Date - timestamp of last online state
  reconnect,          // () => void - manual reconnection attempt
  pendingChanges,     // number - count of changes to sync
  syncStatus          // 'idle' | 'syncing' | 'error' | 'success'
} = useConnectivity()
```

**Usage Example:**
```jsx
import { useConnectivity } from '../contexts/ConnectivityContext'

const CommentComposer = () => {
  const { isOnline } = useConnectivity()

  return (
    <textarea
      disabled={!isOnline}
      className={!isOnline ? 'offline-disabled' : ''}
      placeholder={isOnline ? 'Escribe un comentario...' : 'Requiere conexión'}
    />
  )
}
```

### OfflineBanner Component

**Location**: `frontend/src/components/common/OfflineBanner.jsx`

**Props:**
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showRetry` | boolean | true | Show retry button |
| `autoDismiss` | boolean | true | Auto-hide "back online" state |
| `dismissDelay` | number | 3000 | Milliseconds before auto-dismiss |

**Tailwind Classes:**
```jsx
// Banner container
"fixed top-0 left-0 right-0 z-50 transition-all duration-300"

// Offline state
"bg-yellow-500 text-yellow-900"

// Reconnecting state
"bg-blue-500 text-white"

// Back online state
"bg-green-500 text-white"
```

### Service Worker Enhancement

**Cache Strategies by Resource Type:**

| Resource | Strategy | Cache Name | TTL |
|----------|----------|------------|-----|
| App shell (HTML, JS, CSS) | Cache-First | `tcgkb-static-v1` | ∞ (versioned) |
| Card images | Stale-While-Revalidate | `tcgkb-images-v1` | 30 days |
| API responses (GET) | Network-First | `tcgkb-api-v1` | 7 days |
| Fonts | Cache-First | `tcgkb-fonts-v1` | ∞ |
| User data | IndexedDB | N/A | Persistent |

**New sw.js Features:**
```javascript
// Cache versioning for updates
const CACHE_VERSION = 2
const STATIC_CACHE = `tcgkb-static-v${CACHE_VERSION}`
const IMAGE_CACHE = `tcgkb-images-v${CACHE_VERSION}`
const API_CACHE = `tcgkb-api-v${CACHE_VERSION}`

// Precache list
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'  // New: dedicated offline fallback page
]

// Background sync for pending actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-changes') {
    event.waitUntil(syncPendingChanges())
  }
})
```

### IndexedDB Schema

Local database for offline data persistence.

**Database**: `tcgkb-offline`

**Object Stores:**

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| `cards` | `id` | `name`, `setCode`, `lastAccessed` | Cached card data |
| `decks` | `id` | `userId`, `lastModified` | User's decks (synced) |
| `comments` | `id` | `cardId`, `deckId`, `createdAt` | Cached comments |
| `pendingActions` | `id` | `type`, `createdAt` | Offline mutations to sync |
| `userPreferences` | `key` | - | Settings and preferences |

**Pending Actions Schema:**
```javascript
{
  id: 'uuid',
  type: 'CREATE_COMMENT' | 'UPDATE_DECK' | 'ADD_REACTION',
  payload: { /* action-specific data */ },
  createdAt: Date,
  retryCount: 0,
  status: 'pending' | 'syncing' | 'failed'
}
```

### Mobile-First Design

#### Touch Interactions

| Gesture | Action | Where |
|---------|--------|-------|
| Swipe down | Refresh content | Any list view |
| Swipe left on card | Quick add to deck | Card grid |
| Long press | Context menu | Cards, comments |
| Pull from edge | Open drawer menu | Mobile only |

#### Responsive Breakpoints (Tailwind)

| Breakpoint | Viewport | Layout Changes |
|------------|----------|----------------|
| `xs` (default) | <640px | Single column, bottom nav, larger touch targets |
| `sm` | ≥640px | Two columns for cards |
| `md` | ≥768px | Sidebar visible, three columns |
| `lg` | ≥1024px | Full desktop layout |

#### Mobile-Specific Components

**MobileBottomNav** (visible only on xs):
```
┌─────────────────────────────────────────────────────────────────┐
│  🏠 Home    🔍 Search    🃏 Decks    ⚙️ Settings    👤 Profile  │
└─────────────────────────────────────────────────────────────────┘
```

**Tailwind Classes:**
```jsx
"fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t
 border-gray-200 dark:border-gray-700 md:hidden z-40 safe-area-inset-bottom"
```

#### Touch Target Sizes

All interactive elements follow minimum touch target guidelines:
- Minimum size: 44x44px (WCAG 2.1 AAA)
- Recommended size: 48x48px
- Spacing between targets: 8px minimum

### Install Prompt (A2HS)

**InstallPrompt Component**: `frontend/src/components/common/InstallPrompt.jsx`

Shows install prompt for eligible users.

**Display Conditions:**
1. Browser supports PWA installation
2. App is not already installed
3. User has visited at least 2 pages OR spent 30+ seconds
4. User hasn't dismissed the prompt in last 7 days

**UI (Mobile Bottom Sheet):**
```
┌─────────────────────────────────────────────────────────────────┐
│                                                            [X]  │
│  ┌──────┐  Instala TCGKB                                       │
│  │ LOGO │  Accede más rápido y usa sin conexión                │
│  └──────┘                                                       │
│                                                                 │
│  [Ahora no]                                    [Instalar App]   │
└─────────────────────────────────────────────────────────────────┘
```

**Tailwind Classes:**
```jsx
// Mobile bottom sheet
"fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800
 rounded-t-2xl shadow-2xl p-6 z-50 animate-slide-up
 safe-area-inset-bottom md:bottom-auto md:right-4 md:left-auto
 md:w-80 md:rounded-lg md:mb-4"
```

### Push Notifications (Phase 2)

**Note**: Push notifications are planned for Phase 2 implementation.

**Notification Types:**
| Type | Trigger | Priority |
|------|---------|----------|
| New comment reply | Someone replies to user's comment | High |
| Deck featured | User's deck is featured | Medium |
| New set release | New card set is available | Low |

### PWA Manifest Updates

**Updated manifest.json:**
```json
{
  "name": "TCG Knowledge Base",
  "short_name": "TCGKB",
  "description": "Base de conocimiento para Pokemon TCG y otros juegos de cartas",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "scope": "/",
  "icons": [
    {
      "src": "/icons/icon-72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "categories": ["games", "entertainment", "utilities"],
  "lang": "es",
  "dir": "ltr",
  "prefer_related_applications": false,
  "shortcuts": [
    {
      "name": "Buscar Cartas",
      "short_name": "Buscar",
      "url": "/",
      "icons": [{ "src": "/icons/search-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Mis Mazos",
      "short_name": "Mazos",
      "url": "/decks",
      "icons": [{ "src": "/icons/deck-96.png", "sizes": "96x96" }]
    },
    {
      "name": "Catálogo",
      "short_name": "Catálogo",
      "url": "/catalog",
      "icons": [{ "src": "/icons/catalog-96.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-home.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/desktop-home.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ]
}
```

### Implementation Phases

| Phase | Features | Priority |
|-------|----------|----------|
| **Phase 1** | ConnectivityContext, OfflineBanner, Service Worker upgrade | High |
| **Phase 2** | IndexedDB integration, offline deck editing | High |
| **Phase 3** | Background sync for pending actions | Medium |
| **Phase 4** | InstallPrompt, improved caching | Medium |
| **Phase 5** | Push notifications, MobileBottomNav | Low |

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/contexts/ConnectivityContext.jsx` | CREATE | Connectivity state management |
| `frontend/src/components/common/OfflineBanner.jsx` | CREATE | Offline notification banner |
| `frontend/src/components/common/InstallPrompt.jsx` | CREATE | PWA install prompt |
| `frontend/src/components/layout/MobileBottomNav.jsx` | CREATE | Mobile bottom navigation |
| `frontend/src/hooks/useOfflineStorage.js` | CREATE | IndexedDB wrapper hook |
| `frontend/src/services/offlineSync.js` | CREATE | Background sync service |
| `frontend/public/sw.js` | MODIFY | Enhanced service worker |
| `frontend/public/manifest.json` | MODIFY | Extended manifest |
| `frontend/public/offline.html` | CREATE | Offline fallback page |
| `frontend/src/App.jsx` | MODIFY | Add ConnectivityProvider, OfflineBanner |
| `frontend/src/i18n/es.json` | MODIFY | Add offline translations |
| `frontend/src/i18n/en.json` | MODIFY | Add offline translations |

### i18n Keys

```json
{
  "offline": {
    "banner": {
      "offline": "Sin conexión - Mostrando contenido guardado",
      "reconnecting": "Reconectando...",
      "backOnline": "Conexión restaurada",
      "retry": "Reintentar"
    },
    "features": {
      "readOnly": "Solo lectura sin conexión",
      "requiresConnection": "Requiere conexión a internet",
      "pendingSync": "{{count}} cambios pendientes de sincronizar"
    },
    "install": {
      "title": "Instala TCGKB",
      "description": "Accede más rápido y usa sin conexión",
      "installButton": "Instalar App",
      "dismissButton": "Ahora no"
    }
  }
}
```

### Accessibility Considerations

| Requirement | Implementation |
|-------------|----------------|
| Offline banner announced | `role="alert"` + `aria-live="polite"` |
| Disabled elements | `aria-disabled="true"` + visible tooltip |
| Install prompt | Focus trap, dismissible with Escape |
| Touch targets | Minimum 44x44px, 48x48px recommended |
| Color contrast | 4.5:1 for all text in banners |

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
