# PWA Updates & Staging Configuration

> **Engineering Note** documenting PWA update strategy and staging environment differentiation
> Implemented: 2025-12-24
> Author: Claude (AI Assistant)

---

## Summary

Sistema completo de actualización de PWA con notificaciones al usuario y diferenciación entre entorno de producción y staging.

**Características:**
- UpdatePrompt component para notificar actualizaciones
- Control manual de actualizaciones (no auto-update)
- Manifest diferenciado para staging (nombre, color, iconos)
- Scripts para generar iconos en grayscale
- Soporte i18n completo (ES/EN)

---

## 1. Cómo Funcionan las Actualizaciones de PWA

### Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario Abre PWA Instalada                                   │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────────────┐
│ 2. Navegador Revisa sw.js en el Servidor                        │
│    - Compara byte-por-byte con SW instalado                     │
│    - Detecta cambio en CACHE_VERSION                            │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────────────┐
│ 3. Nuevo SW Descargado → Estado "waiting"                       │
│    - SW antiguo sigue activo                                    │
│    - Nuevo SW espera permiso para activarse                     │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────────────┐
│ 4. UpdatePrompt Detecta Nuevo SW                                │
│    - Escucha evento 'updatefound'                               │
│    - Muestra banner: "¡Nueva versión disponible!"               │
└──────────────────┬──────────────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          v                 v
    ┌─────────┐       ┌──────────┐
    │ Usuario │       │ Usuario  │
    │ Click   │       │ Dismiss  │
    │ Update  │       │          │
    └────┬────┘       └─────┬────┘
         │                  │
         v                  v
┌──────────────────┐  ┌──────────────────┐
│ 5a. postMessage  │  │ 5b. No Action    │
│ SKIP_WAITING     │  │ - SW sigue       │
│                  │  │   esperando      │
└────────┬─────────┘  │ - Banner se      │
         │            │   oculta 24h     │
         v            └──────────────────┘
┌──────────────────┐
│ 6. SW.skipWaiting│
│    clients.claim │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│ 7. controllerchange
│    → Page Reload │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│ 8. App Actualizada
│    SW v1.2.0    │
└──────────────────┘
```

### Diferencias con Auto-Update

| Aspecto | Auto-Update (skipWaiting) | Manual Update (Nuestra Implementación) |
|---------|---------------------------|----------------------------------------|
| **Activación** | Inmediata al detectar | Espera confirmación del usuario |
| **Control** | Ninguno | Usuario decide cuándo |
| **UX** | Posibles errores si HTML/JS no coinciden | Actualización controlada |
| **Banner** | No se muestra | UpdatePrompt visible |
| **Timing** | Al reabrir app (todas las pestañas cerradas) | Cuando usuario hace click |

---

## 2. Componentes del Sistema

### 2.1 UpdatePrompt Component

**Archivo:** [frontend/src/components/common/UpdatePrompt.jsx](../../frontend/src/components/common/UpdatePrompt.jsx)

**Responsabilidades:**
1. Detectar nuevos Service Workers
2. Mostrar banner de notificación
3. Enviar mensaje SKIP_WAITING
4. Recargar página al activarse nuevo SW

**API:**

```javascript
// Detectar update disponible
navigator.serviceWorker.getRegistration().then(reg => {
  reg.addEventListener('updatefound', () => {
    const newWorker = reg.installing
    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        setUpdateAvailable(true) // Mostrar banner
      }
    })
  })
})

// Activar actualización
registration.waiting.postMessage({ type: 'SKIP_WAITING' })

// Recargar cuando nuevo SW toma control
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload()
})
```

**Estados:**
- `updateAvailable: false` - Sin actualización, banner oculto
- `updateAvailable: true` - Actualización detectada, banner visible
- Después de click "Update" - Banner oculto, recarga automática

**Cooldown:**
- Dismiss guarda timestamp en localStorage
- No vuelve a mostrar por 24 horas
- Permite que usuarios pospongan la actualización

### 2.2 Service Worker Message Handler

**Archivo:** [frontend/public/sw.js](../../frontend/public/sw.js)

**Líneas clave:**

```javascript
// install event (línea 26)
self.addEventListener('install', (event) => {
  // NO hace skipWaiting() aquí
  // Espera mensaje del UpdatePrompt
})

// message event (línea ~275)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting() // Activa el nuevo SW
  }
})

