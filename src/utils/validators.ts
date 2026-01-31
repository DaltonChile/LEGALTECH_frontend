/**
 * Shared validation utilities for RUT, email, and phone numbers
 * These validators are used across all input forms for consistency
 */

// ============================================================================
// RUT Validation (Chilean National ID)
// ============================================================================

/**
 * Format RUT as user types (e.g., 12.345.678-9)
 */
export function formatRut(value: string): string {
  // Remove everything except digits and K
  let rut = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (rut.length > 1) {
    // Separate body from verification digit
    const dv = rut.slice(-1);
    let body = rut.slice(0, -1);
    // Add dots every 3 digits from the right
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    rut = body + '-' + dv;
  }
  return rut;
}

/**
 * Validate Chilean RUT format and verification digit
 * Returns true if the RUT is valid
 */
export function isValidRut(rut: string): boolean {
  if (!rut || rut.length < 3) return false;
  const cleanRut = rut.replace(/[.-]/g, '').toUpperCase();
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  if (!/^\d+$/.test(body)) return false;
  
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const expectedDv = 11 - (sum % 11);
  const dvChar = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
  
  return dv === dvChar;
}

/**
 * Validate RUT format (XXXXXXXX-X without dots, with dash)
 * Used for form field validation display
 */
export function validateRutFormat(value: string): string | null {
  if (!value || value.trim() === '') return null; // Empty is ok (will be caught by completion check)
  const rutPattern = /^\d{7,8}-[\dkK]$/;
  if (!rutPattern.test(value.trim())) {
    return 'Debe ser formato XXXXXXXX-X (sin puntos, con guion)';
  }
  return null;
}

/**
 * Validate RUT with full verification (format + check digit)
 */
export function validateRut(value: string): string | null {
  if (!value || value.trim() === '') return null;
  
  // First check format
  const cleanValue = value.replace(/\./g, ''); // Remove dots if present
  const rutPattern = /^\d{7,8}-[\dkK]$/;
  if (!rutPattern.test(cleanValue.trim())) {
    return 'Debe ser formato XXXXXXXX-X (sin puntos, con guion)';
  }
  
  // Then validate check digit
  if (!isValidRut(value)) {
    return 'El RUT ingresado no es válido';
  }
  
  return null;
}

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.trim() === '') return false;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email.trim());
}

/**
 * Validate email for form field display
 */
export function validateEmail(value: string): string | null {
  if (!value || value.trim() === '') return null; // Empty is ok (will be caught by completion check)
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value.trim())) {
    return 'Debe ser un email válido (ejemplo@dominio.com)';
  }
  return null;
}

// ============================================================================
// Phone Validation (Chilean format)
// ============================================================================

/**
 * Validate Chilean phone number format
 * Accepts: +56912345678, 56912345678, 912345678
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return false;
  const cleaned = phone.replace(/\s/g, '');
  const phonePattern = /^(\+?56)?9\d{8}$/;
  return phonePattern.test(cleaned);
}

/**
 * Validate phone for form field display
 */
export function validatePhone(value: string): string | null {
  if (!value || value.trim() === '') return 'Teléfono es requerido';
  
  const cleaned = value.replace(/\s/g, '');
  const phonePattern = /^(\+?56)?9\d{8}$/;
  
  if (!phonePattern.test(cleaned)) {
    return 'Formato: +56912345678 o 912345678';
  }
  return null;
}

/**
 * Format phone number as user types
 */
export function formatPhone(value: string): string {
  // Remove everything except digits and +
  let phone = value.replace(/[^\d+]/g, '');
  
  // If starts with +56, format accordingly
  if (phone.startsWith('+56')) {
    const rest = phone.slice(3);
    if (rest.length > 9) {
      phone = '+56' + rest.slice(0, 9);
    }
  } else if (phone.startsWith('56')) {
    const rest = phone.slice(2);
    if (rest.length > 9) {
      phone = '56' + rest.slice(0, 9);
    }
  } else if (phone.startsWith('9')) {
    if (phone.length > 9) {
      phone = phone.slice(0, 9);
    }
  }
  
  return phone;
}

// ============================================================================
// Name Validation
// ============================================================================

/**
 * Validate name field (minimum 2 characters)
 */
export function validateName(value: string): string | null {
  if (!value || value.trim() === '') return null; // Empty is ok (will be caught by completion check)
  if (value.trim().length < 2) {
    return 'El nombre debe tener al menos 2 caracteres';
  }
  return null;
}

// ============================================================================
// Field Type Detection
// ============================================================================

/**
 * Check if a variable name indicates a name field
 */
export function isNameField(variable: string): boolean {
  return variable.toLowerCase().includes('nombre');
}

/**
 * Check if a variable name indicates a RUT field
 */
export function isRutField(variable: string): boolean {
  return variable.toLowerCase().includes('rut');
}

/**
 * Check if a variable name indicates an email field
 */
export function isEmailField(variable: string): boolean {
  const v = variable.toLowerCase();
  return v.includes('email') || v.includes('correo') || v.includes('mail');
}

/**
 * Check if a variable name indicates a phone field
 */
export function isPhoneField(variable: string): boolean {
  const v = variable.toLowerCase();
  return v.includes('telefono') || v.includes('teléfono') || v.includes('celular') || v.includes('phone');
}

/**
 * Get validation error for a field based on its variable name
 */
export function getFieldValidationError(variable: string, value: string): string | null {
  if (isNameField(variable)) {
    return validateName(value);
  }
  if (isRutField(variable)) {
    return validateRutFormat(value);
  }
  if (isEmailField(variable)) {
    return validateEmail(value);
  }
  if (isPhoneField(variable)) {
    return validatePhone(value);
  }
  return null;
}
