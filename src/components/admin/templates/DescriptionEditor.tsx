import { useState, useRef } from 'react';
import { RichDescription } from '../../public/contracts/RichDescription';
import { 
  Eye, 
  Code, 
  Bold, 
  Italic, 
  List, 
  Heading2, 
  Quote,
  Sparkles,
  HelpCircle,
  FileText
} from 'lucide-react';

interface DescriptionEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function DescriptionEditor({ value, onChange }: DescriptionEditorProps) {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [showHelp, setShowHelp] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper function para insertar texto en la posición del cursor
  const insertAtCursor = (before: string, after: string = '', placeholder: string = 'texto') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      before + textToInsert + after + 
      value.substring(end);
    
    onChange(newValue);
    
    // Reposicionar cursor
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        // Si había texto seleccionado, posicionar después del texto insertado
        const newPosition = start + before.length + textToInsert.length + after.length;
        textarea.setSelectionRange(newPosition, newPosition);
      } else {
        // Si no había selección, seleccionar el placeholder
        const placeholderStart = start + before.length;
        const placeholderEnd = placeholderStart + placeholder.length;
        textarea.setSelectionRange(placeholderStart, placeholderEnd);
      }
    }, 0);
  };

  // Botones de formato
  const formatButtons = [
    { icon: Bold, label: 'Negrita', action: () => insertAtCursor('**', '**', 'texto en negrita') },
    { icon: Italic, label: 'Cursiva', action: () => insertAtCursor('*', '*', 'texto en cursiva') },
    { icon: Heading2, label: 'Subtítulo', action: () => insertAtCursor('\n## ', '', 'Título de sección') },
    { icon: List, label: 'Lista', action: () => insertAtCursor('\n- ', '', 'Item de lista') },
    { icon: Quote, label: 'Nota', action: () => insertAtCursor('\n> **Nota:** ', '', 'Información importante') },
    { icon: Sparkles, label: 'Badge', action: () => insertAtCursor('`badge:', '`', 'Etiqueta') },
  ];

  // Templates predefinidos
  const templates: Record<string, string> = {
    basic: `## ¿Qué incluye este contrato?

- **Identificación completa** de las partes involucradas
- **Descripción detallada** de los términos
- **Derechos y obligaciones** de ambas partes
- **Condiciones de término** del acuerdo

## Casos de uso ideales

Este contrato es perfecto para:
- Situación 1
- Situación 2
- Situación 3

## Lo que necesitarás preparar

- Documento 1
- Documento 2
- Documento 3

> **Nota importante:** Este contrato tiene plena validez legal una vez firmado por todas las partes.`,
    
    full: `## ¿Qué es este contrato?

[Descripción general en 2-3 líneas explicando el propósito del documento]

## ¿Qué incluye este documento?

- **Punto 1** - Descripción del punto 1
- **Punto 2** - Descripción del punto 2
- **Punto 3** - Descripción del punto 3
- **Punto 4** - Descripción del punto 4

## Características principales

\`badge:Validez legal\` \`badge:Sin notario\` \`badge:Entrega inmediata\`

## Casos de uso ideales

Este contrato es perfecto para:
- ✓ Caso de uso 1
- ✓ Caso de uso 2
- ✓ Caso de uso 3

## Lo que necesitarás preparar

- RUT de todas las partes
- [Documento específico 1]
- [Documento específico 2]
- [Información específica 3]

> **Nota importante:** Este contrato tiene plena validez legal una vez firmado por todas las partes. [Agregar información adicional si requiere notario u otros requisitos].`,

    arrendamiento: `## ¿Qué es el Contrato de Arrendamiento?

Un contrato de arrendamiento es un acuerdo legal entre un **arrendador** (dueño) y un **arrendatario** (inquilino) para el uso temporal de un inmueble a cambio de un pago periódico.

## ¿Qué incluye este contrato?

- **Identificación completa** de arrendador y arrendatario
- **Descripción detallada** del inmueble (dirección, características)
- **Valor del arriendo** y forma de pago
- **Plazo** del contrato (definido o indefinido)
- **Garantías** y depósitos
- **Derechos y obligaciones** de ambas partes
- **Condiciones de término** y renovación

## Casos de uso ideales

\`badge:Vivienda habitacional\` \`badge:Local comercial\` \`badge:Oficinas\`

Este contrato es perfecto para:
- Arrendamiento de casas o departamentos
- Locales comerciales pequeños y medianos
- Espacios de oficina
- Bodegas y espacios de almacenamiento

## Lo que necesitarás preparar

- RUT del arrendador y arrendatario
- Dirección exacta del inmueble
- Monto mensual del arriendo
- Fecha de inicio del contrato
- Monto de la garantía (si aplica)
- Gastos comunes (si aplica)

> **Nota importante:** Este contrato tiene plena validez legal una vez firmado por ambas partes. No requiere notarización obligatoria, aunque puedes optar por añadir este servicio para mayor seguridad.`,

    trabajo: `## ¿Qué es el Contrato de Trabajo?

Un contrato de trabajo es el acuerdo legal que establece la relación laboral entre un **empleador** y un **trabajador**, definiendo las condiciones de empleo, funciones, y remuneración.

## ¿Qué incluye este contrato?

- **Identificación** del empleador y trabajador
- **Descripción del cargo** y funciones
- **Jornada laboral** y horarios
- **Remuneración** y beneficios
- **Período de prueba** (si aplica)
- **Duración** del contrato
- **Condiciones de término**

## Características principales

\`badge:Validez legal\` \`badge:Cumple normativa laboral\` \`badge:Actualizado\`

## Casos de uso ideales

Este contrato es perfecto para:
- Contratación de trabajadores a plazo fijo
- Contratación indefinida
- Trabajos por obra o faena
- Primer empleo

## Lo que necesitarás preparar

- RUT del empleador y trabajador
- Dirección del lugar de trabajo
- Descripción de funciones
- Sueldo base y beneficios
- Fecha de inicio
- Jornada laboral

> **Nota importante:** Este contrato cumple con todas las disposiciones del Código del Trabajo chileno y debe ser firmado en 2 copias, quedando una para cada parte.`,

    servicios: `## ¿Qué es el Contrato de Prestación de Servicios?

Un contrato de prestación de servicios regula la relación entre un **cliente** y un **prestador de servicios** independiente, estableciendo los términos para la realización de un trabajo específico.

## ¿Qué incluye este contrato?

- **Identificación** de las partes
- **Descripción detallada** del servicio
- **Plazos** de entrega
- **Honorarios** y forma de pago
- **Obligaciones** de ambas partes
- **Confidencialidad**
- **Propiedad intelectual**

## Características principales

\`badge:Sin relación laboral\` \`badge:Flexible\` \`badge:Para independientes\`

## Casos de uso ideales

Este contrato es perfecto para:
- Servicios profesionales (contadores, abogados, consultores)
- Trabajos freelance
- Proyectos específicos
- Servicios técnicos especializados

## Lo que necesitarás preparar

- RUT de ambas partes
- Descripción detallada del servicio
- Plazos de entrega
- Monto de honorarios
- Forma y fechas de pago

> **Nota importante:** Este contrato NO establece relación laboral. El prestador de servicios actúa de manera independiente y es responsable de sus propias obligaciones tributarias y previsionales.`
  };

  const insertTemplate = (templateKey: string) => {
    if (templateKey && templates[templateKey]) {
      onChange(templates[templateKey]);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Tabs y Templates */}
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'edit'
                ? 'bg-white text-navy-900 border-b-2 border-navy-900'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            <Code className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === 'preview'
                ? 'bg-white text-navy-900 border-b-2 border-navy-900'
                : 'text-slate-600 hover:text-navy-900'
            }`}
          >
            <Eye className="w-4 h-4" />
            Vista Previa
          </button>
        </div>
        
        <div className="flex items-center gap-2 px-4">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className={`transition-colors p-1.5 rounded ${showHelp ? 'text-navy-900 bg-navy-100' : 'text-slate-500 hover:text-navy-900'}`}
            title="Ayuda de Markdown"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <select
            onChange={(e) => {
              if (e.target.value) {
                if (value.trim() && !confirm('¿Reemplazar el contenido actual con la plantilla seleccionada?')) {
                  e.target.value = '';
                  return;
                }
                insertTemplate(e.target.value);
                e.target.value = '';
              }
            }}
            className="text-xs border border-slate-200 rounded px-2 py-1 text-slate-600 hover:border-navy-900 focus:outline-none focus:border-navy-900 bg-white"
            value=""
          >
            <option value="">📝 Insertar plantilla...</option>
            <option value="basic">Plantilla Básica</option>
            <option value="full">Plantilla Completa</option>
            <option value="arrendamiento">Contrato Arrendamiento</option>
            <option value="trabajo">Contrato de Trabajo</option>
            <option value="servicios">Prestación de Servicios</option>
          </select>
        </div>
      </div>

      {/* Ayuda rápida (colapsable) */}
      {showHelp && (
        <div className="bg-blue-50 border-b border-blue-200 p-3 text-xs text-blue-900">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div><code className="bg-blue-100 px-1 rounded">**texto**</code> = <strong>negrita</strong></div>
            <div><code className="bg-blue-100 px-1 rounded">*texto*</code> = <em>cursiva</em></div>
            <div><code className="bg-blue-100 px-1 rounded">## Título</code> = Subtítulo</div>
            <div><code className="bg-blue-100 px-1 rounded">- Item</code> = Lista con ✓</div>
            <div><code className="bg-blue-100 px-1 rounded">&gt; Nota</code> = Cita destacada</div>
            <div><code className="bg-blue-100 px-1 rounded">`badge:texto`</code> = Badge colorido</div>
          </div>
        </div>
      )}

      {/* Toolbar de formato (solo en modo edición) */}
      {activeTab === 'edit' && (
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 flex-wrap">
          {formatButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.action}
              type="button"
              className="flex items-center gap-1 px-2 py-1.5 text-slate-600 hover:bg-white hover:text-navy-900 rounded transition-colors text-xs font-medium"
              title={btn.label}
            >
              <btn.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        {activeTab === 'edit' ? (
          <div>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full h-96 p-4 font-mono text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-navy-900 focus:ring-1 focus:ring-navy-900 resize-y"
              placeholder={`Escribe la descripción del contrato en formato Markdown...

Ejemplo:
## ¿Qué incluye este contrato?

- **Punto importante** con descripción
- Otro punto relevante

\`badge:Validez legal\``}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <div>
                Usa los botones de arriba para dar formato o escribe directamente en Markdown
              </div>
              <div>
                {value.length} caracteres
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg p-6 min-h-96 max-h-125 overflow-y-auto">
            {value ? (
              <RichDescription content={value} />
            ) : (
              <div className="text-center text-slate-400 py-20">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>La vista previa aparecerá aquí</p>
                <p className="text-xs mt-1">Escribe algo en la pestaña de Editar</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DescriptionEditor;
