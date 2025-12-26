# TCGKB - API Reference

> **Source of Truth** for all API endpoints.
> Last updated: 2025-12-26
> by @raj

---

## Base URL

| Environment | Base URL |
|-------------|----------|
| Production | `https://tcgkb.app/api` |
| Staging | `https://staging.tcgkb.app/api` |
| Local | `http://localhost:3001/api` |

---

## Authentication

Most endpoints require JWT authentication via Bearer token:

```http
Authorization: Bearer <token>
```

Tokens are obtained via `/api/auth/login` and expire after 7 days.

---

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

---

## Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Login, get JWT | No |
| GET | `/api/auth/me` | Current user info | Yes |

### Cards

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cards` | List cards (paginated) | No |
| GET | `/api/cards/:id` | Card detail | No |
| GET | `/api/cards/search` | Search for @ mentions | No |
| GET | `/api/cards/stats` | Card statistics | No |
| POST | `/api/cards/batch` | Get multiple cards by IDs | No |

#### POST /api/cards/batch

Fetch multiple cards in a single request.

**Request:**
```json
{
  "ids": ["sv1-25", "sv1-189", "sv1-257"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cards": {
      "sv1-25": { "id": "sv1-25", "name": "Pikachu ex", ... }
    },
    "notFound": ["invalid-id"]
  }
}
```

### Comments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/comments/:cardId` | Get comment tree | No |
| POST | `/api/comments` | Create comment | Yes |
| PUT | `/api/comments/:id` | Edit comment | Yes |
| DELETE | `/api/comments/:id` | Delete comment | Yes |
| PATCH | `/api/comments/:id/hide` | Toggle visibility | Mod+ |

### Reactions

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/reactions` | Add reaction | No* |
| DELETE | `/api/reactions` | Remove reaction | No* |
| GET | `/api/reactions/:type/:id` | Get aggregated reactions | No |

*Anonymous reactions allowed (fingerprint-based)

### Decks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/decks` | List user decks | Yes |
| POST | `/api/decks` | Create deck | Yes |
| POST | `/api/decks/parse` | Parse deck string (with enrichment) | No |
| GET | `/api/decks/community` | List community decks | No |
| GET | `/api/decks/:id` | Deck detail | Partial* |
| PUT | `/api/decks/:id` | Update deck | Yes |
| DELETE | `/api/decks/:id` | Delete deck | Yes |
| POST | `/api/decks/:id/vote` | Upvote/downvote deck | Optional** |
| GET | `/api/decks/:id/votes` | Get vote counts | No |

*Public decks viewable by anyone, private require auth
**Anonymous voting allowed (fingerprint-based)

#### POST /api/decks/parse

Parses a deck string, auto-detects TCG/format, and validates.

**Supported Formats:**
- **PTCGL Format** (Recommended): `<qty> <card name> <PTCGL code> <number>`
  - Example: `4 Pikachu ex SVI 057`
  - Uses 3-letter set codes (SVI, PAR, MEW, etc.)
- **TCGdex Format**: `<qty> <card name> <set id>-<number>`
  - Example: `4 Pikachu ex sv01-057`

**Request:**
```json
{
  "deckString": "Pokémon: 12\n4 Pikachu ex SVI 057\n...",
  "format": null,
  "validate": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tcg": "pokemon",
    "format": "standard",
    "formatConfidence": 70,
    "inputFormat": "pokemon-tcg-live",
    "cards": [
      {
        "cardId": "svi-057",
        "name": "Pikachu ex",
        "quantity": 4,
        "supertype": "Pokémon",
        "subtypes": ["Basic", "ex"]
      }
    ],
    "breakdown": { "pokemon": 12, "trainer": 36, "energy": 12 },
    "validation": {
      "isValid": true,
      "errors": [],
      "warnings": [],
      "summary": { "totalCards": 60, "basicPokemon": 4, "aceSpecs": 1 }
    },
    "enrichment": {
      "totalCards": 60,
      "enrichedCount": 58,
      "unenrichedCount": 2
    }
  }
}
```

#### GET /api/decks/community

List public community decks with filtering, sorting, and pagination.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 50) |
| `tcg` | string | - | Filter by TCG: `pokemon`, `riftbound` |
| `format` | string | - | Filter by format: `standard`, `expanded`, `glc` |
| `sort` | string | `recent` | Sort order: `recent`, `popular`, `votes` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "abc123",
      "name": "Pikachu ex Control",
      "tcgSystem": "pokemon",
      "format": "standard",
      "cardCount": 60,
      "isPublic": true,
      "isOriginal": true,
      "votes": { "up": 15, "down": 2 },
      "viewCount": 342,
      "copyCount": 28,
      "createdAt": "2025-12-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 5,
    "totalDecks": 98
  }
}
```

#### POST /api/decks/:id/vote

Vote on a community deck. Supports both authenticated and anonymous voting.

**Request:**
```json
{
  "vote": "up"  // "up" or "down"
}
```

**Headers (for anonymous voting):**
```http
x-fingerprint: <browser-fingerprint>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userVote": "up",
    "counts": { "up": 16, "down": 2 }
  }
}
```

**Real-time Event:** Broadcasts `deck:vote:updated` via Socket.io

#### GET /api/decks/:id/votes

Get vote counts for a deck.

**Response:**
```json
{
  "success": true,
  "data": {
    "up": 16,
    "down": 2
  }
}
```

### Admin/Moderation

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/mod/pending` | Pending comments | Mod+ |
| PATCH | `/api/mod/comments/:id` | Moderate comment | Mod+ |
| GET | `/api/stats/kpi` | Platform KPIs | Dev |
| GET | `/api/stats/activity` | User activity | Dev |

### Health

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/health` | System health | No |
| GET | `/api/health/sources` | External API status | No |

### GitHub Integration

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/github/config` | Check if GitHub configured | No |
| GET | `/api/github/project` | Get roadmap items | No |
| GET | `/api/github/changelog` | Get changelog | No |
| GET | `/api/github/commits` | Get commits | No |
| POST | `/api/github/issues` | Create bug report | No |
| POST | `/api/github/classify` | Classify bug priority | No |
| GET | `/api/github/issues` | List issues | Yes |
| GET | `/api/github/stats` | Issue statistics | Yes |

---

## Error Codes

| HTTP Code | Description |
|-----------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

| Endpoint Type | Limit |
|---------------|-------|
| General | 100 req/min |
| Auth endpoints | 10 req/min |
| Search | 30 req/min |
| File upload | 5 req/min |

---

## Socket.io Real-time Events

TCGKB uses Socket.io for real-time updates. Connect to the same base URL.

### Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `deck:vote:updated` | Server → Client | Vote counts changed |
| `comment:new` | Server → Client | New comment posted |
| `comment:reply` | Server → Client | New reply to comment |
| `comment:hidden` | Server → Client | Comment visibility toggled |
| `comment:deleted` | Server → Client | Comment deleted |
| `reaction:updated` | Server → Client | Reaction counts changed |

### Event Payloads

**deck:vote:updated**
```json
{
  "deckId": "abc123",
  "counts": { "up": 16, "down": 2 }
}
```

**comment:new**
```json
{
  "cardId": "svi-057",
  "comment": { "_id": "...", "content": "...", "user": {...} }
}
```

---

## Related Documentation

- [Architecture](./architecture.md)
- [Security](./security.md)
