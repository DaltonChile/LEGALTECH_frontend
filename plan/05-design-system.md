# Phase 5: Design System Architecture
## Modular Component Library & Best Practices

---

## 🎨 Design System Structure

```
src/
├── lib/
│   ├── design-tokens.ts       # Centralized constants
│   ├── cn.ts                  # className utility (clsx + tailwind-merge)
│   └── variants.ts            # Component variant configs
├── components/
│   ├── ui/
│   │   ├── primitives/        # Atomic components
│   │   │   ├── Box.tsx
│   │   │   ├── Text.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Input.tsx
│   │   └── composed/          # Composite components
│   │       ├── DocumentCard.tsx
│   │       ├── StatusBadge.tsx
│   │       ├── FilterBar.tsx
│   │       └── DataTable.tsx
│   └── features/              # Feature-specific components
│       ├── contracts/
│       └── admin/
└── hooks/
    └── useComponentVariant.ts # Variant logic hook
```

---

## 🧱 Primitive Components

### 1. Box Component (Base Container)

```typescript
// src/components/ui/primitives/Box.tsx
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'document' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'section' | 'article';
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(
  ({ variant = 'default', padding = 'none', as: Component = 'div', className, children, ...props }, ref) => {
    const variants = {
      default: 'bg-white',
      document: 'bg-white border border-slate-200 rounded-card shadow-document',
      elevated: 'bg-white border border-slate-200 rounded-card shadow-document-hover',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <Component
        ref={ref}
        className={cn(variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Box.displayName = 'Box';
```

---

### 2. Text Component (Typography)

```typescript
// src/components/ui/primitives/Text.tsx
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface TextProps extends HTMLAttributes<HTMLElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'body-sm' | 'caption';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'muted';
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
}

export const Text = forwardRef<HTMLElement, TextProps>(
  ({ 
    variant = 'body', 
    weight = 'normal', 
    color = 'primary',
    as,
    className, 
    children, 
    ...props 
  }, ref) => {
    // Determine element type
    const elementMap = {
      h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4',
      body: 'p', 'body-sm': 'p', caption: 'span',
    };
    const Component = as || elementMap[variant] || 'p';

    // Typography variants
    const variantStyles = {
      h1: 'text-4xl font-serif font-bold text-navy-900 leading-tight',
      h2: 'text-3xl font-serif font-bold text-navy-900',
      h3: 'text-2xl font-serif font-semibold text-navy-900',
      h4: 'text-xl font-serif font-semibold text-navy-900',
      body: 'text-base font-sans leading-normal',
      'body-sm': 'text-sm font-sans',
      caption: 'text-xs font-sans uppercase tracking-wide',
    };

    const colorStyles = {
      primary: 'text-slate-900',
      secondary: 'text-slate-700',
      muted: 'text-slate-600',
    };

    const weightStyles = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };

    return (
      <Component
        ref={ref as any}
        className={cn(
          variantStyles[variant],
          !variantStyles[variant].includes('font-') && weightStyles[weight],
          !variantStyles[variant].includes('text-slate') && !variantStyles[variant].includes('text-navy') && colorStyles[color],
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Text.displayName = 'Text';
```

---

### 3. Button Component

```typescript
// src/components/ui/primitives/Button.tsx
import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    isLoading = false,
    className, 
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium font-sans rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-navy-900 text-white hover:bg-navy-800 active:bg-navy-950 focus:ring-navy-900 shadow-sm',
      secondary: 'bg-white text-navy-900 border border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:ring-navy-900',
      success: 'bg-legal-emerald-700 text-white hover:bg-legal-emerald-800 active:bg-legal-emerald-900 focus:ring-legal-emerald-700 shadow-sm',
      ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-500',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

---

### 4. Badge Component

```typescript
// src/components/ui/primitives/Badge.tsx
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'draft' | 'pending' | 'success' | 'error' | 'info' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'info', dot = true, className, children, ...props }, ref) => {
    const variants = {
      draft: 'bg-slate-100 text-slate-700 border-slate-300',
      pending: 'bg-amber-50 text-amber-700 border-amber-300',
      success: 'bg-legal-emerald-50 text-legal-emerald-700 border-legal-emerald-300',
      error: 'bg-red-50 text-red-700 border-red-300',
      info: 'bg-blue-50 text-blue-700 border-blue-300',
      warning: 'bg-orange-50 text-orange-700 border-orange-300',
    };

    const dotColors = {
      draft: 'bg-slate-600',
      pending: 'bg-amber-600',
      success: 'bg-legal-emerald-600',
      error: 'bg-red-600',
      info: 'bg-blue-600',
      warning: 'bg-orange-600',
    };

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-md text-sm font-medium font-sans',
          variants[variant],
          className
        )}
        {...props}
      >
        {dot && <span className={cn('w-2 h-2 rounded-full', dotColors[variant])} />}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
