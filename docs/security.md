# TCGKB - Security Documentation

> **Source of Truth** for security measures, auth flows, and security automation.
> Last updated: 2025-12-20

---

## Security Measures

| Measure | Implementation |
|---------|----------------|
| **Password hashing** | bcryptjs with salt rounds |
| **JWT validation** | Required for authenticated routes |
| **Rate limiting** | express-rate-limit on sensitive endpoints |
| **CORS** | Strict origin whitelisting |
| **Helmet** | Security headers |
| **Input validation** | validator library |
| **Role-based access** | Middleware checks for admin/mod routes |

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                       AUTH FLOW                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Login Request                                                │
│     POST /api/auth/login { email, password }                     │
│                    │                                             │
│                    ▼                                             │
│  2. Verify Password (bcrypt.compare)                             │
│                    │                                             │
│                    ▼                                             │
│  3. Generate JWT (7-day expiry)                                  │
│     payload: { userId, role, email }                             │
│                    │                                             │
│                    ▼                                             │
│  4. Return Token                                                 │
│     { success: true, token: "Bearer ...", user: {...} }          │
│                                                                  │
│  5. Client Usage                                                 │
│     Authorization: Bearer <token>                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Permission Middleware

### Auth Middleware
```javascript
// backend/src/middleware/auth.middleware.js
// Verifies JWT and attaches user to req.user
```

### Admin Middleware
```javascript
// backend/src/middleware/admin.middleware.js
// Requires role === 'dev'
```

### Moderator Middleware
```javascript
// backend/src/middleware/moderator.middleware.js
// Requires role === 'moderator' || role === 'dev'
```

---

## Environment Variables

### Backend Secrets

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing key (min 32 chars) | Yes |
| `JWT_EXPIRES_IN` | Token expiration | No (default: 7d) |
| `POKEMON_TCG_API_KEY` | Pokemon TCG API key | Yes |
| `CORS_ORIGIN` | Allowed origins | Yes |
| `NODE_ENV` | production/development | Yes |

### GitHub Integration

| Variable | Description | Required |
|----------|-------------|----------|
| `GITHUB_TOKEN` | PAT with `repo`, `read:project` | Yes |
| `GITHUB_OWNER` | GitHub username | No (default: manucruzleiva) |
| `GITHUB_REPO` | Repository name | No (default: TCGKB) |
| `GITHUB_PROJECT_NUMBER` | Project V2 number | No (default: 2) |

### GitHub Actions Secrets

| Secret | Description | Scopes |
|--------|-------------|--------|
| `SECURITY_PAT` | Security automation | `repo`, `security_events` |

---

## Security Automation

Automated workflow that converts Dependabot security alerts into tracked GitHub Issues.

### Workflow

**File**: `.github/workflows/security-check.yml`

| Feature | Description |
|---------|-------------|
| **Auto-Issue Creation** | Creates GitHub Issue for each Dependabot alert |
| **Priority Labels** | Assigns P0-P3 labels based on severity |
| **Duplicate Detection** | Skips alerts that already have an issue |
| **Daily Schedule** | Runs at 8:00 AM UTC daily |
| **Manual Trigger** | Can be run on-demand via workflow_dispatch |

### Priority Mapping

| Severity | Label | Color | SLA |
|----------|-------|-------|-----|
| Critical | `P0-Critical` | Red | Immediate |
| High | `P1-High` | Orange | 24-48h |
| Medium | `P2-Medium` | Yellow | 1 week |
| Low | `P3-Low` | Green | 2 weeks |

### Issue Labels

Each security issue receives:
- `security` - For filtering
- `dependabot` - Source identification
- `P0-P3` - Priority based on severity

### Security in Roadmap

**CRITICAL**: Security issues are NEVER exposed in the public roadmap.

Labels filtered from public view:
- `security`
- `secret-exposed`
- `dependabot`
- `codeql`
- `vulnerability`
- `cve`

### Flow Diagram

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

## OWASP Compliance

| Category | Status | Implementation |
|----------|--------|----------------|
| A01 Access Control | ✅ | Role middleware, ownership checks |
| A02 Cryptographic | ✅ | bcrypt passwords, JWT signing |
| A03 Injection | ✅ | Mongoose ORM, input validation |
| A04 Insecure Design | ✅ | Security review in design phase |
| A05 Misconfig | ✅ | Helmet headers, CORS whitelist |
| A06 Vulnerable Components | ✅ | Dependabot alerts automated |
| A07 Auth Failures | ✅ | Rate limiting on auth endpoints |
| A08 Data Integrity | ✅ | JWT validation, hash verification |
| A09 Logging | ✅ | Logger utility, no sensitive data |
| A10 SSRF | ✅ | URL validation on external calls |

---

## Security Checklist for Developers

### API Endpoints
- [ ] Authentication middleware on protected routes
- [ ] Rate limiting consideration
- [ ] Input validation and sanitization
- [ ] No sensitive data in responses
- [ ] Proper HTTP status codes

### Forms
- [ ] Client-side validation (UX)
- [ ] Server-side validation (SECURITY)
- [ ] File upload restrictions (type, size)
- [ ] No sensitive data in URLs

### Database Operations
- [ ] Mongoose ORM (no raw queries)
- [ ] Validate ObjectIds before querying
- [ ] Limit query results (pagination)
- [ ] Don't return password fields

### Authentication
- [ ] Secure password hashing (bcrypt)
- [ ] JWT expiration configured (7 days)
- [ ] Protected route middleware working

---

## Incident Response

### If Secrets Are Exposed

1. **Immediately** revoke the exposed secret
2. Create P0-Critical issue
3. Rotate all related credentials
4. Audit access logs
5. Document in post-mortem

### If Vulnerability Is Found

1. Assess severity (Critical/High/Medium/Low)
2. Create security issue with appropriate label
3. @bob reviews and confirms
4. @raj implements fix
5. Deploy to staging, test
6. Deploy to production

---

## GitHub Security Tools

### Commands for @bob

```bash
# View Dependabot alerts
gh api repos/manucruzleiva/TCGKB/dependabot/alerts \
  --jq '.[] | {package: .dependency.package.name, severity: .security_advisory.severity}'

# Run npm audit
npm audit --json

# Open security tab
gh browse -n security
```

---

## Related Documentation

- [Architecture](./architecture.md)
- [API Endpoints](./api.md)
