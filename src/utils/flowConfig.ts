/**
 * Configuración del flujo de contrato basada en tipo de firma y notario
 * 
 * Casos posibles:
 * 1. Sin firma + Sin notario → 4 pasos, termina en completado
 * 2. Sin firma + Con notario → 4 pasos, termina esperando notario
 * 3. FES + Sin notario → 5 pasos, termina esperando firmas
 * 4. FES + Con notario → 5 pasos, termina esperando firmas y notario
 * 5. FEA + Sin notario → 5 pasos, termina esperando firmas
 * 6. FEA + Con notario → 5 pasos, termina esperando firmas y notario
 */

export type SignatureType = 'none' | 'simple' | 'fea';

export interface FlowConfig {
  /** Identificador del caso (1-6) */
  caseNumber: number;
  /** Si el flujo incluye el paso de firmas */
  hasSignatureStep: boolean;
  /** Si requiere notario */
  requiresNotary: boolean;
  /** Tipo de firma */
  signatureType: SignatureType;
  /** Pasos del progress bar */
  steps: { id: string; label: string }[];
  /** Descripción del estado final */
  finalStateDescription: string;
  /** Título del estado final */
  finalStateTitle: string;
}

/** Tipo para los pasos del progress bar */
export interface FlowStep {
  id: string;
  label: string;
}

/** Pasos base sin firmas (4 pasos) - Casos 1 y 2 */
export const STEPS_WITHOUT_SIGNATURES: FlowStep[] = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
];

/** Pasos base con firmas (5 pasos) - Casos 3, 4, 5 y 6 */
export const STEPS_WITH_SIGNATURES: FlowStep[] = [
  { id: 'formulario-inicial', label: 'Datos iniciales' },
  { id: 'payment', label: 'Pago' },
  { id: 'completar', label: 'Completar formulario' },
  { id: 'review', label: 'Revisar' },
  { id: 'signatures', label: 'Firmar' },
];

/**
 * Obtiene los pasos del flujo basándose en si hay firmantes
 * Esta es la función más simple para obtener los pasos cuando solo se conoce hasSigners
 */
export function getStepsForFlow(hasSigners: boolean): FlowStep[] {
  return hasSigners ? STEPS_WITH_SIGNATURES : STEPS_WITHOUT_SIGNATURES;
}

/**
 * Información del badge para mostrar en tarjetas de contrato
 */
export interface FlowBadgeInfo {
  label: string;
  colorClass: string;
  /** Nombre del icono de lucide-react a usar */
  iconName: 'none' | 'scale' | 'users' | 'user-check';
}

/**
 * Obtiene la información del badge para mostrar el tipo de flujo en las tarjetas
 */
export function getFlowBadgeInfo(hasSigners: boolean, requiresNotary: boolean): FlowBadgeInfo {
  if (!hasSigners && !requiresNotary) {
    return { 
      label: 'Sin firmas', 
      iconName: 'none',
      colorClass: 'bg-slate-100 text-slate-600'
    };
  }
  if (!hasSigners && requiresNotary) {
    return { 
      label: 'Solo notario', 
      iconName: 'scale',
      colorClass: 'bg-purple-100 text-purple-700'
    };
  }
  if (hasSigners && !requiresNotary) {
    return { 
      label: 'Con firmas', 
      iconName: 'users',
      colorClass: 'bg-blue-100 text-blue-700'
    };
  }
  // hasSigners && requiresNotary
  return { 
    label: 'Firmas + Notario', 
    iconName: 'user-check',
    colorClass: 'bg-emerald-100 text-emerald-700'
  };
}

/**
 * Obtiene la configuración del flujo basada en el tipo de firma y si requiere notario
 */
