# 07 — Plan: Tabla "Historial" (Join Request + Payment) + Dashboard Actualizado

## Contexto

Actualmente el admin tiene:
- **ContractsPage** (`/admin/contracts`): Muestra una tabla de `ContractRequest` con columnas: código, contrato, cliente, estado, monto, fecha, firmas. **No incluye datos de pago.**
- **AdminDashboard** (`/admin`): Tiene un resumen financiero (bruto, neto, IVA, costos, utilidad) y una tabla "Contratos Recientes" que muestra solo datos del contrato sin pagos. El dashboard usa endpoints como `/stats`, `/weekly-activity`, etc.

**Problema**: Los datos de `Payment` (método de pago, estado del pago, facturación/boleta, DTE, fees del procesador, montos netos/IVA) no se muestran en ninguna tabla. La tabla de "contratos" es confusa porque realmente es un **historial de solicitudes con su ciclo de vida**, no solo contratos firmados.

**Solución**: 
1. Renombrar "Contratos" → **"Historial"** en sidebar y página.
2. Crear un nuevo endpoint backend que devuelva un **join de ContractRequest + Payment** en una sola respuesta.
3. La tabla Historial muestra toda la información unificada.
4. El Dashboard también se actualiza para usar esta vista unificada en su tabla de "recientes".

---

## Modelo de Datos Actual

### ContractRequest (tabla `contract_requests`)
| Campo clave | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `tracking_code` | STRING | Código de seguimiento (6 chars) |
| `buyer_rut` | STRING | RUT del comprador |
| `buyer_email` | STRING | Email del comprador |
| `total_amount` | INTEGER | Monto total cobrado |
| `status` | ENUM | `pending_payment`, `draft`, `waiting_signatures`, `waiting_notary`, `completed`, `failed` |
| `signature_type` | ENUM | `none`, `simple`, `fea` |
| `signature_price` | INTEGER | Costo firma |
| `is_custom_document` | BOOLEAN | Documento personalizado |
| `created_at` / `updated_at` | TIMESTAMP | |

**Relaciones**: `templateVersion` → `template`, `signers[]`, `payments[]`, `selectedCapsules[]`

### Payment (tabla `payments`)
| Campo clave | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK |
| `request_id` | UUID | FK → `contract_requests.id` |
| `provider` | STRING | `mercadopago` |
| `external_transaction_id` | STRING | ID en MercadoPago |
| `amount` | INTEGER | Monto pagado |
| `status` | STRING | `pending`, `approved`, `rejected`, etc. |
| `processor_fee` | INTEGER | Comisión del procesador |
| `net_amount` | INTEGER | Monto neto |
| `iva_amount` | INTEGER | IVA |
| `billing_type` | ENUM | `boleta`, `factura` |
| `billing_rut` | STRING | RUT facturación |
| `billing_razon_social` | STRING | Razón social |
| `dte_type` | INTEGER | 39=Boleta, 33=Factura |
| `dte_folio` | BIGINT | Folio DTE |
| `dte_status` | ENUM | `pending`, `issued`, `failed`, `cancelled` |
| `dte_pdf_url` | TEXT | URL del PDF DTE |
| `created_at` | TIMESTAMP | |

---

## Plan de Implementación

### Fase 1: Backend — Nuevo endpoint "Historial" (join)

**Archivo**: `src/api/controllers/admin/contracts.controller.js`

#### 1.1 Nuevo endpoint `GET /api/v1/admin/history`

Devuelve `ContractRequest` con su `Payment` incluido (join), paginado y filtrable.

