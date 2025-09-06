// app/dashboard/layout.tsx
import Sidebar from "@/components/layout/Sidebar"

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#050a30] text-white flex">
      {/* Left rail */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
