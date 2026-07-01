'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function TreinoPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.schema('treinos').from('workout_templates').select('*, template_exercises(count)').eq('user_id', user.id).order('created_at', { ascending: false })
      setTemplates(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Meus Treinos 🏋️</h1>
          <Link href="/treino/novo" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition-colors text-sm">+ Novo</Link>
        </div>

        {templates.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-400 mb-4">Nenhum treino criado ainda.</p>
            <Link href="/treino/novo" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors">Criar primeiro treino</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map(t => (
              <Link key={t.id} href={`/treino/${t.id}`} className="block bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-2xl p-5 transition-colors">
                <p className="text-white font-bold text-lg">{t.name}</p>
                {t.description && <p className="text-gray-400 text-sm mt-1">{t.description}</p>}
                <p className="text-gray-500 text-xs mt-2">{t.template_exercises?.[0]?.count || 0} exercícios</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}