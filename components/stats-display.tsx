"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { POSITIVE_METRICS, NEGATIVE_METRICS, calculateBalance, getAllMetricsAsArray, type MetricType } from "@/lib/config"
import type { MatchStat, Player } from "@/lib/types"

interface StatsDisplayProps {
  matchId: string
  players: Player[]
  stats: (MatchStat & { players: Player })[]
}

export function StatsDisplay({ matchId, players, stats }: StatsDisplayProps) {
  const [filterMetric, setFilterMetric] = useState<string>("")
  const [filterPlayer, setFilterPlayer] = useState<string>("")
  const [filterSet, setFilterSet] = useState<string>("")

  const metricsArray = getAllMetricsAsArray()

  const filteredStats = stats.filter((stat) => {
    if (filterMetric && stat.metric !== filterMetric) return false
    if (filterPlayer && stat.player_id !== filterPlayer) return false
    if (filterSet && stat.set_number !== Number.parseInt(filterSet)) return false
    return true
  })

  const statsByPlayer = stats.reduce(
    (acc, stat) => {
      if (!acc[stat.player_id]) {
        acc[stat.player_id] = {}
      }
      acc[stat.player_id][stat.metric] = (acc[stat.player_id][stat.metric] || 0) + 1
      return acc
    },
    {} as Record<string, Record<string, number>>,
  )

  const playerBalances = players.reduce(
    (acc, player) => {
      const playerStats = stats.filter((s) => s.player_id === player.id)
      const positive = playerStats.filter((s) => POSITIVE_METRICS.includes(s.metric)).length
      const negative = playerStats.filter((s) => NEGATIVE_METRICS.includes(s.metric)).length
      acc[player.id] = calculateBalance(positive, negative)
      return acc
    },
    {} as Record<string, number>,
  )

  const statsByMetric = stats.reduce(
    (acc, stat) => {
      acc[stat.metric] = (acc[stat.metric] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4">
        <h3 className="font-bold mb-3">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select value={filterSet} onChange={(e) => setFilterSet(e.target.value)} className="px-3 py-2 border rounded">
            <option value="">Todos los Sets</option>
            {[1, 2, 3, 4, 5].map((set) => (
              <option key={set} value={set}>
                Set {set}
              </option>
            ))}
          </select>
          <select
            value={filterMetric}
            onChange={(e) => setFilterMetric(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">Todas las Métricas</option>
            {metricsArray.map((m) => (
              <option key={m.key} value={m.key}>
                {m.key} - {m.label}
              </option>
            ))}
          </select>
          <select
            value={filterPlayer}
            onChange={(e) => setFilterPlayer(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="">Todos los Jugadores</option>
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-bold mb-4">Por Métrica</h3>
          <div className="space-y-2">
            {metricsArray.map((metric) => (
              <div key={metric.key} className="flex justify-between">
                <span className="text-sm">
                  {metric.key} - {metric.label}
                </span>
                <span className="font-bold">{statsByMetric[metric.key] || 0}</span>
              </div>
            ))}
            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
              <span>Total</span>
              <span>{stats.length}</span>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-bold mb-4">Por Jugador (con Balance)</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {players.map((player) => {
              const playerStats = statsByPlayer[player.id] || {}
              const total = Object.values(playerStats).reduce((a, b) => a + b, 0)
              const balance = playerBalances[player.id]
              const balanceColor = balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : "text-gray-600"
              return (
                <div key={player.id} className="flex justify-between text-sm items-center">
                  <span>{player.name}</span>
                  <div className="flex gap-3">
                    <span className="font-bold">{total}</span>
                    <span className={`font-bold ${balanceColor}`}>
                      Balance: {balance > 0 ? "+" : ""}
                      {balance}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* History */}
      <Card className="p-4">
        <h3 className="font-bold mb-4">Historial ({filteredStats.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredStats.length === 0 ? (
            <p className="text-gray-600 text-sm">No hay estadísticas registradas</p>
          ) : (
            filteredStats.map((stat) => (
              <div key={stat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <div className="flex-1">
                  <div className="font-medium">{stat.players?.name || "Jugador"}</div>
                  <div className="text-xs text-gray-600">
                    Set {stat.set_number} • Punto {stat.point_number} •{" "}
                    {new Date(stat.timestamp_recorded).toLocaleTimeString()}
                  </div>
                </div>
                <div className="bg-blue-600 text-white px-3 py-1 rounded font-bold">{stat.metric}</div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  )
}
