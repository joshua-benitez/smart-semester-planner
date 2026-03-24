import IconRail from "@/components/layout/IconRail"
import MobileNav from "@/components/layout/MobileNav"

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-brandBg">
      <IconRail className="hidden lg:flex" />
      <main className="relative flex-1 min-w-0 overflow-hidden pb-16 lg:pb-0">
        {children}
        <MobileNav />
      </main>
    </div>
  )
}
