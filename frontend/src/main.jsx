import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './style.css'
import ummuhaniLogo from './assets/ummuhani-logo.png'
import { api } from './api.js'
import Dashboard from './dashboard.jsx'
import Troubleshooting from './troubleshooting.jsx'
import Tickets from './tickets.jsx'
import HistoryCarousel from './history.jsx'
import Knowledge from './knowledge.jsx'
import Admin from './admin.jsx'
import Report from './report.jsx'
import Inventory from './inventory.jsx'

const savedSession = JSON.parse(localStorage.getItem('helpdesk-session') || 'null')

function App() {
  const [page, setPage] = useState('landing')
  const [session, setSession] = useState(savedSession)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false) // State khusus pop-up form buat tiket
  const [showSidebar, setShowSidebar] = useState(false)
  const [articles, setArticles] = useState([])
  const [notice, setNotice] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  // State untuk form input tiket langsung di modal
  const [ticketForm, setTicketForm] = useState({ title: '', category: 'Hardware', roomId: '', description: '' })
  const [rooms, setRooms] = useState([])

  const loadArticles = async () => {
    try {
      const res = await api('/knowledge', session ? { token: session.token } : {})
      setArticles(res.data || [])
    } catch (error) {
      if (error && error.status === 401) {
        localStorage.removeItem('helpdesk-session')
        setSession(null)
        setArticles([])
        return
      }
      if (!session) {
        setArticles([])
      } else {
        setNotice(error.message)
      }
    }
  }

  const loadRooms = async () => {
    try {
      const res = await api('/rooms', session ? { token: session.token } : {})
      setRooms(res.data || [])
    } catch (err) {
      // ignore or handle
    }
  }

  useEffect(() => { loadArticles() }, [session])
  useEffect(() => { if (showCreateTicketModal) loadRooms() }, [showCreateTicketModal])

  useEffect(() => {
    let timer
    async function loadUnread() {
      if (!session) return setUnreadNotifications(0)
      try {
        if (session.user.role === 'admin' || session.user.role === 'teknisi') {
          const res = await api('/notifications/unread/count', { token: session.token })
          setUnreadNotifications(res.data.unread || 0)
        } else {
          setUnreadNotifications(0)
        }
      } catch (err) {
        // ignore
      }
    }
    loadUnread()
    timer = setInterval(loadUnread, 3000)
    return () => clearInterval(timer)
  }, [session])

  const handleLogin = async (event) => {
    event.preventDefault()
    setNotice('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await api('/auth/login', { 
        method: 'POST', 
        body: { username: form.get('username'), password: form.get('password') } 
      })
      const nextSession = { token: result.token, user: result.user }
      localStorage.setItem('helpdesk-session', JSON.stringify(nextSession))
      setSession(nextSession)
      setShowLoginModal(false)
    } catch (error) { 
      setNotice(error.message) 
    }
  }

  const handleCreateTicketSubmit = async (e) => {
    e.preventDefault()
    try {
      await api('/tickets', {
        method: 'POST',
        token: session.token,
        body: ticketForm
      })
      setShowCreateTicketModal(false)
      setTicketForm({ title: '', category: 'Hardware', roomId: '', description: '' })
      setNotice('Tiket berhasil dikirim!')
      // Refresh atau arahkan jika perlu
    } catch (err) {
      setNotice(err.message)
    }
  }

  const logout = () => {
    localStorage.removeItem('helpdesk-session')
    setSession(null)
    setShowSidebar(false)
    setPage('landing')
  }

  const scrollToSection = (id) => {
    if (page !== 'landing') {
      setPage('landing')
      setTimeout(() => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } else {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <main className="app">
      {/* Header dengan Nuansa Hijau Tua Gradasi & Navigasi Interaktif */}
      <header className="header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '12px 32px',
        background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)',
        color: '#ffffff',
        boxShadow: '0 4px 20px rgba(12, 74, 48, 0.2)'
      }}>
        <button className="logo-button" onClick={() => setPage('landing')} aria-label="Ke Beranda" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <img className="logo" src={ummuhaniLogo} alt="Ummuhani" style={{ height: '36px', width: 'auto' }} />
          <h1 className="header-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold', color: '#ffffff' }}>IT Helpdesk</h1>
        </button>

        {/* Navigasi Rata Tengah dengan Pill Wrapper */}
        <nav aria-label="Navigasi utama" style={{ 
          display: 'flex', 
          gap: '6px', 
          alignItems: 'center', 
          margin: '0 auto',
          background: 'rgba(255, 255, 255, 0.08)',
          padding: '6px 10px',
          borderRadius: '30px',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.12)'
        }}>
          <button 
            onClick={() => setPage('landing')}
            style={{ background: 'transparent', border: 'none', color: '#e2f0ea', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Beranda
          </button>
          <button 
            onClick={() => scrollToSection('sec-pesan')}
            style={{ background: 'transparent', border: 'none', color: '#e2f0ea', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Pesan Tiket
          </button>
          <button 
            onClick={() => {
              if (!session) {
                setShowLoginModal(true)
              } else {
                scrollToSection('sec-status')
              }
            }} 
            style={{ position: 'relative', background: 'transparent', border: 'none', color: '#e2f0ea', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Status Tiket
            {session && (session.user.role === 'admin' || session.user.role === 'teknisi') && unreadNotifications > 0 && (
              <span className="nav-badge" style={{ position: 'absolute', top: '2px', right: '4px', background: '#dc2626', color: '#fff', fontSize: '10px', padding: '1px 5px', borderRadius: '10px', fontWeight: 'bold' }}>{unreadNotifications}</span>
            )}
          </button>
          <button 
            onClick={() => scrollToSection('sec-knowledge')}
            style={{ background: 'transparent', border: 'none', color: '#e2f0ea', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
          >
            Knowledge Base
          </button>
          {(session?.user.role === 'admin' || session?.user.role === 'teknisi') && (
            <button 
              onClick={() => { if (!session) { setShowLoginModal(true) } else { setPage('report') } }}
              style={{ background: 'transparent', border: 'none', color: '#e2f0ea', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Laporan
            </button>
          )}
          {(session?.user.role === 'admin' || session?.user.role === 'teknisi') && (
            <button 
              onClick={() => setPage('inventory')}
              style={{ background: 'transparent', border: 'none', color: '#e2f0ea', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
            >
              Inventaris
            </button>
          )}
        </nav>

        <div className="account-action">
          {session ? (
            <button 
              className="account" 
              onClick={() => setShowSidebar(true)}
              style={{
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              <span>👤</span>
              <span>Akun</span>
            </button>
          ) : (
            <button 
              className="login-nav-btn" 
              onClick={() => setShowLoginModal(true)}
              style={{
                background: '#047857',
                color: '#ffffff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              Login
            </button>
          )}
        </div>
      </header>

      {notice && <p className="app-notice" role="alert">{notice}</p>}

      {/* Landing Page Tampilan Bento Grid Layout */}
      {page === 'landing' && (
        <section className="bento-container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '20px',
          padding: '24px',
          maxWidth: '1280px',
          margin: '0 auto',
          alignItems: 'start'
        }}>
          {/* Kolom Kiri: Layanan Mandiri & Riwayat Tiket */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bento Box 1: Quick Action Pesan Tiket */}
            <div id="sec-pesan" className="bento-box" style={{ 
              background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', 
              padding: '24px', 
              borderRadius: '16px', 
              border: '1px solid #a7f3d0', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'flex-start',
              color: '#064e3b',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)'
            }}>
              <div>
                <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#047857', fontWeight: 'bold', letterSpacing: '0.05em' }}>Layanan Mandiri</span>
                <h2 style={{ fontSize: '1.5rem', margin: '10px 0', color: '#064e3b' }}>Ada Masalah IT?</h2>
                <p style={{ color: '#047857', fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '24px' }}>Laporkan gangguan atau permintaan layanan baru secara langsung ke tim teknisi.</p>
              </div>
              <button 
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => {
                  if (!session) {
                    setShowLoginModal(true)
                  } else {
                    setShowCreateTicketModal(true) // Langsung buka pop-up form buat tiket
                  }
                }}
              >
                + Buat Tiket Sekarang
              </button>
            </div>

            {/* Bento Box 4: Riwayat Tiket */}
            <div id="sec-riwayat" className="bento-box" style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Riwayat Tiket</h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>Daftar penanganan tiket yang telah selesai.</p>
              <HistoryCarousel token={session?.token} user={session?.user} onError={setNotice} />
            </div>
          </div>

          {/* Kolom Kanan: Status Tiket Aktif & Knowledge Base */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Bento Box 2: Status Tiket Aktif & Ringkasan */}
            <div id="sec-status" className="bento-box" style={{ background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Status Tiket Aktif</h3>
              <Dashboard 
                token={session?.token} 
                user={session?.user} 
                onTroubleshooting={() => scrollToSection('sec-knowledge')} 
                onTickets={() => setPage('tickets')} // Kembali normal mengarah ke halaman penuh daftar tiket
                onKnowledge={() => scrollToSection('sec-knowledge')} 
                onRequireLogin={() => setShowLoginModal(true)}
                showHistory={false}
              />
            </div>

            {/* Bento Box 3: Knowledge Base & Troubleshooting */}
            <div id="sec-knowledge" className="bento-box" style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Knowledge Base & Solusi Mandiri</h3>
              <Troubleshooting 
                articles={articles} 
                onOpenArticle={(article) => { setSelectedArticle(article); setPage('knowledge') }} 
              />
            </div>
          </div>
        </section>
      )}

      {/* Halaman Daftar Tiket (Dikembalikan Normal sebagai Halaman Penuh) */}
      {page === 'tickets' && (
        <Tickets 
          token={session?.token} 
          user={session?.user} 
          onError={setNotice} 
          onRequireLogin={() => setShowLoginModal(true)}
        />
      )}

      {page === 'knowledge' && (
        <Knowledge 
          articles={articles} 
          initialArticle={selectedArticle} 
        />
      )}

      {(session?.user.role === 'admin' || session?.user.role === 'teknisi') && page === 'admin' && (
        <Admin 
          token={session.token} 
          user={session.user} 
          articles={articles} 
          onChanged={loadArticles} 
          onError={setNotice} 
        />
      )}

      {(session?.user.role === 'admin' || session?.user.role === 'teknisi') && page === 'report' && (
        <Report 
          token={session.token} 
          user={session.user} 
          onBack={() => setPage('landing')} 
          onError={setNotice} 
        />
      )}

      {(session?.user.role === 'admin' || session?.user.role === 'teknisi') && page === 'inventory' && (
        <Inventory
          token={session.token}
          user={session.user}
          onBack={() => setPage('landing')}
          onError={setNotice}
        />
      )}

      {/* Popup Login Modal */}
      {showLoginModal && (
        <div className="modal-backdrop" onClick={() => setShowLoginModal(false)}>
          <section className="login-card" aria-label="Login" onClick={(e) => e.stopPropagation()}>
            <button className="close-ticket-form" onClick={() => setShowLoginModal(false)} aria-label="Tutup modal">×</button>
            <div className="login-brand">
              <img src={ummuhaniLogo} alt="Ummuhani" />
              <h2>IT Helpdesk</h2>
              <p>Self-Service Portal</p>
            </div>

            <form onSubmit={handleLogin}>
              <label>
                Username
                <input
                  name="username"
                  autoComplete="username"
                  placeholder="Masukkan username"
                  required
                />
              </label>

              <label>
                Password
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  required
                />
              </label>

              <button className="login" type="submit">
                Login
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Popup Khusus Form Buat Tiket (Sesuai Gambar Referensi Anda) */}
      {showCreateTicketModal && (
        <div 
          className="modal-backdrop" 
          onClick={() => setShowCreateTicketModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9998
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              background: '#fff', 
              padding: '28px', 
              borderRadius: '16px', 
              maxWidth: '550px', 
              width: '90%', 
              position: 'relative', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }}
          >
            <button 
              onClick={() => setShowCreateTicketModal(false)} 
              style={{ 
                position: 'absolute', 
                top: '16px', 
                right: '20px', 
                background: 'none', 
                border: 'none', 
                fontSize: '1.5rem', 
                cursor: 'pointer',
                color: '#64748b',
                fontWeight: 'bold'
              }}
              aria-label="Tutup modal"
            >
              ×
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <span style={{ background: '#d1fae5', color: '#065f46', padding: '6px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem' }}>Buat Tiket Baru</span>
            </div>

            <form onSubmit={handleCreateTicketSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>Judul Kendala</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Printer Rusak"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>Kategori</label>
                <select 
                  value={ticketForm.category}
                  onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="Hardware">Hardware</option>
                  <option value="Software">Software</option>
                  <option value="Jaringan">Jaringan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>Lokasi / Ruangan</label>
                <select 
                  value={ticketForm.roomId}
                  onChange={(e) => setTicketForm({ ...ticketForm, roomId: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="">-- Pilih Ruangan --</option>
                  {rooms.map(room => (
                    <option key={room.id} value={room.id}>{room.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '6px', color: '#334155' }}>Deskripsi Masalah</label>
                <textarea 
                  rows="4"
                  placeholder="Jelaskan kendala secara rinci..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.95rem', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  marginTop: '8px',
                  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.2)'
                }}
              >
                Kirim Laporan Tiket
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Akun Presisi */}
      {showSidebar && session && (
        <div 
          className="sidebar-backdrop" 
          onClick={() => setShowSidebar(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 9998
          }}
        >
          <aside 
            className="account-sidebar" 
            aria-label="Menu akun" 
            onClick={(event) => event.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              padding: '20px',
              maxWidth: '320px',
              width: '100%',
              height: '100vh',
              position: 'fixed',
              right: 0,
              top: 0,
              backgroundColor: '#ffffff',
              zIndex: 9999,
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)'
            }}
          >
            <div>
              <button className="sidebar-close" onClick={() => setShowSidebar(false)} aria-label="Tutup menu">×</button>
              <img 
                src={ummuhaniLogo} 
                alt="Ummuhani" 
                style={{ width: '120px', height: 'auto', display: 'block', margin: '0 auto 16px auto' }} 
              />
              <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', textAlign: 'center' }}>Akun</h2>
              <section className="profile-card">
                <span className="profile-initial">{session.user.username[0].toUpperCase()}</span>
                <div>
                  <b>{session.user.username}</b>
                  <small>{session.user.email}</small>
                  <em>{session.user.role}</em>
                </div>
              </section>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: 'auto' }}>
              {session.user.role === 'admin' && (
                <button className="admin-menu" onClick={() => { setShowSidebar(false); setPage('admin') }}>
                  Admin Knowledge
                </button>
              )}
              {(session.user.role === 'admin' || session.user.role === 'teknisi') && (
                <button className="admin-menu" onClick={() => { setShowSidebar(false); setPage('inventory') }}>
                  Inventaris
                </button>
              )}
              <button 
                className="logout" 
                onClick={logout}
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  width: '100%'
                }}
              >
                Logout
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  )
}

createRoot(document.getElementById('root')).render(<App />)