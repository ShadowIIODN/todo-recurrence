'use client'
import { useState, useEffect } from 'react'
import { Task, Category } from '@/lib/supabase'
import { getNextOccurrence } from '@/hooks/useTasks'

const unitLabels: Record<string, string> = { minute: 'min', hour: 'h', day: 'j', week: 'sem', month: 'mois' }
const dayShort = ['D', 'L', 'M', 'Me', 'J', 'V', 'S']

function fmt(ms: number): string {
  const s = Math.floor(Math.abs(ms) / 1000)
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sc = s % 60
  if (d > 0) return `${d}j ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m ${sc}s`
  if (m > 0) return `${m}m ${sc}s`
  return `${sc}s`
}

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    + ' ' + new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  task: Task
  categories: Category[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onToggleSubtask: (taskId: string, idx: number) => void
  onAddSubtask: (taskId: string, text: string) => void
}

export default function TaskItem({ task, categories, onToggle, onDelete, onUpdate, onToggleSubtask, onAddSubtask }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(task.text)
  const [editNote, setEditNote] = useState(task.note)
  const [subInput, setSubInput] = useState('')
  const [countdown, setCountdown] = useState('')
  const [overdue, setOverdue] = useState('')

  const cat = categories.find(c => c.id === task.category)

  useEffect(() => {
    const tick = () => {
      const now = Date.now()
      if (task.done && task.recur_type !== 'none' && task.completed_at) {
        const next = getNextOccurrence(task)
        if (next) {
          const diff = next - now
          if (diff < 60000) setCountdown(`⏱ dans ${fmt(diff)}`)
          else if (task.recur_type === 'weekday') setCountdown(`⏱ ${fmtDate(next)} (${fmt(diff)})`)
          else setCountdown(`⏱ dans ${fmt(diff)}`)
        }
      }
      if (!task.done && task.recur_type !== 'none' && task.ready_at) {
        const elapsed = now - new Date(task.ready_at).getTime()
        setOverdue(`🔔 refaisable depuis ${fmt(elapsed)}`)
      } else {
        setOverdue('')
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [task])

  const priorityColors = { high: 'var(--red)', normal: 'var(--yellow)', low: 'var(--blue)' }
  const isDueOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.done

  const saveEdit = () => {
    onUpdate(task.id, { text: editText.trim() || task.text, note: editNote.trim() })
    setEditing(false)
  }

  const recurBadge = () => {
    if (task.recur_type === 'none') return null
    const label = task.recur_type === 'interval'
      ? `🔁 ${task.recur_n} ${unitLabels[task.recur_unit]}`
      : `🔁 ${task.recur_days.map(d => dayShort[d]).join('/')} ${task.recur_time}`
    return <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '99px', background: 'var(--accent-bg)', color: 'var(--accent2)', whiteSpace: 'nowrap' }}>{label}</span>
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
      padding: '11px 13px', marginBottom: '5px', transition: 'border-color 0.15s'
    }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border2)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        {/* Checkbox */}
        <input type="checkbox" checked={task.done} onChange={() => onToggle(task.id)}
          style={{ width: '16px', height: '16px', flexShrink: 0, marginTop: '2px', cursor: 'pointer', accentColor: 'var(--accent)' }} />

        {/* Body */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <input value={editText} onChange={e => setEditText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveEdit()}
                style={{ background: 'var(--bg3)', border: '1px solid var(--accent)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '14px', color: 'var(--text)', outline: 'none' }} />
              <textarea value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Note..."
                style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '6px 10px', fontSize: '13px', color: 'var(--text)', outline: 'none', resize: 'vertical', minHeight: '60px' }} />
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={saveEdit} style={{ padding: '5px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px' }}>✓ Sauver</button>
                <button onClick={() => setEditing(false)} style={{ padding: '5px 12px', background: 'var(--bg3)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '12px' }}>Annuler</button>
              </div>
            </div>
          ) : (
            <>
              {/* Task name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: priorityColors[task.priority || 'normal'], flexShrink: 0 }} />
                <span style={{ fontSize: '14px', color: task.done ? 'var(--text3)' : 'var(--text)', textDecoration: task.done ? 'line-through' : 'none' }}>
                  {task.text}
                </span>
                {task.note && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>📝</span>}
                {task.subtasks?.length > 0 && (
                  <span style={{ fontSize: '11px', color: 'var(--text3)' }}>
                    {task.subtasks.filter(s => s.done).length}/{task.subtasks.length}
                  </span>
                )}
              </div>

              {/* Meta badges */}
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '5px', flexWrap: 'wrap' }}>
                {recurBadge()}
                {cat && <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '99px', background: cat.color + '22', color: cat.color }}>● {cat.name}</span>}
                {task.due_date && (
                  <span style={{ fontSize: '11px', padding: '2px 7px', borderRadius: '99px', background: isDueOverdue ? 'var(--red-bg)' : 'var(--yellow-bg)', color: isDueOverdue ? 'var(--red)' : 'var(--yellow)' }}>
                    📅 {new Date(task.due_date).toLocaleDateString('fr-FR')}
                  </span>
                )}
                {task.completed_at && <span style={{ fontSize: '11px', color: 'var(--text3)' }}>✓ {new Date(task.completed_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>}
              </div>

              {/* Timers */}
              {countdown && <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '3px' }}>{countdown}</div>}
              {overdue && <div style={{ fontSize: '11px', color: 'var(--red)', fontWeight: 500, marginTop: '3px' }}>{overdue}</div>}

              {/* Note */}
              {task.note && (
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '6px', padding: '6px 9px', background: 'var(--bg3)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--accent)', whiteSpace: 'pre-wrap' }}>
                  {task.note}
                </div>
              )}

              {/* Subtasks */}
              {expanded && task.subtasks?.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {task.subtasks.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: s.done ? 'var(--text3)' : 'var(--text2)' }}>
                      <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(task.id, i)}
                        style={{ width: '13px', height: '13px', cursor: 'pointer', accentColor: 'var(--accent)', flexShrink: 0 }} />
                      <span style={{ textDecoration: s.done ? 'line-through' : 'none' }}>{s.text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add subtask */}
              {expanded && (
                <div style={{ display: 'flex', gap: '5px', marginTop: '6px' }}>
                  <input value={subInput} onChange={e => setSubInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && subInput.trim()) { onAddSubtask(task.id, subInput.trim()); setSubInput('') } }}
                    placeholder="+ sous-tâche..."
                    style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '4px 8px', fontSize: '12px', color: 'var(--text)', outline: 'none' }} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
          <button onClick={() => setExpanded(e => !e)} title="Sous-tâches"
            style={{ background: 'none', border: 'none', color: expanded ? 'var(--accent2)' : 'var(--text3)', cursor: 'pointer', padding: '3px 5px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            {expanded ? '▲' : '▼'}
          </button>
          <button onClick={() => { setEditing(true); setExpanded(true) }} title="Modifier"
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '3px 5px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            ✏️
          </button>
          <button onClick={() => onDelete(task.id)} title="Supprimer"
            style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', padding: '3px 5px', borderRadius: 'var(--radius-sm)', fontSize: '13px' }}>
            🗑
          </button>
        </div>
      </div>
    </div>
  )
}
