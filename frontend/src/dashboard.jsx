import { useEffect, useState } from 'react'
import { api } from './api.js'
import { TicketDetail } from './tickets.jsx'

export default function Dashboard({ token, user, onTroubleshooting, onTickets, onKnowledge, onRequireLogin, showHistory = true }) {
  const [stats, setStats] = useState({ total: 0, new: 0, process: 0, resolved: 0 })
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [historyIndex, setHistoryIndex] = useState(0)
  const [showAllModal, setShowAllModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)

  const loadData = async () => {
    try {
      const statsRes = await api('/tickets/stats', token ? { token } : {})
      setStats(statsRes.data || { total: 0, new: 0, process: 0, resolved: 0 })

      if (token) {
        const listRes = await api('/tickets', { token })
        setTickets(listRes.data || [])
      } else {
        setTickets([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    if (!token) return

    const timer = setInterval(() => {
      loadData()
    }, 3000)

    return () => clearInterval(timer)
  }, [token])

  // Active tickets exclude RESOLVED and CLOSED
  const activeTickets = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status))

  const nextSlide = () => {
    if (activeTickets.length === 0) return
    setCurrentIndex((prev) => {
      const start = Math.floor(prev / VISIBLE_COUNT) * VISIBLE_COUNT
      const totalPages = Math.ceil(activeTickets.length / VISIBLE_COUNT)
      const maxStart = Math.max(0, (totalPages - 1) * VISIBLE_COUNT)
      const next = start + VISIBLE_COUNT
      return next > maxStart ? 0 : next
    })
  }

  const prevSlide = () => {
    if (activeTickets.length === 0) return
    setCurrentIndex((prev) => {
      const start = Math.floor(prev / VISIBLE_COUNT) * VISIBLE_COUNT
      const totalPages = Math.ceil(activeTickets.length / VISIBLE_COUNT)
      const maxStart = Math.max(0, (totalPages - 1) * VISIBLE_COUNT)
      const next = start - VISIBLE_COUNT
      return next < 0 ? maxStart : next
    })
  }

  const VISIBLE_COUNT = 5
  const visibleActiveTickets = activeTickets.slice(currentIndex, currentIndex + VISIBLE_COUNT)
  const historyTickets = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status))
  const visibleHistoryTickets = historyTickets.slice(historyIndex, historyIndex + VISIBLE_COUNT)

  // Clamp currentIndex when activeTickets length changes
  useEffect(() => {
    if (currentIndex >= activeTickets.length) setCurrentIndex(0)
  }, [activeTickets.length])

  const changeHistory = (direction) => {
    if (historyTickets.length <= VISIBLE_COUNT) return
    setHistoryIndex((prev) => {
      const maxIndex = Math.max(0, historyTickets.length - VISIBLE_COUNT)
      const next = prev + direction
      if (next < 0) return 0
      if (next > maxIndex) return maxIndex
      return next
    })
  }

  return (
    <div style={{ width: '100%', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Card Hijau Widget Utama */}
      <div 
        style={{
          backgroundColor: '#065f46',
          backgroundImage: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '20px 24px',
          boxShadow: '0 10px 25px -5px rgba(4, 120, 87, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Header Widget */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <button 
            onClick={() => {
              if (!token) onRequireLogin()
              else setShowAllModal(true)
            }}
            style={{
              backgroundColor: '#ffffff',
              color: '#047857',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
            }}
          >
            <span>Seluruh Tiket</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>›</span>
          </button>

          {/* Controls Slide (1/15) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={prevSlide} 
              disabled={activeTickets.length === 0}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#fff',
                  width: '32px',
                height: '32px',
                borderRadius: '50%',
                  cursor: activeTickets.length === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                  opacity: activeTickets.length === 0 ? 0.4 : 1
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: '600', minWidth: '36px', textAlign: 'center', opacity: 0.9 }}>
              {activeTickets.length > 0 ? `${currentIndex + 1}/${activeTickets.length}` : '0/0'}
            </span>
            <button 
              onClick={nextSlide} 
              disabled={activeTickets.length === 0}
              style={{
                background: 'transparent',
                border: 'none',
                background: 'rgba(255, 255, 255, 0.15)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                cursor: activeTickets.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.9rem',
                opacity: activeTickets.length === 0 ? 0.4 : 1
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Tabel Widget Langsung tanpa Garis Atas */}
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', color: '#fff', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.775rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ paddingBottom: '8px', fontWeight: '600' }}>ID TIKET</th>
                <th style={{ paddingBottom: '8px', fontWeight: '600' }}>PELAPOR</th>
                <th style={{ paddingBottom: '8px', fontWeight: '600' }}>PERANGKAT</th>
                <th style={{ paddingBottom: '8px', fontWeight: '600', textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {!token ? (
                <tr>
                  <td colSpan="4" style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    Silakan login untuk melihat status tiket Anda.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.85)', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    Memuat data tiket...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '16px 0', textAlign: 'center', color: 'rgba(255, 255, 255, 0.85)', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    Tidak ada tiket aktif saat ini.
                  </td>
                </tr>
              ) : (
                visibleActiveTickets.map((activeTicket) => (
                  <tr key={activeTicket.id} style={{ borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
                    <td style={{ paddingTop: '10px', fontWeight: '700', letterSpacing: '0.02em' }}>{activeTicket.code || `HD-${activeTicket.id}`}</td>
                    <td style={{ paddingTop: '10px', opacity: 0.95 }}>{activeTicket.reporter_name || user?.username || '-'}</td>
                    <td style={{ paddingTop: '10px', opacity: 0.95 }}>{activeTicket.category || activeTicket.device || '-'}</td>
                    <td style={{ paddingTop: '10px', textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        letterSpacing: '0.03em'
                      }}>
                        {activeTicket.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showHistory && (
      <div style={{ marginTop: '16px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Riwayat Tiket</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => changeHistory(-1)}
              disabled={historyTickets.length <= 2}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                cursor: historyTickets.length <= 2 ? 'not-allowed' : 'pointer',
                opacity: historyTickets.length <= 2 ? 0.5 : 1,
                fontSize: '1rem'
              }}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => changeHistory(1)}
              disabled={historyTickets.length <= 2}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#334155',
                cursor: historyTickets.length <= 2 ? 'not-allowed' : 'pointer',
                opacity: historyTickets.length <= 2 ? 0.5 : 1,
                fontSize: '1rem'
              }}
            >
              ›
            </button>
          </div>
        </div>

        {historyTickets.length === 0 ? (
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>Belum ada tiket yang selesai atau ditutup.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {visibleHistoryTickets.map((ticket) => (
              <div key={ticket.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <strong style={{ color: '#0f172a', fontSize: '0.82rem' }}>{ticket.code || `HD-${ticket.id}`}</strong>
                  <span style={{
                    backgroundColor: ticket.status === 'CLOSED' ? '#e2e8f0' : '#dcfce7',
                    color: ticket.status === 'CLOSED' ? '#334155' : '#166534',
                    borderRadius: '999px',
                    padding: '4px 8px',
                    fontSize: '0.68rem',
                    fontWeight: '700'
                  }}>
                    {ticket.status}
                  </span>
                </div>
                <div style={{ color: '#334155', fontSize: '0.85rem', fontWeight: '600', marginBottom: '4px' }}>
                  {ticket.title || ticket.category || ticket.device || 'Tiket'}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>
                  {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'Tanggal tidak tersedia'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Modal Pop-up Seluruh Tiket */}
      {showAllModal && (
        <div 
          onClick={() => setShowAllModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '800px',
              maxHeight: '80vh',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>Daftar Seluruh Tiket</h3>
                <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>Daftar lengkap status tiket yang terdaftar pada akun Anda.</p>
              </div>
              <button 
                onClick={() => setShowAllModal(false)}
                style={{ 
                  background: '#f1f5f9', 
                  border: 'none', 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  fontSize: '1.2rem', 
                  cursor: 'pointer', 
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>ID Tiket</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Judul / Perangkat</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: '600' }}>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Tidak ada data tiket.</td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                          <tr
                            key={t.id}
                            onClick={() => {
                              if (!t.status || (t.status !== 'RESOLVED' && t.status !== 'CLOSED')) {
                                setSelectedTicket(t)
                              }
                            }}
                            style={{ borderBottom: '1px solid #f1f5f9', cursor: (!t.status || (t.status !== 'RESOLVED' && t.status !== 'CLOSED')) ? 'pointer' : 'default' }}
                          >
                            <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>{t.code || `HD-${t.id}`}</td>
                            <td style={{ padding: '12px 16px', color: '#334155' }}>{t.title || t.category || '-'}</td>
                            <td style={{ padding: '12px 16px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: t.status === 'NEW' ? '#fef3c7' : t.status === 'RESOLVED' ? '#dcfce7' : '#dbeafe',
                                color: t.status === 'NEW' ? '#92400e' : t.status === 'RESOLVED' ? '#166534' : '#1e40af'
                              }}>
                                {t.status}
                              </span>
                            </td>
                            <td style={{ padding: '12px 16px', color: '#64748b' }}>
                              {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                            </td>
                          </tr>
                        ))
                  )}
                </tbody>
              </table>
            </div>

            {selectedTicket && (
              <div onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
                <div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: 900, background: '#fff', borderRadius: 12, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
                  <TicketDetail token={token} user={user} ticket={selectedTicket} onBack={() => setSelectedTicket(null)} onError={(m) => console.error(m)} />
                </div>
              </div>
            )}

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                onClick={() => setShowAllModal(false)}
                style={{
                  backgroundColor: '#0f172a',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}