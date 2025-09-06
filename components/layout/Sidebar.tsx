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
    <aside className="w-64 bg-[#050a30] text-white flex flex-col h-screen">
      {/* Logo / Brand */}
      <div className="mb-8 px-4 pt-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo size={36} showText />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2 rounded-md font-medium transition-colors ${
                isActive
                  ? "bg-[#0166FE] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto text-xs text-white/50">
        <p className="px-4 py-3 border-t border-white/10">© 2025 CourseFlow</p>
      </div>
    </aside>
  );
}
