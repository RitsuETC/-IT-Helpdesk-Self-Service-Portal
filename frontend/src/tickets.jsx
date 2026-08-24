import { useEffect, useState } from 'react'
import { api } from './api.js'

const priorityClass = (value) => ({ level_1: 'critical', level_2: 'high', level_3: 'medium' }[String(value).toLowerCase()] || 'medium')

function TicketCard({ ticket, onClick, showReporter }) {
  return <button className="ticket-card" onClick={() => onClick(ticket)}>
    <div><b>ID Tiket</b><span>HD-{ticket.id}</span></div><div><b>Judul</b><span>{ticket.judul}</span></div>
    <div><b>Ruangan</b><span>{ticket.nama_ruangan}</span></div><div><b>Masalah</b><span>{ticket.deskripsi}</span></div>
    {showReporter && <div><b>Pelapor</b><span>{ticket.pelapor_nama || '-'}</span></div>}
    <div><b>Prioritas</b><span className={`priority-dot ${priorityClass(ticket.prioritas)}`} aria-label={ticket.prioritas} /></div><div><b>Status</b><span>{ticket.status}</span></div>
  </button>
}

function Tickets({ token, user, onError }) {
  const [priority, setPriority] = useState('all')
  const [tickets, setTickets] = useState([])
  const [options, setOptions] = useState({ categories: [], rooms: [], priorities: [] })
  const [showForm, setShowForm] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState(null)
  const isStaff = user.role === 'admin' || user.role === 'teknisi'

  const loadTickets = async () => {
    try { setTickets((await api('/tickets', { token })).data) } catch (error) { onError(error.message) }
  }
  useEffect(() => { loadTickets(); api('/tickets/meta/options', { token }).then((result) => setOptions(result.data)).catch((error) => onError(error.message)) }, [token])

  const createTicket = async (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    try {
      await api('/tickets', { token, method: 'POST', body: { judul: form.get('title'), kategori: Number(form.get('category')), ruangan: Number(form.get('room')), prioritas: form.get('prioritas'), deskripsi: form.get('description') } })
      setShowForm(false); await loadTickets()
    } catch (error) { onError(error.message) }
  }

  if (selectedTicket) return <TicketDetail token={token} user={user} ticket={selectedTicket} onBack={() => setSelectedTicket(null)} onError={onError} />
  const criticalTickets = tickets.filter((ticket) => priorityClass(ticket.prioritas) === 'critical')
  const visibleTickets = priority === 'all' ? tickets.filter((ticket) => priorityClass(ticket.prioritas) !== 'critical') : tickets.filter((ticket) => ticket.prioritas === priority)

  return <section className="tickets-page"><h2 className="tickets-heading">{isStaff ? 'Kelola Semua Tiket' : 'Tiket Saya'}</h2><div className="tickets-toolbar"><section className="critical-section"><b className="critical-label">Tiket Critical</b><div className="critical-tickets-list">{criticalTickets.length ? criticalTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} showReporter={isStaff} onClick={setSelectedTicket} />) : <p>Tidak ada tiket critical saat ini.</p>}</div></section><button className="create-ticket" onClick={() => setShowForm(true)}>Pesan</button></div>
    <label className="priority-filter">Prioritas<select value={priority} onChange={(event) => setPriority(event.target.value)}><option value="all">Semua</option>{options.priorities.filter((item) => priorityClass(item.level) !== 'critical').map((item) => <option key={item.level} value={item.level}>{item.level}</option>)}</select></label>
    <div className="ticket-grid">{visibleTickets.length ? visibleTickets.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} showReporter={isStaff} onClick={setSelectedTicket} />) : <p className="empty-tickets">Belum ada tiket.</p>}</div>
    {showForm && <div className="modal-backdrop"><form className="ticket-form" onSubmit={createTicket}><button className="close-ticket-form" type="button" onClick={() => setShowForm(false)} aria-label="Tutup form">×</button><h2>Buat Tiket</h2>
      <label>Judul<input name="title" required /></label><label>Kategori<select name="category" required defaultValue=""><option value="" disabled>Pilih kategori</option>{options.categories.map((item) => <option key={item.id} value={item.id}>{item.nama_kategori}</option>)}</select></label>
      <label>Ruangan<select name="room" required defaultValue=""><option value="" disabled>Pilih ruangan</option>{options.rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</select></label><label>Deskripsi<textarea name="description" required /></label>
      <fieldset className="ticket-priority-options"><legend>Prioritas</legend>{options.priorities.length ? options.priorities.map((item) => { const className = priorityClass(item.level); const label = { critical: 'Critical — Level 1', high: 'High — Level 2', medium: 'Medium — Level 3' }[className]; return <label className={className} key={item.level}><input name="prioritas" type="radio" value={item.level} required /><span />{label}</label> }) : <p className="empty-priority">Level prioritas belum tersedia dari database.</p>}</fieldset><button type="submit" disabled={!options.priorities.length}>Kirim</button>
    </form></div>}
  </section>
}

