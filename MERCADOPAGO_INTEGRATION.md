# Integración de Mercado Pago con Bricks - Frontend

## Flujo de Usuario

```
1. Usuario llena formulario inicial (cápsulas + tipo firma)
   ↓
2. Click en "Pagar" → Backend crea preferencia
   ↓
3. Frontend inicializa Wallet Brick con preference_id
   ↓
4. Usuario completa pago en modal de Mercado Pago
   ↓
5. Mercado Pago redirige a /payment/success
   ↓
6. Frontend hace polling al backend hasta que status = "draft"
   ↓
7. Usuario recibe email con tracking_code + rut
   ↓
8. Redirige a /contracts/resume?id=xxx&tracking_code=xxx&rut=xxx
   ↓
9. Usuario completa formulario restante (70%)
```

**IMPORTANTE**: 
- No hay autenticación tradicional - se usa `tracking_code` + `buyer_rut`
- El estado del contrato indica el progreso:
  - `pending_payment` = esperando pago
  - `draft` = puede completar formulario
  - `waiting_signatures` = esperando firmas

---

## 1. Instalación

### 1.1 Instalar SDK de React
```bash
cd LEGALTECH_frontend
npm install @mercadopago/sdk-react
```

### 1.2 Variables de Entorno por Ambiente

**Archivo `.env.development`** (desarrollo local):
```env
# Mercado Pago - CREDENCIALES DE TEST
VITE_NODE_ENV=development
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx-xxxx-xxxx-xxxx-xxxxx
VITE_API_URL=http://localhost:3000/api/v1
```

**Archivo `.env.production`** (producción):
```env
# Mercado Pago - CREDENCIALES PRODUCTIVAS
VITE_NODE_ENV=production
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx-xxxx-xxxx-xxxx-xxxxx
VITE_API_URL=https://api.tudominio.com/api/v1
```

**⚠️ IMPORTANTE**:
- `TEST-xxx` = Modo sandbox, tarjetas de prueba
- `APP_USR-xxx` = Pagos reales
- Vite carga automáticamente `.env.development` o `.env.production` según el modo

---

## 2. Inicializar SDK con Detección de Entorno

**Archivo NUEVO**: `src/config/mercadopago.ts`

```typescript
import { initMercadoPago } from '@mercadopago/sdk-react';

const PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY;
const isProduction = import.meta.env.VITE_NODE_ENV === 'production';

// Validar configuración
if (!PUBLIC_KEY) {
  console.error('❌ VITE_MERCADOPAGO_PUBLIC_KEY no configurada');
}

const isTestKey = PUBLIC_KEY?.startsWith('TEST-');
const isProdKey = PUBLIC_KEY?.startsWith('APP_USR-');

if (isProduction && isTestKey) {
  console.error('❌ ERROR: Usando credenciales TEST en producción');
}

if (!isProduction && isProdKey) {
  console.warn('⚠️  Usando credenciales de PRODUCCIÓN en desarrollo');
}

// Log del entorno
console.log(`💳 Mercado Pago: ${isTestKey ? 'SANDBOX' : 'PRODUCCIÓN'}`);

// Inicializar SDK
export const initMP = () => {
  initMercadoPago(PUBLIC_KEY, {
    locale: 'es-CL',
  });
};

export const mercadoPagoConfig = {
  publicKey: PUBLIC_KEY,
  isProduction,
  isTestMode: isTestKey,
};
```

**Archivo**: `src/main.tsx`

```typescript
import { initMP } from './config/mercadopago';

// Inicializar Mercado Pago
initMP();
```

---

## 3. Servicio de Pagos

**Archivo NUEVO**: `src/services/payment.service.ts`

