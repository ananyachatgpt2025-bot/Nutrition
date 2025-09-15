import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Neuro-Nutrition Consultant',
  description: 'Professional paediatric nutrition consultation platform for children with developmental needs',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen medical-gradient">
          {children}
        </div>
      </body>
    </html>
  )
}