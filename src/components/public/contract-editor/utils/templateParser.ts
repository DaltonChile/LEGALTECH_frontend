import type { Capsule } from '../types';

/**
 * Extract variables from template text, excluding those in unselected capsules
 */
export function extractVariables(
  templateText: string,
  capsules: Capsule[],
  selectedCapsules: number[]
): string[] {
  // Find variables in unselected capsules to exclude them
  const unselectedCapsuleVars = new Set<string>();
  
  capsules.forEach(capsule => {
    if (!selectedCapsules.includes(capsule.id) && capsule.title) {
      const escapedTitle = capsule.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const capsulePattern = `\\[\\s*CAPSULA\\s*:\\s*${escapedTitle}[^\\]]*\\]([\\s\\S]*?)\\[\\s*/\\s*CAPSULA\\s*\\]`;
      const capsuleRegex = new RegExp(capsulePattern, 'gi');
      const capsuleMatch = templateText.match(capsuleRegex);
      
      if (capsuleMatch) {
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
  
  // Extract all variables from template in ORDER OF APPEARANCE
  const seenVars = new Set<string>();
  const orderedVars: string[] = [];
  const regex = /\{\{([^}:]+)(?::([^}]*))?\}\}/g;
  let match;
  
  while ((match = regex.exec(templateText)) !== null) {
    const varName = match[1].trim();
    if (varName && 
        !varName.toUpperCase().startsWith('NUMERACI') && 
        !unselectedCapsuleVars.has(varName) &&
        !seenVars.has(varName)) {
      seenVars.add(varName);
      orderedVars.push(varName);
    }
  }
  
  return orderedVars;
}

/**
 * Format variable name for display (snake_case to Title Case)
 */
export function formatVariableName(variable: string): string {
  if (!variable) return '';
  return variable
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Spanish ordinals for clause numbering
 */
export const ORDINALS = [
  'PRIMERA', 'SEGUNDA', 'TERCERA', 'CUARTA', 'QUINTA',
  'SEXTA', 'SÉPTIMA', 'OCTAVA', 'NOVENA', 'DÉCIMA',
  'UNDÉCIMA', 'DUODÉCIMA', 'DECIMOTERCERA', 'DECIMOCUARTA', 'DECIMOQUINTA'
];
