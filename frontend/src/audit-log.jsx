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
  const [selectedLog, setSelectedLog] = useState(null)
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
                <th style={{ padding: '12px 16px', fontWeight: '700' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Memuat riwayat aktivitas...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="5" style={{ padding: '28px', textAlign: 'center', color: '#64748b' }}>Belum ada aktivitas yang cocok.</td></tr>
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
                    <td style={{ padding: '14px 16px' }}><button type="button" onClick={() => setSelectedLog(item)} style={{ border: '1px solid #86efac', background: '#f0fdf4', color: '#047857', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}>Detail</button></td>
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

      {selectedLog && <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}

    </div>
  )
}

function AuditDetailModal({ log, onClose }) {
  let metadata = log.metadata || {}
  if (typeof metadata === 'string') { 
    try { metadata = JSON.parse(metadata) } catch { metadata = {} } 
  }
  
  const changes = metadata.changes || (
    Object.prototype.hasOwnProperty.call(metadata, 'before') || Object.prototype.hasOwnProperty.call(metadata, 'after') 
      ? { status: { before: metadata.before, after: metadata.after } } 
      : {}
  )
  const submittedData = metadata.request || metadata.data || metadata.deleted || null
  const currentData = log.current_data || null
  const usedItems = Array.isArray(metadata.used_items) ? metadata.used_items : []

  const formatValue = (value, type) => {
    if (value == null || value === '') return <span style={{ fontStyle: 'italic', opacity: 0.6 }}>- Kosong -</span>
    
    let parsedValue = value;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          parsedValue = JSON.parse(trimmed);
        } catch (e) {
          // Abaikan jika gagal parse
        }
      }
    }

    if (typeof parsedValue !== 'object' || parsedValue === null) {
      return <span style={{ wordBreak: 'break-word' }}>{String(parsedValue)}</span>
    }

    // Solusi: Tambahkan 'specifications' ke dalam list ignored agar data yang redundant tidak dirender berulang
    const ignored = new Set(['id', 'created_at', 'updated_at', 'specifications'])
    const entries = Object.entries(parsedValue).filter(([key]) => !ignored.has(key))
    
    if (entries.length === 0) return <span style={{ fontStyle: 'italic', opacity: 0.6 }}>- Kosong -</span>

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12.5px', width: '100%' }}>
        {entries.map(([k, v]) => {
          const isNested = typeof v === 'object' || (typeof v === 'string' && v.includes('{'))
          
          return (
            <div key={k} style={{ 
              display: 'flex', 
              flexDirection: isNested ? 'column' : 'row', 
              gap: isNested ? '4px' : '10px',
              borderBottom: type === 'before' ? '1px solid rgba(254, 202, 202, 0.4)' : '1px solid rgba(187, 247, 208, 0.4)', 
              paddingBottom: '6px',
              paddingTop: '2px'
            }}>
              <span style={{ fontWeight: '700', minWidth: '95px', textTransform: 'capitalize', color: type === 'before' ? '#991b1b' : '#166534', flexShrink: 0 }}>
                {k.replace(/_/g, ' ')}
              </span>
              <div style={{ flex: 1, paddingLeft: isNested ? '12px' : '0', borderLeft: isNested ? (type === 'before' ? '2px solid rgba(254, 202, 202, 0.8)' : '2px solid rgba(187, 247, 208, 0.8)') : 'none' }}>
                {formatValue(v, type)}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1300, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <section onClick={(event) => event.stopPropagation()} style={{ background: '#ffffff', width: 'min(800px, calc(100vw - 32px))', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '32px', position: 'relative', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
        
        <button type="button" onClick={onClose} aria-label="Tutup" style={{ position: 'absolute', top: '24px', right: '24px', border: 'none', background: '#f1f5f9', color: '#64748b', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#e2e8f0'} onMouseLeave={(e) => e.target.style.background = '#f1f5f9'}>✕</button>
        
        <h2 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '1.4rem', fontWeight: '800' }}>Detail Aktivitas</h2>
        <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.95rem', lineHeight: '1.5' }}>{log.detail}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '28px' }}>
          <Info label="Pengguna" value={log.actor_name} />
          <Info label="Waktu" value={formatTime(log.created_at)} />
          <Info label="Jenis Data" value={log.entity_type || '-'} />
          <Info label="ID Referensi" value={log.entity_id || '-'} />
        </div>
        
        <h3 style={{ fontSize: '1.1rem', margin: '0 0 16px', color: '#0f172a', borderBottom: '2px solid #f8fafc', paddingBottom: '10px' }}>Rincian Perubahan</h3>
        
        {Object.keys(changes).length ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13.5px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 12px 8px', textAlign: 'left', color: '#64748b', fontWeight: '700', width: '20%', borderBottom: '2px solid #e2e8f0' }}>Field</th>
                  <th style={{ padding: '0 12px 8px', textAlign: 'left', color: '#64748b', fontWeight: '700', width: '40%', borderBottom: '2px solid #e2e8f0' }}>Sebelumnya</th>
                  <th style={{ padding: '0 12px 8px', textAlign: 'left', color: '#64748b', fontWeight: '700', width: '40%', borderBottom: '2px solid #e2e8f0' }}>Sesudahnya</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(changes).map(([field, value]) => (
                  <tr key={field} style={{ background: '#fffbeb' }}>
                    <td style={{ padding: '12px', fontWeight: '700', color: '#92400e', verticalAlign: 'top', textTransform: 'capitalize' }}>
                      <div>{field.replace(/_/g, ' ')}</div><span style={{ display: 'inline-block', marginTop: '5px', padding: '2px 6px', borderRadius: '999px', background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Diubah</span>
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', padding: '12px 14px', borderRadius: '10px', overflowWrap: 'anywhere', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                        {formatValue(value.before, 'before')}
                      </div>
                    </td>
                    <td style={{ padding: '12px', verticalAlign: 'top' }}>
                      <div style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', padding: '12px 14px', borderRadius: '10px', overflowWrap: 'anywhere', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
                        {formatValue(value.after, 'after')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : !submittedData ? (
          <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
            <p style={{ margin: 0, color: '#64748b' }}>Log ini tidak memiliki rincian spesifik mengenai nilai yang berubah.</p>
          </div>
        ) : null}

        {submittedData && <>
          <h3 style={{ fontSize: '1.1rem', margin: '24px 0 16px', color: '#0f172a', borderBottom: '2px solid #f8fafc', paddingBottom: '10px' }}>Data CRUD</h3>
          <AuditDataTable data={submittedData} formatValue={formatValue} />
        </>}

        {usedItems.length > 0 && <>
          <h3 style={{ fontSize: '1.1rem', margin: '24px 0 12px', color: '#0f172a', borderBottom: '2px solid #f8fafc', paddingBottom: '10px' }}>Item Digunakan</h3>
          <div style={{ display: 'grid', gap: '10px' }}>{usedItems.map((item) => <div key={`${item.type}-${item.id}`} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', gap: '12px', padding: '12px 14px', background: item.type === 'Aset' ? '#eff6ff' : '#f0fdf4', border: `1px solid ${item.type === 'Aset' ? '#bfdbfe' : '#bbf7d0'}`, borderRadius: '10px' }}><span style={{ padding: '4px 8px', borderRadius: '999px', background: item.type === 'Aset' ? '#dbeafe' : '#dcfce7', color: item.type === 'Aset' ? '#1d4ed8' : '#166534', fontSize: '11px', fontWeight: '800' }}>{item.type}</span><div><strong style={{ color: '#0f172a' }}>{item.name}</strong><small style={{ display: 'block', color: '#64748b' }}>ID: {item.id}</small></div><strong style={{ color: '#b45309' }}>× {item.quantity}</strong></div>)}</div>
        </>}

        {currentData && <>
          <h3 style={{ fontSize: '1.1rem', margin: '24px 0 8px', color: '#0f172a', borderBottom: '2px solid #f8fafc', paddingBottom: '10px' }}>Data Inventaris Terkini</h3>
          <p style={{ margin: '0 0 12px', color: '#64748b', fontSize: '12px' }}>Snapshot kondisi data saat ini; dapat berbeda dari nilai pada waktu log dibuat.</p>
          <AuditDataTable data={currentData} formatValue={formatValue} />
        </>}
      </section>
    </div>
  )
}

function AuditDataTable({ data, formatValue }) {
  const entries = Array.isArray(data) ? data.map((value, index) => [`Item ${index + 1}`, value]) : Object.entries(data)
  const labels = { id_asset: 'ID aset', id_sparepart: 'ID sparepart', id_user: 'ID pengguna', id_pic: 'PIC', from_location: 'Lokasi asal', to_location: 'Lokasi tujuan', movement_type: 'Jenis pergerakan', movement_date: 'Tanggal pergerakan', asset_quantity: 'Jumlah aset', sparepart_quantity: 'Jumlah sparepart', created_at: 'Dibuat pada', updated_at: 'Diperbarui pada', purchase_year: 'Tanggal pembelian', default_price: 'Harga default', min_stock: 'Stok minimum', stock: 'Stok' }
  const conditions = { good: 'Baik', fair: 'Cukup', broken: 'Rusak' }
  const formatCurrentValue = (field, value) => {
    if (value == null || value === '') return '—'
    if (field === 'condition') return conditions[value] || value
    if (field === 'id_pic') return `PIC #${value}`
    if (field.endsWith('_date') || ['created_at', 'updated_at', 'purchase_year'].includes(field)) {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? String(value) : formatTime(value)
    }
    return formatValue(value, 'after')
  }
  return <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}><tbody>{entries.map(([field, value]) => <tr key={field} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '11px 12px', width: '32%', fontWeight: '700', color: '#334155', verticalAlign: 'top' }}>{labels[field] || field.replace(/_/g, ' ')}</td><td style={{ padding: '11px 12px', color: '#334155', overflowWrap: 'anywhere' }}>{formatCurrentValue(field, value)}</td></tr>)}</tbody></table></div>
}
function Info({ label, value }) { 
  return (
    <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px 16px', border: '1px solid #e2e8f0' }}>
      <small style={{ display: 'block', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '800', marginBottom: '6px' }}>{label}</small>
      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{value}</strong>
    </div>
  ) 
}
