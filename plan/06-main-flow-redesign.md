# Plan de Rediseño: Flujo Principal de Contratos

**Fecha:** Enero 2025  
**Estado:** Pendiente  
**Prioridad:** Alta

## 🎯 Objetivo

Actualizar todas las páginas y componentes del flujo principal de creación de contratos para que sigan el nuevo diseño profesional navy/emerald establecido en el sistema de diseño.

---

## 📊 Estado Actual

### ✅ Páginas Completadas (Estilo Nuevo)
- **HomePage** - Rediseñada con HowItWorks section
- **Hero** - Navy/emerald con messaging actualizado
- **ContractCatalog** - Formato tabla con filtros por categoría
- **HelpPage** - Completamente rediseñada
- **TrackingPage** - Completamente rediseñada
- **ContractSuccessPage** - Migrada al nuevo diseño
- **PaymentSuccessPage** - Migrada al nuevo diseño
- **ResumeContractPage** - Migrada al nuevo diseño
- **SettingsPage** - Migrada al nuevo diseño
- **AdminLayout** - Migrado al nuevo diseño

### ❌ Páginas/Componentes Pendientes (Estilo Antiguo)

#### Páginas Principales
1. **ContractEditorPage** (`src/pages/public/ContractEditorPage.tsx`)
   - Background: `bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30`
   - Necesita: `bg-slate-50` simple

2. **ContractCatalogPage** (`src/pages/public/ContractCatalogPage.tsx`)
   - Página standalone del catálogo (diferente del componente)
   - Tiene gradientes cyan/lime
   - Usa blue-600 para botones

3. **PaymentPage** (`src/pages/public/PaymentPage.tsx`)
   - Colores blue/cyan
   - Necesita revisión completa

4. **PaymentFailurePage** (`src/pages/public/PaymentFailurePage.tsx`)
   - Revisar colores de error

5. **PaymentPendingPage** (`src/pages/public/PaymentPendingPage.tsx`)
   - Revisar colores de estado pendiente

6. **LoginPage** (`src/pages/public/LoginPage.tsx`)
   - Revisar si está actualizado

#### Componentes del Editor de Contratos

**Alta Prioridad:**
1. **FormularioInicialStep** (`src/components/public/contract-editor/FormularioInicialStep.tsx`)
   - `rounded-2xl` → `rounded-lg`
   - Revisar colores de inputs y botones

2. **CompletarFormularioStep** (`src/components/public/contract-editor/CompletarFormularioStep.tsx`)
   - Revisar estilos de formulario

3. **ReviewStep** (`src/components/public/contract-editor/ReviewStep.tsx`)
   - Botones: `bg-blue-600` → `bg-navy-900`
   - `rounded-2xl` → `rounded-lg`

4. **PaymentStep** (`src/components/public/contract-editor/PaymentStep.tsx`)
   - Botones: `bg-blue-600` → `bg-navy-900`

5. **SignatureStep** (`src/components/public/contract-editor/SignatureStep.tsx`)
   - `rounded-2xl` → `rounded-lg`

6. **WaitingNotaryStep** (`src/components/public/contract-editor/WaitingNotaryStep.tsx`)
   - `rounded-2xl` → `rounded-lg`

**Media Prioridad:**
7. **ProgressStepper** (`src/components/public/contract-editor/ProgressStepper.tsx`)
   - `bg-blue-600` → `bg-navy-900` o `bg-legal-emerald-600`

8. **CapsuleSelector** (`src/components/public/contract-editor/CapsuleSelector.tsx`)
   - `bg-cyan-50`, `ring-cyan-500` → equivalentes navy/emerald
   - `rounded-2xl` → `rounded-lg`

9. **DocumentPreview** (`src/components/public/contract-editor/DocumentPreview.tsx`)
   - `rounded-2xl` → `rounded-lg`

10. **EditorHeader** - Si existe, revisar

---

## 🎨 Cambios de Diseño a Aplicar

### Colores
```
Reemplazar:                    Por:
─────────────────────────────────────────────────────
bg-blue-600                    → bg-navy-900
bg-blue-50                     → bg-slate-50 o bg-navy-50
bg-cyan-50                     → bg-legal-emerald-50
bg-cyan-500, ring-cyan-500     → bg-legal-emerald-500
text-blue-600                  → text-navy-900
hover:bg-blue-700              → hover:bg-navy-800
bg-lime-500                    → bg-legal-emerald-500
from-slate-50 via-cyan-50/30   → bg-slate-50 (simple)
```

