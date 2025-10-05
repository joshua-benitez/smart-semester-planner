// dashboard layout keeps the sidebar persistent across pages
import Sidebar from "@/components/layout/Sidebar";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brandBg text-white flex">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
