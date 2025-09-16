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
      {/* Top-left brand header (flush to top-left) */}
      <header className="absolute top-0 left-0">
        <Logo width={240} unwrapped />
      </header>

      {/* Hero */}
      <main className="px-6 sm:px-10 pt-48 sm:pt-56">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            Never miss a deadline again.
          </h1>
          <p className="text-white/80 text-lg md:text-xl mb-8 max-w-2xl">
            CourseFlow helps you track assignments, plan study time, and stay on pace for A‑level results — all in one calm dashboard.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/auth/signup" className="btn-cta">Create Account</Link>
            <Link href="/auth/signin" className="btn-secondary text-white visited:text-white">Sign In</Link>
          </div>
        </div>

        {/* Feature highlights */}
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg p-5 border-2 border-brandPrimary bg-brandPrimary/10">
            <div className="mb-3 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="inline-block mr-2">
                <path d="M8 2v4M16 2v4M4 10h16M6 20h12a2 2 0 0 0 2-2v-8H4v8a2 2 0 0 0 2 2z"/>
              </svg>
              <span className="font-semibold">Stay ahead</span>
            </div>
            <p className="text-white/80 text-sm">Clear views for this week and the month so you can see what’s coming and avoid last‑minute stress.</p>
          </div>
          <div className="rounded-lg p-5 border-2 border-brandPrimary bg-brandPrimary/10">
            <div className="mb-3 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="inline-block mr-2">
                <path d="M4 7h16M4 12h10M4 17h7"/>
              </svg>
              <span className="font-semibold">Fast add</span>
            </div>
            <p className="text-white/80 text-sm">Paste a syllabus — we parse dates and types automatically so you can batch‑create assignments in seconds.</p>
          </div>
          <div className="rounded-lg p-5 border-2 border-brandPrimary bg-brandPrimary/10">
            <div className="mb-3 text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="inline-block mr-2">
                <path d="M12 8v8M8 12h8"/>
              </svg>
              <span className="font-semibold">Focus on what matters</span>
            </div>
            <p className="text-white/80 text-sm">Priority lists and clean actions keep you moving — no clutter, just the next best step.</p>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-12 rounded-lg p-6 border-2 border-brandPrimary bg-brandPrimary/10">
          <h2 className="text-xl font-bold mb-4">How it works</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg p-4 bg-panelBg border border-white/10">
              <div className="text-white/70 text-sm mb-2">Step 1</div>
              <div className="text-white font-medium mb-1">Create or import</div>
              <p className="text-white/80 text-sm">Add courses and paste your syllabus to parse assignments automatically.</p>
            </div>
            <div className="rounded-lg p-4 bg-panelBg border border-white/10">
              <div className="text-white/70 text-sm mb-2">Step 2</div>
              <div className="text-white font-medium mb-1">Plan your week</div>
              <p className="text-white/80 text-sm">Use the dashboard and calendar to line up what’s due and when you’ll work.</p>
            </div>
            <div className="rounded-lg p-4 bg-panelBg border border-white/10">
              <div className="text-white/70 text-sm mb-2">Step 3</div>
              <div className="text-white font-medium mb-1">Stay on track</div>
              <p className="text-white/80 text-sm">Check off items, adjust dates, and keep your priorities clear.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
