'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient, Task, Category, UserStats } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

const unitMs: Record<string, number> = {
  minute: 60000, hour: 3600000, day: 86400000, week: 604800000, month: 2592000000
}

function getNextOccurrence(task: Task): number | null {
  if (task.recur_type === 'none' || !task.completed_at) return null
  const completedMs = new Date(task.completed_at).getTime()
  if (task.recur_type === 'interval') {
    return completedMs + task.recur_n * unitMs[task.recur_unit]
  }
  if (task.recur_type === 'weekday') {
    const [hh, mm] = task.recur_time.split(':').map(Number)
    const from = new Date(completedMs)
    for (let i = 1; i <= 7; i++) {
      const c = new Date(from)
      c.setDate(c.getDate() + i)
      c.setHours(hh, mm, 0, 0)
      if (task.recur_days.includes(c.getDay())) return c.getTime()
    }
  }
  return null
}

export function useTasks(user: User | null) {
  const supabase = createClient()
  const [tasks, setTasks] = useState<Task[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Load all data
  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    const [{ data: t }, { data: c }, { data: s }] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user.id).order('position').order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id).order('created_at'),
      supabase.from('user_stats').select('*').eq('user_id', user.id).single(),
    ])
    setTasks(t || [])
    setCategories(c || [])
    setStats(s)
    setLoading(false)
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  // Tick — auto uncheck recurring tasks
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now()
      const toUncheck = tasks.filter(t => {
        if (t.recur_type === 'none' || !t.done) return false
        const next = getNextOccurrence(t)
        return next !== null && now >= next
      })
      if (toUncheck.length === 0) return
      for (const t of toUncheck) {
        const next = getNextOccurrence(t)!
        await supabase.from('tasks').update({
          done: false,
          completed_at: null,
          ready_at: new Date(next).toISOString(),
        }).eq('id', t.id)
      }
      setTasks(prev => prev.map(t => {
        const found = toUncheck.find(u => u.id === t.id)
        if (!found) return t
        return { ...t, done: false, completed_at: null, ready_at: new Date(getNextOccurrence(found)!).toISOString() }
      }))
    }, 5000)
    return () => clearInterval(interval)
  }, [tasks])

  // ADD TASK
  const addTask = async (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return
    const { data, error } = await supabase.from('tasks').insert({
      ...task, user_id: user.id
    }).select().single()
    if (!error && data) setTasks(prev => [data, ...prev])
  }

  // TOGGLE TASK
  const toggleTask = async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return
    const done = !task.done
    const completed_at = done ? new Date().toISOString() : null
    const { error } = await supabase.from('tasks').update({
      done, completed_at, ready_at: done ? null : task.ready_at
    }).eq('id', id)
    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done, completed_at, ready_at: done ? null : t.ready_at } : t))
      // Update streak
      if (done && stats) {
        const today = new Date().toDateString()
        const yesterday = new Date(Date.now() - 86400000).toDateString()
        const newStreak = stats.last_completed_date === yesterday
          ? stats.streak + 1
          : stats.last_completed_date === today ? stats.streak : 1
        const newStats = {
          total_completed: stats.total_completed + 1,
          streak: newStreak,
          last_completed_date: new Date().toISOString().slice(0, 10),
        }
        await supabase.from('user_stats').update(newStats).eq('user_id', user.id)
        setStats(prev => prev ? { ...prev, ...newStats } : prev)
      }
    }
  }

  // UPDATE TASK
  const updateTask = async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (!error) setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }

  // DELETE TASK
  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // TOGGLE SUBTASK
  const toggleSubtask = async (taskId: string, idx: number) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const subtasks = task.subtasks.map((s, i) => i === idx ? { ...s, done: !s.done } : s)
    await updateTask(taskId, { subtasks })
  }

  // ADD SUBTASK
  const addSubtask = async (taskId: string, text: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return
    const subtasks = [...task.subtasks, { text, done: false }]
    await updateTask(taskId, { subtasks })
  }

  // CATEGORIES
  const addCategory = async (name: string, color: string) => {
    if (!user) return
    const { data, error } = await supabase.from('categories').insert({ name, color, user_id: user.id }).select().single()
    if (!error && data) setCategories(prev => [...prev, data])
  }

  const deleteCategory = async (id: string) => {
    await supabase.from('categories').delete().eq('id', id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // CLEAR DONE (non recurring)
  const clearDone = async () => {
    const toDelete = tasks.filter(t => t.done && t.recur_type === 'none').map(t => t.id)
    if (!toDelete.length) return
    await supabase.from('tasks').delete().in('id', toDelete)
    setTasks(prev => prev.filter(t => !toDelete.includes(t.id)))
  }

  return {
    tasks, categories, stats, loading,
    addTask, toggleTask, updateTask, deleteTask,
    toggleSubtask, addSubtask,
    addCategory, deleteCategory,
    clearDone, reload: loadData,
    getNextOccurrence,
  }
}

export { getNextOccurrence }
