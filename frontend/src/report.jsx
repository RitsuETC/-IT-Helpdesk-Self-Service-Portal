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
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

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
    return new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const statusLabel = { RESOLVED: 'Selesai', CLOSED: 'Ditutup' }
  const statusColor = { RESOLVED: '#dcfce7', CLOSED: '#f1f5f9' }
  const statusTextColor = { RESOLVED: '#15803d', CLOSED: '#475569' }

  const resolvedCount = tickets.filter(t => t.status === 'RESOLVED').length
  const closedCount = tickets.filter(t => t.status === 'CLOSED').length

  return (
    <div className="report-page" style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <style>{`
        /* STYLE KHUSUS HASIL PRINT / CETAK */
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
          }
          .no-print, nav, header, .header, button, .report-filters, .report-summary-cards {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .report-page {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
          }
          .report-table-container {
            overflow: visible !important;
            border: 1px solid #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }
          .report-table {
            width: 100% !important;
            border-collapse: collapse !important;
            font-size: 7.5pt !important;
          }
          .report-table th {
            background-color: #0c4a30 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border: 1px solid #000 !important;
            padding: 5px 6px !important;
            text-align: left !important;
          }
          .report-table td {
            border: 1px solid #666 !important;
            padding: 5px 6px !important;
            color: #000000 !important;
            vertical-align: top !important;
            word-break: break-word !important;
          }
          .action-column {
            display: none !important;
          }
        }

        /* STYLE NORMAL WEBPAGE */
        .print-only {
          display: none;
        }
        .report-table tbody tr:hover {
          background-color: #f8fafc;
        }
      `}</style>

      {/* KOP SURAT PRINT (MUNCUL SAAT CETAK) */}
      <div className="print-only" style={{ marginBottom: '16px' }}>
        <div style={{ textAlign: 'center', borderBottom: '3px double #000', paddingBottom: '8px' }}>
          <h2 style={{ margin: 0, fontSize: '16pt', color: '#000', fontWeight: 'bold' }}>LAPORAN PENYELESAIAN & TROUBLESHOOTING TIKET IT</h2>
          <p style={{ margin: '3px 0 0', fontSize: '9pt', color: '#333' }}>Sistem Informasi IT Helpdesk - Dokumen Laporan Resmi</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8pt', marginTop: '8px', color: '#333' }}>
          <span>Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
          <span>Total Laporan: {tickets.length} Tiket</span>
        </div>
      </div>

      {/* Header Halaman Web */}
      <div className="report-header no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px', background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', padding: '16px 20px', borderRadius: '14px', color: '#ffffff', boxShadow: '0 8px 20px rgba(12, 74, 48, 0.15)' }}>
        <button onClick={onBack} style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
          ← Kembali
        </button>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#ffffff', fontWeight: '700' }}>Laporan Tiket Selesai</h2>
          <p style={{ margin: '2px 0 0', color: '#a7f3d0', fontSize: '0.825rem' }}>Daftar tiket yang telah diselesaikan beserta tindakan perbaikan</p>
        </div>
        {isStaff && (
          <button onClick={handlePrint} style={{ background: '#15803d', color: '#fff', border: 'none', padding: '9px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            🖨️ Print Laporan
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="report-filters no-print" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px', padding: '14px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <input
          type="text"
          placeholder="Cari ID, judul, pelapor, tindakan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', outline: 'none' }}>
          <option value="all">Semua Status</option>
          <option value="RESOLVED">Selesai</option>
          <option value="CLOSED">Ditutup</option>
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', background: '#fff', outline: 'none' }}>
          <option value="all">Semua Kategori</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.nama_kategori}>{cat.nama_kategori}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', outline: 'none' }} />
      </div>

      {/* Ringkasan Kartu Statistik */}
      <div className="report-summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        <div style={{ background: '#ecfdf5', padding: '14px 18px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
          <small style={{ color: '#15803d', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>RESOLVED</small>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: '#166534', marginTop: '2px' }}>{resolvedCount}</strong>
        </div>
        <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <small style={{ color: '#475569', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>CLOSED</small>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: '#1e293b', marginTop: '2px' }}>{closedCount}</strong>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', padding: '14px 18px', borderRadius: '12px', border: '1px solid #064e3b', color: '#fff', boxShadow: '0 4px 12px rgba(12, 74, 48, 0.15)' }}>
          <small style={{ color: '#a7f3d0', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>TOTAL LAPORAN</small>
          <strong style={{ display: 'block', fontSize: '1.6rem', color: '#ffffff', marginTop: '2px' }}>{tickets.length}</strong>
        </div>
      </div>

      {/* Tabel Utama */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '40px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>Memuat laporan...</p>
      ) : (
        <div className="report-table-container" style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <table className="report-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#1f2937' }}>
            <thead>
              <tr style={{ background: '#0c4a30', color: '#ffffff', textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>ID</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', minWidth: '110px' }}>Judul</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Kategori</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Pelapor</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Ruangan</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Teknisi</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', minWidth: '130px' }}>Tindakan</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700', minWidth: '130px' }}>Hasil/Solusi</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: '700' }}>Selesai</th>
                <th className="action-column" style={{ padding: '10px 12px', textAlign: 'center', fontWeight: '700' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>
                    Tidak ada tiket yang sesuai filter.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '9px 12px', fontWeight: '700', color: '#0c4a30', whiteSpace: 'nowrap' }}>HD-{ticket.id}</td>
                    <td style={{ padding: '9px 12px', color: '#1f2937', fontWeight: '600' }}>{ticket.judul}</td>
                    <td style={{ padding: '9px 12px', color: '#4b5563' }}>{ticket.nama_kategori || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#4b5563' }}>{ticket.pelapor_nama || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#4b5563' }}>{ticket.nama_ruangan || '-'}</td>
                    <td style={{ padding: '9px 12px', color: '#4b5563' }}>{ticket.teknisi_nama || '-'}</td>
                    {/* KOLOM BARU: TINDAKAN */}
                    <td style={{ padding: '9px 12px', color: '#334155', fontSize: '0.75rem', lineHeight: '1.3' }}>
                      {ticket.tindakan || '-'}
                    </td>
                    {/* KOLOM BARU: HASIL / SOLUSI */}
                    <td style={{ padding: '9px 12px', color: '#334155', fontSize: '0.75rem', lineHeight: '1.3' }}>
                      {ticket.hasil || '-'}
                    </td>
                    <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        backgroundColor: statusColor[ticket.status] || '#f1f5f9',
                        color: statusTextColor[ticket.status] || '#334155',
                        padding: '3px 8px',
                        borderRadius: '20px',
                        fontSize: '0.68rem',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        {statusLabel[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: '9px 12px', color: '#6b7280', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                      {formatDate(ticket.status === 'RESOLVED' ? ticket.resolved_at : ticket.closed_at)}
                    </td>
                    <td className="action-column" style={{ padding: '9px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <button onClick={() => setSelectedTicket(ticket)} style={{ background: '#0c4a30', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.725rem', fontWeight: '700' }}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail Single Tiket */}
      {selectedTicket && (
        <div className="modal-backdrop no-print" onClick={() => setSelectedTicket(null)} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200, padding: '16px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 700, background: '#fff', borderRadius: 16, padding: 24, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: '#0c4a30', fontSize: '1.1rem', fontWeight: '700' }}>Detail Tiket HD-{selectedTicket.id}</h3>
              <button onClick={() => setSelectedTicket(null)} style={{ background: '#f1f5f9', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold' }}>×</button>
            </div>
            {detailLoading && <p style={{ color: '#64748b' }}>Memuat detail tiket...</p>}
            {detailError && <p style={{ color: '#dc2626', marginBottom: '12px' }}>{detailError}</p>}
            {!detailLoading && !detailError && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', color: '#1f2937' }}>
                <div><b>Judul:</b> {selectedTicket.judul}</div>
                <div><b>Kategori:</b> {selectedTicket.nama_kategori || '-'}</div>
                <div><b>Pelapor:</b> {selectedTicket.pelapor_nama || '-'}</div>
                <div><b>Ruangan:</b> {selectedTicket.nama_ruangan || '-'}</div>
                <div><b>Teknisi:</b> {selectedTicket.teknisi_nama || '-'}</div>
                <div><b>Prioritas:</b> {selectedTicket.prioritas}</div>
                <div><b>Status:</b> {selectedTicket.status}</div>
                <div><b>Dibuat:</b> {formatDate(selectedTicket.created_at)}</div>
                <div><b>Selesai:</b> {formatDate(selectedTicket.status === 'RESOLVED' ? selectedTicket.resolved_at : selectedTicket.closed_at)}</div>
                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '6px' }}>
                  <b>Tindakan Perbaikan:</b> <span style={{ display: 'block', marginTop: '2px', color: '#334155' }}>{selectedTicket.tindakan || '-'}</span>
                </div>
                <div style={{ gridColumn: '1 / -1', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <b>Hasil / Solusi Akhir:</b> <span style={{ display: 'block', marginTop: '2px', color: '#334155' }}>{selectedTicket.hasil || '-'}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}