# Phase 3: Typography Scale
## Font Hierarchy & Usage Guidelines

---

## 📐 Type Scale

### Display (Extra Large Headings)
```tsx
// Hero headlines
<h1 className="text-5xl md:text-6xl font-serif font-bold text-navy-900 leading-tight">
  Genera Contratos Legales en Minutos
</h1>
```

**Specs:**
- Size: `3rem` (48px) mobile, `3.75rem` (60px) desktop
- Font: Merriweather Bold
- Line height: `1.1`
- Use: Hero sections only

---

### Heading 1
```tsx
<h1 className="text-4xl font-serif font-bold text-navy-900 leading-tight">
  Título Principal de Sección
</h1>
```

**Specs:**
- Size: `2.25rem` (36px)
- Font: Merriweather Bold
- Line height: `1.2`
- Use: Page titles

---

### Heading 2
```tsx
<h2 className="text-3xl font-serif font-bold text-navy-900">
  Subsección Importante
</h2>
```

**Specs:**
- Size: `1.875rem` (30px)
- Font: Merriweather Bold
- Line height: `1.25`
- Use: Major section headers

---

### Heading 3
```tsx
<h3 className="text-2xl font-serif font-semibold text-navy-900">
  Categoría o Grupo
</h3>
```

**Specs:**
- Size: `1.5rem` (24px)
- Font: Merriweather Semibold
- Line height: `1.3`
- Use: Card titles, subsections

---

### Heading 4
```tsx
<h4 className="text-xl font-serif font-semibold text-navy-900">
  Elemento Individual
</h4>
```

**Specs:**
- Size: `1.25rem` (20px)
- Font: Merriweather Semibold
- Line height: `1.4`
- Use: List headers, smaller cards

---

## 📝 Body Text

### Large Body
```tsx
<p className="text-lg font-sans text-slate-700 leading-relaxed">
  Texto de introducción o destacado que requiere mayor legibilidad.
</p>
```

**Specs:**
- Size: `1.125rem` (18px)
- Font: Inter Regular
- Line height: `1.75`
- Use: Intro paragraphs, important descriptions

---

### Standard Body
```tsx
<p className="text-base font-sans text-slate-700 leading-normal">
  Texto estándar para contenido general de la aplicación.
</p>
```

**Specs:**
- Size: `1rem` (16px)
- Font: Inter Regular
- Line height: `1.5`
- Use: Most text content

---

### Small Body
```tsx
<p className="text-sm font-sans text-slate-600">
  Texto secundario o información complementaria.
</p>
```

**Specs:**
- Size: `0.875rem` (14px)
- Font: Inter Regular
- Line height: `1.5`
- Use: Metadata, timestamps, helper text

---

### Extra Small (Caption)
```tsx
<span className="text-xs font-sans text-slate-500 uppercase tracking-wide">
  Etiqueta
</span>
```

**Specs:**
- Size: `0.75rem` (12px)
- Font: Inter Medium
- Letter spacing: `0.05em`
- Use: Labels, tags, badges

---

## 🔤 Font Weight Scale

### Merriweather (Serif - Headings)
```tsx
font-light    // 300 - Rarely used
font-normal   // 400 - H4, H5
font-semibold // 600 - H2, H3
font-bold     // 700 - H1, Display
font-black    // 900 - Special emphasis only
```

### Inter (Sans - Body)
```tsx
font-light    // 300 - Rarely used
font-normal   // 400 - Body text
font-medium   // 500 - Buttons, labels
font-semibold // 600 - Emphasized text
font-bold     // 700 - Rarely used in body
```

---

## 📋 Usage Examples

### Contract Card Title
```tsx
<div className="space-y-2">
  <h3 className="text-2xl font-serif font-semibold text-navy-900">
    Contrato de Arrendamiento Residencial
  </h3>
  <p className="text-sm font-sans text-slate-600">
    Creado el 25 de enero, 2026
  </p>
</div>
```

### Section with Description
```tsx
<div className="space-y-3">
  <h2 className="text-3xl font-serif font-bold text-navy-900">
    Contratos Recientes
  </h2>
  <p className="text-base font-sans text-slate-700 leading-normal">
    Gestiona y revisa todos los contratos generados en tu cuenta.
  </p>
</div>
```

### Table Header
```tsx
<th className="text-sm font-sans font-medium text-slate-700 uppercase tracking-wide">
  Estado
</th>
```

### Button Text
```tsx
<button className="text-sm font-sans font-medium">
  Ver Detalles
</button>
```

---

## ✅ Typography Checklist

- [ ] All headings use `font-serif` (Merriweather)
- [ ] All body text uses `font-sans` (Inter)
- [ ] No gradients on text
- [ ] Proper weight hierarchy (bold for H1, semibold for H2-H3)
- [ ] Consistent line heights for readability
- [ ] Navy-900 for headings, slate-700 for body

---

## 🔜 Next Steps

Proceed to `04-component-patterns.md` for specific component redesign examples.
