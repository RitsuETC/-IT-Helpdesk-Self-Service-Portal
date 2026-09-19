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
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

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

  const totalPages = Math.ceil(visible.length / ITEMS_PER_PAGE) || 1
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return visible.slice(start, start + ITEMS_PER_PAGE)
  }, [visible, currentPage])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setCurrentPage(newPage)
  }

  return (
    /* Menggunakan padding horizontal dan maxWidth agar tersusun rapi di tengah seperti halaman Laporan */
    <div style={{ maxWidth: '1400px', margin: '24px auto', padding: '0 24px', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: '40px' }}>
      
      {/* 1. HEADER UTAMA */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
          color: '#ffffff',
          borderRadius: '12px',
          padding: '20px 24px',
          boxShadow: '0 4px 15px -3px rgba(2, 44, 34, 0.25)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}
      >
        <div>
          <button 
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#a7f3d0',
              padding: 0,
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ← Kembali
          </button>
          <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.01em', color: '#ffffff' }}>
            Log Aktivitas Sistem
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#a7f3d0', fontSize: '0.85rem' }}>
            Daftar riwayat tindakan penting dan audit trail pada tiket serta inventaris.
          </p>
        </div>

        <button 
          onClick={load} 
          disabled={loading}
          style={{
            backgroundColor: '#ffffff',
            color: '#022c22',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontWeight: '700',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            opacity: loading ? 0.7 : 1
          }}
        >
          <span>{loading ? 'Memuat...' : '↻ Muat ulang'}</span>
        </button>
      </div>

      {/* 2. BARIS PENCARIAN */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <input 
          value={search} 
          onChange={(event) => {
            setSearch(event.target.value)
            setCurrentPage(1)
          }} 
          placeholder="Cari ID, pengguna, aksi, atau detail..." 
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#0f172a',
            fontSize: '0.85rem',
            outline: 'none',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
          }}
        />
      </div>

      {/* 3. KARTU RINGKASAN STATISTIK */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', marginBottom: '6px' }}>Total Tercatat</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#022c22' }}>{logs.length}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', marginBottom: '6px' }}>Hasil Pencarian</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#022c22' }}>{visible.length}</div>
        </div>
        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '16px 18px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', marginBottom: '6px' }}>Status Sistem</div>
          <div style={{ fontSize: '1rem', fontWeight: '800', color: '#059669', paddingTop: '4px' }}>Aktif & Normal</div>
        </div>
      </div>

      {/* 4. TABEL UTAMA */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.03)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#064e3b', color: '#ffffff', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Pengguna</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Aksi</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Detail</th>
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Memuat riwayat aktivitas...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Belum ada aktivitas yang cocok.</td></tr>
              ) : (
                paginatedLogs.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '14px 16px', color: '#0f172a' }}>
                      <strong style={{ fontWeight: '700', color: '#064e3b' }}>{item.actor_name}</strong>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <code style={{ color: '#047857', fontSize: '11px', fontWeight: '700', background: '#f0fdf4', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>{item.action}</code>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>{actionLabels[item.action] || 'Aktivitas sistem'}</div>
                    </td>
                    <td style={{ padding: '14px 16px', color: '#334155', fontWeight: '500' }}>{item.detail}</td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.75rem' }}>{formatTime(item.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              «
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              ‹
            </button>
            <span style={{ fontSize: '13px', color: '#475569', fontWeight: '600', padding: '0 8px' }}>
              Halaman {currentPage} dari {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              ›
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              »
            </button>
          </div>
        )}
      </div>

    </div>
  )
}