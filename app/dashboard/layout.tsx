// dashboard layout keeps the sidebar persistent across pages
import Sidebar from "@/components/layout/Sidebar";
import MobileNav from "@/components/layout/MobileNav";

export default function DashboardRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brandBg text-white flex">
      <Sidebar className="hidden lg:flex" />
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {children}
        <MobileNav />
      </main>
    </div>
  );
}
