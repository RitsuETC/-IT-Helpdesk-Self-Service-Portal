import { useMemo, useState } from 'react'

function Troubleshooting({ articles }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const categories = [...new Set(articles.map((article) => article.nama_kategori))]
  const results = useMemo(() => articles.filter((article) => (category === 'all' || article.nama_kategori === category) && article.judul.toLowerCase().includes(query.toLowerCase())), [articles, category, query])

  return <section className="troubleshooting-page"><p className="eyebrow">Troubleshooting</p><h2>Hai, user<br />Apa masalah yang kamu alami?</h2>
    <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari masalah" aria-label="Cari masalah" /></label>
    <p className="eyebrow section-label">Pilih Jenis Masalah</p><div className="problem-types"><button onClick={() => setCategory('all')}>Semua</button>{categories.map((item) => <button key={item} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <p className="eyebrow section-label">Masalah Populer</p><div className="popular-problems">{results.slice(0, 5).map((article) => <button key={article.id} title={article.content}><span>▶</span>{article.judul}</button>)}{!results.length && <p>Tidak ada solusi ditemukan.</p>}</div>
  </section>
}

export default Troubleshooting
