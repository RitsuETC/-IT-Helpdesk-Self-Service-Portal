import { useEffect, useState, useMemo } from 'react'
import { api } from './api.js'
import TicketCharts from './chart.jsx'

export default function Report({ token, user, onBack, onError }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [categories, setCategories] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)

  const ITEMS_PER_PAGE = 15

  const isStaff = user?.role === 'admin' || user?.role === 'teknisi'

  /* =========================================================
     CONFIG
  ========================================================= */

  const statusConfig = {
    RESOLVED: {
      label: 'Selesai',
      bg: '#ecfdf5',
      color: '#047857',
      border: '#a7f3d0'
    },
    CLOSED: {
      label: 'Ditutup',
      bg: '#f8fafc',
      color: '#475569',
      border: '#cbd5e1'
    }
  }

  const priorityConfig = {
    level_1: {
      label: 'Rendah',
      bg: '#eff6ff',
      color: '#2563eb',
      border: '#bfdbfe'
    },
    level_2: {
      label: 'Sedang',
      bg: '#fffbeb',
      color: '#d97706',
      border: '#fde68a'
    },
    level_3: {
      label: 'Tinggi',
      bg: '#fef2f2',
      color: '#dc2626',
      border: '#fecaca'
    }
  }

  /* =========================================================
     LOAD DATA
  ========================================================= */

  const loadCategories = async () => {
    try {
      const res = await api('/knowledge/categories', {})
      setCategories(res.data || [])
    } catch (err) {
      console.error('Gagal memuat kategori:', err)
    }
  }

  const loadReport = async () => {
    setLoading(true)

    try {
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      if (dateFrom) {
        params.append('date_from', dateFrom)
      }

      if (dateTo) {
        params.append('date_to', dateTo)
      }

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const query = params.toString()

      const res = await api(
        `/tickets/reports/finished-tickets${query ? `?${query}` : ''}`,
        token ? { token } : {}
      )

      setTickets(res.data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error('Gagal memuat laporan:', err)

      if (onError) {
        onError(err?.message || 'Gagal memuat laporan tiket.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReport()
    }, 300)

    return () => clearTimeout(timer)
  }, [
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    search,
    token
  ])

  /* =========================================================
     PRINT
  ========================================================= */

  const handlePrint = async () => {
    if (!isStaff) return

    try {
      const params = new URLSearchParams()

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      if (categoryFilter !== 'all') {
        params.append('category', categoryFilter)
      }

      if (dateFrom) {
        params.append('date_from', dateFrom)
      }

      if (dateTo) {
        params.append('date_to', dateTo)
      }

      if (search.trim()) {
        params.append('search', search.trim())
      }

      await api(
        `/tickets/reports/print?${params.toString()}`,
        { token }
      )

      window.print()
    } catch (err) {
      console.error('Gagal mencetak laporan:', err)

      if (onError) {
        onError(err?.message || 'Gagal mencetak laporan.')
      }
    }
  }

  /* =========================================================
     HELPERS
  ========================================================= */

  const formatDateTime = (date) => {
    if (!date) return '-'

    const d = new Date(date)

    if (Number.isNaN(d.getTime())) {
      return '-'
    }

    const tgl = d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })

    const jam = d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    })

    return `${tgl} ${jam}`
  }

  const getFinishedDate = (ticket) => {
    if (ticket.status === 'RESOLVED') {
      return ticket.resolved_at
    }

    return ticket.closed_at
  }

  const getStatusConfig = (status) => {
    return (
      statusConfig[status] || {
        label: status || '-',
        bg: '#f8fafc',
        color: '#475569',
        border: '#e2e8f0'
      }
    )
  }

  const getPriorityConfig = (priority) => {
    return (
      priorityConfig[priority] || {
        label: priority || '-',
        bg: '#f8fafc',
        color: '#475569',
        border: '#e2e8f0'
      }
    )
  }

  /* =========================================================
     BADGES
  ========================================================= */

  const StatusBadge = ({ status }) => {
    const config = getStatusConfig(status)

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          borderRadius: '999px',
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          fontSize: '0.7rem',
          fontWeight: '700',
          whiteSpace: 'nowrap'
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: config.color
          }}
        />

        {config.label}
      </span>
    )
  }

  const PriorityBadge = ({ priority }) => {
    const config = getPriorityConfig(priority)

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          padding: '5px 10px',
          borderRadius: '999px',
          background: config.bg,
          color: config.color,
          border: `1px solid ${config.border}`,
          fontSize: '0.7rem',
          fontWeight: '700',
          whiteSpace: 'nowrap'
        }}
      >
        {config.label}
      </span>
    )
  }

  /* =========================================================
     STATISTICS
  ========================================================= */

  const resolvedCount = tickets.filter(
    (t) => t.status === 'RESOLVED'
  ).length

  const closedCount = tickets.filter(
    (t) => t.status === 'CLOSED'
  ).length

  /* =========================================================
     PAGINATION
  ========================================================= */

  const totalPages =
    Math.ceil(tickets.length / ITEMS_PER_PAGE) || 1

  const paginatedTickets = useMemo(() => {
    const start =
      (currentPage - 1) * ITEMS_PER_PAGE

    return tickets.slice(
      start,
      start + ITEMS_PER_PAGE
    )
  }, [tickets, currentPage])

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= totalPages
    ) {
      setCurrentPage(newPage)
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className="report-page"
      style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '18px'
      }}
    >

      <style>{`

        /* =====================================================
           GLOBAL REPORT
        ===================================================== */

        .report-page {
          color: #0f172a;
        }

        .report-page input,
        .report-page select,
        .report-page button {
          font-family: inherit;
        }

        .report-page input,
        .report-page select {
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease,
            background 0.15s ease;
        }

        .report-page input:focus,
        .report-page select:focus {
          border-color: #0c4a30 !important;
          box-shadow:
            0 0 0 3px rgba(12, 74, 48, 0.08);
        }

        .report-table tbody tr {
          transition:
            background-color 0.15s ease;
        }

        .report-table tbody tr:hover {
          background: #f8fafc;
        }

        .report-table td {
          vertical-align: middle;
        }

        .report-table th {
          white-space: nowrap;
        }

        /* =====================================================
           PRINT
        ===================================================== */

        .print-only {
          display: none;
        }

        @media print {

          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, sans-serif !important;
          }

          .no-print,
          nav,
          header,
          .header,
          button,
          .report-filters,
          .report-summary-cards {
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
            font-size: 7pt !important;
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

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 700px) {

          .report-page {
            padding: 10px !important;
          }

          .report-header {
            flex-direction: column !important;
            align-items: stretch !important;
            text-align: center !important;
          }

          .report-header button {
            width: 100%;
          }

          .report-summary-cards {
            grid-template-columns: 1fr !important;
          }

          .detail-info-grid {
            grid-template-columns: 1fr !important;
          }

          .detail-modal {
            max-height: 94vh !important;
            border-radius: 16px !important;
          }
        }

      `}</style>

      {/* =====================================================
          PRINT HEADER
      ===================================================== */}

      <div
        className="print-only"
        style={{
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            borderBottom: '3px double #000',
            paddingBottom: '8px'
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '16pt',
              color: '#000',
              fontWeight: 'bold'
            }}
          >
            LAPORAN PENYELESAIAN & TROUBLESHOOTING TIKET IT
          </h2>

          <p
            style={{
              margin: '3px 0 0',
              fontSize: '9pt',
              color: '#333'
            }}
          >
            Sistem Informasi IT Helpdesk - Dokumen Laporan Resmi
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '8pt',
            marginTop: '8px',
            color: '#333'
          }}
        >
          <span>
            Tanggal Cetak:{' '}
            {new Date().toLocaleDateString(
              'id-ID',
              {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              }
            )}
          </span>

          <span>
            Total Laporan: {tickets.length} Tiket
          </span>
        </div>
      </div>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="report-header no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          flexWrap: 'wrap',
          gap: '12px',
          background:
            'linear-gradient(135deg, #0c4a30 0%, #075e48 100%)',
          padding: '18px 20px',
          borderRadius: '16px',
          color: '#ffffff',
          boxShadow:
            '0 8px 24px rgba(12, 74, 48, 0.16)'
        }}
      >

        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            border:
              '1px solid rgba(255,255,255,0.18)',
            padding: '9px 15px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '0.75rem'
          }}
        >
          ← Kembali
        </button>

        <div
          style={{
            textAlign: 'center',
            flex: 1
          }}
        >
          <div
            style={{
              fontSize: '0.68rem',
              color: '#a7f3d0',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '4px'
            }}
          >
            IT Helpdesk
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: '1.35rem',
              color: '#ffffff',
              fontWeight: '800'
            }}
          >
            Laporan Tiket Selesai
          </h2>

          <p
            style={{
              margin: '3px 0 0',
              color: '#d1fae5',
              fontSize: '0.78rem'
            }}
          >
            Daftar tiket yang telah diselesaikan
            beserta tindakan perbaikan
          </p>
        </div>

        {isStaff && (
          <button
            onClick={handlePrint}
            style={{
              background: '#ffffff',
              color: '#0c4a30',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '9px',
              cursor: 'pointer',
              fontWeight: '800',
              fontSize: '0.75rem',
              boxShadow:
                '0 4px 12px rgba(0,0,0,0.12)'
            }}
          >
            Print Laporan
          </button>
        )}

      </div>

      {/* =====================================================
          FILTER
      ===================================================== */}

      <div
        className="report-filters no-print"
        style={{
          padding: '18px',
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow:
            '0 3px 12px rgba(15,23,42,0.04)',
          marginBottom: '18px'
        }}
      >

        <div
          style={{
            marginBottom: '12px'
          }}
        >
          <div
            style={{
              fontSize: '0.82rem',
              fontWeight: '800',
              color: '#0f172a'
            }}
          >
            Filter Laporan
          </div>

          <div
            style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              marginTop: '3px'
            }}
          >
            Gunakan filter untuk menemukan tiket
            yang dibutuhkan
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap'
          }}
        >

          <div
            style={{
              position: 'relative',
              flex: '1 1 220px'
            }}
          >
            <input
              type="text"
              placeholder="Cari ID, judul, pelapor, tindakan..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '9px 12px',
                borderRadius: '9px',
                border:
                  '1px solid #cbd5e1',
                fontSize: '0.78rem',
                outline: 'none',
                color: '#0f172a',
                background: '#fff'
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
            style={{
              padding: '9px 12px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '0.78rem',
              background: '#fff',
              outline: 'none',
              color: '#334155'
            }}
          >
            <option value="all">
              Semua Status
            </option>

            <option value="RESOLVED">
              Selesai
            </option>

            <option value="CLOSED">
              Ditutup
            </option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            style={{
              padding: '9px 12px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '0.78rem',
              background: '#fff',
              outline: 'none',
              color: '#334155'
            }}
          >
            <option value="all">
              Semua Kategori
            </option>

            {categories.map((cat) => (
              <option
                key={cat.id}
                value={cat.nama_kategori}
              >
                {cat.nama_kategori}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) =>
              setDateFrom(e.target.value)
            }
            style={{
              padding: '9px 10px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '0.78rem',
              outline: 'none',
              color: '#334155'
            }}
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) =>
              setDateTo(e.target.value)
            }
            style={{
              padding: '9px 10px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '0.78rem',
              outline: 'none',
              color: '#334155'
            }}
          />

        </div>
      </div>

      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <div
        className="report-summary-cards no-print"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '18px'
        }}
      >

        {/* RESOLVED */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px 18px',
            borderRadius: '14px',
            border:
              '1px solid #d1fae5',
            boxShadow:
              '0 3px 10px rgba(15,23,42,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: '#10b981'
            }}
          />

          <small
            style={{
              color: '#047857',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.68rem'
            }}
          >
            Tiket Selesai
          </small>

          <strong
            style={{
              display: 'block',
              fontSize: '1.7rem',
              color: '#065f46',
              marginTop: '4px',
              lineHeight: 1
            }}
          >
            {resolvedCount}
          </strong>

          <span
            style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '0.7rem',
              color: '#94a3b8'
            }}
          >
            Status RESOLVED
          </span>
        </div>

        {/* CLOSED */}
        <div
          style={{
            background: '#ffffff',
            padding: '16px 18px',
            borderRadius: '14px',
            border:
              '1px solid #e2e8f0',
            boxShadow:
              '0 3px 10px rgba(15,23,42,0.03)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '4px',
              background: '#64748b'
            }}
          />

          <small
            style={{
              color: '#475569',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.68rem'
            }}
          >
            Tiket Ditutup
          </small>

          <strong
            style={{
              display: 'block',
              fontSize: '1.7rem',
              color: '#1e293b',
              marginTop: '4px',
              lineHeight: 1
            }}
          >
            {closedCount}
          </strong>

          <span
            style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '0.7rem',
              color: '#94a3b8'
            }}
          >
            Status CLOSED
          </span>
        </div>

        {/* TOTAL */}
        <div
          style={{
            background:
              'linear-gradient(135deg, #0c4a30 0%, #075e48 100%)',
            padding: '16px 18px',
            borderRadius: '14px',
            border:
              '1px solid #075e48',
            color: '#fff',
            boxShadow:
              '0 6px 18px rgba(12,74,48,0.16)'
          }}
        >
          <small
            style={{
              color: '#a7f3d0',
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '0.68rem'
            }}
          >
            Total Laporan
          </small>

          <strong
            style={{
              display: 'block',
              fontSize: '1.7rem',
              color: '#ffffff',
              marginTop: '4px',
              lineHeight: 1
            }}
          >
            {tickets.length}
          </strong>

          <span
            style={{
              display: 'block',
              marginTop: '5px',
              fontSize: '0.7rem',
              color: '#a7f3d0'
            }}
          >
            Seluruh hasil filter
          </span>
        </div>

      </div>

      {/* =====================================================
          CHART
      ===================================================== */}

      <div className="no-print">
        <TicketCharts
          token={token}
          onError={onError}
        />
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      {loading ? (

        <div
          style={{
            textAlign: 'center',
            color: '#64748b',
            padding: '55px 20px',
            background: '#fff',
            borderRadius: '14px',
            border: '1px solid #e2e8f0'
          }}
        >
          <div
            style={{
              fontWeight: '700',
              color: '#334155',
              marginBottom: '5px'
            }}
          >
            Memuat laporan...
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}
          >
            Sedang mengambil data tiket
          </div>
        </div>

      ) : (

        <div
          className="report-table-container"
          style={{
            overflowX: 'auto',
            borderRadius: '14px',
            border:
              '1px solid #e2e8f0',
            background: '#fff',
            boxShadow:
              '0 3px 12px rgba(15,23,42,0.04)'
          }}
        >

          <table
            className="report-table"
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.78rem',
              color: '#1f2937'
            }}
          >

            <thead>
              <tr
                style={{
                  background: '#0c4a30',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  fontSize: '0.66rem',
                  letterSpacing: '0.05em'
                }}
              >
                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left'
                  }}
                >
                  ID
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left',
                    minWidth: '130px'
                  }}
                >
                  Judul
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left'
                  }}
                >
                  Kategori
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left'
                  }}
                >
                  Pelapor
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left'
                  }}
                >
                  Ruangan
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left'
                  }}
                >
                  Teknisi
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left',
                    minWidth: '130px'
                  }}
                >
                  Tindakan
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left',
                    minWidth: '130px'
                  }}
                >
                  Hasil / Solusi
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left'
                  }}
                >
                  Status
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left',
                    minWidth: '105px'
                  }}
                >
                  Dibuat
                </th>

                <th
                  style={{
                    padding: '11px 12px',
                    textAlign: 'left',
                    minWidth: '105px'
                  }}
                >
                  Selesai
                </th>

                <th
                  className="action-column"
                  style={{
                    padding: '11px 12px',
                    textAlign: 'center'
                  }}
                >
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>

              {paginatedTickets.length === 0 ? (

                <tr>
                  <td
                    colSpan="12"
                    style={{
                      padding: '45px 20px',
                      textAlign: 'center',
                      color: '#64748b'
                    }}
                  >
                    <div
                      style={{
                        fontWeight: '700',
                        color: '#334155',
                        marginBottom: '4px'
                      }}
                    >
                      Tidak ada laporan
                    </div>

                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: '#94a3b8'
                      }}
                    >
                      Tidak ada tiket yang sesuai
                      dengan filter yang dipilih.
                    </div>
                  </td>
                </tr>

              ) : (

                paginatedTickets.map((ticket) => (

                  <tr
                    key={ticket.id}
                    style={{
                      borderBottom:
                        '1px solid #f1f5f9'
                    }}
                  >

                    <td
                      style={{
                        padding: '10px 12px',
                        fontWeight: '800',
                        color: '#0c4a30',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      HD-{ticket.id}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#1f2937',
                        fontWeight: '700'
                      }}
                    >
                      {ticket.judul || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#475569'
                      }}
                    >
                      {ticket.nama_kategori || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#475569'
                      }}
                    >
                      {ticket.pelapor_nama || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#475569'
                      }}
                    >
                      {ticket.nama_ruangan || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#475569'
                      }}
                    >
                      {ticket.teknisi_nama || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#334155',
                        fontSize: '0.74rem',
                        lineHeight: '1.45',
                        maxWidth: '220px'
                      }}
                    >
                      {ticket.tindakan || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#334155',
                        fontSize: '0.74rem',
                        lineHeight: '1.45',
                        maxWidth: '220px'
                      }}
                    >
                      {ticket.hasil || '-'}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <StatusBadge
                        status={ticket.status}
                      />
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#64748b',
                        fontSize: '0.73rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatDateTime(
                        ticket.created_at
                      )}
                    </td>

                    <td
                      style={{
                        padding: '10px 12px',
                        color: '#64748b',
                        fontSize: '0.73rem',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {formatDateTime(
                        getFinishedDate(ticket)
                      )}
                    </td>

                    <td
                      className="action-column"
                      style={{
                        padding: '10px 12px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap'
                      }}
                    >

                      <button
                        onClick={() =>
                          setSelectedTicket(ticket)
                        }
                        style={{
                          padding: '7px 12px',
                          borderRadius: '8px',
                          border:
                            '1px solid #bbf7d0',
                          background: '#f0fdf4',
                          color: '#166534',
                          cursor: 'pointer',
                          fontSize: '0.7rem',
                          fontWeight: '800',
                          transition:
                            'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background =
                            '#dcfce7'

                          e.currentTarget.style.borderColor =
                            '#86efac'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            '#f0fdf4'

                          e.currentTarget.style.borderColor =
                            '#bbf7d0'
                        }}
                      >
                        Lihat Detail
                      </button>

                    </td>

                  </tr>

                ))

              )}

            </tbody>
          </table>
        </div>
      )}

      {/* =====================================================
          PAGINATION
      ===================================================== */}

      {!loading && tickets.length > 0 && (

        <div
          className="no-print"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '14px',
            padding: '12px 16px',
            background: '#fff',
            borderRadius: '12px',
            border:
              '1px solid #e2e8f0',
            boxShadow:
              '0 2px 8px rgba(0,0,0,0.04)'
          }}
        >

          <div
            style={{
              fontSize: '0.75rem',
              color: '#64748b'
            }}
          >
            Menampilkan{' '}
            <strong
              style={{
                color: '#334155'
              }}
            >
              {(currentPage - 1) *
                ITEMS_PER_PAGE +
                1}
            </strong>{' '}
            -{' '}
            <strong
              style={{
                color: '#334155'
              }}
            >
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                tickets.length
              )}
            </strong>{' '}
            dari{' '}
            <strong
              style={{
                color: '#334155'
              }}
            >
              {tickets.length}
            </strong>{' '}
            laporan
          </div>

          <div
            style={{
              display: 'flex',
              gap: '6px',
              alignItems: 'center'
            }}
          >

            <button
              onClick={() =>
                handlePageChange(1)
              }
              disabled={currentPage === 1}
              style={{
                padding: '7px 10px',
                minWidth: '34px',
                borderRadius: '7px',
                border:
                  '1px solid #cbd5e1',
                background:
                  currentPage === 1
                    ? '#f8fafc'
                    : '#fff',
                color:
                  currentPage === 1
                    ? '#94a3b8'
                    : '#334155',
                cursor:
                  currentPage === 1
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: '700'
              }}
            >
              «
            </button>

            <button
              onClick={() =>
                handlePageChange(
                  currentPage - 1
                )
              }
              disabled={currentPage === 1}
              style={{
                padding: '7px 10px',
                minWidth: '34px',
                borderRadius: '7px',
                border:
                  '1px solid #cbd5e1',
                background:
                  currentPage === 1
                    ? '#f8fafc'
                    : '#fff',
                color:
                  currentPage === 1
                    ? '#94a3b8'
                    : '#334155',
                cursor:
                  currentPage === 1
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: '700'
              }}
            >
              ‹
            </button>

            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: '700',
                padding: '0 8px',
                color: '#0f172a'
              }}
            >
              Hal {currentPage} / {totalPages}
            </span>

            <button
              onClick={() =>
                handlePageChange(
                  currentPage + 1
                )
              }
              disabled={
                currentPage === totalPages
              }
              style={{
                padding: '7px 10px',
                minWidth: '34px',
                borderRadius: '7px',
                border:
                  '1px solid #cbd5e1',
                background:
                  currentPage === totalPages
                    ? '#f8fafc'
                    : '#fff',
                color:
                  currentPage === totalPages
                    ? '#94a3b8'
                    : '#334155',
                cursor:
                  currentPage === totalPages
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: '700'
              }}
            >
              ›
            </button>

            <button
              onClick={() =>
                handlePageChange(totalPages)
              }
              disabled={
                currentPage === totalPages
              }
              style={{
                padding: '7px 10px',
                minWidth: '34px',
                borderRadius: '7px',
                border:
                  '1px solid #cbd5e1',
                background:
                  currentPage === totalPages
                    ? '#f8fafc'
                    : '#fff',
                color:
                  currentPage === totalPages
                    ? '#94a3b8'
                    : '#334155',
                cursor:
                  currentPage === totalPages
                    ? 'not-allowed'
                    : 'pointer',
                fontWeight: '700'
              }}
            >
              »
            </button>

          </div>
        </div>
      )}

      {/* =====================================================
          MODAL DETAIL
      ===================================================== */}

      {selectedTicket && (

        <div
          className="modal-backdrop no-print"
          onClick={() =>
            setSelectedTicket(null)
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15, 23, 42, 0.62)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px'
          }}
        >

          <div
            className="detail-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '20px',
              boxShadow:
                '0 25px 60px rgba(15, 23, 42, 0.25)',
              overflow: 'hidden'
            }}
          >

            {/* MODAL HEADER */}
            <div
              style={{
                padding: '22px 24px',
                background:
                  'linear-gradient(135deg, #0c4a30 0%, #075e48 100%)',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >

              <div>
                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    color: '#a7f3d0',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    marginBottom: '5px'
                  }}
                >
                  Detail Laporan
                </div>

                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    fontWeight: '800',
                    color: '#fff'
                  }}
                >
                  HD-{selectedTicket.id}
                </h3>
              </div>

              <button
                onClick={() =>
                  setSelectedTicket(null)
                }
                aria-label="Tutup detail"
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  border:
                    '1px solid rgba(255,255,255,0.2)',
                  background:
                    'rgba(255,255,255,0.12)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '20px',
                  lineHeight: 1
                }}
              >
                ×
              </button>

            </div>

            {/* MODAL CONTENT */}
            <div
              style={{
                padding: '24px'
              }}
            >

              {/* JUDUL */}
              <div
                style={{
                  padding: '16px 18px',
                  background: '#f8fafc',
                  border:
                    '1px solid #e2e8f0',
                  borderRadius: '14px',
                  marginBottom: '16px'
                }}
              >

                <div
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: '700',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '5px'
                  }}
                >
                  Judul Permasalahan
                </div>

                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: '700',
                    color: '#0f172a',
                    lineHeight: '1.4'
                  }}
                >
                  {selectedTicket.judul || '-'}
                </div>

              </div>

              {/* BADGES */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexWrap: 'wrap',
                  marginBottom: '18px'
                }}
              >

                <StatusBadge
                  status={selectedTicket.status}
                />

                <PriorityBadge
                  priority={
                    selectedTicket.prioritas
                  }
                />

              </div>

              {/* INFO */}
              <div
                className="detail-info-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(2, minmax(0, 1fr))',
                  gap: '10px',
                  marginBottom: '18px'
                }}
              >

                {[
                  [
                    'Pelapor',
                    selectedTicket.pelapor_nama
                  ],
                  [
                    'Kategori',
                    selectedTicket.nama_kategori
                  ],
                  [
                    'Ruangan',
                    selectedTicket.nama_ruangan
                  ],
                  [
                    'Teknisi',
                    selectedTicket.teknisi_nama
                  ],
                  [
                    'Dibuat',
                    formatDateTime(
                      selectedTicket.created_at
                    )
                  ],
                  [
                    'Diselesaikan',
                    formatDateTime(
                      getFinishedDate(
                        selectedTicket
                      )
                    )
                  ]
                ].map(([label, value]) => (

                  <div
                    key={label}
                    style={{
                      padding: '13px 15px',
                      border:
                        '1px solid #e2e8f0',
                      borderRadius: '12px',
                      background: '#fff'
                    }}
                  >

                    <div
                      style={{
                        fontSize: '0.66rem',
                        fontWeight: '700',
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        marginBottom: '5px'
                      }}
                    >
                      {label}
                    </div>

                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: '600',
                        color: '#334155',
                        lineHeight: '1.4'
                      }}
                    >
                      {value || '-'}
                    </div>

                  </div>

                ))}

              </div>

              {/* TINDAKAN */}
              <div
                style={{
                  border:
                    '1px solid #dbeafe',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  marginBottom: '12px'
                }}
              >

                <div
                  style={{
                    padding: '10px 15px',
                    background: '#eff6ff',
                    borderBottom:
                      '1px solid #dbeafe',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: '#1d4ed8',
                    letterSpacing: '0.03em'
                  }}
                >
                  TINDAKAN PERBAIKAN
                </div>

                <div
                  style={{
                    padding: '15px',
                    fontSize: '0.83rem',
                    lineHeight: '1.65',
                    color: '#334155',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedTicket.tindakan ||
                    'Tidak ada tindakan yang dicatat.'}
                </div>

              </div>

              {/* SOLUSI */}
              <div
                style={{
                  border:
                    '1px solid #a7f3d0',
                  borderRadius: '14px',
                  overflow: 'hidden'
                }}
              >

                <div
                  style={{
                    padding: '10px 15px',
                    background: '#ecfdf5',
                    borderBottom:
                      '1px solid #a7f3d0',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    color: '#047857',
                    letterSpacing: '0.03em'
                  }}
                >
                  HASIL / SOLUSI AKHIR
                </div>

                <div
                  style={{
                    padding: '15px',
                    fontSize: '0.83rem',
                    lineHeight: '1.65',
                    color: '#334155',
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {selectedTicket.hasil ||
                    'Tidak ada hasil/solusi yang dicatat.'}
                </div>

              </div>

            </div>

            {/* MODAL FOOTER */}
            <div
              style={{
                padding: '14px 24px',
                borderTop:
                  '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                justifyContent: 'flex-end'
              }}
            >

              <button
                onClick={() =>
                  setSelectedTicket(null)
                }
                style={{
                  padding: '9px 18px',
                  borderRadius: '9px',
                  border:
                    '1px solid #cbd5e1',
                  background: '#fff',
                  color: '#334155',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.78rem'
                }}
              >
                Tutup
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}