import { useState, useEffect, useMemo, useRef } from 'react';

interface Capsule {
  id: number;
  slug: string;
  title: string;
  description?: string;
  price: number;
  legal_text?: string;
  variables?: string[];
  display_order: number;
}

interface ClauseNumbering {
  order: number;
  title: string;
  is_in_capsule: boolean;
  capsule_slug: string | null;
}

interface SignerConfig {
  role: string;
  display_name: string;
  signature_order: number;
  name_variable: string;
  rut_variable: string;
  email_variable: string;
}

interface VariableMetadata {
  canonical: string;
  normalized: string;
  aliases: string[];
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
  // Nuevos props del parser
  clauseNumbering?: ClauseNumbering[];
  signersConfig?: SignerConfig[];
  variablesMetadata?: {
    variables: VariableMetadata[];
    baseVariables: string[];
  };
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
  clauseNumbering = [],
  signersConfig = [],
  variablesMetadata,
}: ContractEditorProps) {
  const [activeField, setActiveField] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCapsulesPanel, setShowCapsulesPanel] = useState(false);
  const contractRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  // SIEMPRE extraer variables del template (ignorar props.variables que vienen normalizadas)
  const extractedVariables = useMemo(() => {
    console.log('\n🔍 DIAGNÓSTICO FRONTEND:');
    console.log('Template length:', templateText?.length);
    
    // 1. Extraer variables de cápsulas NO seleccionadas para excluirlas
    const unselectedCapsuleVars = new Set<string>();
    capsules.forEach(capsule => {
      if (!selectedCapsules.includes(capsule.id) && capsule.title) {
        // Buscar el contenido de esta cápsula en el template
        const escapedTitle = capsule.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const capsulePattern = `\\[\\s*CAPSULA\\s*:\\s*${escapedTitle}[^\\]]*\\]([\\s\\S]*?)\\[\\s*/\\s*CAPSULA\\s*\\]`;
        const capsuleRegex = new RegExp(capsulePattern, 'gi');
        const capsuleMatch = templateText.match(capsuleRegex);
        
        if (capsuleMatch) {
          // Extraer variables dentro de esta cápsula
          const capsuleContent = capsuleMatch[0];
          const varRegex = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
          let varMatch;
          while ((varMatch = varRegex.exec(capsuleContent)) !== null) {
            const varName = varMatch[1].trim();
            if (varName && !varName.toUpperCase().startsWith('NUMERACI')) {
              unselectedCapsuleVars.add(varName);
            }
          }
        }
      }
    });
    
    console.log('🚫 Variables de cápsulas NO seleccionadas:', Array.from(unselectedCapsuleVars));
    
    // 2. Extraer TODAS las variables del template
    const varSet = new Set<string>();
    const regex = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
    let match;
    
    while ((match = regex.exec(templateText)) !== null) {
      const varName = match[1].trim();
      
      // Filtrar NUMERACIÓN y variables de cápsulas no seleccionadas
      if (varName && 
          !varName.toUpperCase().startsWith('NUMERACI') && 
          !unselectedCapsuleVars.has(varName)) {
        varSet.add(varName);
      }
    }
    
    const extracted = Array.from(varSet);
    console.log('✅ Variables filtradas (sin cápsulas no seleccionadas):', extracted);
    return extracted;
  }, [templateText, capsules, selectedCapsules]);

  // Números ordinales en español
  const ordinals = [
    'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA',
    'SEXTA', 'SÉPTIMA', 'OCTAVA', 'NOVENA', 'DÉCIMA',
    'UNDÉCIMA', 'DUODÉCIMA', 'DECIMOTERCERA', 'DECIMOCUARTA', 'DECIMOQUINTA'
  ];

  // Calcular numeración dinámica según cápsulas seleccionadas
  const calculateClauseNumbers = useMemo(() => {
    if (!clauseNumbering || clauseNumbering.length === 0) {
      return {};
    }

    const selectedCapsuleSlugs = capsules
      .filter(c => selectedCapsules.includes(c.id))
      .map(c => c.slug);

    const numberMap: Record<number, string> = {};
    let currentNumber = 1;

    clauseNumbering.forEach(clause => {
      // Si la cláusula está en una cápsula, verificar si fue seleccionada
      if (clause.is_in_capsule && clause.capsule_slug) {
        if (!selectedCapsuleSlugs.includes(clause.capsule_slug)) {
          return; // Skip esta cláusula
        }
      }

      // Asignar número
      numberMap[clause.order] = ordinals[currentNumber - 1] || `CLÁUSULA ${currentNumber}`;
      currentNumber++;
    });

    return numberMap;
  }, [clauseNumbering, selectedCapsules, capsules]);

  // Función helper para formatear nombres de variables
  const formatVariableName = (variable: string): string => {
    if (!variable) return '';
    return variable
      .replace(/_/g, ' ')
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Renderizar el contrato con los valores actuales (solo vista previa)
  const renderedContract = useMemo(() => {
    console.log('=== RENDERING CONTRACT PREVIEW ===');
    console.log('Template text length:', templateText?.length);
    console.log('Extracted variables:', extractedVariables);
    
    let result = templateText;

    // 1. Reemplazar NUMERACIÓN: con números dinámicos
    if (clauseNumbering && clauseNumbering.length > 0) {
      clauseNumbering.forEach(clause => {
        const number = calculateClauseNumbers[clause.order];
        if (number) {
          const regex = new RegExp(`NUMERACI[OÓ]N\\s*:\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
          result = result.replace(regex, `${number}: ${clause.title}`);
        }
      });
    }

    // 2. Reemplazar variables con valores (SOLO LECTURA, sin contenteditable)
    extractedVariables.forEach((variable) => {
      if (!variable) return;
      
      const value = formData[variable] || '';
      const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*[^}]*)?\\s*\\}\\}`, 'gi');
      
      if (value) {
        // Con valor: mostrar el valor en azul
        result = result.replace(
          regex,
          `<span class="filled-variable">${value}</span>`
        );
      } else {
        // Sin valor: mostrar el nombre de la variable en rojo
        const placeholder = formatVariableName(variable);
        result = result.replace(
          regex,
          `<span class="empty-variable">[${placeholder}]</span>`
        );
      }
    });

    // 3. Reemplazar o eliminar marcadores de cápsulas
    capsules.forEach(capsule => {
      // Validar que la cápsula tenga título
      if (!capsule.title) {
        console.warn('Cápsula sin título:', capsule);
        return;
      }
      
      const isSelected = selectedCapsules.includes(capsule.id);
      console.log(`🔍 Procesando cápsula "${capsule.title}":`, isSelected ? 'SELECCIONADA ✅' : 'NO SELECCIONADA ❌');
      
      // IMPORTANTE: Buscar usando el TITLE (texto original) no el slug (normalizado)
      // El template tiene [CAPSULA: individualización fiador...] no [CAPSULA: individualizacin_fiador...]
      const escapedTitle = capsule.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const capsulePattern = `\\[\\s*CAPSULA\\s*:\\s*${escapedTitle}[^\\]]*\\]([\\s\\S]*?)\\[\\s*/\\s*CAPSULA\\s*\\]`;
      const capsuleRegex = new RegExp(capsulePattern, 'gi');
      
      // Buscar si existe el marcador en el template
      const testMatch = result.match(capsuleRegex);
      console.log(`  📍 Buscando patrón: [CAPSULA: ${capsule.title}...]`);
      console.log(`  🔎 Encontrado en template:`, testMatch ? `SÍ (${testMatch.length} match)` : 'NO');
      
      if (testMatch) {
        console.log(`  📝 Primer match (primeros 100 chars):`, testMatch[0].substring(0, 100));
      }
      
      if (isSelected) {
        // Cápsula seleccionada: extraer el contenido DENTRO de los marcadores y procesarlo
        let replacementCount = 0;
        result = result.replace(capsuleRegex, (fullMatch, capsuleContent) => {
          replacementCount++;
          console.log(`  ✅ Extrayendo contenido (match #${replacementCount})`);
          console.log(`  📄 Contenido extraído (primeros 150 chars):`, capsuleContent.substring(0, 150));
          
          let processedContent = capsuleContent;
          
          // Reemplazar NUMERACIÓN en cápsulas
          if (clauseNumbering) {
            clauseNumbering
              .filter(clause => clause.is_in_capsule && clause.capsule_slug === capsule.slug)
              .forEach(clause => {
                const number = calculateClauseNumbers[clause.order];
                if (number) {
                  const numRegex = new RegExp(`NUMERACI[OÓ]N\\s*:\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
                  processedContent = processedContent.replace(numRegex, `${number}: ${clause.title}`);
                }
              });
          }
          
          // Procesar variables dentro del texto de la cápsula
          extractedVariables.forEach((variable) => {
            if (!variable) return;
            
            const value = formData[variable] || '';
            const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*[^}]*)?\\s*\\}\\}`, 'gi');
            
            if (value) {
              processedContent = processedContent.replace(regex, `<span class="filled-variable">${value}</span>`);
            } else {
              const placeholder = formatVariableName(variable);
              processedContent = processedContent.replace(regex, `<span class="empty-variable">[${placeholder}]</span>`);
            }
          });
          
          // Devolver el contenido procesado SIN los marcadores [CAPSULA]
          return `\n${processedContent}\n`;
        });
        
        if (replacementCount === 0) {
          console.warn(`  ⚠️  No se pudo extraer contenido - regex no hizo match`);
        }
      } else {
        // Cápsula NO seleccionada: eliminar completamente el marcador y su contenido
        const beforeLength = result.length;
        result = result.replace(capsuleRegex, '');
        const afterLength = result.length;
        const removed = beforeLength - afterLength;
        console.log(`  ❌ Eliminada (${removed} caracteres removidos)`);
      }
    });

    // 4. Eliminar bloques de [FIRMA:...] del template (se renderizarán al final)
    result = result.replace(/\[\s*FIRMA\s*:[^\]]+\]([\s\S]*?)\[\s*\/\s*FIRMA\s*\]/gi, '');

    // 5. Agregar sección de firmas si hay configuración
    if (signersConfig && signersConfig.length > 0) {
      result += '\n\n<div class="signatures-section"><h2>Firmas</h2>\n';
      
      signersConfig
        .sort((a, b) => a.signature_order - b.signature_order)
        .forEach(signer => {
          const nameValue = formData[signer.name_variable];
          const rutValue = formData[signer.rut_variable];
          const emailValue = formData[signer.email_variable];
          
          const name = nameValue 
            ? `<span class="filled-variable">${nameValue}</span>`
            : `<span class="empty-variable">[${formatVariableName(signer.name_variable)}]</span>`;
          
          const rut = rutValue
            ? `<span class="filled-variable">${rutValue}</span>`
            : `<span class="empty-variable">[${formatVariableName(signer.rut_variable)}]</span>`;
          
          const email = emailValue
            ? `<span class="filled-variable">${emailValue}</span>`
            : `<span class="empty-variable">[${formatVariableName(signer.email_variable)}]</span>`;
          
          result += `
            <div class="signature-block">
              <h3>${signer.display_name}</h3>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>RUT:</strong> ${rut}</p>
              <p><strong>Email:</strong> ${email}</p>
            </div>
          `;
        });
      
      result += '</div>';
    }

    console.log('Rendered contract:', result?.substring(0, 200));
    return result;
  }, [templateText, formData, extractedVariables, selectedCapsules, capsules, calculateClauseNumbers, clauseNumbering, signersConfig]);

  // Actualizar el HTML cuando cambien las dependencias relevantes
  useEffect(() => {
    if (contractRef.current) {
      contractRef.current.innerHTML = renderedContract;
    }
  }, [templateText, selectedCapsules, extractedVariables.length, Object.keys(formData).length, clauseNumbering?.length]);

  const isFieldEmpty = (variable: string): boolean => {
    return !formData[variable] || formData[variable].trim() === '';
  };

  const completionPercentage = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    const filled = validVariables.filter((v) => formData[v] && formData[v].trim() !== '').length;
    return validVariables.length > 0 ? Math.round((filled / validVariables.length) * 100) : 0;
  }, [formData, extractedVariables]);

  // Filtrar variables según búsqueda
  const filteredVariables = useMemo(() => {
    const validVariables = extractedVariables.filter(v => v);
    if (!searchTerm) return validVariables;
    const term = searchTerm.toLowerCase();
    return validVariables.filter((v) => 
      v.toLowerCase().includes(term) || 
      formatVariableName(v).toLowerCase().includes(term)
    );
  }, [extractedVariables, searchTerm]);

  // Agrupar variables por sección (por palabras clave en el nombre)
  const groupedVariables = useMemo(() => {
    const groups: Record<string, string[]> = {
      'Fecha y Lugar': [],
      'Partes del Contrato': [],
      'Datos de Identificación': [],
      'Datos de Contacto': [],
      'Objeto del Contrato': [],
      'Condiciones Económicas': [],
      'Plazos y Vigencia': [],
      'Garantías y Avales': [],
      'Otros': []
    };
    
    filteredVariables.forEach((variable) => {
      if (!variable) return;
      
      const varLower = variable.toLowerCase();
      
      // Fecha y Lugar
      if (varLower.includes('ciudad') || varLower.includes('día') || varLower.includes('mes') || 
          varLower.includes('año') || varLower.includes('fecha') || varLower.includes('lugar')) {
        groups['Fecha y Lugar'].push(variable);
      }
      // Partes del Contrato (nombres completos y roles)
      else if (varLower.includes('nombre completo') || varLower.includes('razón social') ||
               varLower.includes('arrendador') || varLower.includes('arrendatario') ||
               varLower.includes('comprador') || varLower.includes('vendedor') ||
               varLower.includes('contratante') || varLower.includes('contratista') ||
               varLower.includes('empleador') || varLower.includes('trabajador') ||
               varLower.includes('mandante') || varLower.includes('mandatario') ||
               varLower.includes('acreedor') || varLower.includes('deudor') ||
               varLower.includes('parte') || varLower.includes('compareciente')) {
        groups['Partes del Contrato'].push(variable);
      }
      // Datos de Identificación (RUT, cédula, pasaporte, nacionalidad, estado civil)
      else if (varLower.includes('rut') || varLower.includes('cédula') || varLower.includes('dni') ||
               varLower.includes('pasaporte') || varLower.includes('identificación') ||
               varLower.includes('nacionalidad') || varLower.includes('estado civil') ||
               varLower.includes('profesión') || varLower.includes('oficio')) {
        groups['Datos de Identificación'].push(variable);
      }
      // Datos de Contacto (dirección, comuna, región, email, teléfono)
      else if (varLower.includes('dirección') || varLower.includes('domicilio') ||
               varLower.includes('calle') || varLower.includes('comuna') || varLower.includes('región') ||
               varLower.includes('ciudad') || varLower.includes('país') ||
               varLower.includes('email') || varLower.includes('correo') ||
               varLower.includes('teléfono') || varLower.includes('celular') || varLower.includes('fono')) {
        groups['Datos de Contacto'].push(variable);
      }
      // Objeto del Contrato (propiedad, bien, servicio, inmueble, vehículo)
      else if (varLower.includes('propiedad') || varLower.includes('inmueble') || varLower.includes('bien') ||
               varLower.includes('vehículo') || varLower.includes('patente') || varLower.includes('marca') ||
               varLower.includes('modelo') || varLower.includes('servicio') || varLower.includes('obra') ||
               varLower.includes('descripción') || varLower.includes('ubicación') ||
               varLower.includes('estacionamiento') || varLower.includes('bodega')) {
        groups['Objeto del Contrato'].push(variable);
      }
      // Condiciones Económicas (precio, monto, pago, cuenta, UF, peso)
      else if (varLower.includes('precio') || varLower.includes('valor') || varLower.includes('monto') ||
               varLower.includes('pago') || varLower.includes('cuota') || varLower.includes('abono') ||
               varLower.includes('saldo') || varLower.includes('cuenta') || varLower.includes('banco') ||
               varLower.includes('uf') || varLower.includes('peso') || varLower.includes('dólar') ||
               varLower.includes('letras') || varLower.includes('arrendamiento') ||
               varLower.includes('remuneración') || varLower.includes('honorarios') ||
               varLower.includes('tarifa') || varLower.includes('costo')) {
        groups['Condiciones Económicas'].push(variable);
      }
      // Plazos y Vigencia (plazo, duración, días, meses, años, vigencia, inicio, término)
      else if (varLower.includes('plazo') || varLower.includes('duración') || varLower.includes('vigencia') ||
               varLower.includes('días') || varLower.includes('meses') || varLower.includes('años') ||
               varLower.includes('inicio') || varLower.includes('término') || varLower.includes('vencimiento') ||
               varLower.includes('renovación') || varLower.includes('prórroga') ||
               varLower.includes('semestral') || varLower.includes('anual') || varLower.includes('mensual')) {
        groups['Plazos y Vigencia'].push(variable);
      }
      // Garantías y Avales (garantía, fiador, codeudor, aval, caución)
      else if (varLower.includes('garantía') || varLower.includes('fiador') || varLower.includes('codeudor') ||
               varLower.includes('aval') || varLower.includes('caución') || varLower.includes('prenda') ||
               varLower.includes('hipoteca') || varLower.includes('seguro')) {
        groups['Garantías y Avales'].push(variable);
      }
      // Todo lo demás
      else {
        groups['Otros'].push(variable);
      }
    });

    // Filtrar grupos vacíos
    return Object.fromEntries(
      Object.entries(groups).filter(([_, vars]) => vars.length > 0)
    );
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
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header mejorado con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 shadow-lg">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <span className="text-white/80 text-xs font-medium">Progreso del contrato</span>
                  <div className="text-white font-bold text-lg">{completionPercentage}% completado</div>
                </div>
              </div>
              <button
                onClick={() => setShowCapsulesPanel(!showCapsulesPanel)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="font-medium">Cláusulas Opcionales</span>
                <span className="px-2 py-0.5 bg-lime-400 text-slate-900 rounded-full text-xs font-bold">{selectedCapsules.length}</span>
              </button>
            </div>
          </div>
          <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-lime-400 via-green-400 to-emerald-400 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Split Screen: Contrato + Formulario */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel Izquierdo: Vista Previa del Contrato */}
        <div className="w-1/2 overflow-y-auto border-r border-slate-200/50 bg-transparent">
          <div className="p-10">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200/50 p-10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Vista Previa</h2>
                  <p className="text-xs text-slate-500">Actualización en tiempo real</p>
                </div>
              </div>
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
                />
              )}
            </div>
          </div>
        </div>

        {/* Panel Derecho: Formulario de Variables */}
        <div className="w-1/2 bg-white/50 backdrop-blur-sm overflow-y-auto">
          <div className="p-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Completa los Campos</h2>
                <p className="text-xs text-slate-500">Llena la información requerida</p>
              </div>
            </div>
            
            {/* Buscador mejorado */}
            <div className="mb-8">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Buscar campo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-3 pl-11 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 bg-white shadow-sm"
                />
                <svg className="w-5 h-5 text-slate-400 group-focus-within:text-cyan-500 absolute left-3 top-3.5 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Lista de Variables Agrupadas */}
            <div className="space-y-6">
              {Object.entries(groupedVariables).map(([prefix, vars]) => (
                <div key={prefix} className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-1 h-6 bg-gradient-to-b from-cyan-500 to-blue-500 rounded-full"></div>
                    <h3 className="font-bold text-slate-900 capitalize">{prefix.replace(/_/g, ' ')}</h3>
                  </div>
                  <div className="space-y-4">
                    {vars.map((variable) => {
                      // Extraer descripción del template
                      const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                      const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*([^}]*))?\\s*\\}\\}`, 'i');
                      const match = templateText.match(regex);
                      const description = match && match[1] ? match[1].trim() : '';
                      
                      return (
                        <div key={variable} className="relative">
                          <div className="flex items-start gap-2">
                            <div className="flex-1">
                              <label htmlFor={variable} className="block text-sm font-medium text-gray-700 mb-2">
                                {formatVariableName(variable)}
                                {isFieldEmpty(variable) && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <input
                                id={variable}
                                type="text"
                                value={formData[variable] || ''}
                                onChange={(e) => onFormChange({ ...formData, [variable]: e.target.value })}
                                placeholder={formatVariableName(variable)}
                                className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-200 ${
                                  isFieldEmpty(variable) ? 'border-red-300 bg-red-50 focus:bg-white' : 'border-slate-200 bg-white hover:border-slate-300'
                                }`}
                              />
                            </div>
                            {description && (
                              <button
                                type="button"
                                onClick={() => setActiveField(activeField === variable ? null : variable)}
                                className="mt-7 p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                title="Ver descripción"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {activeField === variable && description && (
                            <div className="mt-2 bg-cyan-50 border-l-4 border-cyan-500 rounded-r-lg p-3 text-sm text-gray-700">
                              <p className="font-medium text-cyan-900 mb-1">Descripción:</p>
                              <p>{description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Capsules Panel (conditional, overlay) */}
        {showCapsulesPanel && (
          <div className="w-1/4 bg-gradient-to-b from-white to-slate-50 border-l-2 border-slate-200 overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Cláusulas Opcionales</h3>
                    <p className="text-xs text-slate-500">{selectedCapsules.length} seleccionadas</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCapsulesPanel(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="bg-cyan-50 border-l-4 border-cyan-500 rounded-r-xl p-4 mb-6">
                <p className="text-slate-700 text-sm font-medium">
                  💡 Los cambios se reflejan en tiempo real en tu contrato
                </p>
              </div>

              {/* Capsules list */}
              <div className="space-y-3 mb-6">
                {capsules.map((capsule) => {
                  const isSelected = selectedCapsules.includes(capsule.id);
                  return (
                    <div
                      key={capsule.id}
                      onClick={() => toggleCapsule(capsule.id)}
                      className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-cyan-500 bg-gradient-to-br from-cyan-50 to-blue-50 shadow-lg shadow-cyan-100 scale-[1.02]'
                          : 'border-slate-200 bg-white hover:border-cyan-300 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                            isSelected ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-slate-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 mb-2 leading-tight">{capsule.title}</h4>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                              isSelected ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700'
                            }`}>
                              ${capsule.price.toLocaleString('es-CL')}
                            </span>
                            {capsule.description && (
                              <span className="text-xs text-slate-500 line-clamp-1">{capsule.description}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary - Resumen de precios mejorado */}
              <div className="sticky bottom-0 bg-gradient-to-br from-slate-50 to-white border-t-2 border-slate-200 pt-4 rounded-t-xl shadow-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Base:</span>
                    <span className="font-bold text-slate-900">${basePrice.toLocaleString('es-CL')}</span>
                  </div>
                  {selectedCapsules.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Cláusulas ({selectedCapsules.length}):</span>
                      <span className="font-bold text-cyan-600">
                        +${capsules
                          .filter(c => selectedCapsules.includes(c.id))
                          .reduce((sum, c) => sum + c.price, 0)
                          .toLocaleString('es-CL')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-3 border-t-2 border-slate-200">
                    <span className="text-base font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                      Total:
                    </span>
                    <span className="text-2xl font-black bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 bg-clip-text text-transparent">
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
          line-height: 2;
          color: #1f2937;
          font-size: 15px;
          word-spacing: normal;
          letter-spacing: normal;
        }

        .contract-preview > * {
          margin-left: 0;
          margin-right: 0;
        }

        .filled-variable {
          background-color: #dbeafe;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          color: #1e40af;
          display: inline-block;
          min-width: 2ch;
          white-space: nowrap;
          word-spacing: normal;
        }

        .empty-variable {
          background-color: #fee2e2;
          padding: 2px 6px;
          border-radius: 4px;
          color: #991b1b;
          font-weight: 500;
          display: inline-block;
          white-space: nowrap;
          word-spacing: normal;
        }

        .prose h1, .prose h2, .prose h3 {
          color: #111827;
          font-weight: 700;
        }

        .prose p {
          margin-bottom: 1.25em;
          line-height: 2;
          margin-left: 0;
          margin-right: 0;
          text-align: justify;
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
          margin-bottom: 1.5rem;
          margin-top: 0;
          margin-left: 0;
          margin-right: 0;
          text-align: center;
        }

        .prose h2 {
          font-size: 1.5rem;
          margin-top: 2.5rem;
          margin-bottom: 1.25rem;
          margin-left: 0;
          margin-right: 0;
        }

        .signatures-section {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 2px solid #e5e7eb;
        }

        .signatures-section h2 {
          color: #0891b2;
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 2rem;
        }

        .signature-block {
          margin-bottom: 2rem;
          padding: 2rem;
          border: 2px solid #d1d5db;
          border-radius: 12px;
          background-color: #f9fafb;
        }

        .signature-block h3 {
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .signature-block p {
          margin: 0.75rem 0;
          font-size: 0.9375rem;
          color: #4b5563;
          line-height: 1.6;
        }

        .signature-line {
          margin-top: 2rem;
          text-align: center;
        }

        .signature-line span {
          display: inline-block;
          border-bottom: 1px solid #9ca3af;
          min-width: 250px;
          padding-bottom: 0.5rem;
        }

        .signature-line p {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