// activate event (línea 41)
self.addEventListener('activate', (event) => {
  self.clients.claim() // Toma control inmediatamente
})
```

**Versionado:**

```javascript
const CACHE_VERSION = '1.2.0';
const STATIC_CACHE = `tcgkb-static-v${CACHE_VERSION}`;
const IMAGES_CACHE = `tcgkb-images-v${CACHE_VERSION}`;
const API_CACHE = `tcgkb-api-v${CACHE_VERSION}`;
const FONTS_CACHE = `tcgkb-fonts-v${CACHE_VERSION}`;
```

Cada vez que se incrementa `CACHE_VERSION`, el navegador detecta cambio y descarga el nuevo SW.

### 2.3 App Integration

**Archivo:** [frontend/src/App.jsx](../../frontend/src/App.jsx)

```javascript
import UpdatePrompt from './components/common/UpdatePrompt'

<div className="min-h-screen">
  <OfflineBanner />
  <InstallPrompt />
  <UpdatePrompt /> {/* Nuevo */}
  <Header />
  // ...
</div>
```

El UpdatePrompt se monta al inicio y escucha eventos del Service Worker durante toda la sesión.

---

## 3. Diferenciación de Entornos

### 3.1 Producción vs Staging

| Aspecto | Producción | Staging |
|---------|-----------|---------|
| **URL** | `https://tcgkb.app` | `https://staging.tcgkb.app` |
| **Nombre** | TCG Knowledge Base | TCG KB [STAGING] |
| **Short Name** | TCG KB | TCG KB STG |
| **Theme Color** | #3b82f6 (azul) | #f59e0b (naranja) |
| **Iconos** | icon-192.png, icon-512.png | icon-192-staging.png, icon-512-staging.png |
| **Manifest** | manifest.json | manifest.staging.json |

### 3.2 Archivos de Configuración

**Production (default):**
```json
// frontend/public/manifest.json
{
  "name": "TCG Knowledge Base",
  "short_name": "TCG KB",
  "theme_color": "#3b82f6",
  "icons": [
    { "src": "/icons/icon-192.png", ... },
    { "src": "/icons/icon-512.png", ... }
  ]
}
```

**Staging:**
```json
// frontend/public/manifest.staging.json
{
  "name": "TCG KB [STAGING]",
  "short_name": "TCG KB STG",
  "theme_color": "#f59e0b",
  "icons": [
    { "src": "/icons/icon-192-staging.png", ... },
    { "src": "/icons/icon-512-staging.png", ... }
  ]
}
```

### 3.3 Iconos en Grayscale

Para que staging sea visualmente distinguible, los iconos están en escala de grises.

**Opciones para generar:**

#### Opción 1: Script Node.js con sharp (Recomendado)

```bash
# Instalar sharp
npm install --save-dev sharp

# Generar iconos
node scripts/create-staging-icons.cjs
```

Este script lee `icon-192.png` y `icon-512.png`, los convierte a grayscale, y los guarda como `icon-*-staging.png`.

#### Opción 2: Herramienta HTML en Navegador

```bash
# Abrir en navegador
open scripts/create-grayscale-icons.html
```

1. Selecciona `icon-192.png`
2. Click "Convert to Grayscale"
3. Descarga como `icon-192-staging.png`
4. Repite para `icon-512.png`
5. Coloca en `frontend/public/icons/`

#### Opción 3: ImageMagick (si está instalado)

```bash
convert frontend/public/icons/icon-192.png -colorspace Gray frontend/public/icons/icon-192-staging.png
convert frontend/public/icons/icon-512.png -colorspace Gray frontend/public/icons/icon-512-staging.png
```

#### Opción 4: Online Tool

Visita: https://www.imgonline.com.ua/eng/make-grayscale-image.php

### 3.4 Script de Preparación

**Archivo:** [scripts/prepare-manifest.cjs](../../scripts/prepare-manifest.cjs)

```bash
# Para producción (usa manifest.json por defecto)
node scripts/prepare-manifest.cjs production

# Para staging (copia manifest.staging.json → manifest.json)
node scripts/prepare-manifest.cjs staging
```

**Uso en CI/CD:**

```yaml
# .github/workflows/deploy-staging.yml
- name: Prepare staging manifest
  run: node scripts/prepare-manifest.cjs staging

- name: Build
  run: npm run build

- name: Deploy
  run: vercel --prod
```

