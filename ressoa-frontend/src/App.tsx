import { Button } from "@/components/ui/button"

function App() {
  return (
    <div className="min-h-screen bg-ghost-white flex flex-col items-center justify-center p-4">
      <h1 className="text-h1 font-montserrat font-bold text-deep-navy mb-4">
        Ressoa AI
      </h1>
      <p className="text-body text-center max-w-md mb-8 text-gray-600">
        Inteligência de Aula, Análise e Previsão de Conteúdo
      </p>
      <Button className="bg-tech-blue hover:bg-tech-blue/90 text-white">
        Começar
      </Button>
    </div>
  )
}

export default App
