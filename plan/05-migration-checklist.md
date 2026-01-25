# Phase 6: Migration Checklist
## Step-by-Step Conversion Guide

---

## 🎯 Migration Strategy

**Approach:** Build design system first, then migrate components to use primitives.

**Order of Priority:**
1. ✅ Foundation (Tailwind config, fonts, design tokens) - **DO THIS FIRST**
2. 🧱 Primitive components (Box, Text, Button, Badge, Card, Input)
3. 🔧 Utility functions (cn, variants)
4. 🎨 Composed components (DocumentCard, StatusBadge)
5. 📄 Page migration (ContractsPage → use new primitives)
6. 🔄 Global refactor (replace old patterns)
7. 🧪 Testing & validation
8. 📚 Documentation

---

## 📝 Pre-Migration Tasks

### ✅ Backup Current State
```bash
git checkout -b feature/professional-redesign
git add .
git commit -m "Backup before UI redesign"
```

### ✅ Install Dependencies (if needed)
```bash
# Already have Tailwind, just need to update config
npm install # ensure all deps are current
```

---

## 🔧 Step 1: Foundation Setup

### 1.1 Install Dependencies
```bash
npm install clsx tailwind-merge
npm install -D @types/node  # For TypeScript path resolution
```

### 1.2 Update Tailwind Config
- [ ] Create/update `tailwind.config.js` with new colors and fonts
- [ ] Add custom shadows (`shadow-document`, `shadow-document-hover`)
- [ ] Add custom border radius (`rounded-card`)

**File:** `tailwind.config.js`

### 1.3 Import Google Fonts
- [ ] Add Merriweather and Inter to `index.html`
- [ ] Verify fonts load in browser DevTools

**File:** `index.html`

### 1.4 Update Global CSS
- [ ] Set default body font to Inter
- [ ] Set headings to Merriweather
- [ ] Add utility classes for document containers and buttons

**File:** `src/index.css`

### 1.5 Create Design Tokens
- [ ] Create `src/lib/design-tokens.ts`
- [ ] Export color constants
- [ ] Export typography constants
- [ ] Export shadow constants

**File:** `src/lib/design-tokens.ts`

### 1.6 Create CN Utility
- [ ] Create `src/lib/cn.ts`
- [ ] Implement clsx + tailwind-merge function

**File:** `src/lib/cn.ts`

### 1.7 Test Foundation
- [ ] Create a test component with all new styles
- [ ] Verify fonts render correctly
- [ ] Check color palette in browser
- [ ] Test `cn()` utility merges classes correctly

---

## 🧱 Step 2: Build Primitive Components

### 2.1 Create Component Directory Structure
```bash
mkdir -p src/components/ui/primitives
mkdir -p src/components/ui/composed
mkdir -p src/lib
```

### 2.2 Build Primitives (in order)
- [ ] `Box.tsx` - Base container component
- [ ] `Text.tsx` - Typography component
- [ ] `Button.tsx` - Button with variants
- [ ] `Badge.tsx` - Status indicators
- [ ] `Card.tsx` - Card component with document variant
- [ ] `Input.tsx` - Form input component

**Files:** See `05-design-system.md` for complete implementations

### 2.3 Test Each Primitive
- [ ] Create Storybook stories (optional but recommended)
- [ ] Test all variants render correctly
- [ ] Test props and ref forwarding
- [ ] Verify TypeScript types work

---

## 🎨 Step 3: Build Composed Components

### 3.1 Domain-Specific Components
- [ ] `StatusBadge.tsx` - Contract status badges
- [ ] `DocumentCard.tsx` - Contract card layout
- [ ] `FilterBar.tsx` - Reusable filter bar
- [ ] `DataTable.tsx` - Table with professional styling

**Files:** `src/components/ui/composed/`

### 3.2 Test Composed Components
- [ ] Verify they compose primitives correctly
- [ ] Test with real data
- [ ] Check responsive behavior

---

## 📄 Step 4: Migrate Pages

### Priority 1: ContractsPage (Your Active File)

**File:** `/home/yoga/LEGALTECH_frontend/src/pages/admin/ContractsPage.tsx`

