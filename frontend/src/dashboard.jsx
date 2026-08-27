import { useEffect, useState } from 'react'
import { api } from './api.js'

const statuses = [['Total', null], ['Baru', 'NEW'], ['Diproses', 'IN_PROGRESS'], ['Menunggu', 'WAITING'], ['Selesai', 'RESOLVED']]

function Dashboard({ token, user, onTroubleshooting, onTickets, onKnowledge }) {
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const [ticketIndex, setTicketIndex] = useState(0)
  const isStaff = (user && (user.role === 'admin' || user.role === 'teknisi'))

  useEffect(() => {
    api('/tickets', { token })
      .then((result) => setTickets(result.data))
      .catch((err) => setError(err.message))
  }, [token, user && user.id, isStaff])

  useEffect(() => { if (ticketIndex >= tickets.length) setTicketIndex(0) }, [ticketIndex, tickets.length])
  const currentTicket = tickets[ticketIndex]
  const changeTicket = (direction) => setTicketIndex((index) => (index + direction + tickets.length) % tickets.length)

  const visibleTickets = tickets.filter((t) => !['RESOLVED', 'CLOSED'].includes(t.status))

  return <section className="dashboard">
    <p className="eyebrow">Dashboard</p><h2>Hai, {user && user.username ? user.username : 'Pengguna'}<br />Ada yang bisa kami bantu?</h2>
    {error && <p className="app-notice">{error}</p>}
    <div className="summary" aria-label="Ringkasan tiket">{statuses.map(([label, status]) => <article className="stat" key={label}><small>{label}</small><strong>{status ? tickets.filter((ticket) => ticket.status === status).length : tickets.length}</strong></article>)}</div>
    <p className="eyebrow shortcut-title">Shortcut</p>
    <div className="shortcuts"><button onClick={onTroubleshooting}>Troubleshooting</button><button onClick={onTickets}>Pesan Tiket</button><button onClick={onKnowledge}>Knowledge Base</button></div>
    <p className="shortcut-note">Tekan tombol di atas untuk cari<br />solusi troubleshooting kamu.</p>
    <section className="ticket-panel" aria-labelledby="ticket-title"><div className="ticket-panel-title"><h3 id="ticket-title">{isStaff ? 'Seluruh Tiket' : 'Tiket Saya'}</h3>{visibleTickets.length > 1 && <div className="ticket-slider-controls"><button onClick={() => changeTicket(-1)} aria-label="Tiket sebelumnya">‹</button><span>{ticketIndex + 1}/{visibleTickets.length}</span><button onClick={() => changeTicket(1)} aria-label="Tiket berikutnya">›</button></div>}</div>
      <div className={`dashboard-ticket ${isStaff ? 'staff-ticket' : ''}`}>
        <div className="dashboard-ticket-head"><span>ID Tiket</span>{isStaff && <span>Pelapor</span>}<span>Perangkat</span><span>Status</span></div>
        { visibleTickets.length > 0 ? (() => {
          const list = visibleTickets
          const t = list[ticketIndex % list.length]
            return <div className="ticket-slide" key={t.id}><span>HD-{t.id}</span>{isStaff && <span>{t.pelapor_nama || '-'}</span>}<span>{t.nama_kategori || '-'}</span><span>{t.status || '-'}</span></div>
          })() : <p>Belum ada tiket.</p> }
      </div>
    </section>
  </section>
}

export default Dashboard
