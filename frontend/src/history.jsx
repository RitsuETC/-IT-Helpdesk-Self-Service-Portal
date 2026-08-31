import { useEffect, useState } from 'react'
import { api } from './api.js'
import { TicketDetail } from './tickets.jsx'

export default function HistoryCarousel({ token, user, onError }) {
  const [tickets, setTickets] = useState([])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const load = async () => {
    if (!token) {
      setTickets([])
      setLoading(false)
      return
    }
    try {
      const res = await api('/tickets', { token })
      const history = (res.data || []).filter((t) => ['RESOLVED', 'CLOSED'].includes(t.status))
      setTickets(history)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    if (!token) return
    const timer = setInterval(load, 3000)
    return () => clearInterval(timer)
  }, [token])

  const VISIBLE_COUNT = 5
  const visible = tickets.slice(historyIndex, historyIndex + VISIBLE_COUNT)

  const change = (dir) => {
    if (tickets.length <= VISIBLE_COUNT) return
    setHistoryIndex((prev) => {
      const start = Math.floor(prev / VISIBLE_COUNT) * VISIBLE_COUNT
      const totalPages = Math.ceil(tickets.length / VISIBLE_COUNT)
      const maxStart = Math.max(0, (totalPages - 1) * VISIBLE_COUNT)
      const next = start + dir * VISIBLE_COUNT
      if (next < 0) return maxStart
      if (next > maxStart) return 0
      return next
    })
  }

  if (loading) return <p style={{ color: '#64748b' }}>Memuat riwayat...</p>
  if (tickets.length === 0) return <p style={{ color: '#64748b' }}>Belum ada tiket yang selesai.</p>

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button onClick={() => change(-1)} disabled={tickets.length <= VISIBLE_COUNT} style={{ width: 28, height: 28 }}>&lsaquo;</button>
        <button onClick={() => change(1)} disabled={tickets.length <= VISIBLE_COUNT} style={{ width: 28, height: 28 }}>&rsaquo;</button>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {visible.map((t) => (
          <button key={t.id} onClick={() => setSelectedTicket(t)} style={{ textAlign: 'left', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12, cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ color: '#0f172a' }}>{t.code || `HD-${t.id}`}</strong>
              <span style={{ padding: '4px 8px', borderRadius: 999, fontSize: '0.68rem', fontWeight: 700, backgroundColor: t.status === 'CLOSED' ? '#e2e8f0' : '#dcfce7', color: t.status === 'CLOSED' ? '#334155' : '#166534' }}>{t.status}</span>
            </div>
            <div style={{ color: '#334155', fontWeight: 600 }}>{t.title || t.category || t.device || 'Tiket'}</div>
            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</div>
          </button>
        ))}
      </div>

      {selectedTicket && (
        <div onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: 900, background: '#fff', borderRadius: 12, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
            <TicketDetail token={token} user={user} ticket={selectedTicket} onBack={() => setSelectedTicket(null)} onError={onError} />
          </div>
        </div>
      )}
    </div>
  )
}