#### Migration Steps:
- [ ] Import primitive components (Box, Text, Button, Badge)
- [ ] Import composed components (StatusBadge, FilterBar)
- [ ] Replace inline divs with `<Box>` components
- [ ] Replace text elements with `<Text>` components
- [ ] Replace buttons with `<Button>` components
- [ ] Replace status badges with `<StatusBadge>` components
- [ ] Remove inline className strings where possible

#### Example Refactor:
```tsx
// ❌ OLD (Inline Classes)
<div className="bg-white rounded-lg border border-slate-200 p-4">
  <div className="flex items-center gap-4">
    <span className="text-sm font-medium text-slate-700">Filtros:</span>
    <button className="bg-blue-600 text-white px-3 py-2 rounded-lg">
      Aplicar
    </button>
  </div>
</div>

// ✅ NEW (Composed Components)
<Box variant="document" padding="md">
  <div className="flex items-center gap-4">
    <Text variant="body-sm" weight="medium">Filtros:</Text>
    <Button variant="primary" size="sm">
      Aplicar
    </Button>
  </div>
</Box>
```

---

### Priority 2: ContractsTable Component

**File:** `src/components/admin/contracts/ContractsTable.tsx`

#### Migration Steps:
- [ ] Import `Text`, `Badge`, `StatusBadge` components
- [ ] Replace table headers with `<Text variant="caption">`
- [ ] Replace cell content with `<Text variant="body-sm">`
- [ ] Replace status badges with `<StatusBadge status={contract.status} />`
- [ ] Wrap table in `<Box variant="document">`

---

### Priority 3: Shared Button Component

**File:** `src/components/shared/Button.tsx`

#### Decision Point:
**Option A:** Replace entirely with primitive `Button` component
**Option B:** Refactor to use primitive as base

```tsx
// Option A: Delete old Button.tsx, use primitive everywhere
import { Button } from '@/components/ui/primitives/Button';

// Option B: Adapt existing Button to use primitive internally
import { Button as PrimitiveButton } from '@/components/ui/primitives/Button';

export function Button(props) {
  return <PrimitiveButton {...props} />;
}
```

**Recommended:** Option A (clean break, full type safety)

---

### Priority 4: Landing Page Components

**Files:**
- `src/components/landing/Hero.tsx`
- `src/components/landing/Navbar.tsx`

#### Migration Steps:
- [ ] Replace headings with `<Text variant="h1">` (serif)
- [ ] Replace body text with `<Text variant="body">` (sans)
- [ ] Remove all gradient classes (`from-blue-600 to-cyan-500`)
- [ ] Replace CTAs with `<Button variant="primary">`
- [ ] Update contract cards to use `<Card variant="document" accent>`

---

### Priority 5: Form Components

**Create composed form components:**

```tsx
// src/components/ui/composed/FormField.tsx
import { Input } from '@/components/ui/primitives/Input';
import { Text } from '@/components/ui/primitives/Text';

export function FormField({ label, error, ...props }) {
  return (
    <div className="space-y-2">
      <Text variant="body-sm" weight="medium">{label}</Text>
      <Input error={error} {...props} />
    </div>
  );
}
```

- [ ] Create `FormField` composed component
- [ ] Replace all form inputs with `<Input>` primitive
- [ ] Use `FormField` for labeled inputs

---

## 🧪 Testing Checklist

### Visual QA
- [ ] All headings render in Merriweather
- [ ] All body text renders in Inter
- [ ] No cyan/lime gradient artifacts remain
- [ ] Navy blue appears consistently
- [ ] Emerald green used only for success/signatures
- [ ] Cards have subtle shadows
- [ ] Complete File Checklist

### Phase 1: Foundation
- [ ] `tailwind.config.js` - Theme configuration
- [ ] `index.html` - Google Fonts import
- [ ] `src/index.css` - Global styles
- [ ] `src/lib/design-tokens.ts` - Constants
- [ ] `src/lib/cn.ts` - Utility function

