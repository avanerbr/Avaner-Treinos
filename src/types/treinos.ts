export type MuscleGroup =
  | 'Peito' | 'Costas' | 'Ombro' | 'Bíceps' | 'Tríceps'
  | 'Quadríceps' | 'Posterior' | 'Glúteos' | 'Panturrilha'
  | 'Abdômen' | 'Corpo Todo'

export interface Exercise {
  id: string
  name: string
  muscle_group: MuscleGroup
  description: string | null
  image_url: string | null
  rest_seconds: number
  created_at: string
}

export interface WorkoutTemplate {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
}

export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  sets: number
  reps: string
  order: number
  exercise?: Exercise
}

export interface WorkoutSession {
  id: string
  user_id: string
  template_id: string | null
  date: string
  completed_at: string | null
  created_at: string
}

export interface SessionExercise {
  id: string
  session_id: string
  exercise_id: string
  weight_kg: number | null
  reps_done: string | null
  sets_done: number | null
  completed: boolean
  completed_at: string | null
  order: number
  exercise?: Exercise
}
