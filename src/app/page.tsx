import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { Dumbbell, Calendar, History } from 'lucide-react'

export default async function HomePage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const today = new Date()
  const cards = [
    { href: '/treino', label: 'Iniciar Treino', icon: '🏋️', desc: 'Registrar sessão de hoje' },
    { href: '/plano', label: 'Plano Mensal', icon: '📅', desc: 'Montar treinos da semana' },
    { href: '/historico', label: 'Histórico', icon: '📈', desc: 'Ver evolução e pesos' },
  ]
  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Bom treino! 💪</h1>
          <p className="text-gray-400 mt-1">{today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {cards.map(({ href, label, icon, desc }) => (
            <Link key={href} href={href} className="bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-2xl p-5 flex items-center gap-4 transition-colors">
              <div className="p-3 rounded-xl bg-gray-800 text-2xl">{icon}</div>
              <div>
                <p className="text-white font-semibold">{label}</p>
                <p className="text-gray-400 text-sm">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
