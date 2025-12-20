# Tests Automatizados con Playwright

Este proyecto incluye tests automatizados end-to-end usando Playwright para verificar las funcionalidades principales de la aplicación.

## 📋 Tests Incluidos

### 1. Búsqueda de Cartas (`search.spec.js`)
- ✅ Visualización de página principal con input de búsqueda
- ✅ Búsqueda por nombre exacto
- ✅ **Búsqueda fuzzy** con errores ortográficos (ej: "ghodlengo" → "Gholdengo")
- ✅ Estado de carga durante búsqueda
- ✅ **Filtro de cartas rotadas** (solo G, H, I)
- ✅ Indicador de caché

### 2. Autenticación (`auth.spec.js`)
- ✅ Navegación a página de registro
- ✅ Navegación a página de login
- ✅ Validación de formularios vacíos
- ✅ Logout después de login

### 3. Comentarios (`comments.spec.js`)
- ✅ Visualización de formulario de comentarios
- ✅ Creación de comentarios
- ✅ Validación de comentarios vacíos
- ✅ Visualización de comentarios existentes
- ✅ Respuestas anidadas

### 4. Deck Manager (`decks.spec.js`)
- ✅ Community Tab - carga de decks públicos
- ✅ Navegación entre tabs (Mis Decks / Comunidad)
- ✅ Opciones de ordenamiento
- ✅ Filtrado por tags
- ✅ Import Flow - modal, validación, formatos
- ✅ Sistema de votos (👍/👎)
- ✅ Detalle de deck - badges, export

### 5. Deck Validation (`deck-validation.spec.js`) - DM-V2
- ✅ Pokemon Standard validation (60 cards, 4 copies, ACE SPEC, Radiant)
- ✅ Pokemon GLC validation (singleton, single type, no rule box)
- ✅ Riftbound validation (40+1+3+12, domain restriction)
- ✅ Format detection (Standard, GLC, Riftbound)
- ✅ DeckValidationIndicator component (inline errors)
- ✅ Reprints counting together

### 6. Deck API (`deck-api.spec.js`) - DM-V2
- ✅ POST /api/decks/parse - parsing and enrichment
- ✅ Card Enrichment Service (Rule Box, Basic Pokemon, ACE SPEC detection)
- ✅ TCG auto-detection (Pokemon vs Riftbound)
- ✅ GET /api/decks/community - pagination, filters, sorting
- ✅ Voting API (upvote, downvote, anonymous)
- ✅ Performance tests (<500ms for 60 cards)

### 7. Deck Features (`deck-features.spec.js`) - DM-V2
- ✅ Card Interactions (left/right click, drag & drop)
- ✅ Visual Filters (type icons, grayscale toggle)
- ✅ Auto-tagging (energy types, mechanics, real-time)
- ✅ Real-time Updates (Socket.io)
- ✅ Community Features (read-only, copy deck, badges)
- ✅ i18n for DM-V2 (ES/EN)
- ✅ Reprints Grouping (visual, normalization)

---

## 📊 Test Coverage Matrix (DM-V2)

| Ticket | Test File | Test Cases | Status |
|--------|-----------|------------|--------|
| Import Flow E2E | `decks.spec.js`, `deck-api.spec.js` | 7 TCs | ✅ |
| Pokemon Standard Validation | `deck-validation.spec.js` | 9 TCs | ✅ |
| Pokemon GLC Validation | `deck-validation.spec.js` | 4 TCs | ✅ |
| Riftbound Validation | `deck-validation.spec.js` | 2 TCs | ✅ |
| Format Detection | `deck-validation.spec.js` | 3 TCs | ✅ |
| Card Enrichment Service | `deck-api.spec.js` | 8 TCs | ✅ |
| DeckValidationIndicator | `deck-validation.spec.js` | 4 TCs | ✅ |
| Card Interactions | `deck-features.spec.js` | 4 TCs | ✅ |
| Visual Filters | `deck-features.spec.js` | 4 TCs | ✅ |
| Auto-tagging | `deck-features.spec.js` | 4 TCs | ✅ |
| Community Features | `deck-features.spec.js`, `decks.spec.js` | 8 TCs | ✅ |
| Real-time Updates | `deck-features.spec.js` | 2 TCs | ✅ |
| i18n | `deck-features.spec.js` | 3 TCs | ✅ |
| Reprints Grouping | `deck-validation.spec.js`, `deck-features.spec.js` | 3 TCs | ✅ |

**Total: ~65 test cases for DM-V2**

## 🚀 Cómo Ejecutar los Tests

### Pre-requisitos
1. Asegúrate de tener los servidores corriendo:
   ```bash
   npm run dev
   ```

2. Los tests se conectarán automáticamente a `http://localhost:5176`

### Comandos de Testing

```bash
# Ejecutar todos los tests (headless)
npm test

# Ejecutar con UI interactiva (recomendado para desarrollo)
npm run test:ui

# Ejecutar tests viendo el navegador
npm run test:headed

# Ejecutar en modo debug
npm run test:debug

# Ver reporte de resultados
npm run test:report
```

### Ejecutar Tests Específicos

```bash
# Solo tests de búsqueda
npx playwright test search.spec.js

# Solo tests de autenticación
npx playwright test auth.spec.js

# Solo tests de comentarios
npx playwright test comments.spec.js
```

## 📊 Estructura de Tests

```
tests/
├── search.spec.js      # Tests de búsqueda y filtros
├── auth.spec.js        # Tests de autenticación
├── comments.spec.js    # Tests de comentarios y reacciones
└── README.md           # Esta documentación
```

## ⚙️ Configuración

La configuración de Playwright está en `playwright.config.js` en la raíz del proyecto.

### Características Configuradas:
- **Browser**: Chromium (Chrome)
- **Base URL**: `http://localhost:5176`
- **Screenshots**: Solo en fallos
- **Traces**: En primer reintento
- **Web Server**: Auto-inicio con `npm run dev`
- **Timeout**: 120 segundos para inicio del servidor

## 🐛 Debugging

Si un test falla:

1. **Ver el reporte HTML**:
   ```bash
   npm run test:report
   ```

2. **Ejecutar en modo debug**:
   ```bash
   npm run test:debug
   ```

3. **Ver screenshots**: Los screenshots de fallos se guardan en `test-results/`

4. **Ver traces**: Las trazas se guardan automáticamente en el primer reintento

## 📝 Notas Importantes

- **API Lenta**: Los tests de búsqueda pueden tardar debido a la API de Pokemon TCG (27-56 segundos sin caché)
- **Autenticación**: Usa credenciales de prueba (`testuser` / `password123`)
- **Datos de Prueba**: Los tests crean comentarios de prueba con timestamps únicos
- **Limpieza**: Los tests NO limpian datos automáticamente (considera agregar hooks de limpieza)

## 🔄 CI/CD

Para integrar con CI/CD, los tests están configurados para:
- Ejecutarse con 1 worker en CI
- 2 reintentos automáticos en caso de fallo
- Modo `forbidOnly` activado (evita commits accidentales de `.only`)

Ejemplo para GitHub Actions:
```yaml
- name: Run Playwright Tests
  run: npm test
```

## 📚 Recursos

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Test Selectors](https://playwright.dev/docs/selectors)
