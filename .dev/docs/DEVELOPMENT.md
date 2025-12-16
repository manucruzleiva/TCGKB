# Guía de Desarrollo - TCG Knowledge Base

## Estructura del Proyecto

Este proyecto utiliza una estructura organizada que separa el código de producción de las herramientas de desarrollo:

```
TCGKB/
├── .dev/                    # Herramientas y configuración de desarrollo
│   ├── configs/             # Configuraciones de testing y dev tools
│   │   └── playwright.config.js
│   ├── docs/                # Documentación para desarrolladores
│   │   └── DEVELOPMENT.md (este archivo)
│   ├── scripts/             # Scripts de desarrollo y utilidades
│   └── tests/               # Tests E2E con Playwright
│
├── backend/                 # API y servidor
│   ├── src/
│   │   ├── config/         # Configuración de DB, Socket.io
│   │   ├── controllers/    # Controladores de rutas
│   │   ├── middleware/     # Auth, rate limiting, etc.
│   │   ├── models/         # Modelos de MongoDB
│   │   ├── routes/         # Definición de rutas
│   │   ├── services/       # Lógica de negocio
│   │   │   ├── pokemonTCG.service.js
│   │   │   ├── rifboundTCG.service.js
│   │   │   └── unifiedTCG.service.js
│   │   └── utils/          # Utilidades (logger, etc.)
│   └── package.json
│
├── frontend/                # React + Vite application
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # React contexts (Auth, Socket, Theme, etc.)
│   │   ├── pages/          # Páginas principales
│   │   ├── services/       # Servicios de API
│   │   ├── utils/          # Utilidades del frontend
│   │   └── config/         # Configuraciones (rotation, etc.)
│   └── package.json
│
├── shared/                  # Código compartido entre frontend y backend
├── vercel.json             # Configuración de deployment
├── package.json            # Scripts principales y workspaces
└── README.md               # Documentación principal

```

## Configuración de Desarrollo

### Prerequisitos

