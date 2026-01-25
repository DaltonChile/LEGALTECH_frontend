# Phase 4: Component Patterns
## Redesigned Component Examples

---

## 🧩 Component Composition Strategy

### Design System Primitives

Build a library of atomic components that compose into complex UIs:

```tsx
// src/components/ui/primitives/
├── Box.tsx          // Base container with variants
├── Text.tsx         // Typography component
├── Button.tsx       // Button with variants
├── Badge.tsx        // Status indicators
├── Card.tsx         // Container component
└── Input.tsx        // Form inputs
```

### Composition Example

```tsx
// Complex component built from primitives
import { Card } from '@/components/ui/primitives/Card';
import { Text } from '@/components/ui/primitives/Text';
import { Badge } from '@/components/ui/primitives/Badge';

export function ContractCard({ contract }) {
  return (
    <Card variant="document">
      <Text variant="h3">{contract.title}</Text>
      <Badge variant={contract.status}>{contract.statusLabel}</Badge>
    </Card>
  );
}
```

---

## 🃏 Document Card (Contract Card)

### OLD STYLE (Avoid)
```tsx
<div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl shadow-lg shadow-blue-200">
  <div className="p-6 text-white">
    {/* ... */}
  </div>
</div>
```

### ✅ NEW PROFESSIONAL STYLE
```tsx
<div className="bg-white border border-slate-200 rounded-card shadow-document hover:shadow-document-hover transition-shadow">
  {/* Navy accent border on top */}
  <div className="border-t-4 border-navy-900"></div>
  
  <div className="p-6 space-y-4">
    {/* Title */}
    <div className="space-y-2">
      <h3 className="text-2xl font-serif font-semibold text-navy-900">
        Contrato de Arrendamiento Residencial
      </h3>
      <p className="text-sm font-sans text-slate-600">
        Creado el 25 de enero, 2026
      </p>
    </div>
    
    {/* Status badge */}
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-legal-emerald-50 text-legal-emerald-700 border border-legal-emerald-200 rounded-md text-sm font-medium">
      <div className="w-2 h-2 bg-legal-emerald-600 rounded-full"></div>
      Completado
    </div>
    
    {/* Content */}
    <p className="text-base font-sans text-slate-700 leading-normal">
      Contrato entre Juan Pérez y María González para arrendamiento de inmueble.
    </p>
  </div>
</div>
```

**Key Changes:**
- ❌ Removed gradient background
- ✅ White base with subtle border
- ✅ Navy top accent stripe (legal document aesthetic)
- ✅ Serif heading, sans body
- ✅ Professional shadow

---

## 🔘 Primary Button (CTA)

### OLD STYLE
```tsx
<button className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full px-8 py-4 text-white shadow-lg shadow-blue-200">
  Generar Contrato
</button>
```

### ✅ NEW PROFESSIONAL STYLE
```tsx
<button className="bg-navy-900 hover:bg-navy-800 active:bg-navy-950 text-white px-6 py-3 rounded-md text-sm font-medium font-sans transition-colors shadow-sm">
  Generar Contrato
</button>
```

**Key Changes:**
- ❌ No gradients
- ✅ Solid navy color
- ✅ Moderate radius (`rounded-md` not `rounded-full`)
- ✅ Simple shadow
- ✅ Clear hover state

---

## 🟢 Success/Action Button

```tsx
<button className="bg-legal-emerald-700 hover:bg-legal-emerald-800 active:bg-legal-emerald-900 text-white px-6 py-3 rounded-md text-sm font-medium font-sans transition-colors shadow-sm inline-flex items-center gap-2">
  <svg className="w-4 h-4" />
  Firmar Contrato
</button>
```

---

## 🔲 Secondary Button

```tsx
<button className="bg-white hover:bg-slate-50 active:bg-slate-100 text-navy-900 border border-slate-300 px-6 py-3 rounded-md text-sm font-medium font-sans transition-colors">
  Cancelar
</button>
```

