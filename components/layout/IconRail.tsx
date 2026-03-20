"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"
import Logo from "@/components/ui/Logo"

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
    href: "/courses",
    label: "Courses",
    icon: (
      <Icon>
        <path d="M4 6h16" />
        <path d="M4 12h16" />
        <path d="M4 18h10" />
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
    "relative w-[34px] h-[34px] rounded-[7px] flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer group"
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
      <div className="mb-3.5 flex-shrink-0">
        <Logo width={28} unwrapped imgClassName="rounded-[6px]" />
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
            <span
              className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2 py-1 text-[0.7rem] font-semibold opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
              style={{ background: "rgba(15,17,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(230,234,246,0.8)" }}
            >
              {label}
            </span>
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
            <span
              className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md px-2 py-1 text-[0.7rem] font-semibold opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0"
              style={{ background: "rgba(15,17,22,0.95)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(230,234,246,0.8)" }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </aside>
  )
}
