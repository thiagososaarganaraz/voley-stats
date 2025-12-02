"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type Player } from "@/lib"
import { getSupabaseClient } from "@/lib/client"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { getAllMetricsAsArray, METRIC_TYPES, POSITIVE_METRICS, NEGATIVE_METRICS, calculateBalance, type MetricType } from "@/lib/config"
import { matchStatsService } from "@/lib/services"

interface StatsRecorderProps {
  matchId: string
  players: (Player & { stats?: any })[]
  matchPlayerNames?: any[]
  onStatRecorded?: () => void
}

export function StatsRecorder({ matchId, players, matchPlayerNames = [], onStatRecorded }: StatsRecorderProps) {
  const [currentSet, setCurrentSet] = useState(1)
  const [currentPoint, setCurrentPoint] = useState(0)
  const [selectedMetric, setSelectedMetric] = useState<MetricType | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastInput, setLastInput] = useState("")
  const [stats, setStats] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [playerDisplayNames, setPlayerDisplayNames] = useState<Record<string, string>>({})

  // Build display names for players (custom or default)
  useEffect(() => {
    const names: Record<string, string> = {}
    players.forEach((player, index) => {
      const matchName = matchPlayerNames?.find((mpn) => mpn.player_id === player.id)
      names[player.id] = matchName?.custom_name || matchName?.match_number?.toString() || `${index + 1}`
    })
    setPlayerDisplayNames(names)
  }, [players, matchPlayerNames])

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("match_stats")
        .select("*")
        .eq("match_id", matchId)
        .order("created_at", { ascending: true })

      setStats(data || [])
      if (data) {
        setCurrentPoint(data.length)
      }
    } catch (error) {
      console.error("Error loading stats:", error)
    }
  }

  const metricsArray = getAllMetricsAsArray()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase()

      // Backspace = undo
      if (key === "Backspace") {
        e.preventDefault()
        undoLastStat()
        return
      }

      // Handle metric shortcuts
      if (key === "S") {
        setSelectedMetric(METRIC_TYPES.SERVE)
        setLastInput("S")
      } else if (key === "B") {
        setSelectedMetric(METRIC_TYPES.BLOCK)
        setLastInput("B")
      } else if (key === "C") {
        setSelectedMetric(METRIC_TYPES.COUNTER_ATTACK)
        setLastInput("CA")
      } else if (key === "A") {
        setSelectedMetric(METRIC_TYPES.ROTATION_ATTACK)
        setLastInput("AR")
      } else if (key === "E") {
        // Cycle through errors: ENF -> ES -> EA -> ENF
        if (selectedMetric === METRIC_TYPES.ERROR_UNFORCED) {
          setSelectedMetric(METRIC_TYPES.ERROR_SERVE)
          setLastInput("ES")
        } else if (selectedMetric === METRIC_TYPES.ERROR_SERVE) {
          setSelectedMetric(METRIC_TYPES.ERROR_ATTACK)
          setLastInput("EA")
        } else {
          setSelectedMetric(METRIC_TYPES.ERROR_UNFORCED)
          setLastInput("ENF")
        }
      } else if (key >= "0" && key <= "9" && selectedMetric) {
        // Record stat for player number
        const playerIndex = Number.parseInt(key)
        if (playerIndex > 0 && playerIndex <= players.length) {
          recordStat(players[playerIndex - 1].id, selectedMetric)
          setSelectedMetric(null)
          setLastInput("")
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedMetric, players, currentSet, currentPoint])

  async function recordStat(playerId: string, metric: MetricType) {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("match_stats")
        .insert([
          {
            match_id: matchId,
            player_id: playerId,
            set_number: currentSet,
            point_number: currentPoint,
            metric,
          },
        ])
        .select()
        .single()

      if (data) {
        const newStats = [...stats, data]
        setStats(newStats)
        setCurrentPoint(currentPoint + 1)
        setHistory([...history.slice(0, historyIndex + 1), { type: "add", stat: data }])
        setHistoryIndex(historyIndex + 1)
        onStatRecorded?.()
      }
    } catch (error) {
      console.error("Error recording stat:", error)
    } finally {
      setLoading(false)
    }
  }

  async function undoLastStat() {
    if (stats.length === 0) return

    const lastStat = stats[stats.length - 1]
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      await supabase.from("match_stats").delete().eq("id", lastStat.id)

      const newStats = stats.slice(0, -1)
      setStats(newStats)
      setCurrentPoint(Math.max(0, currentPoint - 1))
      setHistory([...history.slice(0, historyIndex + 1), { type: "delete", stat: lastStat }])
      setHistoryIndex(historyIndex + 1)
      onStatRecorded?.()
    } catch (error) {
      console.error("Error undoing stat:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate balance for display
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

  return (
    <div className="space-y-4">
      {/* Set and Point Display - Enhanced */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg rounded-lg">
          <div className="text-sm opacity-90 font-medium">Set</div>
          <div className="text-5xl font-black">{currentSet}</div>
        </Card>
        <Card className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg rounded-lg">
          <div className="text-sm opacity-90 font-medium">Punto</div>
          <div className="text-5xl font-black">{currentPoint}</div>
        </Card>
      </div>

      {/* Set Controls */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setCurrentSet(Math.max(1, currentSet - 1))} className="flex-1 py-3 font-bold text-base border-2 hover:bg-blue-100 transition">
          ← Set Anterior
        </Button>
        <Button variant="outline" onClick={() => setCurrentSet(currentSet + 1)} className="flex-1 py-3 font-bold text-base border-2 hover:bg-blue-100 transition">
          Set Siguiente →
        </Button>
      </div>

      {/* Undo/Redo Controls */}
      <div className="flex gap-3">
        <Button
          onClick={undoLastStat}
          disabled={stats.length === 0 || loading}
          variant="outline"
          className="flex-1 gap-2 py-3 font-bold text-base border-2 bg-red-50 hover:bg-red-100 hover:border-red-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          Deshacer
        </Button>
        <Button variant="outline" className="flex-1 gap-2 py-3 font-bold text-base border-2 bg-gray-50 transition" disabled>
          <RotateCcw className="w-5 h-5" />
          Rehacer
        </Button>
      </div>

      {/* Metrics Selection */}
      <Card className="p-6 border-4 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
        <h3 className="font-black text-xl mb-4 text-blue-900">🎯 SELECCIONA MÉTRICA {lastInput && `(${lastInput})`}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {metricsArray.map((metric) => (
            <Button
              key={metric.key}
              onClick={() => setSelectedMetric(metric.key)}
              className={`py-4 text-sm font-bold transition-all duration-200 ${
                selectedMetric === metric.key
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : "bg-white hover:bg-blue-100 text-gray-900 border-2 border-gray-200 hover:border-blue-500"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-xl font-black">{metric.key}</div>
                <div className="text-xs">{metric.label}</div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Players - Quick Selection */}
      {selectedMetric && (
        <Card className="p-6 border-4 border-green-500 bg-green-50 shadow-lg">
          <h3 className="font-black text-xl mb-4 text-green-700">📊 SELECCIONA JUGADOR</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {players.map((player, index) => (
              <Button
                key={player.id}
                onClick={() => recordStat(player.id, selectedMetric)}
                disabled={loading}
                className="py-8 px-2 bg-green-600 hover:bg-green-700 text-white font-bold text-lg transition-all duration-200 h-auto"
              >
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="text-2xl font-black">{playerDisplayNames[player.id]}</div>
                  <div className="text-sm">{player.name.split(" ")[0]}</div>
                  {player.number && <div className="text-sm font-bold">#{player.number}</div>}
                </div>
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Players - Full List for Touch */}
      {!selectedMetric && (
        <Card className="p-4">
          <h3 className="font-bold mb-3">Todos los Jugadores</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {players.map((player) => {
              const balance = playerBalances[player.id]
              return (
                <Button key={player.id} variant="outline" className="py-4 bg-transparent">
                  <div className="flex flex-col items-center w-full">
                    <div>{player.name}</div>
                    {player.number && <div className="text-xs">#{player.number}</div>}
                  </div>
                </Button>
              )
            })}
          </div>
        </Card>
      )}

      <div className="text-xs text-gray-700 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border-2 border-amber-200">
        <p className="font-black mb-2 text-amber-900">💡 ATAJOS DE TECLADO:</p>
        <p className="text-amber-900"><strong>S</strong>=Saque | <strong>B</strong>=Bloqueo | <strong>C</strong>=Contra Ataque | <strong>A</strong>=Ataque | <strong>E</strong>=Error | <strong>Números 1-9</strong>=Jugador | <strong>Retroceso</strong>=Deshacer</p>
      </div>
    </div>
  )
}
