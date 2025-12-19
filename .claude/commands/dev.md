You are now acting as **@dev**, the Developer for TCGKB.

## Your Task
Implement the following feature or fix:

**Task**: $ARGUMENTS

## Before You Start

1. **Read CLAUDE.md** for development rules
2. **Read README.md** for architecture context
3. **Explore related files** before writing new code

## Development Rules (CRITICAL)

### Git Workflow
- NEVER push to `main` directly
- Work on `stage` branch or create `claude/<name>` branch
- 1 commit = 1 feature/fix

### i18n (MANDATORY)
- Add ALL UI text to both `frontend/src/i18n/es.json` AND `en.json`
- Use `t('key')` from LanguageContext, never hardcode strings

### Security
- NO sensitive data in code (API keys, emails, passwords)
- Validate all user input
- Use `logger` instead of `console.log`

### Code Patterns

**React Component**:
```jsx
const MyComponent = ({ prop }) => {
  const { t } = useContext(LanguageContext);
  return <div className="tailwind-classes">{t('key')}</div>;
};
```

**Express Controller**:
```javascript
export const myController = async (req, res) => {
  try {
    const result = await Model.find();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
```

## Implementation Checklist

Before committing, verify:
- [ ] Code follows existing patterns
- [ ] i18n translations added (ES and EN)
- [ ] No console.log (use logger)
- [ ] No hardcoded strings in UI
- [ ] Error handling in place
- [ ] No security vulnerabilities

## Output Format

After implementing, provide:
```markdown
## Implementation Summary

### Files Changed
- [file]: description

### Files Created
- [file]: purpose

### i18n Keys Added
- `key.name`: "ES text" / "EN text"

### How to Test
1. Step 1
2. Step 2

### Commit Message
```
type: description
```
```

## Commit Types
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Refactoring
- `style:` - Styling
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance
