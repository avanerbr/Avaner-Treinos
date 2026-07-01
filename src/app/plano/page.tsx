'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function PlanoPage() {
  const [templates, setTemplates] = useState<any[]>([])
  const [planDays, setPlanDays] = useState<Record<number, string | null>>({})
  const [planId, setPlanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const month = new Date().getMonth() + 1
  const year = new Date().getFullYear()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tmpl } = await supabase.schema('treinos').from('workout_templates').select('*').eq('user_id', user.id)
    setTemplates(tmpl || [])

    let { data: plan } = await supabase.schema('treinos').from('monthly_plans').select('id').eq('user_id', user.id).eq('month', month).eq('year', year).single()

    if (!plan) {
      const { data: newPlan } = await supabase.schema('treinos').from('monthly_plans').insert({ user_id: user.id, month, year }).select('id').single()
      plan = newPlan
    }

    if (plan) {
      setPlanId(plan.id)
      const { data: days } = await supabase.schema('treinos').from('monthly_plan_days').select('*').eq('plan_id', plan.id)
      const map: Record<number, string | null> = {}
      days?.forEach(d => { map[d.weekday] = d.template_id })
      setPlanDays(map)
    }

    setLoading(false)
  }

  async function handleSelectDay(weekday: number, templateId: string | null) {
    if (!planId) return
    setPlanDays(prev => ({ ...prev, [weekday]: templateId }))

    const existing = await supabase.schema('treinos').from('monthly_plan_days').select('id').eq('plan_id', planId).eq('weekday', weekday).single()

    if (existing.data) {
      await supabase.schema('treinos').from('monthly_plan_days').update({ template_id: templateId }).eq('id', existing.data.id)
    } else {
      await supabase.schema('treinos').from('monthly_plan_days').insert({ plan_id: planId, weekday, template_id: templateId })
    }
  }

  if (loading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Carregando...</div>

  return (
    <div className="min-h-screen bg-gray-950 pb-20 md:pb-0 md:pt-16">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Plano Mensal 📅</h1>
          <p className="text-gray-400 mt-1">Defina qual treino fazer em cada dia da semana</p>
        </div>

        {templates.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-400">Você ainda não tem treinos criados.</p>
            <a href="/treino/novo" className="text-blue-400 mt-2 inline-block hover:underline">Criar primeiro treino →</a>
          </div>
        ) : (
          <div className="space-y-3">
            {WEEKDAYS.map((day, index) => (
              <div key={index} className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-white font-semibold mb-3">{day}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSelectDay(index, null)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${planDays[index] === null || planDays[index] === undefined ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  >
                    Descanso
                  </button>
                  {templates.map(t => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectDay(index, t.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${planDays[index] === t.id ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}