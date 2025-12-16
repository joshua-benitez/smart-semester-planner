"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "./Sidebar"

// bottom nav for mobile screens; hidden on desktop
export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-cardBg/95 border-t border-white/10 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 text-xs font-semibold text-white/70"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl border ${
                  active
                    ? "border-brandPrimary bg-brandPrimary/20 text-white"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                {icon}
              </span>
              <span className={active ? "text-white" : "text-white/70"}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
