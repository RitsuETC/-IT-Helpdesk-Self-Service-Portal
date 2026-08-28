import { useEffect, useState } from 'react'
import { api } from './api.js'
import { confirmAction } from './confirm.js'

const emptyKnowledge = {
  id_categori: '',
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
  const [categoryName, setCategoryName] = useState('')
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

  const submitKnowledge = async (event) => {
    event.preventDefault()

    try {
      await api(
        editingId ? `/knowledge/${editingId}` : '/knowledge',
        {
          token,
          method: editingId ? 'PUT' : 'POST',
          body: {
            ...knowledge,
            id_categori: Number(knowledge.id_categori),
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

  return (
    <section className="admin-page">

      {/* HEADER */}
      <header className="admin-header">
        <div>
          <p className="admin-eyebrow">Administration</p>

          <h2>Panel Admin</h2>

          <p className="admin-description">
            Kelola knowledge base, kategori, ruangan, dan akun pengguna.
          </p>
        </div>
      </header>

      {/* KNOWLEDGE */}
      <section className="admin-section">

        <div className="admin-section-heading">
          <div>
            <h3>Knowledge Base</h3>

            <p>
              Kelola artikel troubleshooting yang tersedia untuk pengguna.
            </p>
          </div>

          <span className="admin-count">
            {articles.length} artikel
          </span>
        </div>

        <div className="admin-layout">

          {/* KNOWLEDGE FORM */}
          <form
            className="admin-form"
            onSubmit={submitKnowledge}
          >

            <div className="form-title">

              <span className="form-icon">
                +
              </span>

              <div>

                <h3>
                  {editingId
                    ? 'Ubah Knowledge'
                    : 'Tambah Knowledge'}
                </h3>

                <small>
                  {editingId
                    ? 'Perbarui informasi artikel'
                    : 'Tambahkan solusi baru'}
                </small>

              </div>
            </div>

            <label>
              Judul

              <input
                value={knowledge.judul}
                onChange={(e) =>
                  setKnowledge({
                    ...knowledge,
                    judul: e.target.value
                  })
                }
                placeholder="Contoh: Komputer tidak menyala"
                required
              />
            </label>

            <label>
              Kategori

              <select
                value={knowledge.id_categori}
                onChange={(e) =>
                  setKnowledge({
                    ...knowledge,
                    id_categori: e.target.value
                  })
                }
                required
              >
                <option
                  value=""
                  disabled
                >
                  Pilih kategori
                </option>

                {setup.categories.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nama_kategori}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Isi artikel

              <textarea
                value={knowledge.content}
                onChange={(e) =>
                  setKnowledge({
                    ...knowledge,
                    content: e.target.value
                  })
                }
                placeholder="Tuliskan solusi atau langkah troubleshooting..."
                required
              />
            </label>

            <label>
              Link YouTube

              <input
                type="url"
                value={knowledge.video_url}
                onChange={(e) =>
                  setKnowledge({
                    ...knowledge,
                    video_url: e.target.value
                  })
                }
                placeholder="https://youtube.com/..."
              />
            </label>

            <div className="form-actions">

              <button type="submit">
                {editingId
                  ? 'Update Knowledge'
                  : 'Simpan Knowledge'}
              </button>

              {editingId && (
                <button
                  className="cancel-edit"
                  type="button"
                  onClick={() => {
                    setKnowledge(emptyKnowledge)
                    setEditingId(null)
                  }}
                >
                  Batal
                </button>
              )}

            </div>

          </form>

          {/* ARTICLE LIST */}
          <section className="admin-articles">

            <div className="articles-heading">

              <div>
                <h3>Artikel tersedia</h3>

                <small>
                  Daftar knowledge base saat ini
                </small>
              </div>

            </div>

            {articles.length ? (

              articles.map((article) => (
                <article key={article.id}>

                  <div className="article-info">

                    <b>
                      {article.judul}
                    </b>

                    <small>
                      {article.nama_kategori}
                    </small>

                  </div>

                  <span className="article-actions">

                    <button
                      className="edit-article"
                      type="button"
                      onClick={() => {

                        setEditingId(article.id)

                        setKnowledge({
                          id_categori: String(
                            article.id_categori
                          ),
                          judul: article.judul,
                          content: article.content,
                          video_url:
                            article.video_url || ''
                        })

                        window.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        })

                      }}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={async () => {

                        if (
                          !(await confirmAction(
                            `Hapus artikel “${article.judul}”?`
                          ))
                        ) {
                          return
                        }

                        try {

                          await api(
                            `/knowledge/${article.id}`,
                            {
                              token,
                              method: 'DELETE'
                            }
                          )

                          onChanged()

                        } catch (error) {
                          onError(error.message)
                        }

                      }}
                    >
                      Hapus
                    </button>

                  </span>

                </article>
              ))

            ) : (

              <p className="empty-role">
                Belum ada artikel knowledge.
              </p>

            )}

          </section>

        </div>

      </section>

      {/* SYSTEM SETUP */}
      {user && user.role === 'admin' && (

        <section className="admin-section">

          <div className="admin-section-heading">

            <div>

              <h3>
                Pengaturan Sistem
              </h3>

              <p>
                Atur data dasar yang digunakan dalam sistem helpdesk.
              </p>

            </div>

          </div>

          <div className="admin-layout admin-setup">

            {/* CATEGORY */}
            <form
              className="admin-form setup-card"
              onSubmit={(e) =>
                addSetup(
                  e,
                  '/admin/categories',
                  {
                    nama_kategori: categoryName
                  },
                  () => setCategoryName('')
                )
              }
            >

              <div className="setup-heading">

                <span className="setup-number">
                  01
                </span>

                <div>

                  <h3>
                    Kategori Tiket
                  </h3>

                  <small>
                    {setup.categories.length} kategori
                  </small>

                </div>

              </div>

              <label>
                Nama kategori

                <input
                  value={categoryName}
                  onChange={(e) =>
                    setCategoryName(e.target.value)
                  }
                  placeholder="Contoh: Hardware"
                  required
                />
              </label>

              <button>
                Tambah Kategori
              </button>

              <ul className="setup-list">

                {setup.categories.map((item) => (
                  <li key={item.id}>

                    <span>
                      {item.nama_kategori}
                    </span>

                    <button
                      type="button"
                      className="delete-setup"
                      onClick={() =>
                        removeSetup(
                          `/admin/categories/${item.id}`,
                          `kategori “${item.nama_kategori}”`
                        )
                      }
                    >
                      Hapus
                    </button>

                  </li>
                ))}

              </ul>

            </form>

            {/* ROOM */}
            <form
              className="admin-form setup-card"
              onSubmit={(e) =>
                addSetup(
                  e,
                  '/admin/rooms',
                  {
                    ruangan: roomName
                  },
                  () => setRoomName('')
                )
              }
            >

              <div className="setup-heading">

                <span className="setup-number">
                  02
                </span>

                <div>

                  <h3>
                    Ruangan
                  </h3>

                  <small>
                    {setup.rooms.length} ruangan
                  </small>

                </div>

              </div>

              <label>
                Nama ruangan

                <input
                  value={roomName}
                  onChange={(e) =>
                    setRoomName(e.target.value)
                  }
                  placeholder="Contoh: Ruang IT"
                  required
                />
              </label>

              <button>
                Tambah Ruangan
              </button>

              <ul className="setup-list">

                {setup.rooms.map((item) => (
                  <li key={item.id}>

                    <span>
                      {item.ruangan}
                    </span>

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

                <span className="setup-number">
                  03
                </span>

                <div>

                  <h3>
                    Tambah Akun
                  </h3>

                  <small>
                    Buat akun pengguna baru
                  </small>

                </div>

              </div>

              <label>
                Nama

                <input
                  value={newUser.nama}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      nama: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Email

                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      email: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Password

                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      password: e.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Role

                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser({
                      ...newUser,
                      role: e.target.value
                    })
                  }
                >
                  <option value="user">
                    User
                  </option>

                  <option value="admin">
                    Admin
                  </option>

                  <option value="teknisi">
                    Teknisi
                  </option>

                </select>
              </label>

              <button>
                Tambah Akun
              </button>

            </form>

          </div>

        </section>

      )}

      {/* USER MANAGEMENT */}
      <section className="admin-section">

        <div className="admin-section-heading">

          <div>

            <h3>
              Kelola Role Pengguna
            </h3>

            <p>
              Atur hak akses dan akun pengguna sistem.
            </p>

          </div>

          <span className="admin-count">
            {setup.users.length} pengguna
          </span>

        </div>

        <section className="admin-articles user-list">

          <input
            className="user-search"
            value={userQuery}
            onChange={(e) =>
              setUserQuery(e.target.value)
            }
            placeholder="Cari nama atau email..."
            aria-label="Cari pengguna"
          />

          {['admin', 'teknisi', 'user'].map((role) => (

            <section
              className="role-group"
              key={role}
            >

              <div className="role-heading">

                <h4>
                  {role}
                </h4>

                <span>
                  {
                    visibleUsers.filter(
                      (user) =>
                        user.role === role
                    ).length
                  }
                </span>

              </div>

              {visibleUsers
                .filter(
                  (user) =>
                    user.role === role
                )
                .map((user) => (

                  <article key={user.id}>

                    <div className="user-info">

                      <span className="user-avatar">
                        {user.nama?.[0]?.toUpperCase() || '?'}
                      </span>

                      <div>

                        <b>
                          {user.nama}
                        </b>

                        <small>
                          {user.email}
                        </small>

                      </div>

                    </div>

                    <span className="user-actions">

                      <select
                        value={user.role}
                        onChange={(e) =>
                          changeRole(
                            user.id,
                            e.target.value
                          )
                        }
                      >
                        <option value="user">
                          User
                        </option>

                        <option value="admin">
                          Admin
                        </option>

                        <option value="teknisi">
                          Teknisi
                        </option>

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

              {!visibleUsers.some(
                (user) =>
                  user.role === role
              ) && (

                <p className="empty-role">
                  Belum ada akun {role}.
                </p>

              )}

            </section>

          ))}

        </section>

      </section>

    </section>
  )
}

export default Admin