import IconRail from "@/components/layout/IconRail"
import MobileNav from "@/components/layout/MobileNav"

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0b0d12" }}>
      <IconRail className="hidden lg:flex" />
      <main className="flex-1 min-w-0 overflow-hidden pb-16 lg:pb-0">
        {children}
        <MobileNav />
      </main>
    </div>
  )
}
