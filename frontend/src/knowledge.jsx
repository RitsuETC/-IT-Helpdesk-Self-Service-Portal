import { useEffect, useMemo, useState } from 'react'
import searchImage from './assets/search.png'

function youtubeThumbnail(url) {
  const id = url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1]
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

function youtubeId(url) {
  return url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1] || null
}

// Fungsi untuk memformat teks bernomor agar otomatis tersusun ke bawah secara rapi
function formatNumberedSteps(text) {
  if (!text) return null
  // Jika teks sudah memiliki baris baru (\n), gunakan langsung
  if (text.includes('\n')) {
    return text.split('\n').map((line, idx) => <div key={idx}>{line}</div>)
  }
  // Jika teks digabung dalam satu baris (misal: "1. A 2. B 3. C"), pisahkan berdasarkan pola nomor (1., 2., dst)
  const steps = text.split(/(?=\d+\.\s+)/).filter(Boolean)
  if (steps.length > 1) {
    return steps.map((step, idx) => <div key={idx} className="step-item">{step.trim()}</div>)
  }
  return text
}

function Knowledge({ articles = [], initialArticle }) {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  
  useEffect(() => {
    if (!initialArticle) return
    const found = articles.find((a) => Number(a.id) === Number(initialArticle.id))
    if (found) setSelectedArticle(found)
    else setSelectedArticle(null)
  }, [initialArticle, articles])

  const tagsList = useMemo(() => {
    const allTagsSet = new Set()
    articles.forEach((article) => {
      const rawTags = article.tags || article.nama_kategori || ''
      rawTags.split(',').forEach((t) => {
        const trimmed = t.trim()
        if (trimmed) allTagsSet.add(trimmed)
      })
    })
    return Array.from(allTagsSet)
  }, [articles])

  const handleToggleTagFilter = (tag) => {
    if (tag === 'all') {
      setSelectedTags([])
      return
    }
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag)
      } else {
        return [...prev, tag]
      }
    })
  }

  const visibleArticles = useMemo(() => 
    articles.filter((article) => {
      const rawTags = article.tags || article.nama_kategori || ''
      const articleTags = rawTags.split(',').map((t) => t.trim().toLowerCase())

      const matchTags =
        selectedTags.length === 0 ||
        selectedTags.every((st) => articleTags.includes(st.toLowerCase()))

      const matchQuery =
        article.judul?.toLowerCase().includes(query.toLowerCase()) ||
        article.content?.toLowerCase().includes(query.toLowerCase())

      return matchTags && matchQuery
    }), [query, selectedTags, articles]
  )

  return (
    <section className="knowledge-page">
      
      {/* Header Halaman */}
      <div className="knowledge-header-box">
        <h2 className="knowledge-heading">Knowledge Base & Solusi Mandiri</h2>
        <p className="knowledge-subheading">Temukan panduan, solusi cepat, dan video troubleshooting kendala IT Anda di sini.</p>
      </div>
      
      {/* Toolbar Pencarian & Filter Multi-Tag */}
      <div className="knowledge-filter">
        <div className="knowledge-search-wrapper">
          <img src={searchImage} alt="Cari" />
          <input 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            aria-label="Cari artikel" 
            placeholder="Cari kendala, keyword, atau solusi..."
          />
        </div>

        <div className="knowledge-tags-container">
          <span className="knowledge-tags-label">Filter Kategori:</span>
          
          <button
            type="button"
            className={`knowledge-tag-btn ${selectedTags.length === 0 ? 'active' : ''}`}
            onClick={() => handleToggleTagFilter('all')}
          >
            Semua Solusi
          </button>

          {tagsList.map((tag) => {
            const isSelected = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                className={`knowledge-tag-btn ${isSelected ? 'active' : ''}`}
                onClick={() => handleToggleTagFilter(tag)}
              >
                {isSelected ? '✓ ' : ''}#{tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Kartu Artikel */}
      <div className="article-grid">
        {visibleArticles.length === 0 ? (
          <div className="knowledge-empty-state">
            <p>Tidak ada artikel panduan yang sesuai dengan pencarian atau filter Anda.</p>
          </div>
        ) : (
          visibleArticles.map((article) => (
            <div 
              className="knowledge-card" 
              key={article.id}
            >
              <div className="knowledge-card-header">
                <div className="knowledge-card-tags">
                  {(article.tags || article.nama_kategori || 'Umum').split(',').map((t, idx) => {
                    const trimmed = t.trim()
                    if (!trimmed) return null
                    return (
                      <span key={idx} className="card-tag-badge">
                        #{trimmed}
                      </span>
                    )
                  })}
                </div>
              </div>

              <div className="knowledge-card-body">
                <h3 className="knowledge-card-title">{article.judul}</h3>
                <div className="knowledge-card-snippet">
                  {formatNumberedSteps(article.content)}
                </div>
              </div>

              {/* Tombol Baca Solusi dihidupkan kembali sebagai interaksi pembuka modal */}
              <div className="knowledge-card-footer">
                <button 
                  type="button" 
                  className="read-more-btn"
                  onClick={() => setSelectedArticle(article)}
                >
                  Baca Solusi &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Detail Artikel */}
      {selectedArticle && (
        <div className="knowledge-modal-backdrop">
          <div className="knowledge-detail">
            <button 
              className="knowledge-close-btn" 
              onClick={() => setSelectedArticle(null)} 
              aria-label="Tutup"
              type="button"
            >
              ✕
            </button>

            <div className="knowledge-detail-header">
              <div className="knowledge-detail-tags">
                {(selectedArticle.tags || selectedArticle.nama_kategori || 'Umum').split(',').map((t, idx) => {
                  const trimmed = t.trim()
                  if (!trimmed) return null
                  return (
                    <span key={idx} className="detail-tag-badge">
                      #{trimmed}
                    </span>
                  )
                })}
              </div>
              <h2 className="knowledge-detail-title">{selectedArticle.judul}</h2>
            </div>
            
            <div className="knowledge-detail-content">
              {/* Kotak Teks Langkah-langkah */}
              <div className="knowledge-detail-text-box">
                <h4 className="box-section-title">Langkah-Langkah Solusi</h4>
                <div className="box-content-scroll">
                  <div className="knowledge-detail-text">
                    {formatNumberedSteps(selectedArticle.content)}
                  </div>
                </div>
              </div>

              {/* Kotak Media Video */}
              <div className="knowledge-media-box">
                <h4 className="box-section-title">Video Panduan Visual</h4>
                <div className="box-content-scroll">
                  {selectedArticle.video_url ? (
                    youtubeId(selectedArticle.video_url) ? (
                      <a
                        href={`https://www.youtube.com/watch?v=${youtubeId(selectedArticle.video_url)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="video-link"
                        style={{ backgroundImage: `url(${youtubeThumbnail(selectedArticle.video_url)})` }}
                      >
                        <div className="video-overlay">
                          <span>▶ Putar Video Panduan</span>
                        </div>
                      </a>
                    ) : (
                      <a 
                        href={selectedArticle.video_url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="video-link" 
                        style={{ backgroundImage: `url(${youtubeThumbnail(selectedArticle.video_url)})` }}
                      >
                        <div className="video-overlay">
                          <span>▶ Putar Video Panduan</span>
                        </div>
                      </a>
                    )
                  ) : (
                    <div className="video-empty">
                      <span>Tidak ada lampiran video untuk panduan ini.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default Knowledge