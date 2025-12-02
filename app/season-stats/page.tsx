"use client"

import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/client"
import type { Player } from "@/lib/types"
import { SeasonStats } from "@/components/season-stats"

export default function SeasonStatsPage() {
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

  if (loading) return <div className="p-4">Cargando estadísticas...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Estadísticas de Temporada</h1>
      <SeasonStats players={players} />
    </div>
  )
}
