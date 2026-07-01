'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function HistoricoPage() {
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.schema('treinos').from('workout_sessions')
        .select('*, workout_templates(name), session_exercises(*, exercises(name, muscle_group))')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20)
      setSessions(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Histórico 📈</h1>

        {sessions.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center">
            <p className="text-gray-400">Nenhum treino registrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map(session => {
              const completed = session.session_exercises?.filter((s: any) => s.completed).length || 0
              const total = session.session_exercises?.length || 0
              return (
                <div key={session.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="text-white font-bold">{session.workout_templates?.name || 'Treino livre'}</p>
                      <p className="text-gray-400 text-sm">{new Date(session.date).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                    <span className={`text-sm font-medium px-2 py-1 rounded-lg ${session.completed_at ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {session.completed_at ? '✓ Completo' : 'Em andamento'}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-3">{completed}/{total} exercícios concluídos</p>
                  <div className="space-y-2">
                    {session.session_exercises?.filter((s: any) => s.completed && s.weight_kg).map((sex: any) => (
                      <div key={sex.id} className="flex justify-between items-center text-sm">
                        <span className="text-gray-400">{sex.exercises?.name}</span>
                        <span className="text-white font-medium">{sex.weight_kg} kg</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}