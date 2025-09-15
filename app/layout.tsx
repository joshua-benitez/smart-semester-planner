import './globals.css'
import { Inter } from 'next/font/google'
import Providers from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CourseFlow',
  description: 'Assignment tracker for students',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-brandBg bg-[#050a30] text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
