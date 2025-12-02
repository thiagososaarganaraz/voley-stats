"use client"

import Link from "next/link"
import { useState } from "react"

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { href: "/", label: "Inicio" },
    { href: "/players", label: "Jugadores" },
    { href: "/matches", label: "Partidos" },
    { href: "/season-stats", label: "Estadísticas" },
    { href: "/settings", label: "Configuración" },
  ]

  return (
    <nav className="bg-blue-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          🏐 Volleyball Stats
        </Link>

        <div className="hidden md:flex gap-4">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-2 hover:bg-blue-700 rounded transition">
              {item.label}
            </Link>
          ))}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden">
          ☰
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-blue-700 px-4 py-2 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 hover:bg-blue-600 rounded transition"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
