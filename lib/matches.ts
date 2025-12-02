import { getSupabaseServer } from "@/lib/server"
import type { Match, MatchPlayer, MatchStat } from "@/lib/types"

export async function getMatches() {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("matches").select("*").order("date", { ascending: false })

  if (error) throw error
  return data as Match[]
}

export async function getMatchById(id: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("matches").select("*").eq("id", id).single()

  if (error) throw error
  return data as Match
}

export async function createMatch(match: Omit<Match, "id" | "created_at" | "updated_at">) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("matches").insert([match]).select().single()

  if (error) throw error
  return data as Match
}

export async function updateMatch(id: string, updates: Partial<Match>) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("matches")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return data as Match
}

export async function addPlayersToMatch(matchId: string, playerIds: string[]) {
  const supabase = await getSupabaseServer()
  const matchPlayers = playerIds.map((playerId) => ({
    match_id: matchId,
    player_id: playerId,
  }))

  const { error } = await supabase.from("match_players").insert(matchPlayers)

  if (error) throw error
}

export async function getMatchPlayers(matchId: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("match_players")
    .select("*, players(*)")
    .eq("match_id", matchId)
    .order("players(name)")

  if (error) throw error
  return data as (MatchPlayer & { players: any })[]
}

export async function recordMatchStat(stat: Omit<MatchStat, "id" | "created_at">) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("match_stats")
    .insert([{ ...stat, timestamp_recorded: new Date().toISOString() }])
    .select()
    .single()

  if (error) throw error
  return data as MatchStat
}

export async function getMatchStats(matchId: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("match_stats")
    .select("*, players(*)")
    .eq("match_id", matchId)
    .order("point_number", { ascending: true })

  if (error) throw error
  return data as (MatchStat & { players: any })[]
}

export async function deleteMatchStat(id: string) {
  const supabase = await getSupabaseServer()
  const { error } = await supabase.from("match_stats").delete().eq("id", id)

  if (error) throw error
}

export async function getCategories() {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("categories").select("*").order("name")

  if (error) throw error
  return data as any[]
}

export async function createCategory(name: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("categories").insert([{ name }]).select().single()

  if (error) throw error
  return data as any
}

export async function getOpponents() {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("opponents").select("*").order("name")

  if (error) throw error
  return data as any[]
}

export async function createOpponent(name: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("opponents").insert([{ name }]).select().single()

  if (error) throw error
  return data as any
}

export async function getMatchPlayerNames(matchId: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase.from("match_player_names").select("*").eq("match_id", matchId)

  if (error) throw error
  return data as any[]
}

export async function setMatchPlayerName(matchId: string, playerId: string, matchNumber?: number, customName?: string) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("match_player_names")
    .upsert([
      {
        match_id: matchId,
        player_id: playerId,
        match_number: matchNumber,
        custom_name: customName,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single()

  if (error) throw error
  return data as any
}

export async function deleteMatchStatWithHistory(matchId: string, statId: string) {
  const supabase = await getSupabaseServer()

  // Delete the stat
  const { error: deleteError } = await supabase.from("match_stats").delete().eq("id", statId)
  if (deleteError) throw deleteError

  // Record in history
  const { data: historyData } = await supabase
    .from("match_stats_history")
    .select("order_index")
    .eq("match_id", matchId)
    .order("order_index", { ascending: false })
    .limit(1)

  const nextIndex = (historyData?.[0]?.order_index || 0) + 1

  await supabase.from("match_stats_history").insert([
    {
      match_id: matchId,
      stat_id: statId,
      action: "delete",
      order_index: nextIndex,
    },
  ])
}

export async function recordMatchStatWithHistory(stat: Omit<MatchStat, "id" | "created_at">) {
  const supabase = await getSupabaseServer()
  const { data, error } = await supabase
    .from("match_stats")
    .insert([{ ...stat, timestamp_recorded: new Date().toISOString() }])
    .select()
    .single()

  if (error) throw error

  // Record in history
  const { data: historyData } = await supabase
    .from("match_stats_history")
    .select("order_index")
    .eq("match_id", stat.match_id)
    .order("order_index", { ascending: false })
    .limit(1)

  const nextIndex = (historyData?.[0]?.order_index || 0) + 1

  await supabase.from("match_stats_history").insert([
    {
      match_id: stat.match_id,
      stat_id: data.id,
      action: "insert",
      order_index: nextIndex,
    },
  ])

  return data as MatchStat
}
