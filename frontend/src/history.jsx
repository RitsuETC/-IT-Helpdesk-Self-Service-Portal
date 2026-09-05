import { useEffect, useState } from 'react'
import { api } from './api.js'
import { TicketDetail } from './tickets.jsx'

export default function HistoryCarousel({ token, user, onError }) {
  const [tickets, setTickets] = useState([])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState(null)
  
  // State untuk modal halaman baru seluruh riwayat
  const [showAllModal, setShowAllModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

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

  const VISIBLE_COUNT = 8
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

  // Filter pencarian di modal seluruh tiket
  const filteredAllTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase()
    const code = (t.code || `HD-${t.id}`).toLowerCase()
    const title = (t.judul || t.title || t.category || '').toLowerCase()
    return code.includes(q) || title.includes(q)
  })

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

      {/* Daftar Kartu Riwayat Tiket */}
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
              {t.judul || t.title || t.category || t.device || 'Tiket'}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '10px' }}>
              {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
            </div>
          </button>
        ))}

        {/* Tombol 'Lihat Selengkapnya' yang membuka Modal Baru */}
        {tickets.length > VISIBLE_COUNT && (
          <button
            onClick={() => setShowAllModal(true)}
            style={{
              width: '100%',
              padding: '10px',
              marginTop: '4px',
              backgroundColor: '#f0fdf4',
              border: '1px dashed #166534',
              borderRadius: '10px',
              color: '#166534',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dcfce7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f0fdf4'
            }}
          >
            Lihat Selengkapnya ({tickets.length} Tiket Selesai) &rarr;
          </button>
        )}
      </div>

      {/* MODAL HALAMAN BARU: MENAMPILKAN SELURUH TIKET SELESAI */}
      {showAllModal && (
        <div 
          onClick={() => setShowAllModal(false)} 
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ width: '100%', maxWidth: '960px', background: '#f8faf9', borderRadius: '18px', padding: '24px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2ece5', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#0c4a30', fontSize: '20px', fontWeight: '700' }}>Seluruh Riwayat Tiket Selesai</h2>
                <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '12px' }}>Total {tickets.length} tiket dengan status RESOLVED dan CLOSED.</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder="Cari ID/Judul..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cfdad2', fontSize: '12px', outline: 'none', width: '180px' }}
                />
                <button 
                  onClick={() => setShowAllModal(false)} 
                  style={{ border: 'none', background: '#e2e8f0', color: '#334155', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Grid Seluruh Tiket */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {filteredAllTickets.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '13px', gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>Tidak ada tiket yang cocok dengan pencarian.</p>
              ) : (
                filteredAllTickets.map((t) => (
                  <button 
                    key={t.id} 
                    onClick={() => setSelectedTicket(t)} 
                    style={{ 
                      textAlign: 'left', 
                      background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', 
                      color: '#ffffff', 
                      border: '1px solid #064e3b', 
                      borderRadius: '12px', 
                      padding: '14px', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(12, 74, 48, 0.18)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ color: '#e2f0ea', fontSize: '12px' }}>{t.code || `HD-${t.id}`}</strong>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '9px', fontWeight: 'bold', backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#ffffff', textTransform: 'uppercase' }}>
                        {t.status}
                      </span>
                    </div>
                    <div style={{ color: '#ffffff', fontWeight: '600', fontSize: '13px', lineHeight: '1.3' }}>
                      {t.judul || t.title || t.category || t.device || 'Tiket'}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '6px' }}>
                      Tanggal: {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail Single Tiket */}
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