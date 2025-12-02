/**
 * Authentication and User Context
 * Provides user session management and role-based access control
 */

"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import type { User, Session } from "@/lib/types"
import type { RoleType } from "@/lib/config"
import { ROLE_PERMISSIONS, hasPermission } from "@/lib/config"
import { getSupabaseClient } from "@/lib/client"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  can: (permission: string) => boolean
  hasRole: (role: RoleType) => boolean
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  async function initializeAuth() {
    try {
      const supabase = getSupabaseClient()
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession()

      if (authSession) {
        // Fetch user data from database
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authSession.user.id)
          .single()

        if (userError) throw userError

        setUser(userData)
        setSession({
          user_id: authSession.user.id,
          access_token: authSession.access_token,
          refresh_token: authSession.refresh_token || undefined,
          expires_at: authSession.expires_at ? new Date(authSession.expires_at * 1000).toISOString() : "",
          created_at: new Date().toISOString(),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    try {
      const supabase = getSupabaseClient()
      await supabase.auth.signOut()
      setUser(null)
      setSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed")
    }
  }

  function can(permission: string): boolean {
    if (!user) return false
    return hasPermission(user.role as RoleType, permission)
  }

  function hasRole(role: RoleType): boolean {
    return user?.role === role
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    isAuthenticated: !!user && !!session,
    can,
    hasRole,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Hook to use auth context
 * @throws Error if used outside of AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

/**
 * Hook to check if user has specific permission
 */
export function usePermission(permission: string): boolean {
  const { can } = useAuth()
  return can(permission)
}

/**
 * Hook to check if user has specific role
 */
export function useRole(role: RoleType): boolean {
  const { hasRole } = useAuth()
  return hasRole(role)
}

/**
 * Hook to require specific permission
 * @throws Error if user doesn't have permission
 */
export function useRequirePermission(permission: string) {
  const { can } = useAuth()
  if (!can(permission)) {
    throw new Error(`Permission denied: ${permission}`)
  }
}