function TicketDetail({ token, user, ticket, onBack, onError }) {
  const [troubleshooting, setTroubleshooting] = useState(null)
  const [form, setForm] = useState({ tindakan: '', hasil: '' })
  const isAdmin = user.role === 'admin'
  const assignedTechnician = user.role === 'teknisi' && Number(ticket.teknisi) === Number(user.id)
  const canManage = isAdmin || assignedTechnician

  const loadTroubleshooting = async () => {
    try {
      const result = await api(`/troubleshooting/${ticket.id}`, { token })
      const latest = result.data.at(-1) || null
      setTroubleshooting(latest)
      setForm({ tindakan: latest?.tindakan || '', hasil: latest?.hasil || ticket.solusi || '' })
    } catch (error) {
      if (canManage || user.role === 'user') onError(error.message)
    }
  }
  useEffect(() => { loadTroubleshooting() }, [ticket.id, token])

  const saveTroubleshooting = async (event) => {
    event.preventDefault()
    try {
      await api(troubleshooting ? `/troubleshooting/${troubleshooting.id}` : '/troubleshooting', {
        token,
        method: troubleshooting ? 'PATCH' : 'POST',
        body: troubleshooting ? { tindakan: form.tindakan, hasil: form.hasil } : { id_tiket: ticket.id, tindakan: form.tindakan, hasil: form.hasil },
      })
      await loadTroubleshooting()
    } catch (error) { onError(error.message) }
  }

  return <section className="ticket-detail"><header className="detail-header"><button onClick={onBack} aria-label="Kembali">‹</button><h2>Detail Tiket</h2></header><h3>{ticket.judul}</h3>
    <dl><dt>ID Tiket</dt><dd>HD-{ticket.id}</dd>{(isAdmin || user.role === 'teknisi') && <><dt>Pelapor</dt><dd>{ticket.pelapor_nama || '-'}</dd></>}<dt>Ruangan</dt><dd>{ticket.nama_ruangan}</dd><dt>Masalah</dt><dd>{ticket.deskripsi}</dd><dt>Prioritas</dt><dd><span className={`priority-dot ${priorityClass(ticket.prioritas)}`} /></dd><dt>Status</dt><dd>{ticket.status}</dd></dl>
    {canManage ? <form className="staff-ticket-form" onSubmit={saveTroubleshooting}><label>Tindakan<textarea value={form.tindakan} onChange={(event) => setForm({ ...form, tindakan: event.target.value })} required /></label><label>Hasil<textarea value={form.hasil} onChange={(event) => setForm({ ...form, hasil: event.target.value })} required /></label><button className="save-ticket">{troubleshooting ? 'Perbarui' : 'Simpan'}</button></form> : <><label>Tindakan<textarea value={troubleshooting?.tindakan || ''} readOnly /></label><label>Hasil<textarea value={troubleshooting?.hasil || ticket.solusi || ''} readOnly /></label>{user.role === 'teknisi' && <p className="ticket-access-note">Tindakan hanya dapat diisi pada tiket yang ditugaskan kepada Anda.</p>}</>}
  </section>
}

export default Tickets
