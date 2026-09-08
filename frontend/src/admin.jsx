import { useEffect, useState } from 'react'
import { api } from './api.js'
import { confirmAction } from './confirm.js'

const emptyKnowledge = {
  tags: [], // Disimpan dalam bentuk array tag
  judul: '',
  content: '',
  video_url: ''
}

function Admin({ token, articles, onChanged, onError, user }) {
  const [knowledge, setKnowledge] = useState(emptyKnowledge)
  const [editingId, setEditingId] = useState(null)
  const [setup, setSetup] = useState({
    categories: [],
    rooms: [],
    users: []
  })
  const [customTagInput, setCustomTagInput] = useState('')
  const [roomName, setRoomName] = useState('')
  const [newUser, setNewUser] = useState({
    nama: '',
    email: '',
    password: '',
    role: 'user'
  })
  const [userQuery, setUserQuery] = useState('')

  const loadSetup = async () => {
    try {
      setSetup((await api('/admin/setup', { token })).data)
    } catch (error) {
      onError(error.message)
    }
  }

  useEffect(() => {
    loadSetup()
  }, [token])

  // Fungsi toggle centang/pilih tag
  const toggleTag = (tagName) => {
    setKnowledge((prev) => {
      const currentTags = Array.isArray(prev.tags) ? prev.tags : (prev.tags ? prev.tags.split(',').map(t => t.trim()) : [])
      if (currentTags.includes(tagName)) {
        return { ...prev, tags: currentTags.filter((t) => t !== tagName) }
      } else {
        return { ...prev, tags: [...currentTags, tagName] }
      }
    })
  }

  // Tambah tag kustom baru
  const handleAddCustomTag = (e) => {
    e.preventDefault()
    if (!customTagInput.trim()) return
    const newTag = customTagInput.trim()
    setKnowledge((prev) => {
      const currentTags = Array.isArray(prev.tags) ? prev.tags : (prev.tags ? prev.tags.split(',').map(t => t.trim()) : [])
      if (!currentTags.includes(newTag)) {
        return { ...prev, tags: [...currentTags, newTag] }
      }
      return prev
    })
    setCustomTagInput('')
  }

  const submitKnowledge = async (event) => {
    event.preventDefault()

    const defaultCategoryId = setup.categories[0]?.id || 1
    const tagsString = Array.isArray(knowledge.tags) ? knowledge.tags.join(', ') : (knowledge.tags || '')

    if (!tagsString.trim()) {
      onError('Pilih minimal 1 tag/kategori untuk artikel ini.')
      return
    }

    try {
      await api(
        editingId ? `/knowledge/${editingId}` : '/knowledge',
        {
          token,
          method: editingId ? 'PUT' : 'POST',
          body: {
            ...knowledge,
            id_categori: Number(knowledge.id_categori || defaultCategoryId),
            tags: tagsString,
            video_url: knowledge.video_url || null
          }
        }
      )

      setKnowledge(emptyKnowledge)
      setEditingId(null)
      await onChanged()
    } catch (error) {
      onError(error.message)
    }
  }

  const addSetup = async (event, path, value, clear) => {
    event.preventDefault()

    try {
      await api(path, {
        token,
        method: 'POST',
        body: value
      })

      clear()
      await loadSetup()
    } catch (error) {
      onError(error.message)
    }
  }

  const removeSetup = async (path, label) => {
    if (
      !(await confirmAction(
        `Hapus ${label}? Data yang masih digunakan tidak dapat dihapus.`
      ))
    ) {
      return
    }

    try {
      await api(path, {
        token,
        method: 'DELETE'
      })

      await loadSetup()
    } catch (error) {
      onError(error.message)
    }
  }

  const changeRole = async (id, role) => {
    try {
      await api(`/admin/users/${id}/role`, {
        token,
        method: 'PATCH',
        body: { role }
      })

      await loadSetup()
    } catch (error) {
      onError(error.message)
    }
  }

  const visibleUsers = setup.users.filter((user) =>
    `${user.nama} ${user.email}`
      .toLowerCase()
      .includes(userQuery.toLowerCase())
  )

  const selectedTagsList = Array.isArray(knowledge.tags) 
    ? knowledge.tags 
    : (knowledge.tags ? knowledge.tags.split(',').map(t => t.trim()).filter(Boolean) : [])

  const availableTags = [...new Set([
    ...setup.categories.map((category) => category.nama_kategori),
    ...articles.flatMap((article) => {
      const rawTags = Array.isArray(article.tags) ? article.tags : String(article.tags || '').split(',')
      return rawTags.map((tag) => tag.trim()).filter(Boolean)
    })
  ])]

  return (
    <section className="admin-page" style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px', color: '#1f2937' }}>
      <style>{`
        .admin-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 14px rgba(0,0,0,0.03);
        }
        .admin-section-heading {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f1f5f9;
        }
        .admin-section-heading h3 {
          margin: 0;
          color: #0c4a30;
          font-size: 1.2rem;
          font-weight: 700;
        }
        .admin-section-heading p {
          margin: 4px 0 0;
          color: #64748b;
          font-size: 0.825rem;
        }
        .admin-count {
          background: #ecfdf5;
          color: #15803d;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #a7f3d0;
        }
        .admin-form label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 12px;
        }
        .admin-form input, .admin-form select, .admin-form textarea {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 0.85rem;
          outline: none;
          transition: border-color 0.2s ease;
          background: #ffffff;
        }
        .admin-form input:focus, .admin-form select:focus, .admin-form textarea:focus {
          border-color: #0c4a30;
        }
        .admin-form button {
          background: #0c4a30;
          color: #ffffff;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.825rem;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .admin-form button:hover {
          background: #064e3b;
        }
        .setup-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 18px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
        }
        .setup-heading {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .setup-number {
          background: #0c4a30;
          color: #fff;
          font-weight: 800;
          font-size: 0.75rem;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .setup-list {
          list-style: none;
          padding: 0;
          margin: 16px 0 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 200px;
          overflow-y: auto;
        }
        .setup-list li {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.825rem;
        }
        .delete-setup {
          background: #fee2e2 !important;
          color: #dc2626 !important;
          border: none;
          padding: 4px 8px !important;
          border-radius: 6px;
          font-size: 0.75rem !important;
          cursor: pointer;
        }
        .role-group {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 14px;
        }
        .role-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
          text-transform: uppercase;
        }
        .role-heading h4 {
          margin: 0;
          font-size: 0.85rem;
          color: #0c4a30;
          font-weight: 800;
        }
        .role-heading span {
          background: #e2e8f0;
          color: #334155;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 10px;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #0c4a30;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.85rem;
        }
        .user-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .user-actions select {
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 0.75rem;
        }
        .user-actions button {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.75rem;
          font-weight: 700;
        }
      `}</style>

      {/* HEADER */}
      <header className="admin-header" style={{ background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', padding: '20px 24px', borderRadius: '16px', color: '#ffffff', marginBottom: '24px', boxShadow: '0 8px 20px rgba(12, 74, 48, 0.15)' }}>
        <div>
          <p className="admin-eyebrow" style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', color: '#a7f3d0', fontWeight: '700' }}>Administration</p>
          <h2 style={{ margin: '4px 0 0', fontSize: '1.5rem', fontWeight: '800' }}>Panel Admin</h2>
          <p className="admin-description" style={{ margin: '4px 0 0', color: '#e2f0ea', fontSize: '0.875rem' }}>
            Kelola knowledge base, kategori, ruangan, dan akun pengguna.
          </p>
        </div>
      </header>

      {/* KNOWLEDGE SECTION */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Knowledge Base</h3>
            <p>Kelola artikel troubleshooting yang tersedia untuk pengguna.</p>
          </div>
          <span className="admin-count">
            {articles.length} artikel
          </span>
        </div>

        <div className="admin-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          {/* KNOWLEDGE FORM */}
          <form className="admin-form" onSubmit={submitKnowledge} style={{ background: '#f8fafc', padding: '18px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div className="form-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <span className="form-icon" style={{ background: '#0c4a30', color: '#fff', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>+</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0c4a30' }}>
                  {editingId ? 'Ubah Knowledge' : 'Tambah Knowledge'}
                </h3>
                <small style={{ color: '#64748b' }}>
                  {editingId ? 'Perbarui informasi artikel' : 'Tambahkan solusi baru'}
                </small>
              </div>
            </div>

            <label>
              Judul Artikel
              <input
                value={knowledge.judul}
                onChange={(e) => setKnowledge({ ...knowledge, judul: e.target.value })}
                placeholder="Contoh: Komputer tidak menyala"
                required
              />
            </label>

            {/* OPSI MULTI-SELECT TAGS (CHECKBOX & CHIPS) */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#334155', marginBottom: '6px', display: 'block' }}>
                Pilih Multi-Tag / Kategori (Bisa Pilih Banyak)
              </label>

              {/* Tag yang sudah tersedia, termasuk tag kustom dari artikel sebelumnya */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {availableTags.map((tagName) => {
                  const isSelected = selectedTagsList.includes(tagName)
                  return (
                    <button
                      key={tagName}
                      type="button"
                      onClick={() => toggleTag(tagName)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '16px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: isSelected ? '1px solid #0c4a30' : '1px solid #cbd5e1',
                        backgroundColor: isSelected ? '#0c4a30' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}#{tagName}
                    </button>
                  )
                })}
              </div>

              {/* Input Tambah Tag Kustom */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  placeholder="Ketik tag kustom baru..."
                  style={{ flex: 1, padding: '6px 10px', fontSize: '0.775rem', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  style={{ padding: '6px 12px', background: '#15803d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Tambah Tag
                </button>
              </div>

              {/* Preview Tag Terpilih */}
              <div style={{ marginTop: '8px', fontSize: '0.725rem', color: '#0c4a30', fontWeight: '600' }}>
                Tag Terpilih: {selectedTagsList.length ? selectedTagsList.map(t => `#${t}`).join(', ') : '(Belum ada tag dipilih)'}
              </div>
            </div>

            <label>
              Isi Artikel
              <textarea
                value={knowledge.content}
                onChange={(e) => setKnowledge({ ...knowledge, content: e.target.value })}
                placeholder="Tuliskan solusi atau langkah troubleshooting..."
                rows="4"
                required
              />
            </label>

            <label>
              Link YouTube
              <input
                type="url"
                value={knowledge.video_url}
                onChange={(e) => setKnowledge({ ...knowledge, video_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </label>

            <div className="form-actions" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button type="submit" style={{ flex: 1 }}>
                {editingId ? 'Update Knowledge' : 'Simpan Knowledge'}
              </button>
              {editingId && (
                <button
                  className="cancel-edit"
                  type="button"
                  onClick={() => {
                    setKnowledge(emptyKnowledge)
                    setEditingId(null)
                  }}
                  style={{ background: '#e2e8f0', color: '#334155' }}
                >
                  Batal
                </button>
              )}
            </div>
          </form>

          {/* ARTICLE LIST */}
          <section className="admin-articles" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="articles-heading" style={{ marginBottom: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#0c4a30' }}>Artikel Tersedia</h3>
              <small style={{ color: '#64748b' }}>Daftar knowledge base saat ini</small>
            </div>

            <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {articles.length ? (
                articles.map((article) => (
                  <article key={article.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div className="article-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <b style={{ fontSize: '0.85rem', color: '#1f2937' }}>{article.judul}</b>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {(article.tags || article.nama_kategori || 'Umum').split(',').map((tag, idx) => (
                          <small key={idx} style={{ color: '#0c4a30', background: '#dcfce7', fontWeight: '700', fontSize: '0.68rem', padding: '1px 7px', borderRadius: '10px' }}>
                            #{tag.trim()}
                          </small>
                        ))}
                      </div>
                    </div>

                    <span className="article-actions" style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="edit-article"
                        type="button"
                        onClick={() => {
                          setEditingId(article.id)
                          const rawTags = article.tags || article.nama_kategori || ''
                          setKnowledge({
                            tags: rawTags.split(',').map(t => t.trim()).filter(Boolean),
                            judul: article.judul,
                            content: article.content,
                            video_url: article.video_url || ''
                          })
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        style={{ background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!(await confirmAction(`Hapus artikel “${article.judul}”?`))) return
                          try {
                            await api(`/knowledge/${article.id}`, { token, method: 'DELETE' })
                            onChanged()
                          } catch (error) {
                            onError(error.message)
                          }
                        }}
                        style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', cursor: 'pointer' }}
                      >
                        Hapus
                      </button>
                    </span>
                  </article>
                ))
              ) : (
                <p className="empty-role" style={{ color: '#64748b', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Belum ada artikel knowledge.</p>
              )}
            </div>
          </section>
        </div>
      </section>

      {/* SYSTEM SETUP */}
      {user && user.role === 'admin' && (
        <section className="admin-section">
          <div className="admin-section-heading">
            <div>
              <h3>Pengaturan Sistem</h3>
              <p>Atur data dasar yang digunakan dalam sistem helpdesk.</p>
            </div>
          </div>

          <div className="admin-layout admin-setup" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* ROOM */}
            <form
              className="admin-form setup-card"
              onSubmit={(e) =>
                addSetup(
                  e,
                  '/admin/rooms',
                  { ruangan: roomName },
                  () => setRoomName('')
                )
              }
            >
              <div className="setup-heading">
                <span className="setup-number">01</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a30' }}>Ruangan</h3>
                  <small style={{ color: '#64748b' }}>{setup.rooms.length} ruangan</small>
                </div>
              </div>

              <label>
                Nama ruangan
                <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Contoh: Ruang IT"
                  required
                />
              </label>

              <button style={{ marginTop: 'auto' }}>Tambah Ruangan</button>

              <ul className="setup-list">
                {setup.rooms.map((item) => (
                  <li key={item.id}>
                    <span>{item.ruangan}</span>
                    <button
                      type="button"
                      className="delete-setup"
                      onClick={() =>
                        removeSetup(
                          `/admin/rooms/${item.id}`,
                          `ruangan “${item.ruangan}”`
                        )
                      }
                    >
                      Hapus
                    </button>
                  </li>
                ))}
              </ul>
            </form>

            {/* USER */}
            <form
              className="admin-form setup-card"
              onSubmit={(e) =>
                addSetup(
                  e,
                  '/admin/users',
                  newUser,
                  () =>
                    setNewUser({
                      nama: '',
                      email: '',
                      password: '',
                      role: 'user'
                    })
                )
              }
            >
              <div className="setup-heading">
                <span className="setup-number">02</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.9rem', color: '#0c4a30' }}>Tambah Akun</h3>
                  <small style={{ color: '#64748b' }}>Buat akun pengguna baru</small>
                </div>
              </div>

              <label>
                Nama
                <input
                  value={newUser.nama}
                  onChange={(e) => setNewUser({ ...newUser, nama: e.target.value })}
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                />
              </label>

              <label>
                Role
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="teknisi">Teknisi</option>
                </select>
              </label>

              <button style={{ marginTop: 'auto' }}>Tambah Akun</button>
            </form>
          </div>
        </section>
      )}

      {/* USER MANAGEMENT */}
      <section className="admin-section">
        <div className="admin-section-heading">
          <div>
            <h3>Kelola Role Pengguna</h3>
            <p>Atur hak akses dan akun pengguna sistem.</p>
          </div>
          <span className="admin-count">
            {setup.users.length} pengguna
          </span>
        </div>

        <section className="admin-articles user-list">
          <input
            className="user-search"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="🔍 Cari nama atau email..."
            aria-label="Cari pengguna"
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '16px', outline: 'none', boxSizing: 'border-box' }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {['admin', 'teknisi', 'user'].map((role) => (
              <section className="role-group" key={role}>
                <div className="role-heading">
                  <h4>{role}</h4>
                  <span>
                    {visibleUsers.filter((user) => user.role === role).length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {visibleUsers
                    .filter((user) => user.role === role)
                    .map((user) => (
                      <article key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div className="user-info">
                          <span className="user-avatar">
                            {user.nama?.[0]?.toUpperCase() || '?'}
                          </span>
                          <div>
                            <b style={{ display: 'block', fontSize: '0.825rem', color: '#1f2937' }}>{user.nama}</b>
                            <small style={{ color: '#64748b', fontSize: '0.725rem' }}>{user.email}</small>
                          </div>
                        </div>

                        <span className="user-actions">
                          <select
                            value={user.role}
                            onChange={(e) => changeRole(user.id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            <option value="teknisi">Teknisi</option>
                          </select>

                          <button
                            type="button"
                            onClick={() =>
                              removeSetup(
                                `/admin/users/${user.id}`,
                                `akun ${user.nama}`
                              )
                            }
                          >
                            Hapus
                          </button>
                        </span>
                      </article>
                    ))}

                  {!visibleUsers.some((user) => user.role === role) && (
                    <p className="empty-role" style={{ color: '#94a3b8', fontSize: '0.775rem', margin: '8px 0', textAlign: 'center' }}>
                      Belum ada akun {role}.
                    </p>
                  )}
                </div>
              </section>
            ))}
          </div>
        </section>
      </section>
    </section>
  )
}

export default Admin