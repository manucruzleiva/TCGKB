## Reglas de Desarrollo

### Git Workflow (MUY IMPORTANTE)
- **NUNCA hacer push directo a `main`** - main es producción
- Todos los cambios van primero a `stage` (staging environment)
- Esperar aprobación del usuario antes de merge a `main`
- Flujo: `stage` -> revisión del usuario -> merge a `main`

### Documentación
- Antes de cada deploy mantener documentación al día
- Antes de cada push realizar revisión del código y dejar documentos de ingeniería en /docs

### Dependencias
- Mantener dependencias lo más actualizadas posible

### Internacionalización
- Verificar siempre que todos los textos agregados respondan al language toggle (español/inglés)

### Seguridad
- Antes de cada deploy verificar si hay información sensible como API keys, correos, o cualquier PII
- Remediar cualquier riesgo de seguridad antes del deploy

### Vercel/Producción
- Los deploys a Vercel (producción) se hacen automáticamente desde push a `main`
- `main` = producción (tcgkb.app)
- `stage` = staging (staging.tcgkb.app)