export function getFlowConfig(signatureType: SignatureType, requiresNotary: boolean): FlowConfig {
  const hasSignatures = signatureType !== 'none';
  
  // Caso 1: Sin firma + Sin notario
  if (!hasSignatures && !requiresNotary) {
    return {
      caseNumber: 1,
      hasSignatureStep: false,
      requiresNotary: false,
      signatureType,
      steps: STEPS_WITHOUT_SIGNATURES,
      finalStateTitle: '¡Contrato Completado!',
      finalStateDescription: 'Tu contrato ha sido generado exitosamente y está listo para descargar.',
    };
  }
  
  // Caso 2: Sin firma + Con notario
  if (!hasSignatures && requiresNotary) {
    return {
      caseNumber: 2,
      hasSignatureStep: false,
      requiresNotary: true,
      signatureType,
      steps: STEPS_WITHOUT_SIGNATURES,
      finalStateTitle: 'Esperando Notario',
      finalStateDescription: 'Tu contrato ha sido enviado al notario para su revisión y validación. Te notificaremos cuando esté listo.',
    };
  }
  
  // Caso 3: FES + Sin notario
  if (signatureType === 'simple' && !requiresNotary) {
    return {
      caseNumber: 3,
      hasSignatureStep: true,
      requiresNotary: false,
      signatureType,
      steps: STEPS_WITH_SIGNATURES,
      finalStateTitle: 'Esperando Firmas',
      finalStateDescription: 'Se han enviado los enlaces de firma a todos los firmantes. Recibirás una notificación cuando todos hayan firmado.',
    };
  }
  
  // Caso 4: FES + Con notario
  if (signatureType === 'simple' && requiresNotary) {
    return {
      caseNumber: 4,
      hasSignatureStep: true,
      requiresNotary: true,
      signatureType,
      steps: STEPS_WITH_SIGNATURES,
      finalStateTitle: 'Esperando Firmas y Notario',
      finalStateDescription: 'Se han enviado los enlaces de firma. Una vez firmado por todos, el documento será validado por el notario.',
    };
  }
  
  // Caso 5: FEA + Sin notario
  if (signatureType === 'fea' && !requiresNotary) {
    return {
      caseNumber: 5,
      hasSignatureStep: true,
      requiresNotary: false,
      signatureType,
      steps: STEPS_WITH_SIGNATURES,
      finalStateTitle: 'Esperando Firmas Electrónicas Avanzadas',
      finalStateDescription: 'Se han enviado los enlaces de firma electrónica avanzada. Recibirás una notificación cuando todos hayan firmado.',
    };
  }
  
  // Caso 6: FEA + Con notario (default)
  return {
    caseNumber: 6,
    hasSignatureStep: true,
    requiresNotary: true,
    signatureType,
    steps: STEPS_WITH_SIGNATURES,
    finalStateTitle: 'Esperando Firmas Avanzadas y Notario',
    finalStateDescription: 'Se han enviado los enlaces de firma electrónica avanzada. Una vez firmado por todos, el documento será validado por el notario.',
  };
}

/**
 * Determina si el flujo debe mostrar una página de éxito o un estado de espera
 * Solo el caso 1 (sin firmas, sin notario) muestra página de éxito
 */
export function shouldShowSuccessPage(signatureType: SignatureType, requiresNotary: boolean): boolean {
  return signatureType === 'none' && !requiresNotary;
}

/**
 * Obtiene el estado de espera apropiado según la configuración
 */
export function getWaitingState(signatureType: SignatureType, requiresNotary: boolean): {
  type: 'none' | 'notary' | 'signatures' | 'signatures-and-notary';
  title: string;
  description: string;
} {
  const hasSignatures = signatureType !== 'none';
  
  if (!hasSignatures && !requiresNotary) {
    return {
      type: 'none',
      title: 'Completado',
      description: 'Tu contrato está listo.',
    };
  }
  
  if (!hasSignatures && requiresNotary) {
    return {
      type: 'notary',
      title: 'Esperando Notario',
      description: 'Tu contrato está siendo procesado por el notario.',
    };
  }
  
  if (hasSignatures && !requiresNotary) {
    return {
      type: 'signatures',
      title: 'Esperando Firmas',
      description: 'Esperando que todas las partes firmen el documento.',
    };
  }
  
  return {
    type: 'signatures-and-notary',
    title: 'Esperando Firmas y Notario',
    description: 'Esperando firmas de todos los participantes. Luego será validado por el notario.',
  };
}

/**
 * Obtiene el label del tipo de firma
 */
export function getSignatureTypeLabel(signatureType: SignatureType): string {
  const labels: Record<SignatureType, string> = {
    none: 'Sin firma electrónica',
    simple: 'Firma Electrónica Simple (FES)',
    fea: 'Firma Electrónica Avanzada (FEA)',
  };
  return labels[signatureType];
}
