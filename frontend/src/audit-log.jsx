import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

const actionLabels = {
  CREATE_TICKET: 'Buat tiket', UPDATE_STATUS_TICKET: 'Status tiket', UPDATE_PRIORITY_TICKET: 'Prioritas tiket',
  ASSIGN_TICKET: 'Penugasan tiket', RESOLVE_TICKET: 'Selesaikan tiket', CLOSE_TICKET: 'Tutup tiket', DELETE_TICKET: 'Hapus tiket',
  CREATE_ASSET: 'Tambah aset', UPDATE_ASSET: 'Ubah aset', DELETE_ASSET: 'Hapus aset', TRANSFER_ASSET: 'Transfer aset',
  CREATE_SPAREPART: 'Tambah sparepart', UPDATE_SPAREPART: 'Ubah sparepart', DELETE_SPAREPART: 'Hapus sparepart', UPDATE_STOCK_SPAREPART: 'Stok sparepart',
}

function formatTime(value) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

export default function AuditLog({ token, onBack, onError }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const result = await api('/audit-logs?limit=300', { token })
      setLogs(result.data || [])
    } catch (error) { onError(error.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [token])
  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return logs
    return logs.filter((item) => [item.actor_name, item.action, item.detail].some((value) => String(value || '').toLowerCase().includes(term)))
  }, [logs, search])

  return <section className="inventory-page">
    <div className="inventory-heading">
      <div><button className="text-button" onClick={onBack}>← Kembali</button><h2>Log Aktivitas</h2><p>Riwayat tindakan penting pada tiket dan inventaris.</p></div>
      <button className="secondary-button" onClick={load} disabled={loading}>{loading ? 'Memuat...' : '↻ Muat ulang'}</button>
    </div>
    <section className="inventory-section">
      <div className="inventory-section-title"><div><h3>Audit Trail</h3><span>{visible.length} aktivitas</span></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari pengguna, aksi, atau detail..." /></div>
      <div style={{ overflowX: 'auto' }}>
        <table className="inventory-table">
          <thead><tr><th>Pengguna</th><th>Aksi</th><th>Detail</th><th>Waktu</th></tr></thead>
          <tbody>{loading ? <tr><td colSpan="4">Memuat riwayat aktivitas...</td></tr> : visible.length === 0 ? <tr><td colSpan="4">Belum ada aktivitas yang cocok.</td></tr> : visible.map((item) => <tr key={item.id}>
            <td><strong>{item.actor_name}</strong></td>
            <td><code style={{ color: '#047857', fontSize: '12px' }}>{item.action}</code><br /><small>{actionLabels[item.action] || 'Aktivitas sistem'}</small></td>
            <td>{item.detail}</td>
            <td style={{ whiteSpace: 'nowrap' }}>{formatTime(item.created_at)}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  </section>
}
