# 🎨 Theme Customization Guide

Este archivo explica cómo personalizar los colores de los temas Light y Dark.

## 📁 Archivo de Configuración

Los colores de ambos temas están definidos en:
```
frontend/src/config/theme.js
```

## 🎯 Estructura de Colores

Cada tema (light/dark) tiene las siguientes secciones:

### 1. **Backgrounds (bg)**
- `primary`: Fondo principal de la aplicación
- `secondary`: Fondos de tarjetas y secciones
- `tertiary`: Fondos para estados hover
- `inverse`: Color de texto sobre fondos oscuros/claros

### 2. **Text (text)**
- `primary`: Texto principal
- `secondary`: Texto secundario (menos prominente)
- `tertiary`: Texto terciario (hints, placeholders)
- `inverse`: Texto sobre fondos inversos
- `link`: Color de enlaces
- `linkHover`: Color de enlaces al hacer hover

### 3. **Borders (border)**
- `light`: Bordes suaves
- `medium`: Bordes medianos
- `dark`: Bordes prominentes
- `focus`: Borde en estado de foco

### 4. **Components**
- `card`: Configuración de tarjetas (bg, border, shadow)
- `header`: Configuración del header
- `button`: Variantes de botones (primary, secondary, ghost)

## 🛠️ Cómo Modificar

### Ejemplo: Cambiar el fondo principal del modo oscuro

En `theme.js`, busca:
```javascript
dark: {
  bg: {
    primary: '#111827',  // <- Modifica este valor
    // ...
  }
}
```

Cambia `#111827` por el color que desees, por ejemplo `#0a0a0a` para un negro más oscuro.

### Ejemplo: Cambiar el color de los enlaces en modo claro

```javascript
light: {
  text: {
    link: '#2563eb',      // <- Color normal
    linkHover: '#1d4ed8'  // <- Color hover
  }
}
```

## 🎨 Paletas de Colores Recomendadas

### Dark Mode Suave (menos contraste)
```javascript
dark: {
  bg: {
    primary: '#1a1a1a',
    secondary: '#2d2d2d',
    tertiary: '#3d3d3d'
  }
}
```

### Dark Mode Alto Contraste
```javascript
dark: {
  bg: {
    primary: '#000000',
    secondary: '#0a0a0a',
    tertiary: '#1a1a1a'
  }
}
```

### Light Mode Cálido
```javascript
light: {
  bg: {
    primary: '#fef8f0',
    secondary: '#faf5ed',
    tertiary: '#f5f0e8'
  }
}
```

## 💡 Tips

1. **Contraste**: Asegúrate de que haya suficiente contraste entre texto y fondo para legibilidad
2. **Consistencia**: Mantén la misma "temperatura" de colores (cálidos o fríos)
3. **Pruebas**: Prueba ambos temas después de hacer cambios
4. **Accesibilidad**: Usa herramientas como WebAIM Contrast Checker para verificar accesibilidad

## 🔄 Aplicar Cambios

Después de modificar `theme.js`:
1. Los cambios se aplicarán automáticamente en desarrollo (hot reload)
2. En producción, necesitarás rebuild: `npm run build`

## 📝 Notas

- Los colores usan formato hexadecimal (`#rrggbb`)
- También puedes usar rgb: `rgb(17, 24, 39)` o rgba para transparencias
- Las sombras (shadow) usan la sintaxis de CSS box-shadow

## 🎯 Aplicación en Componentes

Los componentes usan estas clases de Tailwind que mapean a los colores del tema:

- `bg-white dark:bg-gray-900` → bg.primary
- `text-gray-900 dark:text-gray-100` → text.primary
- `border-gray-200 dark:border-gray-700` → border.light

Para aplicar los colores del archivo `theme.js` directamente, puedes:
1. Actualizar el `tailwind.config.js` con estos colores
2. Usar el helper `getThemeColor()` en componentes JavaScript
