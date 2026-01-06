import { useState, useMemo, useRef } from 'react';
import { DocumentPreview } from './DocumentPreview';
import { FieldsForm } from './FieldsForm';
import { CapsuleSelector } from './CapsuleSelector';
import { PaymentButton } from './PaymentButton';
import { useContractRenderer } from './hooks/useContractRenderer';
import { extractVariables, formatVariableName } from './utils/templateParser';
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
  onContinueToPayment,
  onRenderedHtmlChange,
}: ContractEditorProps) {
  const [showCapsules, setShowCapsules] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeField, setActiveField] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);

  // Extract variables from template
  const extractedVariables = useMemo(
    () => extractVariables(templateText, capsules, selectedCapsules),
    [templateText, capsules, selectedCapsules]
  );

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

  // Filter variables by search
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

  // Calculate total price
  const totalPrice = useMemo(() => {
    const capsulesPrice = capsules
      .filter(c => selectedCapsules.includes(c.id))
      .reduce((sum, c) => sum + c.price, 0);
    return basePrice + capsulesPrice;
  }, [basePrice, capsules, selectedCapsules]);

  // Toggle capsule selection
  const toggleCapsule = (capsuleId: number) => {
    if (selectedCapsules.includes(capsuleId)) {
      onCapsuleSelectionChange(selectedCapsules.filter(id => id !== capsuleId));
    } else {
      onCapsuleSelectionChange([...selectedCapsules, capsuleId]);
    }
  };

  // Handle field focus - scroll to variable in document
  const handleFieldFocus = (variable: string) => {
    setActiveField(variable);
    setTimeout(() => {
      const varElement = documentRef.current?.querySelector(`[data-var="${variable}"]`);
      if (varElement) {
        varElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  return (
    <div className="relative h-full bg-gradient-to-br from-slate-50 via-cyan-50/30 to-lime-50/30 p-6 overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-lime-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-cyan-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative flex gap-6 h-full" ref={documentRef}>  
        <div className=" flex flex-col">
          <DocumentPreview
            templateText={templateText}
            renderedContract={renderedContract}
            completionPercentage={completionPercentage}
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
            onFieldFocus={handleFieldFocus}
            onFieldBlur={() => setActiveField(null)}
          />

          <CapsuleSelector
            capsules={capsules}
            selectedCapsules={selectedCapsules}
            onToggle={toggleCapsule}
            isOpen={showCapsules}
            onOpenChange={setShowCapsules}
          />

          <PaymentButton
            totalPrice={totalPrice}
            completionPercentage={completionPercentage}
            isLoading={isLoading}
            onContinue={onContinueToPayment}
          />
        </div>
      </div>

      <style>{contractEditorStyles}</style>
    </div>
  );
}
