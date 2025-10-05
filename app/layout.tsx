import './globals.css'
import Providers from './providers'

// root layout wraps the app with shared providers + base styles

export const metadata = {
  title: 'Smart Semester Planner',
  description: 'Assignment tracker for students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-brandBg text-white" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
