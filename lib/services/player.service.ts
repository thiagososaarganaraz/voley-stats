/**
 * Player Service
 * Handles all player-related database operations
 */

import { getSupabaseClient } from "@/lib/client"
import type { Player, PlayerInput, ApiResponse } from "@/lib/types"
import { PlayerSchema } from "@/lib/types"

class PlayerService {
  private supabase = getSupabaseClient()

  async getPlayers(userId: string, teamId?: string): Promise<ApiResponse<Player[]>> {
    try {
      let query = this.supabase.from("players").select("*").eq("user_id", userId)

      if (teamId) {
        query = query.eq("team_id", teamId)
      }

      const { data, error } = await query

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch players",
      }
    }
  }

  async getPlayerById(playerId: string): Promise<ApiResponse<Player>> {
    try {
      const { data, error } = await this.supabase.from("players").select("*").eq("id", playerId).single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Player not found",
      }
    }
  }

  async createPlayer(userId: string, input: PlayerInput, teamId?: string): Promise<ApiResponse<Player>> {
    try {
      // Validate input
      const validated = PlayerSchema.parse(input)

      const { data, error } = await this.supabase
        .from("players")
        .insert([
          {
            user_id: userId,
            team_id: teamId,
            ...validated,
          },
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, data, message: "Player created successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create player",
      }
    }
  }

  async updatePlayer(playerId: string, input: Partial<PlayerInput>): Promise<ApiResponse<Player>> {
    try {
      // Validate partial input
      const validated = PlayerSchema.partial().parse(input)

      const { data, error } = await this.supabase.from("players").update(validated).eq("id", playerId).select().single()

      if (error) throw error

      return { success: true, data, message: "Player updated successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update player",
      }
    }
  }

  async deletePlayer(playerId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await this.supabase.from("players").delete().eq("id", playerId)

      if (error) throw error

      return { success: true, message: "Player deleted successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete player",
      }
    }
  }

  async togglePlayerStatus(playerId: string, active: boolean): Promise<ApiResponse<Player>> {
    try {
      const { data, error } = await this.supabase.from("players").update({ active }).eq("id", playerId).select().single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update player status",
      }
    }
  }
}

export const playerService = new PlayerService()