### Border Radius
```
rounded-2xl → rounded-lg
```

### Typography
```
Headings:    font-serif (Merriweather)
Body text:   font-sans (Inter)
```

### Shadows
```
shadow-xl → shadow-document
hover:shadow-2xl → hover:shadow-document-hover
```

---

## 📋 Plan de Ejecución

### Fase 1: Páginas Principales (1-2 días)
1. **ContractEditorPage**
   - Actualizar background
   - Verificar que todos los steps usen los nuevos componentes

2. **ContractCatalogPage**
   - Actualizar a navy/emerald
   - O considerar eliminar si ContractCatalog componente es suficiente

3. **PaymentPage**
   - Actualizar colores
   - Usar UI primitives donde sea posible

4. **PaymentFailurePage & PaymentPendingPage**
   - Actualizar estados visuales

### Fase 2: Componentes del Editor (2-3 días)

**Día 1:**
- FormularioInicialStep
- CompletarFormularioStep

**Día 2:**
- ReviewStep
- PaymentStep
- ProgressStepper

**Día 3:**
- SignatureStep
- WaitingNotaryStep
- CapsuleSelector
- DocumentPreview

### Fase 3: Testing y Ajustes (1 día)
- Probar el flujo completo end-to-end
- Verificar responsive
- Ajustar detalles visuales
- Verificar accesibilidad

---

## ✅ Checklist por Componente

Para cada componente/página, verificar:

- [ ] Background colors actualizados
- [ ] Border radius (rounded-2xl → rounded-lg)
- [ ] Button colors (blue → navy/emerald)
- [ ] Typography (serif para headings, sans para body)
- [ ] Shadows (usar shadow-document)
- [ ] Estados hover actualizados
- [ ] Form inputs con estilos consistentes
- [ ] Icons usando Lucide React
- [ ] Responsive design intacto
- [ ] No quedan referencias a cyan/blue/lime

---

## 🎯 Criterios de Éxito

1. **Consistencia Visual**
   - Todo el flujo usa los mismos colores navy/emerald
   - Tipografía consistente en todo el flujo
   - Border radius uniforme

2. **Funcionalidad**
   - No se rompe ninguna funcionalidad existente
   - El flujo funciona end-to-end
   - Estados loading/error funcionan correctamente

3. **Experiencia de Usuario**
   - El flujo se siente cohesivo
   - Navegación clara entre pasos
   - Feedback visual apropiado

4. **Performance**
   - Build sin errores
   - No hay warnings de lint
   - Tiempo de carga aceptable

---

## 📝 Notas de Implementación

### Componentes Reutilizables a Usar
- `Box`, `Text`, `Button`, `Badge` de `src/components/ui/primitives/`
- `StatusBadge` de `src/components/ui/composed/`

### Patrones de Diseño
```tsx
// Cards principales
<div className="bg-white rounded-lg shadow-document border border-slate-200 p-6">

// Botones primarios
<button className="bg-navy-900 text-white px-4 py-2 rounded-md hover:bg-navy-800 font-sans font-medium">

// Botones secundarios
<button className="bg-slate-100 text-navy-900 px-4 py-2 rounded-md hover:bg-slate-200 font-sans font-medium">

// Success badges
<span className="bg-legal-emerald-50 text-legal-emerald-700 px-2.5 py-1 rounded-full text-xs font-medium">

// Headers
<h2 className="text-2xl font-serif font-bold text-navy-900">
<p className="text-slate-600 font-sans">
```

---

## 🔗 Referencias

- **Sistema de Diseño:** `plan/05-design-system.md`
- **Colores:** `plan/02-color-system.md`
- **Tipografía:** `plan/03-typography-scale.md`
- **Patrones:** `plan/04-component-patterns.md`
- **Migration Checklist:** `plan/05-migration-checklist.md`

---

## 🚀 Próximos Pasos

1. Revisar y aprobar este plan
2. Comenzar con Fase 1: ContractEditorPage
3. Probar cada componente después de migrar
4. Hacer commits incrementales para facilitar rollback si es necesario
5. Documentar cualquier decisión de diseño no estándar

---

**Última actualización:** 2025-01-25
