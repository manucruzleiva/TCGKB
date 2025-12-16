# Pokemon TCG Knowledge Base

Una aplicación web completa para buscar cartas de Pokemon TCG, comentar y reaccionar a las cartas.

## Características

### Sistema Multi-TCG
- 🎴 **Búsqueda transparente** - Busca en Pokemon TCG y Rifbound simultáneamente
- 🔄 **Sin selección manual** - El sistema detecta automáticamente el TCG de cada carta
- ⚡ **Búsqueda paralela** - Resultados de todos los TCGs en una sola consulta

### Búsqueda y Filtrado (✅ Tests E2E)
- 🔍 **Búsqueda exacta** - Por nombre de carta
- 🎯 **Búsqueda difusa (Fuzzy)** - Tolera errores de ortografía (Levenshtein distance)
- 🗂️ **Filtrado de rotación** - Solo muestra cartas legales (regulation marks G,H,I+)
- 💾 **Sistema de cache** - MongoDB cache con indicador visual
- ⚡ **Resultados rápidos** - Cache-first strategy para ultra velocidad

### Comentarios y Discusión (✅ Tests E2E)
- 💬 **Comentarios anidados** - Ilimitados niveles de respuestas
- 📝 **@ Menciones de cartas** - Menciona cartas con autocompletado
- ✏️ **Editar y eliminar** - Usuarios pueden gestionar sus comentarios
- 👁️ **Ocultar comentarios** - Los usuarios pueden ocultar comentarios propios

### Reacciones
- 😀 **Emojis en cartas** - Reacciona a cualquier carta
- 💭 **Emojis en comentarios** - Reacciona a comentarios específicos
- 🔓 **Anónimas permitidas** - No requiere login para reaccionar
- 🔄 **Cambiar reacción** - Usuarios autenticados pueden cambiar su emoji

### Autenticación (✅ Tests E2E)
- 👤 **Registro de usuarios** - Crear cuenta con validación
- 🔐 **Login/Logout** - Sistema JWT con sesiones de 7 días
- ✅ **Validación de formularios** - Mensajes de error claros
- 🛡️ **Protección de rutas** - Comentarios requieren autenticación

### Tiempo Real
- ⚡ **Socket.io** - Comentarios y reacciones en tiempo real
- 🔄 **Auto-reconexión** - Conexión persistente con fallback
- 📡 **Actualizaciones instantáneas** - Sin necesidad de recargar

### Moderación (Admin)
- 🛡️ **Panel de administración** - Gestión de contenido
- 👮 **Moderar comentarios** - Aprobar/rechazar/eliminar
- 📊 **Estadísticas** - Ver actividad de la comunidad

### Personalización
- 🌓 **Dark/Light Mode** - Tema oscuro y claro con persistencia
- 🌍 **Multi-idioma** - Español e Inglés con traducción completa
- 📅 **Formato de fechas** - Múltiples formatos configurables (YYYY-MM-DD, DD/MM/YYYY, etc.)
- 💾 **Preferencias guardadas** - localStorage para todas las configuraciones

### Features Específicos Pokemon TCG
- 🔄 **Información de rotación** - Ribbons visuales para cartas que rotarán
- 📋 **Regulation Marks** - Filtrado y visualización de marks (G,H,I,J,K)
- 📅 **Fecha de legalidad** - Calcula cuándo una carta es legal en formato (release + 14 días)
- ⚠️ **Alertas de rotación** - Contador de días hasta próxima rotación

### Performance y UX
- 📱 **Responsive Design** - Funciona en desktop, tablet y móvil
- 🎨 **Tailwind CSS** - UI moderna y consistente
- ⚡ **Vite** - Build ultra rápido con HMR
- 🗂️ **MongoDB Cache** - 7 días de cache con TTL automático
- 📊 **Logging detallado** - Sistema de logs con performance metrics

## Cobertura de Tests E2E

✅ = Test automatizado disponible en `.dev/tests/`

| Categoría | Funcionalidad | Test E2E | Archivo |
|-----------|---------------|----------|---------|
| **Autenticación** | Navegación a registro | ✅ | `auth.spec.js` |
| | Navegación a login | ✅ | `auth.spec.js` |
| | Validación de formularios | ✅ | `auth.spec.js` |
| | Login y logout | ✅ | `auth.spec.js` |
| **Búsqueda** | Búsqueda exacta | ✅ | `search.spec.js` |
| | Búsqueda difusa (fuzzy) | ✅ | `search.spec.js` |
| | Estado de carga | ✅ | `search.spec.js` |
| | Filtrado de rotación | ✅ | `search.spec.js` |
| | Indicador de cache | ✅ | `search.spec.js` |
| **Comentarios** | Mostrar formulario | ✅ | `comments.spec.js` |
| | Crear comentario | ✅ | `comments.spec.js` |
| | Validación de vacíos | ✅ | `comments.spec.js` |
| | Mostrar comentarios existentes | ✅ | `comments.spec.js` |
| | Respuestas anidadas | ✅ | `comments.spec.js` |
| **Reacciones** | Agregar reacción | ❌ | - |
| | Cambiar reacción | ❌ | - |
| | Reacciones anónimas | ❌ | - |
| **Tiempo Real** | Updates de Socket.io | ❌ | - |
| **Temas** | Dark/Light mode | ❌ | - |
| **Idiomas** | Cambio de idioma | ❌ | - |
| **Multi-TCG** | Búsqueda transparente | ❌ | - |
| **Admin** | Moderación | ❌ | - |

