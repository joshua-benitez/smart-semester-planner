import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

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
      <body className={`${inter.className} bg-brandBg text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
