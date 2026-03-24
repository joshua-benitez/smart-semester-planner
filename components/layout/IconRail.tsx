"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type ReactNode } from "react"
import Logo from "@/components/ui/Logo"

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
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

  const btnBase = "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 cursor-pointer group"
  const btnActive = "text-brandPrimary bg-brandPrimary/10"
  const btnInactive = "text-gray-400 hover:text-gray-900 hover:bg-gray-100"

  return (
    <aside
      className={`z-50 flex w-[72px] flex-shrink-0 flex-col items-center gap-3 border-r border-gray-200 bg-white py-5 ${className ?? ""}`}
    >
      <div className="mb-6 flex-shrink-0">
        <Logo width={36} unwrapped imgClassName="rounded-lg shadow-sm" />
      </div>

      {NAV.map(({ href, label, icon }) => {
        const active = pathname === href || pathname.startsWith(href + "/")
        return (
          <Link
            key={href}
            href={href}
            className={`${btnBase} ${active ? btnActive : btnInactive}`}
          >
            {active && (
              <div className="absolute left-[-12px] top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-brandPrimary" />
            )}
            {icon}
            <span
              className="pointer-events-none absolute left-full z-50 ml-4 translate-x-2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
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
            {active && (
              <div className="absolute left-[-12px] top-1/2 h-6 w-1.5 -translate-y-1/2 rounded-r-full bg-brandPrimary" />
            )}
            {icon}
            <span
              className="pointer-events-none absolute left-full z-50 ml-4 translate-x-2 whitespace-nowrap rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white opacity-0 shadow-md transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
            >
              {label}
            </span>
          </Link>
        )
      })}
    </aside>
  )
}
