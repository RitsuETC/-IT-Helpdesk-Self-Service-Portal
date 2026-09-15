import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from './api.js'

const COLORS = ['#047857', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b']
const statusLabels = { NEW: 'New', ASSIGNED: 'Assigned', IN_PROGRESS: 'In Progress', WAITING: 'Waiting', RESOLVED: 'Resolved', CLOSED: 'Closed' }

const cardStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)' }

export default function TicketCharts({ token, onError }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const result = await api('/tickets', { token })
        if (active) setTickets(result.data || [])
      } catch (error) {
        if (!error.sessionExpired) onError?.(error.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    if (token) load()
    else setLoading(false)
    return () => { active = false }
  }, [token, onError])

  const { categoryData, statusData, resolutionRate, resolvedCount } = useMemo(() => {
    const categories = new Map()
    const statuses = new Map()
    tickets.forEach((ticket) => {
      const category = ticket.nama_kategori || ticket.kategori || 'Lainnya'
      categories.set(category, (categories.get(category) || 0) + 1)
      const status = String(ticket.status || 'NEW').toUpperCase()
      statuses.set(status, (statuses.get(status) || 0) + 1)
    })
    const done = tickets.filter((ticket) => ['RESOLVED', 'CLOSED'].includes(ticket.status)).length
    return {
      categoryData: [...categories].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      statusData: [...statuses].map(([status, total]) => ({ name: statusLabels[status] || status, total })),
      resolvedCount: done,
      resolutionRate: tickets.length ? Math.round((done / tickets.length) * 100) : 0,
    }
  }, [tickets])

  if (loading) return <p style={{ color: '#64748b', margin: '0 0 20px' }}>Memuat analitik tiket...</p>

  return <section className="ticket-analytics no-print" style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'end', marginBottom: '12px', flexWrap: 'wrap' }}>
      <div><h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.05rem' }}>Analitik Tiket</h3><p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.82rem' }}>Ringkasan seluruh tiket yang dapat diakses.</p></div>
      <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{tickets.length} tiket tercatat</span>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(190px, .75fr) minmax(260px, 1.2fr) minmax(260px, 1.2fr)', gap: '14px' }}>
      <article style={{ ...cardStyle, background: 'linear-gradient(145deg, #ecfdf5, #ffffff)', borderColor: '#a7f3d0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <small style={{ color: '#047857', fontWeight: 800, letterSpacing: '.06em' }}>RESOLUTION RATE</small>
        <strong style={{ color: '#065f46', fontSize: '2.75rem', lineHeight: 1.1, marginTop: '8px' }}>{resolutionRate}%</strong>
        <p style={{ color: '#475569', fontSize: '.82rem', margin: '8px 0 0' }}>{resolvedCount} dari {tickets.length} tiket telah diselesaikan atau ditutup.</p>
      </article>

      <article style={cardStyle}>
        <h4 style={{ margin: '0 0 8px', color: '#334155', fontSize: '.9rem' }}>Distribusi per Kategori</h4>
        {categoryData.length ? <ResponsiveContainer width="100%" height={220}><PieChart>
          <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
            {categoryData.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => [`${value} tiket`, 'Jumlah']} /><Legend wrapperStyle={{ fontSize: '12px' }} />
        </PieChart></ResponsiveContainer> : <EmptyChart />}
      </article>

      <article style={cardStyle}>
        <h4 style={{ margin: '0 0 8px', color: '#334155', fontSize: '.9rem' }}>Jumlah Tiket per Status</h4>
        {statusData.length ? <ResponsiveContainer width="100%" height={220}><BarChart data={statusData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value} tiket`, 'Jumlah']} />
          <Bar dataKey="total" name="Tiket" fill="#047857" radius={[5, 5, 0, 0]} />
        </BarChart></ResponsiveContainer> : <EmptyChart />}
      </article>
    </div>
  </section>
}

function EmptyChart() {
  return <div style={{ height: 220, display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: '.85rem' }}>Belum ada data tiket.</div>
}
