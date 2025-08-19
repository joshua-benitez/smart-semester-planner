export default function HomePage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      {/* Assignment list will go here */}
      <ul className="space-y-4">
        {/* Example assignment item */}
        <li className="p-4 border rounded shadow">
          <h2 className="text-xl font-semibold">Assignment Title</h2>
          <p className="text-gray-600">Course Name</p>
          <p className="text-gray-500">Due Date: <time dateTime="2023-10-01T12:00:00Z">October 1, 2023</time></p>
          <p className="text-gray-700">Description of the assignment goes here.</p>
          <div className="mt-2">
            <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold mr-2">Type: Homework</span>
            <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold mr-2">Difficulty: Medium</span>
            <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-semibold">Weight: 20%</span>
          </div>
        </li>
      </ul>
      <div className="mt-6">
        <a href="/assignments/new" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Add New Assignment
        </a>
      </div>
    </div>
  )
}