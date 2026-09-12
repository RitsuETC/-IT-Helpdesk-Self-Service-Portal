import { useState, useEffect } from 'react'
import { api } from './api.js'
import { confirmAction } from './confirm.js'

export function TicketDetail({ token, user, ticketId, onBack, onError }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionNotice, setActionNotice] = useState('')
  const [trouble, setTrouble] = useState(null)
  const [troublesLoading, setTroublesLoading] = useState(true)
  const [tindakanVal, setTindakanVal] = useState('')
  const [hasilVal, setHasilVal] = useState('')
  const [technicians, setTechnicians] = useState([])
  const [selectedStatus, setSelectedStatus] = useState('NEW')

  const loadDetail = async () => {
    if (!ticketId) return
    try {
      const res = await api(`/tickets/${ticketId}`, { token })
      if (res && res.data) {
        setTicket(res.data)
      } else {
        onError('Data tiket tidak valid.')
        onBack()
      }
    } catch (err) {
      onError(err.message || 'Gagal memuat detail tiket.')
      onBack()
    } finally {
      setLoading(false)
    }
  }

  const loadTroubleshooting = async () => {
    if (!ticketId) return
    setTroublesLoading(true)
    try {
      const res = await api(`/troubleshooting/${ticketId}`, { token })
      setTrouble(res.data || null)
      setTindakanVal(res.data?.tindakan || '')
      setHasilVal(res.data?.hasil || '')
    } catch (err) {
      console.error('Failed to load troubleshooting', err)
      setTrouble(null)
      setTindakanVal('')
      setHasilVal('')
    } finally {
      setTroublesLoading(false)
    }
  }

  const loadTechnicians = async () => {
    try {
      const res = await api('/tickets/meta/options', { token })
      setTechnicians(res.data?.technicians || [])
    } catch (err) {
      console.error('Failed to load technicians', err)
      setTechnicians([])
    }
  }

  useEffect(() => {
    loadDetail()
  }, [ticketId])

  useEffect(() => {
    loadTroubleshooting()
  }, [ticketId])

  useEffect(() => {
    loadTechnicians()
  }, [token])

  useEffect(() => {
    if (ticket?.status) setSelectedStatus(ticket.status)
  }, [ticket?.status])

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const nextStatus = form.get('status')
    const nextTeknisi = form.get('teknisi')

    try {
      await api(`/tickets/${ticketId}/status`, {
        token,
        method: 'PATCH',
        body: {
          status: nextStatus,
          ...(nextStatus === 'ASSIGNED' ? { teknisi: nextTeknisi } : {})
        }
      })
      setActionNotice('Status berhasil diperbarui!')
      loadDetail()
    } catch (err) {
      setActionNotice(err.message)
    }
  }

  const handleUpdatePriority = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await api(`/tickets/${ticketId}/priority`, {
        token,
        method: 'PATCH',
        body: { prioritas: form.get('prioritas') }
      })
      setActionNotice('Prioritas berhasil diperbarui!')
      loadDetail()
    } catch (err) {
      setActionNotice(err.message)
    }
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    const tindakan = form.get('tindakan')
    const hasilAkhir = form.get('hasil_akhir')
    
    try {
      await api(`/tickets/${ticketId}/resolve`, {
        token,
        method: 'PATCH',
        body: { 
          solusi: `Tindakan: ${tindakan} | Hasil Akhir: ${hasilAkhir}` 
        }
      })
    } catch (err) {
      setActionNotice(err.message)
      return
    }

    try {
      const res = await api('/troubleshooting', {
        token,
        method: 'POST',
        body: {
          id_tiket: ticketId,
          tindakan: tindakan,
          hasil_akhir: hasilVal,
        }
      })

      setActionNotice(res.message || 'Penyelesaian berhasil disimpan!')
      setTrouble(res.data || null)
      loadDetail()
      loadTroubleshooting()
    } catch (err) {
      setActionNotice(err.message)
    }
  }

  if (loading) return <div className="tickets-page"><p className="empty-tickets">Memuat detail tiket...</p></div>
  if (!ticket) return null

  const isStaff = user?.role === 'admin' || user?.role === 'teknisi'

  return (
    <div className="tickets-page" style={{ backgroundColor: '#f0fdf4', color: '#064e3b', padding: '28px', borderRadius: '20px', margin: '0 auto', maxWidth: '100%', boxShadow: '0 20px 40px rgba(4, 120, 87, 0.12)', border: isStaff ? '2px solid #059669' : '1px solid #a7f3d0' }}>
      
      {isStaff && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#022c22', color: '#ffffff', padding: '14px 20px', borderRadius: '14px', marginBottom: '22px', fontSize: '13px', fontWeight: '800', boxShadow: '0 6px 16px rgba(2, 44, 34, 0.3)' }}>
          <span style={{ letterSpacing: '0.02em' }}>Panel Kontrol {user?.role === 'admin' ? 'Admin' : 'Teknisi'}</span>
          <span style={{ backgroundColor: '#059669', padding: '5px 12px', borderRadius: '8px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)' }}>Mode Staff Aktif</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button 
          onClick={onBack} 
          style={{ background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', color: '#ffffff', border: 'none', padding: '10px 18px', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 6px 16px rgba(4, 120, 87, 0.25)', transition: 'all 0.2s ease' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 22px rgba(4, 120, 87, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(4, 120, 87, 0.25)';
          }}
        >
          ← Kembali ke Daftar
        </button>
      </div>
      
      <div className="tickets-toolbar" style={{ display: 'block', borderBottom: '2px solid #a7f3d0', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 className="tickets-heading" style={{ color: '#022c22', fontSize: '24px', marginBottom: '6px', fontWeight: '800', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{ticket.judul}</h2>
        <p className="history-description" style={{ color: '#047857', fontSize: '13px', fontWeight: '600', margin: 0 }}>Informasi lengkap dan pembaruan status laporan tiket sistem.</p>
      </div>

      {actionNotice && <p style={{ color: '#065f46', fontWeight: '700', fontSize: '12px', marginBottom: '20px', background: '#d1fae5', border: '1px solid #34d399', padding: '12px 16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(52, 211, 153, 0.2)' }}>{actionNotice}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ border: '1px solid #34d399', borderRadius: '16px', padding: '20px', background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', color: '#ffffff', boxShadow: '0 12px 28px rgba(2, 44, 34, 0.25)', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <b style={{ display: 'block', marginBottom: '14px', color: '#6ee7b7', fontSize: '14px', borderBottom: '1px solid rgba(110, 231, 183, 0.2)', paddingBottom: '8px', letterSpacing: '0.03em' }}>Detail Laporan</b>
          <div style={{ display: 'grid', gap: '10px', fontSize: '12px', color: '#f0fdf4' }}>
            <div><strong>ID Tiket:</strong> HD-{ticket.id}</div>
            <div><strong>Pelapor:</strong> {ticket.pelapor_nama || ticket.pelapor || '-'}</div>
            <div><strong>Lokasi:</strong> {ticket.nama_ruangan || ticket.ruangan || ticket.lokasi || '-'}</div>
            <div><strong>Kategori:</strong> {ticket.nama_kategori || ticket.kategori || ticket.categori || '-'}</div>
            <div><strong>Teknisi:</strong> {ticket.teknisi_nama || ticket.teknisi || '-'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>Prioritas:</strong> {ticket.prioritas || '-'} 
              <span className={`priority-dot ${ticket.prioritas?.toLowerCase()}`}></span>
            </div>
            <div><strong>Status:</strong> {ticket.status || '-'}</div>
            <div><strong>Tanggal:</strong> {ticket.created_at ? new Date(ticket.created_at).toLocaleString() : '-'}</div>
          </div>
        </div>
        
        <div style={{ border: '1px solid #34d399', borderRadius: '16px', padding: '20px', background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 12px 28px rgba(2, 44, 34, 0.25)', transition: 'transform 0.2s ease' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <div>
            <b style={{ display: 'block', marginBottom: '8px', color: '#6ee7b7', fontSize: '14px', borderBottom: '1px solid rgba(110, 231, 183, 0.2)', paddingBottom: '8px', letterSpacing: '0.03em' }}>Masalah / Deskripsi</b>
            <p style={{ margin: 0, fontSize: '12px', color: '#f0fdf4', lineHeight: '1.6', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{ticket.deskripsi}</p>
          </div>

          <div>
            <b style={{ display: 'block', marginBottom: '8px', color: '#6ee7b7', fontSize: '14px', borderBottom: '1px solid rgba(110, 231, 183, 0.2)', paddingBottom: '8px', letterSpacing: '0.03em' }}>Tindakan / Hasil</b>
            {troublesLoading ? (
              <p style={{ color: '#a7f3d0', margin: 0, fontSize: '12px' }}>Memuat tindakan...</p>
            ) : !trouble ? (
              <p style={{ color: '#a7f3d0', margin: 0, fontSize: '12px' }}>Belum ada tindakan yang tercatat.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8, fontSize: '12px' }}>
                <div style={{ padding: '14px', borderRadius: '12px', background: '#ffffff', color: '#022c22', border: '1px solid #34d399', boxShadow: '0 6px 16px rgba(0,0,0,0.1)', wordBreak: 'break-word', overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>
                  <div style={{ color: '#047857', fontWeight: 800, marginBottom: '4px' }}>Tindakan:</div>
                  <div style={{ color: '#1f2937', marginBottom: '8px' }}>{trouble.tindakan}</div>
                  <div style={{ color: '#047857', fontWeight: 800, marginBottom: '4px' }}>Hasil:</div>
                  <div style={{ color: '#1f2937' }}>{trouble.hasil}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isStaff && (
        <div style={{ border: '2px solid #059669', borderRadius: '20px', padding: '26px', background: '#ffffff', color: '#022c22', display: 'flex', flexDirection: 'column', gap: '22px', boxShadow: '0 16px 36px rgba(5, 150, 105, 0.15)', width: '100%', boxSizing: 'border-box' }}>
          
          <div style={{ borderBottom: '2px solid #e6f4ed', paddingBottom: '14px' }}>
            <span style={{ fontSize: '16px', fontWeight: '900', color: '#022c22', display: 'block', letterSpacing: '0.01em' }}>
              Panduan Alur Kerja Penanganan Tiket
            </span>
            <span style={{ fontSize: '12px', color: '#047857', fontWeight: '600' }}>
              Selesaikan proses secara berurutan mulai dari langkah pertama hingga selesai.
            </span>
          </div>
          
          {/* LANGKAH 1 */}
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #86efac', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.05)', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(4, 120, 87, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(4, 120, 87, 0.05)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ backgroundColor: '#059669', color: '#ffffff', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)' }}>1</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#022c22' }}>
                Tentukan Prioritas Tiket Terlebih Dahulu
              </span>
            </div>
            <form onSubmit={handleUpdatePriority} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select name="prioritas" defaultValue={ticket.prioritas} style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #34d399', width: '100%', fontSize: '12px', backgroundColor: '#ffffff', color: '#022c22', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}>
                <option value="level_1">Level 1 (Low)</option>
                <option value="level_2">Level 2 (Medium)</option>
                <option value="level_3">Level 3 (High)</option>
              </select>
              <button 
                type="submit" 
                style={{ height: '40px', padding: '0 18px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)', width: '100%', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Simpan Prioritas
              </button>
            </form>
          </div>

          {/* LANGKAH 2 */}
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #86efac', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.05)', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(4, 120, 87, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(4, 120, 87, 0.05)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ backgroundColor: '#059669', color: '#ffffff', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)' }}>2</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#022c22' }}>
                Perbarui Status & Tugaskan Teknisi Penanggung Jawab
              </span>
            </div>
            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                name="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #34d399', width: '100%', fontSize: '12px', backgroundColor: '#ffffff', color: '#022c22', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}
              >
                <option value="NEW">NEW (Baru)</option>
                <option value="ASSIGNED">ASSIGNED (Ditugaskan)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Sedang Dikerjakan)</option>
                <option value="WAITING">WAITING (Menunggu / Tertunda)</option>
                <option value="RESOLVED">RESOLVED (Selesai)</option>
                <option value="CLOSED">CLOSED (Ditutup)</option>
              </select>

              {selectedStatus === 'ASSIGNED' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>Pilih Teknisi Penanggung Jawab:</label>
                  <select
                    name="teknisi"
                    defaultValue={ticket.teknisi ?? ''}
                    style={{ height: '42px', padding: '0 14px', borderRadius: '10px', border: '1px solid #34d399', width: '100%', fontSize: '12px', backgroundColor: '#ffffff', color: '#022c22', fontWeight: '600', boxSizing: 'border-box', outline: 'none' }}
                    required
                  >
                    <option value="">-- Pilih Teknisi --</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>{tech.nama}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                type="submit" 
                style={{ height: '40px', padding: '0 18px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800', fontSize: '12px', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)', width: '100%', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Simpan Status
              </button>
            </form>
          </div>

          {/* LANGKAH 3 */}
          <div style={{ backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #86efac', boxShadow: '0 4px 12px rgba(4, 120, 87, 0.05)', transition: 'all 0.2s ease' }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 6px 16px rgba(4, 120, 87, 0.12)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(4, 120, 87, 0.05)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ backgroundColor: '#059669', color: '#ffffff', width: '26px', height: '26px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '900', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.4)' }}>3</span>
              <span style={{ fontSize: '14px', fontWeight: '800', color: '#022c22' }}>
                Catat Solusi / Penyelesaian Akhir Kendala
              </span>
            </div>
            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px', width: '100%' }}>
                <label style={{ fontSize: '12px', color: '#047857', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  Tindakan Perbaikan
                  <textarea name="tindakan" rows="3" value={tindakanVal} onChange={(e) => setTindakanVal(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #34d399', borderRadius: '10px', fontSize: '12px', backgroundColor: '#ffffff', color: '#022c22', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} placeholder="Tuliskan tindakan perbaikan yang dilakukan..."></textarea>
                </label>
                <label style={{ fontSize: '12px', color: '#047857', fontWeight: '700', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  Hasil Akhir
                  <textarea name="hasil_akhir" rows="3" value={hasilVal} onChange={(e) => setHasilVal(e.target.value)} required style={{ width: '100%', padding: '12px', border: '1px solid #34d399', borderRadius: '10px', fontSize: '12px', backgroundColor: '#ffffff', color: '#022c22', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} placeholder="Tuliskan kondisi hasil akhir perangkat..."></textarea>
                </label>
              </div>
              <button 
                type="submit" 
                style={{ width: '100%', height: '44px', backgroundColor: '#059669', color: '#ffffff', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '13px', cursor: 'pointer', boxShadow: '0 6px 18px rgba(5, 150, 105, 0.35)', transition: 'all 0.2s ease' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#047857';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                Simpan & Selesaikan Tiket
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  )
}

export default function Tickets({ token, user, onError, onRequireLogin, createOnly = false, onCloseCreate, initialOpenCreate = false }) {
  const [tickets, setTickets] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(initialOpenCreate || createOnly)
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [rooms, setRooms] = useState([])

  const loadTickets = async () => {
    if (!token) return
    try {
      const res = await api('/tickets', { token })
      setTickets(res.data || [])
    } catch (err) {
      onError(err.message)
    }
  }

  const loadMeta = async () => {
    if (!token) return
    try {
      const res = await api('/tickets/meta/options', { token })
      setRooms(res.data?.rooms || [])
    } catch (err) {
      console.error('Failed to load meta options', err)
      setRooms([])
    }
  }

  useEffect(() => {
    if (!token) {
      onRequireLogin()
    } else {
      loadTickets()
      loadMeta()
    }
  }, [token])

  useEffect(() => {
    if (createOnly || initialOpenCreate) setShowCreateForm(true)
  }, [createOnly, initialOpenCreate])

  const handleCreateTicket = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await api('/tickets', {
        token,
        method: 'POST',
        body: {
          judul: form.get('judul'),
          kategori: form.get('kategori'),
          ruangan: form.get('ruangan'),
          deskripsi: form.get('deskripsi')
        }
      })
      setShowCreateForm(false)
      onCloseCreate?.()
      loadTickets()
    } catch (err) {
      onError(err.message)
    }
  }

  const handleDeleteTicket = async (ticket) => {
    const confirmed = await confirmAction(
      `Hapus tiket HD-${ticket.id}? Data tiket dan riwayat penyelesaiannya akan dihapus.`
    )
    if (!confirmed) return

    try {
      await api(`/tickets/${ticket.id}`, { token, method: 'DELETE' })
      if (selectedTicketId === ticket.id) setSelectedTicketId(null)
      await loadTickets()
    } catch (err) {
      onError(err.message)
    }
  }

  if (selectedTicketId) {
    return (
      <TicketDetail 
        token={token} 
        user={user} 
        ticketId={selectedTicketId} 
        onBack={() => setSelectedTicketId(null)} 
        onError={onError} 
      />
    )
  }

  const filteredTickets = tickets.filter(t => {
    if (priorityFilter === 'ALL') return true
    const ticketPriority = (t.prioritas || '').toLowerCase()
    const filterVal = priorityFilter.toLowerCase()

    if (filterVal === 'low') return ticketPriority.includes('low') || ticketPriority.includes('level_1')
    if (filterVal === 'medium') return ticketPriority.includes('medium') || ticketPriority.includes('level_2')
    if (filterVal === 'high' || filterVal === 'critical') return ticketPriority.includes('high') || ticketPriority.includes('critical') || ticketPriority.includes('level_3')

    return ticketPriority === filterVal
  })

  if (createOnly) {
    return showCreateForm ? (
      <div
        className="modal-backdrop"
        onClick={() => { setShowCreateForm(false); onCloseCreate?.() }}
        style={{ zIndex: 1100 }}
      >
        <form
          className="ticket-form"
          onClick={(event) => event.stopPropagation()}
          onSubmit={handleCreateTicket}
        >
          <button
            type="button"
            className="close-ticket-form"
            onClick={() => { setShowCreateForm(false); onCloseCreate?.() }}
            aria-label="Tutup form tiket"
          >×</button>
          <h2>Buat Tiket Baru</h2>
          <label>Judul Kendala<input name="judul" required placeholder="Contoh: Printer Rusak" /></label>
          <label>Kategori<select name="kategori"><option value="Hardware">Hardware</option><option value="Software">Software</option><option value="Jaringan">Jaringan</option><option value="Lainnya">Lainnya</option></select></label>
          <label>Lokasi / Ruangan<select name="ruangan" required defaultValue=""><option value="" disabled>-- Pilih Ruangan --</option>{rooms.map((room) => <option key={room.id} value={room.id}>{room.ruangan}</option>)}</select></label>
          <label>Deskripsi Masalah<textarea name="deskripsi" required placeholder="Jelaskan kendala secara rinci..." rows="3" /></label>
          <button type="submit">Kirim Laporan Tiket</button>
        </form>
      </div>
    ) : null
  }

  return (
    <div className="tickets-page">
      <h2 className="tickets-heading">Daftar Tiket Bantuan</h2>
      <p className="history-description">Kelola dan pantau seluruh laporan kendala IT Anda di sini.</p>

      <div className="tickets-toolbar">
        <label className="priority-filter">
          Filter Prioritas:
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="ALL">Semua Prioritas</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        
        <button 
          className="create-ticket" 
          onClick={() => setShowCreateForm(true)}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '10px',
            fontWeight: '700',
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(5, 150, 105, 0.35)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(5, 150, 105, 0.25)';
          }}
        >
          + Buat Tiket Baru
        </button>
      </div>

      <div className="ticket-grid">
        {filteredTickets.length === 0 ? (
          <p className="empty-tickets">Tidak ada tiket ditemukan.</p>
        ) : (
          filteredTickets.map(t => (
              <div 
              key={t.id} 
                onClick={() => setSelectedTicketId(t.id)}
              style={{
                background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '12px',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(12, 74, 48, 0.25)',
                transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(12, 74, 48, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(12, 74, 48, 0.25)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#e2f0ea' }}>HD-{t.id}</span>
                <span style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                  padding: '2px 8px', 
                  borderRadius: '20px', 
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#ffffff'
                }}>
                  {t.status}
                </span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px', color: '#ffffff' }}>{t.judul}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#cbd5e1' }}>
                <span>
                  {new Date(t.created_at).toLocaleDateString()} ({t.kategori})
                </span>
                <span className={`priority-dot ${t.prioritas?.toLowerCase()}`} title={t.prioritas}></span>
              </div>
              {user?.role === 'admin' && (
                <button
                  type="button"
                  className="danger-button"
                  onClick={(event) => { event.stopPropagation(); handleDeleteTicket(t) }}
                  style={{ marginTop: '12px' }}
                >
                  Hapus tiket
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {showCreateForm && (
        <div 
          className="modal-backdrop" 
          onClick={() => setShowCreateForm(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <form 
            className="ticket-form" 
            onClick={e => e.stopPropagation()} 
            onSubmit={handleCreateTicket}
            style={{
              background: '#ffffff',
              padding: '28px',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxSizing: 'border-box'
            }}
          >
            <button 
              type="button" 
              className="close-ticket-form" 
              onClick={() => setShowCreateForm(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '18px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                color: '#6b7280',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
            
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0c4a30', margin: '0 0 4px 0' }}>Buat Tiket Baru</h2>
            
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
              Judul Kendala
              <input name="judul" required placeholder="Contoh: Printer Rusak" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', outline: 'none' }} />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
              Kategori
              <select name="kategori" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', background: '#fff', outline: 'none' }}>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Jaringan">Jaringan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
              Lokasi / Ruangan
              <select name="ruangan" required defaultValue="" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', background: '#fff', outline: 'none' }}>
                <option value="" disabled>-- Pilih Ruangan --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.ruangan}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
              Deskripsi Masalah
              <textarea name="deskripsi" required placeholder="Jelaskan kendala secara rinci..." rows="3" style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '12px', resize: 'vertical', outline: 'none' }}></textarea>
            </label>

            <button 
              type="submit"
              style={{
                marginTop: '6px',
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '11px',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                transition: 'background 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #047857 0%, #065f46 100%)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)'}
            >
              Kirim Laporan Tiket
            </button>
          </form>
        </div>
      )}
    </div>
  )
}