```js
// En contracts.controller.js (o nuevo history.controller.js)
async getHistory(req, res) {
  const { status, payment_status, billing_type, page = 1, limit = 20, search } = req.query;
  
  const where = {};
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { tracking_code: { [Op.iLike]: `%${search}%` } },
      { buyer_email: { [Op.iLike]: `%${search}%` } },
      { buyer_rut: { [Op.iLike]: `%${search}%` } }
    ];
  }

  const paymentWhere = {};
  if (payment_status) paymentWhere.status = payment_status;
  if (billing_type) paymentWhere.billing_type = billing_type;

  const { rows, count } = await ContractRequest.findAndCountAll({
    where,
    include: [
      {
        model: TemplateVersion,
        as: 'templateVersion',
        include: [{ model: ContractTemplate, as: 'template', attributes: ['title', 'slug', 'category'] }]
      },
      {
        model: ContractSigner,
        as: 'signers',
        attributes: ['id', 'full_name', 'role', 'has_signed']
      },
      {
        model: Payment,
        as: 'payments',
        where: Object.keys(paymentWhere).length > 0 ? paymentWhere : undefined,
        required: Object.keys(paymentWhere).length > 0,  // INNER join solo si filtra por pago
        attributes: [
          'id', 'provider', 'external_transaction_id', 'amount', 'status',
          'processor_fee', 'net_amount', 'iva_amount',
          'billing_type', 'billing_rut', 'billing_razon_social',
          'dte_type', 'dte_folio', 'dte_status', 'dte_pdf_url',
          'created_at'
        ]
      }
    ],
    order: [['created_at', 'DESC']],
    limit,
    offset: (page - 1) * limit,
    distinct: true  // Necesario cuando hay hasMany includes con paginación
  });

  res.json({
    success: true,
    data: rows,
    pagination: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / limit) }
  });
}
```

#### 1.2 Nueva ruta

**Archivo**: `src/api/routes/admin/contracts.routes.js` (o nuevo `history.routes.js`)

```js
router.get('/history', contractsController.getHistory);
```

#### 1.3 Actualizar `getRecentContracts` del dashboard

Incluir `payments` en el include del endpoint `/admin/dashboard/recent-contracts` para que el dashboard también tenga datos de pago.

---

### Fase 2: Frontend — Tipos TypeScript

**Archivo nuevo**: `src/types/history.ts`

```ts
export interface PaymentInfo {
  id: string;
  provider: string;
  external_transaction_id: string | null;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  processor_fee: number | null;
  net_amount: number | null;
  iva_amount: number | null;
  billing_type: 'boleta' | 'factura' | null;
  billing_rut: string | null;
  billing_razon_social: string | null;
  dte_type: number | null;
  dte_folio: number | null;
  dte_status: 'pending' | 'issued' | 'failed' | 'cancelled' | null;
  dte_pdf_url: string | null;
  created_at: string;
}

export interface HistoryRecord {
  // Request data
  id: string;
  tracking_code: string;
  status: 'pending_payment' | 'draft' | 'waiting_signatures' | 'waiting_notary' | 'completed' | 'failed';
  buyer_rut: string;
  buyer_email: string;
  total_amount: number;
  signature_type: 'none' | 'simple' | 'fea';
  signature_price: number;
  is_custom_document: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  templateVersion?: {
    template?: {
      title: string;
      slug: string;
      category?: string;
    };
  };
  signers?: Array<{
    id: string;
    full_name: string;
    role: string;
    has_signed: boolean;
  }>;
  payments?: PaymentInfo[];
}
```

---

### Fase 3: Frontend — API Service + Hook

#### 3.1 api.ts — Nuevo servicio

```ts
// En services/api.ts
export const getAdminHistory = (params?: {
  status?: string;
  payment_status?: string;
  billing_type?: string;
  search?: string;
  page?: number;
  limit?: number;
}) => api.get('/admin/history', { params });
```

#### 3.2 Nuevo hook `useAdminHistory.ts`

**Archivo**: `src/hooks/admin/useAdminHistory.ts`

```ts
export function useAdminHistory(filters: {
  status?: string;
  paymentStatus?: string;
  billingType?: string;
  search?: string;
  page: number;
  limit: number;
}) {
  // Llama a getAdminHistory con los filtros
  // Retorna { records: HistoryRecord[], isLoading, error, pagination, refetch }
}
```

---

### Fase 4: Frontend — Componente `HistoryTable`

**Archivo**: `src/components/admin/history/HistoryTable.tsx`

Reemplaza a `ContractsTable.tsx`. Tabla con las siguientes columnas:

