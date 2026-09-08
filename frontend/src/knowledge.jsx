import { useEffect, useMemo, useState } from 'react'
import searchImage from './assets/search.png'

function youtubeThumbnail(url) {
  const id = url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1]
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ''
}

function youtubeId(url) {
  return url?.match(/(?:youtu\.be\/|v=|embed\/)([^?&/]+)/)?.[1] || null
}

function Knowledge({ articles = [], initialArticle }) {
  const [query, setQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState([]) // Array untuk menampung banyak tag yang dipilih
  const [selectedArticle, setSelectedArticle] = useState(null)
  
  useEffect(() => {
    if (!initialArticle) return
    const found = articles.find((a) => Number(a.id) === Number(initialArticle.id))
    if (found) setSelectedArticle(found)
    else setSelectedArticle(null)
  }, [initialArticle, articles])

  // Mengumpulkan seluruh tag unik dari semua artikel
  const tagsList = useMemo(() => {
    const allTagsSet = new Set()
    
    articles.forEach((article) => {
      // Ambil dari article.tags atau fallback ke article.nama_kategori
      const rawTags = article.tags || article.nama_kategori || ''
      rawTags.split(',').forEach((t) => {
        const trimmed = t.trim()
        if (trimmed) allTagsSet.add(trimmed)
      })
    })

    return Array.from(allTagsSet)
  }, [articles])

  // Toggle/Pilih Multi-Tag Filter
  const handleToggleTagFilter = (tag) => {
    if (tag === 'all') {
      setSelectedTags([])
      return
    }

    setSelectedTags((prev) => 
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Filtering artikel berdasarkan multi-tag yang dipilih dan pencarian teks
  const visibleArticles = useMemo(() => 
    articles.filter((article) => {
      const rawTags = article.tags || article.nama_kategori || ''
      const articleTags = rawTags.split(',').map((t) => t.trim().toLowerCase())

      // Jika tidak ada tag yang dipilih (selectedTags kosong), tampilkan semua artikel
      const matchTag =
        selectedTags.length === 0 ||
        selectedTags.some((st) => articleTags.includes(st.toLowerCase()))

      const matchQuery =
        article.judul?.toLowerCase().includes(query.toLowerCase()) ||
        article.content?.toLowerCase().includes(query.toLowerCase())

      return matchTag && matchQuery
    }), [query, selectedTags, articles]
  )

  return (
    <section className="knowledge-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', color: '#1f2937' }}>
      
      {/* Wrapper Judul Halaman */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', 
          padding: '14px 32px', 
          borderRadius: '12px', 
          textAlign: 'center',
          boxShadow: '0 8px 20px rgba(12, 74, 48, 0.25)',
          border: '1px solid #064e3b',
          display: 'inline-block'
        }}>
          <h2 className="knowledge-heading" style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
            Knowledge Base & Solusi Mandiri
          </h2>
        </div>
      </div>
      
      {/* Toolbar Pencarian & Filter Multi-Tag */}
      <div className="knowledge-filter" style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', background: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        
        {/* Input Teks Pencarian */}
        <label style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 12px', width: '100%', height: '40px', boxSizing: 'border-box' }}>
          <img src={searchImage} alt="" style={{ width: '16px', height: '16px', marginRight: '8px', opacity: 0.6 }} />
          <input 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            aria-label="Cari artikel" 
            placeholder="Cari masalah, keyword, atau panduan..."
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1f2937' }}
          />
        </label>

        {/* Deretan Chips/Badges Filter Multi-Tag */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', marginRight: '4px' }}>Filter Tag:</span>
          
          {/* Tombol 'Semua Tag' */}
          <button
            onClick={() => handleToggleTagFilter('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: selectedTags.length === 0 ? '#0c4a30' : '#d1d5db',
              backgroundColor: selectedTags.length === 0 ? '#0c4a30' : '#ffffff',
              color: selectedTags.length === 0 ? '#ffffff' : '#374151',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selectedTags.length === 0 ? '0 4px 10px rgba(12, 74, 48, 0.2)' : 'none'
            }}
          >
            Semua Tag
          </button>

          {/* List Tag Interaktif */}
          {tagsList.map((tag) => {
            const isActive = selectedTags.includes(tag)
            return (
              <button
                key={tag}
                onClick={() => handleToggleTagFilter(tag)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: isActive ? '#0c4a30' : '#d1d5db',
                  backgroundColor: isActive ? '#0c4a30' : '#ffffff',
                  color: isActive ? '#ffffff' : '#374151',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 4px 10px rgba(12, 74, 48, 0.2)' : 'none'
                }}
              >
                {isActive ? '✓ ' : ''}#{tag}
              </button>
            )
          })}
        </div>
      </div>

      {/* Grid Kartu Artikel */}
      <div className="article-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {visibleArticles.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '13px', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>
            Tidak ada artikel yang cocok dengan tag atau pencarian tersebut.
          </p>
        ) : (
          visibleArticles.map((article) => (
            <button 
              className="knowledge-card" 
              key={article.id} 
              onClick={() => setSelectedArticle(article)}
              style={{
                background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '18px',
                textAlign: 'left',
                border: '1px solid #064e3b',
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(12, 74, 48, 0.25)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              {/* Tampilan Seluruh Tag pada Kartu Artikel */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
                {(article.tags || article.nama_kategori || 'Umum').split(',').map((t, idx) => {
                  const trimmed = t.trim()
                  if (!trimmed) return null
                  return (
                    <b key={idx} style={{ fontSize: '10px', color: '#e2f0ea', backgroundColor: 'rgba(255, 255, 255, 0.18)', padding: '2px 8px', borderRadius: '20px' }}>
                      #{trimmed}
                    </b>
                  )
                })}
              </div>

              <b style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', lineHeight: '1.4' }}>{article.judul}</b>
              <span style={{ fontSize: '12px', color: '#cbd5e1', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {article.content}
              </span>
            </button>
          ))
        )}
      </div>

      {/* Modal Detail Artikel */}
      {selectedArticle && (
        <div className="knowledge-modal-backdrop" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <article className="knowledge-detail" style={{ backgroundColor: '#ffffff', color: '#1f2937', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', position: 'relative' }}>
            <button 
              className="knowledge-close-btn" 
              onClick={() => setSelectedArticle(null)} 
              aria-label="Tutup"
              style={{ position: 'absolute', top: '18px', right: '18px', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#4b5563', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              ✕
            </button>

            {/* Badges Tag di Modal Detail */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {(selectedArticle.tags || selectedArticle.nama_kategori || 'Umum').split(',').map((t, idx) => {
                const trimmed = t.trim()
                if (!trimmed) return null
                return (
                  <span key={idx} style={{ fontSize: '11px', fontWeight: '600', color: '#0c4a30', backgroundColor: '#e2f0ea', padding: '3px 10px', borderRadius: '20px' }}>
                    #{trimmed}
                  </span>
                )
              })}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', 
                padding: '12px 24px', 
                borderRadius: '10px', 
                textAlign: 'center', 
                boxShadow: '0 4px 12px rgba(12, 74, 48, 0.2)',
                display: 'inline-block'
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', margin: 0 }}>
                  {selectedArticle.judul}
                </h2>
              </div>
            </div>
            
            <div className="knowledge-detail-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
              <div style={{ background: '#f5f8f6', border: '1px solid #dce5df', borderRadius: '10px', padding: '16px', height: '220px', overflowY: 'auto', boxSizing: 'border-box' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.65', color: '#111827', fontWeight: '600', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                  {selectedArticle.content}
                </p>
              </div>

              <div className="knowledge-media" style={{ display: 'flex', flexDirection: 'column', height: '220px' }}>
                {selectedArticle.video_url ? (
                  youtubeId(selectedArticle.video_url) ? (
                    <a
                      href={`https://www.youtube.com/watch?v=${youtubeId(selectedArticle.video_url)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="video-link"
                      style={{ 
                        display: 'grid', 
                        placeItems: 'center',
                        width: '100%',
                        height: '220px', 
                        backgroundSize: 'cover', 
                        backgroundPosition: 'center', 
                        borderRadius: '10px', 
                        position: 'relative', 
                        textDecoration: 'none',
                        backgroundImage: `url(${youtubeThumbnail(selectedArticle.video_url)})`,
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ position: 'absolute', inset: '0', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', gap: '8px', fontSize: '14px' }}>
                        ▶ <span>Tonton Video Panduan</span>
                      </div>
                    </a>
                  ) : (
                    <a href={selectedArticle.video_url} target="_blank" rel="noreferrer" className="video-link" style={{ display: 'grid', placeItems: 'center', width: '100%', height: '220px', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '10px', position: 'relative', textDecoration: 'none', backgroundImage: `url(${youtubeThumbnail(selectedArticle.video_url)})`, overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: '0', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold', gap: '8px', fontSize: '14px' }}>
                        ▶ <span>Tonton Video Panduan</span>
                      </div>
                    </a>
                  )
                ) : (
                  <div className="video-empty" style={{ width: '100%', height: '220px', display: 'grid', placeItems: 'center', background: '#f3f4f6', textAlign: 'center', borderRadius: '10px', fontSize: '12px', color: '#6b7280', fontWeight: 'bold' }}>
                    Video belum ditambahkan
                  </div>
                )}
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  )
}

export default Knowledge