```typescript
import api from './api'; // Tu instancia de axios configurada

interface CreatePreferenceRequest {
  contract_id: string;
  tracking_code: string;
  rut: string;
}

interface CreatePreferenceResponse {
  success: boolean;
  data: {
    payment_id: string;
    preference_id: string;
    public_key: string;
    amount: number;
  };
}

interface PaymentStatusResponse {
  success: boolean;
  data: {
    contract_status: 'pending_payment' | 'draft' | 'waiting_signatures' | 'completed';
    payment_status: 'pending' | 'approved' | 'rejected';
    payment_id: string;
    amount: number;
  };
}

class PaymentService {
  /**
   * Crear preferencia de pago
   */
  async createPreference(data: CreatePreferenceRequest): Promise<CreatePreferenceResponse> {
    const response = await api.post('/payments/create', data);
    return response.data;
  }

  /**
   * Consultar estado de pago (para polling)
   */
  async getPaymentStatus(contractId: string, trackingCode: string, rut: string): Promise<PaymentStatusResponse> {
    const response = await api.get(`/payments/status/${contractId}`, {
      params: { tracking_code: trackingCode, rut }
    });
    return response.data;
  }
}

export default new PaymentService();
```

---

## 4. Componente de Pago

### 4.1 PaymentPage Component

