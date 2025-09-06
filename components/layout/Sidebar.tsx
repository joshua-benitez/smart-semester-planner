"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/ui/Logo"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assignments", label: "Assignments" },
  { href: "/calendar", label: "Calendar" },
  { href: "/profile", label: "Profile" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#050a30] text-white h-screen sticky top-0 flex flex-col border-r border-white/10">
      {/* Brand */}
      <div className="px-6 py-5 border-b border-white/10">
        <Link href="/dashboard" className="inline-flex items-center gap-2">
          <Logo size={28} showText />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/")

          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                isActive
                  ? "bg-[#0166FE] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto text-xs text-white/50 px-6 py-4 border-t border-white/10">
        © {new Date().getFullYear()} CourseFlow
      </div>
    </aside>
  )
}
