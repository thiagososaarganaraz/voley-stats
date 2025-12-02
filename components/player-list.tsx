"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/client"
import type { Player } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export function PlayerList() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  async function fetchPlayers() {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("players").select("*").order("name")
      setPlayers(data || [])
    } catch (error) {
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }

  async function togglePlayerActive(id: string, active: boolean) {
    try {
      const supabase = getSupabaseClient()
      await supabase.from("players").update({ active: !active }).eq("id", id)
      fetchPlayers()
    } catch (error) {
      console.error("Error updating player:", error)
    }
  }

  if (loading) return <div className="p-4">Cargando jugadores...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Jugadores</h2>
        <Link href="/players/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Nuevo Jugador</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map((player) => (
          <Card key={player.id} className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{player.name}</h3>
                  {player.number && <p className="text-sm text-gray-600">Número: {player.number}</p>}
                  {player.position && <p className="text-sm text-gray-600">{player.position}</p>}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${player.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
                >
                  {player.active ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Link href={`/players/${player.id}/edit`} className="flex-1">
                  <Button variant="outline" className="w-full bg-transparent">
                    Editar
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => togglePlayerActive(player.id, player.active)}
                  className="flex-1"
                >
                  {player.active ? "Desactivar" : "Activar"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {players.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No hay jugadores registrados</p>
          <Link href="/players/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Crear primer jugador</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
