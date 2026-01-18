import { initMercadoPago } from '@mercadopago/sdk-react';

const PUBLIC_KEY = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || '';
const isProduction = import.meta.env.VITE_NODE_ENV === 'production' || import.meta.env.PROD;

// Validar configuración
const validateConfig = () => {
  if (!PUBLIC_KEY) {
    console.error('❌ VITE_MERCADOPAGO_PUBLIC_KEY no configurada');
    return false;
  }

  const isTestKey = PUBLIC_KEY.startsWith('TEST-');
  const isProdKey = PUBLIC_KEY.startsWith('APP_USR-');

  if (isProduction && isTestKey) {
    console.error('❌ ERROR: Usando credenciales TEST en producción');
  }

  if (!isProduction && isProdKey) {
    console.warn('⚠️  Usando credenciales de PRODUCCIÓN en desarrollo');
  }

  console.log(`💳 Mercado Pago: ${isTestKey ? 'SANDBOX' : 'PRODUCCIÓN'}`);
  return true;
};

// Inicializar SDK
export const initMP = () => {
  if (PUBLIC_KEY) {
    initMercadoPago(PUBLIC_KEY, {
      locale: 'es-CL',
    });
    validateConfig();
  } else {
    console.warn('⚠️  Mercado Pago no inicializado - PUBLIC_KEY faltante');
  }
};

export const mercadoPagoConfig = {
  publicKey: PUBLIC_KEY,
  isProduction,
  isTestMode: PUBLIC_KEY?.startsWith('TEST-'),
  isConfigured: !!PUBLIC_KEY,
};

export default mercadoPagoConfig;
