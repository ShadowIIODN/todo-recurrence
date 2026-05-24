import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const createClient = () => createClientComponentClient()

export type Task = {
  id: string
  user_id: string
  text: string
  done: boolean
  priority: 'high' | 'normal' | 'low'
  category: string
  recur_type: 'none' | 'interval' | 'weekday'
  recur_n: number
  recur_unit: string
  recur_days: number[]
  recur_time: string
  due_date: string | null
  note: string
  subtasks: { text: string; done: boolean }[]
  completed_at: string | null
  ready_at: string | null
  created_at: string
  updated_at: string
  position: number
}

export type Category = {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export type UserStats = {
  user_id: string
  total_completed: number
  streak: number
  last_completed_date: string | null
}
