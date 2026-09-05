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

  const VISIBLE_COUNT = 3
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

  if (loading) return <p style={{ color: '#64748b', fontSize: '13px' }}>Memuat riwayat...</p>
  if (tickets.length === 0) return <p style={{ color: '#64748b', fontSize: '13px' }}>Belum ada tiket yang selesai.</p>

  return (
    <div>
      {/* Tombol Navigasi Carousel */}
      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <button 
          onClick={() => change(-1)} 
          disabled={tickets.length <= VISIBLE_COUNT} 
          style={{ 
            width: 28, 
            height: 28, 
            borderRadius: '50%', 
            border: '1px solid #064e3b', 
            background: '#ffffff', 
            color: '#0c4a30', 
            cursor: tickets.length <= VISIBLE_COUNT ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(12, 74, 48, 0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          &lsaquo;
        </button>
        <button 
          onClick={() => change(1)} 
          disabled={tickets.length <= VISIBLE_COUNT} 
          style={{ 
            width: 28, 
            height: 28, 
            borderRadius: '50%', 
            border: '1px solid #064e3b', 
            background: '#ffffff', 
            color: '#0c4a30', 
            cursor: tickets.length <= VISIBLE_COUNT ? 'not-allowed' : 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontWeight: 'bold',
            boxShadow: '0 2px 5px rgba(12, 74, 48, 0.1)',
            transition: 'all 0.2s ease'
          }}
        >
          &rsaquo;
        </button>
      </div>

      {/* Daftar Kartu Riwayat Tiket dengan Hijau Tua Gradasi Semula */}
      <div style={{ display: 'grid', gap: '8px' }}>
        {visible.map((t) => (
          <button 
            key={t.id} 
            onClick={() => setSelectedTicket(t)} 
            style={{ 
              textAlign: 'left', 
              background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', 
              color: '#ffffff', 
              border: '1px solid #064e3b', 
              borderRadius: '10px', 
              padding: '10px 14px', 
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(12, 74, 48, 0.2)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 18px rgba(12, 74, 48, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(12, 74, 48, 0.2)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ color: '#e2f0ea', fontSize: '12px', letterSpacing: '0.3px' }}>{t.code || `HD-${t.id}`}</strong>
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', textTransform: 'uppercase' }}>
                {t.status}
              </span>
            </div>
            <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '12px', lineHeight: '1.3' }}>
              {t.title || t.category || t.device || 'Tiket'}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
              {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
            </div>
          </button>
        ))}
      </div>

      {/* Modal Detail Tiket */}
      {selectedTicket && (
        <div onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '900px', background: '#fff', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 15px 35px rgba(0,0,0,0.2)' }}>
            <TicketDetail token={token} user={user} ticketId={selectedTicket.id} onBack={() => setSelectedTicket(null)} onError={onError} />
          </div>
        </div>
      )}
    </div>
  )
}