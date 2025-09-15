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
      <div className="px-8 sm:px-12 pt-16 sm:pt-20">
        {/* Logo / Brand */}
        <div className="mb-14">
          <Logo size={72} showText showTagline />
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
