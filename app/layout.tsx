import './globals.css'
import Providers from './providers'

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
