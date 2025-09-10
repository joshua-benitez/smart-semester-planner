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
      <div className="mb-10 px-6 pt-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <Logo size={36} showText showTagline />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`block px-4 py-2 rounded-md font-medium ${isActive
                  ? "bg-[#0166FE] text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
            >
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer (sticks at bottom now) */}
      <div className="mt-auto text-xs text-white/50 px-6 py-4 border-t border-white/10">
        © {new Date().getFullYear()} CourseFlow
      </div>
    </aside>

  );
}
