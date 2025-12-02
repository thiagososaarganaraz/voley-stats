import { z } from "zod"
import type { RoleType, MetricType } from "./config"

/**
 * ============================================================================
 * USER AND AUTHENTICATION TYPES
 * ============================================================================
 */

export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: RoleType
  created_at: string
  updated_at: string
  last_login?: string
}

export interface UserProfile {
  user_id: string
  bio?: string
  phone?: string
  timezone: string
  language: string
  notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface Session {
  user_id: string
  access_token: string
  refresh_token?: string
  expires_at: string
  created_at: string
}

/**
 * ============================================================================
 * TEAM AND ORGANIZATION TYPES
 * ============================================================================
 */

export interface Team {
  id: string
  user_id: string
  name: string
  description?: string
  logo_url?: string
  owner_id: string
  created_at: string
  updated_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: RoleType
  joined_at: string
}

/**
 * ============================================================================
 * PLAYER TYPES
 * ============================================================================
 */

export interface Player {
  id: string
  user_id: string
  team_id?: string
  name: string
  number?: number
  position?: string
  height?: number
  date_of_birth?: string
  phone?: string
  email?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface PlayerStats {
  player_id: string
  total_actions: number
  positive_actions: number
  negative_actions: number
  balance: number
  efficiency: number // positive / (positive + negative)
  metrics_breakdown: Record<MetricType, number>
  last_updated: string
}

/**
 * ============================================================================
 * SEASON TYPES
 * ============================================================================
 */

export interface Season {
  id: string
  user_id: string
  team_id?: string
  name: string
  start_date: string
  end_date?: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface SeasonStats {
  id: string
  season_id: string
  player_id: string
  team_id?: string
  matches_played: number
  total_actions: number
  positive_actions: number
  negative_actions: number
  balance: number
  efficiency: number
  metrics_breakdown: Record<MetricType, number>
  created_at: string
  updated_at: string
}

/**
 * ============================================================================
 * MATCH TYPES
 * ============================================================================
 */

export interface Match {
  id: string
  user_id: string
  season_id?: string
  team_id?: string
  date: string
  opponent?: string
  opponent_id?: string
  category?: string
  notes?: string
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
  final_score?: {
    home_sets: number
    away_sets: number
    home_points?: number
    away_points?: number
  }
  created_at: string
  updated_at: string
}

export interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
  position?: string
  shirt_number?: number
  status: "convoked" | "played" | "substituted" | "not_convoked"
  created_at: string
}

export interface MatchPlayerName {
  id: string
  match_id: string
  player_id: string
  match_number?: number
  custom_name?: string
  created_at: string
  updated_at: string
}

/**
 * ============================================================================
 * STATS AND METRICS TYPES
 * ============================================================================
 */

export interface MatchStat {
  id: string
  match_id: string
  player_id: string
  set_number: number
  point_number: number
  metric: MetricType
  timestamp_recorded: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface MatchStatsSummary {
  match_id: string
  player_id: string
  match_date: string
  opponent: string
  total_actions: number
  actions_by_metric: Record<MetricType, number>
  positive_actions: number
  negative_actions: number
  balance: number
  efficiency: number
}

export interface AggregatedStats {
  period: "daily" | "weekly" | "monthly" | "seasonal"
  start_date: string
  end_date: string
  player_id: string
  total_actions: number
  actions_by_metric: Record<MetricType, number>
  matches_count: number
  efficiency: number
  trends: {
    metric: MetricType
    trend: "up" | "down" | "stable"
    change_percentage: number
  }[]
}

/**
 * ============================================================================
 * GOOGLE INTEGRATION TYPES
 * ============================================================================
 */

export interface GoogleSyncConfig {
  user_id: string
  google_access_token: string
  google_refresh_token: string
  google_drive_folder_id?: string
  google_sheets_id?: string
  auto_sync_enabled: boolean
  last_sync_at?: string
  sync_frequency: "hourly" | "daily" | "weekly"
  created_at: string
  updated_at: string
}

export interface GoogleSyncLog {
  id: string
  user_id: string
  sync_type: "export" | "import" | "backup"
  status: "pending" | "in_progress" | "completed" | "failed"
  resource_type: "matches" | "players" | "stats" | "all"
  google_file_id?: string
  error_message?: string
  synced_records: number
  started_at: string
  completed_at?: string
}

/**
 * ============================================================================
 * VALIDATION SCHEMAS (Zod)
 * ============================================================================
 */

export const PlayerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  number: z.number().int().min(0).max(99).optional(),
  position: z.string().optional(),
  height: z.number().positive().optional(),
  date_of_birth: z.string().datetime().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  active: z.boolean().default(true),
})

export type PlayerInput = z.infer<typeof PlayerSchema>

export const MatchSchema = z.object({
  date: z.string().datetime(),
  opponent: z.string().min(2).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).default("scheduled"),
})

export type MatchInput = z.infer<typeof MatchSchema>

export const MatchStatSchema = z.object({
  match_id: z.string().uuid(),
  player_id: z.string().uuid(),
  set_number: z.number().int().min(1),
  point_number: z.number().int().min(0),
  metric: z.string().refine((m: string) => ["S", "B", "CA", "AR", "ES", "EA", "ENF"].includes(m), "Métrica inválida"),
  notes: z.string().optional(),
})

export type MatchStatInput = z.infer<typeof MatchStatSchema>

export const UserProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  timezone: z.string(),
  language: z.string().default("es"),
  notifications_enabled: z.boolean().default(true),
})

export type UserProfileInput = z.infer<typeof UserProfileSchema>

/**
 * ============================================================================
 * HELPER TYPES
 * ============================================================================
 */

export type WithUser<T> = T & { user: User }
export type WithTimestamp<T> = T & { created_at: string; updated_at: string }

/**
 * Generic response types
 */
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface SyncResult {
  success: boolean
  synced_count: number
  failed_count: number
  errors: Array<{ item_id: string; error: string }>
  synced_at: string
}
