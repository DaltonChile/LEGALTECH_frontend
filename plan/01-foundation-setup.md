# Phase 1: Foundation Setup
## Tailwind Configuration & Font Loading

---

## Step 1: Update Tailwind Config

Create or update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Serif for headings (authority)
        serif: ['Merriweather', 'Georgia', 'serif'],
        // Sans-serif for body (legibility)
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Professional Navy Blue palette
        navy: {
          50: '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
          950: '#0a1929',
        },
        // Sophisticated Emerald Green palette
        'legal-emerald': {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
      },
      boxShadow: {
        // Subtle, professional shadows
        'document': '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)',
        'document-hover': '0 4px 16px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        // More conservative radii
        'card': '0.5rem', // 8px
      },
    },
  },
  plugins: [],
}
```

---

## Step 2: Import Google Fonts

Add to `index.html` in the `<head>` section:

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## Step 3: Update Global CSS

In your main CSS file (e.g., `src/index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* Set default font */
  body {
    @apply font-sans text-slate-700;
  }

  /* Headings use serif */
  h1, h2, h3, h4, h5, h6 {
    @apply font-serif text-navy-900;
  }
}

@layer utilities {
  /* Document-style container */
  .container-document {
    @apply bg-white border border-slate-200 rounded-card shadow-document;
  }

  /* Professional button base */
  .btn-professional {
    @apply px-4 py-2.5 text-sm font-medium rounded-md transition-all duration-200;
  }
}
```

---

## Step 4: Verify Installation

Create a test component to verify fonts are loading:

```tsx
// TestFonts.tsx
export function TestFonts() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-4xl font-serif font-bold text-navy-900">
        Merriweather Heading
      </h1>
      <p className="text-base font-sans text-slate-700">
        Inter body text for maximum legibility
      </p>
      <button className="btn-professional bg-navy-900 text-white hover:bg-navy-800">
        Professional Button
      </button>
    </div>
  );
}
```

---

## Step 4: Create Design Tokens

Create a centralized constants file for design tokens:

```typescript
// src/lib/design-tokens.ts
export const colors = {
  navy: {
    900: '#102a43',
    800: '#243b53',
    700: '#334e68',
  },
  legalEmerald: {
    700: '#047857',
    600: '#059669',
  },
} as const;

export const typography = {
  fontFamily: {
    serif: 'Merriweather, Georgia, serif',
    sans: 'Inter, system-ui, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
} as const;

export const shadows = {
  document: '0 2px 8px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.06)',
  documentHover: '0 4px 16px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.08)',
} as const;
```

---

## ✅ Completion Checklist

- [ ] Tailwind config updated with new fonts and colors
- [ ] Google Fonts link added to `index.html`
- [ ] Global CSS updated with base styles
- [ ] Design tokens file created
- [ ] Test component renders correctly
- [ ] Browser DevTools shows fonts loading (Network tab)

---

## 🔜 Next Steps

Proceed to `02-color-system.md` to understand the detailed color usage guidelines.
