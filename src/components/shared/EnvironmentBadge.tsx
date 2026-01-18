import React from 'react';
import mercadoPagoConfig from '../../config/mercadopago';

/**
 * Badge que indica si estamos en modo TEST de Mercado Pago
 * Solo se muestra en desarrollo, no en producción
 */
const EnvironmentBadge: React.FC = () => {
  // No mostrar en producción
  if (mercadoPagoConfig.isProduction) {
    return null;
  }

  // No mostrar si MP no está configurado
  if (!mercadoPagoConfig.isConfigured) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-yellow-500 text-black px-4 py-2 rounded-full shadow-lg flex items-center space-x-2">
        <span className="text-lg">🧪</span>
        <span className="font-bold text-sm">
          {mercadoPagoConfig.isTestMode ? 'MODO TEST' : 'PRODUCCIÓN'}
        </span>
      </div>
    </div>
  );
};

export default EnvironmentBadge;
