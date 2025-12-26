# PTCGL Import Format - Implementation Summary

**Date**: 2025-12-26
**Developer**: @raj
**Status**: ✅ Complete - Ready for Testing

---

## 🎯 Objetivo

Permitir que los usuarios importen decks usando el formato oficial de Pokemon TCG Live (PTCGL), que usa códigos de 3 letras en lugar de IDs técnicos.

**Antes:**
```
4 Pikachu ex sv01-057    ❌ Difícil de recordar
```

**Ahora:**
```
4 Pikachu ex SVI 057     ✅ Formato oficial PTCGL
```

---

## 📋 Cambios Implementados

### 1. **Nuevo Archivo**: `backend/src/utils/setCodeMapping.js`
- Mapeo completo de 100+ sets (desde Base hasta Scarlet & Violet)
- Conversión bidireccional: Set Name ↔ PTCGL Code
- Funciones helper exportadas

**Ejemplo de uso:**
```javascript
import { getPTCGLCode } from './setCodeMapping.js'

getPTCGLCode('Paradox Rift')  // → "PAR"
getPTCGLCode('151')            // → "MEW"
```

### 2. **Modificado**: `scripts/sync-pokemon-cache.js`
- Agrega PTCGL code a `set.tcgOnline` durante el sync
- Si TCGdex ya tiene el código, lo mantiene
- Si es null, lo obtiene del mapping

**Comportamiento:**
```javascript
// Antes del sync
card.set.tcgOnline = null

// Después del sync
card.set.tcgOnline = "PAR"  // obtenido del mapping
```

### 3. **Modificado**: `backend/src/services/cardEnricher.service.js`
- `getNormalizedCardIds()` ahora acepta `setCode` y `number`
- Convierte PTCGL codes a TCGdex IDs automáticamente
- Crea múltiples variaciones para búsqueda en cache

**Flujo de búsqueda:**
```
Input: setCode="PAR", number="139"
  ↓
Variations: ["par-139", "sv04-139"]
  ↓
Cache Query: $in ["par-139", "sv04-139"]
  ↓
Match Found: "sv04-139" ✅
```

### 4. **Actualizado**: `docs/api.md`
- Documentados los 3 formatos soportados
- Ejemplos de cada formato
- Fecha actualizada

### 5. **Nuevo**: `docs/engineering/ptcgl-import-support.md`
- Documentación técnica completa
- Especificación del formato
- Tabla de códigos de sets
- Guía de testing

### 6. **Nuevo**: `test-ptcgl-import.mjs`
- Script de prueba standalone
- Deck de ejemplo con formato PTCGL
- Validación de resultados

---

## 🧪 Testing

### Resultado de Pruebas

```bash
node test-ptcgl-import.mjs
```

**✅ Todos los tests pasaron:**

| Input | Set Code | Number | Card ID | Status |
|-------|----------|--------|---------|--------|
| 4 Pikachu ex SVI 057 | SVI | 057 | sv01-057 | ✅ |
| 2 Miraidon ex PAR 121 | PAR | 121 | sv04-121 | ✅ |
| 3 Raichu TWM 055 | TWM | 055 | sv06-055 | ✅ |
| 1 Radiant Greninja ASR 046 | ASR | 046 | swsh10-046 | ✅ |
| 2 Squawkabilly ex PAL 169 | PAL | 169 | sv02-169 | ✅ |

**Estadísticas:**
- ✅ Success: true
- ✅ TCG: pokemon
- ✅ Format: expanded (auto-detected)
- ✅ Total cards: 60
- ✅ Validation: isValid = true
- ✅ No errors

---

## 📊 Códigos de Sets Soportados

### Scarlet & Violet (13 sets)
```
SVI → sv01     (Scarlet & Violet)
PAL → sv02     (Paldea Evolved)
OBF → sv03     (Obsidian Flames)
MEW → sv03.5   (151)
PAR → sv04     (Paradox Rift)
PAF → sv04.5   (Paldean Fates)
TEF → sv05     (Temporal Forces)
TWM → sv06     (Twilight Masquerade)
SFA → sv06.5   (Shrouded Fable)
SCR → sv07     (Stellar Crown)
SSP → sv08     (Surging Sparks)
PRE → sv08.5   (Prismatic Evolutions)
JTG → sv09     (Journey Together)
```

