"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Player } from "@/lib/types"
import { useRouter } from "next/navigation"

interface PlayerFormProps {
  initialData?: Player
  onSubmit: (data: Omit<Player, "id" | "created_at" | "updated_at">) => Promise<void>
}

export function PlayerForm({ initialData, onSubmit }: PlayerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    number: initialData?.number || "",
    position: initialData?.position || "",
    active: initialData?.active ?? true,
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await onSubmit({
        name: formData.name,
        number: formData.number ? Number.parseInt(formData.number as string) : undefined,
        position: formData.position || undefined,
        active: formData.active,
      })
      router.push("/players")
    } catch (error) {
      console.error("Error submitting form:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 max-w-md">
      <h2 className="text-2xl font-bold mb-6">{initialData ? "Editar Jugador" : "Nuevo Jugador"}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nombre *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Número</label>
          <input
            type="number"
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Posición</label>
          <select
            value={formData.position}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Seleccionar posición</option>
            <option value="Opuesto">Opuesto</option>
            <option value="Armador">Armador</option>
            <option value="Central">Central</option>
            <option value="Punta">Punta</option>
            <option value="Líbero">Líbero</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4"
          />
          <label htmlFor="active" className="text-sm font-medium">
            Activo
          </label>
        </div>
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
            {loading ? "Guardando..." : "Guardar"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
