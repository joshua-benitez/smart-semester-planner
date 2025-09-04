import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"

export default async function LandingPage() {
  const session = await getServerSession()

  if (session) {
    redirect("/dashboard") // logged-in users skip landing
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050a30] text-white px-6">
      {/* Logo / Brand */}
      <h1 className="text-5xl font-extrabold mb-4 animate-float">CourseFlow</h1>
      <p className="text-lg text-slate-300 mb-10">
        Own your education. Find your Flow.
      </p>

      {/* Call to Action */}
      <div className="flex gap-4">
        <Link href="/auth/signin" className="btn-primary">
          Sign In
        </Link>
        <Link href="/auth/signup" className="btn-secondary">
          Sign Up
        </Link>
      </div>
    </div>
  )
}
