# TCGKB Asset Placeholders Guide

Este documento lista todas las ubicaciones donde se pueden agregar assets personalizados para reemplazar los emojis/texto actuales.

## Assets Existentes (en /assets/)
- `favicon.png` - Icono KB cards (usado como favicon)
- `iso.png` - Logo "TCG KNOWLEDGE BASE" texto
- `logo.png` - Logo KB cards grande
- `mobile.png` - Versión móvil
- `wide logo black letters.png` - Logo horizontal (letras negras)
- `wide logo white letters.png` - Logo horizontal (letras blancas)

---

## 1. HEADER / NAVBAR

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Logo principal | Texto "TCG KB" | `wide logo white letters.png` (dark mode) / `wide logo black letters.png` (light mode) |
| Favicon | `favicon.png` | ✅ Ya existe |

**Archivos a modificar:**
- `frontend/src/components/layout/Navbar.jsx`

---

## 2. HOME PAGE

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| TCG Systems - Pokemon | ⚡ emoji | Icono Pokemon TCG oficial o custom |
| TCG Systems - Rifbound | 🎴 emoji | Logo Rifbound |
| Stats - Total Cartas | 🃏 emoji | Icono cartas custom |
| Stats - Comentarios | 💬 emoji | Icono speech bubble custom |
| Stats - Reacciones | 😀 emoji | Icono reacciones custom |
| Stats - Usuarios | 👥 emoji | Icono usuarios custom |

**Archivos a modificar:**
- `frontend/src/pages/Home.jsx`

---

## 3. CARD DETAIL PAGE

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Tipos de energía | Emojis (🌙, ⚡, 🔮, 🌿, ⭐, 🔥, 💧, etc.) | Iconos de energía oficiales Pokemon |
| Ataques header | ⚔️ emoji | Icono espada custom |
| Habilidades header | ✨ emoji | Icono habilidad custom |
| Daño | 💥 emoji | Icono daño custom |
| Reacciones | 👍 👎 | Iconos pulgar custom |

**Archivos a modificar:**
- `frontend/src/pages/CardDetail.jsx`
- `frontend/src/components/cards/EnergyIcon.jsx` (crear si no existe)

---

## 4. COMMENTS / MENTIONS

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Card mention chip | Pokemon sprite + emoji | ✅ Ya usa sprites |
| Attack indicator | ⚔️ emoji | Icono espada custom |
| Ability indicator | ✨ emoji | Icono habilidad custom |

**Archivos a modificar:**
- `frontend/src/components/comments/CardMentionLink.jsx`

---

## 5. HAMBURGER MENU

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Inicio | 🏠 emoji | Icono home custom |
| Mazos | 🃏 emoji | Icono deck custom |

**Archivos a modificar:**
- `frontend/src/components/layout/Navbar.jsx`

---

## 6. DECKS PAGE

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Empty state | 🧩 emoji (puzzle) | Ilustración "no decks" |
| Tags button | 🏷️ emoji | Icono tag custom |

**Archivos a modificar:**
- `frontend/src/pages/Decks.jsx`

---

## 7. LOGIN / REGISTER PAGES

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Header area | (vacío) | Logo + ilustración de bienvenida |

**Archivos a modificar:**
- `frontend/src/pages/Login.jsx`
- `frontend/src/pages/Register.jsx`

---

## 8. SETTINGS PAGE

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Formato fecha | 📅 emoji | Icono calendario custom |
| Seguridad | 🔒 emoji | Icono candado custom |
| Avatar default | Inicial en círculo | Avatar placeholder custom |

**Archivos a modificar:**
- `frontend/src/pages/Settings.jsx`

---

## 9. MOD PANEL

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Total Comentarios | 💬 emoji | Icono comentarios custom |
| Moderados | 🚫 emoji | Icono moderación custom |
| Usuarios | 👥 emoji | Icono usuarios custom |
| Admins | 👑 emoji | Icono corona/admin custom |
| Reacciones en gráfica | 👍 🔥 ❤️ 👎 | Iconos reacción custom |

**Archivos a modificar:**
- `frontend/src/pages/ModPanel.jsx`

---

## 10. DEV DASHBOARD

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Título | 🛠️ emoji | Icono herramientas custom |
| Bug Reports | 🐛 emoji | Icono bug custom |
| Estado API/DB | Puntos de color | Iconos estado custom |

**Archivos a modificar:**
- `frontend/src/pages/DevDashboard.jsx`

---

## 11. LOADING STATES

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Spinner global | CSS spinner | Animación custom con logo KB |
| Card loading | Skeleton | Skeleton con forma de carta |

**Archivos a modificar:**
- `frontend/src/components/common/Spinner.jsx`

---

## 12. EMPTY STATES

| Ubicación | Actual | Asset Sugerido |
|-----------|--------|----------------|
| Sin comentarios | Texto | Ilustración "sin comentarios" |
| Sin mazos | 🧩 emoji | Ilustración "crea tu mazo" |
| Sin resultados búsqueda | Texto | Ilustración "no encontrado" |
| Error 404 | (verificar) | Ilustración 404 |

---

## Prioridad de Implementación

### Alta Prioridad
1. Logo en navbar (ya tienes los assets)
2. Iconos de energía Pokemon (muy visible)
3. Ilustraciones para login/register

### Media Prioridad
4. Iconos de stats en home
5. Empty states con ilustraciones
6. Loading spinner custom

### Baja Prioridad
7. Iconos de menú hamburguesa
8. Iconos admin panels

---

## Formato Recomendado para Assets

- **Iconos pequeños**: SVG o PNG 24x24, 32x32
- **Logos**: SVG preferido, PNG como fallback
- **Ilustraciones**: PNG o SVG, máximo 400px ancho
- **Sprites Pokemon**: Ya se usan de PokeAPI

---

*Documento generado el 2025-12-18*
