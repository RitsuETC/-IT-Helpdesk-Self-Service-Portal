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
  const [page, setPage] = useState('dashboard')
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
    setPage('dashboard')
  }

  return (
    <main className="app">
      <header className="header">
        <button className="logo-button" onClick={() => setPage('dashboard')} aria-label="Ke Dashboard">
          <img className="logo" src={ummuhaniLogo} alt="Ummuhani" />
        </button>
        <h1 className="header-title">IT Helpdesk</h1>

        <nav aria-label="Navigasi utama">
          <button onClick={() => setPage('dashboard')}>Dashboard</button>
          <button onClick={() => setPage('troubleshooting')}>Troubleshooting</button>
          <button 
            onClick={() => {
              if (!session) {
                setShowLoginModal(true)
              } else {
                setPage('tickets')
              }
            }} 
            style={{ position: 'relative' }}
          >
            Tiket Saya
            {session && (session.user.role === 'admin' || session.user.role === 'teknisi') && unreadNotifications > 0 && (
              <span className="nav-badge">{unreadNotifications}</span>
            )}
          </button>
          <button onClick={() => setPage('ticket-history')}>Riwayat Tiket</button>
          <button onClick={() => { setSelectedArticle(null); setPage('knowledge') }}>Knowledge Base</button>
          
          {session ? (
            <button onClick={() => setShowSidebar(true)}>Akun</button>
          ) : (
            <button className="login-nav-btn" onClick={() => setShowLoginModal(true)}>Login</button>
          )}
        </nav>
        <span className="account" aria-hidden="true">●</span>
      </header>

      {notice && <p className="app-notice" role="alert">{notice}</p>}

      {page === 'dashboard' && (
        <Dashboard 
          token={session?.token} 
          user={session?.user} 
          onTroubleshooting={() => setPage('troubleshooting')} 
          onTickets={() => setPage('tickets')} 
          onKnowledge={() => setPage('knowledge')} 
          onRequireLogin={() => setShowLoginModal(true)}
        />
      )}
      
      {page === 'troubleshooting' && (
        <Troubleshooting 
          articles={articles} 
          onOpenArticle={(article) => { setSelectedArticle(article); setPage('knowledge') }} 
        />
      )}
      
      {page === 'tickets' && (
        <Tickets 
          token={session?.token} 
          user={session?.user} 
          onError={setNotice} 
          onRequireLogin={() => setShowLoginModal(true)}
        />
      )}
      
      {page === 'ticket-history' && (
        <Tickets 
          token={session?.token} 
          user={session?.user} 
          onError={setNotice} 
          onRequireLogin={() => setShowLoginModal(true)}
          historyOnly 
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