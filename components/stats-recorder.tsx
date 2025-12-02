"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { type Player } from "@/lib"
import { getSupabaseClient } from "@/lib/client"
import { getAllMetricsAsArray, METRIC_TYPES, POSITIVE_METRICS, NEGATIVE_METRICS, calculateBalance, type MetricType } from "@/lib/config"

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
  const [playerDisplayNames, setPlayerDisplayNames] = useState<Record<string, string>>({})
  const [showMetricOverlay, setShowMetricOverlay] = useState(false)
  const [metricLabel, setMetricLabel] = useState("")

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

      // Escape = exit focus mode
      if (key === "Escape") {
        e.preventDefault()
        setShowMetricOverlay(false)
        setSelectedMetric(null)
        setLastInput("")
        return
      }

      // Backspace = undo
      if (key === "Backspace") {
        e.preventDefault()
        undoLastStat()
        return
      }

      // Handle metric shortcuts
      let metricKey: MetricType | null = null
      let label = ""

      if (key === "S") {
        metricKey = METRIC_TYPES.SERVE
        label = "SAQUE"
      } else if (key === "B") {
        metricKey = METRIC_TYPES.BLOCK
        label = "BLOQUEO"
      } else if (key === "C") {
        metricKey = METRIC_TYPES.COUNTER_ATTACK
        label = "CONTRA ATAQUE"
      } else if (key === "A") {
        metricKey = METRIC_TYPES.ROTATION_ATTACK
        label = "ATAQUE"
      } else if (key === "E") {
        // Cycle through errors: ENF -> ES -> EA -> ENF
        if (selectedMetric === METRIC_TYPES.ERROR_UNFORCED) {
          metricKey = METRIC_TYPES.ERROR_SERVE
          label = "ERROR SAQUE"
        } else if (selectedMetric === METRIC_TYPES.ERROR_SERVE) {
          metricKey = METRIC_TYPES.ERROR_ATTACK
          label = "ERROR ATAQUE"
        } else {
          metricKey = METRIC_TYPES.ERROR_UNFORCED
          label = "ERROR NO FORZADO"
        }
      } else if (key >= "1" && key <= "9" && selectedMetric) {
        // Record stat for player number
        const playerIndex = Number.parseInt(key) - 1
        if (playerIndex >= 0 && playerIndex < players.length) {
          recordStat(players[playerIndex].id, selectedMetric)
          // Reset after selection
          setTimeout(() => {
            setSelectedMetric(null)
            setLastInput("")
            setShowMetricOverlay(false)
          }, 300)
        }
        return
      }

      if (metricKey) {
        setSelectedMetric(metricKey)
        setLastInput(key)
        setMetricLabel(label)
        setShowMetricOverlay(true)
        // Auto-hide overlay after 2 seconds if no player selection
        setTimeout(() => {
          setShowMetricOverlay(false)
        }, 2000)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedMetric, players, currentSet, currentPoint, stats.length])

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
    <div className="w-full">
      {/* Big Metric Overlay with Focus Effect */}
      {showMetricOverlay && selectedMetric && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 flex items-center justify-center pointer-events-none">
          <div className="flex items-center justify-center gap-16 w-full px-8">
            {/* Metric Display */}
            <div className="text-center flex-shrink-0">
              <div className="text-9xl font-black text-white drop-shadow-2xl animate-bounce">
                {lastInput}
              </div>
              <div className="text-4xl font-bold text-white drop-shadow-lg mt-4">
                {metricLabel}
              </div>
            </div>

            {/* Players List */}
            <div className="flex-shrink-0 backdrop-blur-md bg-white/10 rounded-2xl p-8 border border-white/20">
              <h3 className="text-white text-lg font-black mb-4 drop-shadow-lg">Selecciona</h3>
              <div className="grid grid-cols-2 gap-3">
                {players.map((player, index) => (
                  <div
                    key={player.id}
                    className="flex flex-col items-center justify-center px-6 py-4 bg-white/20 rounded-xl border-2 border-white/40 backdrop-blur-sm"
                  >
                    <div className="text-5xl font-black text-white drop-shadow-xl">{playerDisplayNames[player.id]}</div>
                    <div className="text-sm text-white/90 drop-shadow-lg mt-2">{player.name.split(" ")[0]}</div>
                  </div>
                ))}
              </div>
              <p className="text-white/80 text-xs drop-shadow-lg mt-6 text-center font-semibold">Presiona 1-{players.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Bar - Always Visible */}
      <div className="sticky top-16 z-30 bg-white border-b-4 border-slate-200 shadow-lg p-4 space-y-3">
        {/* Set and Point Display */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg rounded-lg">
            <div className="text-xs opacity-90 font-semibold">Set</div>
            <div className="text-4xl font-black">{currentSet}</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-slate-600 to-slate-700 text-white shadow-lg rounded-lg">
            <div className="text-xs opacity-90 font-semibold">Punto</div>
            <div className="text-4xl font-black">{currentPoint}</div>
          </Card>
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => setCurrentSet(Math.max(1, currentSet - 1))}
            className="py-2 px-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-sm transition"
          >
            ← Set
          </Button>
          <Button
            onClick={undoLastStat}
            disabled={stats.length === 0 || loading}
            className="py-2 px-2 bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition disabled:opacity-50"
          >
            ↶ Deshacer
          </Button>
          <Button
            onClick={() => setCurrentSet(currentSet + 1)}
            className="py-2 px-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-sm transition"
          >
            Set →
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 space-y-4">
        {/* Quick Players List - Always Visible */}
        {/* <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-3 border-blue-300 shadow-lg">
          <h3 className="font-black text-lg mb-4 text-blue-900">👥 JUGADORES</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {players.map((player, index) => (
              <div
                key={player.id}
                className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border-2 border-blue-300 hover:border-blue-500 hover:shadow-md transition"
              >
                <div className="text-3xl font-black text-blue-600">{playerDisplayNames[player.id]}</div>
                <div className="text-xs text-slate-600 text-center mt-1">{player.name.split(" ")[0]}</div>
                {player.number && <div className="text-xs font-bold text-blue-700">#{player.number}</div>}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-blue-700 font-semibold">Presiona número (1-{players.length}) después de seleccionar métrica</div>
        </Card> */}

        {/* Metrics Selection - Clean Grid */}
        {/* <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-3 border-green-400 shadow-lg">
          <h3 className="font-black text-lg mb-4 text-green-900">🎯 MÉTRICA</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {metricsArray.map((metric) => (
              <Button
                key={metric.key}
                onClick={() => {
                  setSelectedMetric(metric.key)
                  setLastInput(metric.key)
                  setMetricLabel(metric.label.toUpperCase())
                  setShowMetricOverlay(true)
                  setTimeout(() => setShowMetricOverlay(false), 2000)
                }}
                className={`py-4 px-2 text-sm font-bold transition-all duration-200 h-24 flex flex-col items-center justify-center ${
                  selectedMetric === metric.key
                    ? "bg-green-600 text-white shadow-lg scale-110 border-2 border-green-700"
                    : "bg-white hover:bg-green-200 text-slate-900 border-2 border-green-300 hover:border-green-500"
                }`}
              >
                <div className="text-2xl font-black">{metric.key}</div>
                <div className="text-xs mt-1 text-center leading-tight">{metric.label}</div>
              </Button>
            ))}
          </div>
        </Card> */}

        {/* Player Selection for Recording - When Metric Selected */}
        {selectedMetric && (
          <Card className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 border-4 border-emerald-500 shadow-2xl animate-pulse">
            <h3 className="font-black text-xl mb-4 text-emerald-900">📍 SELECCIONA JUGADOR (Número 1-{players.length})</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {players.map((player, index) => (
                <Button
                  key={player.id}
                  onClick={() => recordStat(player.id, selectedMetric)}
                  disabled={loading}
                  className="py-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-2xl transition-all duration-200 h-auto shadow-lg hover:shadow-2xl hover:scale-105"
                >
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="text-5xl font-black">{playerDisplayNames[player.id]}</div>
                    <div className="text-sm">{player.name.split(" ")[0]}</div>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Keyboard Shortcuts */}
        <Card className="p-6 bg-white border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-lg">⌨️</span> Atajos de Teclado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">S</span>
              <span className="text-slate-600">Saque</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">B</span>
              <span className="text-slate-600">Bloqueo</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">C</span>
              <span className="text-slate-600">Contra Ataque</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">R</span>
              <span className="text-slate-600">Ataque Rotación</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">E</span>
              <span className="text-slate-600">Error Ataque</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded text-xs">1-9</span>
              <span className="text-slate-600">Número Jugador</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
