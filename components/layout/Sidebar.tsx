"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";
import Logo from "@/components/ui/Logo";
import { useLadder } from "@/hooks/useLadder";
import LadderSidebarCard from "@/components/features/ladder/LadderSidebarCard";

const navItems: Array<{ href: string; label: string; icon: ReactNode }> = [
  { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
  { href: "/assignments", label: "Assignments", icon: <AssignmentsIcon /> },
  { href: "/calendar", label: "Calendar", icon: <CalendarIcon /> },
  { href: "/profile", label: "Profile", icon: <ProfileIcon /> },
];

function IconShell({ children }: { children: ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

function DashboardIcon() {
  return (
    <IconShell>
      <path d="M4 13h16" />
      <path d="M10 21H6a2 2 0 0 1-2-2v-6" />
      <path d="M20 13v6a2 2 0 0 1-2 2h-4" />
      <path d="M6 3h12l2 6H4l2-6Z" />
    </IconShell>
  )
}

function AssignmentsIcon() {
  return (
    <IconShell>
      <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M9 7h6" />
      <path d="M9 11h6" />
      <path d="M9 15h4" />
    </IconShell>
  )
}

function CalendarIcon() {
  return (
    <IconShell>
      <path d="M6 4V2" />
      <path d="M18 4V2" />
      <path d="M4 7h16" />
      <rect x="4" y="4" width="16" height="18" rx="2" />
      <path d="m8 12 2 2 3-3" />
    </IconShell>
  )
}

function ProfileIcon() {
  return (
    <IconShell>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </IconShell>
  )
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data, loading, error, refresh } = useLadder();

  return (
    <aside className="w-96 bg-brandBg text-white flex flex-col h-screen">
      {/* Logo / Brand */}
      <div className="border-b border-white/10 px-4 py-5">
        <Link href="/dashboard" className="flex items-center gap-0">
          <Logo width={96} unwrapped imgClassName="block" />
          <div className="leading-tight select-none -ml-1">
            <div className="text-2xl font-bold">CourseFlow</div>
            <div className="text-white/90 text-sm">Own your education.</div>
            <div className="text-white/90 text-sm">Find your Flow.</div>
          </div>
        </Link>
      </div>


      {/* Navigation */}
      <nav className="space-y-2 px-4 py-5">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${isActive
                  ? "bg-brandPrimary/15 text-white shadow-inner"
                  : "text-white/80 hover:text-white hover:bg-white/5"
                }`}
            >
              <span className="shrink-0 text-brandPrimary/80">
                {icon}
              </span>
              <span className="tracking-tight">{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Ladder fills the rest */}

      <div className="flex-1 overflow-y-auto p-4">
        <LadderSidebarCard
          data={data}
          loading={loading}
          error={error}
          onRefresh={refresh}
        />
      </div>
    </aside>
  );
}
