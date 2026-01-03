import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
  title?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  children, 
  onClose, 
  wide = false,
  title 
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl ${wide ? 'max-w-xl' : 'max-w-lg'} w-full max-h-[90vh] overflow-y-auto relative`}>
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          {title && <h2 className="text-xl font-bold text-slate-900">{title}</h2>}
          <button 
            onClick={onClose}
            className="ml-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
