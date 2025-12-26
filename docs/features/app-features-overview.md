# TCGKB - Features Overview

**Status**: Activo
**Última actualización**: 2025-12-26

## 1. Descripción General

TCGKB (Trading Card Game Knowledge Base) es una **Progressive Web App (PWA)** diseñada para compartir y crear decks de Trading Card Games (TCG). La aplicación combina funcionalidades de gestión de mazos, comunidad y colección personal en una plataforma unificada multiplataforma.

### 1.1. Juegos Soportados

| Juego | Estado | Formatos Soportados |
|-------|--------|---------------------|
| **Pokémon TCG** | ✅ Activo | Standard, Expanded, GLC, Legacy |
| **Riftbound** | ✅ Activo | Constructed |
| **Pokémon TCG Pocket** | ⏸️ No soportado | - |

---

## 2. Feature Principal: Deck Manager

El **Deck Manager** es el corazón de TCGKB. Permite a los usuarios crear, editar, validar y compartir decks con la comunidad.

### 2.1. Creación de Decks

Los usuarios pueden crear decks de dos formas:

#### A. Creación Manual
- **Búsqueda de Cartas**: Buscar cartas por nombre, tipo, set, etc.
- **Filtros Visuales**: Iconos toggle para filtrar por tipo, energía, dominio
- **Interacciones**:
  - **Left Click**: Añadir 1 copia al deck
  - **Right Click**: Quitar 1 copia del deck
  - **Ctrl + Click**: Abrir input para establecer cantidad exacta
  - **Drag & Drop**: Arrastrar carta desde resultados al deck
- **Validación en Tiempo Real**: El sistema valida continuamente si el deck cumple las reglas del formato

#### B. Import Automático

El sistema de **import automático** permite a los usuarios pegar un deck completo en formato texto y obtener un deck listo en segundos.

**Características del Import**:
- ✅ **Detección Automática de Juego**: Identifica si es Pokémon o Riftbound
- ✅ **Detección Automática de Formato**: Standard, GLC, etc.
- ✅ **Procesamiento Rápido**: Parse y validación en <500ms
- ✅ **Enriquecimiento de Datos**: Obtiene metadata completa de cada carta desde cache

---

### 2.2. Formatos de Import Soportados

#### Pokémon TCG - Formato PTCGL (Pokemon TCG Live)

**Estructura**:
```
<qty> <card.name> <tcgOnline> <card.localid>
```

**Ejemplo**:
```
Pokémon: 12
4 Pikachu ex SVI 057
2 Miraidon ex PAR 121
3 Raichu TWM 055
2 Zapdos ex OBF 128

Trainer: 36
4 Iono PAL 185
4 Professor's Research SVI 189
4 Boss's Orders PAL 172
3 Nest Ball SVI 181
2 Ultra Ball SVI 196

Energy: 12
8 Electric Energy SVE 004
4 Double Turbo Energy BRS 151
```

