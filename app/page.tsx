import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">🏐 Volleyball Stats</h1>
        <p className="text-xl text-gray-600 mb-8">Registra y analiza estadísticas de vóley en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-3">📋 Gestión de Jugadores</h2>
          <p className="text-gray-600 mb-4">Crea y administra tu plantel de jugadores</p>
          <Link href="/players">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Ir a Jugadores</Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-3">⚽ Crear Partido</h2>
          <p className="text-gray-600 mb-4">Inicia un nuevo partido y selecciona los jugadores</p>
          <Link href="/matches/new">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Nuevo Partido</Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-3">🎬 Mis Partidos</h2>
          <p className="text-gray-600 mb-4">Accede a todos tus partidos registrados</p>
          <Link href="/matches">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Ver Partidos</Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition">
          <h2 className="text-2xl font-bold mb-3">📊 Estadísticas</h2>
          <p className="text-gray-600 mb-4">Análisis completo de la temporada</p>
          <Link href="/season-stats">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">Ver Estadísticas</Button>
          </Link>
        </Card>
      </div>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <h3 className="font-bold text-lg mb-2">💡 Atajos de Teclado</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-bold">S</span> = Saque (Serve)
          </div>
          <div>
            <span className="font-bold">B</span> = Bloqueo (Block)
          </div>
          <div>
            <span className="font-bold">C</span> = Contra Ataque (Counter Attack)
          </div>
          <div>
            <span className="font-bold">R</span> = Ataque Rotación (Rotation Attack)
          </div>
          <div>
            <span className="font-bold">E</span> = Error Ataque (Attack Error)
          </div>
          <div>
            <span className="font-bold">1-9</span> = Número Jugador
          </div>
        </div>
      </Card>
    </div>
  )
}
