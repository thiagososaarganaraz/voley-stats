"use client"

import { useEffect, useState } from "react"
import { PlayerForm } from "@/components/player-form"
import { getSupabaseClient } from "@/lib/client"
import type { Player } from "@/lib/types"
import { useParams } from "next/navigation"

export default function EditPlayerPage() {
  const params = useParams()
  const playerId = params.id as string
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!playerId) return
    fetchPlayer()
  }, [playerId])

  async function fetchPlayer() {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("players").select("*").eq("id", playerId).single()
      setPlayer(data)
    } catch (error) {
      console.error("Error fetching player:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: Omit<Player, "id" | "created_at" | "updated_at">) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from("players")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", playerId)

    if (error) throw error
  }

  if (loading) return <div className="p-4">Cargando...</div>
  if (!player) return <div className="p-4">Jugador no encontrado</div>

  return (
    <div className="max-w-md mx-auto">
      <PlayerForm initialData={player} onSubmit={handleSubmit} />
    </div>
  )
}