**Campo `tcgOnline`**:
- Este campo representa el **código de set de PTCGL** (ej: `SVI`, `PAR`, `OBF`)
- Si el campo no está en cache, el sistema lo **popula automáticamente** basándose en:
  - **Fuente**: [Bulbapedia - List of Pokémon TCG expansions](https://m.bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions)
  - **Mapeo**: Se inyecta el `set.abb` (abreviación oficial) del set correspondiente
  - **Ejemplo**: `Paldea Evolved` → `PAL`, `Obsidian Flames` → `OBF`

**Implementación**:
- **Archivo**: `backend/src/utils/setCodeMapping.js`
- **Sync Script**: `scripts/sync-pokemon-cache.js` popula `set.tcgOnline` durante el cache sync
- **Card Enricher**: `backend/src/services/cardEnricher.service.js` resuelve códigos PTCGL a IDs de TCGdex

---

#### Riftbound - Formato Simple

**Estructura**:
```
<qty> <card.name>
```

**Ejemplo**:
```
1 Leona, Radiant Dawn
3 Clockwork Keeper
3 Stalwart Poro
3 Solari Shieldbearer
2 Sett, Kingpin
6 Order Rune
6 Calm Rune
1 Grove of the God-Willow
3 Defy
1 Zenith Blade
```

**Detección Automática de Componentes**:
- **Legends**: Cartas con `cardType: ["Legend"]`
- **Battlefields**: Cartas con `cardType: ["Battlefield"]`
- **Runes**: Cartas con `cardType: ["Rune"]` o nombre termina en "Rune"
- **Main Deck**: Todo lo demás (Unit, Spell, Gear)

---

### 2.3. Validación de Decks

El sistema valida los decks **en tiempo real** según las reglas del formato detectado.

#### Pokémon TCG - Standard/Expanded

| Regla | Validación |
|-------|------------|
| Total de cartas | Exactamente 60 |
| Copias máximas | 4 por nombre (excepto Basic Energy) |
| Basic Pokémon mínimo | Al menos 1 |
| ACE SPEC máximo | 1 en todo el deck |
| Radiant Pokémon máximo | 1 en todo el deck |

**Manejo de Reprints**:
- Cartas con el **mismo nombre pero de diferentes sets** cuentan juntas para el límite de copias
- **Ejemplo válido**: `2 Professor's Research SVI 189` + `2 Professor's Research PAL 172` = 4 copias ✅
- **Ejemplo inválido**: `3 Boss's Orders PAL 172` + `2 Boss's Orders BRS 132` = 5 copias ❌

#### Pokémon TCG - Gym Leader Challenge (GLC)

| Regla | Validación |
|-------|------------|
| Total de cartas | Exactamente 60 |
| Copias máximas | **1 por nombre** (Singleton) |
| Basic Energy | Ilimitado |
| Tipo de Pokémon | **Un solo tipo** (ej: solo Fire) |
| Rule Box Pokémon | **PROHIBIDO** (ex, V, VSTAR, VMAX, Radiant) |
| ACE SPEC | **PROHIBIDO** |

#### Riftbound - Constructed

| Componente | Cantidad |
|------------|----------|
| Main Deck | Exactamente 40 cartas |
| Legend | Exactamente 1 |
| Battlefields | Exactamente 3 |
| Runes | Exactamente 12 |
| Copias máximas | 3 por nombre |
| Sideboard (opcional) | 0 u 8 cartas |

**Restricción de Dominio**: Solo cartas de los 2 dominios del Legend elegido.

---

### 2.4. Compartir con la Comunidad

Los usuarios pueden hacer públicos sus decks para compartirlos con la comunidad.

**Features Sociales**:
- 👍 **Votos**: Sistema de upvote/downvote (anónimos permitidos)
- 💬 **Comentarios**: Discusiones anidadas ilimitadas
- 📋 **Clonar**: Copiar deck de otro usuario a "Mis Decks"
- 🔄 **Sync**: Crear "Live Copy" que se actualiza automáticamente cuando el autor actualiza su deck
- 🔗 **Share**: Compartir link directo o mediante OS share dialog

**Vista de Comunidad**:
- **Tabs**: "Mis Decks" | "Comunidad"
- **Filtros**: Por TCG, tipo, formato, tags
- **Sort**: Popularidad, Recientes, Más Copiados

---

## 3. Progressive Web App (PWA)

TCGKB está optimizada para funcionar como una app nativa en dispositivos móviles y desktop.

### 3.1. Features PWA

| Feature | Descripción |
|---------|-------------|
| **Installable** | Se puede instalar como app nativa (iOS/Android/Desktop) |
| **Offline-Ready** | Funciona sin conexión con cache inteligente |
| **Mobile-First** | Diseño responsive optimizado para móviles |
| **Touch Gestures** | Swipe, long-press, pull-to-refresh |
| **Fast** | Service Worker con cache estratégico |

### 3.2. Modo Offline

| Feature | Online | Offline |
|---------|--------|---------|
| Ver cartas | ✅ | ✅ (desde cache) |
| Buscar cartas | ✅ | ✅ (búsqueda local) |
| Ver decks | ✅ | ✅ (desde cache) |
| Editar mis decks | ✅ | ✅ (sync al reconectar) |
| Comentar | ✅ | ❌ |
| Reacciones | ✅ | ❌ |

---

## 4. Sistema Multi-TCG

TCGKB está diseñado para soportar múltiples Trading Card Games de forma transparente.

### 4.1. Arquitectura Multi-TCG

```
┌─────────────────────────────────────────────────────┐
│           TCGKB Unified Interface                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────┐         ┌──────────────┐         │
│  │   Pokemon    │         │  Riftbound   │         │
│  │   Service    │         │   Service    │         │
│  └──────┬───────┘         └──────┬───────┘         │
│         │                        │                  │
│         ▼                        ▼                  │
│  ┌──────────────┐         ┌──────────────┐         │
│  │ TCGdex API   │         │ Riftcodex    │         │
│  └──────────────┘         └──────────────┘         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 4.2. TCG System Locking

Los decks están **bloqueados a un solo TCG**:
- ❌ **No se pueden mezclar** cartas de Pokémon y Riftbound en el mismo deck
- ✅ El sistema detecta automáticamente el TCG al hacer import
- ✅ En creación manual, se bloquea al añadir la primera carta

---

## 5. Búsqueda y Exploración de Cartas

### 5.1. Búsqueda Transparente

Los usuarios **no necesitan saber** de qué TCG es una carta:
- Búsqueda unificada entre Pokémon y Riftbound
- Fuzzy search con Levenshtein distance
- Filtros por tipo, rareza, set, etc.

### 5.2. Cache Inteligente

| Característica | Valor |
|----------------|-------|
| **TTL** | 7 días |
| **Auto-expiration** | MongoDB TTL Index |
| **View Counter** | Incrementa con cada vista |
| **Batch Query** | Optimizado para import de 60+ cartas |

---

## 6. Sistema de Colección (Collection Tracker)

Los usuarios pueden marcar qué cartas poseen físicamente.

### 6.1. Build & Disarm

**Build**:
- Marca el deck como "construido" físicamente
- Verifica que el usuario tenga todas las cartas en su colección
- **Smart Reprint Substitution**: Si falta una versión específica, usa reprints disponibles
- Deducte cantidades de colección (Disponible → En Uso)

**Disarm**:
- Desmonta el deck
- Devuelve las cartas a la colección (En Uso → Disponible)

### 6.2. Collection Analysis

En la vista de decks de otros usuarios:
- Muestra "Tienes X/60 cartas"
- Resalta cartas faltantes
- **REQUEST HELP**: Genera imagen PNG con cartas faltantes para compartir y pedir trades

---

## 7. Features de Comunidad

### 7.1. Comentarios

- **Nested Comments**: Profundidad ilimitada
- **@ Mentions**: Mencionar cartas específicas
- **Real-time**: Socket.io para updates instantáneos
- **Anónimos**: Deben registrarse para comentar

### 7.2. Reacciones

- **Emojis**: Cualquier emoji Unicode
- **Anónimas**: Permitidas (basadas en fingerprint)
- **Real-time**: Updates instantáneos vía Socket.io
- **Targets**: Cartas, comentarios, decks

### 7.3. Votos en Decks

- **Sistema simple**: Solo 👍/👎
- **Anónimos permitidos**: Basado en fingerprint
- **Un voto por usuario**: No se puede votar ambos
- **Real-time updates**: Socket.io

---

## 8. Próximos Features

### 8.1. Valoración de Decks por Formato (Roadmap)

Próximamente se añadirá un sistema de **valoración automática** de decks basado en:

**Criterios de Valoración**:
- **Composición Legal**: ¿Cumple todas las reglas del formato?
- **Sinergias**: Detección de combos conocidos
- **Curva de Maná/Energía**: Distribución óptima
- **Consistencia**: Ratios de Pokémon/Trainer/Energy
- **Meta Alignment**: ¿Incluye cartas tier 1 del meta actual?

**Output**:
- Score numérico (0-100)
- Badges visuales (Tier S, A, B, C)
- Recomendaciones de mejora

---

## 9. i18n - Internacionalización

Todos los textos de la aplicación están disponibles en:

| Idioma | Código | Estado |
|--------|--------|--------|
| **Español** | `es` | ✅ Completo |
| **English** | `en` | ✅ Completo |

**Archivos**: `frontend/src/i18n/translations/*.json`

---

## 10. UX/UI Principles

| Principio | Descripción |
|-----------|-------------|
| **ONE floating button max** | Solo BugReportButton flotante |
| **Footer for secondary** | Links secundarios en footer |
| **No blocking animations** | El usuario nunca espera |
| **Minimal UI** | Cada píxel debe ganarse su lugar |
| **Mobile-first** | Diseño táctil primero, desktop después |
| **No popups para errores** | Indicadores inline en tiempo real |

---

## 11. Roles de Usuario

| Role | Acceso |
|------|--------|
| **Anónimo** | Ver cartas, decks públicos, reaccionar |
| **User** | Todo lo anterior + crear decks, comentar, colección |
| **User-Restricted** | User que no puede comentar (moderación) |
| **Moderator** | Moderar comentarios, restringir usuarios |
| **Dev** | Acceso completo + KPI Dashboard |

---

## 12. Referencias

### Documentación Relacionada

- [Architecture](../architecture.md)
- [API Reference](../api.md)
- [Deck Manager V2](./deck-manager-v2.md)
- [PWA Specification](./pwa.md)
- [PTCGL Import Support](../engineering/ptcgl-import-support.md)

### Fuentes Externas

**Pokémon TCG**:
- [Pokemon.com - Deckbuilding Guide](https://www.pokemon.com/us/strategy/designing-a-deck-from-scratch)
- [JustInBasil - Card Limits](https://www.justinbasil.com/guide/limits)
- [Bulbapedia - TCG Expansions](https://m.bulbapedia.bulbagarden.net/wiki/List_of_Pok%C3%A9mon_Trading_Card_Game_expansions)
- [Gym Leader Challenge Rules](https://gymleaderchallenge.com/rules)

**Riftbound**:
- [Riftbound Core Rules](https://riftbound.gg/core-rules/)
- [Riftbound Deckbuilding 101](https://riftbound.gg/deckbuilding-101-building-your-first-riftbound-deck/)
- [Piltover Archive](https://piltoverarchive.com/)

---

## 13. Changelog

| Fecha | Cambio |
|-------|--------|
| 2025-12-26 | Creación del documento de features overview |
| 2025-12-20 | PTCGL import support completo |
| 2025-12-20 | Card enrichment service implementado |
| 2025-12-20 | Real-time validation con enriched cards |

---

**Mantenido por**: Equipo TCGKB
**Última revisión**: 2025-12-26
