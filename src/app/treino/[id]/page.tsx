'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default function ExecutarTreinoPage() {
  const [template, setTemplate] = useState<any>(null)
  const [exercises, setExercises] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [sessionExercises, setSessionExercises] = useState<any[]>([])
  const [timer, setTimer] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const timerRef = useRef<any>(null)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const id = params.id as string

  useEffect(() => {
    loadData()
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (timer === null) return
    if (timer <= 0) {
      clearInterval(timerRef.current)
      setTimer(null)
      return
    }
    timerRef.current = setInterval(() => setTimer(t => (t ?? 1) - 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [timer])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tmpl } = await supabase.schema('treinos').from('workout_templates').select('*').eq('id', id).single()
    setTemplate(tmpl)

    const { data: texs } = await supabase.schema('treinos').from('template_exercises').select('*, exercises(*)').eq('template_id', id).order('order')
    setExercises(texs || [])

    const today = new Date().toISOString().split('T')[0]
    let { data: sess } = await supabase.schema('treinos').from('workout_sessions').select('*').eq('user_id', user.id).eq('template_id', id).eq('date', today).single()

    if (!sess) {
      const { data: newSess } = await supabase.schema('treinos').from('workout_sessions').insert({ user_id: user.id, template_id: id, date: today }).select('*').single()
      sess = newSess

      if (newSess && texs) {
        const { data: sexs } = await supabase.schema('treinos').from('session_exercises').insert(
          texs.map((te, i) => ({ session_id: newSess.id, exercise_id: te.exercise_id, order: i, sets_done: te.sets, reps_done: te.reps }))
        ).select('*')
        setSessionExercises(sexs || [])
      }
    } else {
      const { data: sexs } = await supabase.schema('treinos').from('session_exercises').select('*').eq('session_id', sess.id).order('order')
      setSessionExercises(sexs || [])
    }

    setSession(sess)
    setLoading(false)
  }

  async function toggleComplete(sex: any) {
    const newCompleted = !sex.completed
    const now = newCompleted ? new Date().toISOString() : null

    await supabase.schema('treinos').from('session_exercises').update({ completed: newCompleted, completed_at: now }).eq('id', sex.id)
    setSessionExercises(prev => prev.map(s => s.id === sex.id ? { ...s, completed: newCompleted } : s))

    if (newCompleted) {
      const restSeconds = exercises.find(e => e.exercise_id === sex.exercise_id)?.exercises?.rest_seconds || 60
      clearInterval(timerRef.current)
      setTimer(restSeconds)
    }
  }

  async function updateWeight(sexId: string, weight: string) {
    await supabase.schema('treinos').from('session_exercises').update({ weight_kg: parseFloat(weight) || null }).eq('id', sexId)
    setSessionExercises(prev => prev.map(s => s.id === sexId ? { ...s, weight_kg: weight } : s))
  }

  async function finishWorkout() {
    await supabase.schema('treinos').from('workout_sessions').update({ completed_at: new Date().toISOString() }).eq('id', session.id)
    router.push('/')
  }

  const completedCount = sessionExercises.filter(s => s.completed).length
  const totalCount = sessionExercises.length

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-950 pb-24 md:pb-8 md:pt-16">
      <Navbar />

      {timer !== null && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white text-center py-3 font-bold text-lg">
          ⏱️ Descansando... {timer}s
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{template?.name}</h1>
          <p className="text-gray-400 mt-1">{completedCount} de {totalCount} exercícios concluídos</p>
          <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
            <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
          </div>
        </div>

        <div className="space-y-3">
          {sessionExercises.map((sex, i) => {
            const ex = exercises.find(e => e.exercise_id === sex.exercise_id)?.exercises
            const te = exercises.find(e => e.exercise_id === sex.exercise_id)
            return (
              <div key={sex.id} className={`bg-gray-900 border rounded-2xl p-4 transition-colors ${sex.completed ? 'border-green-500/50 opacity-75' : 'border-gray-800'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className={`font-semibold ${sex.completed ? 'text-gray-400 line-through' : 'text-white'}`}>{ex?.name}</p>
                    <p className="text-gray-500 text-sm">{ex?.muscle_group} • {te?.sets}x{te?.reps}</p>
                    {ex?.description && <p className="text-gray-600 text-xs mt-1">{ex.description}</p>}
                  </div>
                  <button onClick={() => toggleComplete(sex)} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-colors flex-shrink-0 ${sex.completed ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
                    {sex.completed ? '✓' : '○'}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-gray-500 text-sm">Peso (kg):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sex.weight_kg || ''}
                    onChange={e => updateWeight(sex.id, e.target.value)}
                    placeholder="0"
                    className="w-20 bg-gray-800 text-white rounded-lg px-2 py-1 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )
          })}
        </div>

        {completedCount === totalCount && totalCount > 0 && (
          <button onClick={finishWorkout} className="w-full mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl transition-colors">
            🎉 Finalizar Treino!
          </button>
        )}
      </div>
    </div>
  )
}