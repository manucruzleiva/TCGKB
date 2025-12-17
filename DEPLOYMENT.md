# Deployment a Vercel - TCGKB

## URL de Produccion
**https://tcgkb-new.vercel.app**

## Estructura del Proyecto

```
TCGKB/
├── api/                    # Entry point para Vercel Serverless
│   └── index.js           # Re-exporta el backend Express
├── frontend/              # React + Vite
│   ├── src/
│   └── dist/              # Build output (outputDirectory)
├── backend/               # Express API
│   ├── api/
│   │   └── index.js       # Express app principal
│   └── src/
├── vercel.json            # Configuracion de Vercel
└── package.json           # Workspaces: frontend, backend
```

## Configuracion Clave

### 1. vercel.json

```json
{
  "outputDirectory": "frontend/dist",
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/index.js"
    },
    {
      "source": "/socket.io/:path*",
      "destination": "/api/index.js"
    }
  ]
}
```

### 2. api/index.js (Entry Point para Vercel)

```javascript
// Vercel Serverless Function Entry Point
// Re-exports the Express app from backend
import app from '../backend/api/index.js'

export default app
```

**Por que es necesario?**
- Vercel requiere que las funciones serverless esten en `/api/` en la raiz del proyecto
- Este archivo simplemente re-exporta el Express app del backend
- Permite mantener la estructura del monorepo sin mover codigo

### 3. package.json (Workspaces)

```json
{
  "workspaces": ["frontend", "backend"],
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "npm run build --workspace=frontend",
    "build:backend": "npm run build --workspace=backend"
  }
}
```

## Proceso de Build en Vercel

1. **Install**: `npm install` (instala todos los workspaces automaticamente)
2. **Build**: `npm run build` (ejecuta build de frontend y backend)
3. **Output**: `frontend/dist` contiene los archivos estaticos
4. **Serverless**: `api/index.js` se convierte en una funcion serverless

## Comandos para Deploy

### Deploy desde CLI (recomendado)
```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy a produccion
vercel --prod
```

### Deploy automatico via Git
El proyecto esta conectado a GitHub. Cada push a `main` hace deploy automatico.

## Problemas Resueltos

### 1. Path Duplicado `/frontend/frontend/`
**Problema**: Vercel duplicaba el path cuando usaba `--prefix frontend`
**Solucion**: Usar npm workspaces (`--workspace=frontend`) en lugar de `--prefix`

### 2. Funciones fuera de `/api/`
**Problema**: `backend/api/index.js` no era reconocido como funcion serverless
**Solucion**: Crear `/api/index.js` que re-exporta el backend

### 3. Output Directory no encontrado
**Problema**: Vercel buscaba `public/` por defecto
**Solucion**: Especificar `"outputDirectory": "frontend/dist"` en vercel.json

## Variables de Entorno

Configurar en Vercel Dashboard > Settings > Environment Variables:

- `MONGODB_URI` - Connection string de MongoDB
- `JWT_SECRET` - Secret para tokens JWT
- `CORS_ORIGIN` - URL del frontend en produccion
- `POKEMON_TCG_API_KEY` - API key de Pokemon TCG (opcional)

## Verificar Deployment

1. Frontend: Visitar https://tcgkb-new.vercel.app
2. API Health: GET https://tcgkb-new.vercel.app/api/health
3. Logs: `vercel logs tcgkb-new --follow`
