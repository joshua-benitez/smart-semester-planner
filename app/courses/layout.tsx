import AppShell from "@/components/layout/AppShell"

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
