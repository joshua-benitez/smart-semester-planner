"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "./Sidebar"

// bottom nav for mobile screens; hidden on desktop
export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-center justify-around px-4 py-2">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 py-1 text-xs font-semibold text-gray-500"
            >
              <span
                className={`grid h-10 w-10 place-items-center rounded-xl border ${
                  active
                    ? "border-brandPrimary bg-brandPrimary/10 text-brandPrimary"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {icon}
              </span>
              <span className={active ? "text-brandPrimary" : "text-gray-500"}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
