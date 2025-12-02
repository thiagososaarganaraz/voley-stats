/**
 * Google Sync Service
 * Handles integration with Google Drive and Google Sheets for data export/backup
 */

import { getSupabaseClient } from "@/lib/client"
import type { GoogleSyncConfig, GoogleSyncLog, ApiResponse, SyncResult } from "@/lib/types"
import { API_CONFIG, TABLES } from "@/lib/config"

class GoogleSyncService {
  private supabase = getSupabaseClient()

  /**
   * Get Google sync configuration for user
   */
  async getSyncConfig(userId: string): Promise<ApiResponse<GoogleSyncConfig>> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOOGLE_SYNC_LOG)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error // PGRST116 = no rows

      return { success: true, data: data || undefined }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sync config",
      }
    }
  }

  /**
   * Save or update Google sync configuration
   */
  async saveSyncConfig(config: GoogleSyncConfig): Promise<ApiResponse<GoogleSyncConfig>> {
    try {
      const { data, error } = await this.supabase.from("google_sync_configs").upsert([config]).select().single()

      if (error) throw error

      return { success: true, data, message: "Sync config saved successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save sync config",
      }
    }
  }

  /**
   * Log a sync operation
   */
  async logSyncOperation(
    userId: string,
    syncType: "export" | "import" | "backup",
    resourceType: "matches" | "players" | "stats" | "all",
  ): Promise<ApiResponse<GoogleSyncLog>> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOOGLE_SYNC_LOG)
        .insert([
          {
            user_id: userId,
            sync_type: syncType,
            resource_type: resourceType,
            status: "pending",
            synced_records: 0,
            started_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to log sync operation",
      }
    }
  }

  /**
   * Update sync operation status
   */
  async updateSyncStatus(
    logId: string,
    status: "completed" | "failed",
    syncedRecords: number,
    googleFileId?: string,
    errorMessage?: string,
  ): Promise<ApiResponse<GoogleSyncLog>> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOOGLE_SYNC_LOG)
        .update({
          status,
          synced_records: syncedRecords,
          google_file_id: googleFileId,
          error_message: errorMessage,
          completed_at: new Date().toISOString(),
        })
        .eq("id", logId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update sync status",
      }
    }
  }

  /**
   * Get sync history for user
   */
  async getSyncHistory(userId: string, limit = 10): Promise<ApiResponse<GoogleSyncLog[]>> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.GOOGLE_SYNC_LOG)
        .select("*")
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .limit(limit)

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch sync history",
      }
    }
  }

  /**
   * Export match data to JSON
   */
  async exportMatchesAsJSON(userId: string, seasonId?: string): Promise<ApiResponse<string>> {
    try {
      let query = this.supabase.from(TABLES.MATCHES).select("*, match_players(*, players(*))").eq("user_id", userId)

      if (seasonId) {
        query = query.eq("season_id", seasonId)
      }

      const { data: matches, error } = await query

      if (error) throw error

      const json = JSON.stringify(matches, null, 2)
      return { success: true, data: json, message: "Matches exported successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to export matches",
      }
    }
  }

  /**
   * Export stats data to JSON
   */
  async exportStatsAsJSON(userId: string, matchId?: string): Promise<ApiResponse<string>> {
    try {
      let query = this.supabase.from(TABLES.MATCH_STATS).select("*, players(name), matches(date, opponent)").eq("user_id", userId)

      if (matchId) {
        query = query.eq("match_id", matchId)
      }

      const { data: stats, error } = await query

      if (error) throw error

      const json = JSON.stringify(stats, null, 2)
      return { success: true, data: json, message: "Stats exported successfully" }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to export stats",
      }
    }
  }

  /**
   * Check if Google auth token is valid
   */
  async validateGoogleToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch("https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + accessToken)
      return response.ok
    } catch {
      return false
    }
  }

  /**
   * Sync data automatically based on configuration
   */
  async autoSync(userId: string): Promise<ApiResponse<SyncResult>> {
    try {
      const configResult = await this.getSyncConfig(userId)

      if (!configResult.success || !configResult.data) {
        return {
          success: false,
          error: "Sync not configured for this user",
        }
      }

      // Validate token
      const isValid = await this.validateGoogleToken(configResult.data.google_access_token)

      if (!isValid) {
        return {
          success: false,
          error: "Google token expired. Please re-authenticate.",
        }
      }

      // Log sync operation
      const logResult = await this.logSyncOperation(userId, "export", "all")

      if (!logResult.success) {
        return { success: false, error: "Failed to start sync operation" }
      }

      // TODO: Implement actual Google Drive/Sheets sync logic
      // This is a placeholder for the actual implementation

      // Update sync status
      await this.updateSyncStatus(logResult.data!.id, "completed", 0)

      const result: SyncResult = {
        success: true,
        synced_count: 0,
        failed_count: 0,
        errors: [],
        synced_at: new Date().toISOString(),
      }

      return { success: true, data: result }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Auto sync failed",
      }
    }
  }
}

export const googleSyncService = new GoogleSyncService()
