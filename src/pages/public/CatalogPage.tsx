import { Navbar } from '../../components/landing/Navbar';
import { ContractCatalog } from '../../components/public/contracts/ContractCatalog';
import { PageFooter } from '../../components/shared/PageFooter';

export function CatalogPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-navy-900 to-navy-800 py-16 px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">
              Catálogo de Documentos Legales
            </h1>
            <p className="text-lg text-slate-300 max-w-3xl mx-auto">
              Encuentra el documento legal que necesitas, complétalo en minutos y obtén un contrato con validez legal en Chile
            </p>
          </div>
        </section>

        {/* Catalog */}
        <ContractCatalog />
      </main>

      <PageFooter />
    </div>
  );
}