---

## 🏷️ Status Badge

```tsx
// Success
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-legal-emerald-50 text-legal-emerald-700 border border-legal-emerald-200 rounded-md text-sm font-medium font-sans">
  <div className="w-2 h-2 bg-legal-emerald-600 rounded-full"></div>
  Completado
</span>

// Pending
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-sm font-medium font-sans">
  <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
  Pendiente
</span>

// Draft
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-sm font-medium font-sans">
  <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
  Borrador
</span>
```

---

## 📊 Table Design

### Table Header
```tsx
<thead className="bg-slate-50 border-b border-slate-200">
  <tr>
    <th className="px-6 py-3 text-left text-xs font-medium font-sans text-slate-700 uppercase tracking-wider">
      Contrato
    </th>
    <th className="px-6 py-3 text-left text-xs font-medium font-sans text-slate-700 uppercase tracking-wider">
      Estado
    </th>
  </tr>
</thead>
```

### Table Row
```tsx
<tr className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
  <td className="px-6 py-4 text-sm font-sans text-slate-900">
    Arrendamiento Residencial
  </td>
  <td className="px-6 py-4">
    {/* Badge here */}
  </td>
</tr>
```

---

## 📋 Form Input

```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium font-sans text-slate-700">
    Nombre del Contrato
  </label>
  <input
    type="text"
    className="w-full px-4 py-2.5 text-base font-sans text-slate-900 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 focus:border-transparent transition-shadow"
    placeholder="Ej: Arrendamiento Local Comercial"
  />
</div>
```

---

## 🗂️ Section Container

```tsx
<section className="space-y-6">
  {/* Header */}
  <div className="space-y-2">
    <h2 className="text-3xl font-serif font-bold text-navy-900">
      Mis Contratos
    </h2>
    <p className="text-base font-sans text-slate-600">
      Gestiona todos tus documentos legales
    </p>
  </div>
  
  {/* Content */}
  <div className="bg-white border border-slate-200 rounded-card shadow-document p-6">
    {/* ... */}
  </div>
</section>
```

---

## 🎯 Filter Bar (for ContractsPage)

```tsx
<div className="bg-white border border-slate-200 rounded-card p-4 shadow-sm">
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-600" />
      <span className="text-sm font-medium font-sans text-slate-700">
        Filtros:
      </span>
    </div>
    
    <select className="px-3 py-2 text-sm font-sans border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-navy-900 bg-white text-slate-900">
      <option>Todos los estados</option>
      <option>Borrador</option>
      <option>Completado</option>
    </select>
  </div>
</div>
```

---

## 📄 Pagination (for ContractsPage)

```tsx
<div className="bg-white border border-slate-200 rounded-card p-4 shadow-sm">
  <div className="flex items-center justify-between">
    <div className="text-sm font-sans text-slate-600">
      Mostrando 20 de 156 contratos
    </div>
    
    <div className="flex items-center gap-2">
      <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium font-sans text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 transition-colors">
        <ChevronLeft className="w-4 h-4" />
        Anterior
      </button>
      
      <button className="px-3 py-2 text-sm font-medium font-sans bg-navy-900 text-white rounded-md">
        1
      </button>
      <button className="px-3 py-2 text-sm font-medium font-sans text-slate-700 hover:bg-slate-100 rounded-md">
        2
      </button>
      
      <button className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium font-sans text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
        Siguiente
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </div>
</div>
```

---

## ✅ Pattern Checklist

- [ ] Cards use white bg with `border-slate-200` and `shadow-document`
- [ ] Top accent stripe on document-style cards
- [ ] Buttons use solid colors (no gradients)
- [ ] Status badges have dot indicator + border
- [ ] Tables have subtle hover states
- [ ] Forms use `focus:ring-navy-900`

---

## 🔜 Next Steps

Proceed to `05-migration-checklist.md` for step-by-step conversion guide.