```

---

### 5. Card Component

```typescript
// src/components/ui/primitives/Card.tsx
import { type HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'document' | 'bordered';
  accent?: boolean;
  accentColor?: 'navy' | 'emerald';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    variant = 'default', 
    accent = false,
    accentColor = 'navy',
    hover = false,
    className, 
    children, 
    ...props 
  }, ref) => {
    const variants = {
      default: 'bg-white rounded-card',
      document: 'bg-white border border-slate-200 rounded-card shadow-document',
      bordered: 'bg-white border-2 border-slate-200 rounded-card',
    };

    const accentColors = {
      navy: 'border-t-4 border-navy-900',
      emerald: 'border-t-4 border-legal-emerald-700',
    };

    return (
      <div
        ref={ref}
        className={cn(
          variants[variant],
          accent && accentColors[accentColor],
          hover && 'hover:shadow-document-hover transition-shadow',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
```

---

### 6. Input Component

```typescript
// src/components/ui/primitives/Input.tsx
import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium font-sans text-slate-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 text-base font-sans text-slate-900 bg-white border rounded-md transition-shadow',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            error 
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-slate-300 focus:ring-navy-900',
            'disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm font-sans text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-sm font-sans text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

## 🔧 Utility Functions

### className Utility

```typescript
// src/lib/cn.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names and merges Tailwind classes intelligently
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Install dependencies:**
```bash
npm install clsx tailwind-merge
```

---

## 🎯 Composed Components

### DocumentCard (Business Logic Component)

```typescript
// src/components/ui/composed/DocumentCard.tsx
import { Card } from '@/components/ui/primitives/Card';
import { Text } from '@/components/ui/primitives/Text';
import { Badge } from '@/components/ui/primitives/Badge';
import { Button } from '@/components/ui/primitives/Button';
import { FileText } from 'lucide-react';

interface DocumentCardProps {
  title: string;
  description: string;
  status: 'draft' | 'pending' | 'success';
  statusLabel: string;
  createdAt: string;
  onView?: () => void;
  onEdit?: () => void;
}

export function DocumentCard({
  title,
  description,
  status,
  statusLabel,
  createdAt,
  onView,
  onEdit,
}: DocumentCardProps) {
  return (
    <Card variant="document" accent accentColor="navy" hover>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-slate-100 rounded-lg">
            <FileText className="w-6 h-6 text-navy-900" />
          </div>
          <div className="flex-1 space-y-2">
            <Text variant="h3">{title}</Text>
            <Text variant="body-sm" color="muted">
              {createdAt}
            </Text>
          </div>
          <Badge variant={status}>{statusLabel}</Badge>
        </div>

        {/* Description */}
        <Text variant="body" color="secondary">
          {description}
        </Text>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="primary" size="sm" onClick={onView}>
            Ver Detalles
          </Button>
          {onEdit && (
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Editar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

---

### StatusBadge (Domain-Specific Component)

```typescript
// src/components/ui/composed/StatusBadge.tsx
import { Badge } from '@/components/ui/primitives/Badge';

type ContractStatus = 
  | 'draft' 
  | 'pending_payment' 
  | 'paid' 
  | 'waiting_signatures' 
  | 'waiting_notary' 
  | 'completed' 
  | 'rejected';

interface StatusBadgeProps {
  status: ContractStatus;
}

const statusConfig: Record<ContractStatus, { label: string; variant: any }> = {
  draft: { label: 'Borrador', variant: 'draft' },
  pending_payment: { label: 'Pago Pendiente', variant: 'pending' },
  paid: { label: 'Pagado', variant: 'success' },
  waiting_signatures: { label: 'Esperando Firmas', variant: 'info' },
  waiting_notary: { label: 'Esperando Notario', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  rejected: { label: 'Rechazado', variant: 'error' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
```

---

## 📦 Usage Examples

### In ContractsPage

```typescript
// src/pages/admin/ContractsPage.tsx
import { Box } from '@/components/ui/primitives/Box';
import { Text } from '@/components/ui/primitives/Text';
import { Button } from '@/components/ui/primitives/Button';
import { StatusBadge } from '@/components/ui/composed/StatusBadge';

export function ContractsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Box padding="md">
        <Text variant="h2">Gestión de Contratos</Text>
        <Text variant="body" color="muted">
          Administra todos los contratos del sistema
        </Text>
      </Box>

      {/* Filter Bar */}
      <Box variant="document" padding="md">
        <div className="flex items-center gap-4">
          <Text variant="body-sm" weight="medium">Filtros:</Text>
          {/* Filters here */}
        </div>
      </Box>

      {/* Contracts Table */}
      <Box variant="document">
        {/* Table content */}
      </Box>
    </div>
  );
}
```

---

## ✅ Best Practices Checklist

### Component Design
- [ ] Each component has a single responsibility
- [ ] Props are typed with TypeScript interfaces
- [ ] forwardRef used for ref forwarding
- [ ] displayName set for debugging
- [ ] Variants defined as discriminated unions

### Styling
- [ ] Use `cn()` utility for class merging
- [ ] Tailwind classes only (no inline styles)
- [ ] Responsive variants with mobile-first approach
- [ ] Consistent spacing scale (4px base unit)

### Composition
- [ ] Complex UIs built from primitives
- [ ] Business logic separated from presentation
- [ ] Reusable patterns extracted into composed components
- [ ] Domain-specific components wrap primitives

### Accessibility
- [ ] Semantic HTML elements
- [ ] Proper ARIA attributes
- [ ] Keyboard navigation support
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA

### Performance
- [ ] Components memoized when needed (React.memo)
- [ ] Expensive computations cached (useMemo)
- [ ] Event handlers memoized (useCallback)
- [ ] Large lists virtualized

---

## 🔜 Next Steps

Proceed to `06-migration-checklist.md` for implementation strategy.
