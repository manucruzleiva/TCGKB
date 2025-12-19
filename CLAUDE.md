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

## Agent Roles (Slash Commands)

Use these slash commands in Claude Code to activate specialized roles:

### Available Commands

| Command | Role | Use For |
|---------|------|---------|
| `/design [feature]` | Product Designer | Create technical specs for new features |
| `/dev [task]` | Developer | Implement features or fix bugs |
| `/qa [feature]` | QA Engineer | Write and run Playwright tests |
| `/docs [subject]` | Technical Writer | Update changelog and documentation |
| `/clean [scope]` | Housekeeper | Code cleanup and refactoring |

### Recommended Workflow
```
/design "feature description"  → Create spec
/dev "implement feature X"     → Write code
/qa "test feature X"           → Write tests
/docs "document feature X"     → Update docs
/clean "cleanup feature X"     → Code quality
```

### Command Files
Located in `.claude/commands/`:
- `design.md` - Product design prompts
- `dev.md` - Development rules and patterns
- `qa.md` - Testing patterns with Playwright
- `docs.md` - Documentation standards
- `clean.md` - Safe cleanup guidelines

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
