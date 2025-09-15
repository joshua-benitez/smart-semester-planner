"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/assignments", label: "Assignments" },
  { href: "/calendar", label: "Calendar" },
  { href: "/profile", label: "Profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-72 bg-brandBg text-white flex flex-col h-screen">
      {/* Logo / Brand */}
      <div className="px-6 pt-6 pb-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo size={300} />
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
              className={`group relative block px-4 py-2.5 rounded-md font-medium transition-colors ${
                isActive
                  ? "text-white"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span className="relative z-10">{label}</span>
              <span
                className={`pointer-events-none absolute left-0 right-0 bottom-0.5 h-0.5 bg-brandPrimary transition-all duration-200 origin-left ${
                  isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                }`}
              />
            </Link>
          )
        })}
      </nav>
    </aside>

  );
}
