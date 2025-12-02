"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getSupabaseClient } from "@/lib/client"
import { Trash2 } from "lucide-react"

export default function SettingsPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [opponents, setOpponents] = useState<any[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [newOpponent, setNewOpponent] = useState("")
  const [loading, setLoading] = useState(true)
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [catsRes, oppsRes] = await Promise.all([
        supabase.from("categories").select("*").order("name"),
        supabase.from("opponents").select("*").order("name"),
      ])
      setCategories(catsRes.data || [])
      setOpponents(oppsRes.data || [])
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  async function addCategory() {
    if (!newCategory.trim()) return
    try {
      const { data } = await supabase
        .from("categories")
        .insert([{ name: newCategory }])
        .select()
        .single()
      if (data) {
        setCategories([...categories, data])
        setNewCategory("")
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
        setOpponents([...opponents, data])
        setNewOpponent("")
      }
    } catch (error) {
      console.error("Error adding opponent:", error)
    }
  }

  async function deleteCategory(id: string) {
    try {
      await supabase.from("categories").delete().eq("id", id)
      setCategories(categories.filter((c) => c.id !== id))
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  async function deleteOpponent(id: string) {
    try {
      await supabase.from("opponents").delete().eq("id", id)
      setOpponents(opponents.filter((o) => o.id !== id))
    } catch (error) {
      console.error("Error deleting opponent:", error)
    }
  }

  if (loading) return <div className="p-4">Cargando...</div>

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold">Configuración</h1>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Categorías</h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nueva categoría"
            className="flex-1 px-3 py-2 border rounded"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <Button onClick={addCategory} className="bg-blue-600 hover:bg-blue-700">
            Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{cat.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteCategory(cat.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Rivales</h2>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newOpponent}
            onChange={(e) => setNewOpponent(e.target.value)}
            placeholder="Nuevo rival"
            className="flex-1 px-3 py-2 border rounded"
            onKeyDown={(e) => e.key === "Enter" && addOpponent()}
          />
          <Button onClick={addOpponent} className="bg-blue-600 hover:bg-blue-700">
            Agregar
          </Button>
        </div>
        <div className="space-y-2">
          {opponents.map((opp) => (
            <div key={opp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{opp.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteOpponent(opp.id)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
