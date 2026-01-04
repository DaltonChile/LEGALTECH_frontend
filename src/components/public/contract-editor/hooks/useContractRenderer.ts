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
  signersConfig,
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

    // 1. Replace NUMERACIÓN with dynamic numbers
    if (clauseNumbering && clauseNumbering.length > 0) {
      clauseNumbering.forEach(clause => {
        const number = clauseNumbers[clause.order];
        if (number) {
          const regex = new RegExp(`NUMERACI[OÓ]N\\s*:\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
          result = result.replace(regex, `${number}: ${clause.title}`);
        }
      });
    }

    // 2. Replace variables with values
    extractedVariables.forEach((variable) => {
      if (!variable) return;
      const value = formData[variable] || '';
      const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*[^}]*)?\\s*\\}\\}`, 'gi');
      const isActive = activeField === variable;
      
      if (value) {
        result = result.replace(regex, `<span class="filled-var${isActive ? ' active-var' : ''}" data-var="${variable}">${value}</span>`);
      } else {
        result = result.replace(regex, `<span class="empty-var${isActive ? ' active-var' : ''}" data-var="${variable}">[${formatVariableName(variable)}]</span>`);
      }
    });

    // 3. Process capsules
    capsules.forEach(capsule => {
      if (!capsule.title) return;
      
      const isSelected = selectedCapsules.includes(capsule.id);
      const escapedTitle = capsule.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const capsulePattern = `\\[\\s*CAPSULA\\s*:\\s*${escapedTitle}[^\\]]*\\]([\\s\\S]*?)\\[\\s*/\\s*CAPSULA\\s*\\]`;
      const capsuleRegex = new RegExp(capsulePattern, 'gi');
      
      if (isSelected) {
        result = result.replace(capsuleRegex, (_fullMatch, capsuleContent) => {
          let processedContent = capsuleContent;
          
          // Replace numbering in capsules
          if (clauseNumbering) {
            clauseNumbering
              .filter(clause => clause.is_in_capsule && clause.capsule_slug === capsule.slug)
              .forEach(clause => {
                const number = clauseNumbers[clause.order];
                if (number) {
                  const numRegex = new RegExp(`NUMERACI[OÓ]N\\s*:\\s*${clause.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi');
                  processedContent = processedContent.replace(numRegex, `${number}: ${clause.title}`);
                }
              });
          }
          
          // Replace variables in capsule content
          extractedVariables.forEach((variable) => {
            if (!variable) return;
            const value = formData[variable] || '';
            const escapedVar = variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\{\\{\\s*${escapedVar}(?:\\s*:\\s*[^}]*)?\\s*\\}\\}`, 'gi');
            
            if (value) {
              processedContent = processedContent.replace(regex, `<span class="filled-var">${value}</span>`);
            } else {
              processedContent = processedContent.replace(regex, `<span class="empty-var">[${formatVariableName(variable)}]</span>`);
            }
          });
          
          return `\n${processedContent}\n`;
        });
      } else {
        result = result.replace(capsuleRegex, '');
      }
    });

    // 4. Remove signature blocks from main content
    result = result.replace(/\[\s*FIRMA\s*:[^\]]+\]([\s\S]*?)\[\s*\/\s*FIRMA\s*\]/gi, '');

    // 5. Add signatures section at the end
    if (signersConfig && signersConfig.length > 0) {
      result += '\n\n<div class="signatures-section"><h2>Firmas</h2>\n';
      
      signersConfig
        .sort((a, b) => a.signature_order - b.signature_order)
        .forEach(signer => {
          const nameValue = formData[signer.name_variable];
          const rutValue = formData[signer.rut_variable];
          
          const name = nameValue 
            ? `<span class="filled-var">${nameValue}</span>`
            : `<span class="empty-var">[${formatVariableName(signer.name_variable)}]</span>`;
          
          const rut = rutValue
            ? `<span class="filled-var">${rutValue}</span>`
            : `<span class="empty-var">[${formatVariableName(signer.rut_variable)}]</span>`;
          
          result += `
            <div class="signature-block">
              <h3>${signer.display_name}</h3>
              <p><strong>Nombre:</strong> ${name}</p>
              <p><strong>RUT:</strong> ${rut}</p>
            </div>
          `;
        });
      
      result += '</div>';
    }

    return result;
  }, [templateText, formData, extractedVariables, selectedCapsules, capsules, clauseNumbers, clauseNumbering, signersConfig, activeField]);

  return { renderedContract, clauseNumbers };
}
