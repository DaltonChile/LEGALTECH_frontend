import { type LucideIcon, Info, Users, UserCheck, Scale } from 'lucide-react';
import { useState } from 'react';
import { ContractInfoModal } from './ContractInfoModal';
import { getFlowBadgeInfo } from '../../../utils/flowConfig';

interface Capsule {
  id: string;
  title: string;
  description?: string;
  price: number;
}

interface ContractCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  price: number;
  isPopular?: boolean;
  onPersonalize: () => void;
  capsules?: Capsule[];
  requiresNotary?: boolean;
  hasSigners?: boolean;
}

// Mapeo de iconos basado en el nombre del icono
const iconMap = {
  'none': null,
  'scale': Scale,
  'users': Users,
  'user-check': UserCheck,
};

export function ContractCard({ 
  icon: Icon, 
  title, 
  description, 
  price, 
  isPopular,
  onPersonalize,
  capsules,
  requiresNotary = false,
  hasSigners = false
}: ContractCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsModalOpen(true);
  };

  const badgeInfo = getFlowBadgeInfo(hasSigners, requiresNotary);
  const BadgeIcon = iconMap[badgeInfo.iconName];

  return (
    <>
      <div className={`group relative bg-white rounded-lg p-6 hover:shadow-document-hover transition-all duration-300 border border-slate-200 ${
        isPopular 
          ? 'ring-2 ring-legal-emerald-500 shadow-document' 
          : 'shadow-document hover:border-slate-300'
      }`}>
        {isPopular && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="bg-legal-emerald-600 text-white px-4 py-1 rounded-full text-xs shadow-lg font-semibold font-sans">
              Más Popular
            </span>
          </div>
        )}

        {/* Info button - más visible */}
        <button
          onClick={handleInfoClick}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-navy-100 text-slate-500 hover:text-navy-900 transition-all duration-200"
          title="Ver descripción del contrato"
        >
          <Info className="w-4 h-4" />
        </button>
        
        <div className="flex flex-col h-full">
          <div className="mb-5">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              isPopular 
                ? 'bg-legal-emerald-600 shadow-md' 
                : 'bg-navy-900'
            } transition-all duration-300`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>

          <div className="flex-1 space-y-3 mb-6">
            <h3 className="text-lg font-serif font-bold text-navy-900">{title}</h3>
            
            {/* Flow type badge */}
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium font-sans ${badgeInfo.colorClass}`}>
              {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
              <span>{badgeInfo.label}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-slate-500 font-sans">Desde</span>
              <span className="text-2xl text-navy-900 font-bold font-sans">{formatPrice(price)}</span>
            </div>

            <button 
              onClick={onPersonalize}
              className={`w-full py-3 rounded-lg transition-all duration-200 font-medium font-sans ${
                isPopular
                  ? 'bg-legal-emerald-600 hover:bg-legal-emerald-700 text-white shadow-md hover:shadow-lg'
                  : 'bg-navy-900 hover:bg-navy-800 text-white shadow-sm hover:shadow-md'
              }`}
            >
              Personalizar ahora
            </button>
          </div>
        </div>
      </div>

      <ContractInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={title}
        description={description}
        capsules={capsules}
      />
    </>
  );
}
