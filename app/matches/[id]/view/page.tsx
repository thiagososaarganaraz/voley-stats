"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/client"
import type { Match, Player, MatchStat } from "@/lib/types"
import { StatsDisplay } from "@/components/stats-display"
import { MatchForm } from "@/components/match-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"

export default function MatchViewPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<(MatchStat & { players: Player })[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [opponents, setOpponents] = useState<any[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    if (!matchId) return
    fetchData()
  }, [matchId])

  async function fetchData() {
    try {
      const { data: matchData } = await supabase.from("matches").select("*").eq("id", matchId).single()
      setMatch(matchData)

      const { data: matchPlayersData } = await supabase
        .from("match_players")
        .select("*, players(*)")
        .eq("match_id", matchId)

      const matchedPlayers = matchPlayersData?.map((mp) => mp.players) || []
      setPlayers(matchedPlayers)

      const { data: statsData } = await supabase.from("match_stats").select("*, players(*)").eq("match_id", matchId)
      setStats(statsData || [])

      const [allPlayersRes, categoriesRes, opponentsRes] = await Promise.all([
        supabase.from("players").select("*").eq("active", true).order("name"),
        supabase.from("categories").select("*").order("name"),
        supabase.from("opponents").select("*").order("name"),
      ])

      setAllPlayers(allPlayersRes.data || [])
      setCategories(categoriesRes.data || [])
      setOpponents(opponentsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleMatchUpdate(data: any) {
    try {
      await supabase.from("matches").update(data.match).eq("id", matchId)

      await supabase.from("match_players").delete().eq("match_id", matchId)

      const matchPlayers = data.playerIds.map((playerId: string) => ({
        match_id: matchId,
        player_id: playerId,
      }))
      await supabase.from("match_players").insert(matchPlayers)

      await supabase.from("match_player_names").delete().eq("match_id", matchId)

      const playerNames = Object.entries(data.playerNumbers || {}).map(([playerId, number]) => ({
        match_id: matchId,
        player_id: playerId,
        match_number: number,
      }))

      if (playerNames.length > 0) {
        await supabase.from("match_player_names").insert(playerNames)
      }

      setIsEditing(false)
      await fetchData()
    } catch (error) {
      console.error("Error updating match:", error)
    }
  }

  async function handleDeleteMatch() {
    if (!confirm("¿Estás seguro de que deseas eliminar este partido?")) return

    try {
      await supabase.from("matches").delete().eq("id", matchId)
      router.push("/matches")
    } catch (error) {
      console.error("Error deleting match:", error)
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>
  if (!match) return <div className="p-4">Partido no encontrado</div>

  const categoryName = match.category_id ? categories.find((c) => c.id === match.category_id)?.name : match.category
  const opponentName = match.opponent_id ? opponents.find((o) => o.id === match.opponent_id)?.name : match.opponent

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto">
        <MatchForm
          players={allPlayers}
          categories={categories}
          opponents={opponents}
          initialData={{
            ...match,
            playerIds: players.map((p) => p.id),
            playerNumbers: {},
          }}
          onSubmit={handleMatchUpdate}
        />
        <Button variant="outline" onClick={() => setIsEditing(false)} className="mt-4 w-full">
          Cancelar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold mb-2">vs {opponentName}</h2>
          <p className="text-sm text-gray-600">{new Date(match.date).toLocaleDateString("es-ES")}</p>
          {categoryName && <p className="text-sm text-gray-600">{categoryName}</p>}
        </div>
        <div className="flex gap-2">
          <Link href={`/matches/${matchId}/stats`}>
            <Button className="bg-blue-600 hover:bg-blue-700">Registrar Acciones</Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
            <Edit2 className="w-4 h-4" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteMatch}
            className="text-red-600 hover:text-red-700 gap-2 bg-transparent"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar
          </Button>
        </div>
      </div>

      <StatsDisplay matchId={matchId} players={players} stats={stats} />
    </div>
  )
}
