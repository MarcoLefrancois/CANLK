import { TDLForm } from '@/components/TDLForm'

function App() {
  const handleSubmit = async (data: any) => {
    console.log('Soumission TDL:', data)
    // Ici, on appellera useCreateTDL() dans une vraie implémentation
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            CANLK - Travaux de Laboratoire
          </h1>
          <p className="text-gray-600 mt-2">
            Système de gestion des demandes d'analyse en laboratoire
          </p>
        </header>

        <main>
          <TDLForm onSubmit={handleSubmit} />
        </main>
      </div>
    </div>
  )
}

export default App
