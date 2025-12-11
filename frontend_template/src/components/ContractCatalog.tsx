import { ContractCard } from './ContractCard';
import { Home, Briefcase, FileText, ShieldCheck, Users, HandshakeIcon } from 'lucide-react';

const contracts = [
  {
    id: 'arrendamiento',
    icon: Home,
    title: 'Contrato de Arrendamiento',
    description: 'Alquila propiedades de forma segura con todas las cláusulas legales necesarias.',
    price: '$15.000',
    isPopular: true
  },
  {
    id: 'compraventa',
    icon: HandshakeIcon,
    title: 'Promesa de Compraventa',
    description: 'Formaliza la promesa de compra de bienes raíces con validez legal completa.',
    price: '$18.000',
    isPopular: false
  },
  {
    id: 'prestacion',
    icon: Briefcase,
    title: 'Prestación de Servicios',
    description: 'Define claramente los términos de tu trabajo freelance o consultoría profesional.',
    price: '$12.000',
    isPopular: false
  },
  {
    id: 'confidencialidad',
    icon: ShieldCheck,
    title: 'Acuerdo de Confidencialidad (NDA)',
    description: 'Protege información sensible de tu negocio con un NDA profesional.',
    price: '$10.000',
    isPopular: false
  },
  {
    id: 'sociedad',
    icon: Users,
    title: 'Contrato de Sociedad',
    description: 'Establece los términos de tu sociedad comercial con claridad legal.',
    price: '$25.000',
    isPopular: false
  },
  {
    id: 'trabajo',
    icon: FileText,
    title: 'Contrato de Trabajo',
    description: 'Contrata empleados con todos los requisitos legales laborales chilenos.',
    price: '$14.000',
    isPopular: false
  }
];

export function ContractCatalog() {
  const handlePersonalize = (contractId: string) => {
    console.log('Personalizar contrato:', contractId);
    // Aquí iría la navegación al flujo de personalización
  };

  return (
    <section className="py-24 px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-5xl text-slate-900">
            Elige tu contrato
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Selecciona el tipo de contrato que necesitas, personalízalo con tu información y recibe tu documento listo para firmar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {contracts.map((contract) => (
            <ContractCard
              key={contract.id}
              icon={contract.icon}
              title={contract.title}
              description={contract.description}
              price={contract.price}
              isPopular={contract.isPopular}
              onPersonalize={() => handlePersonalize(contract.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}