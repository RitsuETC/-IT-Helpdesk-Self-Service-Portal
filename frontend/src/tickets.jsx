import { useState, useEffect } from 'react'
import { api } from './api.js'

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
    <div className="tickets-page" style={{ backgroundColor: '#f8faf9', color: '#1f2937', padding: '24px', borderRadius: '18px', margin: '0 auto', maxWidth: '100%', boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)' }}>
      <button 
        onClick={onBack} 
        style={{ marginBottom: '18px', background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 6px 16px rgba(12, 74, 48, 0.2)', transition: 'transform 0.1s ease, box-shadow 0.1s ease' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(12, 74, 48, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(12, 74, 48, 0.2)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(1px) scale(0.98)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(12, 74, 48, 0.2)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(12, 74, 48, 0.3)';
        }}
      >
        ← Kembali ke Daftar
      </button>
      
      <div className="tickets-toolbar" style={{ display: 'block', borderBottom: '1px solid #d1ded8', paddingBottom: '16px', marginBottom: '20px' }}>
        <h2 className="tickets-heading" style={{ color: '#0c4a30', fontSize: '22px', marginBottom: '4px', letterSpacing: '0.01em', fontWeight: '700' }}>{ticket.judul}</h2>
        <p className="history-description" style={{ color: '#4b5563', fontSize: '13px', margin: 0 }}>Informasi lengkap dan pembaruan status laporan tiket.</p>
      </div>

      {actionNotice && <p style={{ color: '#064e3b', fontWeight: '700', fontSize: '12px', marginBottom: '16px', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px 12px', borderRadius: '10px' }}>{actionNotice}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ border: '1px solid #064e3b', borderRadius: '14px', padding: '18px', background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', color: '#ffffff', boxShadow: '0 10px 24px rgba(12, 74, 48, 0.2)' }}>
          <b style={{ display: 'block', marginBottom: '12px', color: '#e2f0ea', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '8px' }}>Detail Laporan</b>
          <div style={{ display: 'grid', gap: '8px', fontSize: '12px', color: '#f1f5f9' }}>
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
        
        <div style={{ border: '1px solid #064e3b', borderRadius: '14px', padding: '18px', background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', color: '#ffffff', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 10px 24px rgba(12, 74, 48, 0.2)' }}>
          <div>
            <b style={{ display: 'block', marginBottom: '8px', color: '#e2f0ea', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '8px' }}>Masalah / Deskripsi</b>
            <p style={{ margin: 0, fontSize: '12px', color: '#f1f5f9', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{ticket.deskripsi}</p>
          </div>

          <div>
            <b style={{ display: 'block', marginBottom: '8px', color: '#e2f0ea', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '8px' }}>Tindakan / Hasil</b>
            {troublesLoading ? (
              <p style={{ color: '#dbeafe', margin: 0, fontSize: '12px' }}>Memuat tindakan...</p>
            ) : !trouble ? (
              <p style={{ color: '#dbeafe', margin: 0, fontSize: '12px' }}>Belum ada tindakan yang tercatat.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8, fontSize: '12px' }}>
                <div style={{ padding: '12px 14px', borderRadius: '10px', background: '#ffffff', color: '#1f2937', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
                  <div style={{ color: '#0c4a30', fontWeight: 700, marginBottom: '4px' }}>Tindakan:</div>
                  <div style={{ color: '#374151', marginBottom: '8px' }}>{trouble.tindakan}</div>
                  <div style={{ color: '#0c4a30', fontWeight: 700, marginBottom: '4px' }}>Hasil:</div>
                  <div style={{ color: '#374151' }}>{trouble.hasil}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kontrol Admin & Teknisi */}
      {isStaff && (
        <div style={{ border: '1px solid #064e3b', borderRadius: '14px', padding: '20px', background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', color: '#ffffff', display: 'grid', gap: '18px', boxShadow: '0 10px 24px rgba(12, 74, 48, 0.2)', width: '100%', boxSizing: 'border-box' }}>
          <b style={{ color: '#e2f0ea', fontSize: '13px', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '8px' }}>Kontrol Teknisi & Admin</b>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', width: '100%' }}>
            {/* Form Ubah Status */}
            <form onSubmit={handleUpdateStatus} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#f1f5f9' }}>Status Tiket</label>
              
              <select
                name="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{ height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '12px', backgroundColor: '#ffffff', color: '#1f2937', boxSizing: 'border-box' }}
              >
                <option value="NEW">NEW</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="WAITING">WAITING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>

              {selectedStatus === 'ASSIGNED' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: '#e2f0ea' }}>Pilih Teknisi Penanggung Jawab:</label>
                  <select
                    name="teknisi"
                    defaultValue={ticket.teknisi ?? ''}
                    style={{ height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '12px', backgroundColor: '#ffffff', color: '#1f2937', boxSizing: 'border-box' }}
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
                style={{ height: '38px', padding: '0 16px', backgroundColor: '#047857', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '100%', marginTop: 'auto', transition: 'background 0.1s ease, transform 0.1s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#065f46'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Perbarui Status
              </button>
            </form>

            {/* Form Ubah Prioritas */}
            <form onSubmit={handleUpdatePriority} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: '700', color: '#f1f5f9' }}>Prioritas Tiket</label>
              
              <select name="prioritas" defaultValue={ticket.prioritas} style={{ height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', fontSize: '12px', backgroundColor: '#ffffff', color: '#1f2937', boxSizing: 'border-box' }}>
                <option value="level_1">Level 1 (Low)</option>
                <option value="level_2">Level 2 (Medium)</option>
                <option value="level_3">Level 3 (High)</option>
              </select>

              <button 
                type="submit" 
                style={{ height: '38px', padding: '0 16px', backgroundColor: '#047857', color: '#ffffff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', width: '100%', marginTop: 'auto', transition: 'background 0.1s ease, transform 0.1s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#065f46'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#047857'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                Perbarui Prioritas
              </button>
            </form>
          </div>

          {/* Form Penyelesaian Tiket */}
          <form onSubmit={handleResolve} style={{ display: 'grid', gap: '10px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '16px', width: '100%' }}>
            <b style={{ fontSize: '12px', color: '#e2f0ea' }}>Form Penyelesaian Tiket</b>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', width: '100%' }}>
              <label style={{ fontSize: '12px', color: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Tindakan Perbaikan
                <textarea name="tindakan" rows="3" value={tindakanVal} onChange={(e) => setTindakanVal(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', backgroundColor: '#ffffff', color: '#1f2937', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Tuliskan tindakan..."></textarea>
              </label>
              <label style={{ fontSize: '12px', color: '#f1f5f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                Hasil Akhir
                <textarea name="hasil_akhir" rows="3" value={hasilVal} onChange={(e) => setHasilVal(e.target.value)} required style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '12px', backgroundColor: '#ffffff', color: '#1f2937', resize: 'vertical', boxSizing: 'border-box' }} placeholder="Tuliskan hasil akhir..."></textarea>
              </label>
            </div>
            <button 
              type="submit" 
              style={{ width: '100%', height: '40px', marginTop: '6px', backgroundColor: '#047857', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', boxShadow: '0 6px 16px rgba(0,0,0,0.15)', transition: 'background 0.1s ease, transform 0.1s ease' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#065f46'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#047857'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Simpan Penyelesaian
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function Tickets({ token, user, onError, onRequireLogin }) {
  const [tickets, setTickets] = useState([])
  const [selectedTicketId, setSelectedTicketId] = useState(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
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
      loadTickets()
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
        <button className="create-ticket" onClick={() => setShowCreateForm(true)}>
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
                transition: 'transform 0.1s ease, box-shadow 0.1s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(12, 74, 48, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(12, 74, 48, 0.25)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'translateY(1px) scale(0.99)';
                e.currentTarget.style.boxShadow = '0 4px 10px rgba(12, 74, 48, 0.2)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(12, 74, 48, 0.35)';
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
            </div>
          ))
        )}
      </div>

      {showCreateForm && (
        <div className="modal-backdrop" onClick={() => setShowCreateForm(false)}>
          <form className="ticket-form" onClick={e => e.stopPropagation()} onSubmit={handleCreateTicket}>
            <button type="button" className="close-ticket-form" onClick={() => setShowCreateForm(false)}>×</button>
            <h2>Buat Tiket Baru</h2>
            
            <label>
              Judul Kendala
              <input name="judul" required placeholder="Contoh: Printer Rusak" />
            </label>

            <label>
              Kategori
              <select name="kategori">
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Jaringan">Jaringan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </label>

            <label>
              Lokasi / Ruangan
              <select name="ruangan" required defaultValue="" style={{ display: 'block' }}>
                <option value="" disabled>-- Pilih Ruangan --</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>{r.ruangan}</option>
                ))}
              </select>
            </label>

            <label>
              Deskripsi Masalah
              <textarea name="deskripsi" required placeholder="Jelaskan kendala secara rinci..."></textarea>
            </label>

            <button type="submit">Kirim Laporan Tiket</button>
          </form>
        </div>
      )}
    </div>
  )
}