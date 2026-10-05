import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { CirclePlus, Search, X } from 'lucide-react'
import { api } from './api.js'

const tabs = [
  ['dashboard', 'Dashboard'], ['assets', 'Data Aset'], ['spareparts', 'Sparepart'],
  ['movements', 'Pergerakan Aset'], ['transactions', 'Transaksi Sparepart'],
  ['maintenance', 'Maintenance'], ['procurement', 'Pengadaan'], ['master-products', 'Master Aset'], ['master-spareparts', 'Master Sparepart']
]

const blankAsset = { asset_code: '', id_category: '', id_master_product: '', id_ruangan: '', id_user: '', brand_model: '', serial_number: '', purchase_year: '', price: '', stock: 0, status: 'available', condition: 'good', notes: '', specifications: '' }
const blankTechnicalSpecs = { processor: '', ram: '', storage: '', operating_system: '', gpu: '', display: '' }
const blankPart = { name: '', id_category: '', id_master_sparepart: '', stock: 0, min_stock: 0, unit: 'pcs', price: '', supplier: '', notes: '' }
const blankMovement = { id_asset: '', id_sparepart: '', id_tiket: '', asset_quantity: 1, sparepart_quantity: 1, id_user: '', from_location: '', to_location: '', movement_type: 'TRANSFER', movement_date: '', condition: '', notes: '' }
const blankTransaction = { id_sparepart: '', transaction_type: 'MASUK', quantity: 1, transaction_date: '', id_tiket: '', notes: '' }
const blankMaintenance = { id_asset: '', id_tiket: '', maintenance_type: 'Preventive', start_date: '', end_date: '', complaint: '', action: '', result: '', cost: 0, status: 'scheduled', vendor: '', notes: '' }
const blankProcurement = { po_number: '', request_date: '', approval_date: '', received_date: '', supplier: '', status: 'draft', notes: '', details: [{ id_asset: '', id_sparepart: '', item_name: '', quantity: 1, unit_price: 0 }] }
const blankMasterProduct = { sku_code: '', product_name: '', id_category: '', default_price: '', processor: '', ram: '', storage: '', operating_system: '', notes: '' }
const blankMasterSparepart = { sku_code: '', sparepart_name: '', id_category: '', default_price: '', unit: 'pcs', min_stock: 0, specifications: '' }

const toDateTimeLocal = (value) => value ? new Date(value).toISOString().slice(0, 16) : ''
const toDateOnly = (value) => value ? String(value).slice(0, 10) : ''

const formatTableDate = (val) => {
  if (!val) return '-';
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(val));
  } catch (e) {
    return val;
  }
}

