import { useEffect, useMemo, useState } from 'react'
import searchImage from './assets/search.png'

function youtubeThumbnail(url) {
  const id = url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1]
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

function youtubeId(url) {
  return url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1] || null
}

function Knowledge({ articles, initialArticle }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedArticle, setSelectedArticle] = useState(null)
  
  // State baru untuk popup teks lengkap
  const [showFullTextModal, setShowFullTextModal] = useState(false)
  
  useEffect(() => {
    if (!initialArticle) return
    const found = articles.find((a) => Number(a.id) === Number(initialArticle.id))
    if (found) setSelectedArticle(found)
    else setSelectedArticle(null)
  }, [initialArticle, articles])

  const visibleArticles = useMemo(() => 
    articles.filter((article) => 
      (category === 'all' || article.nama_kategori === category) && 
      article.judul.toLowerCase().includes(query.toLowerCase())
    ), [query, category, articles]
  )

  // Simulasi batas karakter untuk memunculkan tombol "Lihat Selengkapnya" (misal 150 karakter)
  const isLongText = selectedArticle?.content?.length > 150

  return (
    <section className="knowledge-page">
      <h2>Knowledge</h2>
      <div className="knowledge-filter">
        <label>
          <img src={searchImage} alt="" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Cari artikel" />
        </label>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kategori">
          <option value="all">Kategori</option>
          {[...new Set(articles.map((article) => article.nama_kategori))].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      <div className="article-grid">
        {visibleArticles.map((article) => (
          <button className="knowledge-card" key={article.id} onClick={() => setSelectedArticle(article)}>
            <b>Judul: {article.judul}</b>
            <b>Kategori: {article.nama_kategori}</b>
            <span>{article.content}</span>
          </button>
        ))}
      </div>

      {selectedArticle && (
        <div className="knowledge-modal-backdrop">
          <article className="knowledge-detail">
            <button className="knowledge-close-btn" onClick={() => setSelectedArticle(null)} aria-label="Tutup">
              ✕
            </button>
            <h2>{selectedArticle.judul}</h2>
            <p><b>Kategori:</b> {selectedArticle.nama_kategori}</p>
            <div className="knowledge-detail-content">
              
              {/* Kotak Teks dengan Tombol Lihat Selengkapnya */}
              <div className="knowledge-text-box-wrapper">
                <p>{selectedArticle.content}</p>
                {isLongText && (
                  <button 
                    className="read-more-btn" 
                    onClick={() => setShowFullTextModal(true)}
                  >
                    Lihat Selengkapnya &raquo;
                  </button>
                )}
              </div>

              <div className="knowledge-media">
                {selectedArticle.video_url ? (
                  youtubeId(selectedArticle.video_url) ? (
                    <a
                      href={`https://www.youtube.com/watch?v=${youtubeId(selectedArticle.video_url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="video-link"
                      style={{ backgroundImage: `url(${youtubeThumbnail(selectedArticle.video_url)})` }}
                    >
                      ▶<span>Tonton video</span>
                    </a>
                  ) : (
                    <a href={selectedArticle.video_url} target="_blank" rel="noreferrer" className="video-link" style={{ backgroundImage: `url(${youtubeThumbnail(selectedArticle.video_url)})` }}>
                      ▶<span>Tonton video</span>
                    </a>
                  )
                ) : (
                  <div className="video-empty">Video belum ditambahkan</div>
                )}
              </div>
            </div>
          </article>
        </div>
      )}

      {/* Sub-Modal untuk Pop-up Teks Lengkap */}
      {showFullTextModal && selectedArticle && (
        <div className="knowledge-modal-backdrop" style={{ zIndex: 1200 }}>
          <div className="knowledge-fulltext-modal">
            <button className="knowledge-close-btn" onClick={() => setShowFullTextModal(false)} aria-label="Tutup">
              ✕
            </button>
            <h3>{selectedArticle.judul}</h3>
            <div className="fulltext-body">
              <p>{selectedArticle.content}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Knowledge