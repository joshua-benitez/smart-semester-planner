import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Logo from "@/components/ui/Logo";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <div className="relative min-h-screen bg-brandBg text-foreground">
      <header className="absolute left-4 top-4 flex items-center gap-0 p-2">
        <Logo width={48} unwrapped imgClassName="block rounded-md shadow-sm" />
        <div className="ml-3 select-none leading-tight">
          <div className="text-2xl font-bold tracking-tight text-gray-900">CourseFlow</div>
        </div>
      </header>

      <main className="flex flex-col items-center px-6 pt-40 text-center sm:px-10 sm:pt-48">
        <div className="max-w-3xl">
          <h1 className="mb-6 text-4xl font-extrabold tracking-tight text-gray-900 md:text-6xl">
            Never miss a deadline again.
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-gray-500 md:text-xl">
            CourseFlow helps you track assignments, plan study time, and stay on pace for A-level results — all in one calm dashboard.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">Create Account</Link>
            <Link href="/auth/signin" className="btn-secondary px-8 py-3 text-lg">Sign In</Link>
          </div>
        </div>

        <section className="mx-auto mt-24 grid max-w-5xl gap-6 text-left md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-brandPrimary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                <path d="M8 2v4M16 2v4M4 10h16M6 20h12a2 2 0 0 0 2-2v-8H4v8a2 2 0 0 0 2 2z"/>
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Stay ahead</h3>
            <p className="text-sm leading-relaxed text-gray-500">Clear views for this week and the month so you can see what’s coming and avoid last-minute stress.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-brandPrimary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                <path d="M4 7h16M4 12h10M4 17h7"/>
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Fast add</h3>
            <p className="text-sm leading-relaxed text-gray-500">Paste a syllabus — we parse dates and types automatically so you can batch-create assignments in seconds.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 text-brandPrimary">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline-block">
                <path d="M12 8v8M8 12h8"/>
              </svg>
            </div>
            <h3 className="mb-2 font-semibold text-gray-900">Focus on what matters</h3>
            <p className="text-sm leading-relaxed text-gray-500">Priority lists and clean actions keep you moving — no clutter, just the next best step.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
