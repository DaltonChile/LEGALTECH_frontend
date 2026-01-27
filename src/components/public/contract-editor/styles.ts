export const contractEditorStyles = `
  .contract-preview {
    line-height: 1.8;
    color: #1f2937;
    font-size: 14px;
  }
  .contract-preview strong {
    font-weight: 700;
    color: #111827;
    font-size: 1.05em;
  }
  .filled-var {
    background-color: #dbeafe;
    padding: 1px 4px;
    border-radius: 3px;
    font-weight: 600;
    color: #1e40af;
    transition: all 0.3s ease;
    display: inline-block;
    white-space: nowrap;
  }
  .empty-var {
    background-color: #e5e7eb;
    padding: 1px 4px;
    border-radius: 3px;
    color: #6b7280;
    font-weight: 500;
    transition: all 0.3s ease;
    display: inline-block;
    white-space: nowrap;
  }
  .active-var {
    animation: pulse-highlight 1s ease-in-out infinite;
    box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.4);
    transform: scale(1.05);
  }
  @keyframes pulse-highlight {
    0%, 100% { box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.4); }
    50% { box-shadow: 0 0 0 6px rgba(6, 182, 212, 0.2); }
  }
  .prose p {
    margin-bottom: 1em;
    text-align: justify;
    text-align-last: left;
    word-spacing: normal;
  }
  .prose h1, .prose h2, .prose h3 {
    color: #111827;
    font-weight: 700;
  }
  .signatures-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 2px solid #e5e7eb;
  }
  .signatures-section h2 {
    color: #0891b2;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .signature-block {
    margin-bottom: 1.5rem;
    padding: 1.5rem;
    border: 2px solid #d1d5db;
    border-radius: 12px;
    background-color: #f9fafb;
  }
  .signature-block h3 {
    color: #374151;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  .signature-block p {
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: #4b5563;
  }
  
  /* Custom Scrollbar */
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #cbd5e1;
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: #94a3b8;
  }
`;
