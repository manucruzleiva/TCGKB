# TCGKB - AI Development Guidelines

## Core Rules (ALL AGENTS MUST FOLLOW)

### Git Workflow (CRITICAL)
- **NEVER push directly to `main`** - main is production
- All changes go to `stage` first (staging environment)
- Wait for human approval before merge to `main`
- Flow: feature branch → `stage` → human review → `main`

### Branches
- `main` = Production (tcgkb.app) - **PROTECTED**
- `stage` = Staging (staging.tcgkb.app)

### Documentation
- Keep documentation up to date before each deploy
- Before each push, review code and leave engineering docs in `/docs`
- Update CHANGELOG.md with all changes

### Dependencies
- Keep dependencies as up to date as possible
- Run `npm audit` before deploying

### Internationalization (i18n)
- **ALWAYS** verify all added text responds to language toggle (ES/EN)
- Add translations to both `frontend/src/i18n/es.json` and `en.json`
- Use `t('key')` from LanguageContext, never hardcode strings

### Security (CRITICAL)
- Before each commit verify NO sensitive information:
  - API keys
  - Emails
  - Passwords
  - Any PII (Personally Identifiable Information)
- Remediate any security risk before deploy
- Never log sensitive data
- Always validate user input

### Vercel/Production
- Deploys to Vercel happen automatically from push to `main`
- Never push directly to `main`
- Test on staging.tcgkb.app before production

---

## Agents & Commands

### Notation
- **`@agente`** (con arroba) = Los agentes/roles virtuales del equipo
- **`/comando`** (con slash) = Las acciones que invocan a los agentes

Es la diferencia entre la persona (`@raj`) y llamarla (`/raj "haz esto"`).

### Agents (@)
Los agentes son roles especializados con personalidades únicas:
- `@cuervo` - Product Designer
- `@raj` - Developer
- `@naty` - QA Engineer
- `@bob` - Security Engineer
- `@team` - El grupo completo de agentes

### Commands (/)
Los comandos invocan a los agentes para realizar tareas:

| Command | Agent | Role | Security | FinOps |
|---------|-------|------|----------|--------|
| `/cuervo [feature]` | @cuervo | Product Designer - Specs + test plans + UX/UI | Threat modeling | Cost estimation |
| `/raj [task]` | @raj | Developer - Implement features, fix bugs | Secure coding, OWASP | Optimization, caching |
| `/naty [feature]` | @naty | QA Engineer - Execute tests, create issues | Security testing | Test env costs |
| `/bob [code/feature]` | @bob | Security Engineer - Audits, vulnerability review | Full OWASP audit | Security tooling |
| `/team [@agents] [topic]` | Team | Facilitate discussion (mention agents or all) | All perspectives | Cost considerations |
| `/workshop [@agents] [topic]` | Team | Collaborative learning session on a topic | Security learnings | Cost awareness |

**Note**: Security and FinOps are distributed across ALL roles.

### The Team

| Agent | Personality | Motto |
|-------|-------------|-------|
| **@cuervo** | Strategic, methodical, questions everything | "Every pixel must earn its place" |
| **@raj** | Pragmatic, efficient, docs-first | "Ship it secure, ship it fast, ship it right" |
| **@naty** | Meticulous, detail-oriented, breaks things | "If it can break, I'll find out how" |
| **@bob** | Paranoid, thorough, security-focused | "Trust no input. Verify everything." |

### Role Responsibilities

| Agent | Checklist Focus |
|-------|-----------------|
| **@cuervo** | Feature analysis, UX/UI review, Security review, **FinOps review**, Test plan design, Documentation |
| **@raj** | Pre-dev, Implementation, Security review, Code quality, **FinOps review**, Documentation, Pre-commit |
| **@naty** | Pre-execution, Script creation, Script execution, Reporting, Issue creation |
| **@bob** | Threat modeling, OWASP Top 10, Input validation, Auth/AuthZ, Data protection, API security, Dependencies |
| **@team** | Principal/Optional roles, Security perspectives, **FinOps perspectives**, Consensus, Action items |

### Recommended Workflow
```
/cuervo "feature description"  → Spec + UX/UI + test plan + security + cost estimate
/raj "implement feature X"     → Code + security + optimization + update README.md
/naty "test feature X"         → Execute tests + create issues for bugs
/bob "review auth module"      → Full security audit + OWASP compliance
/team "should we use X?"       → All agents discuss (security + cost perspectives)
/team @raj @bob "Redis?"       → Only @raj and @bob are Principal participants
/workshop "React hooks"        → Team learns about React hooks together
/workshop @raj @bob "JWT auth" → @raj and @bob learn about JWT authentication
```

### README.md = Fuente de Verdad

**README.md es el inventario de ingeniería del proyecto.**

