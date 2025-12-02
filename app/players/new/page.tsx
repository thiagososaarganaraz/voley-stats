"use client"

import { PlayerForm } from "@/components/player-form"
import { getSupabaseClient } from "@/lib/client"
import type { Player } from "@/lib/types"

export default function NewPlayerPage() {
  async function handleSubmit(data: Omit<Player, "id" | "created_at" | "updated_at">) {
    const supabase = getSupabaseClient()
    const { error } = await supabase.from("players").insert([data])

    if (error) throw error
  }

  return (
    <div className="max-w-md mx-auto">
      <PlayerForm onSubmit={handleSubmit} />
    </div>
  )
}