**Archivo NUEVO**: `src/pages/PaymentPage.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Wallet } from '@mercadopago/sdk-react';
import paymentService from '../services/payment.service';
import LoadingSpinner from '../components/LoadingSpinner';

interface ContractData {
  id: string;
  tracking_code: string;
  buyer_rut: string;
  total_amount: number;
  status: string;
}

const PaymentPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const [preferenceId, setPreferenceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contractData, setContractData] = useState<ContractData | null>(null);

  useEffect(() => {
    createPreference();
  }, []);

  const createPreference = async () => {
    try {
      setLoading(true);
      
      // Crear preferencia en el backend
      const response = await paymentService.createPreference({
        contract_id: contractId!,
        tracking_code: trackingCode,
        rut: rut
      });

      setPreferenceId(response.data.preference_id);
      setContractData({
        id: contractId!,
        tracking_code: trackingCode,
        buyer_rut: rut,
        total_amount: response.data.amount,
        status: 'pending_payment'
      });
      
      setLoading(false);
    } catch (err: any) {
      console.error('Error creando preferencia:', err);
      setError(err.response?.data?.error || 'Error al iniciar el pago');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Redirigir a página de éxito
    navigate(`/payment/success?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${rut}`);
  };

  const handlePaymentError = (error: any) => {
    console.error('Error en el pago:', error);
    navigate(`/payment/failure?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${rut}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">Error</p>
          <p>{error}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h1 className="text-2xl font-bold mb-4">Completar Pago</h1>
        
        {/* Resumen del pedido */}
        <div className="bg-gray-50 p-4 rounded mb-6">
          <h2 className="font-semibold mb-2">Resumen</h2>
          <div className="flex justify-between">
            <span>Código de seguimiento:</span>
            <span className="font-mono font-bold">{trackingCode}</span>
          </div>
          <div className="flex justify-between mt-2">
            <span>Total a pagar:</span>
            <span className="font-bold text-lg">
              ${contractData?.total_amount.toLocaleString('es-CL')} CLP
            </span>
          </div>
        </div>

        {/* Wallet Brick */}
        {preferenceId && (
          <div className="wallet-brick-container">
            <Wallet
              initialization={{ preferenceId }}
              customization={{
                texts: {
                  valueProp: 'security_safety',
                },
              }}
              onSubmit={() => {
                // El Brick maneja el pago automáticamente
                console.log('Procesando pago...');
              }}
              onReady={() => {
                console.log('Wallet Brick listo');
              }}
              onError={(error) => {
                console.error('Error en Wallet Brick:', error);
                handlePaymentError(error);
              }}
            />
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <p>🔒 Pago seguro procesado por Mercado Pago</p>
          <p className="mt-2">
            Después del pago, recibirás un email para continuar con tu contrato.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
```

### 4.2 PaymentSuccessPage Component

**Archivo NUEVO**: `src/pages/PaymentSuccessPage.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import paymentService from '../services/payment.service';

const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const [status, setStatus] = useState<'checking' | 'confirmed' | 'pending'>('checking');
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 20; // 20 intentos = 1 minuto

  useEffect(() => {
    checkPaymentStatus();
  }, []);

  useEffect(() => {
    if (status === 'checking' && attempts < maxAttempts) {
      const timer = setTimeout(() => {
        checkPaymentStatus();
      }, 3000); // Polling cada 3 segundos

      return () => clearTimeout(timer);
    }
  }, [attempts, status]);

  const checkPaymentStatus = async () => {
    try {
      const response = await paymentService.getPaymentStatus(contractId, trackingCode, rut);
      
      console.log('Status:', response.data);

      if (response.data.payment_status === 'approved' && response.data.contract_status === 'draft') {
        setStatus('confirmed');
      } else if (response.data.payment_status === 'rejected') {
        navigate(`/payment/failure?contract_id=${contractId}&tracking_code=${trackingCode}&rut=${rut}`);
      } else {
        setAttempts(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error verificando estado:', error);
      setAttempts(prev => prev + 1);
    }
  };

  const handleContinue = () => {
    navigate(`/contracts/resume?id=${contractId}&tracking_code=${trackingCode}&rut=${rut}`);
  };

  if (status === 'checking') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Verificando tu pago...</h1>
          <p className="text-gray-600">
            Estamos confirmando tu pago con Mercado Pago. Esto puede tomar unos segundos.
          </p>
          <p className="text-sm text-gray-500 mt-4">
            Intento {attempts} de {maxAttempts}
          </p>
        </div>
      </div>
    );
  }

  if (status === 'confirmed') {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            ¡Pago Confirmado!
          </h1>
          <p className="text-lg text-gray-700 mb-6">
            Tu pago ha sido procesado exitosamente.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6">
            <p className="font-semibold mb-2">Tu código de seguimiento:</p>
            <p className="text-2xl font-mono font-bold text-blue-600">{trackingCode}</p>
            <p className="text-sm text-gray-600 mt-2">
              También te enviamos este código por email para que puedas continuar después.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-lg"
          >
            Completar mi Contrato
          </button>

          <p className="text-sm text-gray-500 mt-6">
            Puedes continuar ahora o más tarde usando tu código de seguimiento.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default PaymentSuccessPage;
```

### 4.3 PaymentFailurePage Component

**Archivo NUEVO**: `src/pages/PaymentFailurePage.tsx`

```typescript
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const PaymentFailurePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('contract_id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const handleRetry = () => {
    navigate(`/payment/${contractId}?tracking_code=${trackingCode}&rut=${rut}`);
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-red-500 text-6xl mb-4">✕</div>
        <h1 className="text-3xl font-bold text-red-600 mb-4">
          Pago Rechazado
        </h1>
        <p className="text-lg text-gray-700 mb-6">
          No pudimos procesar tu pago. Por favor intenta nuevamente.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <p className="text-sm text-gray-700">
            <strong>Posibles causas:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 text-left list-disc list-inside">
            <li>Fondos insuficientes</li>
            <li>Datos incorrectos de la tarjeta</li>
            <li>Límite de compra excedido</li>
            <li>Problema con el banco emisor</li>
          </ul>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg"
          >
            Reintentar Pago
          </button>
          
          <button
            onClick={handleGoHome}
            className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg"
          >
            Volver al Inicio
          </button>
        </div>

        <div className="mt-6 text-sm text-gray-500">
          <p>¿Necesitas ayuda? Contáctanos a soporte@dalton.cl</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailurePage;
```

---

## 5. Página de Reanudar Contrato

**Archivo**: `src/pages/ResumeContractPage.tsx` (o actualizar si ya existe)

```typescript
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import contractService from '../services/contract.service';

const ResumeContractPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const contractId = searchParams.get('id') || '';
  const trackingCode = searchParams.get('tracking_code') || '';
  const rut = searchParams.get('rut') || '';

  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadContract();
  }, []);

  const loadContract = async () => {
    try {
      // Endpoint que ya deberías tener implementado
      const response = await contractService.getContract(contractId, trackingCode, rut);
      setContract(response.data);
      setLoading(false);

      // Redirigir según el estado
      if (response.data.status === 'pending_payment') {
        // Todavía no ha pagado
        navigate(`/payment/${contractId}?tracking_code=${trackingCode}&rut=${rut}`);
      } else if (response.data.status === 'waiting_signatures') {
        // Ya completó todo, va a firmar
        navigate(`/contracts/${contractId}/review`);
      }
      // Si status = 'draft', se queda aquí para completar el formulario
    } catch (err: any) {
      console.error('Error cargando contrato:', err);
      setError(err.response?.data?.error || 'Error al cargar el contrato');
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Completar Formulario</h1>
      <p className="mb-4">
        Bienvenido de vuelta. Completa los datos restantes de tu contrato.
      </p>
      
      {/* Aquí va tu formulario actual de edición de contrato */}
      {/* Usa el contract.form_data para prellenar los campos del 30% */}
      
      <div className="bg-blue-50 p-4 rounded mb-4">
        <p className="text-sm">
          <strong>Código:</strong> {trackingCode} | <strong>Estado:</strong> {contract?.status}
        </p>
      </div>

      {/* Tu formulario existente */}
    </div>
  );
};

export default ResumeContractPage;
```

---

## 6. Rutas

**Archivo**: `src/routes/index.tsx` (o donde tengas tus rutas)

```typescript
import PaymentPage from '../pages/PaymentPage';
import PaymentSuccessPage from '../pages/PaymentSuccessPage';
import PaymentFailurePage from '../pages/PaymentFailurePage';
import ResumeContractPage from '../pages/ResumeContractPage';

// Agregar estas rutas
{
  path: '/payment/:contractId',
  element: <PaymentPage />
},
{
  path: '/payment/success',
  element: <PaymentSuccessPage />
},
{
  path: '/payment/failure',
  element: <PaymentFailurePage />
},
{
  path: '/contracts/resume',
  element: <ResumeContractPage />
}
```

---

## 7. Estilos

**Archivo**: Agregar en tu CSS global o en el componente

```css
.wallet-brick-container {
  min-height: 400px;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
  margin-top: 1rem;
}

/* Personalización del Wallet Brick */
.wallet-brick-container iframe {
  border-radius: 8px;
}
```

---

## 8. Flujo Completo de Navegación

```
1. FormularioInicialPage (30% de datos)
   ↓ Click "Pagar"
   ↓ POST /api/v1/contracts/initial → Obtiene contract_id + tracking_code
   ↓
2. PaymentPage (/payment/:contractId?tracking_code=xxx&rut=xxx)
   ↓ Usuario paga
   ↓ Mercado Pago redirige
   ↓
3. PaymentSuccessPage (/payment/success?...)
   ↓ Polling hasta que backend confirme (status = draft)
   ↓ Click "Completar Contrato"
   ↓
4. ResumeContractPage (/contracts/resume?id=xxx&tracking_code=xxx&rut=xxx)
   ↓ Completa el 70% restante
   ↓ PUT /api/v1/contracts/:id/complete
   ↓
5. ReviewPage (tu página actual de revisión)
   ↓ POST /api/v1/contracts/:id/approve-review
   ↓
6. SignaturePage (tu flujo actual de ValidaFirma)
```

---

## 9. LocalStorage (Opcional)

Para mejorar la UX, guardar datos temporales:

```typescript
// Guardar después de crear el contrato
localStorage.setItem('current_contract', JSON.stringify({
  contract_id: contractId,
  tracking_code: trackingCode,
  rut: rut,
  timestamp: Date.now()
}));

// Recuperar si el usuario cierra la pestaña
const savedContract = localStorage.getItem('current_contract');
if (savedContract) {
  const data = JSON.parse(savedContract);
  // Verificar que no sea muy antiguo (ej: 24 horas)
  if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
    // Redirigir a donde corresponda
  }
}
```

---

## 10. Manejo de Entornos: Producción vs Desarrollo

### 10.1 Diferencias Clave

| Aspecto | Desarrollo | Producción |
|---------|------------|------------|
| Public Key | `TEST-xxxxx` | `APP_USR-xxxxx` |
| API URL | `localhost:3000` | `api.tudominio.com` |
| Tarjetas | Solo prueba | Reales |
| Dinero | No se cobra | Cobro real |

### 10.2 Comandos de Build

```bash
# Desarrollo (usa .env.development)
npm run dev

# Build para producción (usa .env.production)
npm run build

# Preview de producción local
npm run preview
```

### 10.3 Indicador Visual de Entorno (Opcional)

Agregar un badge visible en desarrollo:

**Archivo**: `src/components/EnvironmentBadge.tsx`

```typescript
import { mercadoPagoConfig } from '../config/mercadopago';

const EnvironmentBadge: React.FC = () => {
  if (mercadoPagoConfig.isProduction) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold z-50">
      🧪 MODO TEST - No se cobra dinero real
    </div>
  );
};

