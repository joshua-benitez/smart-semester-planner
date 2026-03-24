"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { navItems } from "./Sidebar"

// bottom nav for mobile screens; hidden on desktop
export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/80 pb-safe backdrop-blur-lg lg:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-2">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-[64px] flex-col items-center gap-1 p-2"
            >
              <span
                className={`flex h-7 w-7 items-center justify-center transition-colors duration-200 ${
                  active ? "text-brandPrimary" : "text-gray-400"
                }`}
              >
                {icon}
              </span>
              <span
                className={`text-[0.65rem] font-semibold transition-colors duration-200 ${
                  active ? "text-brandPrimary" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
