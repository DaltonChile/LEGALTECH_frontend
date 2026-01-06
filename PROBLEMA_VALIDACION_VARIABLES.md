# Problema: Validación de Variables en el Editor de Contratos

## 📋 Resumen del Problema

Al intentar continuar al pago, el sistema validaba campos que:
1. No existían en el formulario (`FECHA_CONTRATO`, `CIUDAD_CONTRATO`)
2. Pertenecían a cápsulas NO seleccionadas

## 🔍 Causa Raíz

### Problema 1: Variables hardcodeadas inexistentes
En `ContractEditorPage.tsx`, se estaban agregando forzosamente dos variables aunque no estuvieran en el `base_form_schema`:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
if (!hasCiudad) {
  allVars.unshift('CIUDAD_CONTRATO');
}
if (!hasFecha) {
  allVars.splice(hasCiudad ? 1 : 0, 0, 'FECHA_CONTRATO');
}
```

**Consecuencia:** Se validaban campos que nunca fueron renderizados en el formulario.

### Problema 2: No se excluían variables de cápsulas no seleccionadas
La función `getAllVariables()` extraía variables de:
- ✅ Base template (`base_form_schema`)
- ✅ Cápsulas seleccionadas
- ❌ NO excluía variables de cápsulas no seleccionadas

**Consecuencia:** Si una cápsula no estaba seleccionada, sus campos aún se validaban.

### Problema 3: Case sensitivity inconsistente
El código convertía nombres de variables a minúsculas cuando no encontraba `field_name`:

```typescript
// ❌ CÓDIGO PROBLEMÁTICO
if (field.label) {
  return field.label
    .toLowerCase()  // ← Minúsculas
    .replace(/\s+/g, '_')
}
```

Pero el template tenía las variables en MAYÚSCULAS: `{{NOMBRE_ARRENDATARIO}}`

**Consecuencia:** No hacían match al reemplazar las variables en el template.

## ✅ Solución Implementada

### Fix 1: Eliminar variables hardcodeadas
```typescript
// ✅ CÓDIGO CORREGIDO
const allVars = [...baseVars, ...capsuleVars]
  .filter(v => !unselectedCapsuleVars.has(v));

const uniqueVars = Array.from(new Set(allVars));
return uniqueVars;
```

**Ahora:** Solo se incluyen variables que realmente existen en el `base_form_schema`.

### Fix 2: Excluir variables de cápsulas no seleccionadas
```typescript
// ✅ CÓDIGO AGREGADO
const unselectedCapsuleVars = new Set<string>();
(template.capsules || [])
  .filter((c) => !selectedCapsules.includes(c.id)) // ← NO seleccionadas
  .forEach((c) => {
    // Extraer todas las variables de esta cápsula
    (c.form_schema || []).forEach((field: any) => {
      const varName = field.field_name || field.name;
      if (varName) unselectedCapsuleVars.add(varName);
    });
    
    // También del legal_text
    if (c.legal_text) {
      const varRegex = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;
      let match;
      while ((match = varRegex.exec(c.legal_text)) !== null) {
        unselectedCapsuleVars.add(match[1].trim());
      }
    }
  });

// Filtrar las variables finales
const allVars = [...baseVars, ...capsuleVars]
  .filter(v => !unselectedCapsuleVars.has(v)); // ← Excluir no seleccionadas
```

**Ahora:** Las variables de cápsulas no seleccionadas NO se validan.

### Fix 3: Preservar case original de las variables
```typescript
// ✅ CÓDIGO CORREGIDO
const varName = field.field_name || field.name || field.id;
if (varName) {
  return varName; // ← Mantener case original
}
// Si no hay field_name, convertir a MAYÚSCULAS
if (field.label) {
  return field.label
    .toUpperCase() // ← Ahora en MAYÚSCULAS
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}
```

**Ahora:** 
- `field_name` se usa directamente (case original)
- Fallback a label se convierte a MAYÚSCULAS
- Match correcto con el template

## 📊 Flujo Final

```
1. Usuario carga template
   ↓
2. Se extraen variables de:
   - base_form_schema → ["NOMBRE_ARRENDATARIO", "RUT_ARRENDATARIO"]
   - Cápsulas seleccionadas → ["MONTO_GARANTIA"]
   ↓
3. Se identifican variables de cápsulas NO seleccionadas
   - Cápsula "Mascotas" (no seleccionada) → ["AUTORIZA_MASCOTAS"]
   ↓
4. Se filtran las variables finales:
   - ["NOMBRE_ARRENDATARIO", "RUT_ARRENDATARIO", "MONTO_GARANTIA"]
   - Excluye: ["AUTORIZA_MASCOTAS"]
   ↓
5. Se validan SOLO esas variables al continuar al pago
   ✅ Solo campos visibles en el formulario
```

## 🎯 Resultado

- ✅ No se validan campos inexistentes
- ✅ No se validan campos de cápsulas no seleccionadas
- ✅ Case correcto en todos los nombres de variables
- ✅ Match exitoso al reemplazar variables en el template

## 📁 Archivos Modificados

- `src/pages/public/ContractEditorPage.tsx`
  - Función `getAllVariables()` - Líneas 122-189
  - Lógica de filtrado de variables de cápsulas
  - Preservación de case en nombres de variables
