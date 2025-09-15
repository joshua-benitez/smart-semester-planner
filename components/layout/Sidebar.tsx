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
    <aside className="w-72 bg-brandBg bg-[#050a30] text-white flex flex-col h-screen">
      {/* Logo / Brand */}
      <div className="px-6 pt-6 pb-4 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo size={160} />
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
              className={`block px-4 py-2.5 rounded-md font-medium ${isActive
                  ? "bg-brandPrimary text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Removed footer per request */}
    </aside>

  );
}
