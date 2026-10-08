import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, ChevronLeft, ChevronRight, Play, Search, X } from 'lucide-react'
import DOMPurify from 'dompurify'

function youtubeThumbnail(url) {
  const id = url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1]
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

function youtubeId(url) {
  return url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1] || null
}

function articleExcerpt(content = '') {
  const text = /<\/?[a-z][\s\S]*>/i.test(content)
    ? DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    : String(content)
  return text.replace(/^\s*\d+\.\s*/gm, '').replace(/\s+/g, ' ').trim()
}

function articleBody(content = '') {
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    return <div className="kb-prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
  }
  return <div className="knowledge-detail-text-list">{formatNumberedSteps(content)}</div>
}

function readingMinutes(content = '') {
  return Math.max(1, Math.ceil(articleExcerpt(content).split(/\s+/).filter(Boolean).length / 180))
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
        articleExcerpt(article.content).toLowerCase().includes(query.toLowerCase())

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
      <header className="kb-heading-row">
        <div>
          <span className="kb-eyebrow"><BookOpen size={15} aria-hidden="true" /> PUSAT PANDUAN</span>
          <h2 className="knowledge-heading">Knowledge Base</h2>
          <p className="knowledge-subheading">Panduan praktis untuk menyelesaikan kendala IT dan kembali bekerja.</p>
        </div>
        <span className="kb-article-count">{visibleArticles.length} artikel</span>
      </header>

      <div className="knowledge-filter kb-filter-bar">
        <div className="knowledge-search-wrapper">
          <Search size={18} aria-hidden="true" />
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

      <div className="article-grid">
        {paginatedArticles.length === 0 ? (
          <div className="knowledge-empty-state">
            <BookOpen size={24} aria-hidden="true" />
            <p>Tidak ada artikel yang sesuai dengan pencarian atau filter.</p>
          </div>
        ) : (
          paginatedArticles.map((article) => (
            <article
              className="knowledge-card kb-article-card"
              key={article.id}
            >
              <button className="kb-article-open" type="button" onClick={() => setSelectedArticle(article)} aria-label={`Baca artikel ${article.judul}`}>
                <span className="kb-article-cover" aria-hidden="true">
                  {youtubeId(article.video_url) ? (
                    <img src={youtubeThumbnail(article.video_url)} alt="" loading="lazy" />
                  ) : <BookOpen size={30} strokeWidth={1.5} />}
                  {article.video_url && <span className="kb-video-badge"><Play size={12} fill="currentColor" /> Video</span>}
                </span>
                <span className="knowledge-card-body">
                  <span className="knowledge-card-header">
                    <span className="knowledge-card-tags">
                      {(article.tags || article.nama_kategori || 'Umum').split(',').map((t, idx) => {
                        const trimmed = t.trim()
                        if (!trimmed) return null
                        return <span key={idx} className="card-tag-badge">#{trimmed}</span>
                      })}
                    </span>
                  </span>
                  <span className="knowledge-card-title">{article.judul}</span>
                  <span className="knowledge-card-snippet">{articleExcerpt(article.content)}</span>
                  <span className="kb-reading-time">{readingMinutes(article.content)} menit membaca</span>
                </span>
              </button>
              <div className="knowledge-card-footer">
                <button type="button" className="read-more-btn" onClick={() => setSelectedArticle(article)}>
                  Baca artikel <ArrowUpRight size={15} aria-hidden="true" />
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Kontrol Pagination */}
      {visibleArticles.length > 0 && (
        <div className="kb-pagination">
          <div>
            Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, visibleArticles.length)} dari total {visibleArticles.length} artikel
          </div>
          <div className="kb-page-actions">
            <button aria-label="Halaman pertama" onClick={() => handlePageChange(1)} disabled={currentPage === 1}><ArrowLeft size={15} /><ArrowLeft size={15} className="kb-double-icon" /></button>
            <button aria-label="Halaman sebelumnya" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}><ChevronLeft size={17} /></button>
            <span>
              Hal {currentPage} / {totalPages}
            </span>
            <button aria-label="Halaman berikutnya" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}><ChevronRight size={17} /></button>
            <button aria-label="Halaman terakhir" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages}><ArrowRight size={15} /><ArrowRight size={15} className="kb-double-icon" /></button>
          </div>
        </div>
      )}

      {/* Modal Detail Artikel */}
      {selectedArticle && (
        <div className="knowledge-modal-backdrop" onClick={() => setSelectedArticle(null)}>
          <article className="knowledge-detail" role="dialog" aria-modal="true" aria-labelledby="knowledge-detail-title" onClick={(event) => event.stopPropagation()}>
            <button 
              className="knowledge-close-btn" 
              onClick={() => setSelectedArticle(null)} 
              aria-label="Tutup"
              type="button"
            >
              <X size={18} aria-hidden="true" />
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
              <h2 className="knowledge-detail-title" id="knowledge-detail-title">{selectedArticle.judul}</h2>
            </div>
            
            <div className="knowledge-detail-content">
              {/* Kotak Teks Langkah-langkah (Teks Diperbesar & Jelas) */}
              <div className="knowledge-detail-text-box">
                <h4 className="box-section-title">Panduan Solusi</h4>
                <div className="box-content-scroll">
                  {articleBody(selectedArticle.content)}
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
          </article>
        </div>
      )}
    </section>
  )
}

export default Knowledge