**Ejecutar tests**: `npm run test` o `npm run test:ui` (interfaz visual)

## Stack Tecnológico

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express
- **Base de datos**: MongoDB
- **Real-time**: Socket.io
- **Deployment**: Vercel

## Instalación Local

### Prerequisitos

- Node.js 18+
- MongoDB (local o MongoDB Atlas)
- Pokemon TCG API Key (obtener en https://pokemontcg.io/)

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd TCGKB
```

2. **Instalar dependencias**
```bash
npm run install:all
```

3. **Configurar variables de entorno**

Backend (.env en /backend):
```bash
cp backend/.env.example backend/.env
```

Editar `backend/.env`:
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/pokemon-tcg
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
POKEMON_TCG_API_KEY=your-pokemon-tcg-api-key
CORS_ORIGIN=http://localhost:5173
```

Frontend (.env en /frontend):
```bash
cp frontend/.env.example frontend/.env
```

El archivo ya tiene los valores correctos para desarrollo local.

4. **Iniciar MongoDB**

Si usas MongoDB local:
```bash
mongod
```

O usa MongoDB Atlas y actualiza MONGODB_URI.

5. **Iniciar la aplicación**
```bash
npm run dev
```

Esto iniciará:
- Frontend en http://localhost:5173
- Backend en http://localhost:3001

## Deployment en Vercel

**Para instrucciones detalladas de deployment, ver [DEPLOYMENT.md](DEPLOYMENT.md)**

Resumen rápido:

1. **Conectar repositorio a Vercel**
   - Ve a https://vercel.com
   - Importa tu repositorio de GitHub

2. **Configurar variables de entorno** (ver DEPLOYMENT.md para lista completa)
   - Backend: `MONGODB_URI`, `JWT_SECRET`, `POKEMON_TCG_API_KEY`, `CORS_ORIGIN`, `NODE_ENV`
   - Frontend: `VITE_API_URL`, `VITE_SOCKET_URL`

3. **Deploy**
   - Vercel detectará automáticamente la configuración
   - El deploy se ejecutará automáticamente

## Estructura del Proyecto

```
TCGKB/
├── .dev/              # Herramientas de desarrollo (tests, docs, configs)
├── frontend/          # React application
├── backend/           # Express API
├── shared/            # Código compartido
├── package.json       # Root package
└── vercel.json        # Vercel config
```

📖 **Para desarrolladores**: Ver [.dev/docs/DEVELOPMENT.md](.dev/docs/DEVELOPMENT.md) para guía completa de desarrollo.

## Comandos Disponibles

```bash
npm run dev              # Iniciar frontend y backend
npm run dev:frontend     # Solo frontend
npm run dev:backend      # Solo backend
npm run build            # Build para producción
npm run install:all      # Instalar todas las dependencias
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Usuario actual

### Cards
- `GET /api/cards` - Listar cartas con paginación
- `GET /api/cards/:id` - Detalle de carta
- `GET /api/cards/search` - Búsqueda para @ menciones

### Comments
- `GET /api/comments/:cardId` - Comentarios de una carta (árbol anidado)
- `POST /api/comments` - Crear comentario
- `GET /api/comments/:commentId/replies` - Obtener respuestas
- `PATCH /api/comments/:commentId/hide` - Esconder comentario (usuario)
- `PATCH /api/admin/comments/:commentId/moderate` - Moderar comentario (admin)

### Reactions
- `POST /api/reactions` - Agregar reacción (anónima o autenticada)
- `DELETE /api/reactions` - Quitar reacción
- `GET /api/reactions/:targetType/:targetId` - Obtener reacciones agregadas

## Estado del Proyecto

- [x] Fase 1: Autenticación ✅
- [x] Fase 2: Sistema de cartas ✅
- [x] Fase 3: Comentarios con @ menciones ✅
- [x] Fase 4: Reacciones anónimas ✅
- [x] Fase 5: Real-time con Socket.io ✅
- [x] Fase 6: Sistema de moderación ✅
- [x] Fase 7: Optimizaciones de búsqueda ✅
- [ ] Fase 8: Deployment en Vercel 🚀

## Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

MIT