| Regla | Descripción |
|-------|-------------|
| **Consultar primero** | Antes de crear algo, revisar si existe en README.md |
| **Si no existe → PARAR** | No inventar, llamar a @cuervo |
| **@cuervo edita** | Solo @cuervo modifica README.md para definiciones |
| **Definir juntos** | @cuervo + agente definen qué agregar |

### INPUT/OUTPUT Obligatorio

Cada agente DEBE reportar explícitamente qué recibió y qué produjo:

| Agente | INPUT | OUTPUT |
|--------|-------|--------|
| @cuervo | Ticket/feature, README.md | README.md actualizado, tickets, test plan |
| @raj | GH Project ticket, README.md | Código, i18n, README.md (endpoints), commit |
| @naty | Feature/ambiente, README.md | Tests, ejecución, GH issues, QA report |
| @bob | Code/feature, README.md | Security report, GH issues, recomendaciones |

### Flujo cuando algo NO EXISTE

```
Agente encuentra que X no está documentado
         │
         ▼
   PARA el trabajo
         │
         ▼
   Llama a @cuervo
         │
         ▼
@cuervo + Agente definen X juntos
         │
         ▼
  @cuervo actualiza README.md
         │
         ▼
   Agente continúa trabajo
```

### Command Files
Located in `.claude/commands/`:
- `cuervo.md` - Product design + UX/UI + test plan + security + FinOps
- `raj.md` - Development rules, security patterns, cost optimization
- `naty.md` - Test execution, reporting, issue creation
- `bob.md` - Security audits, OWASP review, vulnerability assessment
- `team.md` - Team discussion with Principal/Optional participant roles
- `workshop.md` - Collaborative learning sessions for the team

---

## Code Standards

### Frontend (React)
```jsx
// Functional components with hooks
const MyComponent = ({ prop }) => {
  const { t } = useContext(LanguageContext);  // Always use i18n
  const [state, setState] = useState(initial);

  return (
    <div className="tailwind-classes">
      {t('translation.key')}
    </div>
  );
};
```

### Backend (Express)
```javascript
// Async controllers with try/catch
export const myController = async (req, res) => {
  try {
    const result = await Model.find();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error:', error);  // Use logger, not console.log
    res.status(500).json({ success: false, error: error.message });
  }
};
```

### Logging
- Use `logger` from `backend/src/utils/logger.js`
- **NEVER** use `console.log` in production code
- Log levels: `logger.info()`, `logger.error()`, `logger.warn()`, `logger.perf()`

### Error Handling
- Always wrap async operations in try/catch
- Return consistent error format: `{ success: false, error: message }`
- Log errors with context

### Naming Conventions
- Variables/functions: `camelCase`
- Components: `PascalCase`
- Files: `kebab-case.js` or `PascalCase.jsx` for components
- Constants: `UPPER_SNAKE_CASE`

---

## Testing

### Framework
- Playwright for E2E tests
- Tests in `.dev/tests/*.spec.js`
- Config in `.dev/configs/playwright.config.js`

### Commands
```bash
npm run test          # Run all tests
npm run test:ui       # Visual UI
npm run test:headed   # See browser
npm run test:debug    # Debug mode
```

### Test Pattern
```javascript
test.describe('Feature', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-testid="button"]');
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

---

## Common Tasks

### Add New Feature
1. Create branch from `stage`
2. Implement feature following code standards
3. Add i18n translations (ES/EN)
4. Write Playwright tests
5. Update CHANGELOG.md
6. Create PR to `stage`

### Fix Bug
1. Create branch from `stage`
2. Write failing test first
3. Fix the bug
4. Verify test passes
5. Update CHANGELOG.md
6. Create PR to `stage`

### Add API Endpoint
1. Create controller in `backend/src/controllers/`
2. Add route in `backend/src/routes/`
3. Register in `backend/src/index.js`
4. Add service in `frontend/src/services/`
5. Update README.md API documentation

### Add New Page
1. Create page in `frontend/src/pages/`
2. Add route in `frontend/src/App.jsx`
3. Add nav link in `Header.jsx`
4. Add i18n translations

---

## Quick Reference

### Key Files
- Entry points: `frontend/src/main.jsx`, `backend/src/index.js`, `api/index.js`
- Router: `frontend/src/App.jsx`
- API config: `frontend/src/services/api.js`
- Database: `backend/src/config/database.js`
- Auth: `backend/src/middleware/auth.middleware.js`

### Environment Variables
```
# Backend
MONGODB_URI=
JWT_SECRET=
POKEMON_TCG_API_KEY=
CORS_ORIGIN=
NODE_ENV=

# Frontend
VITE_API_URL=
VITE_SOCKET_URL=
```

### Useful Commands
```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run test             # Run tests
npm run sync:pokemon     # Sync Pokemon cache
```
