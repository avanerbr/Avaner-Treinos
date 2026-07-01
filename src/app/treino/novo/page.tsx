'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const MUSCLE_GROUPS = ['Peito', 'Costas', 'Ombro', 'Bíceps', 'Tríceps', 'Quadríceps', 'Posterior', 'Glúteos', 'Panturrilha', 'Abdômen', 'Corpo Todo']

export default function NovoTreinoPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [exercises, setExercises] = useState<any[]>([])
  const [selected, setSelected] = useState<any[]>([])
  const [filter, setFilter] = useState('Todos')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.schema('treinos').from('exercises').select('*').order('name').then(({ data }) => setExercises(data || []))
  }, [])

  function toggleExercise(ex: any) {
    setSelected(prev => prev.find(e => e.id === ex.id)
      ? prev.filter(e => e.id !== ex.id)
      : [...prev, { ...ex, sets: 3, reps: '10' }]
    )
  }

  async function handleSave() {
    if (!name || selected.length === 0) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: template } = await supabase.schema('treinos').from('workout_templates').insert({ user_id: user.id, name, description }).select('id').single()
    if (!template) return

    await supabase.schema('treinos').from('template_exercises').insert(
      selected.map((ex, i) => ({ template_id: template.id, exercise_id: ex.id, sets: ex.sets, reps: ex.reps, order: i }))
    )

    router.push('/treino')
  }

  const filtered = filter === 'Todos' ? exercises : exercises.filter(e => e.muscle_group === filter)

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Novo Treino 🏋️</h1>

        <div className="space-y-4 mb-6">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome do treino (ex: Treino A - Peito)" className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição (opcional)" className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500" />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {['Todos', ...MUSCLE_GROUPS].map(g => (
            <button key={g} onClick={() => setFilter(g)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filter === g ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>{g}</button>
          ))}
        </div>

        <div className="space-y-2 mb-6">
          {filtered.map(ex => {
            const sel = selected.find(e => e.id === ex.id)
            return (
              <div key={ex.id} className={`bg-gray-900 border rounded-xl p-4 cursor-pointer transition-colors ${sel ? 'border-blue-500' : 'border-gray-800'}`} onClick={() => toggleExercise(ex)}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white font-medium">{ex.name}</p>
                    <p className="text-gray-500 text-sm">{ex.muscle_group}</p>
                  </div>
                  {sel && <span className="text-blue-400 text-sm font-bold">✓</span>}
                </div>
                {sel && (
                  <div className="flex gap-3 mt-3" onClick={e => e.stopPropagation()}>
                    <div>
                      <label className="text-gray-400 text-xs">Séries</label>
                      <input type="number" value={sel.sets} onChange={e => setSelected(prev => prev.map(s => s.id === ex.id ? { ...s, sets: Number(e.target.value) } : s))} className="w-16 bg-gray-800 text-white rounded-lg px-2 py-1 text-sm ml-2 outline-none" />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs">Reps</label>
                      <input value={sel.reps} onChange={e => setSelected(prev => prev.map(s => s.id === ex.id ? { ...s, reps: e.target.value } : s))} className="w-16 bg-gray-800 text-white rounded-lg px-2 py-1 text-sm ml-2 outline-none" />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {selected.length > 0 && (
          <div className="sticky bottom-20 md:bottom-4">
            <button onClick={handleSave} disabled={loading || !name} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition-colors">
              {loading ? 'Salvando...' : `Salvar Treino (${selected.length} exercícios)`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}