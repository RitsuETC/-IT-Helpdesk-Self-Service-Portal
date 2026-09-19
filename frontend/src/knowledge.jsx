import { useEffect, useMemo, useState } from 'react'
import searchImage from './assets/search.png'

function youtubeThumbnail(url) {
  const id = url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1]
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

function youtubeId(url) {
  return url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1] || null
}

// Fungsi inovatif untuk memecah teks bernomor menjadi list rapi berurutan ke bawah
function formatNumberedSteps(text) {
  if (!text) return null
  if (text.includes('\n')) {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return null
      return (
        <div key={idx} className="step-item">
          <span className="step-bullet">{idx + 1}</span>
          <span className="step-text">{trimmed.replace(/^\d+\.\s*/, '')}</span>
        </div>
      )
    })
  }
  const steps = text.split(/(?=\d+\.\s+)/).filter(Boolean)
  if (steps.length > 1) {
    return steps.map((step, idx) => {
      const cleanText = step.replace(/^\d+\.\s*/, '').trim()
      return (
        <div key={idx} className="step-item">
          <span className="step-bullet">{idx + 1}</span>
          <span className="step-text">{cleanText}</span>
        </div>
      )
    })
  }
  return <div className="step-item"><span className="step-text">{text}</span></div>
}

function Knowledge({ articles = [], initialArticle }) {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [selectedArticle, setSelectedArticle] = useState(null)
  
  // State untuk Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

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

  // Reset pagination ke halaman 1 setiap kali filter atau pencarian berubah
  useEffect(() => {
    setCurrentPage(1)
  }, [query, selectedTags])

  // Logika Pagination
  const totalPages = Math.ceil(visibleArticles.length / ITEMS_PER_PAGE) || 1
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return visibleArticles.slice(start, start + ITEMS_PER_PAGE)
  }, [visibleArticles, currentPage])

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

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
        {paginatedArticles.length === 0 ? (
          <div className="knowledge-empty-state">
            <p>Tidak ada artikel panduan yang sesuai dengan pencarian atau filter Anda.</p>
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <div 
              className="knowledge-card" 
              key={article.id}
              onClick={() => setSelectedArticle(article)}
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

              {/* Tombol Baca Solusi Tetap Ada dan Berfungsi */}
              <div className="knowledge-card-footer">
                <button 
                  type="button" 
                  className="read-more-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedArticle(article)
                  }}
                >
                  Baca Solusi Lengkap &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Kontrol Pagination */}
      {visibleArticles.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', padding: '12px 16px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, visibleArticles.length)} dari total {visibleArticles.length} artikel
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button 
              onClick={() => handlePageChange(1)} 
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              «
            </button>
            <button 
              onClick={() => handlePageChange(currentPage - 1)} 
              disabled={currentPage === 1}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : '#ffffff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              ‹
            </button>
            <span style={{ fontSize: '12px', fontWeight: '700', padding: '0 10px', color: '#0f172a' }}>
              Hal {currentPage} / {totalPages}
            </span>
            <button 
              onClick={() => handlePageChange(currentPage + 1)} 
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : '#ffffff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              ›
            </button>
            <button 
              onClick={() => handlePageChange(totalPages)} 
              disabled={currentPage === totalPages}
              style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : '#ffffff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              »
            </button>
          </div>
        </div>
      )}

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
              {/* Kotak Teks Langkah-langkah (Teks Diperbesar & Jelas) */}
              <div className="knowledge-detail-text-box">
                <h4 className="box-section-title">Langkah-Langkah Solusi</h4>
                <div className="box-content-scroll">
                  <div className="knowledge-detail-text-list">
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
                      <div className="video-empty-content">
                        <span className="empty-title">Belum Ada Lampiran Video</span>
                      </div>
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