### Sword & Shield (15 sets)
```
SSH → swsh1      (Sword & Shield)
RCL → swsh2      (Rebel Clash)
DAA → swsh3      (Darkness Ablaze)
VIV → swsh4      (Vivid Voltage)
BST → swsh5      (Battle Styles)
CRE → swsh6      (Chilling Reign)
EVS → swsh7      (Evolving Skies)
FST → swsh8      (Fusion Strike)
BRS → swsh9      (Brilliant Stars)
ASR → swsh10     (Astral Radiance)
PGO → swsh10.5   (Pokémon GO)
LOR → swsh11     (Lost Origin)
SIT → swsh12     (Silver Tempest)
CRZ → swsh12.5   (Crown Zenith)
```

**+ 70+ sets adicionales** (XY, Sun & Moon, Black & White, etc.)

Ver archivo completo: `backend/src/utils/setCodeMapping.js`

---

## 🔄 Próximos Pasos

### Para Activar en Producción:

1. **Sync del Cache** (requiere credenciales MongoDB):
```bash
node scripts/sync-pokemon-cache.js
```
Esto poblará `set.tcgOnline` en todas las cartas del cache.

2. **Deploy a Stage**:
```bash
git checkout stage
git merge <feature-branch>
git push origin stage
```

3. **Verificar en Staging**:
- Importar deck con formato PTCGL
- Verificar que todas las cartas se resuelven correctamente
- Probar con diferentes sets (SV, SWSH, SM, XY)

4. **Deploy a Producción**:
- Merge a `main` después de aprobación
- Vercel hará deploy automático

---

## ✨ Beneficios

### Para Usuarios:
✅ Pueden copiar/pegar directamente desde PTCGL
✅ Códigos más fáciles de recordar (PAR vs sv04)
✅ Formato estándar de la comunidad
✅ No breaking changes (formato antiguo sigue funcionando)

### Para el Sistema:
✅ Compatibilidad con múltiples formatos
✅ Búsqueda por variaciones (performance)
✅ Cache enriquecido con metadata
✅ Documentación completa

---

## 📁 Archivos Modificados/Creados

### Nuevos Archivos (3):
```
✨ backend/src/utils/setCodeMapping.js
✨ docs/engineering/ptcgl-import-support.md
✨ test-ptcgl-import.mjs
```

### Archivos Modificados (3):
```
📝 scripts/sync-pokemon-cache.js
📝 backend/src/services/cardEnricher.service.js
📝 docs/api.md
```

### Temporales (para testing):
```
🗑️ list-sets.mjs (puede eliminarse)
```

---

## 🚀 Comandos Útiles

```bash
# Test del import
node test-ptcgl-import.mjs

# Listar sets y sus códigos
node list-sets.mjs

# Sync del cache (requiere DB)
node scripts/sync-pokemon-cache.js

# Run tests E2E (cuando estén disponibles)
npm test -- deck-import.spec.js
```

---

## 📝 Notas Importantes

1. **Retrocompatibilidad**: El formato antiguo (`sv04-139`) sigue funcionando perfectamente
2. **Sin Breaking Changes**: Ninguna funcionalidad existente se rompió
3. **Performance**: La búsqueda por variaciones es eficiente (batch query con $in)
4. **Extensible**: Fácil agregar nuevos sets al mapping cuando salgan

---

## ✅ Checklist de Implementación

- [x] Crear mapping de sets
- [x] Actualizar sync script
- [x] Modificar card enricher
- [x] Actualizar documentación API
- [x] Crear documentación técnica
- [x] Escribir tests
- [x] Validar con datos reales
- [ ] CAG Review (pendiente)
- [ ] Sync del cache en producción
- [ ] Deploy a staging
- [ ] Deploy a producción

---

**Ready for CAG Review** 🎉
