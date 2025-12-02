/**
 * Match Stats Service
 * Handles all match statistics recording and retrieval
 */

import { getSupabaseClient } from "@/lib/client"
import type { MatchStat, MatchStatInput, ApiResponse, MatchStatsSummary, PlayerStats } from "@/lib/types"
import { MatchStatSchema } from "@/lib/types"
import { POSITIVE_METRICS, NEGATIVE_METRICS } from "@/lib/config"

class MatchStatsService {
  private supabase = getSupabaseClient()

  async recordStat(input: MatchStatInput): Promise<ApiResponse<MatchStat>> {
    try {
      // Validate input
      const validated = MatchStatSchema.parse(input)

      const { data, error } = await this.supabase
        .from("match_stats")
        .insert([validated])
        .select()
        .single()

      if (error) throw error

      return { success: true, data, message: "Stat recorded successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to record stat",
      }
    }
  }

  async getMatchStats(matchId: string): Promise<ApiResponse<MatchStat[]>> {
    try {
      const { data, error } = await this.supabase.from("match_stats").select("*").eq("match_id", matchId).order("created_at", { ascending: true })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch match stats",
      }
    }
  }

  async getPlayerMatchStats(matchId: string, playerId: string): Promise<ApiResponse<MatchStat[]>> {
    try {
      const { data, error } = await this.supabase
        .from("match_stats")
        .select("*")
        .eq("match_id", matchId)
        .eq("player_id", playerId)
        .order("created_at", { ascending: true })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch player stats",
      }
    }
  }

  async deleteStat(statId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.from("match_stats").delete().eq("id", statId)

      if (error) throw error

      return { success: true, message: "Stat deleted successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete stat",
      }
    }
  }

  /**
   * Calculate player stats from raw match stats
   */
  calculatePlayerStats(stats: MatchStat[]): PlayerStats {
    const positive = stats.filter((s) => POSITIVE_METRICS.includes(s.metric as any)).length
    const negative = stats.filter((s) => NEGATIVE_METRICS.includes(s.metric as any)).length

    const metricsBreakdown: Record<string, number> = {}
    stats.forEach((stat) => {
      metricsBreakdown[stat.metric] = (metricsBreakdown[stat.metric] || 0) + 1
    })

    return {
      player_id: stats[0]?.player_id || "",
      total_actions: stats.length,
      positive_actions: positive,
      negative_actions: negative,
      balance: positive - negative,
      efficiency: stats.length > 0 ? (positive / stats.length) * 100 : 0,
      metrics_breakdown: metricsBreakdown as Record<any, number>,
      last_updated: new Date().toISOString(),
    }
  }

  /**
   * Get match summary for all players
   */
  async getMatchSummary(matchId: string): Promise<ApiResponse<MatchStatsSummary[]>> {
    try {
      const { data: stats, error: statsError } = await this.supabase
        .from("match_stats")
        .select("*, players(name)")
        .eq("match_id", matchId)

      if (statsError) throw statsError

      const { data: match, error: matchError } = await this.supabase.from("matches").select("date, opponent").eq("id", matchId).single()

      if (matchError) throw matchError

      // Group stats by player
      const playerStatsMap = new Map<string, MatchStat[]>()
      ;(stats || []).forEach((stat: any) => {
        const key = stat.player_id
        if (!playerStatsMap.has(key)) {
          playerStatsMap.set(key, [])
        }
        playerStatsMap.get(key)!.push(stat)
      })

      const summary: MatchStatsSummary[] = Array.from(playerStatsMap.entries()).map(([playerId, playerStats]) => {
        const positive = playerStats.filter((s) => POSITIVE_METRICS.includes(s.metric as any)).length
        const negative = playerStats.filter((s) => NEGATIVE_METRICS.includes(s.metric as any)).length

        const metricsBreakdown: Record<string, number> = {}
        playerStats.forEach((stat) => {
          metricsBreakdown[stat.metric] = (metricsBreakdown[stat.metric] || 0) + 1
        })

        return {
          match_id: matchId,
          player_id: playerId,
          match_date: match.date,
          opponent: match.opponent || "Unknown",
          total_actions: playerStats.length,
          actions_by_metric: metricsBreakdown as Record<any, number>,
          positive_actions: positive,
          negative_actions: negative,
          balance: positive - negative,
          efficiency: playerStats.length > 0 ? (positive / playerStats.length) * 100 : 0,
        }
      })

      return { success: true, data: summary }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to get match summary",
      }
    }
  }
}

export const matchStatsService = new MatchStatsService()
