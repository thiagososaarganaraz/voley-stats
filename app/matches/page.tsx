"use client"

import { useState, useEffect } from "react"
import { getSupabaseClient } from "@/lib/client"
import type { Match } from "@/lib/types"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [opponents, setOpponents] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const supabase = getSupabaseClient()

  useEffect(() => {
    fetchMatches()
  }, [])

  async function fetchMatches() {
    try {
      const [matchesRes, opponentsRes, categoriesRes] = await Promise.all([
        supabase.from("matches").select("*").order("date", { ascending: false }),
        supabase.from("opponents").select("*"),
        supabase.from("categories").select("*"),
      ])

      setMatches(matchesRes.data || [])
      setOpponents(opponentsRes.data || [])
      setCategories(categoriesRes.data || [])
    } catch (error) {
      console.error("Error fetching matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const getOpponentName = (match: Match) => {
    if (match.opponent_id) {
      return opponents.find((o) => o.id === match.opponent_id)?.name
    }
    return match.opponent
  }

  const getCategoryName = (match: Match) => {
    if (match.category_id) {
      return categories.find((c) => c.id === match.category_id)?.name
    }
    return match.category
  }

  if (loading) return <div className="p-4">Cargando partidos...</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Partidos</h2>
        <Link href="/matches/new">
          <Button className="bg-blue-600 hover:bg-blue-700">+ Nuevo Partido</Button>
        </Link>
      </div>

      <div className="space-y-3">
        {matches.map((match) => (
          <Card key={match.id} className="p-4 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-lg">vs {getOpponentName(match)}</h3>
                <p className="text-sm text-gray-600">{new Date(match.date).toLocaleDateString("es-ES")}</p>
                {getCategoryName(match) && <p className="text-sm text-gray-600">{getCategoryName(match)}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/matches/${match.id}/stats`} className="flex-1">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Registrar Estadísticas</Button>
              </Link>
              <Link href={`/matches/${match.id}/view`} className="flex-1">
                <Button variant="outline" className="w-full bg-transparent">
                  Ver Detalles
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {matches.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No hay partidos registrados</p>
          <Link href="/matches/new">
            <Button className="bg-blue-600 hover:bg-blue-700">Crear primer partido</Button>
          </Link>
        </Card>
      )}
    </div>
  )
}
