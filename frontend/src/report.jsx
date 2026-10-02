import { useEffect, useState, useMemo } from 'react'
import { api } from './api.js'
import TicketCharts from './chart.jsx'

export default function Report({ token, user, onBack, onError }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState([])
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [categories, setCategories] = useState([])
  const [selectedTicket, setSelectedTicket] = useState(null)

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  const isStaff =
    user?.role === 'admin' ||
    user?.role === 'teknisi'

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

      if (statusFilter.length > 0) {
        params.append(
          'status',
          statusFilter.join(',')
        )
      }

      if (categoryFilter !== 'all') {
        params.append(
          'category',
          categoryFilter
        )
      }

      if (dateFrom) {
        params.append(
          'date_from',
          dateFrom
        )
      }

      if (dateTo) {
        params.append(
          'date_to',
          dateTo
        )
      }

      if (search.trim()) {
        params.append(
          'search',
          search.trim()
        )
      }

      const query = params.toString()

      const url =
        `/tickets/reports/finished-tickets` +
        `${query ? `?${query}` : ''}`

      const res = await api(
        url,
        token ? { token } : {}
      )

      setTickets(res.data || [])
      setCurrentPage(1)
    } catch (err) {
      console.error(err)

      if (onError) {
        onError(
          err?.message ||
          'Gagal memuat laporan.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadReport()
  }, [
    statusFilter,
    categoryFilter,
    dateFrom,
    dateTo,
    token
  ])

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      loadReport()
    }
  }

  const handleResetFilter = () => {
    setSearch('')
    setStatusFilter([])
    setCategoryFilter('all')
    setDateFrom('')
    setDateTo('')
  }

  const handlePrint = async () => {
    if (!isStaff) return

    try {
      const params = new URLSearchParams()

      if (statusFilter.length > 0) {
        params.append(
          'status',
          statusFilter.join(',')
        )
      }

      if (categoryFilter !== 'all') {
        params.append(
          'category',
          categoryFilter
        )
      }

      if (dateFrom) {
        params.append(
          'date_from',
          dateFrom
        )
      }

      if (dateTo) {
        params.append(
          'date_to',
          dateTo
        )
      }

      if (search.trim()) {
        params.append(
          'search',
          search.trim()
        )
      }

      const query = params.toString()

      await api(
        `/tickets/reports/print${query ? `?${query}` : ''}`,
        { token }
      )

      window.print()
    } catch (err) {
      console.error(err)

      if (onError) {
        onError(
          err?.message ||
          'Gagal mencetak laporan.'
        )
      }
    }
  }

  const formatDateTime = (date) => {
    if (!date) return '-'

    const d = new Date(date)

    if (Number.isNaN(d.getTime())) {
      return '-'
    }

    const tgl =
      d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })

    const jam =
      d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      })

    return `${tgl} ${jam}`
  }

  const formatLongDate = (date) => {
    if (!date) return '-'

    const d = new Date(date)

    if (Number.isNaN(d.getTime())) {
      return '-'
    }

    return d.toLocaleDateString(
      'id-ID',
      {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }
    )
  }

  const statusOptions = [
    {
      value: 'NEW',
      label: 'Baru'
    },
    {
      value: 'ASSIGNED',
      label: 'Ditugaskan'
    },
    {
      value: 'IN_PROGRESS',
      label: 'Diproses'
    },
    {
      value: 'WAITING',
      label: 'Ditunggu'
    },
    {
      value: 'RESOLVED',
      label: 'Selesai'
    },
    {
      value: 'CLOSED',
      label: 'Ditutup'
    }
  ]

  const statusLabel = {
    NEW: 'Baru',
    ASSIGNED: 'Ditugaskan',
    IN_PROGRESS: 'Diproses',
    WAITING: 'Ditunggu',
    RESOLVED: 'Selesai',
    CLOSED: 'Ditutup'
  }

  const statusColor = {
    NEW: {
      background: '#eff6ff',
      border: '#bfdbfe',
      text: '#1d4ed8',
      dot: '#3b82f6'
    },

    ASSIGNED: {
      background: '#f5f3ff',
      border: '#ddd6fe',
      text: '#6d28d9',
      dot: '#8b5cf6'
    },

    IN_PROGRESS: {
      background: '#fffbeb',
      border: '#fde68a',
      text: '#b45309',
      dot: '#f59e0b'
    },

    WAITING: {
      background: '#fff7ed',
      border: '#fed7aa',
      text: '#c2410c',
      dot: '#f97316'
    },

    RESOLVED: {
      background: '#ecfdf5',
      border: '#a7f3d0',
      text: '#047857',
      dot: '#10b981'
    },

    CLOSED: {
      background: '#f8fafc',
      border: '#cbd5e1',
      text: '#475569',
      dot: '#64748b'
    }
  }

  const resolvedCount = tickets.filter(
    (t) => t.status === 'RESOLVED'
  ).length

  const waitingCount = tickets.filter(
    (t) => t.status === 'WAITING'
  ).length

  const closedCount = tickets.filter(
    (t) => t.status === 'CLOSED'
  ).length

  const totalPages =
    Math.ceil(
      tickets.length /
      ITEMS_PER_PAGE
    ) || 1

  const paginatedTickets = useMemo(() => {
    const start =
      (currentPage - 1) *
      ITEMS_PER_PAGE

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

  const activeFilterCount = [
    statusFilter.length > 0,
    categoryFilter !== 'all',
    Boolean(dateFrom),
    Boolean(dateTo),
    Boolean(search.trim())
  ].filter(Boolean).length

  return (
    <div
      className="report-page"
      style={{
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '24px 20px 40px',
        color: '#0f172a'
      }}
    >

      <style>{`

        /* =========================
           GLOBAL REPORT
        ========================= */

        .report-page * {
          box-sizing: border-box;
        }

        .report-header {
          animation: reportFadeIn .25s ease;
        }

        @keyframes reportFadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .report-action-btn,
        .report-filter-btn,
        .report-detail-btn,
        .report-page-btn,
        .report-close-btn {
          transition:
            background-color .15s ease,
            border-color .15s ease,
            color .15s ease,
            transform .15s ease,
            box-shadow .15s ease;
        }

        .report-action-btn:hover {
          transform: translateY(-1px);
        }

        .report-detail-btn:hover {
          transform: translateY(-1px);
          box-shadow:
            0 4px 10px
            rgba(12, 74, 48, .16);
        }

        .report-filter-input:focus,
        .report-filter-select:focus {
          border-color: #0f766e !important;
          box-shadow:
            0 0 0 3px
            rgba(15, 118, 110, .08);
        }

        .report-status-picker > summary::-webkit-details-marker {
          display: none;
        }

        .report-status-picker > summary {
          list-style: none;
        }

        .report-status-picker > summary:focus {
          border-color: #0f766e !important;
          box-shadow:
            0 0 0 3px
            rgba(15, 118, 110, .08);
        }

        .report-status-picker[open] > summary {
          border-color: #0f766e !important;
          box-shadow:
            0 0 0 3px
            rgba(15, 118, 110, .08);
        }

        .report-status-option:hover {
          background: #f8fafc !important;
        }

        .report-status-option.selected:hover {
          background: #ecfdf5 !important;
        }

        .report-table tbody tr {
          transition:
            background-color .15s ease,
            box-shadow .15s ease;
        }

        .report-table tbody tr:hover {
          background: #f8fafc;
        }

        .report-table td {
          vertical-align: middle;
        }

        .report-modal-overlay {
          animation: modalOverlay .18s ease;
        }

        .report-modal {
          animation: modalShow .2s ease;
        }

        @keyframes modalOverlay {
          from {
            opacity: 0;
          }

          to {
            opacity: 1;
          }
        }

        @keyframes modalShow {
          from {
            opacity: 0;
            transform:
              translateY(8px)
              scale(.98);
          }

          to {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        .report-info-card {
          transition:
            border-color .15s ease,
            background-color .15s ease;
        }

        .report-info-card:hover {
          border-color: #cbd5e1 !important;
          background: #ffffff !important;
        }

        .report-page-btn:not(:disabled):hover {
          background: #f0fdf4 !important;
          border-color: #86efac !important;
          color: #166534 !important;
        }

        @media (max-width: 1100px) {
          .report-filter-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr))
              !important;
          }
        }

        @media (max-width: 900px) {
          .report-header-main {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .report-header-title {
            text-align: left !important;
          }

          .report-header-actions {
            justify-content: space-between !important;
          }

          .report-summary-grid {
            grid-template-columns:
              repeat(2, minmax(0, 1fr))
              !important;
          }
        }

        @media (max-width: 700px) {
          .report-page {
            padding:
              14px 10px 30px !important;
          }

          .report-filter-grid {
            grid-template-columns:
              1fr !important;
          }

          .report-summary-grid {
            grid-template-columns:
              1fr !important;
          }

          .report-modal-content {
            grid-template-columns:
              1fr !important;
          }

          .report-modal-wide {
            grid-column: auto !important;
          }

          .report-pagination {
            flex-direction: column !important;
            align-items: stretch !important;
          }

          .report-pagination-controls {
            justify-content: center !important;
          }
        }

        /* =========================
           PRINT
        ========================= */

        @media print {

          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family:
              Arial, sans-serif !important;
          }

          .no-print,
          nav,
          header,
          .header,
          button,
          .report-filters,
          .report-summary-cards,
          .report-charts,
          .report-pagination {
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
            border:
              1px solid #000 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
          }

          .report-table {
            width: 100% !important;
            border-collapse:
              collapse !important;
            font-size: 7pt !important;
          }

          .report-table th {
            background-color:
              #0c4a30 !important;
            color: #ffffff !important;
            -webkit-print-color-adjust:
              exact;
            print-color-adjust: exact;
            border:
              1px solid #000 !important;
            padding:
              5px 6px !important;
            text-align: left !important;
          }

          .report-table td {
            border:
              1px solid #666 !important;
            padding:
              5px 6px !important;
            color: #000000 !important;
            vertical-align: top !important;
            word-break:
              break-word !important;
          }

          .action-column {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }
        }

        .print-only {
          display: none;
        }

      `}</style>

      {/* =========================
          PRINT HEADER
      ========================= */}

      <div
        className="print-only"
        style={{
          marginBottom: '16px'
        }}
      >
        <div
          style={{
            textAlign: 'center',
            borderBottom:
              '3px double #000',
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
            LAPORAN PENYELESAIAN &
            TROUBLESHOOTING TIKET IT
          </h2>

          <p
            style={{
              margin: '3px 0 0',
              fontSize: '9pt',
              color: '#333'
            }}
          >
            Sistem Informasi IT Helpdesk -
            Dokumen Laporan Resmi
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            fontSize: '8pt',
            marginTop: '8px',
            color: '#333'
          }}
        >
          <span>
            Tanggal Cetak:{' '}
            {formatLongDate(
              new Date()
            )}
          </span>

          <span>
            Total Laporan:{' '}
            {tickets.length} Tiket
          </span>
        </div>
      </div>

      {/* =========================
          HEADER
      ========================= */}

      <div
        className="report-header report-header-main no-print"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent:
            'space-between',
          gap: '18px',
          padding: '20px 22px',
          marginBottom: '18px',
          borderRadius: '18px',
          background:
            'linear-gradient(135deg, #064e3b 0%, #065f46 55%, #047857 100%)',
          color: '#ffffff',
          boxShadow:
            '0 10px 28px rgba(6, 78, 59, .18)'
        }}
      >

        <button
          className="report-action-btn"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            background:
              'rgba(255,255,255,.10)',
            color: '#ffffff',
            border:
              '1px solid rgba(255,255,255,.18)',
            padding: '9px 14px',
            borderRadius: '9px',
            cursor: 'pointer',
            fontWeight: '700',
            fontSize: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          <span
            style={{
              fontSize: '16px'
            }}
          >
            ‹
          </span>

          Kembali
        </button>

        <div
          className="report-header-title"
          style={{
            flex: 1,
            textAlign: 'center'
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '5px'
            }}
          >
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '9px',
                display: 'grid',
                placeItems: 'center',
                background:
                  'rgba(255,255,255,.12)',
                border:
                  '1px solid rgba(255,255,255,.14)',
                fontSize: '15px',
                fontWeight: '800'
              }}
            >
              R
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                color: '#ffffff',
                fontWeight: '800'
              }}
            >
              Laporan Tiket
            </h2>
          </div>

          <p
            style={{
              margin: 0,
              color: '#a7f3d0',
              fontSize: '0.78rem'
            }}
          >
            Rekap dan monitoring seluruh
            tiket IT Helpdesk
          </p>
        </div>

        <div
          className="report-header-actions"
          style={{
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          {isStaff && (
            <button
              className="report-action-btn"
              onClick={handlePrint}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                background: '#ffffff',
                color: '#065f46',
                border: 'none',
                padding: '9px 15px',
                borderRadius: '9px',
                cursor: 'pointer',
                fontWeight: '800',
                fontSize: '12px',
                boxShadow:
                  '0 4px 12px rgba(0,0,0,.12)',
                whiteSpace: 'nowrap'
              }}
            >
              Print Laporan
            </button>
          )}
        </div>
      </div>

      {/* =========================
          FILTER
      ========================= */}

      <div
        className="report-filters no-print"
        style={{
          background: '#ffffff',
          border:
            '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '18px',
          boxShadow:
            '0 3px 12px rgba(15,23,42,.04)'
        }}
      >

        <div
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '10px'
          }}
        >
          <div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '800',
                color: '#0f172a'
              }}
            >
              Filter Laporan
            </div>

            <div
              style={{
                fontSize: '11px',
                color: '#64748b',
                marginTop: '2px'
              }}
            >
              Gunakan filter untuk
              mempersempit data tiket
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              className="report-filter-btn"
              onClick={
                handleResetFilter
              }
              style={{
                border: 'none',
                background: '#fef2f2',
                color: '#b91c1c',
                padding: '7px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              Reset {activeFilterCount}{' '}
              filter
            </button>
          )}
        </div>

        <div
          className="report-filter-grid"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(220px, 1.6fr) repeat(4, minmax(130px, 1fr))',
            gap: '9px'
          }}
        >

          <input
            className="report-filter-input"
            type="text"
            placeholder={
              'Cari ID, judul, pelapor, tindakan...'
            }
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            onKeyDown={handleSearch}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '12px',
              outline: 'none',
              color: '#0f172a',
              background: '#ffffff'
            }}
          />

          {/* MULTI STATUS FILTER */}

          <details
            className="report-status-picker"
            style={{
              position: 'relative'
            }}
          >
            <summary
              style={{
                width: '100%',
                padding: '10px 11px',
                borderRadius: '9px',
                border:
                  '1px solid #cbd5e1',
                fontSize: '12px',
                background: '#ffffff',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer',
                listStyle: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                gap: '8px',
                minHeight: '37px'
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow:
                    'ellipsis',
                  whiteSpace:
                    'nowrap'
                }}
              >
                {statusFilter.length === 0
                  ? 'Semua Status'
                  : statusFilter
                      .map(
                        (value) =>
                          statusLabel[
                            value
                          ] || value
                      )
                      .join(', ')}
              </span>

              <span
                style={{
                  fontSize: '10px',
                  flexShrink: 0
                }}
              >
                ▼
              </span>
            </summary>

            <div
              style={{
                position: 'absolute',
                top:
                  'calc(100% + 5px)',
                left: 0,
                right: 0,
                zIndex: 100,
                background: '#ffffff',
                border:
                  '1px solid #cbd5e1',
                borderRadius: '10px',
                padding: '7px',
                boxShadow:
                  '0 10px 25px rgba(15,23,42,.12)'
              }}
            >

              <button
                type="button"
                onClick={() =>
                  setStatusFilter([])
                }
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px 9px',
                  border: 'none',
                  borderRadius: '7px',
                  background:
                    statusFilter.length === 0
                      ? '#f0fdf4'
                      : '#ffffff',
                  color:
                    statusFilter.length === 0
                      ? '#166534'
                      : '#334155',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '700',
                  marginBottom: '3px'
                }}
              >
                Semua Status
              </button>

              {statusOptions.map(
                (option) => {
                  const checked =
                    statusFilter.includes(
                      option.value
                    )

                  return (
                    <label
                      key={
                        option.value
                      }
                      className={
                        `report-status-option ${
                          checked
                            ? 'selected'
                            : ''
                        }`
                      }
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: '8px',
                        padding:
                          '8px 9px',
                        borderRadius:
                          '7px',
                        cursor:
                          'pointer',
                        background:
                          checked
                            ? '#f0fdf4'
                            : '#ffffff',
                        fontSize:
                          '11px',
                        color:
                          '#334155',
                        fontWeight:
                          checked
                            ? '700'
                            : '500'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setStatusFilter(
                            (current) =>
                              current.includes(
                                option.value
                              )
                                ? current.filter(
                                    (item) =>
                                      item !==
                                      option.value
                                  )
                                : [
                                    ...current,
                                    option.value
                                  ]
                          )
                        }}
                        style={{
                          width: '14px',
                          height: '14px',
                          accentColor:
                            '#047857',
                          cursor:
                            'pointer'
                        }}
                      />

                      <span>
                        {option.label}
                      </span>
                    </label>
                  )
                }
              )}

            </div>
          </details>

          {/* CATEGORY */}

          <select
            className="report-filter-select"
            value={
              categoryFilter
            }
            onChange={(e) =>
              setCategoryFilter(
                e.target.value
              )
            }
            style={{
              width: '100%',
              padding: '10px 11px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '12px',
              background: '#ffffff',
              color: '#334155',
              outline: 'none'
            }}
          >
            <option value="all">
              Semua Kategori
            </option>

            {categories.map(
              (cat) => (
                <option
                  key={cat.id}
                  value={
                    cat.nama_kategori
                  }
                >
                  {cat.nama_kategori}
                </option>
              )
            )}
          </select>

          {/* DATE FROM */}

          <input
            className="report-filter-input"
            type="date"
            value={dateFrom}
            onChange={(e) =>
              setDateFrom(
                e.target.value
              )
            }
            style={{
              width: '100%',
              padding: '9px 10px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '12px',
              outline: 'none',
              color: '#334155',
              background: '#ffffff'
            }}
          />

          {/* DATE TO */}

          <input
            className="report-filter-input"
            type="date"
            value={dateTo}
            onChange={(e) =>
              setDateTo(
                e.target.value
              )
            }
            style={{
              width: '100%',
              padding: '9px 10px',
              borderRadius: '9px',
              border:
                '1px solid #cbd5e1',
              fontSize: '12px',
              outline: 'none',
              color: '#334155',
              background: '#ffffff'
            }}
          />

        </div>

        <div
          style={{
            marginTop: '9px',
            fontSize: '10px',
            color: '#94a3b8'
          }}
        >
          Tekan Enter pada kolom
          pencarian untuk menjalankan
          pencarian.
        </div>
      </div>

      {/* =========================
          SUMMARY
      ========================= */}

      <div
        className="report-summary-cards report-summary-grid no-print"
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(4, minmax(0, 1fr))',
          gap: '12px',
          marginBottom: '18px'
        }}
      >

        {/* SELESAI */}

        <div
          style={{
            background: '#ffffff',
            padding: '17px 18px',
            borderRadius: '15px',
            border:
              '1px solid #bbf7d0',
            boxShadow:
              '0 3px 10px rgba(15,23,42,.035)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-18px',
              top: '-22px',
              width: '75px',
              height: '75px',
              borderRadius: '50%',
              background: '#ecfdf5'
            }}
          />

          <div
            style={{
              position: 'relative'
            }}
          >
            <span
              style={{
                display:
                  'inline-block',
                background: '#ecfdf5',
                color: '#047857',
                borderRadius: '7px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: '800'
              }}
            >
              SELESAI
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: '2rem',
                lineHeight: 1,
                color: '#166534',
                marginTop: '11px'
              }}
            >
              {resolvedCount}
            </strong>

            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#64748b',
                marginTop: '5px'
              }}
            >
              Tiket berstatus
              resolved
            </span>
          </div>
        </div>

        {/* DITUNGGU */}

        <div
          style={{
            background: '#ffffff',
            padding: '17px 18px',
            borderRadius: '15px',
            border:
              '1px solid #fed7aa',
            boxShadow:
              '0 3px 10px rgba(15,23,42,.035)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-18px',
              top: '-22px',
              width: '75px',
              height: '75px',
              borderRadius: '50%',
              background: '#fff7ed'
            }}
          />

          <div
            style={{
              position: 'relative'
            }}
          >
            <span
              style={{
                display:
                  'inline-block',
                background: '#fff7ed',
                color: '#c2410c',
                borderRadius: '7px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: '800'
              }}
            >
              DITUNGGU
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: '2rem',
                lineHeight: 1,
                color: '#c2410c',
                marginTop: '11px'
              }}
            >
              {waitingCount}
            </strong>

            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#64748b',
                marginTop: '5px'
              }}
            >
              Tiket berstatus
              waiting
            </span>
          </div>
        </div>

        {/* DITUTUP */}

        <div
          style={{
            background: '#ffffff',
            padding: '17px 18px',
            borderRadius: '15px',
            border:
              '1px solid #e2e8f0',
            boxShadow:
              '0 3px 10px rgba(15,23,42,.035)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-18px',
              top: '-22px',
              width: '75px',
              height: '75px',
              borderRadius: '50%',
              background: '#f8fafc'
            }}
          />

          <div
            style={{
              position: 'relative'
            }}
          >
            <span
              style={{
                display:
                  'inline-block',
                background: '#f1f5f9',
                color: '#475569',
                borderRadius: '7px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: '800'
              }}
            >
              DITUTUP
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: '2rem',
                lineHeight: 1,
                color: '#1e293b',
                marginTop: '11px'
              }}
            >
              {closedCount}
            </strong>

            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#64748b',
                marginTop: '5px'
              }}
            >
              Tiket berstatus
              closed
            </span>
          </div>
        </div>

        {/* TOTAL */}

        <div
          style={{
            background:
              'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
            padding: '17px 18px',
            borderRadius: '15px',
            border:
              '1px solid #065f46',
            color: '#ffffff',
            boxShadow:
              '0 7px 18px rgba(6,78,59,.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: '-20px',
              top: '-24px',
              width: '95px',
              height: '95px',
              borderRadius: '50%',
              border:
                '15px solid rgba(255,255,255,.06)'
            }}
          />

          <div
            style={{
              position: 'relative'
            }}
          >
            <span
              style={{
                display:
                  'inline-block',
                background:
                  'rgba(255,255,255,.11)',
                color: '#d1fae5',
                borderRadius: '7px',
                padding: '5px 8px',
                fontSize: '10px',
                fontWeight: '800'
              }}
            >
              TOTAL LAPORAN
            </span>

            <strong
              style={{
                display: 'block',
                fontSize: '2rem',
                lineHeight: 1,
                color: '#ffffff',
                marginTop: '11px'
              }}
            >
              {tickets.length}
            </strong>

            <span
              style={{
                display: 'block',
                fontSize: '11px',
                color: '#a7f3d0',
                marginTop: '5px'
              }}
            >
              Seluruh tiket
              sesuai filter
            </span>
          </div>
        </div>

      </div>

      {/* =========================
          CHART
      ========================= */}

      <div
        className="report-charts no-print"
        style={{
          marginBottom: '18px'
        }}
      >
        <TicketCharts
          token={token}
          onError={onError}
        />
      </div>

      {/* =========================
          TABLE
      ========================= */}

      {loading ? (

        <div
          style={{
            background: '#ffffff',
            border:
              '1px solid #e2e8f0',
            borderRadius: '15px',
            padding: '55px 20px',
            textAlign: 'center',
            boxShadow:
              '0 3px 10px rgba(15,23,42,.035)'
          }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border:
                '3px solid #d1fae5',
              borderTopColor:
                '#047857',
              margin:
                '0 auto 12px',
              animation:
                'reportSpin .8s linear infinite'
            }}
          />

          <style>{`
            @keyframes reportSpin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>

          <div
            style={{
              fontSize: '13px',
              fontWeight: '700',
              color: '#334155'
            }}
          >
            Memuat laporan...
          </div>

          <div
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              marginTop: '4px'
            }}
          >
            Mohon tunggu sebentar
          </div>
        </div>

      ) : (

        <div
          className="report-table-container"
          style={{
            overflowX: 'auto',
            borderRadius: '15px',
            border:
              '1px solid #e2e8f0',
            background: '#ffffff',
            boxShadow:
              '0 3px 12px rgba(15,23,42,.045)'
          }}
        >

          <table
            className="report-table"
            style={{
              width: '100%',
              minWidth: '1180px',
              borderCollapse:
                'collapse',
              fontSize: '0.78rem',
              color: '#1f2937'
            }}
          >

            <thead>
              <tr
                style={{
                  background:
                    'linear-gradient(90deg, #064e3b, #065f46)',
                  color: '#ffffff',
                  textTransform:
                    'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing:
                    '0.04em'
                }}
              >

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    width: '70px'
                  }}
                >
                  ID
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '170px'
                  }}
                >
                  Judul
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '120px'
                  }}
                >
                  Kategori
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '120px'
                  }}
                >
                  Pelapor
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '105px'
                  }}
                >
                  Ruangan
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '120px'
                  }}
                >
                  Teknisi
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '180px'
                  }}
                >
                  Tindakan
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '180px'
                  }}
                >
                  Hasil / Solusi
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '115px'
                  }}
                >
                  Status
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '125px'
                  }}
                >
                  Dibuat
                </th>

                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontWeight: '800',
                    minWidth: '125px'
                  }}
                >
                  Selesai
                </th>

                <th
                  className="action-column"
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontWeight: '800',
                    minWidth: '105px'
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
                      padding:
                        '55px 20px',
                      textAlign:
                        'center'
                    }}
                  >

                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background:
                          '#f1f5f9',
                        display: 'grid',
                        placeItems:
                          'center',
                        margin:
                          '0 auto 12px',
                        color: '#64748b',
                        fontWeight: '800'
                      }}
                    >
                      -
                    </div>

                    <div
                      style={{
                        fontWeight:
                          '800',
                        color:
                          '#334155',
                        fontSize:
                          '13px'
                      }}
                    >
                      Tidak ada laporan
                    </div>

                    <div
                      style={{
                        color:
                          '#94a3b8',
                        fontSize:
                          '11px',
                        marginTop:
                          '4px'
                      }}
                    >
                      Tidak ada tiket
                      yang sesuai
                      dengan filter.
                    </div>

                  </td>
                </tr>

              ) : (

                paginatedTickets.map(
                  (ticket) => {

                    const status =
                      statusColor[
                        ticket.status
                      ] ||
                      statusColor.CLOSED

                    const completionDate =
                      ticket.status ===
                        'RESOLVED'
                        ? ticket.resolved_at
                        : ticket.status ===
                          'CLOSED'
                          ? ticket.closed_at
                          : null

                    return (
                      <tr
                        key={
                          ticket.id
                        }
                        style={{
                          borderBottom:
                            '1px solid #f1f5f9'
                        }}
                      >

                        {/* ID */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            fontWeight:
                              '800',
                            color:
                              '#047857',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          HD-{ticket.id}
                        </td>

                        {/* JUDUL */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#0f172a',
                            fontWeight:
                              '700',
                            maxWidth:
                              '190px'
                          }}
                        >
                          <div
                            style={{
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              display:
                                '-webkit-box',
                              WebkitLineClamp:
                                2,
                              WebkitBoxOrient:
                                'vertical',
                              lineHeight:
                                '1.4'
                            }}
                          >
                            {ticket.judul ||
                              '-'}
                          </div>
                        </td>

                        {/* KATEGORI */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#475569',
                            lineHeight:
                              '1.4',
                            wordBreak:
                              'break-word'
                          }}
                        >
                          {ticket.nama_kategori ||
                            '-'}
                        </td>

                        {/* PELAPOR */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#475569',
                            lineHeight:
                              '1.4',
                            wordBreak:
                              'break-word'
                          }}
                        >
                          {ticket.pelapor_nama ||
                            '-'}
                        </td>

                        {/* RUANGAN */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#475569',
                            lineHeight:
                              '1.4',
                            wordBreak:
                              'break-word'
                          }}
                        >
                          {ticket.nama_ruangan ||
                            '-'}
                        </td>

                        {/* TEKNISI */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#475569',
                            lineHeight:
                              '1.4',
                            wordBreak:
                              'break-word'
                          }}
                        >
                          {ticket.teknisi_nama ||
                            '-'}
                        </td>

                        {/* TINDAKAN */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#334155',
                            fontSize:
                              '0.72rem',
                            lineHeight:
                              '1.4',
                            maxWidth:
                              '190px'
                          }}
                        >
                          <div
                            style={{
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              display:
                                '-webkit-box',
                              WebkitLineClamp:
                                2,
                              WebkitBoxOrient:
                                'vertical'
                            }}
                          >
                            {ticket.tindakan ||
                              '-'}
                          </div>
                        </td>

                        {/* HASIL */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#334155',
                            fontSize:
                              '0.72rem',
                            lineHeight:
                              '1.4',
                            maxWidth:
                              '190px'
                          }}
                        >
                          <div
                            style={{
                              overflow:
                                'hidden',
                              textOverflow:
                                'ellipsis',
                              display:
                                '-webkit-box',
                              WebkitLineClamp:
                                2,
                              WebkitBoxOrient:
                                'vertical'
                            }}
                          >
                            {ticket.hasil ||
                              '-'}
                          </div>
                        </td>

                        {/* STATUS */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          <span
                            style={{
                              display:
                                'inline-flex',
                              alignItems:
                                'center',
                              gap: '6px',
                              background:
                                status.background,
                              border:
                                `1px solid ${status.border}`,
                              color:
                                status.text,
                              padding:
                                '5px 8px',
                              borderRadius:
                                '7px',
                              fontSize:
                                '0.65rem',
                              fontWeight:
                                '800'
                            }}
                          >
                            <span
                              style={{
                                width:
                                  '5px',
                                height:
                                  '5px',
                                borderRadius:
                                  '50%',
                                background:
                                  status.dot,
                                flexShrink:
                                  0
                              }}
                            />

                            {statusLabel[
                              ticket.status
                            ] ||
                              ticket.status}
                          </span>
                        </td>

                        {/* DIBUAT */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#64748b',
                            fontSize:
                              '0.7rem',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          {formatDateTime(
                            ticket.created_at
                          )}
                        </td>

                        {/* SELESAI */}

                        <td
                          style={{
                            padding:
                              '11px 12px',
                            color:
                              '#64748b',
                            fontSize:
                              '0.7rem',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          {formatDateTime(
                            completionDate
                          )}
                        </td>

                        {/* AKSI */}

                        <td
                          className="action-column"
                          style={{
                            padding:
                              '11px 12px',
                            textAlign:
                              'center',
                            whiteSpace:
                              'nowrap'
                          }}
                        >
                          <button
                            className="report-detail-btn"
                            onClick={() =>
                              setSelectedTicket(
                                ticket
                              )
                            }
                            style={{
                              background:
                                '#ecfdf5',
                              color:
                                '#047857',
                              border:
                                '1px solid #a7f3d0',
                              padding:
                                '6px 10px',
                              borderRadius:
                                '7px',
                              cursor:
                                'pointer',
                              fontSize:
                                '0.68rem',
                              fontWeight:
                                '800'
                            }}
                          >
                            Lihat Detail
                          </button>
                        </td>

                      </tr>
                    )
                  }
                )
              )}

            </tbody>
          </table>
        </div>
      )}

      {/* =========================
          PAGINATION
      ========================= */}

      {!loading &&
        tickets.length > 0 && (

          <div
            className="report-pagination no-print"
            style={{
              display: 'flex',
              justifyContent:
                'space-between',
              alignItems: 'center',
              gap: '14px',
              marginTop: '14px',
              padding: '12px 14px',
              background: '#ffffff',
              borderRadius: '12px',
              border:
                '1px solid #e2e8f0',
              boxShadow:
                '0 2px 8px rgba(15,23,42,.035)'
            }}
          >

            <div
              style={{
                fontSize: '11px',
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
              </strong>

              {' - '}

              <strong
                style={{
                  color: '#334155'
                }}
              >
                {Math.min(
                  currentPage *
                    ITEMS_PER_PAGE,
                  tickets.length
                )}
              </strong>

              {' dari '}

              <strong
                style={{
                  color: '#334155'
                }}
              >
                {tickets.length}
              </strong>

              {' '}
              laporan
            </div>

            <div
              className="report-pagination-controls"
              style={{
                display: 'flex',
                gap: '5px',
                alignItems:
                  'center'
              }}
            >

              {[
                ['«', 1],
                [
                  '‹',
                  currentPage - 1
                ]
              ].map(
                ([label, page]) => (
                  <button
                    key={label}
                    className="report-page-btn"
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    style={{
                      width: '31px',
                      height: '31px',
                      borderRadius:
                        '7px',
                      border:
                        '1px solid #cbd5e1',
                      background:
                        currentPage ===
                        1
                          ? '#f8fafc'
                          : '#ffffff',
                      color:
                        currentPage ===
                        1
                          ? '#94a3b8'
                          : '#334155',
                      cursor:
                        currentPage ===
                        1
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight:
                        '700'
                    }}
                  >
                    {label}
                  </button>
                )
              )}

              <div
                style={{
                  minWidth:
                    '75px',
                  textAlign:
                    'center',
                  fontSize:
                    '11px',
                  fontWeight:
                    '800',
                  color:
                    '#334155'
                }}
              >
                {currentPage} /{' '}
                {totalPages}
              </div>

              {[
                [
                  '›',
                  currentPage + 1
                ],
                [
                  '»',
                  totalPages
                ]
              ].map(
                ([label, page]) => (
                  <button
                    key={label}
                    className="report-page-btn"
                    onClick={() =>
                      handlePageChange(
                        page
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    style={{
                      width: '31px',
                      height: '31px',
                      borderRadius:
                        '7px',
                      border:
                        '1px solid #cbd5e1',
                      background:
                        currentPage ===
                        totalPages
                          ? '#f8fafc'
                          : '#ffffff',
                      color:
                        currentPage ===
                        totalPages
                          ? '#94a3b8'
                          : '#334155',
                      cursor:
                        currentPage ===
                        totalPages
                          ? 'not-allowed'
                          : 'pointer',
                      fontWeight:
                        '700'
                    }}
                  >
                    {label}
                  </button>
                )
              )}

            </div>
          </div>
        )}

      {/* =========================
          MODAL DETAIL TIKET
      ========================= */}

      {selectedTicket && (

        <div
          className="report-modal-overlay no-print"
          onClick={() =>
            setSelectedTicket(null)
          }
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'rgba(15,23,42,.62)',
            backdropFilter:
              'blur(5px)',
            display: 'flex',
            alignItems:
              'center',
            justifyContent:
              'center',
            zIndex: 1200,
            padding: '18px'
          }}
        >

          <div
            className="report-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
            style={{
              width: '100%',
              maxWidth: '760px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '18px',
              boxShadow:
                '0 24px 70px rgba(0,0,0,.25)',
              overflow: 'hidden'
            }}
          >

            {/* Modal Header */}

            <div
              style={{
                background:
                  'linear-gradient(135deg, #064e3b, #047857)',
                padding:
                  '20px 22px',
                color: '#ffffff'
              }}
            >

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'flex-start',
                  gap: '15px'
                }}
              >

                <div>

                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: '#a7f3d0',
                      textTransform:
                        'uppercase',
                      letterSpacing:
                        '.08em',
                      marginBottom:
                        '5px'
                    }}
                  >
                    Detail Laporan
                    Tiket
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize:
                        '1.2rem',
                      fontWeight:
                        '800',
                      color:
                        '#ffffff'
                    }}
                  >
                    HD-
                    {selectedTicket.id}
                  </h3>

                  <div
                    style={{
                      marginTop:
                        '5px',
                      color:
                        '#d1fae5',
                      fontSize:
                        '12px'
                    }}
                  >
                    {selectedTicket.judul ||
                      'Tanpa judul'}
                  </div>

                </div>

                <button
                  className="report-close-btn"
                  onClick={() =>
                    setSelectedTicket(
                      null
                    )
                  }
                  style={{
                    width: '32px',
                    height: '32px',
                    flexShrink: 0,
                    borderRadius:
                      '9px',
                    border:
                      '1px solid rgba(255,255,255,.18)',
                    background:
                      'rgba(255,255,255,.10)',
                    color:
                      '#ffffff',
                    cursor:
                      'pointer',
                    fontSize:
                      '20px',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>

              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap:
                    'wrap',
                  gap: '7px',
                  marginTop:
                    '14px'
                }}
              >

                <span
                  style={{
                    display:
                      'inline-flex',
                    alignItems:
                      'center',
                    gap: '5px',
                    padding:
                      '5px 9px',
                    borderRadius:
                      '7px',
                    background:
                      'rgba(255,255,255,.10)',
                    border:
                      '1px solid rgba(255,255,255,.12)',
                    color:
                      '#ffffff',
                    fontSize:
                      '10px',
                    fontWeight:
                      '700'
                  }}
                >
                  {statusLabel[
                    selectedTicket
                      .status
                  ] ||
                    selectedTicket.status}
                </span>

                <span
                  style={{
                    display:
                      'inline-flex',
                    alignItems:
                      'center',
                    padding:
                      '5px 9px',
                    borderRadius:
                      '7px',
                    background:
                      'rgba(255,255,255,.10)',
                    border:
                      '1px solid rgba(255,255,255,.12)',
                    color:
                      '#d1fae5',
                    fontSize:
                      '10px',
                    fontWeight:
                      '700'
                  }}
                >
                  {selectedTicket.nama_kategori ||
                    'Tanpa kategori'}
                </span>

              </div>

            </div>

            {/* Modal Body */}

            <div
              style={{
                padding:
                  '20px 22px'
              }}
            >

              {/* Info */}

              <div
                className="report-modal-content"
                style={{
                  display:
                    'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '10px',
                  marginBottom:
                    '14px'
                }}
              >

                {[
                  [
                    'Pelapor',
                    selectedTicket.pelapor_nama
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
                    'Prioritas',
                    selectedTicket.prioritas
                  ],
                  [
                    'Dibuat',
                    formatDateTime(
                      selectedTicket.created_at
                    )
                  ],
                  [
                    'Selesai',
                    formatDateTime(
                      selectedTicket.status ===
                        'RESOLVED'
                        ? selectedTicket.resolved_at
                        : selectedTicket.status ===
                          'CLOSED'
                          ? selectedTicket.closed_at
                          : null
                    )
                  ]
                ].map(
                  ([label, value]) => (

                    <div
                      key={label}
                      className="report-info-card"
                      style={{
                        background:
                          '#f8fafc',
                        border:
                          '1px solid #e2e8f0',
                        borderRadius:
                          '10px',
                        padding:
                          '11px 12px'
                      }}
                    >

                      <div
                        style={{
                          fontSize:
                            '10px',
                          color:
                            '#64748b',
                          marginBottom:
                            '4px',
                          fontWeight:
                            '600'
                        }}
                      >
                        {label}
                      </div>

                      <div
                        style={{
                          fontSize:
                            '12px',
                          color:
                            '#0f172a',
                          fontWeight:
                            '700',
                          wordBreak:
                            'break-word'
                        }}
                      >
                        {value ||
                          '-'}
                      </div>

                    </div>
                  )
                )}

              </div>

              {/* Tindakan */}

              <div
                className="report-info-card"
                style={{
                  border:
                    '1px solid #d1fae5',
                  background:
                    '#f0fdf4',
                  borderRadius:
                    '11px',
                  padding:
                    '14px',
                  marginBottom:
                    '10px'
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '7px',
                    marginBottom:
                      '7px'
                  }}
                >

                  <span
                    style={{
                      width: '25px',
                      height: '25px',
                      display:
                        'grid',
                      placeItems:
                        'center',
                      borderRadius:
                        '7px',
                      background:
                        '#dcfce7',
                      color:
                        '#15803d',
                      fontSize:
                        '11px',
                      fontWeight:
                        '800'
                    }}
                  >
                    01
                  </span>

                  <strong
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#166534'
                    }}
                  >
                    Tindakan
                    Perbaikan
                  </strong>

                </div>

                <div
                  style={{
                    fontSize:
                      '12px',
                    lineHeight:
                      '1.6',
                    color:
                      '#334155',
                    whiteSpace:
                      'pre-wrap'
                  }}
                >
                  {selectedTicket.tindakan ||
                    'Tidak ada tindakan yang dicatat.'}
                </div>

              </div>

              {/* Hasil */}

              <div
                className="report-info-card"
                style={{
                  border:
                    '1px solid #dbeafe',
                  background:
                    '#f8fafc',
                  borderRadius:
                    '11px',
                  padding:
                    '14px',
                  marginBottom:
                    '16px'
                }}
              >

                <div
                  style={{
                    display:
                      'flex',
                    alignItems:
                      'center',
                    gap: '7px',
                    marginBottom:
                      '7px'
                  }}
                >

                  <span
                    style={{
                      width: '25px',
                      height: '25px',
                      display:
                        'grid',
                      placeItems:
                        'center',
                      borderRadius:
                        '7px',
                      background:
                        '#e0f2fe',
                      color:
                        '#0369a1',
                      fontSize:
                        '11px',
                      fontWeight:
                        '800'
                    }}
                  >
                    02
                  </span>

                  <strong
                    style={{
                      fontSize:
                        '12px',
                      color:
                        '#0f172a'
                    }}
                  >
                    Hasil / Solusi
                    Akhir
                  </strong>

                </div>

                <div
                  style={{
                    fontSize:
                      '12px',
                    lineHeight:
                      '1.6',
                    color:
                      '#334155',
                    whiteSpace:
                      'pre-wrap'
                  }}
                >
                  {selectedTicket.hasil ||
                    'Tidak ada hasil atau solusi yang dicatat.'}
                </div>

              </div>

              {/* Footer */}

              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'flex-end',
                  paddingTop:
                    '13px',
                  borderTop:
                    '1px solid #e2e8f0'
                }}
              >

                <button
                  className="report-close-btn"
                  onClick={() =>
                    setSelectedTicket(
                      null
                    )
                  }
                  style={{
                    padding:
                      '9px 16px',
                    borderRadius:
                      '8px',
                    border:
                      '1px solid #cbd5e1',
                    background:
                      '#ffffff',
                    color:
                      '#334155',
                    cursor:
                      'pointer',
                    fontSize:
                      '11px',
                    fontWeight:
                      '800'
                  }}
                >
                  Tutup
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}