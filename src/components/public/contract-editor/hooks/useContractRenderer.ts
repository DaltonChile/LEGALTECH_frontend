import { useMemo } from 'react';
import type { Capsule, ClauseNumbering, SignerConfig } from '../types';
import { formatVariableName, ORDINALS } from '../utils/templateParser';

interface UseContractRendererProps {
  templateText: string;
  formData: Record<string, string>;
  extractedVariables: string[];
  capsules: Capsule[];
  selectedCapsules: number[];
  clauseNumbering: ClauseNumbering[];
  signersConfig: SignerConfig[];
  activeField: string | null;
}

export function useContractRenderer({
  templateText,
  formData,
  extractedVariables,
  capsules,
  selectedCapsules,
  clauseNumbering,
  activeField,
}: UseContractRendererProps) {
  // Calculate dynamic clause numbers based on selected capsules
  const clauseNumbers = useMemo(() => {
    if (!clauseNumbering || clauseNumbering.length === 0) return {};

    const selectedCapsuleSlugs = capsules
      .filter(c => selectedCapsules.includes(c.id))
      .map(c => c.slug);

    const numberMap: Record<number, string> = {};
    let currentNumber = 1;

    clauseNumbering.forEach(clause => {
      if (clause.is_in_capsule && clause.capsule_slug) {
        if (!selectedCapsuleSlugs.includes(clause.capsule_slug)) return;
      }
      numberMap[clause.order] = ORDINALS[currentNumber - 1] || `CLÁUSULA ${currentNumber}`;
      currentNumber++;
    });

    return numberMap;
  }, [clauseNumbering, selectedCapsules, capsules]);

  // Render the contract HTML
  const renderedContract = useMemo(() => {
    let result = templateText;

    // 1. FIRST: Process capsules to handle their content including numbering
    capsules.forEach(capsule => {
      if (!capsule.title) return;
      
      const isSelected = selectedCapsules.includes(capsule.id);
      const escapedTitle = capsule.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const capsulePattern = `\\[\\s*CAPSULA\\s*:\\s*${escapedTitle}[^\\]]*\\]([\\s\\S]*?)\\[\\s*/\\s*CAPSULA\\s*\\]`;
      const capsuleRegex = new RegExp(capsulePattern, 'gi');
      
      if (isSelected) {
        result = result.replace(capsuleRegex, (_fullMatch, capsuleContent) => {
          let processedContent = capsuleContent;
          
          // A. Apply numbering FIRST within capsules
          if (clauseNumbering) {
            clauseNumbering
              .filter(clause => clause.is_in_capsule && clause.capsule_slug === capsule.slug)
              .forEach(clause => {
                const number = clauseNumbers[clause.order];
                if (number) {
                  const numRegex = new RegExp(`NUMERACI[OÓ]N\\s*:\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
                  processedContent = processedContent.replace(numRegex, `<strong>${number}:</strong> ${clause.title}`);
                }
              });
          }
          
          // B. Then replace variables in capsule content
          extractedVariables.forEach((variable) => {
            if (!variable) return;
            const value = formData[variable] || '';
            const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*[^}]*)?\\s*\\}\\}`, 'gi');
            const isActive = activeField === variable;
            
            if (value) {
              processedContent = processedContent.replace(regex, `<span class="filled-var${isActive ? ' active-var' : ''}" data-variable="${variable}">${value}</span>`);
            } else {
              processedContent = processedContent.replace(regex, `<span class="empty-var${isActive ? ' active-var' : ''}" data-variable="${variable}">[${formatVariableName(variable)}]</span>`);
            }
          });
          
          return `\n${processedContent}\n`;
        });
      } else {
        // Remove unselected capsules
        result = result.replace(capsuleRegex, '');
      }
    });

    // 2. Apply NUMERACIÓN for clauses NOT in capsules (base content)
    if (clauseNumbering && clauseNumbering.length > 0) {
      clauseNumbering
        .filter(clause => !clause.is_in_capsule) // Only base content clauses
        .forEach(clause => {
          const number = clauseNumbers[clause.order];
          if (number) {
            const regex = new RegExp(`NUMERACI[OÓ]N\\s*:\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
            result = result.replace(regex, `<strong>${number}:</strong> ${clause.title}`);
          }
        });
    }

    // 3. Replace variables with values in base content
    // 3. Replace variables with values in base content
    extractedVariables.forEach((variable) => {
      if (!variable) return;
      const value = formData[variable] || '';
      const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*[^}]*)?\\s*\\}\\}`, 'gi');
      const isActive = activeField === variable;
      
      if (value) {
        result = result.replace(regex, `<span class="filled-var${isActive ? ' active-var' : ''}" data-variable="${variable}">${value}</span>`);
      } else {
        result = result.replace(regex, `<span class="empty-var${isActive ? ' active-var' : ''}" data-variable="${variable}">[${formatVariableName(variable)}]</span>`);
      }
    });

    // 4. Remove signature blocks from main content (they're rendered separately)
    result = result.replace(/\[\s*FIRMA\s*:[^\]]+\]([\s\S]*?)\[\s*\/\s*FIRMA\s*\]/gi, '');

    return result;
  }, [templateText, formData, extractedVariables, selectedCapsules, capsules, clauseNumbers, clauseNumbering, activeField]);

  return { renderedContract, clauseNumbers };
}
