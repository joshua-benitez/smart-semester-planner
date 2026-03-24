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

  const btnBase = "relative w-10 h-10 rounded-md flex items-center justify-center transition-colors cursor-pointer group"
  const btnActive = "text-brandPrimary bg-brandPrimary/10 font-bold"
  const btnInactive = "text-gray-400 hover:text-gray-900 hover:bg-gray-100"

  return (
    <aside
      className={`flex flex-col items-center py-4 gap-2 flex-shrink-0 bg-white border-r border-border w-[64px] ${className ?? ""}`}
    >
      <div className="mb-6 flex-shrink-0">
        <Logo width={32} unwrapped imgClassName="rounded-md" />
      </div>

      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`${btnBase} ${active ? btnActive : btnInactive}`}
          >
            {icon}
            <span
              className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md px-2.5 py-1 text-[0.75rem] font-medium opacity-0 translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 bg-gray-900 text-white shadow-md z-50"
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
            className={`${btnBase} ${active ? btnActive : btnInactive}`}
          >
            {icon}
          </Link>
        )
      })}
    </aside>
  )
}