const rupiah = (value) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`
const csvCell = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`
function downloadCsv(fileName, headers, rows) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
function printReport(title, headers, rows) {
  const escape = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  printDocument(`<!doctype html><html><head><title>${escape(title)}</title><style>body{font:12px Arial;padding:28px;color:#1e293b}h1{font-size:20px;margin:0 0 6px}p{color:#64748b;margin:0 0 20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:left}th{background:#ecfdf5;color:#065f46}@media print{body{padding:0}}</style></head><body><h1>${escape(title)}</h1><p>Dicetak ${escape(new Date().toLocaleString('id-ID'))}</p><table><thead><tr>${headers.map((header) => `<th>${escape(header)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${escape(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`)
}
function printDocument(html) {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.style.cssText = 'position:fixed;width:0;height:0;border:0;visibility:hidden;'
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    window.setTimeout(() => frame.remove(), 1000)
  }
  frame.srcdoc = html
  document.body.appendChild(frame)
}

function Field({ label, children }) { return <label className="inventory-field"><span>{label}</span>{children}</label> }
function Input({ name, value, onChange, type = 'text', required = false, placeholder, min }) { return <input name={name} value={value ?? ''} onChange={onChange} type={type} required={required} placeholder={placeholder} min={min} /> }
function Select({ name, value, onChange, children, required = false }) { return <select name={name} value={value ?? ''} onChange={onChange} required={required}>{children}</select> }
function Textarea({ name, value, onChange, required = false, placeholder, rows = 3 }) { return <textarea name={name} value={value ?? ''} onChange={onChange} required={required} placeholder={placeholder} rows={rows} /> }
function FormActions({ onCancel, label = 'Simpan' }) { return <div className="inventory-form-actions"><button type="submit" className="primary-button">{label}</button>{onCancel && <button type="button" className="secondary-button" onClick={onCancel}>Batal</button>}</div> }

export default function Inventory({ token, user, onBack, onError }) {
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState({ assets: [], spareparts: [], movements: [], transactions: [], maintenance: [], procurement: [], setup: { categories: [], sparepartCategories: [], rooms: [], users: [], tickets: [], masterProducts: [], masterSpareparts: [] }, dashboard: {} })
  
  // STATE ENTITAS & MODAL FORM
  const [asset, setAsset] = useState(blankAsset)
  const [assetEditingId, setAssetEditingId] = useState(null)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [technicalSpecs, setTechnicalSpecs] = useState(blankTechnicalSpecs)

  const [part, setPart] = useState(blankPart)
  const [partEditingId, setPartEditingId] = useState(null)
  const [showPartModal, setShowPartModal] = useState(false)

  const [movement, setMovement] = useState(blankMovement)
  const [showMovementModal, setShowMovementModal] = useState(false)

  const [transaction, setTransaction] = useState(blankTransaction)
  const [showTransactionModal, setShowTransactionModal] = useState(false)

  const [maintenance, setMaintenance] = useState(blankMaintenance)
  const [maintenanceEditingId, setMaintenanceEditingId] = useState(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)

  const [procurement, setProcurement] = useState(blankProcurement)
  const [showProcurementModal, setShowProcurementModal] = useState(false)

  const [masterProduct, setMasterProduct] = useState(blankMasterProduct)
  const [masterProductEditingId, setMasterProductEditingId] = useState(null)
  const [showMasterProductModal, setShowMasterProductModal] = useState(false)

  const [masterSparepart, setMasterSparepart] = useState(blankMasterSparepart)
  const [masterSparepartEditingId, setMasterSparepartEditingId] = useState(null)
  const [showMasterSparepartModal, setShowMasterSparepartModal] = useState(false)

  // STATE LAINNYA
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [selectedPart, setSelectedPart] = useState(null)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showStockModal, setShowStockModal] = useState(false)
  const [stockUpdateItem, setStockUpdateItem] = useState(null)
  const [stockUpdateType, setStockUpdateType] = useState(null) // 'asset' atau 'sparepart'
  const [qrAsset, setQrAsset] = useState(null)
  
  const [search, setSearch] = useState('')
  const [assetFilters, setAssetFilters] = useState({ category: '', location: '', status: '', condition: '' })
  const [partFilters, setPartFilters] = useState({ category: '', stockStatus: '' })
  
  const canManage = ['admin', 'teknisi'].includes(user.role)
  const isAdmin = canManage

  const ITEMS_PER_PAGE = 10
  const [assetPage, setAssetPage] = useState(1)
  const [partPage, setPartPage] = useState(1)
  const [masterPage, setMasterPage] = useState(1)

  useEffect(() => {
    setAssetPage(1)
    setPartPage(1)
    setMasterPage(1)
  }, [tab, search, assetFilters, partFilters])

  const load = async () => {
    try {
      const [dashboard, setup, assets, spareparts, movements, transactions, maintenanceData, procurementData] = await Promise.all([
        api('/inventory/dashboard', { token }), api('/inventory/setup', { token }), api('/inventory/assets', { token }),
        api('/inventory/spareparts', { token }), api('/inventory/movements', { token }), api('/inventory/transactions', { token }),
        api('/inventory/maintenance', { token }), api('/inventory/procurement', { token })
      ])
      setData({ dashboard: dashboard.data, setup: setup.data, assets: assets.data, spareparts: spareparts.data, movements: movements.data, transactions: transactions.data, maintenance: maintenanceData.data, procurement: procurementData.data })
    } catch (error) { onError(error.message) }
  }
  useEffect(() => { load() }, [token])

  useEffect(() => {
    const assetCode = new URLSearchParams(window.location.search).get('asset')
    if (!assetCode || !data.assets.length) return
    const scannedAsset = data.assets.find((item) => item.asset_code === assetCode)
    if (scannedAsset) setSelectedAsset(scannedAsset)
  }, [data.assets])

  const submit = async (event, path, method, body, reset) => {
    event.preventDefault()
    const hasTechnicalSpecs = Object.values(technicalSpecs).some((value) => String(value).trim())
    const requestBody = path.startsWith('/inventory/assets') && hasTechnicalSpecs ? { ...body, specifications: technicalSpecs } : body
    try { 
        await api(path, { token, method, body: requestBody }); 
        reset(); 
        setTechnicalSpecs(blankTechnicalSpecs); 
        await load();
        // Tutup semua form modal setelah sukses simpan
        setShowAssetModal(false); setShowPartModal(false); setShowMovementModal(false); 
        setShowTransactionModal(false); setShowMaintenanceModal(false); setShowProcurementModal(false);
        setShowMasterProductModal(false); setShowMasterSparepartModal(false);
    } catch (error) { onError(error.message) }
  }

  const remove = async (path) => { if (!window.confirm('Hapus data ini?')) return; try { await api(path, { token, method: 'DELETE' }); await load() } catch (error) { onError(error.message) } }
  const update = (setter) => (event) => setter((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  
  const setup = data.setup
  const selectedCategory = useMemo(() => setup.categories.find((item) => String(item.id) === String(asset.id_category)), [setup.categories, asset.id_category])
  const needsTechnicalSpecs = /laptop|pc|komputer|computer|server/i.test(selectedCategory?.name || '')
  
  useEffect(() => { if (!needsTechnicalSpecs) setTechnicalSpecs(blankTechnicalSpecs) }, [needsTechnicalSpecs])
  
  const assets = useMemo(() => {
    return data.assets.filter((item) => 
      JSON.stringify(item).toLowerCase().includes(search.toLowerCase()) && 
      (!assetFilters.category || String(item.id_category) === assetFilters.category) && 
      (!assetFilters.location || String(item.id_ruangan) === assetFilters.location) && 
      (!assetFilters.status || item.status === assetFilters.status) && 
      (!assetFilters.condition || item.condition === assetFilters.condition)
    )
  }, [data.assets, search, assetFilters])
  const paginatedAssets = useMemo(() => assets.slice((assetPage - 1) * ITEMS_PER_PAGE, assetPage * ITEMS_PER_PAGE), [assets, assetPage])

  const parts = useMemo(() => {
    return data.spareparts.filter((item) => {
      const matchSearch = JSON.stringify(item).toLowerCase().includes(search.toLowerCase())
      const matchCat = !partFilters.category || String(item.id_category) === partFilters.category
      const matchLowStock = !partFilters.stockStatus || (partFilters.stockStatus === 'low' ? Number(item.stock) <= Number(item.min_stock) : true)
      return matchSearch && matchCat && matchLowStock
    })
  }, [data.spareparts, search, partFilters])
  const paginatedParts = useMemo(() => parts.slice((partPage - 1) * ITEMS_PER_PAGE, partPage * ITEMS_PER_PAGE), [parts, partPage])

  const masterProductsList = setup.masterProducts || []
  const paginatedMaster = useMemo(() => masterProductsList.slice((masterPage - 1) * ITEMS_PER_PAGE, masterPage * ITEMS_PER_PAGE), [masterProductsList, masterPage])

  const userOptions = setup.users.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.role})</option>)
  const assetOptions = setup.rooms.length >= 0 && data.assets.map((item) => <option key={item.id_asset} value={item.id_asset}>{item.asset_code}</option>)
  const partOptions = data.spareparts.map((item) => <option key={item.id} value={item.id}>{item.name} (stok {item.stock})</option>)
  const exportAssets = () => downloadCsv('laporan-aset', ['Kode aset', 'Kategori', 'Lokasi', 'Pengguna', 'Model', 'Stok', 'Status', 'Kondisi', 'Harga'], data.assets.map((item) => [item.asset_code, item.category_name, item.ruangan, item.user_name, item.brand_model, item.stock, item.status, item.condition, item.price]))
  const exportMaintenance = () => downloadCsv('riwayat-maintenance', ['Aset', 'Referensi tiket', 'Jenis', 'Mulai', 'Selesai', 'Status', 'Vendor', 'PIC', 'Biaya'], data.maintenance.map((item) => [item.asset_code, item.id_tiket ? `HD-${item.id_tiket} ${item.ticket_title || ''}` : '-', item.maintenance_type, formatTableDate(item.start_date), formatTableDate(item.end_date), item.status, item.vendor, item.pic_name, item.cost]))
  const monthlySpending = useMemo(() => Object.values(data.procurement.reduce((result, item) => {
    const date = item.received_date || item.approval_date || item.request_date
    const month = date ? new Date(date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) : 'Tanpa tanggal'
    result[month] = result[month] || { month, count: 0, total: 0 }
    result[month].count += 1
    result[month].total += Number(item.total_cost || 0)
    return result
  }, {})), [data.procurement])
  const exportSpending = () => downloadCsv('rekap-pengeluaran-bulanan', ['Bulan', 'Jumlah pengadaan', 'Total pengeluaran'], monthlySpending.map((item) => [item.month, item.count, item.total]))

  const handleOpenAddAsset = () => { setAsset(blankAsset); setAssetEditingId(null); setTechnicalSpecs(blankTechnicalSpecs); setShowAssetModal(true); }
  const handleOpenEditAsset = (item) => {
    setAsset({ ...blankAsset, ...item, purchase_year: toDateOnly(item.purchase_year) });
    setTechnicalSpecs(item.specifications && typeof item.specifications === 'object' ? item.specifications : blankTechnicalSpecs);
    setAssetEditingId(item.id_asset);
    setShowAssetModal(true);
  }

  const handleOpenAddPart = () => { setPart(blankPart); setPartEditingId(null); setShowPartModal(true); }
  const handleOpenEditPart = (item) => { setPart({ ...blankPart, ...item }); setPartEditingId(item.id); setShowPartModal(true); }

  const handleSaveStock = async (e) => {
    e.preventDefault();
    try {
      if (stockUpdateType === 'asset') {
        const payload = { ...stockUpdateItem, id_category: stockUpdateItem.id_category || null, id_ruangan: Number(stockUpdateItem.id_ruangan), id_user: stockUpdateItem.id_user || null, serial_number: stockUpdateItem.serial_number?.trim() || null, purchase_year: stockUpdateItem.purchase_year || null, price: stockUpdateItem.price || null, stock: Number(stockUpdateItem.stock), specifications: stockUpdateItem.specifications ? { detail: stockUpdateItem.specifications } : null };
        await api(`/inventory/assets/${stockUpdateItem.id_asset}`, { token, method: 'PUT', body: payload });
      } else {
        const payload = { ...stockUpdateItem, id_category: stockUpdateItem.id_category || null, stock: Number(stockUpdateItem.stock), min_stock: Number(stockUpdateItem.min_stock) };
        await api(`/inventory/spareparts/${stockUpdateItem.id}`, { token, method: 'PUT', body: payload });
      }
      setShowStockModal(false);
      setStockUpdateItem(null);
      await load();
    } catch (error) { onError(error.message); }
  }

  const handleEditMaintenance = (item) => { 
      setMaintenance({ ...blankMaintenance, ...item, start_date: toDateTimeLocal(item.start_date), end_date: toDateTimeLocal(item.end_date) }); 
      setMaintenanceEditingId(item.id); 
      setShowMaintenanceModal(true); 
  }

  const handleEditMasterProduct = (item) => {
    const specs = typeof item.specifications === 'string' ? JSON.parse(item.specifications || '{}') : (item.specifications || {})
    setMasterProduct({ ...blankMasterProduct, sku_code: item.sku_code || '', product_name: item.product_name || '', id_category: item.id_category || '', default_price: item.default_price || '', processor: specs.processor || '', ram: specs.ram || '', storage: specs.storage || '', operating_system: specs.operating_system || '', notes: specs.notes || item.notes || '' })
    setMasterProductEditingId(item.id); setShowMasterProductModal(true);
  }

  const handleEditMasterSparepart = (item) => {
    const specs = typeof item.specifications === 'string' ? JSON.parse(item.specifications || '{}') : (item.specifications || {})
    setMasterSparepart({ ...blankMasterSparepart, ...item, specifications: specs.notes || '' })
    setMasterSparepartEditingId(item.id); setShowMasterSparepartModal(true);
  }

  return <section className="inventory-page">
    <div className="inventory-heading">
      <div>
        <button className="text-button" onClick={onBack}>Kembali</button>
        <h2>Inventaris</h2>
        <p>Kelola aset, sparepart, pemeliharaan, dan pengadaan IT.</p>
      </div>
      <span className="role-chip">{user.role}</span>
    </div>

    <div className="inventory-tabs">
      {tabs.map(([id, label]) => (
        <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setSearch('') }}>{label}</button>
      ))}
    </div>

    {/* ===================== DASHBOARD ===================== */}
    {tab === 'dashboard' && (
      <div className="inventory-dashboard">
        <section className="inventory-section" style={{ marginBottom: '20px' }}>
          <div className="inventory-section-title"><div><h3>Laporan Manajerial</h3><span>Ekspor data untuk audit, anggaran, atau arsip.</span></div></div>
          <div className="inventory-report-actions">
            <button className="secondary-button" onClick={exportAssets}>Excel Aset</button>
            <button className="secondary-button" onClick={exportMaintenance}>Excel Maintenance</button>
            <button className="secondary-button" onClick={exportSpending}>Excel Pengeluaran</button>
            <button className="primary-button" onClick={() => printReport('Laporan Aset Inventaris', ['Kode aset', 'Kategori', 'Lokasi', 'Model', 'Stok', 'Status', 'Harga'], data.assets.map((item) => [item.asset_code, item.category_name, item.ruangan, item.brand_model, item.stock, item.status, rupiah(item.price)]))}>PDF Aset</button>
            <button className="primary-button" onClick={() => printReport('Riwayat Maintenance', ['Aset', 'Referensi tiket', 'Jenis', 'Mulai', 'Status', 'Vendor', 'Biaya'], data.maintenance.map((item) => [item.asset_code, item.id_tiket ? `HD-${item.id_tiket} ${item.ticket_title || ''}` : '-', item.maintenance_type, formatTableDate(item.start_date), item.status, item.vendor, rupiah(item.cost)]))}>PDF Maintenance</button>
            <button className="primary-button" onClick={() => printReport('Rekap Pengeluaran Bulanan', ['Bulan', 'Jumlah pengadaan', 'Total pengeluaran'], monthlySpending.map((item) => [item.month, item.count, rupiah(item.total)]))}>PDF Pengeluaran</button>
          </div>
        </section>
        <div className="inventory-stat-grid">
          {[['total_assets', 'Total aset'], ['available_assets', 'Aset tersedia'], ['in_use_assets', 'Sedang digunakan'], ['broken_assets', 'Aset rusak'], ['total_spareparts', 'Total stok sparepart'], ['low_stock_spareparts', 'Stok rendah'], ['active_maintenance', 'Maintenance berjalan'], ['active_procurement', 'Pengadaan berjalan']].map(([key, label]) => (
            <article className="inventory-stat" key={key} data-stat={key}>
              <strong>{data.dashboard[key] ?? 0}</strong>
              <span>{label}</span>
            </article>
          ))}
        </div>
      </div>
    )}

    {/* ===================== TAB: DATA ASET ===================== */}
    {tab === 'assets' && (
      <section className="inventory-section">
        <div className="inventory-section-title">
          <div>
            <h3>Data Aset</h3>
            <span>{assets.length} data tercatat</span>
          </div>
          <div className="inventory-toolbar">
            <label className="asset-search-control flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-600">
              <Search size={16} aria-hidden="true" />
              <input className="min-w-0 flex-1 bg-transparent outline-none" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari kode atau model aset" aria-label="Cari aset" />
            </label>
            {isAdmin && <button onClick={handleOpenAddAsset} className="primary-button inline-flex items-center justify-center gap-2"><CirclePlus size={16} aria-hidden="true" />Tambah Aset</button>}
          </div>
        </div>

        <div className="inventory-filters">
          <Select value={assetFilters.category} onChange={(event) => setAssetFilters({ ...assetFilters, category: event.target.value })}><option value="">Semua kategori</option>{setup.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select value={assetFilters.location} onChange={(event) => setAssetFilters({ ...assetFilters, location: event.target.value })}><option value="">Semua lokasi</option>{setup.rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</Select>
          <Select value={assetFilters.status} onChange={(event) => setAssetFilters({ ...assetFilters, status: event.target.value })}><option value="">Semua status</option><option value="available">Tersedia</option><option value="in_use">Digunakan</option><option value="repair">Perbaikan</option></Select>
          <Select value={assetFilters.condition} onChange={(event) => setAssetFilters({ ...assetFilters, condition: event.target.value })}><option value="">Semua kondisi</option><option value="good">Baik</option><option value="fair">Cukup</option><option value="broken">Rusak</option></Select>
        </div>

        <AssetTable items={paginatedAssets} isAdmin={isAdmin} remove={remove} onView={setSelectedAsset} onEdit={handleOpenEditAsset} onPrintQr={setQrAsset} onUpdateStock={(item) => { setStockUpdateType('asset'); setStockUpdateItem(item); setShowStockModal(true); }} />
        <PaginationControls currentPage={assetPage} totalItems={assets.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setAssetPage} />
      </section>
    )}

    {/* ===================== TAB: DATA SPAREPART ===================== */}
    {tab === 'spareparts' && (
      <section className="inventory-section">
        <div className="inventory-section-title">
          <div>
            <h3>Data Sparepart</h3>
            <span>{parts.length} data tercatat</span>
          </div>
          <div className="inventory-toolbar">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari..." />
            {isAdmin && <button onClick={handleOpenAddPart} className="primary-button">+ Tambah Sparepart</button>}
          </div>
        </div>
        
        <div className="inventory-filters" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <Select value={partFilters.category} onChange={(event) => setPartFilters({ ...partFilters, category: event.target.value })}>
            <option value="">Semua kategori</option>
            {setup.sparepartCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </Select>
          <Select value={partFilters.stockStatus} onChange={(event) => setPartFilters({ ...partFilters, stockStatus: event.target.value })}>
            <option value="">Semua status stok</option>
            <option value="low">Stok Menipis &lt;= Minimum</option>
          </Select>
        </div>

        <PartTable items={paginatedParts} isAdmin={isAdmin} remove={remove} onView={setSelectedPart} onEdit={handleOpenEditPart} onUpdateStock={(item) => { setStockUpdateType('sparepart'); setStockUpdateItem(item); setShowStockModal(true); }} />
        <PaginationControls currentPage={partPage} totalItems={parts.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPartPage} />
      </section>
    )}

    {/* ===================== TAB: TABEL LAINNYA (NON-MODAL CONTENT) ===================== */}
    {tab === 'movements' && (
      <WorkSection title="Pergerakan Inventaris" items={data.movements} itemsPerPage={ITEMS_PER_PAGE} columns={['item_name', 'movement_type', 'quantity', 'from_room', 'to_room', 'movement_date']} labels={['Item', 'Jenis', 'Jumlah', 'Asal', 'Tujuan', 'Tanggal']} renderActions={(item) => <button type="button" className="secondary-button" onClick={() => setSelectedRecord({ title: 'Detail Pergerakan Inventaris', item })}>Detail</button>} onAdd={isAdmin ? () => { setMovement(blankMovement); setShowMovementModal(true); } : null} addLabel="+ Tambah Pergerakan" />
    )}
    
    {tab === 'transactions' && (
      <WorkSection title="Transaksi Sparepart" items={data.transactions} itemsPerPage={ITEMS_PER_PAGE} columns={['sparepart_name', 'transaction_type', 'quantity', 'transaction_date', 'ticket_title', 'pic_name']} labels={['Sparepart', 'Jenis', 'Jumlah', 'Tanggal', 'Referensi tiket', 'PIC']} renderActions={(item) => <button type="button" className="secondary-button" onClick={() => setSelectedRecord({ title: 'Detail Transaksi Sparepart', item })}>Detail</button>} onAdd={isAdmin ? () => { setTransaction(blankTransaction); setShowTransactionModal(true); } : null} addLabel="+ Tambah Transaksi" />
    )}
    
    {tab === 'maintenance' && (
      <WorkSection title="Maintenance" items={data.maintenance} itemsPerPage={ITEMS_PER_PAGE} columns={['asset_code', 'ticket_title', 'maintenance_type', 'start_date', 'end_date', 'status', 'pic_name']} labels={['Aset', 'Referensi tiket', 'Jenis', 'Mulai', 'Selesai', 'Status', 'PIC']} renderCell={(item, column) => column === 'ticket_title' ? (item.id_tiket ? `HD-${item.id_tiket} ${item.ticket_title || '-'}` : '-') : undefined} renderActions={(item) => <div className="inventory-action-group"><button type="button" className="secondary-button" onClick={() => setSelectedRecord({ title: 'Detail Maintenance', item })}>Detail</button>{isAdmin && <button type="button" className="secondary-button" onClick={() => handleEditMaintenance(item)}>Edit</button>}</div>} onAdd={isAdmin ? () => { setMaintenance(blankMaintenance); setMaintenanceEditingId(null); setShowMaintenanceModal(true); } : null} addLabel="+ Tambah Maintenance" />
    )}
    
    {tab === 'procurement' && (
      <WorkSection title="Pengadaan" items={data.procurement} itemsPerPage={ITEMS_PER_PAGE} columns={['po_number', 'request_date', 'supplier', 'status', 'total_cost']} labels={['Nomor PO', 'Pengajuan', 'Supplier', 'Status', 'Total biaya']} renderActions={(item) => <button type="button" className="secondary-button" onClick={() => setSelectedRecord({ title: 'Detail Pengadaan', item })}>Detail</button>} onAdd={isAdmin ? () => { setProcurement(blankProcurement); setShowProcurementModal(true); } : null} addLabel="+ Tambah Pengadaan" />
    )}

    {tab === 'master-products' && (
      <section className="inventory-section">
        <SectionTitle title="Master Produk / SKU" count={masterProductsList.length} search="" onAdd={isAdmin ? () => { setMasterProduct(blankMasterProduct); setMasterProductEditingId(null); setShowMasterProductModal(true); } : null} addLabel="+ Tambah Master Aset" />
        <table className="inventory-table">
          <thead><tr><th>SKU</th><th>Produk</th><th>Kategori</th><th>Harga default</th><th>Aksi</th></tr></thead>
          <tbody>
            {paginatedMaster.map((item) => (
              <tr key={item.id}>
                <td>{item.sku_code}</td><td>{item.product_name}</td><td>{setup.categories.find((category) => String(category.id) === String(item.id_category))?.name || '-'}</td><td>{item.default_price ? `Rp ${Number(item.default_price).toLocaleString('id-ID')}` : '-'}</td>
                <td><div className="inventory-action-group"><button className="secondary-button" type="button" onClick={() => setSelectedRecord({ title: 'Detail Master Produk', item })}>Detail</button>{isAdmin && <><button className="secondary-button" type="button" onClick={() => handleEditMasterProduct(item)}>Edit</button><button className="danger-button" type="button" onClick={() => remove(`/inventory/master-products/${item.id}`)}>Hapus</button></>}</div></td>
              </tr>
            ))}
            {!paginatedMaster.length && <tr><td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>Belum ada master produk.</td></tr>}
          </tbody>
        </table>
        <PaginationControls currentPage={masterPage} totalItems={masterProductsList.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setMasterPage} />
      </section>
    )}

    {tab === 'master-spareparts' && (
      <section className="inventory-section">
        <SectionTitle title="Master Sparepart / SKU" count={(setup.masterSpareparts || []).length} search="" onAdd={isAdmin ? () => { setMasterSparepart(blankMasterSparepart); setMasterSparepartEditingId(null); setShowMasterSparepartModal(true); } : null} addLabel="+ Tambah Master Sparepart" />
        <table className="inventory-table">
          <thead><tr><th>SKU</th><th>Sparepart</th><th>Kategori</th><th>Satuan</th><th>Harga default</th><th>Aksi</th></tr></thead>
          <tbody>
            {(setup.masterSpareparts || []).map((item) => (
              <tr key={item.id}>
                <td>{item.sku_code}</td><td>{item.sparepart_name}</td><td>{setup.sparepartCategories.find((category) => String(category.id) === String(item.id_category))?.name || '-'}</td><td>{item.unit || '-'}</td><td>{item.default_price ? `Rp ${Number(item.default_price).toLocaleString('id-ID')}` : '-'}</td>
                <td><div className="inventory-action-group"><button className="secondary-button" type="button" onClick={() => setSelectedRecord({ title: 'Detail Master Sparepart', item })}>Detail</button>{isAdmin && <><button className="secondary-button" type="button" onClick={() => handleEditMasterSparepart(item)}>Edit</button><button className="danger-button" type="button" onClick={() => remove(`/inventory/master-spareparts/${item.id}`)}>Hapus</button></>}</div></td>
              </tr>
            ))}
            {!(setup.masterSpareparts || []).length && <tr><td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>Belum ada master sparepart.</td></tr>}
          </tbody>
        </table>
      </section>
    )}

    {/* ===================== KUMPULAN MODAL POPUP FORM ===================== */}
    
    {/* Modal Update Stok (Quick Action) */}
    {showStockModal && stockUpdateItem && (
      <div className="modal-backdrop" onClick={() => setShowStockModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '400px', position: 'relative' }}>
          <button type="button" onClick={() => setShowStockModal(false)} style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>Tutup</button>
          <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#0f172a' }}>Update Stok: {stockUpdateItem.asset_code || stockUpdateItem.name}</h3>
          <form onSubmit={handleSaveStock}>
            <Field label="Total Stok Saat Ini"><Input type="number" min="0" value={stockUpdateItem.stock} onChange={(e) => setStockUpdateItem({ ...stockUpdateItem, stock: e.target.value })} required /></Field>
            <div style={{ marginTop: '20px' }}><FormActions label="Simpan Stok" onCancel={() => setShowStockModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {/* Modal Aset */}
    {showAssetModal && (
        <div className="modal-backdrop" onClick={() => setShowAssetModal(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h2 style={{ margin: '0', color: '#0f172a' }}>{assetEditingId ? 'Edit Data Aset' : 'Tambah Aset Baru'}</h2>
                    <button type="button" onClick={() => setShowAssetModal(false)} aria-label="Tutup form aset" title="Tutup" className="inventory-modal-close"><X size={18} aria-hidden="true" /></button>
                </div>
                <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => submit(event, assetEditingId ? `/inventory/assets/${assetEditingId}` : '/inventory/assets', assetEditingId ? 'PUT' : 'POST', { ...asset, id_category: asset.id_category || null, id_ruangan: Number(asset.id_ruangan), id_user: asset.id_user || null, serial_number: asset.serial_number?.trim() || null, purchase_year: asset.purchase_year || null, price: asset.price || null, stock: Number(asset.stock), specifications: asset.specifications ? { detail: asset.specifications } : null }, () => { setAsset(blankAsset); setAssetEditingId(null) })}>
                    <div style={{ gridColumn: '1 / -1', background: '#e0f2fe', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <Field label="Isi Otomatis dari Master Produk / SKU (Opsional)">
                            <Select name="id_master_product" value={asset.id_master_product || ''} onChange={(e) => { const selectedId = e.target.value; const master = setup.masterProducts?.find(m => String(m.id) === String(selectedId)); setAsset(prev => ({ ...prev, id_master_product: selectedId, ...(master ? { id_category: master.id_category || prev.id_category, brand_model: master.product_name || prev.brand_model, price: master.default_price || prev.price } : {}) })); if (master?.specifications) { setTechnicalSpecs(typeof master.specifications === 'string' ? JSON.parse(master.specifications) : master.specifications); } }}>
                                <option value="">-- Ketik manual atau pilih SKU dari Master Data --</option>
                                {setup.masterProducts?.map(master => <option key={master.id} value={master.id}>[{master.sku_code}] - {master.product_name}</option>)}
                            </Select>
                        </Field>
                    </div>
                    <Field label="Kode Aset *"><Input name="asset_code" value={asset.asset_code} onChange={update(setAsset)} required /></Field>
                    <Field label="Kategori"><Select name="id_category" value={asset.id_category} onChange={update(setAsset)}><option value="">Pilih kategori</option>{setup.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                    <Field label="Lokasi/Ruangan *"><Select name="id_ruangan" value={asset.id_ruangan} onChange={update(setAsset)} required><option value="">Pilih ruangan</option>{setup.rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</Select></Field>
                    <Field label="Pengguna"><Select name="id_user" value={asset.id_user} onChange={update(setAsset)}><option value="">Tidak ada</option>{userOptions}</Select></Field>
                    <Field label="Merek/Model"><Input name="brand_model" value={asset.brand_model} onChange={update(setAsset)} /></Field>
                    <Field label="Serial Number"><Input name="serial_number" value={asset.serial_number} onChange={update(setAsset)} /></Field>
                    <Field label="Tanggal Pembelian"><Input name="purchase_year" value={asset.purchase_year} onChange={update(setAsset)} type="date" /></Field>
                    <Field label="Harga"><Input name="price" value={asset.price} onChange={update(setAsset)} type="number" min="0" /></Field>
                    <Field label="Stok"><Input name="stock" value={asset.stock} onChange={update(setAsset)} type="number" min="0" /></Field>
                    <Field label="Status"><Select name="status" value={asset.status} onChange={update(setAsset)}><option value="available">Tersedia</option><option value="in_use">Digunakan</option><option value="repair">Perbaikan</option><option value="retired">Tidak digunakan</option></Select></Field>
                    <Field label="Kondisi"><Select name="condition" value={asset.condition} onChange={update(setAsset)}><option value="good">Baik</option><option value="fair">Cukup</option><option value="broken">Rusak</option></Select></Field>
                    <div style={{ gridColumn: '1 / -1' }}><Field label="Catatan Tambahan"><Textarea name="notes" value={asset.notes} onChange={update(setAsset)} placeholder="Tambahkan deskripsi atau catatan mengenai aset ini..." /></Field></div>
                    {needsTechnicalSpecs && <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}><TechnicalSpecsForm categoryName={selectedCategory?.name} values={technicalSpecs} onChange={(event) => setTechnicalSpecs((current) => ({ ...current, [event.target.name]: event.target.value }))} /></div>}
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}><FormActions label={assetEditingId ? 'Simpan perubahan' : 'Simpan Aset Baru'} onCancel={() => setShowAssetModal(false)} /></div>
                </form>
            </div>
        </div>
    )}
    
    {/* Modal Sparepart */}
    {showPartModal && (
        <div className="modal-backdrop" onClick={() => setShowPartModal(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h2 style={{ margin: '0', color: '#0f172a' }}>{partEditingId ? 'Edit Data Sparepart' : 'Tambah Sparepart Baru'}</h2>
                    <button type="button" onClick={() => setShowPartModal(false)} aria-label="Tutup form sparepart" title="Tutup" className="inventory-modal-close"><X size={18} aria-hidden="true" /></button>
                </div>
                <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => submit(event, partEditingId ? `/inventory/spareparts/${partEditingId}` : '/inventory/spareparts', partEditingId ? 'PUT' : 'POST', { ...part, id_category: part.id_category || null, stock: Number(part.stock), min_stock: Number(part.min_stock) }, () => { setPart(blankPart); setPartEditingId(null) })}>
                    <div style={{ gridColumn: '1 / -1', background: '#e0f2fe', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <Field label="Isi dari Master Sparepart (opsional)">
                        <Select name="id_master_sparepart" value={part.id_master_sparepart || ''} onChange={(event) => { const selectedId = event.target.value; const master = (setup.masterSpareparts || []).find((item) => String(item.id) === selectedId); setPart((current) => ({ ...current, id_master_sparepart: selectedId, ...(master ? { name: master.sparepart_name, id_category: master.id_category || '', price: master.default_price || '', unit: master.unit || 'pcs', min_stock: master.min_stock || 0, notes: (typeof master.specifications === 'string' ? JSON.parse(master.specifications || '{}') : master.specifications)?.notes || current.notes } : {}) })) }}>
                          <option value="">-- Pilih SKU untuk isi otomatis --</option>
                          {(setup.masterSpareparts || []).map((item) => <option key={item.id} value={item.id}>[{item.sku_code}] - {item.sparepart_name}</option>)}
                        </Select>
                      </Field>
                    </div>
                    <Field label="Nama sparepart *"><Input name="name" value={part.name} onChange={update(setPart)} required /></Field>
                    <Field label="Kategori"><Select name="id_category" value={part.id_category} onChange={update(setPart)}><option value="">Pilih kategori</option>{setup.sparepartCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                    <Field label="Stok"><Input name="stock" value={part.stock} onChange={update(setPart)} type="number" min="0" /></Field>
                    <Field label="Stok minimum"><Input name="min_stock" value={part.min_stock} onChange={update(setPart)} type="number" min="0" /></Field>
                    <Field label="Satuan"><Input name="unit" value={part.unit} onChange={update(setPart)} /></Field>
                    <Field label="Harga"><Input name="price" value={part.price} onChange={update(setPart)} type="number" min="0" /></Field>
                    <Field label="Supplier"><Input name="supplier" value={part.supplier} onChange={update(setPart)} /></Field>
                    <div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={part.notes} onChange={update(setPart)} /></Field></div>
                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}><FormActions label={partEditingId ? 'Simpan perubahan' : 'Simpan Sparepart Baru'} onCancel={() => setShowPartModal(false)} /></div>
                </form>
            </div>
        </div>
    )}

    {/* Modal Movement */}
    {showMovementModal && (
      <div className="modal-backdrop" onClick={() => setShowMovementModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}><h2 style={{ margin: '0' }}>Catat Pergerakan</h2><button onClick={() => setShowMovementModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button></div>
          <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/movements', 'POST', { ...movement, id_asset: movement.id_asset || null, id_sparepart: movement.id_sparepart || null, asset_quantity: Number(movement.asset_quantity || 0), sparepart_quantity: Number(movement.sparepart_quantity || 0), id_user: movement.id_user || null, from_location: movement.from_location || null, to_location: movement.to_location || null, movement_date: movement.movement_date || new Date().toISOString().slice(0, 16) }, () => setMovement(blankMovement))}>
            <Field label="Aset (opsional)"><Select name="id_asset" value={movement.id_asset} onChange={update(setMovement)}><option value="">Tidak ada aset</option>{assetOptions}</Select></Field>
            {movement.id_asset && <Field label="Jumlah aset *"><Input name="asset_quantity" value={movement.asset_quantity} onChange={update(setMovement)} type="number" min="1" required /></Field>}
            <Field label="Sparepart (opsional)"><Select name="id_sparepart" value={movement.id_sparepart} onChange={update(setMovement)}><option value="">Tidak ada sparepart</option>{partOptions}</Select></Field>
            {movement.id_sparepart && <Field label="Jumlah sparepart *"><Input name="sparepart_quantity" value={movement.sparepart_quantity} onChange={update(setMovement)} type="number" min="1" required /></Field>}
            <Field label="Pengguna"><Select name="id_user" value={movement.id_user} onChange={update(setMovement)}><option value="">Tidak berubah</option>{userOptions}</Select></Field>
            <Field label="Lokasi asal"><RoomSelect value={movement.from_location} onChange={update(setMovement)} name="from_location" rooms={setup.rooms} /></Field>
            <Field label="Lokasi tujuan"><RoomSelect value={movement.to_location} onChange={update(setMovement)} name="to_location" rooms={setup.rooms} /></Field>
            <Field label="Referensi tiket"><Select name="id_tiket" value={movement.id_tiket} onChange={update(setMovement)}><option value="">Tidak ada</option>{setup.tickets.map((item) => <option key={item.id} value={item.id}>HD-{item.id} · {item.judul}</option>)}</Select></Field>
            <Field label="Jenis pergerakan"><Input name="movement_type" value={movement.movement_type} onChange={update(setMovement)} required /></Field>
            {movement.id_asset && <Field label="Kondisi Aset"><Select name="condition" value={movement.condition} onChange={update(setMovement)}><option value="">Tidak berubah</option><option value="good">Baik</option><option value="fair">Cukup</option><option value="broken">Rusak</option></Select></Field>}
            <Field label="Tanggal Pergerakan"><Input name="movement_date" type="datetime-local" value={movement.movement_date} onChange={update(setMovement)} /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={movement.notes} onChange={update(setMovement)} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><FormActions label="Catat pergerakan" onCancel={() => setShowMovementModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {/* Modal Transaction */}
    {showTransactionModal && (
      <div className="modal-backdrop" onClick={() => setShowTransactionModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}><h2 style={{ margin: '0' }}>Catat Transaksi</h2><button onClick={() => setShowTransactionModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button></div>
          <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/transactions', 'POST', { ...transaction, id_sparepart: Number(transaction.id_sparepart), quantity: Number(transaction.quantity), id_tiket: transaction.id_tiket || null, transaction_date: transaction.transaction_date || new Date().toISOString().slice(0, 16) }, () => setTransaction(blankTransaction))}>
            <Field label="Sparepart *"><Select name="id_sparepart" value={transaction.id_sparepart} onChange={update(setTransaction)} required><option value="">Pilih sparepart</option>{partOptions}</Select></Field>
            <Field label="Jenis transaksi"><Select name="transaction_type" value={transaction.transaction_type} onChange={update(setTransaction)}><option value="MASUK">MASUK</option><option value="KELUAR">KELUAR</option></Select></Field>
            <Field label="Jumlah *"><Input name="quantity" value={transaction.quantity} onChange={update(setTransaction)} type="number" min="1" required /></Field>
            <Field label="Tanggal Transaksi"><Input name="transaction_date" type="datetime-local" value={transaction.transaction_date} onChange={update(setTransaction)} /></Field>
            <Field label="Referensi tiket"><Select name="id_tiket" value={transaction.id_tiket} onChange={update(setTransaction)}><option value="">Tidak ada</option>{setup.tickets.map((item) => <option key={item.id} value={item.id}>#{item.id} {item.judul}</option>)}</Select></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={transaction.notes} onChange={update(setTransaction)} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><FormActions label="Catat transaksi" onCancel={() => setShowTransactionModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {/* Modal Maintenance */}
    {showMaintenanceModal && (
      <div className="modal-backdrop" onClick={() => setShowMaintenanceModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}><h2 style={{ margin: '0' }}>{maintenanceEditingId ? 'Edit Maintenance' : 'Catat Maintenance'}</h2><button onClick={() => setShowMaintenanceModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button></div>
          <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => submit(event, maintenanceEditingId ? `/inventory/maintenance/${maintenanceEditingId}` : '/inventory/maintenance', maintenanceEditingId ? 'PUT' : 'POST', { ...maintenance, id_asset: Number(maintenance.id_asset), id_tiket: maintenance.id_tiket || null, end_date: maintenance.end_date || null, cost: Number(maintenance.cost || 0) }, () => { setMaintenance(blankMaintenance); setMaintenanceEditingId(null) })}>
            <Field label="Aset *"><Select name="id_asset" value={maintenance.id_asset} onChange={update(setMaintenance)} required><option value="">Pilih aset</option>{assetOptions}</Select></Field>
            <Field label="Referensi Tiket"><Select name="id_tiket" value={maintenance.id_tiket} onChange={update(setMaintenance)}><option value="">Tidak ada</option>{setup.tickets.map((item) => <option key={item.id} value={item.id}>#{item.id} {item.judul}</option>)}</Select></Field>
            <Field label="Jenis maintenance *"><Select name="maintenance_type" value={maintenance.maintenance_type} onChange={update(setMaintenance)} required><option value="Preventive">Preventive</option><option value="Corrective">Corrective</option><option value="Inspection">Inspection</option></Select></Field>
            <Field label="Tanggal mulai *"><Input name="start_date" value={maintenance.start_date} onChange={update(setMaintenance)} type="datetime-local" required /></Field>
            <Field label="Tanggal selesai"><Input name="end_date" value={maintenance.end_date} onChange={update(setMaintenance)} type="datetime-local" /></Field>
            <Field label="Status"><Select name="status" value={maintenance.status} onChange={update(setMaintenance)}><option value="scheduled">Terjadwal</option><option value="in_progress">Berjalan</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></Select></Field>
            <Field label="Vendor"><Input name="vendor" value={maintenance.vendor} onChange={update(setMaintenance)} /></Field>
            <Field label="Biaya"><Input name="cost" value={maintenance.cost} onChange={update(setMaintenance)} type="number" min="0" /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Keluhan"><Textarea name="complaint" value={maintenance.complaint} onChange={update(setMaintenance)} rows={2} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Tindakan / Hasil"><Textarea name="result" value={maintenance.result} onChange={update(setMaintenance)} rows={2} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Catatan Tambahan"><Textarea name="notes" value={maintenance.notes} onChange={update(setMaintenance)} rows={2} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><FormActions label={maintenanceEditingId ? 'Simpan perubahan' : 'Catat maintenance'} onCancel={() => setShowMaintenanceModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {/* Modal Procurement */}
    {showProcurementModal && (
      <div className="modal-backdrop" onClick={() => setShowProcurementModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}><h2 style={{ margin: '0' }}>Catat Pengadaan</h2><button onClick={() => setShowProcurementModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button></div>
          <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/procurement', 'POST', { ...procurement, details: procurement.details.filter((item) => item.item_name.trim()) }, () => setProcurement(blankProcurement))}>
            <Field label="Nomor PO *"><Input name="po_number" value={procurement.po_number} onChange={update(setProcurement)} required /></Field>
            <Field label="Tanggal pengajuan"><Input name="request_date" value={procurement.request_date} onChange={update(setProcurement)} type="date" /></Field>
            <Field label="Tanggal persetujuan"><Input name="approval_date" value={procurement.approval_date} onChange={update(setProcurement)} type="date" /></Field>
            <Field label="Tanggal penerimaan"><Input name="received_date" value={procurement.received_date} onChange={update(setProcurement)} type="date" /></Field>
            <Field label="Supplier"><Input name="supplier" value={procurement.supplier} onChange={update(setProcurement)} /></Field>
            <Field label="Status"><Select name="status" value={procurement.status} onChange={update(setProcurement)}><option value="draft">Draft</option><option value="submitted">Diajukan</option><option value="approved">Disetujui</option><option value="received">Diterima</option><option value="cancelled">Dibatalkan</option></Select></Field>
            <Field label="Sparepart (untuk tambah stok)"><Select value={procurement.details[0].id_sparepart} onChange={(event) => { const selected = data.spareparts.find((item) => String(item.id) === event.target.value); setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], id_sparepart: event.target.value, item_name: selected?.name || previous.details[0].item_name, unit_price: selected?.price || previous.details[0].unit_price }] })) }}><option value="">Tidak terhubung ke stok</option>{partOptions}</Select></Field>
            <Field label="Aset (untuk tambah stok)"><Select value={procurement.details[0].id_asset} onChange={(event) => { const selected = data.assets.find((item) => String(item.id_asset) === event.target.value); setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], id_asset: event.target.value, item_name: selected?.asset_code || previous.details[0].item_name, unit_price: selected?.price || previous.details[0].unit_price }] })) }}><option value="">Tidak terhubung ke stok</option>{assetOptions}</Select></Field>
            <Field label="Barang Utama"><Input value={procurement.details[0].item_name} onChange={(event) => setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], item_name: event.target.value }] }))} required /></Field>
            <Field label="Jumlah"><Input type="number" min="1" value={procurement.details[0].quantity} onChange={(event) => setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], quantity: event.target.value }] }))} /></Field>
            <Field label="Harga satuan"><Input type="number" min="0" value={procurement.details[0].unit_price} onChange={(event) => setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], unit_price: event.target.value }] }))} /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={procurement.notes} onChange={update(setProcurement)} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><FormActions label="Simpan pengadaan" onCancel={() => setShowProcurementModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {/* Modal Master Product */}
    {showMasterProductModal && (
      <div className="modal-backdrop" onClick={() => setShowMasterProductModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}><h2 style={{ margin: '0' }}>{masterProductEditingId ? 'Edit Master Aset' : 'Tambah Master Aset'}</h2><button onClick={() => setShowMasterProductModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button></div>
          <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => { const { sku_code, product_name, id_category, default_price, processor, ram, storage, operating_system, notes } = masterProduct; const specifications = Object.fromEntries(Object.entries({ processor, ram, storage, operating_system, notes }).filter(([, value]) => String(value || '').trim())); submit(event, masterProductEditingId ? `/inventory/master-products/${masterProductEditingId}` : '/inventory/master-products', masterProductEditingId ? 'PUT' : 'POST', { sku_code, product_name, id_category: id_category || null, default_price: default_price || null, specifications }, () => { setMasterProduct(blankMasterProduct); setMasterProductEditingId(null); }) }}>
            <Field label="Kode SKU *"><Input name="sku_code" value={masterProduct.sku_code} onChange={update(setMasterProduct)} placeholder="Contoh: LEN-THINK-14-G5" required /></Field>
            <Field label="Nama produk / model *"><Input name="product_name" value={masterProduct.product_name} onChange={update(setMasterProduct)} placeholder="Contoh: Lenovo ThinkPad E14 Gen 5" required /></Field>
            <Field label="Kategori aset"><Select name="id_category" value={masterProduct.id_category} onChange={update(setMasterProduct)}><option value="">Pilih kategori</option>{setup.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Harga default"><Input name="default_price" value={masterProduct.default_price} onChange={update(setMasterProduct)} type="number" min="0" /></Field>
            <Field label="Processor"><Input name="processor" value={masterProduct.processor} onChange={update(setMasterProduct)} /></Field>
            <Field label="RAM"><Input name="ram" value={masterProduct.ram} onChange={update(setMasterProduct)} /></Field>
            <Field label="Penyimpanan"><Input name="storage" value={masterProduct.storage} onChange={update(setMasterProduct)} /></Field>
            <Field label="Sistem operasi"><Input name="operating_system" value={masterProduct.operating_system} onChange={update(setMasterProduct)} /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Catatan / spesifikasi tambahan"><Textarea name="notes" value={masterProduct.notes} onChange={update(setMasterProduct)} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><FormActions label="Simpan master produk" onCancel={() => setShowMasterProductModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {/* Modal Master Sparepart */}
    {showMasterSparepartModal && (
      <div className="modal-backdrop" onClick={() => setShowMasterSparepartModal(false)}>
        <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}><h2 style={{ margin: '0' }}>{masterSparepartEditingId ? 'Edit Master Sparepart' : 'Tambah Master Sparepart'}</h2><button onClick={() => setShowMasterSparepartModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button></div>
          <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }} onSubmit={(event) => { const { sku_code, sparepart_name, id_category, default_price, unit, min_stock, specifications } = masterSparepart; submit(event, masterSparepartEditingId ? `/inventory/master-spareparts/${masterSparepartEditingId}` : '/inventory/master-spareparts', masterSparepartEditingId ? 'PUT' : 'POST', { sku_code, sparepart_name, id_category: id_category || null, default_price: default_price || null, unit, min_stock: Number(min_stock || 0), specifications: specifications ? { notes: specifications } : {} }, () => { setMasterSparepart(blankMasterSparepart); setMasterSparepartEditingId(null); }) }}>
            <Field label="Kode SKU *"><Input name="sku_code" value={masterSparepart.sku_code} onChange={update(setMasterSparepart)} placeholder="Contoh: RAM-DDR4-8GB" required /></Field>
            <Field label="Nama sparepart *"><Input name="sparepart_name" value={masterSparepart.sparepart_name} onChange={update(setMasterSparepart)} required /></Field>
            <Field label="Kategori"><Select name="id_category" value={masterSparepart.id_category} onChange={update(setMasterSparepart)}><option value="">Pilih kategori</option>{setup.sparepartCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
            <Field label="Harga default"><Input name="default_price" value={masterSparepart.default_price} onChange={update(setMasterSparepart)} type="number" min="0" /></Field>
            <Field label="Satuan"><Input name="unit" value={masterSparepart.unit} onChange={update(setMasterSparepart)} /></Field>
            <Field label="Stok minimum"><Input name="min_stock" value={masterSparepart.min_stock} onChange={update(setMasterSparepart)} type="number" min="0" /></Field>
            <div style={{ gridColumn: '1 / -1' }}><Field label="Spesifikasi / catatan"><Textarea name="specifications" value={masterSparepart.specifications} onChange={update(setMasterSparepart)} /></Field></div>
            <div style={{ gridColumn: '1 / -1' }}><FormActions label="Simpan master sparepart" onCancel={() => setShowMasterSparepartModal(false)} /></div>
          </form>
        </div>
      </div>
    )}

    {selectedAsset && <AssetDetailModal asset={selectedAsset} maintenance={data.maintenance.filter((item) => Number(item.id_asset) === Number(selectedAsset.id_asset))} movements={data.movements.filter((item) => Number(item.id_asset) === Number(selectedAsset.id_asset))} onClose={() => setSelectedAsset(null)} />}
    {selectedPart && <PartDetailModal part={selectedPart} onClose={() => setSelectedPart(null)} />}
    {qrAsset && <AssetQrModal asset={qrAsset} onClose={() => setQrAsset(null)} />}
    {selectedRecord && <RecordDetailModal title={selectedRecord.title} item={selectedRecord.item} categories={selectedRecord.title.includes('Sparepart') ? setup.sparepartCategories : setup.categories} onClose={() => setSelectedRecord(null)} />}
  </section>
}

// ======================= KOMPONEN PELENGKAP =======================

function PaginationControls({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  if (totalItems === 0) return null
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari total {totalItems} data
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} className="secondary-button">Pertama</button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="secondary-button">Sebelumnya</button>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hal {currentPage} / {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="secondary-button">Selanjutnya</button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} className="secondary-button">Terakhir</button>
      </div>
    </div>
  )
}

function WorkSection({ title, items, columns, labels, itemsPerPage = 10, children, renderCell, renderActions, onAdd, addLabel }) {
  const [currentPage, setCurrentPage] = useState(1)
  useEffect(() => { setCurrentPage(1) }, [items])
  const paginatedItems = useMemo(() => items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [items, currentPage, itemsPerPage])

  return (
    <section className="inventory-section" style={{ marginTop: '20px' }}>
      <div className="inventory-section-title">
        <div><h3>{title}</h3><span>{items.length} data tercatat</span></div>
        {onAdd && <button onClick={onAdd} className="primary-button">{addLabel}</button>}
      </div>
      {children}
      <div style={{ overflowX: 'auto' }}>
        <table className="inventory-table">
          <thead><tr>{labels.map((label) => <th key={label}>{label}</th>)}{renderActions && <th>Aksi</th>}</tr></thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id || `${item.asset_code}-${item.movement_date}`}>
                {columns.map((column) => (
                  <td key={column}>{renderCell?.(item, column) ?? (column.includes('date') ? formatTableDate(item[column]) : (item[column] ?? '-'))}</td>
                ))}
                {renderActions && <td>{renderActions(item)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationControls currentPage={currentPage} totalItems={items.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
    </section>
  ) 
}

function SectionTitle({ title, count, search, setSearch, onAdd, addLabel }) { 
  return (
    <div className="inventory-section-title">
      <div><h3>{title}</h3><span>{count} data tercatat</span></div>
      <div className="inventory-toolbar">
        {setSearch && (<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari..." />)}
        {onAdd && <button onClick={onAdd} className="primary-button">{addLabel}</button>}
      </div>
    </div>
  ) 
}

const recordLabels = {
  id: 'ID', id_asset: 'ID aset', id_sparepart: 'ID sparepart', id_tiket: 'ID tiket',
  item_name: 'Item', asset_code: 'Kode aset', sparepart_name: 'Nama sparepart',
  movement_type: 'Jenis pergerakan', transaction_type: 'Jenis transaksi', quantity: 'Jumlah',
  asset_quantity: 'Jumlah aset', sparepart_quantity: 'Jumlah sparepart', from_room: 'Lokasi asal', to_room: 'Lokasi tujuan',
  movement_date: 'Tanggal pergerakan', transaction_date: 'Tanggal transaksi', ticket_title: 'Referensi tiket', pic_name: 'PIC',
  maintenance_type: 'Jenis maintenance', start_date: 'Tanggal mulai', end_date: 'Tanggal selesai', complaint: 'Keluhan', action: 'Tindakan', result: 'Hasil', cost: 'Biaya', status: 'Status', vendor: 'Vendor', notes: 'Catatan',
  po_number: 'Nomor PO', request_date: 'Tanggal pengajuan', approval_date: 'Tanggal persetujuan', received_date: 'Tanggal penerimaan', supplier: 'Supplier', total_cost: 'Total biaya', details: 'Rincian pengadaan',
  sku_code: 'Kode SKU', product_name: 'Nama produk', id_category: 'Kategori', default_price: 'Harga default', unit: 'Satuan', min_stock: 'Stok minimum', specifications: 'Spesifikasi', created_at: 'Dibuat', updated_at: 'Diperbarui'
}
function displayRecordValue(key, value) {
  if (value == null || value === '') return '-'
  if (key.includes('date') || key.endsWith('_at')) return formatTableDate(value)
  if (['price', 'cost', 'total_cost', 'default_price', 'unit_price'].includes(key)) return rupiah(value)
  if (typeof value === 'object') return Array.isArray(value)
    ? value.map((item, index) => `${index + 1}. ${item.item_name || item.asset_code || item.sparepart_name || 'Item'} — ${item.quantity ?? 0} × ${rupiah(item.unit_price)}`).join('\n')
    : Object.entries(value).map(([name, detail]) => `${name.replace(/_/g, ' ')}: ${detail}`).join('\n')
  return String(value)
}

function RecordDetailModal({ title, item, categories = [], onClose }) {
  const isMasterProduct = /Master Produk|Master Aset/i.test(title)
  const isMasterSparepart = /Master Sparepart/i.test(title)
  const isMasterRecord = isMasterProduct || isMasterSparepart

  const parseSpecifications = (value) => {
    if (!value) return {}
    if (typeof value === 'object' && !Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : { detail: value }
      } catch {
        return { detail: value }
      }
    }
    return {}
  }

  const specifications = parseSpecifications(item.specifications)
  const categoryName = categories.find((category) => String(category.id) === String(item.id_category))?.name
  const productName = item.product_name || item.sparepart_name || item.name || '-'
  const skuCode = item.sku_code || '-'
  const defaultPrice = item.default_price != null && item.default_price !== '' ? rupiah(item.default_price) : '-'

  const specEntries = Object.entries(specifications).filter(([key, value]) => {
    return !['notes', 'detail'].includes(key) && value != null && String(value).trim() !== ''
  })

  const extraFields = Object.entries(item).filter(([key, value]) => {
    const excluded = [
      'id_pic', 'id_user', 'id_category', 'sku_code', 'product_name', 'sparepart_name',
      'default_price', 'specifications', 'created_at', 'updated_at', 'notes'
    ]
    return !excluded.includes(key) && value != null && value !== ''
  })

  const masterNotes = specifications.notes || specifications.detail || item.notes || ''

  const renderValue = (key, value) => {
    if (value == null || value === '') return '-'
    if (key.includes('date') || key.endsWith('_at')) return formatTableDate(value)
    if (['price', 'cost', 'total_cost', 'default_price', 'unit_price'].includes(key)) return rupiah(value)
    if (typeof value === 'object') return displayRecordValue(key, value)
    return String(value)
  }

  const DetailCard = ({ label, value, wide = false, accent = false }) => (
    <div style={{
      gridColumn: wide ? '1 / -1' : undefined,
      minWidth: 0,
      padding: '14px 15px',
      background: accent ? '#f0fdf4' : '#f8fafc',
      border: `1px solid ${accent ? '#bbf7d0' : '#e2e8f0'}`,
      borderRadius: '10px',
      boxSizing: 'border-box'
    }}>
      <span style={{
        display: 'block',
        marginBottom: '6px',
        color: '#64748b',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em'
      }}>{label}</span>
      <strong style={{
        display: 'block',
        color: accent ? '#047857' : '#1e293b',
        fontSize: '13px',
        lineHeight: 1.45,
        fontWeight: 650,
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap'
      }}>{value || '-'}</strong>
    </div>
  )

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-detail-title"
        onClick={(event) => event.stopPropagation()}
        style={{
          background: '#fff',
          width: 'min(760px, calc(100vw - 28px))',
          maxHeight: '88vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          borderRadius: '18px',
          position: 'relative',
          boxShadow: '0 24px 70px rgba(15, 23, 42, 0.22)',
          border: '1px solid rgba(226, 232, 240, 0.95)'
        }}
      >
        <div style={{
          height: '5px',
          background: 'linear-gradient(90deg, #047857, #10b981)',
          borderRadius: '18px 18px 0 0'
        }} />

        <div style={{ padding: '22px 24px 24px' }}>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              width: '34px',
              height: '34px',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '19px',
              lineHeight: 1,
              cursor: 'pointer'
            }}
          >×</button>

          <div style={{ paddingRight: '48px', marginBottom: '20px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '5px 9px',
              marginBottom: '9px',
              borderRadius: '999px',
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #d1fae5',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              {isMasterRecord ? 'Master Data' : 'Detail Data'}
            </div>

            <h2 id="record-detail-title" style={{
              margin: 0,
              color: '#0f172a',
              fontSize: '22px',
              lineHeight: 1.2,
              fontWeight: 750
            }}>{title}</h2>

            {isMasterRecord && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '8px',
                marginTop: '10px'
              }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '5px 9px',
                  borderRadius: '7px',
                  background: '#f1f5f9',
                  border: '1px solid #e2e8f0',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 700
                }}>SKU: {skuCode}</span>
                <span style={{
                  color: '#64748b',
                  fontSize: '13px',
                  overflowWrap: 'anywhere'
                }}>{productName}</span>
              </div>
            )}
          </div>

          {isMasterRecord ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <section>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '9px',
                  marginBottom: '11px'
                }}>
                  <div style={{ width: '4px', height: '18px', borderRadius: '999px', background: '#059669' }} />
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '14px' }}>Informasi Produk</h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: '10px'
                }}>
                  <DetailCard label="ID" value={item.id ?? '-'} />
                  <DetailCard label="Kode SKU" value={skuCode} />
                  <DetailCard label={isMasterSparepart ? 'Nama sparepart' : 'Nama produk'} value={productName} />
                  <DetailCard label="Kategori" value={categoryName || (item.id_category != null ? `ID kategori ${item.id_category}` : '-')} />
                  <DetailCard label="Harga default" value={defaultPrice} accent />
                  {isMasterSparepart && <DetailCard label="Satuan" value={item.unit || '-'} />}
                  {isMasterSparepart && <DetailCard label="Stok minimum" value={item.min_stock ?? 0} />}
                </div>
              </section>

              {specEntries.length > 0 && (
                <section>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    marginBottom: '11px'
                  }}>
                    <div style={{ width: '4px', height: '18px', borderRadius: '999px', background: '#059669' }} />
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '14px' }}>
                      {isMasterSparepart ? 'Spesifikasi' : 'Spesifikasi Teknis'}
                    </h3>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '10px'
                  }}>
                    {specEntries.map(([key, value]) => (
                      <DetailCard
                        key={key}
                        label={recordLabels[key] || key.replace(/_/g, ' ')}
                        value={String(value)}
                        wide={key === 'detail'}
                      />
                    ))}
                  </div>
                </section>
              )}

              {masterNotes && (
                <section>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    marginBottom: '11px'
                  }}>
                    <div style={{ width: '4px', height: '18px', borderRadius: '999px', background: '#059669' }} />
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '14px' }}>Catatan</h3>
                  </div>
                  <DetailCard label="Informasi tambahan" value={masterNotes} wide />
                </section>
              )}

              {extraFields.length > 0 && (
                <section>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    marginBottom: '11px'
                  }}>
                    <div style={{ width: '4px', height: '18px', borderRadius: '999px', background: '#059669' }} />
                    <h3 style={{ margin: 0, color: '#0f172a', fontSize: '14px' }}>Informasi Lainnya</h3>
                  </div>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '10px'
                  }}>
                    {extraFields.map(([key, value]) => (
                      <DetailCard
                        key={key}
                        label={recordLabels[key] || key.replace(/_/g, ' ')}
                        value={renderValue(key, value)}
                        wide={typeof value === 'object'}
                      />
                    ))}
                  </div>
                </section>
              )}

              {(item.created_at || item.updated_at) && (
                <section style={{
                  paddingTop: '16px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: '10px'
                  }}>
                    {item.created_at && <DetailCard label="Dibuat" value={formatTableDate(item.created_at)} />}
                    {item.updated_at && <DetailCard label="Diperbarui" value={formatTableDate(item.updated_at)} />}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: '10px'
            }}>
              {Object.entries(item)
                .filter(([key]) => !['id_pic', 'id_user'].includes(key))
                .map(([key, value]) => (
                  <DetailCard
                    key={key}
                    label={recordLabels[key] || key.replace(/_/g, ' ')}
                    value={renderValue(key, value)}
                    wide={typeof value === 'object'}
                  />
                ))}
            </div>
          )}

          <div style={{
            marginTop: '22px',
            paddingTop: '15px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              className="secondary-button"
              style={{
                minWidth: '90px',
                justifyContent: 'center'
              }}
            >Tutup</button>
          </div>
        </div>
      </section>
    </div>
  )
}

function RoomSelect({ name, value, onChange, rooms }) { return <Select name={name} value={value} onChange={onChange}><option value="">Tidak berubah</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</Select> }

function TechnicalSpecsForm({ categoryName, values, onChange }) { return <section className="inventory-section" style={{ border: '1px solid #a7f3d0', background: '#f0fdf4', padding: '16px', borderRadius: '8px' }}><h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#047857' }}>Spesifikasi Teknis: {categoryName}</h3><div className="inventory-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}><Field label="Processor"><Input name="processor" value={values.processor} onChange={onChange} placeholder="Contoh: Intel Core i5-1235U" /></Field><Field label="RAM"><Input name="ram" value={values.ram} onChange={onChange} placeholder="Contoh: 16 GB DDR4" /></Field><Field label="Penyimpanan (SSD/HDD)"><Input name="storage" value={values.storage} onChange={onChange} placeholder="Contoh: 512 GB NVMe SSD" /></Field><Field label="Sistem Operasi"><Input name="operating_system" value={values.operating_system} onChange={onChange} placeholder="Contoh: Windows 11 Pro" /></Field><Field label="GPU / VGA"><Input name="gpu" value={values.gpu} onChange={onChange} placeholder="Contoh: Intel Iris Xe" /></Field><Field label="Layar"><Input name="display" value={values.display} onChange={onChange} placeholder="Contoh: 14 inci FHD" /></Field></div></section> }

function AssetTable({ items, isAdmin, remove, onEdit, onView, onPrintQr, onUpdateStock }) {
  return (
    <table className="inventory-table">
      <thead><tr><th>Kode</th><th>Kategori</th><th>Lokasi</th><th>Pengguna</th><th>Merek/Model</th><th>Stok</th><th>Status</th><th>Kondisi</th><th>Aksi</th></tr></thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id_asset}>
            <td style={{ fontWeight: 'bold' }}>{item.asset_code}</td>
            <td>{item.category_name || '-'}</td>
            <td>{item.ruangan || '-'}</td>
            <td>{item.user_name || '-'}</td>
            <td>{item.brand_model || '-'}</td>
            <td className={Number(item.stock) <= 0 ? 'low-stock' : ''}>{item.stock ?? 0}</td>
            <td>{item.status}</td>
            <td>{item.condition}</td>
            <td>
              <div className="inventory-action-group">
                <button className="secondary-button" onClick={() => onView(item)}>Detail</button>
                <button className="secondary-button" onClick={() => onPrintQr(item)}>QR</button>
                {isAdmin && (
                  <>
                    <button className="secondary-button" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#059669' }} onClick={() => onUpdateStock(item)}>Stok</button>
                    <button className="secondary-button" onClick={() => onEdit(item)}>Edit</button>
                    <button className="danger-button" onClick={() => remove(`/inventory/assets/${item.id_asset}`)}>Hapus</button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) 
}

function AssetQrModal({ asset, onClose }) {
  const [qrImage, setQrImage] = useState('')
  const assetUrl = `${window.location.origin}${window.location.pathname}?asset=${encodeURIComponent(asset.asset_code)}`
  useEffect(() => {
    let active = true
    QRCode.toDataURL(assetUrl, { width: 260, margin: 2, errorCorrectionLevel: 'M' })
      .then((image) => { if (active) setQrImage(image) })
    return () => { active = false }
  }, [assetUrl])

  const printLabel = () => {
    printDocument(`<!doctype html><html><head><title>Label ${asset.asset_code}</title><style>body{font-family:Arial;text-align:center;padding:20px}.label{display:inline-block;border:1px solid #111;padding:16px}img{width:220px;height:220px}h1{font-size:17px;margin:0 0 6px}p{margin:4px 0;font-size:12px}</style></head><body><section class="label"><h1>IT Helpdesk — Aset</h1><p><b>${asset.asset_code}</b></p><p>${asset.brand_model || ''}</p><img src="${qrImage}" alt="QR ${asset.asset_code}" /><p>Scan untuk melihat detail dan riwayat aset</p></section></body></html>`)
  }

  return <div className="modal-backdrop" onClick={onClose}>
    <section onClick={(event) => event.stopPropagation()} style={{ background: '#fff', width: 'min(380px, calc(100vw - 32px))', borderRadius: '14px', padding: '24px', textAlign: 'center', position: 'relative' }}>
      <button type="button" onClick={onClose} aria-label="Tutup QR" style={{ position: 'absolute', top: '12px', right: '16px', border: 0, background: 'none', fontSize: '13px', cursor: 'pointer' }}>Tutup</button>
      <h2 style={{ margin: 0, color: '#065f46' }}>Label QR Aset</h2>
      <p style={{ margin: '8px 0', color: '#475569' }}><b>{asset.asset_code}</b><br />{asset.brand_model || 'Aset IT'}</p>
      {qrImage ? <img src={qrImage} alt={`QR code ${asset.asset_code}`} style={{ width: '260px', height: '260px', maxWidth: '100%' }} /> : <p>Membuat QR code…</p>}
      <p style={{ fontSize: '12px', color: '#64748b' }}>Scan QR untuk membuka detail aset dan riwayatnya.</p>
      <button className="primary-button" type="button" disabled={!qrImage} onClick={printLabel}>Cetak Label QR</button>
    </section>
  </div>
}

function PartTable({ items, isAdmin, remove, onEdit, onView, onUpdateStock }) { 
  return (
    <table className="inventory-table">
      <thead><tr><th>Nama</th><th>Kategori</th><th>Stok</th><th>Stok Min.</th><th>Satuan</th><th>Supplier</th><th>Aksi</th></tr></thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td style={{ fontWeight: 'bold' }}>{item.name}</td>
            <td>{item.category_name || '-'}</td>
            <td className={Number(item.stock) <= Number(item.min_stock) ? 'low-stock' : ''}>{item.stock} {Number(item.stock) <= Number(item.min_stock) && '(!)'}</td>
            <td>{item.min_stock || 0}</td>
            <td>{item.unit || '-'}</td>
            <td>{item.supplier || '-'}</td>
            <td>
              <div className="inventory-action-group">
                <button className="secondary-button" onClick={() => onView(item)}>Detail</button>
                {isAdmin && (
                  <>
                    <button className="secondary-button" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#059669' }} onClick={() => onUpdateStock(item)}>Stok</button>
                    <button className="secondary-button" onClick={() => onEdit(item)}>Edit</button>
                    <button className="danger-button" onClick={() => remove(`/inventory/spareparts/${item.id}`)}>Hapus</button>
                  </>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  ) 
}

function AssetDetailModal({ asset, maintenance, movements, onClose }) {
  const specs = asset.specifications && typeof asset.specifications === 'object' ? asset.specifications : {}; 
  const purchaseDate = asset.purchase_year ? new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(asset.purchase_year)) : '-'
  const fields = [['Kode Aset', asset.asset_code], ['Kategori', asset.category_name], ['Lokasi', asset.ruangan], ['Pengguna', asset.user_name], ['Merek/Model', asset.brand_model], ['Serial Number', asset.serial_number], ['Tanggal Pembelian', purchaseDate], ['Harga', asset.price ? rupiah(asset.price) : '-'], ['Stok Saat Ini', asset.stock], ['Status', asset.status], ['Kondisi', asset.condition], ['Catatan', asset.notes]]; 
  
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section className="asset-detail-modal" onClick={(event) => event.stopPropagation()}>
        <header className="asset-detail-header">
          <div>
            <h2>Detail Aset</h2>
            <p>{asset.asset_code}</p>
          </div>
          <button type="button" className="asset-detail-close" onClick={onClose} aria-label="Tutup detail aset" title="Tutup detail aset">&times;</button>
        </header>

        <div className="asset-detail-grid">
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
          {fields.map(([label, value]) => (
            <div key={label} className="asset-detail-field">
              <small>{label}</small>
              <strong>{value ?? '-'}</strong>
            </div>
          ))}
        </div>

        {Object.keys(specs).length > 0 && (
          <section style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px', boxSizing: 'border-box' }}>
            <h3 style={{ margin: '0 0 10px', color: '#047857', fontSize: '14px' }}>Spesifikasi Teknis</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {Object.entries(specs).map(([key, value]) => (
                <div key={key}>
                  <b style={{ textTransform: 'capitalize', display: 'block', fontSize: '0.8rem', color: '#065f46' }}>{key.replace(/_/g, ' ')}</b>
                  <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>{String(value)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        <section style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px' }}>Riwayat Maintenance</h3>
          {maintenance.length ? maintenance.map((item) => (
            <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: '#1e293b' }}>{item.maintenance_type}</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>{item.start_date ? formatTableDate(item.start_date) : 'Tanggal tidak dicatat'}</span>
              </div>
              <div style={{ marginBottom: '4px', color: '#475569' }}>Status: <b style={{ textTransform: 'capitalize', color: item.status === 'completed' ? '#059669' : '#0f172a' }}>{item.status}</b></div>
              <div style={{ color: '#64748b', fontStyle: 'italic' }}>{item.result || item.complaint || 'Tanpa keterangan'}</div>
            </div>
          )) : <p style={{ color: '#64748b', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>Belum ada riwayat maintenance.</p>}
        </section>

        <section style={{ marginTop: '24px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#0f172a', fontSize: '15px', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px' }}>Riwayat Mutasi</h3>
          {movements.length ? movements.map((item) => (
            <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '8px', fontSize: '13px', boxSizing: 'border-box' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <strong style={{ color: '#1e293b' }}>{item.movement_type}</strong>
                <span style={{ color: '#64748b', fontSize: '12px' }}>{item.movement_date ? formatTableDate(item.movement_date) : 'Tanggal tidak dicatat'}</span>
              </div>
              <div style={{ color: '#475569' }}>
                {item.from_room || '-'} &rarr; {item.to_room || '-'} <span style={{ margin: '0 6px', color: '#cbd5e1' }}>|</span> <b>{item.quantity || 0} unit</b>
              </div>
            </div>
          )) : <p style={{ color: '#64748b', fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>Belum ada riwayat mutasi.</p>}
        </section>

      </section>
    </div>
  ) 
}

function PartDetailModal({ part, onClose }) { 
  const fields = [['Nama Sparepart', part.name], ['Kategori', part.category_name], ['Stok Saat Ini', `${part.stock} ${part.unit}`], ['Stok Minimum', part.min_stock], ['Harga', part.price ? `Rp ${Number(part.price).toLocaleString('id-ID')}` : '-'], ['Supplier', part.supplier], ['Catatan', part.notes]]; 
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section onClick={(event) => event.stopPropagation()} style={{ background: '#fff', width: 'min(620px, calc(100vw - 32px))', maxHeight: '85vh', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box', borderRadius: '14px', padding: '24px', position: 'relative' }}>
        <button type="button" onClick={onClose} aria-label="Tutup detail" style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', fontSize: '13px', cursor: 'pointer', color: '#64748b' }}>Tutup</button>
        <h2 style={{ margin: '0 0 4px', color: '#0f172a' }}>Detail Sparepart</h2>
        <p style={{ margin: '0 0 18px', color: '#64748b', fontWeight: 'bold' }}>{part.name}</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
          {fields.map(([label, value]) => (
            <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
              <small style={{ display: 'block', color: '#64748b', marginBottom: '4px' }}>{label}</small>
              <strong style={{ color: '#1e293b', fontSize: '13px', overflowWrap: 'anywhere' }}>{value || '-'}</strong>
            </div>
          ))}
        </div>
      </section>
    </div>
  ) 
}  