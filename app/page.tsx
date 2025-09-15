// app/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Logo from "@/components/ui/Logo";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect("/dashboard"); // logged-in users skip landing
  }

  return (
    <div className="min-h-screen bg-[#050a30] text-white">
      <div className="px-8 sm:px-12 pt-10">
        {/* Logo / Brand */}
        <div className="mb-8">
          <Logo size={56} showText />
        </div>

        {/* Tagline */}
        <div className="space-y-1 mb-10">
          <p className="text-2xl sm:text-3xl font-semibold text-slate-300">Own your education.</p>
          <p className="text-2xl sm:text-3xl font-semibold text-slate-300">Find your Flow.</p>
        </div>

        {/* Call to Action */}
        <div>
          <Link href="/auth/signin" className="btn-cta">
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
