'use client'
import { Category, Task, UserStats } from '@/lib/supabase'

interface Props {
  nav: string
  setNav: (n: string) => void
  tasks: Task[]
  categories: Category[]
  stats: UserStats | null
  onAddCategory: (name: string, color: string) => void
  onDeleteCategory: (id: string) => void
  onSignOut: () => void
  username: string
  avatar?: string
}

const CAT_COLORS = ['#6c63ff','#22c55e','#f59e0b','#ef4444','#3b82f6','#ec4899','#14b8a6','#f97316']

export default function Sidebar({ nav, setNav, tasks, categories, stats, onAddCategory, onDeleteCategory, onSignOut, username, avatar }: Props) {
  const cnt = (fn: (t: Task) => boolean) => tasks.filter(fn).length
  const today = new Date().toISOString().slice(0, 10)

  const addCat = () => {
    const name = prompt('Nom de la catégorie :')
    if (!name) return
    const color = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)]
    onAddCategory(name, color)
  }

  const navItems = [
    { id: 'all', icon: '📋', label: 'Toutes', count: cnt(t => !t.done) },
    { id: 'today', icon: '📅', label: "Aujourd'hui", count: cnt(t => !t.done && (t.due_date === today || t.recur_type !== 'none')) },
    { id: 'recurring', icon: '🔁', label: 'Récurrentes', count: cnt(t => t.recur_type !== 'none') },
    { id: 'done', icon: '✅', label: 'Terminées', count: cnt(t => t.done) },
  ]

  const priorityItems = [
    { id: 'high', icon: '🔴', label: 'Haute', count: cnt(t => !t.done && t.priority === 'high') },
    { id: 'normal', icon: '🟡', label: 'Normale', count: cnt(t => !t.done && t.priority === 'normal') },
    { id: 'low', icon: '🔵', label: 'Basse', count: cnt(t => !t.done && t.priority === 'low') },
  ]

  const itemStyle = (id: string) => ({
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '7px 10px', borderRadius: '6px', cursor: 'pointer',
    color: nav === id ? 'var(--accent2)' : 'var(--text2)',
    background: nav === id ? 'var(--accent-bg)' : 'none',
    border: 'none', width: '100%', textAlign: 'left' as const,
    fontSize: '13px', transition: 'all 0.1s',
  })

  return (
    <div style={{ width: '210px', background: 'var(--bg2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, padding: '12px 8px', gap: '1px', overflowY: 'auto' }}>

      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', marginBottom: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {avatar
          ? <img src={avatar} style={{ width: '28px', height: '28px', borderRadius: '50%' }} alt="" />
          : <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>👤</div>
        }
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{username}</div>
          <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{stats?.streak || 0}🔥 streak</div>
        </div>
      </div>

      {/* Views */}
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', padding: '4px 8px 4px', marginTop: '4px' }}>Vues</div>
      {navItems.map(item => (
        <button key={item.id} style={itemStyle(item.id)} onClick={() => setNav(item.id)}>
          <span>{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: '10px', background: nav === item.id ? 'var(--accent-bg)' : 'var(--bg4)', padding: '1px 6px', borderRadius: '99px', color: nav === item.id ? 'var(--accent2)' : 'var(--text3)' }}>{item.count}</span>
        </button>
      ))}

      {/* Priorities */}
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', padding: '8px 8px 4px', marginTop: '6px' }}>Priorités</div>
      {priorityItems.map(item => (
        <button key={item.id} style={itemStyle(item.id)} onClick={() => setNav(item.id)}>
          <span>{item.icon}</span>
          <span style={{ flex: 1 }}>{item.label}</span>
          <span style={{ fontSize: '10px', background: nav === item.id ? 'var(--accent-bg)' : 'var(--bg4)', padding: '1px 6px', borderRadius: '99px', color: nav === item.id ? 'var(--accent2)' : 'var(--text3)' }}>{item.count}</span>
        </button>
      ))}

      {/* Categories */}
      <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', padding: '8px 8px 4px', marginTop: '6px' }}>Catégories</div>
      {categories.map(cat => (
        <button key={cat.id} style={itemStyle('cat-' + cat.id)} onClick={() => setNav('cat-' + cat.id)}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{cat.name}</span>
          <span style={{ fontSize: '10px', background: 'var(--bg4)', padding: '1px 6px', borderRadius: '99px', color: 'var(--text3)' }}>
            {cnt(t => !t.done && t.category === cat.id)}
          </span>
        </button>
      ))}
      <button onClick={addCat} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px', color: 'var(--text3)', fontSize: '12px', cursor: 'pointer', borderRadius: '6px', border: 'none', background: 'none', width: '100%' }}>
        ＋ Nouvelle catégorie
      </button>

      {/* Stats */}
      <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '10px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--accent2)' }}>{tasks.length}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Total</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--green)' }}>{stats?.total_completed || 0}</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Faites</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--yellow)' }}>{stats?.streak || 0}🔥</div>
            <div style={{ fontSize: '10px', color: 'var(--text3)' }}>Streak</div>
          </div>
        </div>
        <button onClick={onSignOut} style={{ width: '100%', padding: '7px', background: 'none', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text2)', cursor: 'pointer', fontSize: '12px' }}>
          🚪 Se déconnecter
        </button>
      </div>
    </div>
  )
}
