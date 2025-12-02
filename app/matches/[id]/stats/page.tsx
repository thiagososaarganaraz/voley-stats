"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getSupabaseClient } from "@/lib/client"
import type { Match, Player, MatchStat } from "@/lib/types"
import { StatsRecorder } from "@/components/stats-recorder"
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
      <Card className="p-4 bg-blue-50">
        <h2 className="text-2xl font-bold mb-2">vs {opponentName}</h2>
        <p className="text-sm text-gray-600">{new Date(match.date).toLocaleDateString("es-ES")}</p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <StatsRecorder
            matchId={matchId}
            players={players}
            matchPlayerNames={matchPlayerNames}
            onStatRecorded={() => fetchStats()}
          />
        </div>

        <div>
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
            <h3 className="font-black text-xl mb-6 text-blue-900">Resumen Detallado</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <div className="text-xs text-gray-600">Total de Acciones</div>
                  <div className="font-bold text-3xl">{stats.length}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Jugadores Activos</div>
                  <div className="font-bold text-3xl">{players.length}</div>
                </div>
              </div>
              <div className="space-y-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-2 text-left font-bold">Jugador</th>
                      <th className="px-2 py-2 text-center font-bold">Acciones</th>
                      <th className="px-2 py-2 text-right font-bold">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players
                      .map((player) => {
                        const playerStats = stats.filter((s) => s.player_id === player.id)
                        const positive = playerStats.filter((s) => POSITIVE_METRICS.includes(s.metric)).length
                        const negative = playerStats.filter((s) => NEGATIVE_METRICS.includes(s.metric)).length
                        const balance = positive - negative
                        return { player, actionCount: playerStats.length, balance, positive, negative }
                      })
                      .sort((a, b) => b.balance - a.balance)
                      .map(({ player, actionCount, balance }, rank) => {
                        let rowClass = "border-b hover:bg-gray-50"
                        let nameClass = "px-2 py-2 font-medium"
                        let actionClass = "px-2 py-2 text-center font-bold"
                        let balanceClass = "px-2 py-2 text-right font-bold"
                        let textSize = "text-sm"

                        if (rank === 0) {
                          // MVP - Gold
                          rowClass = "bg-gradient-to-r from-yellow-100 to-yellow-200 border-b border-yellow-400 shadow-md transform scale-105 origin-left"
                          nameClass = "px-3 py-3 font-black text-lg text-black-900"
                          actionClass = "px-3 py-3 text-center font-black text-lg text-black-900"
                          balanceClass = "px-3 py-3 text-right font-black text-lg text-black-900"
                          textSize = "text-base"
                        } else if (rank === 1) {
                          // Second - Silver
                          rowClass = "bg-gradient-to-r from-gray-300 to-gray-200 border-b border-gray-400 shadow-sm transform scale-102 origin-left"
                          nameClass = "px-3 py-2 font-bold text-gray-900"
                          actionClass = "px-3 py-2 text-center font-bold text-gray-900"
                          balanceClass = "px-3 py-2 text-right font-bold text-gray-900"
                          textSize = "text-sm"
                        } else if (rank === 2) {
                          // Third - Bronze
                          rowClass = "bg-gradient-to-r from-orange-300 to-orange-200 border-b border-orange-400 shadow-sm transform scale-101 origin-left"
                          nameClass = "px-3 py-2 font-bold text-orange-900"
                          actionClass = "px-3 py-2 text-center font-bold text-orange-900"
                          balanceClass = "px-3 py-2 text-right font-bold text-orange-900"
                        }

                        return (
                          <tr key={player.id} className={`transition-all duration-300 ${rowClass}`}>
                            <td className={nameClass}>
                              {player.name}
                            </td>
                            <td className={actionClass}>{actionCount}</td>
                            <td className={`${balanceClass} ${balance > 0 ? "text-green-700" : balance < 0 ? "text-red-700" : ""}`}>
                              {balance > 0 ? "+" : ""}
                              {balance}
                            </td>
                          </tr>
                        )
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
