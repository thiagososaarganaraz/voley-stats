"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { type Player } from "@/lib/types"
import { getSupabaseClient } from "@/lib/client"
import { getAllMetricsAsArray, POSITIVE_METRICS, NEGATIVE_METRICS, calculateBalance } from "@/lib/config"

interface SeasonStatsProps {
  players: Player[]
}

export function SeasonStats({ players }: SeasonStatsProps) {
  const [stats, setStats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterPlayer, setFilterPlayer] = useState<string>("")
  const [filterMetric, setFilterMetric] = useState<string>("")

  useEffect(() => {
    fetchSeasonStats()
  }, [])

  async function fetchSeasonStats() {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("match_stats")
        .select("*, players(*), matches(*)")
        .order("created_at", { ascending: false })
      setStats(data || [])
    } catch (error) {
      console.error("Error fetching season stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const metricsArray = getAllMetricsAsArray()

  const filteredStats = stats.filter((stat) => {
    if (filterPlayer && stat.player_id !== filterPlayer) return false
    if (filterMetric && stat.metric !== filterMetric) return false
    return true
  })

  const playerStats = players.reduce((acc, player) => {
    acc[player.id] = {
      player,
      stats: {},
      total: 0,
      positive: 0,
      negative: 0,
      balance: 0,
      matches: new Set<string>(),
    }
    return acc
  }, {} as any)

  filteredStats.forEach((stat) => {
    if (playerStats[stat.player_id]) {
      playerStats[stat.player_id].stats[stat.metric] = (playerStats[stat.player_id].stats[stat.metric] || 0) + 1
      playerStats[stat.player_id].total += 1
      playerStats[stat.player_id].matches.add(stat.match_id)

      if (POSITIVE_METRICS.includes(stat.metric)) {
        playerStats[stat.player_id].positive += 1
      } else if (NEGATIVE_METRICS.includes(stat.metric)) {
        playerStats[stat.player_id].negative += 1
      }
    }
  })

  // Calculate balance for each player
  Object.values(playerStats).forEach((pStats: any) => {
    pStats.balance = calculateBalance(pStats.positive, pStats.negative)
  })

  const sortedPlayers = Object.values(playerStats).sort((a: any, b: any) => b.balance - a.balance)
  const mvpPlayer = sortedPlayers[0] as any

  if (loading) return <div className="p-4">Cargando estadísticas...</div>

  return (
    <div className="space-y-6">
      {/* MVP Card */}
      {mvpPlayer && mvpPlayer.balance > 0 && (
        <Card className="p-6 bg-gradient-to-r from-yellow-400 to-yellow-500 text-white">
          <h3 className="font-bold text-lg mb-2">🏆 MVP de la Temporada</h3>
          <div className="text-3xl font-bold mb-2">{mvpPlayer.player.name}</div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="opacity-90">Balance</div>
              <div className="text-2xl font-bold">+{mvpPlayer.balance}</div>
            </div>
            <div>
              <div className="opacity-90">Positivas</div>
              <div className="text-2xl font-bold">{mvpPlayer.positive}</div>
            </div>
            <div>
              <div className="opacity-90">Negativas</div>
              <div className="text-2xl font-bold">{mvpPlayer.negative}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Filtrar por Jugador</label>
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded p-2">
            <button
              onClick={() => setFilterPlayer("")}
              className={`p-3 rounded text-center font-bold transition ${
                filterPlayer === ""
                  ? "bg-blue-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            {players.map((p) => (
              <button
                key={p.id}
                onClick={() => setFilterPlayer(p.id)}
                className={`p-3 rounded text-center transition ${
                  filterPlayer === p.id
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="font-bold text-lg">{p.name}</div>
                {p.number && <div className="text-sm opacity-75">#{p.number}</div>}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Filtrar por Métrica</label>
          <select
            value={filterMetric}
            onChange={(e) => setFilterMetric(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Todas las Métricas</option>
            {metricsArray.map((m) => (
              <option key={m.key} value={m.key}>
                {m.key} - {m.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Table with Balance */}
      <Card className="p-4 overflow-x-auto">
        <h3 className="font-bold mb-4">Estadísticas Generales de Temporada</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-3 py-2 text-left font-bold">Jugador</th>
              {metricsArray.map((m) => (
                <th key={m.key} className="px-2 py-2 text-center font-bold text-xs">
                  {m.key}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold">Balance</th>
              <th className="px-3 py-2 text-center font-bold">Total</th>
              <th className="px-3 py-2 text-center font-bold">Partidos</th>
            </tr>
          </thead>
          <tbody>
            {(sortedPlayers as any[]).map(({ player, stats: playerMetrics, total, balance, matches }) => (
              <tr key={player.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 font-medium">{player.name}</td>
                {metricsArray.map((m) => (
                  <td key={m.key} className="px-2 py-2 text-center text-xs">
                    {playerMetrics[m.key] || 0}
                  </td>
                ))}
                <td
                  className={`px-3 py-2 text-center font-bold ${balance > 0 ? "text-green-600 bg-green-50" : balance < 0 ? "text-red-600 bg-red-50" : ""}`}
                >
                  {balance > 0 ? "+" : ""}
                  {balance}
                </td>
                <td className="px-3 py-2 text-center font-bold bg-blue-50">{total}</td>
                <td className="px-3 py-2 text-center">{matches.size}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Top Players Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(sortedPlayers as any[]).slice(0, 6).map(({ player, stats: playerMetrics, total, balance, positive, negative }) => (
          <Card
            key={player.id}
            className={`p-4 ${balance > 0 ? "border-green-200 bg-green-50" : balance < 0 ? "border-red-200 bg-red-50" : ""}`}
          >
            <h4 className="font-bold mb-3">{player.name}</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Positivas</span>
                <span className="font-bold text-green-600">{positive}</span>
              </div>
              <div className="flex justify-between">
                <span>Negativas</span>
                <span className="font-bold text-red-600">{negative}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                <span>Balance</span>
                <span className={balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}>
                  {balance > 0 ? "+" : ""}
                  {balance}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
