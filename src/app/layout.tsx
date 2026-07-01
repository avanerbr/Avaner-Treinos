import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Avaner Treinos',
  description: 'Sistema de treinos Avaner',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  )
}
