import Link from "next/link"
import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import Logo from "@/components/ui/Logo"

export default async function LandingPage() {
  const session = await getServerSession()

  if (session) {
    redirect("/dashboard") // logged-in users skip landing
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#050a30] text-white px-12">
      {/* Logo / Brand */}
      <div className="mb-10">
        <Logo size={56} />
      </div>

      {/* Tagline */}
      <div className="text-center mb-10">
        <p className="text-2xl font-semibold text-slate-300">Own your education.</p>
        <p className="text-2xl font-semibold text-slate-300">Find your Flow.</p>
      </div>

      {/* Call to Action */}
      <div className="flex gap-4">
        <Link href="/auth/signin" className="btn-cta">
          Get Started
        </Link>
      </div>
    </div>
  )
}
