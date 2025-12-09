# Guía de Deployment en Vercel

## Variables de Entorno Requeridas

### Backend (Vercel Environment Variables)

Configura estas variables en el dashboard de Vercel:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pokemon-tcg?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d
POKEMON_TCG_API_KEY=your-pokemon-tcg-api-key-from-pokemontcg.io
CORS_ORIGIN=https://your-vercel-app.vercel.app
NODE_ENV=production
```

### Frontend (Vercel Environment Variables)

```
VITE_API_URL=https://your-vercel-app.vercel.app/api
VITE_SOCKET_URL=https://your-vercel-app.vercel.app
```

## Pasos para Deploy

### 1. Preparar el Repositorio

```bash
# Asegúrate de estar en la rama main
git add .
git commit -m "Preparar para deployment en Vercel"
git push origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub
2. Click en "Add New Project"
3. Selecciona el repositorio `TCGKB`
4. Vercel detectará automáticamente la configuración del `vercel.json`

### 3. Configurar Variables de Entorno

En el dashboard de Vercel, antes de hacer el deploy:

1. Ve a la sección "Environment Variables"
2. Agrega todas las variables listadas arriba
3. Asegúrate de que estén disponibles para **Production**, **Preview**, y **Development**

### 4. Deploy

1. Click en "Deploy"
2. Espera a que el build termine (usualmente 2-3 minutos)
3. Vercel te dará una URL de producción

### 5. Verificar el Deploy

Visita tu URL de producción y verifica:

- [ ] La página de inicio carga correctamente
- [ ] Puedes buscar cartas
- [ ] El login/registro funciona
- [ ] Puedes crear comentarios (requiere login)
- [ ] Puedes agregar reacciones (sin login)
- [ ] Los comentarios se actualizan en tiempo real

## Obtener API Keys

### MongoDB Atlas (Gratis)

1. Ve a [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Crea una cuenta gratuita
3. Crea un nuevo cluster (opción M0 Sandbox - Free)
4. En "Database Access", crea un usuario con contraseña
5. En "Network Access", agrega `0.0.0.0/0` (permitir acceso desde cualquier IP)
6. Click en "Connect" y copia la connection string
7. Reemplaza `<password>` con tu contraseña y `<dbname>` con `pokemon-tcg`

### Pokemon TCG API Key (Gratis)

1. Ve a [pokemontcg.io](https://pokemontcg.io)
2. Click en "Get API Key"
3. Crea una cuenta
4. Copia tu API key desde el dashboard

### JWT Secret

Genera una cadena aleatoria segura:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Troubleshooting

### El frontend carga pero no hay datos de cartas

- Verifica que `POKEMON_TCG_API_KEY` esté configurada correctamente
- Revisa los logs en Vercel Dashboard > Deployments > [tu deploy] > Functions

### Los comentarios no se guardan

- Verifica que `MONGODB_URI` esté configurada correctamente
- Verifica que tu IP esté en la whitelist de MongoDB Atlas
- Revisa los logs de funciones en Vercel

### CORS errors

- Asegúrate de que `CORS_ORIGIN` en el backend coincida con tu URL de Vercel
- Si usas un dominio personalizado, actualiza `CORS_ORIGIN`

### Socket.io no funciona en producción

**Importante**: Socket.io en Vercel serverless tiene limitaciones. Para producción completa considera:

1. **Opción 1 (Recomendada)**: Usar un servicio gestionado
   - [Ably](https://ably.com) - Free tier: 3M mensajes/mes
   - [Pusher](https://pusher.com) - Free tier: 200k mensajes/día
   - Socket.io Cloud - Servicio oficial

2. **Opción 2**: Desplegar backend en Railway/Render
   - Mantén el frontend en Vercel
   - Backend con Socket.io en Railway (free tier disponible)

## Monitoreo

Después del deploy, monitorea:

- **Vercel Analytics**: Tráfico y performance del frontend
- **Vercel Functions Logs**: Errores del backend
- **MongoDB Atlas Metrics**: Uso de base de datos

## Actualizaciones

Para deployar cambios:

```bash
git add .
git commit -m "Descripción de cambios"
git push origin main
```

Vercel automáticamente detectará el push y hará un nuevo deploy.

## Notas Importantes

- **Free Tier Limits**: Vercel tiene límites en el free tier
  - 100 GB bandwidth/mes
  - 100 horas de función serverless/mes
  - 6000 segundos de build time/mes

- **MongoDB Atlas Free Tier**: 512 MB de almacenamiento

- **Pokemon TCG API**: 20,000 requests/día (cacheamos para minimizar uso)

## Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica las variables de entorno
3. Asegúrate de que todas las dependencias estén en `package.json` (no en `devDependencies` para producción)
