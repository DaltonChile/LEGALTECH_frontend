import { useState, useEffect, useMemo, useRef } from 'react';

interface Capsule {
  id: number;
  title: string;
  price: number;
  legal_text?: string;
}

interface ContractEditorProps {
  templateText: string;
  variables: string[];
  formData: Record<string, string>;
  onFormChange: (data: Record<string, string>) => void;
  capsules: Capsule[];
  selectedCapsules: number[];
  onCapsuleSelectionChange: (selectedIds: number[]) => void;
  basePrice: number;
  isLoading?: boolean;
}

export function ContractEditor({
  templateText,
  variables,
  formData,
  onFormChange,
  capsules,
  selectedCapsules,
  onCapsuleSelectionChange,
  basePrice,
  isLoading = false,
}: ContractEditorProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCapsulesPanel, setShowCapsulesPanel] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  // Función helper para formatear nombres de variables
  const formatVariableName = (variable: string): string => {
    if (!variable) return '';
    return variable
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Renderizar el contrato con los valores actuales
  const renderedContract = useMemo(() => {
    console.log('Rendering contract with templateText:', templateText?.substring(0, 100));
    console.log('Variables:', variables);
    console.log('Selected capsules:', selectedCapsules);
    
    let result = templateText;

    // Reemplazar variables con valores o placeholders EDITABLES
    variables.forEach((variable) => {
      if (!variable) return;
      
      const value = formData[variable] || '';
      const isActive = activeField === variable;
      
      // Regex que acepta espacios opcionales alrededor del nombre de variable
      const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
      
      // Si hay valor, reemplazarlo con un span editable
      if (value) {
        result = result.replace(
          regex,
          `<span 
            class="filled-variable ${isActive ? 'active-variable' : ''}" 
            contenteditable="true"
            data-variable="${variable}"
            spellcheck="false"
          >${value}</span>`
        );
      } else {
        // Si no hay valor, mostrar placeholder editable
        result = result.replace(
          regex,
          `<span 
            class="empty-variable ${isActive ? 'active-variable' : ''}" 
            contenteditable="true"
            data-variable="${variable}"
            data-placeholder="[${formatVariableName(variable)}]"
            spellcheck="false"
          >${value}</span>`
        );
      }
    });

    // Agregar cláusulas seleccionadas al final del contrato
    if (selectedCapsules.length > 0) {
      const selectedCapsuleTexts = capsules
        .filter(c => selectedCapsules.includes(c.id))
        .map(c => {
          let capsuleText = c.legal_text || '';
          
          // Procesar variables dentro del texto de la cápsula
          variables.forEach((variable) => {
            if (!variable) return;
            
            const value = formData[variable] || '';
            const isActive = activeField === variable;
            const regex = new RegExp(`\\{\\{\\s*${variable}\\s*\\}\\}`, 'g');
            
            if (value) {
              capsuleText = capsuleText.replace(
                regex,
                `<span 
                  class="filled-variable ${isActive ? 'active-variable' : ''}" 
                  contenteditable="true"
                  data-variable="${variable}"
                  spellcheck="false"
                >${value}</span>`
              );
            } else {
              capsuleText = capsuleText.replace(
                regex,
                `<span 
                  class="empty-variable ${isActive ? 'active-variable' : ''}" 
                  contenteditable="true"
                  data-variable="${variable}"
                  data-placeholder="[${formatVariableName(variable)}]"
                  spellcheck="false"
                >${value}</span>`
              );
            }
          });
          
          return capsuleText;
        })
        .filter(text => text.length > 0);
      
      if (selectedCapsuleTexts.length > 0) {
        result += '\n\n<div class="capsules-section"><h2>Cláusulas Adicionales</h2>\n' + 
                  selectedCapsuleTexts.join('\n\n') + 
                  '</div>';
      }
    }

    console.log('Rendered contract:', result?.substring(0, 200));
    return result;
  }, [templateText, formData, variables, activeField, selectedCapsules, capsules]);

  // Actualizar el HTML solo cuando cambie el template o las cápsulas, NO en cada cambio de formData
  useEffect(() => {
    if (contractRef.current && !isEditingRef.current) {
      contractRef.current.innerHTML = renderedContract;
    }
  }, [templateText, selectedCapsules]); // Solo cuando cambia el template o cápsulas

  // Manejar edición inline en el texto del contrato
  const handleContractInput = (e: React.FormEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Solo procesar si es un span de variable editable
    if (target.tagName === 'SPAN' && target.hasAttribute('data-variable')) {
      const value = target.textContent || '';
      
      // Actualizar clases según si tiene contenido (visual feedback inmediato)
      if (value.trim()) {
        target.className = 'filled-variable';
      } else {
        target.className = 'empty-variable';
      }
      
      // NO actualizar formData aquí - solo visual feedback
    }
  };

  // Manejar focus en variables del contrato
  const handleContractFocus = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'SPAN' && target.hasAttribute('data-variable')) {
      const variable = target.getAttribute('data-variable');
      if (variable) {
        isEditingRef.current = true;
        setActiveField(variable);
        
        // Si está vacío y tiene placeholder, limpiar el contenido para editar
        if (!target.textContent?.trim() || target.textContent === target.getAttribute('data-placeholder')) {
          target.textContent = '';
        }
      }
    }
  };

  // Manejar blur en variables del contrato
  const handleContractBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    if (target.tagName === 'SPAN' && target.hasAttribute('data-variable')) {
      const variable = target.getAttribute('data-variable');
      const value = target.textContent || '';
      
      // AQUÍ actualizar formData - solo al perder foco
      if (variable) {
        onFormChange({
          ...formData,
          [variable]: value.trim(),
        });
      }
      
      // Si quedó vacío, restaurar placeholder visual
      if (!value.trim() && variable) {
        const placeholder = target.getAttribute('data-placeholder') || `[${formatVariableName(variable)}]`;
        target.textContent = placeholder;
      }
      
      isEditingRef.current = false;
    }
    
    setActiveField(null);
  };

  const isFieldEmpty = (variable: string): boolean => {
    return !formData[variable] || formData[variable].trim() === '';
  };

  const completionPercentage = useMemo(() => {
    const validVariables = variables.filter(v => v);
    const filled = validVariables.filter((v) => formData[v] && formData[v].trim() !== '').length;
    return validVariables.length > 0 ? Math.round((filled / validVariables.length) * 100) : 0;
  }, [formData, variables]);

  // Filtrar variables según búsqueda
  const filteredVariables = useMemo(() => {
    const validVariables = variables.filter(v => v);
    if (!searchTerm) return validVariables;
    const term = searchTerm.toLowerCase();
    return validVariables.filter((v) => 
      v.toLowerCase().includes(term) || 
      formatVariableName(v).toLowerCase().includes(term)
    );
  }, [variables, searchTerm]);

  // Agrupar variables por sección (por prefijo antes del guión bajo)
  const groupedVariables = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    filteredVariables.forEach((variable) => {
      if (!variable) return;
      const prefix = variable.split('_')[0] || 'general';
      if (!groups[prefix]) {
        groups[prefix] = [];
      }
      groups[prefix].push(variable);
    });

    return groups;
  }, [filteredVariables]);

  const toggleCapsule = (capsuleId: number) => {
    if (selectedCapsules.includes(capsuleId)) {
      onCapsuleSelectionChange(selectedCapsules.filter(id => id !== capsuleId));
    } else {
      onCapsuleSelectionChange([...selectedCapsules, capsuleId]);
    }
  };

  const totalPrice = useMemo(() => {
    const capsulesPrice = capsules
      .filter(c => selectedCapsules.includes(c.id))
      .reduce((sum, c) => sum + c.price, 0);
    return basePrice + capsulesPrice;
  }, [basePrice, capsules, selectedCapsules]);

  return (
    <div className="h-screen flex flex-col">
      {/* Progress Bar con botón de cápsulas */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Progreso del formulario</span>
            <button
              onClick={() => setShowCapsulesPanel(!showCapsulesPanel)}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Cláusulas Opcionales ({selectedCapsules.length})
            </button>
          </div>
          <span className="text-sm font-medium text-gray-700">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Contrato Panel */}
        <div className={`${showCapsulesPanel ? 'w-4/5' : 'w-full'} bg-gray-50 overflow-y-auto transition-all`}>
          <div className="p-8">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl mx-auto">
              {!templateText || templateText.trim() === '' ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">
                    <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="font-medium">No hay contenido de plantilla</p>
                    <p className="text-sm mt-2">El template no tiene contenido cargado</p>
                  </div>
                </div>
              ) : (
                <div
                  ref={contractRef}
                  className="contract-preview prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderedContract }}
                  onInput={handleContractInput}
                  onFocus={handleContractFocus}
                  onBlur={handleContractBlur}
                />
              )}
            </div>
          </div>
        </div>

        {/* Capsules Panel (conditional) */}
        {showCapsulesPanel && (
          <div className="w-1/5 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Cláusulas Opcionales</h3>
                <button
                  onClick={() => setShowCapsulesPanel(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Selecciona cláusulas adicionales para personalizar tu contrato. Los cambios se reflejarán en tiempo real.
              </p>

              {/* Capsules list */}
              <div className="space-y-3 mb-4">
                {capsules.map((capsule) => {
                  const isSelected = selectedCapsules.includes(capsule.id);
                  return (
                    <div
                      key={capsule.id}
                      onClick={() => toggleCapsule(capsule.id)}
                      className={`relative p-3 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-50 ring-1 ring-cyan-200'
                          : 'border-slate-200 hover:border-cyan-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-5 h-5 text-cyan-600 bg-white border-gray-300 rounded focus:ring-cyan-500"
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 mb-1">{capsule.title}</h4>
                          <span className="text-xs font-medium text-cyan-600">
                            ${capsule.price.toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary */}
              <div className="sticky bottom-0 bg-white border-t-2 border-gray-200 pt-3">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base:</span>
                    <span className="font-medium text-gray-900">${basePrice.toLocaleString('es-CL')}</span>
                  </div>
                  {selectedCapsules.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cláusulas:</span>
                      <span className="font-medium text-gray-900">
                        ${capsules
                          .filter(c => selectedCapsules.includes(c.id))
                          .reduce((sum, c) => sum + c.price, 0)
                          .toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="text-sm font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 bg-clip-text text-transparent">
                      Total:
                    </span>
                    <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-lime-500 bg-clip-text text-transparent">
                      ${totalPrice.toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Styles */}
      <style>{`
        .contract-preview {
          line-height: 1.8;
          color: #1f2937;
        }

        .filled-variable {
          background-color: #dbeafe;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          color: #1e40af;
          cursor: text;
          display: inline-block;
          min-width: 2ch;
          transition: all 0.2s;
        }

        .filled-variable:hover {
          background-color: #bfdbfe;
          outline: 1px solid #3b82f6;
        }

        .empty-variable {
          background-color: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
          color: #991b1b;
          font-style: italic;
          cursor: text;
          display: inline-block;
          min-width: 10ch;
          transition: all 0.2s;
        }

        .empty-variable:hover {
          background-color: #fecaca;
          outline: 1px solid #ef4444;
        }

        .empty-variable:empty:before {
          content: attr(data-placeholder);
          color: #991b1b;
          font-style: italic;
        }

        .active-variable {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .prose h1, .prose h2, .prose h3 {
          color: #111827;
          font-weight: 700;
        }

        .prose p {
          margin-bottom: 1em;
          line-height: 1.8;
        }

        .capsules-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .capsules-section h2 {
          color: #0891b2;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .prose h1 {
          font-size: 1.875rem;
          margin-bottom: 1rem;
        }

        .prose h2 {
          font-size: 1.5rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
