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

  return (
    <div style={{ width: '100%', fontFamily: 'Inter, system-ui, sans-serif', paddingBottom: '40px' }}>
      {/* Header Card dengan Gradasi Hijau Tua Mewah */}
      <div 
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #047857 100%)',
          color: '#ffffff',
          borderRadius: '20px',
          padding: '24px 28px',
          boxShadow: '0 20px 35px -10px rgba(2, 44, 34, 0.45), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(167, 243, 208, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px'
        }}
      >
        {/* Efek Glow Dekoratif */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
          <div>
            <button 
              onClick={onBack}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a7f3d0',
                padding: 0,
                fontSize: '0.875rem',
                fontWeight: '700',
                cursor: 'pointer',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← Kembali
            </button>
            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', color: '#ffffff' }}>Log Aktivitas</h2>
            <p style={{ margin: '6px 0 0 0', color: '#a7f3d0', fontSize: '0.95rem' }}>Riwayat tindakan penting pada tiket dan inventaris.</p>
          </div>

          <button 
            onClick={load} 
            disabled={loading}
            style={{
              backgroundColor: '#ffffff',
              color: '#022c22',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '999px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
          >
            <span>{loading ? 'Memuat...' : '↻ Muat ulang'}</span>
          </button>
        </div>

        {/* Filter / Search Bar di dalam Header */}
        <div style={{ zIndex: 1, display: 'flex', gap: '12px' }}>
          <input 
            value={search} 
            onChange={(event) => setSearch(event.target.value)} 
            placeholder="Cari pengguna, aksi, atau detail..." 
            style={{
              flex: 1,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(167, 243, 208, 0.3)',
              borderRadius: '12px',
              padding: '12px 16px',
              color: '#ffffff',
              fontSize: '0.9rem',
              outline: 'none',
              backdropFilter: 'blur(4px)'
            }}
          />
        </div>
      </div>

      {/* Kartu Ringkasan Total Aktivitas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#047857', marginBottom: '8px' }}>Total Aktivitas Ditampilkan</div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#022c22' }}>{visible.length}</div>
        </div>
      </div>

      {/* Tabel Konten Utama */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #bbf7d0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(6, 78, 59, 0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#022c22' }}>Audit Trail</h3>
          <span style={{ fontSize: '0.85rem', color: '#047857', fontWeight: '700' }}>{visible.length} item</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f0fdf4', color: '#064e3b', borderBottom: '1px solid #bbf7d0', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 20px', fontWeight: '800' }}>Pengguna</th>
                <th style={{ padding: '14px 20px', fontWeight: '800' }}>Aksi</th>
                <th style={{ padding: '14px 20px', fontWeight: '800' }}>Detail</th>
                <th style={{ padding: '14px 20px', fontWeight: '800' }}>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Memuat riwayat aktivitas...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="4" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>Belum ada aktivitas yang cocok.</td></tr>
              ) : (
                visible.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}>
                    <td style={{ padding: '16px 20px', color: '#0f172a' }}>
                      <strong style={{ fontWeight: '800', color: '#064e3b' }}>{item.actor_name}</strong>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <code style={{ color: '#047857', fontSize: '12px', fontWeight: '700', background: '#f0fdf4', padding: '3px 8px', borderRadius: '6px', border: '1px solid #bbf7d0' }}>{item.action}</code>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{actionLabels[item.action] || 'Aktivitas sistem'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', color: '#334155', fontWeight: '500' }}>{item.detail}</td>
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', color: '#64748b', fontSize: '0.8rem' }}>{formatTime(item.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}