"use client"

import { Card } from "@/components/ui/card"
import type { Player, MatchStat } from "@/lib/types"
import { POSITIVE_METRICS, NEGATIVE_METRICS } from "@/lib/config"

interface MatchSummaryProps {
  stats: (MatchStat & { players: Player })[]
  players: Player[]
}

export function MatchSummary({ stats, players }: MatchSummaryProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 w-full">
      <h3 className="font-black text-2xl mb-6 text-slate-900">📊 Resumen Partido</h3>
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-slate-300">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-xs text-slate-600 font-semibold">Total de Acciones</div>
            <div className="font-bold text-3xl text-slate-900">{stats.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-xs text-slate-600 font-semibold">Jugadores Activos</div>
            <div className="font-bold text-3xl text-slate-900">{players.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-xs text-slate-600 font-semibold">Acciones Positivas</div>
            <div className="font-bold text-3xl text-green-600">{stats.filter((s) => POSITIVE_METRICS.includes(s.metric)).length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-xs text-slate-600 font-semibold">Acciones Negativas</div>
            <div className="font-bold text-3xl text-red-600">{stats.filter((s) => NEGATIVE_METRICS.includes(s.metric)).length}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-200 border-b border-slate-300">
                <th className="px-4 py-3 text-left font-bold text-slate-900">Jugador</th>
                <th className="px-4 py-3 text-center font-bold text-slate-900">Acciones</th>
                <th className="px-4 py-3 text-center font-bold text-slate-900">Positivas</th>
                <th className="px-4 py-3 text-center font-bold text-slate-900">Negativas</th>
                <th className="px-4 py-3 text-right font-bold text-slate-900">Balance</th>
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
                .map(({ player, actionCount, balance, positive, negative }, rank) => {
                  let rowClass = "border-b border-slate-200 hover:bg-slate-100 transition-colors"
                  let nameClass = "px-4 py-3 font-medium text-slate-900"
                  let actionClass = "px-4 py-3 text-center font-bold text-slate-700"
                  let positiveClass = "px-4 py-3 text-center font-bold text-green-700"
                  let negativeClass = "px-4 py-3 text-center font-bold text-red-700"
                  let balanceClass = "px-4 py-3 text-right font-bold"

                  if (rank === 0) {
                    // MVP - Gold
                    rowClass = "bg-gradient-to-r from-amber-200 to-yellow-100 border-b-2 border-amber-400 shadow-md"
                    nameClass = "px-4 py-4 font-black text-lg text-amber-900"
                    actionClass = "px-4 py-4 text-center font-black text-lg text-amber-900"
                    positiveClass = "px-4 py-4 text-center font-black text-lg text-green-700"
                    negativeClass = "px-4 py-4 text-center font-black text-lg text-red-700"
                    balanceClass = "px-4 py-4 text-right font-black text-lg text-amber-900"
                  } else if (rank === 1) {
                    // Second - Silver
                    rowClass = "bg-gradient-to-r from-gray-300 to-gray-200 border-b-2 border-gray-400"
                    nameClass = "px-4 py-3 font-bold text-gray-900"
                    actionClass = "px-4 py-3 text-center font-bold text-gray-900"
                    positiveClass = "px-4 py-3 text-center font-bold text-gray-900"
                    negativeClass = "px-4 py-3 text-center font-bold text-gray-900"
                    balanceClass = "px-4 py-3 text-right font-bold text-gray-900"
                  } else if (rank === 2) {
                    // Third - Bronze
                    rowClass = "bg-gradient-to-r from-orange-300 to-orange-200 border-b-2 border-orange-400"
                    nameClass = "px-4 py-3 font-bold text-orange-900"
                    actionClass = "px-4 py-3 text-center font-bold text-orange-900"
                    positiveClass = "px-4 py-3 text-center font-bold text-orange-900"
                    negativeClass = "px-4 py-3 text-center font-bold text-orange-900"
                    balanceClass = "px-4 py-3 text-right font-bold text-orange-900"
                  }

                  return (
                    <tr key={player.id} className={`transition-all duration-300 ${rowClass}`}>
                      <td className={nameClass}>{player.name}</td>
                      <td className={actionClass}>{actionCount}</td>
                      <td className={positiveClass}>{positive}</td>
                      <td className={negativeClass}>{negative}</td>
                      <td className={`${balanceClass} ${balance > 0 ? "text-green-700" : balance < 0 ? "text-red-700" : "text-slate-700"}`}>
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
  )
}
