"use client"

import { useEffect } from "react"

/**
 * This component suppresses hydration mismatch warnings caused by browser extensions
 * that modify the DOM after server rendering (e.g., Grammarly, spell checkers, etc.)
 */
export function HydrationWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress hydration mismatch warnings in development
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      const originalError = console.error
      console.error = (...args: any[]) => {
        // Filter out hydration-related errors from browser extensions
        if (
          args[0]?.includes?.("hydrated but some attributes") ||
          args[0]?.includes?.("Hydration failed")
        ) {
          return
        }
        originalError.call(console, ...args)
      }
    }
  }, [])

  return <>{children}</>
}
