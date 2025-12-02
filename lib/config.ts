/**
 * Centralized configuration for the Volleyball Stats application
 * All hardcoded values, metrics, roles, and app settings are defined here
 */

/**
 * Metric definitions
 * S = Saque (Serve)
 * B = Bloqueo (Block)
 * CA = Contra Ataque (Counter Attack)
 * AR = Ataque Rotación (Rotation Attack)
 * ES = Error Saque (Serve Error)
 * EA = Error Ataque (Attack Error)
 * ENF = Error no Forzado (Unforced Error)
 */
export const METRIC_TYPES = {
  SERVE: "S",
  BLOCK: "B",
  COUNTER_ATTACK: "CA",
  ROTATION_ATTACK: "AR",
  ERROR_SERVE: "ES",
  ERROR_ATTACK: "EA",
  ERROR_UNFORCED: "ENF",
} as const

export type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES]

export const METRICS_CONFIG: Record<MetricType, { label: string; description: string; type: "positive" | "negative" }> = {
  [METRIC_TYPES.SERVE]: {
    label: "Saque",
    description: "Punto de saque ganado",
    type: "positive",
  },
  [METRIC_TYPES.BLOCK]: {
    label: "Bloqueo",
    description: "Punto de bloqueo ganado",
    type: "positive",
  },
  [METRIC_TYPES.COUNTER_ATTACK]: {
    label: "Contra Ataque",
    description: "Punto en contra ataque",
    type: "positive",
  },
  [METRIC_TYPES.ROTATION_ATTACK]: {
    label: "Ataque Rotación",
    description: "Punto en ataque de rotación",
    type: "positive",
  },
  [METRIC_TYPES.ERROR_SERVE]: {
    label: "Error Saque",
    description: "Error en saque",
    type: "negative",
  },
  [METRIC_TYPES.ERROR_ATTACK]: {
    label: "Error Ataque",
    description: "Error en ataque",
    type: "negative",
  },
  [METRIC_TYPES.ERROR_UNFORCED]: {
    label: "Error no Forzado",
    description: "Error no forzado en juego",
    type: "negative",
  },
}

export const POSITIVE_METRICS: MetricType[] = [METRIC_TYPES.SERVE, METRIC_TYPES.BLOCK, METRIC_TYPES.COUNTER_ATTACK, METRIC_TYPES.ROTATION_ATTACK]

export const NEGATIVE_METRICS: MetricType[] = [METRIC_TYPES.ERROR_SERVE, METRIC_TYPES.ERROR_ATTACK, METRIC_TYPES.ERROR_UNFORCED]

/**
 * Roles and Permissions
 */
export const ROLE_TYPES = {
  SUPERADMIN: "superadmin",
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
} as const

export type RoleType = typeof ROLE_TYPES[keyof typeof ROLE_TYPES]

export const ROLE_PERMISSIONS: Record<RoleType, string[]> = {
  [ROLE_TYPES.SUPERADMIN]: [
    "manage_users",
    "manage_teams",
    "manage_roles",
    "create_season",
    "manage_matches",
    "record_stats",
    "view_stats",
    "export_data",
    "manage_settings",
    "access_analytics",
    "manage_integrations",
  ],
  [ROLE_TYPES.ADMIN]: [
    "manage_teams",
    "create_season",
    "manage_matches",
    "record_stats",
    "view_stats",
    "export_data",
    "manage_settings",
    "access_analytics",
  ],
  [ROLE_TYPES.EDITOR]: ["create_season", "manage_matches", "record_stats", "view_stats", "export_data", "access_analytics"],
  [ROLE_TYPES.VIEWER]: ["view_stats", "access_analytics"],
}

/**
 * Default application settings
 */
export const APP_DEFAULTS = {
  DEFAULT_SETS: 3,
  POINTS_PER_SET: 25,
  SETS_TO_WIN: 2,
  DEFAULT_TIMEZONE: "America/Argentina/Buenos_Aires",
  MAX_TEAM_SIZE: 14,
  MAX_SUBSTITUTE_PLAYERS: 6,
  SESSION_TIMEOUT_MINUTES: 30,
  AUTO_SYNC_INTERVAL_SECONDS: 30,
} as const

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  ENABLE_GOOGLE_SYNC: true,
  ENABLE_ANALYTICS: true,
  ENABLE_TEAM_MANAGEMENT: true,
  ENABLE_SEASONAL_STATS: true,
  ENABLE_EXPORT_PDF: true,
  ENABLE_EXPORT_EXCEL: true,
  ENABLE_REAL_TIME_SYNC: true,
} as const

/**
 * Database table names
 */
export const TABLES = {
  USERS: "users",
  USER_PROFILES: "user_profiles",
  TEAMS: "teams",
  TEAM_MEMBERS: "team_members",
  PLAYERS: "players",
  MATCHES: "matches",
  MATCH_PLAYERS: "match_players",
  MATCH_PLAYER_NAMES: "match_player_names",
  MATCH_STATS: "match_stats",
  SEASONS: "seasons",
  SEASON_STATS: "season_stats",
  ROLES: "roles",
  PERMISSIONS: "permissions",
  GOOGLE_SYNC_LOG: "google_sync_log",
} as const

/**
 * API and integration settings
 */
export const API_CONFIG = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  API_TIMEOUT_MS: 30000,
  MAX_RETRIES: 3,
  RETRY_DELAY_MS: 1000,
} as const

/**
 * Message templates
 */
export const MESSAGES = {
  SUCCESS: {
    STAT_RECORDED: "Acción registrada correctamente",
    MATCH_CREATED: "Partido creado exitosamente",
    PLAYER_ADDED: "Jugador agregado correctamente",
    DATA_EXPORTED: "Datos exportados correctamente",
  },
  ERROR: {
    STAT_FAILED: "Error al registrar la acción",
    MATCH_FAILED: "Error al crear el partido",
    PLAYER_FAILED: "Error al agregar jugador",
    UNAUTHORIZED: "No tienes permiso para realizar esta acción",
    NOT_FOUND: "Recurso no encontrado",
  },
  VALIDATION: {
    INVALID_METRIC: "Métrica inválida",
    INVALID_PLAYER: "Jugador inválido",
    INVALID_MATCH: "Partido inválido",
    REQUIRED_FIELD: "Este campo es requerido",
  },
} as const

/**
 * Utility functions
 */
export function isPositiveMetric(metric: MetricType): boolean {
  return POSITIVE_METRICS.includes(metric)
}

export function isNegativeMetric(metric: MetricType): boolean {
  return NEGATIVE_METRICS.includes(metric)
}

export function hasPermission(role: RoleType, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function hasAnyPermission(role: RoleType, permissions: string[]): boolean {
  return permissions.some((perm) => hasPermission(role, perm))
}

export function getAllMetricsAsArray(): { key: MetricType; label: string; description: string; type: "positive" | "negative" }[] {
  return Object.entries(METRICS_CONFIG).map(([key, config]) => ({
    key: key as MetricType,
    ...config,
  }))
}

export function calculateBalance(positive: number, negative: number): number {
  return positive - negative
}
