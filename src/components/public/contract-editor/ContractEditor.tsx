// React imports
import { useState, useMemo, useRef } from 'react';

// External libraries
import { ArrowLeft } from 'lucide-react';

// Local components
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { CapsuleSelector } from './CapsuleSelector';
import { PaymentButton } from './PaymentButton';

// Hooks
import { useContractRenderer } from './hooks/useContractRenderer';

// Utils
import { extractVariables, formatVariableName } from './utils/templateParser';

// Styles and types
import { contractEditorStyles } from './styles';
import type { ContractEditorProps } from './types';

export function ContractEditor({
  templateText,
  formData,
  onFormChange,
  capsules,
  selectedCapsules,
  onCapsuleSelectionChange,
  basePrice,
  isLoading = false,
  clauseNumbering = [],
  signersConfig = [],
  variablesMetadata = [],
  onContinueToPayment,
  onRenderedHtmlChange,
  onBack,
}: ContractEditorProps) {
  // ============================================================================
  // State and Refs
  // ============================================================================
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // ============================================================================
  // Computed Values (Memoized)
  // ============================================================================
  
  // Extract variables from template
  const extractedVariables = useMemo(
    () => extractVariables(templateText, capsules, selectedCapsules),
    [templateText, capsules, selectedCapsules]
  );

  // Filter variables by search term
  const filteredVariables = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    if (!searchTerm) return validVariables;
    const term = searchTerm.toLowerCase();
    return validVariables.filter((v) => 
      v.toLowerCase().includes(term) || 
      formatVariableName(v).toLowerCase().includes(term)
    );
  }, [extractedVariables, searchTerm]);

  // Calculate completion percentage
  const completionPercentage = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    const filled = validVariables.filter((v) => formData[v] && formData[v].trim() !== '').length;
    return validVariables.length > 0 ? Math.round((filled / validVariables.length) * 100) : 0;
  }, [formData, extractedVariables]);

  // Validation helper functions
  const isNameField = (variable: string): boolean => {
    return variable.toLowerCase().includes('nombre');
  };

  const isRutField = (variable: string): boolean => {
    return variable.toLowerCase().includes('rut');
  };

  const isEmailField = (variable: string): boolean => {
    const varLower = variable.toLowerCase();
    return varLower.includes('email') || varLower.includes('correo') || varLower.includes('mail');
  };

  const isPhoneField = (variable: string): boolean => {
    const varLower = variable.toLowerCase();
    return varLower.includes('telefono') ||
           varLower.includes('teléfono') ||
           varLower.includes('celular') ||
           varLower.includes('phone');
  };

  const validateName = (value: string): boolean => {
    if (!value || value.trim() === '') return true; // Empty is ok (will be caught by completion check)
    return value.trim().length >= 2;
  };

  const validateRut = (value: string): boolean => {
    if (!value || value.trim() === '') return true; // Empty is ok (will be caught by completion check)
    const rutPattern = /^\d{7,8}-[\dkK]$/;
    return rutPattern.test(value.trim());
  };

  const validateEmail = (value: string): boolean => {
    if (!value || value.trim() === '') return true; // Empty is ok (will be caught by completion check)
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(value.trim());
  };

  const validatePhone = (value: string): boolean => {
    if (!value || value.trim() === '') return false; // Phone is REQUIRED
    const cleaned = value.replace(/\s/g, '');
    const phonePattern = /^(\+?56)?9\d{8}$/;
    return phonePattern.test(cleaned);
  };

  // Check if there are validation errors
  const hasValidationErrors = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    return validVariables.some((variable) => {
      const value = formData[variable] || '';
      
      if (isNameField(variable) && !validateName(value)) {
        return true;
      }
      
      if (isRutField(variable) && !validateRut(value)) {
        return true;
      }
      
      if (isEmailField(variable) && !validateEmail(value)) {
        return true;
      }
      
      if (isPhoneField(variable) && !validatePhone(value)) {
        return true;
      }
      
      return false;
    });
  }, [formData, extractedVariables]);

  // Calculate total price
  const totalPrice = useMemo(() => {
    const capsulesPrice = capsules
      .filter(c => selectedCapsules.includes(c.id))
      .reduce((sum, c) => sum + c.price, 0);
    return basePrice + capsulesPrice;
  }, [basePrice, capsules, selectedCapsules]);

  // ============================================================================
  // Custom Hooks
  // ============================================================================
  
  // Render contract HTML
  const { renderedContract } = useContractRenderer({
    templateText,
    formData,
    extractedVariables,
    capsules,
    selectedCapsules,
    clauseNumbering,
    signersConfig,
    activeField,
  });

  // ============================================================================
  // Event Handlers
  // ============================================================================
  
  const toggleCapsule = (capsuleId: number) => {
    if (selectedCapsules.includes(capsuleId)) {
      onCapsuleSelectionChange(selectedCapsules.filter(id => id !== capsuleId));
    } else {
      onCapsuleSelectionChange([...selectedCapsules, capsuleId]);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================


  return (
    <div className="relative h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-lime-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>
      
      {/* Botón Volver */}
      {onBack && (
        <div className="relative mb-10 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-md border border-slate-200 transition-all duration-200 hover:shadow-lg hover:scale-105 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al catálogo
          </button>
        </div>
      )}
      
      <div className="relative flex gap-6 h-full" ref={documentRef}>  
        <div className=" flex flex-col">
          <DocumentPreview
            templateText={templateText}
            renderedContract={renderedContract}
            completionPercentage={completionPercentage}
            activeField={activeField}
            variablesMetadata={variablesMetadata}
            onHtmlReady={onRenderedHtmlChange}
          />
        </div>

        <div className="w-full flex flex-col gap-4 min-w-0">
          <FieldsForm
            variables={filteredVariables}
            formData={formData}
            onFormChange={onFormChange}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            activeField={activeField}
            onFieldFocus={setActiveField}
            onFieldBlur={() => setActiveField(null)}
          />

          <CapsuleSelector
            capsules={capsules}
            selectedCapsules={selectedCapsules}
            onToggle={toggleCapsule}
          />

          <PaymentButton
            totalPrice={totalPrice}
            completionPercentage={completionPercentage}
            isLoading={isLoading}
            onContinue={onContinueToPayment}
            hasValidationErrors={hasValidationErrors}
          />
        </div>
      </div>

      <style>{contractEditorStyles}</style>
    </div>
  );
}
