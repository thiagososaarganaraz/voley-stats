"use client"

import { useEffect, useState } from "react"
import { MatchForm } from "@/components/match-form"
import { getSupabaseClient } from "@/lib/client"
import type { Player } from "@/lib/types"

export default function NewMatchPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [opponents, setOpponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [playersRes, categoriesRes, opponentsRes] = await Promise.all([
        supabase.from("players").select("*").eq("active", true).order("name"),
        supabase.from("categories").select("*").order("name"),
        supabase.from("opponents").select("*").order("name"),
      ])

      setPlayers(playersRes.data || [])
      setCategories(categoriesRes.data || [])
      setOpponents(opponentsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(data: any) {
    try {
      // Get opponent name from ID
      const opponent = opponents.find((o) => o.id === data.match.opponent_id)
      if (!opponent) throw new Error("Opponent not found")

      // Prepare match data with opponent name
      const matchDataToInsert = {
        ...data.match,
        opponent: opponent.name,
        // Keep opponent_id as well if the schema supports it
        opponent_id: data.match.opponent_id,
      }

      const { data: matchData, error: matchError } = await supabase
        .from("matches")
        .insert([matchDataToInsert])
        .select()
        .single()

      if (matchError) throw new Error(`Failed to create match: ${matchError.message}`)
      if (!matchData) throw new Error("No match data returned from server")

      // Add players to match
      const matchPlayers = data.playerIds.map((playerId: string) => ({
        match_id: matchData.id,
        player_id: playerId,
      }))

      const { error: playersError } = await supabase.from("match_players").insert(matchPlayers)
      if (playersError) throw new Error(`Failed to add players: ${playersError.message}`)

      // Store player numbers and custom names
      const playerNames = Object.entries(data.playerNumbers || {}).map(([playerId, number]) => ({
        match_id: matchData.id,
        player_id: playerId,
        match_number: number,
      }))

      if (playerNames.length > 0) {
        const { error: namesError } = await supabase.from("match_player_names").insert(playerNames)
        if (namesError) throw new Error(`Failed to assign numbers: ${namesError.message}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      console.error("Match submission error:", message)
      throw new Error(`Error al crear partido: ${message}`)
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <div className="max-w-2xl mx-auto">
      <MatchForm players={players} categories={categories} opponents={opponents} onSubmit={handleSubmit} />
    </div>
  )
}
