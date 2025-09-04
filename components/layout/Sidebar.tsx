export default function Sidebar() {
  return (
    <aside className="w-64 bg-[#050a30] text-white p-6">
      <h2 className="text-xl font-bold mb-6">CourseFlow</h2>
      <nav className="space-y-4">
        <a href="/dashboard" className="block hover:text-blue-400">Dashboard</a>
        <a href="/assignments" className="block hover:text-blue-400">Assignments</a>
        <a href="/calendar" className="block hover:text-blue-400">Calendar</a>
        <a href="/profile" className="block hover:text-blue-400">Profile</a>
      </nav>
    </aside>
  )
}
