import { useEffect, useState } from 'react'
import { api } from './api.js'

export default function Report({ token, user, onBack }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [categories, setCategories] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)

  const isStaff = user?.role === 'admin' || user?.role === 'teknisi'

  const loadCategories = async () => {
    try {
      const res = await api('/knowledge/categories', {})
      setCategories(res.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadReport = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (search) params.append('search', search)

      const res = await api(`/tickets/reports/finished-tickets?${params.toString()}`, token ? { token } : {})
      setTickets(res.data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadReport()
  }, [statusFilter, categoryFilter, dateFrom, dateTo, token])

  const handlePrint = async () => {
    if (!isStaff) return
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (categoryFilter !== 'all') params.append('category', categoryFilter)
      if (dateFrom) params.append('date_from', dateFrom)
      if (dateTo) params.append('date_to', dateTo)
      if (search) params.append('search', search)

      await api(`/tickets/reports/print?${params.toString()}`, { token })
      window.print()
    } catch (err) {
      console.error(err)
    }
  }

  const formatDate = (date) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  const statusLabel = { RESOLVED: 'Selesai', CLOSED: 'Ditutup' }
  const statusColor = { RESOLVED: '#dcfce7', CLOSED: '#e2e8f0' }
  const statusTextColor = { RESOLVED: '#166534', CLOSED: '#334155' }

  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length
  const closedCount = tickets.filter(t => t.status === 'CLOSED').length

  return (
    <div className="report-page">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .report-page { padding: 0 !important; margin: 0 !important; }
          .report-header { background: #065f46 !important; color: #fff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-filters { display: none !important; }
          .report-table-container { overflow: visible !important; }
          .report-table { font-size: 10pt !important; }
          .modal-backdrop { display: none !important; }
        }
      `}</style>

      <div className="report-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>‹ Kembali</button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>Laporan Tiket Selesai</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.9rem' }}>Daftar tiket yang telah diselesaikan atau ditutup</p>
        </div>
        {isStaff && (
          <button onClick={handlePrint} style={{ background: '#065f46', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Print Laporan</button>
        )}
      </div>

      <div className="report-filters no-print" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
        <input
          type="text"
          placeholder="Cari ID, judul, pelapor, ruangan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 240px', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}>
          <option value="all">Semua Status</option>
          <option value="RESOLVED">Selesai</option>
          <option value="CLOSED">Ditutup</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem', background: '#fff' }}>
          <option value="all">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#dcfce7', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
          <small style={{ color: '#166534', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>RESOLVED</small>
          <strong style={{ display: 'block', fontSize: '1.75rem', color: '#14532d' }}>{resolvedCount}</strong>
        </div>
        <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <small style={{ color: '#334155', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLOSED</small>
          <strong style={{ display: 'block', fontSize: '1.75rem', color: '#0f172a' }}>{closedCount}</strong>
        </div>
        <div style={{ background: '#065f46', padding: '16px', borderRadius: '12px', border: '1px solid #047857' }}>
          <small style={{ color: '#a7f3d0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL</small>
          <strong style={{ display: 'block', fontSize: '1.75rem', color: '#fff' }}>{tickets.length}</strong>
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Memuat laporan...</p>
      ) : (
        <div className="report-table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff' }}>
          <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID Tiket</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Judul</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kategori</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pelapor</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ruangan</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Teknisi</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prioritas</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tgl Dibuat</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tgl Selesai</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600', color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>
                    Tidak ada tiket yang sesuai filter.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#0f172a' }}>HD-{ticket.id}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ticket.judul}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ticket.nama_kategori || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ticket.pelapor_nama || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ticket.nama_ruangan || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ticket.teknisi_nama || '-'}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{ticket.prioritas}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        backgroundColor: statusColor[ticket.status] || '#f1f5f9',
                        color: statusTextColor[ticket.status] || '#334155',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        {statusLabel[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDate(ticket.created_at)}</td>
                    <td style={{ padding: '12px 16px', color: '#334155' }}>{formatDate(ticket.status === 'RESOLVED' ? ticket.resolved_at : ticket.closed_at)}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <button onClick={() => setSelectedTicket(ticket)} style={{ background: '#065f46', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>Lihat Detail</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: 800, background: '#fff', borderRadius: 12, padding: 20, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>Detail Tiket HD-{selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            {detailLoading && <p style={{ color: '#64748b' }}>Memuat detail tiket...</p>}
            {detailError && <p style={{ color: '#dc2626', marginBottom: '12px' }}>{detailError}</p>}
            {!detailLoading && !detailError && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><b>Judul:</b> {selectedTicket.judul}</div>
                <div><b>Kategori:</b> {selectedTicket.nama_kategori || '-'}</div>
                <div><b>Pelapor:</b> {selectedTicket.pelapor_nama || '-'}</div>
                <div><b>Ruangan:</b> {selectedTicket.nama_ruangan || '-'}</div>
                <div><b>Teknisi:</b> {selectedTicket.teknisi_nama || '-'}</div>
                <div><b>Prioritas:</b> {selectedTicket.prioritas}</div>
                <div><b>Status:</b> {selectedTicket.status}</div>
                <div><b>Dibuat:</b> {formatDate(selectedTicket.created_at)}</div>
                <div><b>Selesai:</b> {formatDate(selectedTicket.status === 'RESOLVED' ? selectedTicket.resolved_at : selectedTicket.closed_at)}</div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <b>Tindakan:</b> {selectedTicket.tindakan || '-'}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <b>Hasil/Solusi:</b> {selectedTicket.hasil || '-'}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}