| # | Columna | Fuente | Responsive |
|---|---------|--------|-----------|
| 1 | **Código** | `tracking_code` | Siempre visible |
| 2 | **Contrato/Template** | `templateVersion.template.title` | `hidden lg:table-cell` |
| 3 | **Cliente** | `buyer_email` + `buyer_rut` | Siempre visible |
| 4 | **Estado Solicitud** | `status` (StatusBadge) | Siempre visible |
| 5 | **Monto Total** | `total_amount` | `hidden md:table-cell` |
| 6 | **Estado Pago** | `payments[0].status` (nuevo PaymentStatusBadge) | `hidden md:table-cell` |
| 7 | **Tipo Doc** | `payments[0].billing_type` → "Boleta"/"Factura" | `hidden lg:table-cell` |
| 8 | **DTE** | `payments[0].dte_status` + `dte_folio` | `hidden xl:table-cell` |
| 9 | **Neto / IVA** | `payments[0].net_amount` / `iva_amount` | `hidden xl:table-cell` |
| 10 | **Fee Procesador** | `payments[0].processor_fee` | `hidden xl:table-cell` |
| 11 | **Firmas** | `signers` count | `hidden md:table-cell` |
| 12 | **Fecha** | `created_at` | `hidden xl:table-cell` |
| 13 | **Acciones** | View button | Siempre visible |

#### Notas de diseño:
- Misma estética que la tabla actual (usa `Box variant="document"`, `Text`, `StatusBadge`, etc.)
- Fila expandible o modal para ver detalle completo (request + payment + signers)
- Badge de color para estado de pago: `approved` → verde, `pending` → amarillo, `rejected` → rojo
- Badge para DTE: `issued` → verde, `pending` → gris, `failed` → rojo
- Indicador de "Sin pago" cuando `payments` está vacío (ej: solicitudes en `pending_payment`)

---

### Fase 5: Frontend — Página `HistoryPage`

**Archivo**: `src/pages/admin/HistoryPage.tsx` (reemplaza/renombra `ContractsPage.tsx`)

Similar a la ContractsPage actual pero con filtros adicionales:

```
Filtros:
  [Estado solicitud ▼]  [Estado pago ▼]  [Tipo doc ▼]  [🔍 Buscar por código/email/RUT]
```

- Filtro de estado solicitud: Los existentes (`draft`, `pending_payment`, etc.)
- Filtro de estado pago: `pending`, `approved`, `rejected`
- Filtro de tipo documento: `boleta`, `factura`, `todos`
- Búsqueda: por `tracking_code`, `buyer_email`, o `buyer_rut`

---

### Fase 6: Frontend — Actualizar Sidebar + Rutas

#### 6.1 Sidebar — Renombrar "Contratos" → "Historial"

**Archivo**: `src/components/admin/dashboard/Sidebar.tsx`

```diff
- { icon: FileCheck, label: 'Contratos', path: '/admin/contracts' },
+ { icon: FileCheck, label: 'Historial', path: '/admin/history' },
```

#### 6.2 Rutas — Actualizar path

**Archivo**: `src/routes/index.tsx`

```diff
- <Route path="/admin/contracts" element={<ContractsPage />} />
+ <Route path="/admin/history" element={<HistoryPage />} />
+ <Route path="/admin/contracts" element={<Navigate to="/admin/history" replace />} />  // Redirect legacy
```

---

### Fase 7: Dashboard — Tabla recientes con datos de pago

**Archivo**: `src/pages/admin/AdminDashboard.tsx`

#### 7.1 Actualizar tabla "Contratos Recientes" → "Historial Reciente"

La tabla en el dashboard actualmente muestra: Código, Contrato, Fecha, Estado, Monto, Acción.

**Nuevo diseño de la tabla "Historial Reciente"**:

| Columna | Fuente |
|---------|--------|
| Código | `tracking_code` |
| Contrato | `templateVersion.template.title` |
| Cliente | `buyer_email` |
| Estado | `status` (StatusBadge) |
| Monto | `total_amount` |
| Pago | `payments[0].status` (PaymentStatusBadge) |
| Tipo Doc | `payments[0].billing_type` |
| Fecha | `created_at` |
| Acción | Eye button |

#### 7.2 Actualizar endpoint `getDashboardRecentContracts`

En el backend, modificar `/admin/dashboard/recent-contracts` para incluir `payments` en el include.

#### 7.3 Actualizar modal de detalle