- Node.js 18 o superior
- MongoDB (local o Atlas)
- Pokemon TCG API Key de [pokemontcg.io](https://pokemontcg.io)

### Setup Inicial

1. **Instalar dependencias**
   ```bash
   npm run install:all
   ```

2. **Configurar variables de entorno**

   Backend (`.env` en `/backend`):
   ```bash
   cp backend/.env.example backend/.env
   ```

   Edita `backend/.env` con tus valores:
   ```env
   PORT=3001
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/pokemon-tcg
   JWT_SECRET=your-secret-key-change-this
   JWT_EXPIRES_IN=7d
   POKEMON_TCG_API_KEY=your-pokemon-tcg-api-key
   CORS_ORIGIN=http://localhost:5173
   ```

   Frontend (`.env` en `/frontend`):
   ```bash
   cp frontend/.env.example frontend/.env
   ```

3. **Iniciar MongoDB**
   ```bash
   mongod
   ```

4. **Iniciar la aplicación**
   ```bash
   npm run dev
   ```

   Esto iniciará:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3001

## Comandos de Desarrollo

### Scripts Principales

```bash
# Desarrollo
npm run dev              # Inicia frontend y backend simultáneamente
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend

# Build
npm run build            # Build de frontend y backend
npm run build:frontend   # Solo frontend
npm run build:backend    # Solo backend

# Testing
npm run test             # Ejecuta tests E2E
npm run test:ui          # Interfaz visual de Playwright
npm run test:headed      # Tests con navegador visible
npm run test:debug       # Modo debug de tests
npm run test:report      # Ver reporte de tests
```

### Scripts del Backend

```bash
cd backend

npm run dev              # Desarrollo con nodemon
npm start                # Producción
```

### Scripts del Frontend

```bash
cd frontend

npm run dev              # Desarrollo con Vite
npm run build            # Build para producción
npm run preview          # Preview del build
npm run lint             # Ejecutar ESLint
```

## Arquitectura del Sistema

### Multi-TCG Transparente

El sistema soporta múltiples TCGs (Pokemon, Rifbound) de forma transparente para el usuario:

- **Backend**: `unifiedTCG.service.js` busca en todos los TCGs en paralelo
- **Frontend**: Muestra features específicas según el TCG de cada carta (`card.tcg`)
- **Sin UI de selección**: El usuario no elige manualmente el TCG

Ejemplo:
```javascript
// Backend - Búsqueda unificada
const result = await unifiedTCGService.searchCards('Pikachu')
// Retorna cartas de Pokemon y Rifbound mezcladas

// Frontend - Renderizado condicional
const isPokemonCard = card.tcg === 'pokemon'
{isPokemonCard && <RotationRibbon mark={card.regulationMark} />}
```

### Sistema de Cache

- MongoDB cache para resultados de Pokemon TCG API
- TTL de 7 días
- Fallback automático a cache si API falla
- Cache se actualiza en background

### Real-time con Socket.io

- Comentarios en tiempo real
- Reacciones en tiempo real
- Conexión persistente con reconexión automática

### Sistema de Traducciones

- Archivos: `frontend/src/i18n/translations/es.js` y `en.js`
- Hook: `useLanguage()`
- Formato: `t('key.nested.key')`

### Sistema de Temas

- Light / Dark mode
- Persistencia en localStorage
- Hook: `useTheme()`

## Testing

### Tests E2E con Playwright

Los tests están ubicados en `.dev/tests/`:

```bash
# Ejecutar todos los tests
npm run test

# Modo visual (recomendado para desarrollo)
npm run test:ui

# Con navegador visible
npm run test:headed

# Debug de un test específico
npm run test:debug
```

### Estructura de Tests

```
.dev/tests/
├── auth.spec.js          # Tests de autenticación
├── cards.spec.js         # Tests de búsqueda y detalle
├── comments.spec.js      # Tests de comentarios
└── reactions.spec.js     # Tests de reacciones
```

## Convenciones de Código

### Commits

Usamos commits descriptivos en español:

```bash
git commit -m "Agrega sistema de notificaciones push"
git commit -m "Corrige bug en búsqueda de cartas"
git commit -m "Mejora performance del cache"
```

Todos los commits incluyen:
```
🤖 Generated with Claude Code (https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Código

- **Backend**: JavaScript ES6+ con módulos ES
- **Frontend**: React con Hooks, JSX
- **Estilos**: Tailwind CSS con dark mode
- **Idioma**: Nombres de variables en inglés, comentarios en español

## Debugging

### Backend

El backend usa un logger personalizado en `backend/src/utils/logger.js`:

```javascript
import log from '../utils/logger.js'

log.info('Module', 'Mensaje informativo')
log.error('Module', 'Error message', error)
log.perf('Module', 'Operación', durationMs)
```

### Frontend

React DevTools y navegador:

```javascript
// Debug en desarrollo
console.log('Card data:', card)
```

### MongoDB

Conectar con MongoDB Compass o CLI:
```bash
mongosh mongodb://localhost:27017/pokemon-tcg
```

## Deployment

Ver [DEPLOYMENT.md](../../DEPLOYMENT.md) para instrucciones detalladas de deployment en Vercel.

Resumen rápido:
1. Push a GitHub
2. Conectar repositorio en Vercel
3. Configurar variables de entorno
4. Deploy automático

## Recursos

- [Pokemon TCG API Docs](https://docs.pokemontcg.io/)
- [React Docs](https://react.dev/)
- [Vite Docs](https://vitejs.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Socket.io Docs](https://socket.io/docs/)
- [Playwright Docs](https://playwright.dev/)

## Contribuir

1. Crea una rama desde `main`:
   ```bash
   git checkout -b feature/nombre-feature
   ```

2. Haz tus cambios y commits frecuentes

3. Ejecuta tests antes de push:
   ```bash
   npm run test
   ```

4. Push y crea Pull Request

## Soporte

Para preguntas o problemas:
1. Revisa la documentación en `.dev/docs/`
2. Revisa los issues en GitHub
3. Crea un nuevo issue si es necesario
