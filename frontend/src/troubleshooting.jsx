import { useMemo, useState } from 'react'
import searchImage from './assets/search.png'

function Troubleshooting({ articles, onOpenArticle }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const categories = [...new Set(articles.map((article) => article.nama_kategori))]
  const results = useMemo(() => articles.filter((article) => (category === 'all' || article.nama_kategori === category) && article.judul.toLowerCase().includes(query.toLowerCase())), [articles, category, query])

  return (
    <section className="troubleshooting-page" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', color: '#1f2937' }}>
      
      {/* Judul Halaman / Eyebrow */}
      <p className="eyebrow" style={{ fontSize: '11px', fontWeight: 'bold', color: '#0c4a30', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Troubleshooting</p>
      
      {/* Judul Utama dengan Kotak Gradasi Hijau Tua */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)', 
        padding: '20px 24px', 
        borderRadius: '14px', 
        marginBottom: '24px', 
        boxShadow: '0 8px 20px rgba(12, 74, 48, 0.25)',
        border: '1px solid #064e3b'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff', margin: 0, lineHeight: '1.4' }}>
          Hai, pengguna<br />Apa masalah yang kamu alami?
        </h2>
      </div>

      {/* Kolom Pencarian */}
      <label className="search" style={{ width: '100%', height: '44px', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 24px', padding: '0 14px', border: '1px solid #d7e2da', borderRadius: '12px', background: '#fff', boxShadow: '0 5px 16px rgb(20 60 30 / .05)', boxSizing: 'border-box' }}>
        <img src={searchImage} alt="" style={{ width: '17px', height: '17px', objectFit: 'contain', opacity: 0.6 }} />
        <input 
          value={query} 
          onChange={(event) => setQuery(event.target.value)} 
          placeholder="Cari masalah" 
          aria-label="Cari masalah" 
          style={{ height: 'auto', padding: 0, border: 0, outline: 0, background: 'transparent', color: '#1f2937', fontSize: '13px', width: '100%' }}
        />
      </label>

      {/* Jenis Masalah / Kategori */}
      <p className="eyebrow section-label" style={{ fontSize: '11px', fontWeight: 'bold', color: '#0c4a30', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Pilih Jenis Masalah</p>
      <div className="problem-types" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
        <button 
          onClick={() => setCategory('all')}
          style={{
            minWidth: '70px',
            height: '36px',
            padding: '0 14px',
            border: category === 'all' ? '1px solid #064e3b' : '1px solid #cfe4cb',
            borderRadius: '20px',
            background: category === 'all' ? 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)' : '#fff',
            color: category === 'all' ? '#fff' : '#0c4a30',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: '.2s ease',
            boxShadow: category === 'all' ? '0 4px 12px rgba(12, 74, 48, 0.2)' : 'none'
          }}
        >
          Semua
        </button>
        {categories.map((item) => (
          <button 
            key={item} 
            onClick={() => setCategory(item)}
            style={{
              minWidth: '70px',
              height: '36px',
              padding: '0 14px',
              border: category === item ? '1px solid #064e3b' : '1px solid #cfe4cb',
              borderRadius: '20px',
              background: category === item ? 'linear-gradient(135deg, #0c4a30 0%, #064e3b 100%)' : '#fff',
              color: category === item ? '#fff' : '#0c4a30',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '.2s ease',
              boxShadow: category === item ? '0 4px 12px rgba(12, 74, 48, 0.2)' : 'none'
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Masalah Populer */}
      <p className="eyebrow section-label" style={{ fontSize: '11px', fontWeight: 'bold', color: '#0c4a30', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Masalah Populer</p>
      <div className="popular-problems" style={{ width: '100%', display: 'grid', gap: '10px', padding: '16px', border: '1px solid #d9e8dc', borderRadius: '16px', background: '#fff', boxShadow: '0 8px 20px rgba(20, 60, 30, 0.05)', boxSizing: 'border-box' }}>
        {results.slice(0, 5).map((article) => (
          <button 
            key={article.id} 
            onClick={() => onOpenArticle(article)}
            style={{
              width: '100%',
              minHeight: '42px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '0 14px',
              border: '1px solid #e2eddf',
              borderRadius: '10px',
              background: '#f5f8f6',
              color: '#0c4a30',
              fontSize: '13px',
              fontWeight: '600',
              textAlign: 'left',
              cursor: 'pointer',
              transition: '.2s ease'
            }}
          >
            <span style={{ color: '#0c4a30', fontSize: '10px' }}>▶</span>
            {article.judul}
          </button>
        ))}
        {!results.length && <p style={{ color: '#6b7280', fontSize: '13px', textAlign: 'center', margin: '16px 0' }}>Tidak ada solusi ditemukan.</p>}
      </div>
    </section>
  )
}

export default Troubleshooting