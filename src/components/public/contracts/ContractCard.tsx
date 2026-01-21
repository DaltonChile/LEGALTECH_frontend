import { type LucideIcon, HelpCircle, Users, UserCheck, Scale } from 'lucide-react';
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
      <div className={`group relative bg-white rounded-2xl p-8 hover:shadow-2xl transition-all duration-300 ${
        isPopular 
          ? 'border-2 border-blue-600 shadow-lg shadow-blue-100' 
          : 'border border-slate-200 hover:border-cyan-200'
      }`}>
        {isPopular && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2">
            <span className="bg-gradient-to-r from-blue-600 to-lime-500 text-white px-5 py-1.5 rounded-full text-sm shadow-lg font-medium">
              Más Popular
            </span>
          </div>
        )}

        {/* Info button */}
        <button
          onClick={handleInfoClick}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-600 transition-all duration-200 group/info"
          title="Ver información del contrato"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        
        <div className="flex flex-col h-full">
          <div className="mb-6">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              isPopular 
                ? 'bg-gradient-to-br from-blue-600 to-cyan-600 shadow-lg shadow-blue-200' 
                : 'bg-slate-100 group-hover:bg-cyan-50'
            } transition-all duration-300`}>
              <Icon className={`w-7 h-7 ${isPopular ? 'text-white' : 'text-slate-700 group-hover:text-blue-600'}`} />
            </div>
          </div>

          <div className="flex-1 space-y-4 mb-8">
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
            
            {/* Flow type badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${badgeInfo.colorClass}`}>
              {BadgeIcon && <BadgeIcon className="w-3.5 h-3.5" />}
              <span>{badgeInfo.label}</span>
            </div>
          </div>

          <div className="space-y-5">
            <div className="flex items-baseline gap-2">
              <span className="text-sm text-slate-500">Desde</span>
              <span className="text-3xl text-slate-900 font-bold">{formatPrice(price)}</span>
            </div>

            <button 
              onClick={onPersonalize}
              className={`w-full py-3.5 rounded-xl transition-all duration-200 font-medium ${
                isPopular
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-200 hover:shadow-xl'
                  : 'bg-slate-900 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
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