export default EnvironmentBadge;
```

**Agregar en `App.tsx`**:
```typescript
import EnvironmentBadge from './components/EnvironmentBadge';

// Dentro del return:
<EnvironmentBadge />
```

### 10.4 Validación en PaymentPage

```typescript
// En PaymentPage.tsx
import { mercadoPagoConfig } from '../config/mercadopago';

// Mostrar advertencia en modo test
{mercadoPagoConfig.isTestMode && (
  <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4">
    <strong>🧪 Modo de Prueba:</strong> Usa las tarjetas de test, no se cobrará dinero real.
  </div>
)}
```

---

## 11. Testing

### 11.1 Datos de Prueba

```typescript
// Para pruebas locales
const TEST_DATA = {
  tracking_code: 'ABC123',
  rut: '11111111-1',
  contract_id: 'uuid-test'
};
```

### 10.2 Tarjetas de Prueba

```
VISA Aprobada:
Número: 4509 9535 6623 3704
CVV: 123
Vencimiento: 11/25
Nombre: APRO

Mastercard Rechazada:
Número: 5031 7557 3453 0604
CVV: 123
Vencimiento: 11/25
Nombre: OTHE
```

---

## 11. Checklist de Implementación

### Fase 1: Setup (30 min)
- [ ] Instalar `@mercadopago/sdk-react`
- [ ] Configurar variables de entorno
- [ ] Inicializar SDK en `main.tsx`

### Fase 2: Servicio (30 min)
- [ ] Crear `payment.service.ts`
- [ ] Implementar `createPreference()`
- [ ] Implementar `getPaymentStatus()`

### Fase 3: Componentes (2 horas)
- [ ] Crear `PaymentPage.tsx`
- [ ] Crear `PaymentSuccessPage.tsx`
- [ ] Crear `PaymentFailurePage.tsx`
- [ ] Actualizar `ResumeContractPage.tsx`

### Fase 4: Rutas (15 min)
- [ ] Agregar rutas de pago
- [ ] Configurar navegación

### Fase 5: Testing (1 hora)
- [ ] Probar flujo completo con tarjeta de prueba
- [ ] Verificar polling funciona
- [ ] Probar redirecciones
- [ ] Verificar datos persisten

### Fase 6: UX (1 hora)
- [ ] Agregar estilos
- [ ] Loading states
- [ ] Error handling
- [ ] Mensajes informativos

**Total estimado: 5-6 horas**

---

## 12. Mejoras Futuras

- [ ] Guardar progreso en localStorage
- [ ] Mostrar historial de pagos
- [ ] Permitir múltiples métodos de pago
- [ ] Agregar analytics de conversión
- [ ] Implementar retry automático en fallas de red
- [ ] Agregar toast notifications

---

## Documentación de Referencia

- [Mercado Pago SDK React](https://github.com/mercadopago/sdk-react)
- [Wallet Brick](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/wallet-brick/introduction)
- [Customización](https://www.mercadopago.com.ar/developers/es/docs/checkout-bricks/wallet-brick/advanced-features/preferences)
