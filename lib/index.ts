export interface Player {
  id: string
  name: string
  number?: number
  position?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Opponent {
  id: string
  name: string
  created_at: string
}

export interface Match {
  id: string
  date: string
  opponent?: string
  opponent_id?: string
  category?: string
  category_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface MatchPlayer {
  id: string
  match_id: string
  player_id: string
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

export interface MatchStat {
  id: string
  match_id: string
  player_id: string
  set_number: number
  point_number: number
  metric: "S" | "B" | "CA" | "AR" | "ES" | "EA" | "ENF"
  timestamp_recorded: string
  created_at: string
}

export type MetricType = "S" | "B" | "CA" | "AR" | "ES" | "EA" | "ENF"

export interface MetricLabel {
  key: MetricType
  label: string
  description: string
}

export const METRICS: Record<MetricType, string> = {
  S: "Saque",
  B: "Bloqueo",
  CA: "Contra Ataque",
  AR: "Ataque Rotación",
  ES: "Error Saque",
  EA: "Error Ataque",
  ENF: "Error no Forzado",
}

export const POSITIVE_METRICS: MetricType[] = ["S", "B", "CA", "AR"]
export const NEGATIVE_METRICS: MetricType[] = ["ES", "EA", "ENF"]

export function calculateBalance(positive: number, negative: number): number {
  return positive - negative
}
