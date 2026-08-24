import { useEffect, useState } from 'react'
import { api } from './api.js'

const statuses = [['Total', null], ['Baru', 'NEW'], ['Diproses', 'IN_PROGRESS'], ['Menunggu', 'WAITING'], ['Selesai', 'RESOLVED']]

function Dashboard({ token, user, onTroubleshooting, onTickets, onKnowledge }) {
  const [tickets, setTickets] = useState([])
  const [error, setError] = useState('')
  const isStaff = user.role === 'admin' || user.role === 'teknisi'

  useEffect(() => {
    api('/tickets', { token })
      .then((result) => setTickets(isStaff ? result.data : result.data.filter((ticket) => Number(ticket.akun) === Number(user.id))))
      .catch((err) => setError(err.message))
  }, [token, user.id, isStaff])

  return <section className="dashboard">
    <p className="eyebrow">Dashboard</p><h2>Hai, {user.username}<br />Ada yang bisa kami bantu?</h2>
    {error && <p className="app-notice">{error}</p>}
    <div className="summary" aria-label="Ringkasan tiket">{statuses.map(([label, status]) => <article className="stat" key={label}><small>{label}</small><strong>{status ? tickets.filter((ticket) => ticket.status === status).length : tickets.length}</strong></article>)}</div>
    <p className="eyebrow shortcut-title">Shortcut</p>
    <div className="shortcuts"><button onClick={onTroubleshooting}>Troubleshooting</button><button onClick={onTickets}>Pesan Tiket</button><button onClick={onKnowledge}>Knowledge Base</button></div>
    <p className="shortcut-note">Tekan tombol di atas untuk cari<br />solusi troubleshooting kamu.</p>
    <section className="ticket-panel" aria-labelledby="ticket-title"><h3 id="ticket-title">{isStaff ? 'Seluruh Tiket' : 'Tiket Saya'}</h3>
      <table><thead><tr><th>ID Tiket</th>{isStaff && <th>Pelapor</th>}<th>Perangkat</th><th>Status</th></tr></thead><tbody>
        {(isStaff ? tickets : tickets.slice(0, 3)).map((ticket) => <tr key={ticket.id}><td>HD-{ticket.id}</td>{isStaff && <td>{ticket.pelapor_nama || '-'}</td>}<td>{ticket.nama_kategori}</td><td>{ticket.status}</td></tr>)}
        {!tickets.length && <tr><td colSpan={isStaff ? '4' : '3'}>Belum ada tiket.</td></tr>}
      </tbody></table>
    </section>
  </section>
}

export default Dashboard
