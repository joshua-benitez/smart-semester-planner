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
    <aside className="w-64 bg-[#050a30] text-white p-6">
      <Link href="/dashboard" className="block mb-6">
        {/* logo with text; tagline optional */}
        <Logo size={28} showText showTagline />
      </Link>

      <nav className="space-y-2">
        {navItems.map(({ href, label }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                isActive ? "bg-blue-600 text-white" : "hover:bg-blue-800 hover:text-blue-300"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
