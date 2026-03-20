"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="w-[15px] h-[15px]"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

const NAV = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <Icon>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </Icon>
    ),
  },
  {
    href: "/assignments",
    label: "Assignments",
    icon: (
      <Icon>
        <path d="M8 6h13M8 12h13M8 18h7" />
        <circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none" />
      </Icon>
    ),
  },
  {
    href: "/calendar",
    label: "Calendar",
    icon: (
      <Icon>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </Icon>
    ),
  },
]

const BOTTOM_NAV = [
  {
    href: "/profile",
    label: "Profile",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </Icon>
    ),
  },
]

export default function IconRail({ className }: { className?: string }) {
  const pathname = usePathname()

  const btnBase =
    "w-[34px] h-[34px] rounded-[7px] flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer"
  const btnActive = "text-white/90"
  const btnInactive = "text-white/25 hover:text-white/50 hover:bg-white/[0.04]"

  return (
    <aside
      className={`flex-col items-center py-3.5 gap-0.5 flex-shrink-0 ${className ?? ""}`}
      style={{
        width: 48,
        background: "#0b0d12",
        borderRight: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      <div
        className="w-6 h-6 rounded-[6px] flex items-center justify-center mb-3.5 flex-shrink-0"
        style={{ background: "rgba(230,234,246,0.9)" }}
      >
        <svg viewBox="0 0 24 24" fill="#0b0d12" className="w-[13px] h-[13px]">
          <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
        </svg>
      </div>

      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`${btnBase} ${active ? btnActive : btnInactive}`}
            style={active ? { background: "rgba(255,255,255,0.07)" } : undefined}
          >
            {icon}
          </Link>
        )
      })}

      <div className="flex-1" />

      {BOTTOM_NAV.map(({ href, label, icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            title={label}
            className={`${btnBase} ${active ? btnActive : btnInactive}`}
            style={active ? { background: "rgba(255,255,255,0.07)" } : undefined}
          >
            {icon}
          </Link>
        )
      })}
    </aside>
  )
}
