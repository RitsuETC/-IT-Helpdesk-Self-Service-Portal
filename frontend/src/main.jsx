import { createRoot } from 'react-dom/client'
import { useEffect, useState } from 'react'
import './style.css'
import ummuhaniLogo from './assets/ummuhani-logo.png'
import { api } from './api.js'
import Dashboard from './dashboard.jsx'
import Troubleshooting from './troubleshooting.jsx'
import Tickets from './tickets.jsx'
import Knowledge from './knowledge.jsx'
import Admin from './admin.jsx'

const savedSession = JSON.parse(localStorage.getItem('helpdesk-session') || 'null')

function App() {
  const [page, setPage] = useState('landing')
  const [session, setSession] = useState(savedSession)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)
  const [articles, setArticles] = useState([])
  const [notice, setNotice] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

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
      setNotice(error.message)
    }
  }

  useEffect(() => { loadArticles() }, [session])

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
      {/* Header dengan Navbar Position Rata Tengah */}
      <header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 32px' }}>
        <button className="logo-button" onClick={() => setPage('landing')} aria-label="Ke Beranda" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <img className="logo" src={ummuhaniLogo} alt="Ummuhani" style={{ height: '36px', width: 'auto' }} />
          <h1 className="header-title" style={{ fontSize: '1.2rem', margin: 0, fontWeight: 'bold' }}>IT Helpdesk</h1>
        </button>

        {/* Navigasi Rata Tengah */}
        <nav aria-label="Navigasi utama" style={{ display: 'flex', gap: '16px', alignItems: 'center', margin: '0 auto' }}>
          <button onClick={() => setPage('landing')}>Beranda</button>
          <button onClick={() => scrollToSection('sec-pesan')}>Pesan Tiket</button>
          <button 
            onClick={() => {
              if (!session) {
                setShowLoginModal(true)
              } else {
                scrollToSection('sec-status')
              }
            }} 
            style={{ position: 'relative' }}
          >
            Status Tiket
            {session && (session.user.role === 'admin' || session.user.role === 'teknisi') && unreadNotifications > 0 && (
              <span className="nav-badge">{unreadNotifications}</span>
            )}
          </button>
          <button onClick={() => scrollToSection('sec-riwayat')}>Riwayat Tiket</button>
          <button onClick={() => scrollToSection('sec-knowledge')}>Knowledge Base</button>
        </nav>

        <div className="account-action">
          {session ? (
            <button className="account" onClick={() => setShowSidebar(true)}>
              <span>👤</span>
              <span>Akun</span>
            </button>
          ) : (
            <button className="login-nav-btn" onClick={() => setShowLoginModal(true)}>Login</button>
          )}
        </div>
      </header>

      {notice && <p className="app-notice" role="alert">{notice}</p>}

      {/* Landing Page Tampilan Bento Grid Layout */}
      {page === 'landing' && (
        <section className="bento-container" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gridTemplateRows: 'auto auto',
          gap: '20px',
          padding: '24px',
          maxWidth: '1280px',
          margin: '0 auto'
        }}>
          {/* Bento Box 1: Quick Action Pesan Tiket */}
          <div id="sec-pesan" className="bento-box" style={{ gridColumn: '1 / 2', gridRow: '1 / 2', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 'bold' }}>Layanan Mandiri</span>
              <h2 style={{ fontSize: '1.5rem', margin: '10px 0', color: '#0f172a' }}>Ada Masalah IT?</h2>
              <p style={{ color: '#475569', fontSize: '0.95rem' }}>Laporkan gangguan atau permintaan layanan baru secara langsung ke tim teknisi.</p>
            </div>
            <button 
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px',
                fontSize: '1rem'
              }}
              onClick={() => {
                if (!session) {
                  setShowLoginModal(true)
                } else {
                  setPage('tickets')
                }
              }}
            >
              + Buat Tiket Sekarang
            </button>
          </div>

          {/* Bento Box 2: Status Tiket Aktif & Ringkasan */}
          <div id="sec-status" className="bento-box" style={{ gridColumn: '2 / 3', gridRow: '1 / 2', background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem' }}>Status Tiket Aktif</h3>
            <Dashboard 
              token={session?.token} 
              user={session?.user} 
              onTroubleshooting={() => scrollToSection('sec-knowledge')} 
              onTickets={() => setPage('tickets')} 
              onKnowledge={() => scrollToSection('sec-knowledge')} 
              onRequireLogin={() => setShowLoginModal(true)}
            />
          </div>

          {/* Bento Box 4: Riwayat Tiket */}
          <div id="sec-riwayat" className="bento-box" style={{ gridColumn: '1 / 2', gridRow: '2 / 3', background: '#ffffff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Riwayat Tiket</h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>Daftar penanganan tiket yang telah selesai.</p>
            <Tickets 
              token={session?.token} 
              user={session?.user} 
              onError={setNotice} 
              onRequireLogin={() => setShowLoginModal(true)}
              historyOnly 
            />
          </div>

          {/* Bento Box 3: Knowledge Base & Troubleshooting */}
          <div id="sec-knowledge" className="bento-box" style={{ gridColumn: '2 / 3', gridRow: '2 / 3', background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.2rem' }}>Knowledge Base & Solusi Mandiri</h3>
            <Troubleshooting 
              articles={articles} 
              onOpenArticle={(article) => { setSelectedArticle(article); setPage('knowledge') }} 
            />
          </div>
        </section>
      )}

      {/* Halaman khusus jika membuka tiket/knowledge secara full */}
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

      {/* Sidebar Akun Presisi */}
      {showSidebar && session && (
        <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)}>
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
              zIndex: 1000,
              boxShadow: '-2px 0 10px rgba(0,0,0,0.1)'
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