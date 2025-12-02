/**
 * Match Service
 * Handles all match-related database operations
 */

import { getSupabaseClient } from "@/lib/client"
import type { Match, MatchInput, ApiResponse, MatchPlayer } from "@/lib/types"
import { MatchSchema } from "@/lib/types"

class MatchService {
  private supabase = getSupabaseClient()

  async getMatches(userId: string, seasonId?: string): Promise<ApiResponse<Match[]>> {
    try {
      let query = this.supabase.from("matches").select("*").eq("user_id", userId)

      if (seasonId) {
        query = query.eq("season_id", seasonId)
      }

      const { data, error } = await query.order("date", { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch matches",
      }
    }
  }

  async getMatchById(matchId: string): Promise<ApiResponse<Match>> {
    try {
      const { data, error } = await this.supabase.from("matches").select("*").eq("id", matchId).single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Match not found",
      }
    }
  }

  async createMatch(userId: string, input: MatchInput, seasonId?: string): Promise<ApiResponse<Match>> {
    try {
      // Validate input
      const validated = MatchSchema.parse(input)

      const { data, error } = await this.supabase
        .from("matches")
        .insert([
          {
            user_id: userId,
            season_id: seasonId,
            ...validated,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, data, message: "Match created successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create match",
      }
    }
  }

  async updateMatch(matchId: string, input: Partial<MatchInput>): Promise<ApiResponse<Match>> {
    try {
      const validated = MatchSchema.partial().parse(input)

      const { data, error } = await this.supabase.from("matches").update(validated).eq("id", matchId).select().single()

      if (error) throw error

      return { success: true, data, message: "Match updated successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update match",
      }
    }
  }

  async deleteMatch(matchId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.from("matches").delete().eq("id", matchId)

      if (error) throw error

      return { success: true, message: "Match deleted successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete match",
      }
    }
  }

  async addPlayerToMatch(matchId: string, playerId: string, position?: string): Promise<ApiResponse<MatchPlayer>> {
    try {
      const { data, error } = await this.supabase
        .from("match_players")
        .insert([
          {
            match_id: matchId,
            player_id: playerId,
            position,
            status: "convoked",
          },
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, data, message: "Player added to match" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add player to match",
      }
    }
  }

  async removePlayerFromMatch(matchPlayerId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.from("match_players").delete().eq("id", matchPlayerId)

      if (error) throw error

      return { success: true, message: "Player removed from match" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove player from match",
      }
    }
  }

  async getMatchPlayers(matchId: string): Promise<ApiResponse<MatchPlayer[]>> {
    try {
      const { data, error } = await this.supabase.from("match_players").select("*").eq("match_id", matchId)

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch match players",
      }
    }
  }
}

export const matchService = new MatchService()
