import { useState, useEffect } from 'react'
import { api } from './api.js'

export function TicketDetail({ token, user, ticketId, onBack, onError }) {
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionNotice, setActionNotice] = useState('')

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

  useEffect(() => {
    loadDetail()
  }, [ticketId])

  const handleUpdateStatus = async (e) => {
    e.preventDefault()
    const form = new FormData(e.currentTarget)
    try {
      await api(`/tickets/${ticketId}/status`, {
        token,
        method: 'PATCH',
        body: { status: form.get('status') }
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
        body: { priority: form.get('priority') }
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
    try {
      await api(`/tickets/${ticketId}/resolve`, {
        token,
        method: 'PATCH',
        body: { 
          tindakan: form.get('tindakan'), 
          hasil_akhir: form.get('hasil_akhir') 
        }
      })
      setActionNotice('Tiket berhasil diselesaikan!')
      loadDetail()
    } catch (err) {
      setActionNotice(err.message)
    }
  }

  if (loading) return <div className="tickets-page"><p className="empty-tickets">Memuat detail tiket...</p></div>
  if (!ticket) return null

  const isStaff = user?.role === 'admin' || user?.role === 'teknisi'

  return (
    <div className="tickets-page">
      <button className="create-ticket" onClick={onBack} style={{ marginBottom: '16px' }}>← Kembali ke Daftar</button>
      
      <div className="tickets-toolbar" style={{ display: 'block' }}>
        <h2 className="tickets-heading">{ticket.judul}</h2>
        <p className="history-description">Informasi lengkap dan pembaruan status laporan tiket.</p>
      </div>

      {actionNotice && <p style={{ color: 'var(--green)', fontWeight: 'bold', fontSize: '11px', marginBottom: '16px' }}>{actionNotice}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div style={{ border: '1px solid #dce5df', borderRadius: '12px', padding: '16px', background: '#f8faf9' }}>
          <b style={{ display: 'block', marginBottom: '12px', color: '#18241c', fontSize: '11px' }}>Detail Laporan</b>
          <div style={{ display: 'grid', gap: '8px', fontSize: '11px', color: '#455249' }}>
            <div><strong>ID Tiket:</strong> HD-{ticket.id}</div>
            <div><strong>Pelapor:</strong> {ticket.pelapor}</div>
            <div><strong>Lokasi:</strong> {ticket.lokasi}</div>
            <div><strong>Kategori:</strong> {ticket.kategori}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <strong>Prioritas:</strong> {ticket.prioritas} 
              <span className={`priority-dot ${ticket.prioritas?.toLowerCase()}`}></span>
            </div>
            <div><strong>Status:</strong> {ticket.status}</div>
            <div><strong>Tanggal:</strong> {new Date(ticket.created_at).toLocaleString()}</div>
          </div>
        </div>

        <div style={{ border: '1px solid #dce5df', borderRadius: '12px', padding: '16px', background: '#f8faf9' }}>
          <b style={{ display: 'block', marginBottom: '12px', color: '#18241c', fontSize: '11px' }}>Masalah / Deskripsi</b>
          <p style={{ margin: 0, fontSize: '11px', color: '#455249', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{ticket.deskripsi}</p>
        </div>
      </div>

      {isStaff && (
        <div style={{ border: '1px solid #dce5df', borderRadius: '12px', padding: '20px', background: '#fff', display: 'grid', gap: '16px' }}>
          <b style={{ color: '#18241c', fontSize: '12px' }}>Kontrol Teknisi & Admin</b>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <form onSubmit={handleUpdateStatus} style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#455249' }}>Status Tiket</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select name="status" defaultValue={ticket.status} style={{ height: '36px', padding: '0 10px', borderRadius: '7px', border: '1px solid #cfdad2', width: '100%', fontSize: '11px' }}>
                  <option value="NEW">NEW</option>
                  <option value="PROSES">PROSES</option>
                  <option value="PENDING">PENDING</option>
                  <option value="SELESAI">SELESAI</option>
                </select>
                <button type="submit" className="create-ticket" style={{ height: '36px', whiteSpace: 'nowrap' }}>Perbarui</button>
              </div>
            </form>

            <form onSubmit={handleUpdatePriority} style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#455249' }}>Prioritas Tiket</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select name="priority" defaultValue={ticket.prioritas} style={{ height: '36px', padding: '0 10px', borderRadius: '7px', border: '1px solid #cfdad2', width: '100%', fontSize: '11px' }}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
                <button type="submit" className="create-ticket" style={{ height: '36px', whiteSpace: 'nowrap' }}>Perbarui</button>
              </div>
            </form>
          </div>

          <form onSubmit={handleResolve} style={{ display: 'grid', gap: '10px', borderTop: '1px solid #e1e8e3', paddingTop: '16px' }}>
            <b style={{ fontSize: '11px', color: '#18241c' }}>Penyelesaian Tiket</b>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label style={{ fontSize: '11px', color: '#455249', display: 'grid', gap: '4px' }}>
                Tindakan Perbaikan
                <textarea name="tindakan" rows="3" defaultValue={ticket.tindakan || ''} required style={{ width: '100%', padding: '8px', border: '1px solid #cfdad2', borderRadius: '7px', fontSize: '11px' }} placeholder="Tuliskan tindakan..."></textarea>
              </label>
              <label style={{ fontSize: '11px', color: '#455249', display: 'grid', gap: '4px' }}>
                Hasil Akhir
                <textarea name="hasil_akhir" rows="3" defaultValue={ticket.hasil_akhir || ''} required style={{ width: '100%', padding: '8px', border: '1px solid #cfdad2', borderRadius: '7px', fontSize: '11px' }} placeholder="Tuliskan hasil akhir..."></textarea>
              </label>
            </div>
            <button type="submit" className="create-ticket" style={{ width: '100%', height: '36px', marginTop: '4px' }}>Simpan Penyelesaian</button>
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

  const loadTickets = async () => {
    if (!token) return
    try {
      const res = await api('/tickets', { token })
      setTickets(res.data || [])
    } catch (err) {
      onError(err.message)
    }
  }

  useEffect(() => {
    if (!token) {
      onRequireLogin()
    } else {
      loadTickets()
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
          lokasi: form.get('lokasi'),
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
    return t.prioritas?.toLowerCase() === priorityFilter.toLowerCase()
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
            <div key={t.id} className="ticket-card" onClick={() => setSelectedTicketId(t.id)}>
              <div>
                <b>ID Tiket</b>
                <span>HD-{t.id}</span>
              </div>
              <div>
                <b>Judul</b>
                <span>{t.judul}</span>
              </div>
              <div>
                <b>Kategori</b>
                <span>{t.kategori}</span>
              </div>
              <div>
                <b>Prioritas</b>
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  {t.prioritas}
                  <span className={`priority-dot ${t.prioritas?.toLowerCase()}`}></span>
                </span>
              </div>
              <div>
                <b>Status</b>
                <span>{t.status}</span>
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
              <input name="lokasi" required placeholder="Contoh: Ruang Kasir Lt. 2" />
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