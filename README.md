# TCGKB - Trading Card Game Knowledge Base

A full-stack multi-TCG platform for card search, community discussion, and collection management.

**Production**: [tcgkb.app](https://tcgkb.app) | **Staging**: [staging.tcgkb.app](https://staging.tcgkb.app)

---

## Quick Start

```bash
# Install dependencies
npm install

# Start development (frontend + backend)
npm run dev

# Frontend: http://localhost:5173
# Backend: http://localhost:3001
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design, tech stack, data models, roles |
| [API Reference](docs/api.md) | All API endpoints with examples |
| [Security](docs/security.md) | Auth flows, OWASP compliance, automation |
| [Features](docs/features/) | Feature specifications |
| [Engineering](docs/engineering/) | Technical implementation notes |

---

## Project Structure

```
TCGKB/
├── frontend/          # React application
├── backend/           # Express API server
├── api/               # Vercel serverless entry
├── docs/              # Documentation
│   ├── architecture.md
│   ├── api.md
│   ├── security.md
│   ├── features/      # Feature specs
│   └── engineering/   # Technical notes
├── .github/           # CI/CD workflows
├── .claude/           # Agent configuration
├── CLAUDE.md          # AI development guidelines
└── README.md          # This file (overview)
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Express.js, MongoDB, Socket.io |
| Auth | JWT (7-day sessions) |
| Deploy | Vercel (serverless) |
| Testing | Playwright (E2E) |

> **Full tech stack details**: See [Architecture](docs/architecture.md)

---

## Core Features

### Multi-TCG Card System
- Transparent search across Pokemon TCG + Riftbound
- 7-day MongoDB cache with TTL auto-expiration
- Fuzzy search with Levenshtein distance

### Community Features
- Nested comments with unlimited depth
- @ mentions for cards
- Emoji reactions (anonymous allowed)
- Real-time updates via Socket.io

### Deck Builder
- Create/manage decks for any supported TCG
- Import/export functionality
- Real-time validation against format rules
- TCG System Locking (prevents mixing cards)

> **Full feature specs**: See [Features](docs/features/)

---

## API Overview

### Key Endpoints

| Category | Endpoints |
|----------|-----------|
| Auth | `POST /api/auth/login`, `POST /api/auth/register` |
| Cards | `GET /api/cards`, `GET /api/cards/:id`, `POST /api/cards/batch` |
| Decks | `GET /api/decks`, `POST /api/decks`, `POST /api/decks/parse` |
| Comments | `GET /api/comments/:cardId`, `POST /api/comments` |

> **Full API reference**: See [API Documentation](docs/api.md)

---

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing key |
| `POKEMON_TCG_API_KEY` | Pokemon TCG API key |
| `CORS_ORIGIN` | Allowed origins |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_EXPIRES_IN` | 7d | Token expiration |
| `GITHUB_TOKEN` | - | For roadmap/bug reports |

> **Full environment setup**: See [Security](docs/security.md)

---

## Development

### Commands

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run test             # Run E2E tests
npm run test:ui          # Visual test UI
npm run sync:pokemon     # Sync card cache
```

### Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production (tcgkb.app) - **PROTECTED** |
| `stage` | Staging (staging.tcgkb.app) |
| `claude/*` | Feature branches |

> **Flow**: `claude/*` → `stage` → human review → `main`

---

## AI Agent System

This project uses automated Claude Code agents via GitHub Actions.

### Pipeline

```
Human wish → @cuervo → @raj → @naty → @bob → Human review
```

### Agents

| Agent | Role | Command |
|-------|------|---------|
| @cuervo | Product Designer | `/cuervo` |
| @raj | Developer | `/raj` |
| @naty | QA Engineer | `/naty` |
| @bob | Security Engineer | `/bob` |

### Team Commands

| Command | Purpose |
|---------|---------|
| `/team` | Team discussions with voting |
| `/workshop` | Learning sessions |

---

## UX Design Principles

| Principle | Description |
|-----------|-------------|
| **ONE floating button max** | Only BugReportButton |
| **Footer for secondary** | Support, GitHub, version |
| **No blocking animations** | User never waits |
| **Minimal UI** | Every pixel must earn its place |

---

## Security

- Password hashing with bcrypt
- JWT authentication (7-day expiry)
- Rate limiting on sensitive endpoints
- Helmet security headers
- CORS whitelist
- Automated Dependabot alerts → GitHub Issues

> **Full security documentation**: See [Security](docs/security.md)

---

## Testing

```bash
npm run test           # Headless
npm run test:ui        # Visual UI
npm run test:headed    # See browser
npm run test:debug     # Debug mode
```

**Framework**: Playwright
**Location**: `.dev/tests/*.spec.js`

---

## Deployment

### Automatic

```bash
git push origin stage  # → staging.tcgkb.app
git push origin main   # → tcgkb.app (requires PR)
```

### Vercel Configuration

```json
{
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/index.js": { "memory": 1024, "maxDuration": 60 }
  }
}
```

---

## Contributing

1. Create branch from `stage`: `claude/<issue>-<name>`
2. Implement following code standards
3. Add i18n translations (ES/EN)
4. Write Playwright tests
5. Create PR to `stage`
6. After review, merge to `main`

> **Full guidelines**: See [CLAUDE.md](CLAUDE.md)

---

## External Integrations

| Service | Purpose | Rate Limits |
|---------|---------|-------------|
| Pokemon TCG API | Card data | 20k/day |
| Riftbound API | Card data | TBD |
| PokeAPI | Sprites | Unlimited |
| GitHub API | Roadmap, bugs | 5k/hour |

---

## Support

TCGKB uses GitHub Sponsors for community support.

- **Main**: [github.com/sponsors/manucruzleiva](https://github.com/sponsors/manucruzleiva)
- **Footer link**: Heart icon in page footer

---

## License

MIT
