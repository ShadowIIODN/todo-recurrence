'use client'
import { useState } from 'react'
import { Category, Task } from '@/lib/supabase'

const unitLabels: Record<string, string> = { minute: 'min', hour: 'h', day: 'jour(s)', week: 'sem.', month: 'mois' }
const dayNames = ['D', 'L', 'M', 'Me', 'J', 'V', 'S']
const dayNamesFull = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']

interface Props {
  categories: Category[]
  onAdd: (task: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
}

export default function AddTask({ categories, onAdd }: Props) {
  const [text, setText] = useState('')
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal')
  const [catId, setCatId] = useState('')
  const [recurType, setRecurType] = useState<'none' | 'interval' | 'weekday'>('none')
  const [recurN, setRecurN] = useState(1)
  const [recurUnit, setRecurUnit] = useState('day')
  const [recurDays, setRecurDays] = useState<number[]>([])
  const [recurTime, setRecurTime] = useState('08:00')
  const [dueDate, setDueDate] = useState('')
  const [expanded, setExpanded] = useState(false)

  const toggleDay = (d: number) => {
    setRecurDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  const preview = () => {
    if (recurType === 'none') return ''
    if (recurType === 'interval') return `→ Tous les ${recurN} ${unitLabels[recurUnit]}`
    if (recurType === 'weekday') {
      if (!recurDays.length) return '→ Sélectionne des jours'
      return `→ Chaque ${recurDays.map(d => dayNamesFull[d]).join(', ')} à ${recurTime}`
    }
    return ''
  }

  const handleAdd = () => {
    if (!text.trim()) return
    if (recurType === 'weekday' && !recurDays.length) { alert('Sélectionne au moins un jour.'); return }
    onAdd({
      text: text.trim(),
      done: false,
      priority,
      category: catId,
      recur_type: recurType,
      recur_n: recurN,
      recur_unit: recurUnit,
      recur_days: recurDays,
      recur_time: recurTime,
      due_date: dueDate || null,
      note: '',
      subtasks: [],
      completed_at: null,
      ready_at: null,
      position: 0,
    })
    setText('')
    setDueDate('')
    setRecurType('none')
    setRecurDays([])
  }

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: '16px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: expanded ? '10px' : '0' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          onFocus={() => setExpanded(true)}
          placeholder="Nouvelle tâche... (Entrée pour ajouter)"
          style={{ flex: 1, background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '9px 12px', fontSize: '14px', color: 'var(--text)', outline: 'none' }}
        />
        <button onClick={handleAdd} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', padding: '9px 18px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
          ＋ Ajouter
        </button>
      </div>

      {expanded && (
        <div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '8px' }}>
            {/* Priority */}
            <select value={priority} onChange={e => setPriority(e.target.value as any)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text2)', outline: 'none' }}>
              <option value="normal">● Normale</option>
              <option value="high">🔴 Haute</option>
              <option value="low">🔵 Basse</option>
            </select>

            {/* Category */}
            <select value={catId} onChange={e => setCatId(e.target.value)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text2)', outline: 'none' }}>
              <option value="">📁 Catégorie</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            {/* Recur type */}
            <select value={recurType} onChange={e => setRecurType(e.target.value as any)}
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text2)', outline: 'none' }}>
              <option value="none">🔁 Aucune récurrence</option>
              <option value="interval">⏱ Intervalle</option>
              <option value="weekday">📅 Jours de semaine</option>
            </select>

            {/* Interval opts */}
            {recurType === 'interval' && (
              <>
                <input type="number" value={recurN} min={1} onChange={e => setRecurN(parseInt(e.target.value) || 1)}
                  style={{ width: '56px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text)', outline: 'none', textAlign: 'center' }} />
                <select value={recurUnit} onChange={e => setRecurUnit(e.target.value)}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text2)', outline: 'none' }}>
                  <option value="minute">min</option>
                  <option value="hour">heure(s)</option>
                  <option value="day">jour(s)</option>
                  <option value="week">semaine(s)</option>
                  <option value="month">mois</option>
                </select>
              </>
            )}

            {/* Weekday opts */}
            {recurType === 'weekday' && (
              <>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {dayNames.map((d, i) => (
                    <button key={i} onClick={() => toggleDay(i)} style={{
                      fontSize: '11px', padding: '3px 7px', borderRadius: '99px',
                      border: '1px solid', cursor: 'pointer',
                      background: recurDays.includes(i) ? 'var(--accent-bg)' : 'none',
                      color: recurDays.includes(i) ? 'var(--accent2)' : 'var(--text2)',
                      borderColor: recurDays.includes(i) ? 'transparent' : 'var(--border2)',
                    }}>{d}</button>
                  ))}
                </div>
                <input type="time" value={recurTime} onChange={e => setRecurTime(e.target.value)}
                  style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text)', outline: 'none' }} />
              </>
            )}

            {/* Due date */}
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              title="Date d'échéance"
              style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 8px', fontSize: '12px', color: 'var(--text)', outline: 'none' }} />
          </div>

          {preview() && (
            <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '4px' }}>{preview()}</div>
          )}

          <button onClick={() => setExpanded(false)} style={{ fontSize: '11px', color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ▲ Réduire
          </button>
        </div>
      )}
    </div>
  )
}
