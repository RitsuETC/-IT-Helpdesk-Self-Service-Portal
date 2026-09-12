import { useEffect, useState } from 'react'
import { api } from './api.js'
import { TicketDetail } from './tickets.jsx'

export default function Dashboard({ token, user, onTroubleshooting, onTickets, onKnowledge, onRequireLogin, showHistory = true, onNavigateAdmin, onEditAdmin }) {
  const [stats, setStats] = useState({ total: 0, new: 0, process: 0, resolved: 0 })
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [historyIndex, setHistoryIndex] = useState(0)
  const [showAllModal, setShowAllModal] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)

  // Deteksi role admin atau teknisi
  const userRole = (user?.role || '').toLowerCase()
  const isAdminOrTechnician = ['admin', 'teknisi', 'technician'].includes(userRole) || user?.is_admin || user?.is_technician

  const loadData = async () => {
    try {
      if (token) {
        const statsRes = await api('/tickets/stats', { token })
        setStats(statsRes.data || { total: 0, new: 0, process: 0, resolved: 0 })

        const listRes = await api('/tickets', { token })
        setTickets(listRes.data || [])
      } else {
        setStats({ total: 0, new: 0, process: 0, resolved: 0 })
        setTickets([])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    const fetchData = async () => {
      try {
        if (token) {
          const statsRes = await api('/tickets/stats', { token })
          if (isMounted) setStats(statsRes.data || { total: 0, new: 0, process: 0, resolved: 0 })

          const listRes = await api('/tickets', { token })
          if (isMounted) setTickets(listRes.data || [])
        }
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    if (!token) return

    const timer = setInterval(fetchData, 5000)

    return () => {
      isMounted = false;
      clearInterval(timer)
    }
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
      {/* Card Utama: Gradasi Emerald / Deep Forest Green yang Sangat Kaya & Mewah */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 20px 35px -10px rgba(2, 44, 34, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(167, 243, 208, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Efek Glow Dekoratif di Background Card */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Header Widget */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 1 }}>
          <button 
            onClick={() => {
              if (!token) onRequireLogin()
              else setShowAllModal(true)
            }}
            style={{
              backgroundColor: '#ffffff',
              color: '#022c22',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '999px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            <span>Seluruh Tiket</span>
            <span style={{ fontSize: '0.85rem', fontWeight: '900', color: '#059669' }}>›</span>
          </button>

          {/* Controls Slide */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(2, 44, 34, 0.4)', padding: '4px', borderRadius: '999px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button 
              onClick={prevSlide} 
              disabled={activeTickets.length === 0}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: activeTickets.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                opacity: activeTickets.length === 0 ? 0.3 : 1,
                transition: 'background 0.2s'
              }}
            >
              ‹
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', minWidth: '40px', textAlign: 'center', color: '#a7f3d0' }}>
              {activeTickets.length > 0 ? `${currentIndex + 1}/${activeTickets.length}` : '0/0'}
            </span>
            <button 
              onClick={nextSlide} 
              disabled={activeTickets.length === 0}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#fff',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                cursor: activeTickets.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold',
                opacity: activeTickets.length === 0 ? 0.3 : 1,
                transition: 'background 0.2s'
              }}
            >
              ›
            </button>
          </div>
        </div>

        {/* Tabel Widget Langsung */}
        <div style={{ overflowX: 'auto', zIndex: 1 }}>
          <table style={{ width: '100%', color: '#fff', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ color: '#a7f3d0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(167, 243, 208, 0.2)' }}>
                <th style={{ paddingBottom: '12px', fontWeight: '700' }}>ID TIKET</th>
                <th style={{ paddingBottom: '12px', fontWeight: '700' }}>PELAPOR</th>
                <th style={{ paddingBottom: '12px', fontWeight: '700' }}>KATEGORI</th>
                <th style={{ paddingBottom: '12px', fontWeight: '700', textAlign: 'right' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {!token ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: '#a7f3d0', fontSize: '0.9rem' }}>
                    Silakan login untuk melihat status tiket Anda.
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: '#a7f3d0' }}>
                    Memuat data tiket...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '24px 0', textAlign: 'center', color: '#a7f3d0' }}>
                    Tidak ada tiket aktif saat ini.
                  </td>
                </tr>
              ) : (
                visibleActiveTickets.map((activeTicket) => (
                  <tr 
                    key={activeTicket.id} 
                    onClick={() => setSelectedTicket(activeTicket)}
                    style={{ borderBottom: '1px solid rgba(167, 243, 208, 0.1)', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    <td style={{ padding: '14px 0', fontWeight: '800', letterSpacing: '0.03em', color: '#ffffff' }}>{activeTicket.code || `HD-${activeTicket.id}`}</td>
                    <td style={{ padding: '14px 0', color: '#ecfdf5', opacity: 0.95 }}>{activeTicket.pelapor_nama || activeTicket.reporter_name || activeTicket.pelapor || user?.username || '-'}</td>
                    <td style={{ padding: '14px 0', color: '#ecfdf5', opacity: 0.95 }}>{activeTicket.nama_kategori || activeTicket.kategori || activeTicket.category || activeTicket.device || '-'}</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' }}>
                      <span style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        padding: '5px 12px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: '800',
                        letterSpacing: '0.05em',
                        color: '#ffffff',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
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
        <div style={{ marginTop: '20px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#022c22', fontWeight: '800', letterSpacing: '-0.01em' }}>Riwayat Tiket Selesai</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => changeHistory(-1)}
                disabled={historyTickets.length <= 2}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #86efac',
                  background: '#ffffff',
                  color: '#064e3b',
                  cursor: historyTickets.length <= 2 ? 'not-allowed' : 'pointer',
                  opacity: historyTickets.length <= 2 ? 0.4 : 1,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => changeHistory(1)}
                disabled={historyTickets.length <= 2}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid #86efac',
                  background: '#ffffff',
                  color: '#064e3b',
                  cursor: historyTickets.length <= 2 ? 'not-allowed' : 'pointer',
                  opacity: historyTickets.length <= 2 ? 0.4 : 1,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                ›
              </button>
            </div>
          </div>

          {historyTickets.length === 0 ? (
            <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem', fontStyle: 'italic' }}>Belum ada tiket yang selesai atau ditutup.</p>
          ) : (
            <div style={{ display: 'grid', gap: '10px' }}>
              {visibleHistoryTickets.map((ticket) => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ background: '#ffffff', border: '1px solid #d1fae5', borderRadius: '12px', padding: '14px 16px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(6, 78, 59, 0.03)', transition: 'transform 0.15s ease, box-shadow 0.15s ease' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <strong style={{ color: '#064e3b', fontSize: '0.85rem', fontWeight: '800' }}>{ticket.code || `HD-${ticket.id}`}</strong>
                    <span style={{
                      backgroundColor: ticket.status === 'CLOSED' ? '#e2e8f0' : '#dcfce7',
                      color: ticket.status === 'CLOSED' ? '#334155' : '#166534',
                      borderRadius: '999px',
                      padding: '3px 10px',
                      fontSize: '0.7rem',
                      fontWeight: '800'
                    }}>
                      {ticket.status}
                    </span>
                  </div>
                  <div style={{ color: '#0f172a', fontSize: '0.9rem', fontWeight: '700', marginBottom: '4px' }}>
                    {ticket.judul || ticket.title || ticket.nama_kategori || ticket.kategori || ticket.category || 'Tiket'}
                  </div>
                  <div style={{ color: '#059669', fontSize: '0.75rem', fontWeight: '500' }}>
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
            backgroundColor: 'rgba(2, 44, 34, 0.7)',
            backdropFilter: 'blur(6px)',
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
              borderRadius: '20px',
              width: '90%',
              maxWidth: '950px',
              maxHeight: '85vh',
              padding: '28px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(2, 44, 34, 0.35)',
              border: '1px solid #a7f3d0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, color: '#022c22', fontSize: '1.35rem', fontWeight: '800' }}>Daftar Seluruh Tiket</h3>
                <p style={{ margin: '4px 0 0 0', color: '#047857', fontSize: '0.85rem' }}>Daftar lengkap status tiket yang terdaftar pada akun Anda.</p>
              </div>
              <button 
                onClick={() => setShowAllModal(false)}
                style={{ 
                  background: '#f0fdf4', 
                  border: '1px solid #bbf7d0', 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  fontSize: '1.2rem', 
                  cursor: 'pointer', 
                  color: '#064e3b',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ overflowY: 'auto', flex: 1, border: '1px solid #bbf7d0', borderRadius: '12px', background: '#fafaf9' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0', color: '#064e3b' }}>
                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>ID Tiket</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>Judul / Kategori</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>Status</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700' }}>Tanggal</th>
                    <th style={{ padding: '14px 18px', fontWeight: '700', textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Tidak ada data tiket.</td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr
                        key={t.id}
                        style={{ borderBottom: '1px solid #f1f5f9', background: '#fff', transition: 'background 0.15s' }}
                      >
                        <td style={{ padding: '14px 18px', fontWeight: '800', color: '#064e3b', cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>{t.code || `HD-${t.id}`}</td>
                        <td style={{ padding: '14px 18px', color: '#334155', fontWeight: '500', cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>{t.judul || t.title || t.nama_kategori || t.kategori || t.category || '-'}</td>
                        <td style={{ padding: '14px 18px', cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                          <span style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            fontSize: '0.72rem',
                            fontWeight: '700',
                            backgroundColor: t.status === 'NEW' ? '#fef3c7' : t.status === 'RESOLVED' ? '#dcfce7' : '#dbeafe',
                            color: t.status === 'NEW' ? '#92400e' : t.status === 'RESOLVED' ? '#166534' : '#1e40af'
                          }}>
                            {t.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 18px', color: '#64748b', fontSize: '0.8rem', cursor: 'pointer' }} onClick={() => setSelectedTicket(t)}>
                          {t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}
                        </td>
                        
                        {/* Kolom Aksi Konsisten Menggunakan Tombol Solid ala Admin/Teknisi (#064e3b) untuk Semua Role */}
                        <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                          {isAdminOrTechnician ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAllModal(false);
                                if (onEditAdmin) {
                                  onEditAdmin(t);
                                } else if (onNavigateAdmin) {
                                  onNavigateAdmin(t);
                                } else {
                                  setSelectedTicket(t);
                                }
                              }}
                              style={{
                                backgroundColor: '#064e3b',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)',
                                transition: 'background 0.2s'
                              }}
                            >
                              Edit
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAllModal(false);
                                setSelectedTicket(t); // Membuka modal versi user (TicketDetail)
                              }}
                              style={{
                                backgroundColor: '#064e3b',
                                color: '#ffffff',
                                border: 'none',
                                padding: '6px 14px',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(6, 78, 59, 0.2)',
                                transition: 'background 0.2s'
                              }}
                            >
                              Detail
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button 
                onClick={() => setShowAllModal(false)}
                style={{
                  backgroundColor: '#064e3b',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(6, 78, 59, 0.3)'
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Detail Tiket (Global) */}
      {selectedTicket && (
        <div onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(2, 44, 34, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, backdropFilter: 'blur(4px)' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: 900, background: '#fff', borderRadius: '16px', padding: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <TicketDetail token={token} user={user} ticketId={selectedTicket.id} onBack={() => setSelectedTicket(null)} onError={(m) => console.error(m)} />
          </div>
        </div>
      )}
    </div>
  )
}