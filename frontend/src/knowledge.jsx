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

  return (
    <section className="knowledge-page" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto', color: '#1f2937' }}>
      
      {/* Wrapper agar kotak judul berada di tengah (Center) dengan gradasi hijau tua */}
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
      
      {/* Toolbar Pencarian & Filter */}
      <div className="knowledge-filter" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px', background: '#ffffff', padding: '16px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
        <label style={{ display: 'flex', alignItems: 'center', background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '0 12px', flex: '1', minWidth: '240px', height: '40px' }}>
          <img src={searchImage} alt="" style={{ width: '16px', height: '16px', marginRight: '8px', opacity: 0.6 }} />
          <input 
            value={query} 
            onChange={(event) => setQuery(event.target.value)} 
            aria-label="Cari artikel" 
            placeholder="Cari masalah atau panduan..."
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: '#1f2937' }}
          />
        </label>
        <select 
          value={category} 
          onChange={(event) => setCategory(event.target.value)} 
          aria-label="Kategori"
          style={{ height: '40px', padding: '0 14px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '13px', backgroundColor: '#f9fafb', color: '#1f2937', cursor: 'pointer' }}
        >
          <option value="all">Semua Kategori</option>
          {[...new Set(articles.map((article) => article.nama_kategori))].map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>

      {/* Grid Kartu Artikel (2 Kolom dengan Gradasi Hijau Tua) */}
      <div className="article-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {visibleArticles.length === 0 ? (
          <p style={{ color: '#6b7280', fontSize: '13px', gridColumn: '1 / -1', textAlign: 'center', padding: '30px' }}>Tidak ada artikel ditemukan.</p>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <b style={{ fontSize: '11px', color: '#e2f0ea', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '2px 8px', borderRadius: '20px' }}>{article.nama_kategori}</b>
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
            <span style={{ fontSize: '11px', fontWeight: '600', color: '#0c4a30', backgroundColor: '#e2f0ea', padding: '3px 10px', borderRadius: '20px', display: 'inline-block', marginBottom: '8px' }}>{selectedArticle.nama_kategori}</span>
            
            {/* Wrapper Judul Artikel di tengah dengan ukuran menyesuaikan teks & gradasi hijau tua */}
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
            
            {/* Konten & Video sejajar dengan tinggi yang sama */}
            <div className="knowledge-detail-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'stretch' }}>
              
              {/* Kotak Penjelasan Teks */}
              <div style={{ background: '#f5f8f6', border: '1px solid #dce5df', borderRadius: '10px', padding: '16px', height: '220px', overflowY: 'auto', boxSizing: 'border-box' }}>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.65', color: '#111827', fontWeight: '600', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                  {selectedArticle.content}
                </p>
              </div>

              {/* Kotak Media/Video */}
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