---

## 4. Instalaciones Separadas

### 4.1 PWAs Independientes

Las PWAs se identifican por **origen (domain)**:

```
📱 Android/iOS Home Screen:

┌─────────────────────┐
│  TCG KB             │  ← Producción (tcgkb.app)
│  [Icono azul]       │     Service Worker: tcgkb.app/sw.js
└─────────────────────┘     IndexedDB: tcgkb-offline

┌─────────────────────┐
│  TCG KB [STAGING]   │  ← Staging (staging.tcgkb.app)
│  [Icono grayscale]  │     Service Worker: staging.tcgkb.app/sw.js
└─────────────────────┘     IndexedDB: tcgkb-offline (diferente origen)
```

**Importante:** El usuario puede tener AMBAS instaladas simultáneamente sin conflictos.

### 4.2 Datos Independientes

Cada instalación tiene su propia:
- **Cache de Service Worker** - Separada por origen
- **IndexedDB** - `tcgkb-offline` es por origen
- **LocalStorage** - Configuración independiente
- **Cookies** - Por dominio

### 4.3 Actualizaciones Independientes

```
Scenario: Deploy a Staging

1. Push to `stage` branch
2. Vercel despliega a staging.tcgkb.app
3. CACHE_VERSION cambia a 1.3.0
4. Usuarios con PWA staging instalada:
   - Al abrir app → Detectan SW 1.3.0
   - Ven UpdatePrompt
   - Actualizan cuando quieran

5. Usuarios con PWA producción instalada:
   - NO detectan cambios (main sigue en 1.2.0)
   - No ven UpdatePrompt
   - Siguen usando versión actual
```

---

## 5. Testing de Actualizaciones

### 5.1 Test Local

1. **Primera instalación:**
   ```bash
   npm run dev
   # Visita http://localhost:5173
   # Instala PWA (si navegador lo permite)
   ```

2. **Simular actualización:**
   ```javascript
   // En sw.js, cambia:
   const CACHE_VERSION = '1.2.0'; // → '1.3.0'
   ```

3. **Recargar página:**
   - UpdatePrompt debería aparecer
   - Click "Actualizar ahora"
   - Página recarga con nuevo SW

4. **Verificar en DevTools:**
   ```
   Chrome DevTools → Application → Service Workers

   Debería mostrar:
   - Status: activated and is running
   - Source: sw.js (v1.3.0)
   ```

### 5.2 Test en Staging

1. **Instalar staging PWA:**
   - Visita `https://staging.tcgkb.app`
   - Instala desde banner o menú de Chrome

2. **Hacer deploy nuevo:**
   ```bash
   git push origin stage
   # Espera a que Vercel despliegue
   ```

3. **Abrir PWA instalada:**
   - UpdatePrompt debería aparecer
   - Verificar mensaje en español/inglés
   - Probar botones Update/Dismiss

### 5.3 Test en Producción

⚠️ **CUIDADO:** Solo hacer después de verificar en staging.

```bash
git checkout main
git merge stage
git push origin main
```

1. Usuarios con PWA instalada verán UpdatePrompt
2. Pueden actualizar cuando quieran (no forzado)
3. Si reportan problemas, pueden seguir usando versión anterior hasta que hagan update

---

## 6. Casos de Uso Comunes

### 6.1 Usuario Pospone Actualización

```
1. UpdatePrompt aparece
2. Usuario click "Más tarde"
3. Banner se oculta
4. localStorage guarda timestamp
5. Después de 24 horas:
   - Banner vuelve a aparecer
   - Usuario puede actualizar o posponer otra vez
```

El SW nuevo queda en estado "waiting" hasta que:
- Usuario acepte update
- Usuario cierre TODAS las pestañas y reabra (comportamiento por defecto)

### 6.2 Actualización de Emergencia

Si necesitas forzar actualización inmediata (ej. bug crítico):

```javascript
// Opción 1: Volver a auto-skipWaiting temporalmente
// En sw.js:
self.addEventListener('install', (event) => {
  self.skipWaiting() // Activa inmediatamente
})
```

Esto hace que el nuevo SW se active sin esperar confirmación. Los usuarios verán la página recargarse automáticamente.

⚠️ **Riesgo:** Puede causar errores si HTML/JS no coincide con SW.