### Phase 2: Primitives
- [ ] `src/components/ui/primitives/Box.tsx`
- [ ] `src/components/ui/primitives/Text.tsx`
- [ ] `src/components/ui/primitives/Button.tsx`
- [ ] `src/components/ui/primitives/Badge.tsx`
- [ ] `src/components/ui/primitives/Card.tsx`
- [ ] `src/components/ui/primitives/Input.tsx`

### Phase 3: Composed Components
- [ ] `src/components/ui/composed/StatusBadge.tsx`
- [ ] `src/components/ui/composed/DocumentCard.tsx`
- [ ] `src/components/ui/composed/FilterBar.tsx`
- [ ] `src/components/ui/composed/FormField.tsx`

### Phase 4: Page Migration
- [ ] `src/pages/admin/ContractsPage.tsx` ⭐
- [ ] `src/components/admin/contracts/ContractsTable.tsx`
- [ ] `src/components/landing/Hero.tsx`
- [ ] `src/components/landing/Navbar.tsx`
- [ ] Other admin pages
- [ ] Public contract pages

### Phase 5: Cleanup
- [ ] Remove old `src/components/shared/Button.tsx` (if using primitive)
- [ ] Remove unused utility classes
- [ ] Update imports across codebasejs`
- [ ] `index.html`
- [ ] `src/index.css`

### Pages
- [ ] `/src/pages/admin/ContractsPage.tsx` ⭐ (active file)
- [ ] Landing page / Hero section
- [ ] Dashboard
- [ ] Contract creation form
- [ ] User profile

### Components
- [ ] `/src/components/admin/contracts/ContractsTable.tsx`
- [ ] Button components
- [ ] Card components
- [ ] Badge/Status components
- [ ] Form input components
- [ ] Navigation/Header

---

## 🚀 Deployment Checklist

### Pre-Deploy
- [ ] Run build: `npm run build`
- Phase | Component | Status | Priority |
|-------|-----------|--------|----------|
| **Foundation** | Tailwind Config | ⏳ Pending | P0 |
| | Google Fonts | ⏳ Pending | P0 |
| | Design Tokens | ⏳ Pending | P0 |
| | CN Utility | ⏳ Pending | P0 |
| **Primitives** | Box | ⏳ Pending | P1 |
| | Text | ⏳ Pending | P1 |
| | Button | ⏳ Pending | P1 |
| | Badge | ⏳ Pending | P1 |
| | Card | ⏳ Pending | P1 |
| | Input | ⏳ Pending | P1 |
| **Composed** | StatusBadge | ⏳ Pending | P2 |
| | DocumentCard | ⏳ Pending | P2 |
| | FilterBar | ⏳ Pending | P2 |
| **Pages** | ContractsPage | ⏳ Pending | P3 |
| | ContractsTable | ⏳ Pending | P3 |
| | Hero Section | ⏳ Pending | P3ce metrics

---

## 📊 Progress Tracking

| Component | Status | Notes |
|-----------|--------|-------|
| Tailwind Config | ⏳ Pending | |
| Google Fonts | ⏳ Pending | |
| ContractsPage | ⏳ Pending | Active file |
| ContractsTable | ⏳ Pending | |
| Buttons | ⏳ Pending | Global |
| Hero Sections | ⏳ Pending | |
| Forms | ⏳ Pending | |

---

## 🎉 Success Criteria

### Visual
- ✅ Design feels "professional legal" not "fintech startup"
- ✅ Typography has authority (serif headings)
- ✅ Color palette is mature and sophisticated
- ✅ Components look like legal documents metaphorically

### Technical
- ✅ Fonts load properly
- ✅ No broken styles
- ✅ Responsive design maintained
- ✅ Performance not degraded

### User Experience
- ✅ Still feels modern and tech-enabled
- ✅ Clarity improved
- ✅ Trust signals increased
- ✅ No usability regressions

---

## 📞 Support Resources

- **Tailwind Docs:** https://tailwindcss.com/docs
- **Google Fonts:** https://fonts.google.com
- **Merriweather:** https://fonts.google.com/specimen/Merriweather
- **Inter:** https://fonts.google.com/specimen/Inter

---

**Ready to start? Begin with Step 1: Foundation Setup!**
