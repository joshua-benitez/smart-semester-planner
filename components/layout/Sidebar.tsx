"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assignments", label: "Assignments" },
  { href: "/calendar", label: "Calendar" },
  { href: "/streaks", label: "Streaks" },
  { href: "/profile", label: "Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-96 bg-brandBg text-white flex flex-col h-screen">
      {/* Logo / Brand */}
      <div className="p-2 border-b border-white/10">
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
      <nav className="flex-1 space-y-3 px-4">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2.5 font-medium border-l-2 transition-colors ${
                isActive
                  ? "text-white border-brandPrimary bg-brandPrimary/10"
                  : "text-white/80 border-transparent hover:text-white hover:border-brandPrimary hover:bg-brandPrimary/10"
              }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </aside>

  );
}