### 6.3 Múltiples Actualizaciones Pendientes

Si haces múltiples deploys rápidos:

```
Deploy 1: SW 1.2.0 → 1.3.0
Usuario no actualiza

Deploy 2: SW 1.3.0 → 1.4.0
```

El usuario verá:
1. UpdatePrompt para 1.3.0
2. Al actualizar, descarga 1.3.0
3. Inmediatamente detecta 1.4.0
4. UpdatePrompt aparece otra vez

Esto es correcto - el usuario siempre llega a la última versión.

---

## 7. Troubleshooting

### Problema: UpdatePrompt no aparece

**Diagnóstico:**

```javascript
// En Console de Chrome DevTools
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('Registration:', reg)
  console.log('Active:', reg?.active?.scriptURL)
  console.log('Waiting:', reg?.waiting?.scriptURL)
  console.log('Installing:', reg?.installing?.scriptURL)
})
```

**Soluciones:**

1. **SW no cambió:**
   - Verifica que `CACHE_VERSION` sea diferente
   - Haz hard refresh (Ctrl+Shift+R)

2. **SW no registrado:**
   - Verifica que `sw.js` exista en `/public/`
   - Revisa errores en Application → Service Workers

3. **UpdatePrompt se montó antes de detectar:**
   - Normal - el componente detectará en próxima apertura

### Problema: Página no recarga después de Update

**Causa:** El evento `controllerchange` no se disparó.

**Solución:**

```javascript
// Verificar en UpdatePrompt.jsx que existe:
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload()
})
```

### Problema: Ambos entornos tienen mismo nombre

**Causa:** No se usó manifest.staging.json

**Solución:**

```bash
# Antes de build para staging:
node scripts/prepare-manifest.cjs staging
npm run build
```

O manualmente:
```bash
cp frontend/public/manifest.staging.json frontend/public/manifest.json
```

---

## 8. Best Practices

### 8.1 Versionado Semántico

Sigue SemVer para `CACHE_VERSION`:

```
1.2.0 → 1.2.1  (Patch: bug fixes)
1.2.0 → 1.3.0  (Minor: new features)
1.2.0 → 2.0.0  (Major: breaking changes)
```

### 8.2 Testing Flow

```
1. Desarrollo local: npm run dev
2. Test en staging: git push origin stage
3. Verificar UpdatePrompt funciona
4. Merge a main: git merge stage
5. Monitor producción
```

### 8.3 Comunicación con Usuarios

Cuando hagas deploy importante:

```markdown
📱 **Nueva versión disponible!**

Si tienes la app instalada, verás un banner para actualizar.

Cambios:
- ✨ Nueva feature X
- 🐛 Fix de bug Y
- ⚡ Mejoras de rendimiento
```

### 8.4 Rollback

Si algo sale mal:

```bash
# Revertir último commit
git revert HEAD

# Cambiar CACHE_VERSION de vuelta
# ej. 1.3.0 → 1.2.0 (no recomendado, mejor 1.3.1 con fix)

# Push
git push origin main
```

Los usuarios verán UpdatePrompt para la "nueva" versión 1.2.0.

---

## 9. Próximos Pasos

### Mejoras Futuras

1. **Versionado Automático:**
   ```javascript
   // Inyectar versión de package.json en build
   const { version } = require('./package.json')
   // SW usa version automáticamente
   ```

2. **Changelog en UpdatePrompt:**
   ```javascript
   <UpdatePrompt changelog={[
     '✨ Nueva feature X',
     '🐛 Fix de bug Y'
   ]} />
   ```

3. **Skip Waiting Condicional:**
   ```javascript
   // Solo auto-update para patches, no para majors
   if (newVersion.major === currentVersion.major) {
     self.skipWaiting()
   }
   ```

4. **Analytics:**
   ```javascript
   // Track cuántos usuarios actualizan vs posponen
   gtag('event', 'pwa_update', { action: 'accept' })
   ```

---

## Referencias

- [PWA Specification](../features/pwa.md)
- [Service Worker Lifecycle](https://web.dev/service-worker-lifecycle/)
- [UpdatePrompt Component](../../frontend/src/components/common/UpdatePrompt.jsx)
- [PR #188](https://github.com/manucruzleiva/TCGKB/pull/188)

---

## Credits

**Implemented by:** Claude (AI Assistant)
**Date:** 2025-12-24
