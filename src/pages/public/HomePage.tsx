import { Navbar, Hero, HowItWorks } from '../../components/landing';
import { ContractCatalog } from '../../components/public/contracts';
import { PageFooter } from '../../components/shared/PageFooter';

export function HomePage() {
  return (
    <div className="min-h-screen relative bg-slate-50">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-white via-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10">
        <Navbar />
        <Hero />
        <HowItWorks />
        <ContractCatalog />
        
        <PageFooter />
      </div>
    </div>
  );
}
