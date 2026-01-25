# Phase 2: Color System
## Professional Palette Usage Guidelines

---

## 🎨 Primary Colors

### Navy Blue (Primary Brand Color)
**Usage:** Main CTAs, primary headings, important UI elements

```tsx
// Examples
<button className="bg-navy-900 hover:bg-navy-800 text-white">
  Primary Action
</button>

<h1 className="text-navy-900">Main Heading</h1>

// Border accents
<div className="border-t-4 border-navy-900">
  Document header
</div>
```

**Scale:**
- `navy-900` - Primary buttons, headings
- `navy-800` - Hover states, active elements
- `navy-700` - Secondary text
- `navy-600` - Borders, dividers
- `navy-100` - Subtle backgrounds

---

### Emerald Green (Success/Action Color)
**Usage:** Success states, signature buttons, positive actions

```tsx
// Examples
<button className="bg-legal-emerald-700 hover:bg-legal-emerald-800 text-white">
  Firmar Contrato
</button>

<span className="text-legal-emerald-700 bg-legal-emerald-50 px-2 py-1 rounded">
  Completado
</span>
```

**Scale:**
- `legal-emerald-700` - Primary success buttons
- `legal-emerald-600` - Icons, secondary success elements
- `legal-emerald-50` - Success backgrounds

---

## 🌑 Neutral Colors (Slate)

### Text Hierarchy
```tsx
// Primary text
<p className="text-slate-900">Most important content</p>

// Body text
<p className="text-slate-700">Standard paragraph text</p>

// Secondary text
<p className="text-slate-600">Less important information</p>

// Muted text
<p className="text-slate-500">Timestamps, metadata</p>
```

### Backgrounds
```tsx
// Page background
<body className="bg-slate-50">

// Card/Container background
<div className="bg-white">

// Subtle hover states
<button className="hover:bg-slate-100">
```

### Borders
```tsx
// Standard borders
<div className="border border-slate-200">

// Emphasized borders
<div className="border-2 border-slate-300">

// Top accent
<div className="border-t-4 border-navy-900">
```

---

## 🚫 Colors to AVOID

### ❌ Remove These Classes

```tsx
// OLD FINTECH STYLE (DON'T USE)
bg-gradient-to-r from-blue-600 to-cyan-500
bg-gradient-to-r from-cyan-500 to-lime-500
text-cyan-500
text-lime-500
shadow-blue-200
shadow-cyan-200
bg-blue-600
```

### ✅ Replace With

```tsx
// NEW PROFESSIONAL STYLE (USE THESE)
bg-navy-900
bg-legal-emerald-700
text-navy-900
text-slate-700
shadow-document
bg-white border border-slate-200
```

---

## 📊 Status Colors

### Contract Status Color Mapping

```tsx
const statusColors = {
  draft: 'bg-slate-100 text-slate-700 border-slate-300',
  pending_payment: 'bg-amber-50 text-amber-700 border-amber-300',
  paid: 'bg-legal-emerald-50 text-legal-emerald-700 border-legal-emerald-300',
  waiting_signatures: 'bg-blue-50 text-blue-700 border-blue-300',
  waiting_notary: 'bg-purple-50 text-purple-700 border-purple-300',
  completed: 'bg-legal-emerald-50 text-legal-emerald-700 border-legal-emerald-300',
  rejected: 'bg-red-50 text-red-700 border-red-300',
};
```

---

## 🎯 Color Usage Examples

### Document Card
```tsx
<div className="bg-white border border-slate-200 rounded-card shadow-document">
  {/* Navy top accent */}
  <div className="border-t-4 border-navy-900 p-6">
    <h3 className="text-xl font-serif text-navy-900">Contrato de Arrendamiento</h3>
    <p className="text-sm text-slate-600 mt-1">Creado el 25 de enero, 2026</p>
  </div>
</div>
```

### Primary CTA Button
```tsx
<button className="bg-navy-900 hover:bg-navy-800 text-white px-6 py-3 rounded-md font-medium transition-colors">
  Generar Contrato
</button>
```

### Success/Action Button
```tsx
<button className="bg-legal-emerald-700 hover:bg-legal-emerald-800 text-white px-6 py-3 rounded-md font-medium transition-colors">
  Firmar Ahora
</button>
```

---

## ✅ Quick Reference

| Element | Color Class | Usage |
|---------|-------------|-------|
| Page background | `bg-slate-50` | Main body |
| Card background | `bg-white` | Containers |
| Primary button | `bg-navy-900` | Main actions |
| Success button | `bg-legal-emerald-700` | Positive actions |
| Heading text | `text-navy-900` | H1-H6 |
| Body text | `text-slate-700` | Paragraphs |
| Borders | `border-slate-200` | Dividers |
| Accent border | `border-navy-900` | Document tops |

---

## 🔜 Next Steps

Proceed to `03-typography-scale.md` for font sizing guidelines.
