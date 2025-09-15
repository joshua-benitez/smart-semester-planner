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
    <div className="min-h-screen bg-brandBg bg-[#050a30] text-white">
      <div className="px-6 sm:px-8 pt-6 sm:pt-8">
        {/* Logo / Brand */}
        <div className="mb-14">
          <Logo size={400} />
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
