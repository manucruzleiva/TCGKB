# Progressive Web App (PWA) Specification

> **Feature Spec** for offline-capable PWA with mobile-first design.
> Last updated: 2025-12-20

---

## Summary

TCGKB is a fully offline-capable Progressive Web App with mobile-first design.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PWA ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────────┐   │
│  │   React App     │────▶│  Service Worker │────▶│    Cache API        │   │
│  │  (UI Layer)     │◀────│  (sw.js)        │◀────│  (Static + Dynamic) │   │
│  └────────┬────────┘     └────────┬────────┘     └─────────────────────┘   │
│           │                       │                                         │
│           ▼                       ▼                                         │
│  ┌─────────────────┐     ┌─────────────────┐                               │
│  │ Connectivity    │     │   IndexedDB     │                               │
│  │ Context         │     │  (Card Cache)   │                               │
│  │ (online/offline)│     │  (Deck Cache)   │                               │
│  └─────────────────┘     └─────────────────┘                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CACHE STRATEGIES                              │   │
│  ├──────────────────┬──────────────────┬───────────────────────────────┤   │
│  │ Cache-First      │ Network-First    │ Stale-While-Revalidate       │   │
│  │ (Static assets)  │ (API calls)      │ (Card images)                 │   │
│  └──────────────────┴──────────────────┴───────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Offline Mode UX

### Core Principle
**"Always available, clearly communicated"** - Users can access cached content anytime with clear visual feedback.

### Offline Banner

| State | Color | Icon | Message (ES) | Message (EN) |
|-------|-------|------|--------------|--------------|
| Offline | `bg-yellow-500` | ⚡ | Sin conexión - Mostrando contenido guardado | Offline - Showing cached content |
| Reconnecting | `bg-blue-500` | 🔄 | Reconectando... | Reconnecting... |
| Back Online | `bg-green-500` | ✅ | Conexión restaurada | Connection restored |

### Feature Availability

| Feature | Online | Offline | Offline Behavior |
|---------|--------|---------|------------------|
| View cards | ✅ | ✅ | From IndexedDB cache |
| Search cards | ✅ | ✅ | Local search in cached cards |
| View decks | ✅ | ✅ | From IndexedDB cache |
| Edit my decks | ✅ | ✅ | Local edits, sync when online |
| View comments | ✅ | ✅ | Cached comments only |
| Write comments | ✅ | ❌ | Disabled with tooltip |
| Add reactions | ✅ | ❌ | Disabled, show cached counts |
| Login/Register | ✅ | ❌ | Redirect to offline notice |
| View settings | ✅ | ✅ | Full access |
| Change settings | ✅ | ✅ | Local save, sync when online |
| Import deck | ✅ | ⚠️ | Parse works, validation limited |

---

## Components

### ConnectivityContext

**Location**: `frontend/src/contexts/ConnectivityContext.jsx`

```jsx
const {
  isOnline,           // boolean - current connection state
  wasOffline,         // boolean - was offline in this session
  lastOnline,         // Date - timestamp of last online state
  reconnect,          // () => void - manual reconnection attempt
  pendingChanges,     // number - count of changes to sync
  syncStatus          // 'idle' | 'syncing' | 'error' | 'success'
} = useConnectivity()
```

### OfflineBanner

**Location**: `frontend/src/components/common/OfflineBanner.jsx`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showRetry` | boolean | true | Show retry button |
| `autoDismiss` | boolean | true | Auto-hide "back online" state |
| `dismissDelay` | number | 3000 | Milliseconds before auto-dismiss |

### InstallPrompt

**Location**: `frontend/src/components/common/InstallPrompt.jsx`

Display conditions:
1. Browser supports PWA installation
2. App is not already installed
3. User has visited at least 2 pages OR spent 30+ seconds
4. User hasn't dismissed the prompt in last 7 days

---

## Service Worker

### Cache Strategies

| Resource | Strategy | Cache Name | TTL |
|----------|----------|------------|-----|
| App shell (HTML, JS, CSS) | Cache-First | `tcgkb-static-v1` | ∞ (versioned) |
| Card images | Stale-While-Revalidate | `tcgkb-images-v1` | 30 days |
| API responses (GET) | Network-First | `tcgkb-api-v1` | 7 days |
| Fonts | Cache-First | `tcgkb-fonts-v1` | ∞ |
| User data | IndexedDB | N/A | Persistent |

### Precache URLs

```javascript
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html'
]
```

---

## IndexedDB Schema

**Database**: `tcgkb-offline`

| Store | Key | Indexes | Purpose |
|-------|-----|---------|---------|
| `cards` | `id` | `name`, `setCode`, `lastAccessed` | Cached card data |
| `decks` | `id` | `userId`, `lastModified` | User's decks (synced) |
| `comments` | `id` | `cardId`, `deckId`, `createdAt` | Cached comments |
| `pendingActions` | `id` | `type`, `createdAt` | Offline mutations |
| `userPreferences` | `key` | - | Settings |

---

## Mobile-First Design

### Touch Interactions

| Gesture | Action | Where |
|---------|--------|-------|
| Swipe down | Refresh content | Any list view |
| Swipe left on card | Quick add to deck | Card grid |
| Long press | Context menu | Cards, comments |
| Pull from edge | Open drawer menu | Mobile only |

### Responsive Breakpoints

| Breakpoint | Viewport | Layout Changes |
|------------|----------|----------------|
| `xs` (default) | <640px | Single column, bottom nav, larger touch targets |
| `sm` | ≥640px | Two columns for cards |
| `md` | ≥768px | Sidebar visible, three columns |
| `lg` | ≥1024px | Full desktop layout |

### Touch Targets

All interactive elements follow minimum touch target guidelines:
- Minimum size: 44x44px (WCAG 2.1 AAA)
- Recommended size: 48x48px
- Spacing between targets: 8px minimum

---

## Implementation Phases

| Phase | Features | Priority |
|-------|----------|----------|
| **Phase 1** | ConnectivityContext, OfflineBanner, Service Worker upgrade | High |
| **Phase 2** | IndexedDB integration, offline deck editing | High |
| **Phase 3** | Background sync for pending actions | Medium |
| **Phase 4** | InstallPrompt, improved caching | Medium |
| **Phase 5** | Push notifications, MobileBottomNav | Low |

---

## i18n Keys

```json
{
  "offline": {
    "banner": {
      "offline": "Sin conexión - Mostrando contenido guardado",
      "reconnecting": "Reconectando...",
      "backOnline": "Conexión restaurada",
      "retry": "Reintentar"
    },
    "features": {
      "readOnly": "Solo lectura sin conexión",
      "requiresConnection": "Requiere conexión a internet",
      "pendingSync": "{{count}} cambios pendientes de sincronizar"
    },
    "install": {
      "title": "Instala TCGKB",
      "description": "Accede más rápido y usa sin conexión",
      "installButton": "Instalar App",
      "dismissButton": "Ahora no"
    }
  }
}
```

---

## Accessibility

| Requirement | Implementation |
|-------------|----------------|
| Offline banner announced | `role="alert"` + `aria-live="polite"` |
| Disabled elements | `aria-disabled="true"` + visible tooltip |
| Install prompt | Focus trap, dismissible with Escape |
| Touch targets | Minimum 44x44px |
| Color contrast | 4.5:1 for all text in banners |

---

## Related Documentation

- [Architecture](../architecture.md)
- [Deck Manager V2](./deck-manager-v2.md)
