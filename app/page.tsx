import { Card } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  const menuItems = [
    {
      href: "/matches/new",
      label: "Nuevo Partido",
      icon: "➜",
      description: "Inicia un nuevo partido",
      color: "from-amber-50 to-amber-100 border-amber-200",
      textColor: "text-amber-700",
      buttonColor: "bg-amber-600 hover:bg-amber-700"
    },
    {
      href: "/matches",
      label: "Cargar Partido",
      icon: "📂",
      description: "Accede a tus partidos",
      color: "from-blue-50 to-blue-100 border-blue-200",
      textColor: "text-blue-700",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      href: "/season-stats",
      label: "Estadísticas",
      icon: "📊",
      description: "Análisis de la temporada",
      color: "from-emerald-50 to-emerald-100 border-emerald-200",
      textColor: "text-emerald-700",
      buttonColor: "bg-emerald-600 hover:bg-emerald-700"
    },
    {
      href: "/players",
      label: "Jugadores",
      icon: "👥",
      description: "Gestiona tu plantel",
      color: "from-purple-50 to-purple-100 border-purple-200",
      textColor: "text-purple-700",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="text-center py-8 md:py-12 bg-white border-b border-slate-200">
        <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">Volleyball Stats</h1>
        <p className="text-sm md:text-base text-slate-600 font-medium">Registra y analiza estadísticas de vóley en tiempo real</p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* Main Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className={`p-6 bg-gradient-to-br ${item.color} border-2 hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer h-full`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{item.icon}</div>
                </div>
                <h2 className={`text-2xl font-bold mb-1 ${item.textColor}`}>{item.label}</h2>
                <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                <Button className={`w-full ${item.buttonColor} text-white font-semibold`}>
                  Acceder
                </Button>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
