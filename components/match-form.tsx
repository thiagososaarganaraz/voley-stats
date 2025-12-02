"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Match, Player } from "@/lib/types"
import { useRouter } from "next/navigation"
import { getSupabaseClient } from "@/lib/client"

interface MatchFormProps {
  players: Player[]
  categories: any[]
  opponents: any[]
  initialData?: Match & { playerIds?: string[]; playerNumbers?: Record<string, number> }
  onSubmit: (data: any) => Promise<void>
}

export function MatchForm({ players, categories, opponents, initialData, onSubmit }: MatchFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    date: initialData?.date || new Date().toISOString().split("T")[0],
    opponent_id: initialData?.opponent_id || "",
    category_id: initialData?.category_id || "",
    notes: initialData?.notes || "",
  })
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set(initialData?.playerIds || []))
  const [playerNumbers, setPlayerNumbers] = useState<Record<string, number>>(initialData?.playerNumbers || {})
  const [showNumberAssignment, setShowNumberAssignment] = useState(false)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewOpponent, setShowNewOpponent] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const [newOpponent, setNewOpponent] = useState("")
  const [errors, setErrors] = useState<string[]>([])
  const supabase = getSupabaseClient()

  const isValid = selectedPlayers.size >= 6 && formData.opponent_id && formData.category_id

  async function addCategory() {
    if (!newCategory.trim()) return
    try {
      const { data } = await supabase
        .from("categories")
        .insert([{ name: newCategory }])
        .select()
        .single()
      if (data) {
        setFormData({ ...formData, category_id: data.id })
        setNewCategory("")
        setShowNewCategory(false)
      }
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  async function addOpponent() {
    if (!newOpponent.trim()) return
    try {
      const { data } = await supabase
        .from("opponents")
        .insert([{ name: newOpponent }])
        .select()
        .single()
      if (data) {
        setFormData({ ...formData, opponent_id: data.id })
        setNewOpponent("")
        setShowNewOpponent(false)
      }
    } catch (error) {
      console.error("Error adding opponent:", error)
    }
  }

  function validatePlayerNumbers(): boolean {
    const numbers = Object.values(playerNumbers).filter((n) => n !== undefined && n !== null)
    const uniqueNumbers = new Set(numbers)
    return numbers.length === uniqueNumbers.size
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: string[] = []

    if (!isValid) {
      newErrors.push("Debe seleccionar categoría, rival y al menos 6 jugadores")
    }

    if (!validatePlayerNumbers()) {
      newErrors.push("No puede haber números duplicados entre los jugadores")
    }

    if (newErrors.length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors([])
    try {
      await onSubmit({
        match: formData,
        playerIds: Array.from(selectedPlayers),
        playerNumbers: playerNumbers,
      })
      router.push("/matches")
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      console.error("Error submitting form:", errorMsg)
      setErrors([errorMsg || "Error al guardar el partido"])
    } finally {
      setLoading(false)
    }
  }

  function togglePlayer(playerId: string) {
    const newSelected = new Set(selectedPlayers)
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId)
      const newNumbers = { ...playerNumbers }
      delete newNumbers[playerId]
      setPlayerNumbers(newNumbers)
    } else {
      newSelected.add(playerId)
    }
    setSelectedPlayers(newSelected)
  }

  const selectedPlayersList = players.filter((p) => selectedPlayers.has(p.id))

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">{initialData ? "Editar Partido" : "Nuevo Partido"}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            {errors.map((error, idx) => (
              <p key={idx} className="text-sm text-red-700">
                {error}
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fecha *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Categoría *</label>
            <div className="flex gap-2">
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="flex-1 px-3 py-2 border rounded"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="px-3"
              >
                +
              </Button>
            </div>
            {showNewCategory && (
              <div className="mt-2 flex gap-1">
                <input
                  type="text"
                  placeholder="Nueva categoría"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addCategory()
                  }}
                />
                <Button type="button" size="sm" onClick={addCategory}>
                  Agregar
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rival *</label>
            <div className="flex gap-2">
              <select
                value={formData.opponent_id}
                onChange={(e) => setFormData({ ...formData, opponent_id: e.target.value })}
                className="flex-1 px-3 py-2 border rounded"
              >
                <option value="">Seleccionar rival</option>
                {opponents.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewOpponent(!showNewOpponent)}
                className="px-3"
              >
                +
              </Button>
            </div>
            {showNewOpponent && (
              <div className="mt-2 flex gap-1">
                <input
                  type="text"
                  placeholder="Nuevo rival"
                  value={newOpponent}
                  onChange={(e) => setNewOpponent(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded text-sm"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") addOpponent()
                  }}
                />
                <Button type="button" size="sm" onClick={addOpponent}>
                  Agregar
                </Button>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Notas</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            rows={2}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="block text-sm font-medium">Jugadores Convocados * (mínimo 6)</label>
            {selectedPlayers.size >= 6 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNumberAssignment(!showNumberAssignment)}
              >
                {showNumberAssignment ? "Ocultar" : "Asignar"} números
              </Button>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {players.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => togglePlayer(player.id)}
                className={`p-3 rounded text-center font-medium transition ${
                  selectedPlayers.has(player.id) ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                <div className="font-bold">{player.name}</div>
                {player.number && <div className="text-xs"># {player.number}</div>}
              </button>
            ))}
          </div>
          {selectedPlayers.size < 6 && (
            <p className="text-sm text-red-600 mb-4">Debe seleccionar al menos 6 jugadores</p>
          )}

          {showNumberAssignment && selectedPlayers.size >= 6 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <h4 className="font-bold mb-3">Asignar números a jugadores</h4>
              <div className="space-y-2">
                {selectedPlayersList.map((player) => (
                  <div key={player.id} className="flex items-center gap-2">
                    <span className="flex-1">{player.name}</span>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={playerNumbers[player.id] || ""}
                      onChange={(e) =>
                        setPlayerNumbers({
                          ...playerNumbers,
                          [player.id]: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        })
                      }
                      placeholder="Nº"
                      className="w-16 px-2 py-1 border rounded text-center"
                    />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading || !isValid} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {loading ? "Guardando..." : "Guardar Partido"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
