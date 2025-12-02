"use client"

import Link from "next/link"
import { useState } from "react"

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Inicio", icon: "🏠" },
    { href: "/matches/new", label: "Nuevo", icon: "➕" },
    { href: "/matches", label: "Partidos", icon: "📂" },
    { href: "/season-stats", label: "Estadísticas", icon: "📊" },
    { href: "/players", label: "Jugadores", icon: "👥" },
    { href: "/settings", label: "Configuración", icon: "⚙️" },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="font-bold text-xl bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
          ⚡Voley Stats
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors duration-200 flex items-center gap-1"
            >
              <span className="text-base">{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center text-slate-600"
          aria-label="Toggle menu"
        >
          <span className="text-2xl">{mobileOpen ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-slate-50">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-4 py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white rounded-lg transition-colors duration-200 flex items-center gap-3"
                onClick={() => setMobileOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
