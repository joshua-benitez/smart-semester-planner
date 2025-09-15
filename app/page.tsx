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
    <div className="relative min-h-screen bg-brandBg text-white">
      {/* Top-left brand header (fixed padding, absolute for precise placement) */}
      <header className="absolute top-4 left-4">
        <Logo size={400} />
      </header>

      {/* Hero actions */}
      <main className="px-6 sm:px-10 pt-48 sm:pt-56">
        <Link href="/auth/signin" className="btn-cta">
          Get Started
        </Link>
      </main>
    </div>
  );
}