El `ContractDetailModal` del dashboard se actualiza para mostrar también la info de pago:
- Estado del pago
- Método de pago (MercadoPago)
- ID transacción externa
- Tipo de documento (boleta/factura)
- Folio DTE + estado DTE
- Desglose: neto, IVA, fee procesador

#### 7.4 Link "Ver todos" apunta a `/admin/history`

```diff
- <Link to="/admin/contracts">
+ <Link to="/admin/history">
```

---

### Fase 8: Componentes compartidos nuevos

#### 8.1 `PaymentStatusBadge`

**Archivo**: `src/components/ui/composed/PaymentStatusBadge.tsx`

```tsx
// Colores:
// approved → green
// pending → amber  
// rejected → red
// cancelled → slate
// null/undefined → gris con "Sin pago"
```

#### 8.2 `DTEStatusBadge`

**Archivo**: `src/components/ui/composed/DTEStatusBadge.tsx`

```tsx
// issued → green con folio
// pending → amber
// failed → red
// null → gris "N/A"
```

---

## Resumen de Archivos

### Backend (cambios)
| Archivo | Cambio |
|---------|--------|
| `controllers/admin/contracts.controller.js` | Agregar `getHistory` |
| `routes/admin/contracts.routes.js` | Agregar ruta `GET /history` |
| `controllers/admin/dashboard.controller.js` | Incluir `payments` en `getRecentContracts` |

### Frontend (nuevos)
| Archivo | Descripción |
|---------|-------------|
| `types/history.ts` | Tipos `HistoryRecord`, `PaymentInfo` |
| `hooks/admin/useAdminHistory.ts` | Hook para obtener historial |
| `components/admin/history/HistoryTable.tsx` | Tabla principal |
| `pages/admin/HistoryPage.tsx` | Página completa con filtros |
| `components/ui/composed/PaymentStatusBadge.tsx` | Badge estado pago |
| `components/ui/composed/DTEStatusBadge.tsx` | Badge estado DTE |

### Frontend (modificaciones)
| Archivo | Cambio |
|---------|--------|
| `services/api.ts` | Agregar `getAdminHistory()` |
| `components/admin/dashboard/Sidebar.tsx` | Renombrar "Contratos" → "Historial" |
| `routes/index.tsx` | Cambiar ruta `/admin/contracts` → `/admin/history` |
| `pages/admin/AdminDashboard.tsx` | Actualizar tabla recientes + modal detalle |

### Frontend (deprecar)
| Archivo | Acción |
|---------|--------|
| `components/admin/contracts/ContractsTable.tsx` | Reemplazado por `HistoryTable.tsx` |
| `pages/admin/ContractsPage.tsx` | Reemplazado por `HistoryPage.tsx` |
| `hooks/admin/useAdminContracts.ts` | Reemplazado por `useAdminHistory.ts` |

---

## Orden de Ejecución

1. **Backend**: Crear endpoint `/admin/history` con join (Fase 1)
2. **Backend**: Actualizar `getRecentContracts` del dashboard (Fase 1.3)
3. **Frontend**: Crear tipos (Fase 2)
4. **Frontend**: Crear servicio API + hook (Fase 3)
5. **Frontend**: Crear badges compartidos (Fase 8)
6. **Frontend**: Crear `HistoryTable` y `HistoryPage` (Fases 4-5)
7. **Frontend**: Actualizar sidebar + rutas (Fase 6)
8. **Frontend**: Actualizar dashboard tabla recientes + modal (Fase 7)
9. **Cleanup**: Eliminar archivos obsoletos

---

## Diagrama de Datos

```
ContractRequest (1) ──── (N) Payment
     │                        │
     ├── tracking_code        ├── status (approved/pending/rejected)
     ├── buyer_email          ├── amount
     ├── buyer_rut            ├── billing_type (boleta/factura)
     ├── total_amount         ├── net_amount / iva_amount
     ├── status               ├── processor_fee
     ├── signature_type       ├── dte_folio / dte_status
     │                        └── external_transaction_id
     ├── templateVersion
     │      └── template
     │           ├── title
     │           └── category
     └── signers[]
            ├── full_name
            ├── role
            └── has_signed
```

La tabla Historial es esencialmente esta vista unificada, donde cada fila es un `ContractRequest` y las columnas de pago vienen de `payments[0]` (típicamente hay un solo pago aprobado por solicitud).
