"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/client"
import type { Match, Player, MatchStat } from "@/lib/types"
import { StatsRecorder } from "@/components/stats-recorder"
import { MatchSummary } from "@/components/match-summary"
import { Card } from "@/components/ui/card"
import { POSITIVE_METRICS, NEGATIVE_METRICS } from "@/lib/config"

export default function MatchStatsPage() {
  const params = useParams()
  const matchId = params.id as string
  const [match, setMatch] = useState<Match | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<(MatchStat & { players: Player })[]>([])
  const [loading, setLoading] = useState(true)
  const [matchPlayerNames, setMatchPlayerNames] = useState<any[]>([])
  const [opponents, setOpponents] = useState<any[]>([])

  useEffect(() => {
    if (!matchId) return
    fetchData()

    const supabase = getSupabaseClient()
    const subscription = supabase
      .channel(`match_stats_${matchId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "match_stats", filter: `match_id=eq.${matchId}` },
        () => {
          fetchStats()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [matchId])

  async function fetchData() {
    try {
      const supabase = getSupabaseClient()

      const { data: matchData } = await supabase.from("matches").select("*").eq("id", matchId).single()
      setMatch(matchData)

      const { data: matchPlayersData } = await supabase
        .from("match_players")
        .select("*, players(*)")
        .eq("match_id", matchId)

      const matchedPlayers = matchPlayersData?.map((mp: any) => mp.players) || []
      setPlayers(matchedPlayers)

      const { data: playerNamesData } = await supabase.from("match_player_names").select("*").eq("match_id", matchId)
      setMatchPlayerNames(playerNamesData || [])

      // Load opponents for display
      const { data: opponentsData } = await supabase.from("opponents").select("*")
      setOpponents(opponentsData || [])

      await fetchStats()
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("match_stats")
        .select("*, players(*)")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })
      setStats(data || [])
    } catch (error) {
      console.error("Error fetching stats:", error)
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>
  if (!match) return <div className="p-4">Partido no encontrado</div>

  const opponentName = match.opponent_id ? opponents.find((o) => o.id === match.opponent_id)?.name : match.opponent

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
        <h2 className="text-2xl font-bold mb-2 text-amber-900">⚡ vs {opponentName}</h2>
        <p className="text-sm text-amber-700 font-medium">{new Date(match.date).toLocaleDateString("es-ES")}</p>
      </Card>

      <div className="space-y-6">
        {/* Stats Recorder - Full Width on Mobile, Constrained on Desktop */}
        <div className="w-full">
          <StatsRecorder
            matchId={matchId}
            players={players}
            matchPlayerNames={matchPlayerNames}
            onStatRecorded={() => fetchStats()}
          />
        </div>

        {/* Match Summary - Full Width */}
        <div className="w-full">
          <MatchSummary stats={stats} players={players} />
        </div>
      </div>
    </div>
  )
}
