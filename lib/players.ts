import { getSupabaseServer } from "@/lib/server"
import type { Player } from "@/lib/types"

export async function getPlayers() {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("players").select("*").order("name")

  if (error) throw error
  return data as Player[]
}

export async function getActivePlayers() {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("players").select("*").eq("active", true).order("name")

  if (error) throw error
  return data as Player[]
}

export async function getPlayerById(id: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("players").select("*").eq("id", id).single()

  if (error) throw error
  return data as Player
}

export async function createPlayer(player: Omit<Player, "id" | "created_at" | "updated_at">) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("players").insert([player]).select().single()

  if (error) throw error
  return data as Player
}

export async function updatePlayer(id: string, updates: Partial<Player>) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("players")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Player
}

export async function deletePlayer(id: string) {
  const supabase = await getSupabaseServer()
  const { error } = await supabase.from("players").delete().eq("id", id)

  if (error) throw error
}
