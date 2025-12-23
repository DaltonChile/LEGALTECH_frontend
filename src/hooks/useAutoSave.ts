import { useEffect, useRef } from 'react';

/**
 * Hook personalizado para auto-guardar datos con debounce
 * @param data Datos a guardar
 * @param onSave Función que se ejecutará para guardar
 * @param delay Delay en milisegundos (default: 3000)
 */
export const useAutoSave = (
  data: any,
  onSave: (data: any) => Promise<void>,
  delay: number = 3000
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousDataRef = useRef(data);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // No guardar en el primer render
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousDataRef.current = data;
      return;
    }

    // Cancelar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Solo guardar si los datos cambiaron
    if (JSON.stringify(data) !== JSON.stringify(previousDataRef.current)) {
      timeoutRef.current = setTimeout(() => {
        onSave(data);
        previousDataRef.current = data;
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay]);

  // Función para forzar guardado inmediato
  const forceSave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSave(data);
    previousDataRef.current = data;
  };

  return { forceSave };
};
