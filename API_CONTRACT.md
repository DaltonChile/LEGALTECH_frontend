# API Contract - Dalton LegalTech Platform

Este es un API Contract diseñado para ser implementado con Koa (Backend) y consumido por React (Frontend). Está estructurado para soportar el flujo **"Sin Registro"** del usuario y el flujo **"Seguro"** de notarios/admins.

## Convenciones Generales

- **Base URL:** `/api/v1`
- **Auth (Admin/Notary):** Header `Authorization: Bearer <jwt_token>`
- **Auth (Usuario Guest):** Header `X-Tracking-Code: <tracking_code>` + `X-Client-Rut: <rut>` (Para reanudar sesiones)
- **Formato:** JSON

---

## 1. Módulo Público (Catálogo)

**Objetivo:** Que el usuario elija qué comprar sin fricción.

### `GET /templates`

**Lógica:** Devuelve la lista de productos activos (`contract_templates`) para la "Vitrina".

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Constitución de SpA",
      "slug": "constitucion-spa",
      "base_price": 15000,
      "description": "..."
    }
  ]
}
```

### `GET /templates/:slug`

**Lógica:** Obtiene el detalle para la vista de "Personalización".

- El backend busca el template por slug
- Hace un JOIN con la tabla `template_versions` para obtener la última versión publicada
- Hace un JOIN con `version_capsules` para listar los extras disponibles

**Response:**

```json
{
  "data": {
    "id": "uuid_template",
    "version_id": "uuid_version_actual",
    "title": "Constitución SpA",
    "base_price": 15000,
    "base_form_schema": [],
    "capsules": [
      {
        "id": "uuid_capsule",
        "title": "Cláusula de Arbitraje",
        "price": 5000,
        "form_schema": []
      }
    ]
  }
}
```

> **IMPORTANTE:** `version_id` se usará para crear el request

---

## 2. Módulo Transaccional (Checkout & Wizard)

**Objetivo:** Crear el pedido, guardar datos parciales y pagar.

### `POST /contracts` (Crear Borrador)

**Lógica:** El usuario empieza a llenar el formulario.

- Crea una fila en `contract_requests`
- Genera el `tracking_code` (ej: "X9J2")
- Detecta firmantes iniciales basados en el `form_data` y pobla `contract_signers`

**Body:**

```json
{
  "template_version_id": "uuid_version",
  "client_rut": "11111111-1",
  "client_email": "cliente@gmail.com",
  "form_data": { "nombre_empresa": "MiPyme SpA" },
  "selected_capsules": ["uuid_capsule_1"]
}
```

**Response:**

```json
{
  "data": {
    "id": "uuid_request",
    "tracking_code": "X9J2",
    "total_amount": 20000,
    "status": "draft"
  }
}
```

> **⚠️ FRONTEND DEBE GUARDAR EL `tracking_code` EN LOCALSTORAGE**

### `PATCH /contracts/:id` (Auto-Save)

**Headers:** `X-Tracking-Code: ...` (Seguridad: solo quien tiene el código edita)

**Lógica:**

- Actualiza `form_data` y cápsulas
- Recalcula el precio total en el servidor (nunca confiar en el precio del frontend)
- Si el usuario cambió datos que afectan a los firmantes (ej: agregó un socio), regenera la tabla `contract_signers`

**Body:** (Parcial)

```json
{
  "form_data": {},
  "selected_capsules": []
}
```

**Response:**

```json
{
  "data": {
    "id": "...",
    "total_amount": 25000,
    "signers": []
  }
}
```

### `POST /contracts/:id/payment` (Iniciar Pago)

**Lógica:**

- Verifica que el estado sea `draft`
- Congela el precio final en la DB
- Llama a la API de MercadoPago/Stripe
- Retorna la preferencia de pago para redirigir al usuario

**Response:**

```json
{
  "payment_url": "https://mercadopago.com/checkout/..."
}
```

---

## 3. Módulo de Seguimiento (Tracking)

**Objetivo:** Que el usuario vuelva días después a ver su contrato.

### `GET /contracts/track`

**Query Params:** `?rut=1111-1&code=X9J2`

**Lógica:** Busca en `contract_requests`. Si coincide RUT y Código, devuelve el estado.

**Response:**

```json
{
  "status": "waiting_notary",
  "download_url": "/api/contracts/uuid/download",
  "signers_status": [
    { "name": "Juan", "role": "partner", "has_signed": true },
    { "name": "Notario Público", "role": "notary", "has_signed": false }
  ]
}
```

> **Nota:** `download_url` solo está disponible si el estado es `signed`

---

## 4. Módulo Backoffice (Notario y Admin)

**Objetivo:** Gestión interna. Requiere JWT.

### `GET /admin/inbox` (Bandeja Notario)

**Lógica:**

- Si es rol `notario`: Devuelve contracts donde `status = 'waiting_notary'`
- Si es rol `admin`: Puede ver todos y filtrar

**Response:**

```json
{
  "data": [
    {
      "id": "...",
      "client_name": "Juan Perez",
      "template": "Constitución SpA",
      "created_at": "2023-10-10",
      "status": "waiting_notary"
    }
  ]
}
```

### `POST /admin/contracts/:id/sign` (Acción de Firma)

**Lógica:**

1. Valida que el usuario sea Notario
2. Llama a la API de firma electrónica (ej: Acepta) con el certificado del notario
3. Actualiza `contract_signers` (row del notario → `has_signed = true`)
4. Verifica si todos han firmado. Si es así → `contract_requests.status = 'signed'`
5. Gatilla envío de correo al cliente (Mailer Service)
6. Registra en `audit_logs`

---

## 5. Análisis de Validación: ¿Está bien este diseño?

### ✅ Puntos Fuertes

1. **Seguridad Stateless (Sin Registro):** El uso de `tracking_code` + `rut` en los headers de las rutas de usuario permite mantener la sesión sin obligar a crear usuario/password, cumpliendo la regla de negocio "sin fricción".

2. **Cálculo de Precio en Backend:** El PATCH recalcula el precio. Esto evita que un usuario malicioso modifique el JSON en el navegador para pagar $1 peso por todas las cápsulas.

3. **Separación de Lectura/Escritura en Templates:** El endpoint público lee la "versión actual", mientras que el admin (no detallado arriba pero implícito) crea "nuevas versiones". Esto protege la integridad referencial.

### ⚠️ Riesgo Detectado (Y solución)

**Riesgo:** ¿Qué pasa si el usuario paga, pero MercadoPago tarda en avisar (Webhook)? El usuario podría quedarse mirando la pantalla de "Esperando confirmación".

**Mejora:** Implementar **Websockets** o **Polling** en el frontend en la pantalla de "Gracias".

- **Endpoint sugerido:** `GET /contracts/:id/poll-status`
- El frontend lo llama cada 3 segundos tras volver del pago hasta que el status cambie de `pending_payment` a `paid` o `waiting_notary`

### ✅ Veredicto

El contrato es sólido y cubre todos los actores y flujos críticos definidos en la base de datos.
