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
  const [page, setPage] = useState(savedSession ? 'dashboard' : 'login')
  const [session, setSession] = useState(savedSession)
  const [showSidebar, setShowSidebar] = useState(false)
  const [articles, setArticles] = useState([])
  const [notice, setNotice] = useState('')
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const loadArticles = async () => {
    if (!session) return
    try {
      setArticles((await api('/knowledge', { token: session.token })).data)
    } catch (error) {
      // If token expired/invalid, silently logout and avoid blocking popup on reload
      if (error && error.status === 401) {
        localStorage.removeItem('helpdesk-session')
        setSession(null)
        setArticles([])
        setPage('login')
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
    timer = setInterval(loadUnread, 30000)
    return () => clearInterval(timer)
  }, [session])

  const handleLogin = async (event) => {
    event.preventDefault(); setNotice('')
    const form = new FormData(event.currentTarget)
    try {
      const result = await api('/auth/login', { method: 'POST', body: { username: form.get('username'), password: form.get('password') } })
      const nextSession = { token: result.token, user: result.user }
      localStorage.setItem('helpdesk-session', JSON.stringify(nextSession))
      setSession(nextSession); setPage('dashboard')
    } catch (error) { setNotice(error.message) }
  }

  const logout = () => {
    localStorage.removeItem('helpdesk-session')
    setSession(null); setArticles([]); setShowSidebar(false); setPage('login')
  }

  return <main className="app">
    <header className="header">
      <button className="logo-button" onClick={() => session && setPage('dashboard')} aria-label="Ke Dashboard"><img className="logo" src={ummuhaniLogo} alt="Ummuhani" /></button>
      <h1 className="header-title">IT Helpdesk</h1>
      {session && <nav aria-label="Navigasi utama">
        <button onClick={() => setPage('dashboard')}>Dashboard</button>
        <button onClick={() => setPage('troubleshooting')}>Troubleshooting</button>
        <button onClick={() => setPage('tickets')} style={{ position: 'relative' }}>
          Tiket Saya
          {(session.user.role === 'admin' || session.user.role === 'teknisi') && unreadNotifications > 0 && (
            <span className="nav-badge">{unreadNotifications}</span>
          )}
        </button>
        <button onClick={() => setPage('ticket-history')}>Riwayat Tiket</button>
        <button onClick={() => { setSelectedArticle(null); setPage('knowledge') }}>Knowledge Base</button>
        <button onClick={() => setShowSidebar(true)}>Akun</button>
      </nav>}
      <span className="account" aria-hidden="true">●</span>
    </header>

    {notice && <p className="app-notice" role="alert">{notice}</p>}
   {page === 'login' && (
  <section className="login-card" aria-label="Login">
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
)}
    {session && page === 'dashboard' && <Dashboard token={session.token} user={session.user} onTroubleshooting={() => setPage('troubleshooting')} onTickets={() => setPage('tickets')} onKnowledge={() => setPage('knowledge')} />}
    {session && page === 'troubleshooting' && <Troubleshooting articles={articles} onOpenArticle={(article) => { setSelectedArticle(article); setPage('knowledge') }} />}
    {session && page === 'tickets' && <Tickets token={session.token} user={session.user} onError={setNotice} />}
    {session && page === 'ticket-history' && <Tickets token={session.token} user={session.user} onError={setNotice} historyOnly />}
    {session && page === 'knowledge' && <Knowledge articles={articles} initialArticle={selectedArticle} />}
    {(session?.user.role === 'admin' || session?.user.role === 'teknisi') && page === 'admin' && <Admin token={session.token} user={session.user} articles={articles} onChanged={loadArticles} onError={setNotice} />}

    {showSidebar && <div className="sidebar-backdrop" onClick={() => setShowSidebar(false)}><aside className="account-sidebar" aria-label="Menu akun" onClick={(event) => event.stopPropagation()}>
      <button className="sidebar-close" onClick={() => setShowSidebar(false)} aria-label="Tutup menu">×</button><img src={ummuhaniLogo} alt="Ummuhani" />
      <h2>Akun</h2><section className="profile-card"><span className="profile-initial">{session.user.username[0].toUpperCase()}</span><div><b>{session.user.username}</b><small>{session.user.email}</small><em>{session.user.role}</em></div></section>
      <button className="logout" onClick={logout}>Logout</button>
      {session.user.role === 'admin' && <button className="admin-menu" onClick={() => { setShowSidebar(false); setPage('admin') }}>Admin Knowledge</button>}
    </aside></div>}
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
