'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { useTasks } from '@/hooks/useTasks'
import { Task } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import AddTask from '@/components/AddTask'
import TaskItem from '@/components/TaskItem'

const pageTitles: Record<string, string> = {
  all: 'Toutes', today: "Aujourd'hui", recurring: 'Récurrentes',
  done: 'Terminées', high: 'Priorité haute', normal: 'Priorité normale', low: 'Priorité basse'
}

export default function Dashboard() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [nav, setNav] = useState('all')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const {
    tasks, categories, stats, loading,
    addTask, toggleTask, updateTask, deleteTask,
    toggleSubtask, addSubtask,
    addCategory, deleteCategory, clearDone,
  } = useTasks(user)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/auth')
      else setUser(user)
    })
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const today = new Date().toISOString().slice(0, 10)

  const visible = useMemo(() => {
    return tasks.filter(t => {
      if (search && !t.text.toLowerCase().includes(search.toLowerCase())) return false
      if (filter === 'active' && t.done) return false
      if (filter === 'overdue') {
        const isDueOverdue = t.due_date && new Date(t.due_date) < new Date() && !t.done
        const isRecurOverdue = t.recur_type !== 'none' && t.ready_at && !t.done
        return isDueOverdue || isRecurOverdue
      }
      if (nav === 'all') return true
      if (nav === 'today') return !t.done && (t.due_date === today || t.recur_type !== 'none')
      if (nav === 'recurring') return t.recur_type !== 'none'
      if (nav === 'done') return t.done
      if (nav === 'high') return !t.done && t.priority === 'high'
      if (nav === 'normal') return !t.done && t.priority === 'normal'
      if (nav === 'low') return !t.done && t.priority === 'low'
      if (nav.startsWith('cat-')) return !t.done && t.category === nav.replace('cat-', '')
      return true
    })
  }, [tasks, nav, filter, search, today])

  const username = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Utilisateur'
  const avatar = user?.user_metadata?.avatar_url

  const title = pageTitles[nav] || categories.find(c => `cat-${c.id}` === nav)?.name || 'Toutes'

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text2)' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          Chargement...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      <Sidebar
        nav={nav} setNav={setNav}
        tasks={tasks} categories={categories} stats={stats}
        onAddCategory={addCategory} onDeleteCategory={deleteCategory}
        onSignOut={signOut} username={username} avatar={avatar}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700 }}>{title}</h1>
            {/* Search */}
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher... (Ctrl+F)"
                style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '6px', padding: '7px 10px 7px 30px', fontSize: '13px', color: 'var(--text)', outline: 'none' }} />
            </div>
            <button onClick={clearDone} style={{ padding: '7px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap' }}>
              🗑 Vider terminées
            </button>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '5px' }}>
            {['all', 'active', 'overdue'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                fontSize: '12px', padding: '4px 12px', borderRadius: '99px',
                border: '1px solid', cursor: 'pointer',
                background: filter === f ? 'var(--accent-bg)' : 'none',
                color: filter === f ? 'var(--accent2)' : 'var(--text2)',
                borderColor: filter === f ? 'transparent' : 'var(--border2)',
              }}>
                {{ all: 'Toutes', active: 'À faire', overdue: 'En retard' }[f]}
              </button>
            ))}
            <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text3)', display: 'flex', alignItems: 'center' }}>
              {visible.length} tâche{visible.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Task list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Add task */}
          <AddTask categories={categories} onAdd={addTask} />

          {/* Tasks */}
          {visible.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text3)', padding: '3rem 0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              Aucune tâche ici !
            </div>
          ) : (
            visible.map(task => (
              <TaskItem
                key={task.id}
                task={task}
                categories={categories}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onUpdate={updateTask}
                onToggleSubtask={toggleSubtask}
                onAddSubtask={addSubtask}
              />
            ))
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 4px; }
      `}</style>
    </div>
  )
}
