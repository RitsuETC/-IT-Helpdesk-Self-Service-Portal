import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'

const tabs = [
  ['dashboard', 'Dashboard'], ['assets', 'Data Aset'], ['spareparts', 'Sparepart'],
  ['movements', 'Pergerakan Aset'], ['transactions', 'Transaksi Sparepart'],
  ['maintenance', 'Maintenance'], ['procurement', 'Pengadaan'], ['master-products', 'Master Produk']
]
const blankAsset = { asset_code: '', id_category: '', id_ruangan: '', id_user: '', brand_model: '', serial_number: '', purchase_year: '', price: '', status: 'available', condition: 'good', notes: '', specifications: '' }
const blankTechnicalSpecs = { processor: '', ram: '', storage: '', operating_system: '', gpu: '', display: '' }
const blankPart = { name: '', id_category: '', stock: 0, min_stock: 0, unit: 'pcs', price: '', supplier: '', notes: '' }
const blankMovement = { id_asset: '', id_user: '', from_location: '', to_location: '', movement_type: 'TRANSFER', movement_date: '', condition: '', notes: '' }
const blankTransaction = { id_sparepart: '', transaction_type: 'MASUK', quantity: 1, transaction_date: '', id_tiket: '', notes: '' }
const blankMaintenance = { id_asset: '', maintenance_type: 'Preventive', start_date: '', end_date: '', complaint: '', action: '', result: '', cost: 0, status: 'scheduled', vendor: '', notes: '' }
const blankProcurement = { po_number: '', request_date: '', approval_date: '', received_date: '', supplier: '', status: 'draft', notes: '', details: [{ item_name: '', quantity: 1, unit_price: 0 }] }
const blankMasterProduct = { sku_code: '', product_name: '', id_category: '', default_price: '', processor: '', ram: '', storage: '', operating_system: '', notes: '' }

function Field({ label, children }) { return <label className="inventory-field"><span style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{label}</span>{children}</label> }
function Input({ name, value, onChange, type = 'text', required = false, placeholder }) { return <input name={name} value={value ?? ''} onChange={onChange} type={type} required={required} placeholder={placeholder} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}/> }
function Select({ name, value, onChange, children, required = false }) { return <select name={name} value={value ?? ''} onChange={onChange} required={required} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>{children}</select> }
function Textarea({ name, value, onChange, required = false, placeholder, rows = 3 }) { return <textarea name={name} value={value ?? ''} onChange={onChange} required={required} placeholder={placeholder} rows={rows} style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', resize: 'vertical', fontFamily: 'inherit' }}/> }
function FormActions({ onCancel, label = 'Simpan' }) { return <div className="inventory-form-actions" style={{marginTop: '20px', display: 'flex', gap: '10px'}}><button type="submit" className="primary-button" style={{ padding: '10px 16px', borderRadius: '6px', background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>{label}</button>{onCancel && <button type="button" className="secondary-button" onClick={onCancel} style={{ padding: '10px 16px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>}</div> }

function Inventory({ token, user, onBack, onError }) {
  const [tab, setTab] = useState('dashboard')
  const [data, setData] = useState({ assets: [], spareparts: [], movements: [], transactions: [], maintenance: [], procurement: [], setup: { categories: [], sparepartCategories: [], rooms: [], users: [], tickets: [], masterProducts: [] }, dashboard: {} })
  const [asset, setAsset] = useState(blankAsset)
  const [assetEditingId, setAssetEditingId] = useState(null)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showAssetModal, setShowAssetModal] = useState(false)
  const [technicalSpecs, setTechnicalSpecs] = useState(blankTechnicalSpecs)
  const [part, setPart] = useState(blankPart)
  const [movement, setMovement] = useState(blankMovement)
  const [transaction, setTransaction] = useState(blankTransaction)
  const [maintenance, setMaintenance] = useState(blankMaintenance)
  const [procurement, setProcurement] = useState(blankProcurement)
  const [masterProduct, setMasterProduct] = useState(blankMasterProduct)
  const [search, setSearch] = useState('')
  const [assetFilters, setAssetFilters] = useState({ category: '', location: '', status: '', condition: '' })
  
  const canManage = ['admin', 'teknisi'].includes(user.role)
  const isAdmin = canManage

  // ================= PAGINATION STATES =================
  const ITEMS_PER_PAGE = 10
  const [assetPage, setAssetPage] = useState(1)
  const [partPage, setPartPage] = useState(1)
  const [masterPage, setMasterPage] = useState(1)

  // Reset pagination setiap pindah tab atau melakukan pencarian
  useEffect(() => {
    setAssetPage(1)
    setPartPage(1)
    setMasterPage(1)
  }, [tab, search, assetFilters])

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

  const submit = async (event, path, method, body, reset) => {
    event.preventDefault()
    const hasTechnicalSpecs = Object.values(technicalSpecs).some((value) => String(value).trim())
    const requestBody = path.startsWith('/inventory/assets') && hasTechnicalSpecs ? { ...body, specifications: technicalSpecs } : body
    try { 
        await api(path, { token, method, body: requestBody }); 
        reset(); 
        setTechnicalSpecs(blankTechnicalSpecs); 
        await load();
        if(path.startsWith('/inventory/assets')) setShowAssetModal(false);
    } catch (error) { onError(error.message) }
  }

  const remove = async (path) => { if (!window.confirm('Hapus data ini?')) return; try { await api(path, { token, method: 'DELETE' }); await load() } catch (error) { onError(error.message) } }
  const update = (setter) => (event) => setter((previous) => ({ ...previous, [event.target.name]: event.target.value }))
  
  const setup = data.setup
  const selectedCategory = useMemo(() => setup.categories.find((item) => String(item.id) === String(asset.id_category)), [setup.categories, asset.id_category])
  const needsTechnicalSpecs = /laptop|pc|komputer|computer|server/i.test(selectedCategory?.name || '')
  
  useEffect(() => { if (!needsTechnicalSpecs) setTechnicalSpecs(blankTechnicalSpecs) }, [needsTechnicalSpecs])
  
  // --- Filter & Pagination untuk Aset ---
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

  // --- Filter & Pagination untuk Spareparts ---
  const parts = useMemo(() => data.spareparts.filter((item) => JSON.stringify(item).toLowerCase().includes(search.toLowerCase())), [data.spareparts, search])
  const paginatedParts = useMemo(() => parts.slice((partPage - 1) * ITEMS_PER_PAGE, partPage * ITEMS_PER_PAGE), [parts, partPage])

  // --- Pagination untuk Master Produk ---
  const masterProductsList = setup.masterProducts || []
  const paginatedMaster = useMemo(() => masterProductsList.slice((masterPage - 1) * ITEMS_PER_PAGE, masterPage * ITEMS_PER_PAGE), [masterProductsList, masterPage])

  // --- Options Dropdown ---
  const userOptions = setup.users.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.role})</option>)
  const assetOptions = setup.rooms.length >= 0 && data.assets.map((item) => <option key={item.id_asset} value={item.id_asset}>{item.asset_code}</option>)
  const partOptions = data.spareparts.map((item) => <option key={item.id} value={item.id}>{item.name} (stok {item.stock})</option>)

  const handleOpenAddAsset = () => {
    setAsset(blankAsset); setAssetEditingId(null); setTechnicalSpecs(blankTechnicalSpecs); setShowAssetModal(true);
  }

  const handleOpenEditAsset = (item) => {
    setAsset({ ...blankAsset, ...item });
    setTechnicalSpecs(item.specifications && typeof item.specifications === 'object' ? item.specifications : blankTechnicalSpecs);
    setAssetEditingId(item.id_asset);
    setShowAssetModal(true);
  }

  return <section className="inventory-page">
    <div className="inventory-heading"><div><button className="text-button" onClick={onBack}>← Kembali</button><h2>Inventaris</h2><p>Kelola aset, sparepart, pemeliharaan, dan pengadaan IT.</p></div><span className="role-chip">{user.role}</span></div>
    <div className="inventory-tabs">{tabs.map(([id, label]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => { setTab(id); setSearch('') }} style={{ padding: '8px 16px', border: 'none', borderBottom: tab === id ? '3px solid #059669' : '3px solid transparent', background: 'none', fontWeight: tab === id ? 'bold' : 'normal', color: tab === id ? '#059669' : '#64748b', cursor: 'pointer', transition: '0.2s' }}>{label}</button>)}</div>

    {tab === 'dashboard' && <div className="inventory-dashboard"><div className="inventory-stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '20px' }}>{[['total_assets', 'Total aset'], ['available_assets', 'Aset tersedia'], ['in_use_assets', 'Sedang digunakan'], ['broken_assets', 'Aset rusak'], ['total_spareparts', 'Total stok sparepart'], ['low_stock_spareparts', 'Stok rendah'], ['active_maintenance', 'Maintenance berjalan'], ['active_procurement', 'Pengadaan berjalan']].map(([key, label]) => <article className="inventory-stat" key={key} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}><strong style={{ display: 'block', fontSize: '2rem', color: '#0f172a' }}>{data.dashboard[key] ?? 0}</strong><span style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</span></article>)}</div></div>}

    {tab === 'assets' && (
      <section className="inventory-section" style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
             <SectionTitle title="Data Aset" count={assets.length} search={search} setSearch={setSearch} />
             {isAdmin && <button onClick={handleOpenAddAsset} style={{ backgroundColor: '#059669', color: 'white', padding: '10px 16px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ Tambah Aset</button>}
        </div>
        <div className="inventory-filters" style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <Select value={assetFilters.category} onChange={(event) => setAssetFilters({ ...assetFilters, category: event.target.value })}><option value="">Semua kategori</option>{setup.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select>
          <Select value={assetFilters.location} onChange={(event) => setAssetFilters({ ...assetFilters, location: event.target.value })}><option value="">Semua lokasi</option>{setup.rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</Select>
          <Select value={assetFilters.status} onChange={(event) => setAssetFilters({ ...assetFilters, status: event.target.value })}><option value="">Semua status</option><option value="available">Tersedia</option><option value="in_use">Digunakan</option><option value="repair">Perbaikan</option></Select>
          <Select value={assetFilters.condition} onChange={(event) => setAssetFilters({ ...assetFilters, condition: event.target.value })}><option value="">Semua kondisi</option><option value="good">Baik</option><option value="fair">Cukup</option><option value="broken">Rusak</option></Select>
        </div>
        <AssetTable items={paginatedAssets} isAdmin={isAdmin} remove={remove} onView={setSelectedAsset} onEdit={handleOpenEditAsset} />
        <PaginationControls currentPage={assetPage} totalItems={assets.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setAssetPage} />
      </section>
    )}

    {tab === 'spareparts' && <section className="inventory-section" style={{ marginTop: '20px' }}><SectionTitle title="Sparepart" count={parts.length} search={search} setSearch={setSearch} />{isAdmin && <form className="inventory-form" style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/spareparts', 'POST', { ...part, id_category: part.id_category || null }, () => setPart(blankPart))}><Field label="Nama sparepart *"><Input name="name" value={part.name} onChange={update(setPart)} required /></Field><Field label="Kategori"><Select name="id_category" value={part.id_category} onChange={update(setPart)}><option value="">Pilih kategori</option>{setup.sparepartCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Stok"><Input name="stock" value={part.stock} onChange={update(setPart)} type="number" /></Field><Field label="Stok minimum"><Input name="min_stock" value={part.min_stock} onChange={update(setPart)} type="number" /></Field><Field label="Satuan"><Input name="unit" value={part.unit} onChange={update(setPart)} /></Field><Field label="Harga"><Input name="price" value={part.price} onChange={update(setPart)} type="number" /></Field><Field label="Supplier"><Input name="supplier" value={part.supplier} onChange={update(setPart)} /></Field><div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={part.notes} onChange={update(setPart)} /></Field></div><div style={{ gridColumn: '1 / -1' }}><FormActions label="Tambah sparepart" /></div></form>}<div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}><table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}><th style={{ padding: '12px 8px' }}>Nama</th><th style={{ padding: '12px 8px' }}>Kategori</th><th style={{ padding: '12px 8px' }}>Stok</th><th style={{ padding: '12px 8px' }}>Satuan</th><th style={{ padding: '12px 8px' }}>Supplier</th>{isAdmin && <th style={{ padding: '12px 8px' }}>Aksi</th>}</tr></thead><tbody>{paginatedParts.map((item) => <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}><td style={{ padding: '12px 8px' }}>{item.name}</td><td style={{ padding: '12px 8px' }}>{item.category_name || '-'}</td><td style={{ padding: '12px 8px', color: item.low_stock ? '#b91c1c' : 'inherit', fontWeight: item.low_stock ? 'bold' : 'normal' }}>{item.stock} {item.low_stock && '(!)'}</td><td style={{ padding: '12px 8px' }}>{item.unit || '-'}</td><td style={{ padding: '12px 8px' }}>{item.supplier || '-'}</td>{isAdmin && <td style={{ padding: '12px 8px' }}><button style={{ padding: '4px 8px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '4px', border: 'none', background: '#fee2e2', color: '#b91c1c' }} onClick={() => remove(`/inventory/spareparts/${item.id}`)}>Hapus</button></td>}</tr>)}</tbody></table></div><PaginationControls currentPage={partPage} totalItems={parts.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPartPage} /></section>}

    {tab === 'movements' && <WorkSection title="Pergerakan Aset" items={data.movements} itemsPerPage={ITEMS_PER_PAGE} columns={['asset_code', 'movement_type', 'from_room', 'to_room', 'user_name', 'movement_date']} labels={['Aset', 'Jenis', 'Asal', 'Tujuan', 'Pengguna', 'Tanggal']}><form className="inventory-form" style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/movements', 'POST', { ...movement, id_asset: Number(movement.id_asset), id_user: movement.id_user || null, from_location: movement.from_location || null, to_location: movement.to_location || null }, () => setMovement(blankMovement))}><Field label="Aset *"><Select name="id_asset" value={movement.id_asset} onChange={update(setMovement)} required><option value="">Pilih aset</option>{assetOptions}</Select></Field><Field label="Pengguna"><Select name="id_user" value={movement.id_user} onChange={update(setMovement)}><option value="">Tidak berubah</option>{userOptions}</Select></Field><Field label="Lokasi asal"><RoomSelect value={movement.from_location} onChange={update(setMovement)} name="from_location" rooms={setup.rooms} /></Field><Field label="Lokasi tujuan"><RoomSelect value={movement.to_location} onChange={update(setMovement)} name="to_location" rooms={setup.rooms} /></Field><Field label="Jenis pergerakan"><Input name="movement_type" value={movement.movement_type} onChange={update(setMovement)} required /></Field><Field label="Kondisi"><Input name="condition" value={movement.condition} onChange={update(setMovement)} /></Field><div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={movement.notes} onChange={update(setMovement)} /></Field></div><div style={{ gridColumn: '1 / -1' }}><FormActions label="Catat pergerakan" /></div></form></WorkSection>}
    
    {tab === 'transactions' && <WorkSection title="Transaksi Sparepart" items={data.transactions} itemsPerPage={ITEMS_PER_PAGE} columns={['sparepart_name', 'transaction_type', 'quantity', 'transaction_date', 'ticket_title', 'pic_name']} labels={['Sparepart', 'Jenis', 'Jumlah', 'Tanggal', 'Referensi tiket', 'PIC']}><form className="inventory-form" style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/transactions', 'POST', { ...transaction, id_sparepart: Number(transaction.id_sparepart), quantity: Number(transaction.quantity), id_tiket: transaction.id_tiket || null }, () => setTransaction(blankTransaction))}><Field label="Sparepart *"><Select name="id_sparepart" value={transaction.id_sparepart} onChange={update(setTransaction)} required><option value="">Pilih sparepart</option>{partOptions}</Select></Field><Field label="Jenis transaksi"><Select name="transaction_type" value={transaction.transaction_type} onChange={update(setTransaction)}><option value="MASUK">MASUK</option><option value="KELUAR">KELUAR</option></Select></Field><Field label="Jumlah *"><Input name="quantity" value={transaction.quantity} onChange={update(setTransaction)} type="number" required /></Field><Field label="Referensi tiket"><Select name="id_tiket" value={transaction.id_tiket} onChange={update(setTransaction)}><option value="">Tidak ada</option>{setup.tickets.map((item) => <option key={item.id} value={item.id}>#{item.id} {item.judul}</option>)}</Select></Field><div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={transaction.notes} onChange={update(setTransaction)} /></Field></div><div style={{ gridColumn: '1 / -1' }}><FormActions label="Catat transaksi" /></div></form></WorkSection>}
    
    {tab === 'maintenance' && <WorkSection title="Maintenance" items={data.maintenance} itemsPerPage={ITEMS_PER_PAGE} columns={['asset_code', 'maintenance_type', 'start_date', 'end_date', 'status', 'pic_name']} labels={['Aset', 'Jenis', 'Mulai', 'Selesai', 'Status', 'PIC']}><form className="inventory-form" style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/maintenance', 'POST', { ...maintenance, id_asset: Number(maintenance.id_asset), cost: Number(maintenance.cost || 0) }, () => setMaintenance(blankMaintenance))}><Field label="Aset *"><Select name="id_asset" value={maintenance.id_asset} onChange={update(setMaintenance)} required><option value="">Pilih aset</option>{assetOptions}</Select></Field><Field label="Jenis maintenance *"><Input name="maintenance_type" value={maintenance.maintenance_type} onChange={update(setMaintenance)} required /></Field><Field label="Tanggal mulai *"><Input name="start_date" value={maintenance.start_date} onChange={update(setMaintenance)} type="datetime-local" required /></Field><Field label="Tanggal selesai"><Input name="end_date" value={maintenance.end_date} onChange={update(setMaintenance)} type="datetime-local" /></Field><Field label="Status"><Select name="status" value={maintenance.status} onChange={update(setMaintenance)}><option value="scheduled">Terjadwal</option><option value="in_progress">Berjalan</option><option value="completed">Selesai</option><option value="cancelled">Dibatalkan</option></Select></Field><Field label="Vendor"><Input name="vendor" value={maintenance.vendor} onChange={update(setMaintenance)} /></Field><Field label="Biaya"><Input name="cost" value={maintenance.cost} onChange={update(setMaintenance)} type="number" /></Field><div style={{ gridColumn: '1 / -1' }}><Field label="Keluhan"><Textarea name="complaint" value={maintenance.complaint} onChange={update(setMaintenance)} rows={2} /></Field></div><div style={{ gridColumn: '1 / -1' }}><Field label="Tindakan / Hasil"><Textarea name="result" value={maintenance.result} onChange={update(setMaintenance)} rows={2} /></Field></div><div style={{ gridColumn: '1 / -1' }}><Field label="Catatan Tambahan"><Textarea name="notes" value={maintenance.notes} onChange={update(setMaintenance)} rows={2} /></Field></div><div style={{ gridColumn: '1 / -1' }}><FormActions label="Catat maintenance" /></div></form></WorkSection>}
    
    {tab === 'procurement' && <WorkSection title="Pengadaan" items={data.procurement} itemsPerPage={ITEMS_PER_PAGE} columns={['po_number', 'request_date', 'supplier', 'status', 'total_cost']} labels={['Nomor PO', 'Pengajuan', 'Supplier', 'Status', 'Total biaya']}><form className="inventory-form" style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => submit(event, '/inventory/procurement', 'POST', { ...procurement, details: procurement.details.filter((item) => item.item_name.trim()) }, () => setProcurement(blankProcurement))}><Field label="Nomor PO *"><Input name="po_number" value={procurement.po_number} onChange={update(setProcurement)} required /></Field><Field label="Tanggal pengajuan"><Input name="request_date" value={procurement.request_date} onChange={update(setProcurement)} type="date" /></Field><Field label="Tanggal persetujuan"><Input name="approval_date" value={procurement.approval_date} onChange={update(setProcurement)} type="date" /></Field><Field label="Tanggal penerimaan"><Input name="received_date" value={procurement.received_date} onChange={update(setProcurement)} type="date" /></Field><Field label="Supplier"><Input name="supplier" value={procurement.supplier} onChange={update(setProcurement)} /></Field><Field label="Status"><Select name="status" value={procurement.status} onChange={update(setProcurement)}><option value="draft">Draft</option><option value="submitted">Diajukan</option><option value="approved">Disetujui</option><option value="received">Diterima</option><option value="cancelled">Dibatalkan</option></Select></Field><Field label="Barang Utama"><Input value={procurement.details[0].item_name} onChange={(event) => setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], item_name: event.target.value }] }))} required /></Field><Field label="Jumlah"><Input type="number" value={procurement.details[0].quantity} onChange={(event) => setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], quantity: event.target.value }] }))} /></Field><Field label="Harga satuan"><Input type="number" value={procurement.details[0].unit_price} onChange={(event) => setProcurement((previous) => ({ ...previous, details: [{ ...previous.details[0], unit_price: event.target.value }] }))} /></Field><div style={{ gridColumn: '1 / -1' }}><Field label="Keterangan"><Textarea name="notes" value={procurement.notes} onChange={update(setProcurement)} /></Field></div><div style={{ gridColumn: '1 / -1' }}><FormActions label="Simpan pengadaan" /></div></form></WorkSection>}

    {tab === 'master-products' && <section className="inventory-section" style={{ marginTop: '20px' }}><SectionTitle title="Master Produk / SKU" count={masterProductsList.length} search="" />{isAdmin && <form className="inventory-form" style={{ background: '#f8fafc', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => { const { sku_code, product_name, id_category, default_price, ...specifications } = masterProduct; submit(event, '/inventory/master-products', 'POST', { sku_code, product_name, id_category: id_category || null, default_price: default_price || null, specifications: Object.fromEntries(Object.entries(specifications).filter(([, value]) => String(value).trim())) }, () => setMasterProduct(blankMasterProduct)) }}><Field label="Kode SKU *"><Input name="sku_code" value={masterProduct.sku_code} onChange={update(setMasterProduct)} placeholder="Contoh: LEN-THINK-14-G5" required /></Field><Field label="Nama produk / model *"><Input name="product_name" value={masterProduct.product_name} onChange={update(setMasterProduct)} placeholder="Contoh: Lenovo ThinkPad E14 Gen 5" required /></Field><Field label="Kategori aset"><Select name="id_category" value={masterProduct.id_category} onChange={update(setMasterProduct)}><option value="">Pilih kategori</option>{setup.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field><Field label="Harga default"><Input name="default_price" value={masterProduct.default_price} onChange={update(setMasterProduct)} type="number" /></Field><Field label="Processor"><Input name="processor" value={masterProduct.processor} onChange={update(setMasterProduct)} /></Field><Field label="RAM"><Input name="ram" value={masterProduct.ram} onChange={update(setMasterProduct)} /></Field><Field label="Penyimpanan"><Input name="storage" value={masterProduct.storage} onChange={update(setMasterProduct)} /></Field><Field label="Sistem operasi"><Input name="operating_system" value={masterProduct.operating_system} onChange={update(setMasterProduct)} /></Field><div style={{ gridColumn: '1 / -1' }}><Field label="Catatan / spesifikasi tambahan"><Textarea name="notes" value={masterProduct.notes} onChange={update(setMasterProduct)} /></Field></div><div style={{ gridColumn: '1 / -1' }}><FormActions label="Simpan master produk" /></div></form>}<div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}><table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ textAlign: 'left', background: '#f8fafc' }}><th style={{ padding: '12px' }}>SKU</th><th style={{ padding: '12px' }}>Produk</th><th style={{ padding: '12px' }}>Kategori</th><th style={{ padding: '12px' }}>Harga default</th>{isAdmin && <th style={{ padding: '12px' }}>Aksi</th>}</tr></thead><tbody>{paginatedMaster.map((item) => <tr key={item.id} style={{ borderTop: '1px solid #e2e8f0' }}><td style={{ padding: '12px' }}>{item.sku_code}</td><td style={{ padding: '12px' }}>{item.product_name}</td><td style={{ padding: '12px' }}>{setup.categories.find((category) => String(category.id) === String(item.id_category))?.name || '-'}</td><td style={{ padding: '12px' }}>{item.default_price ? `Rp ${Number(item.default_price).toLocaleString('id-ID')}` : '-'}</td>{isAdmin && <td style={{ padding: '12px' }}><button type="button" onClick={() => remove(`/inventory/master-products/${item.id}`)} style={{ padding: '6px 10px', border: 'none', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', cursor: 'pointer' }}>Hapus</button></td>}</tr>)}{!paginatedMaster.length && <tr><td colSpan={isAdmin ? 5 : 4} style={{ padding: '18px', color: '#64748b', textAlign: 'center' }}>Belum ada master produk.</td></tr>}</tbody></table></div><PaginationControls currentPage={masterPage} totalItems={masterProductsList.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setMasterPage} /></section>}
    
    {/* MODAL UNTUK FORM ASSETS */}
    {showAssetModal && (
        <div className="modal-backdrop" onClick={() => setShowAssetModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                    <h2 style={{ margin: 0, color: '#0f172a' }}>{assetEditingId ? 'Edit Data Aset' : 'Tambah Aset Baru'}</h2>
                    <button onClick={() => setShowAssetModal(false)} style={{ background: 'none', border: 'none', fontSize: '28px', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>
                
                <form className="inventory-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} onSubmit={(event) => submit(event, assetEditingId ? `/inventory/assets/${assetEditingId}` : '/inventory/assets', assetEditingId ? 'PUT' : 'POST', { ...asset, id_category: asset.id_category || null, id_ruangan: Number(asset.id_ruangan), id_user: asset.id_user || null, serial_number: asset.serial_number?.trim() || null, purchase_year: asset.purchase_year || null, price: asset.price || null, specifications: asset.specifications ? { detail: asset.specifications } : null }, () => { setAsset(blankAsset); setAssetEditingId(null) })}>
                    
                    {/* --- FITUR BARU: AUTO-FILL MASTER SKU --- */}
                    <div style={{ gridColumn: '1 / -1', background: '#e0f2fe', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                        <Field label="💡 Isi Otomatis dari Master Produk / SKU (Opsional)">
                            <Select 
                                name="master_sku" 
                                onChange={(e) => {
                                    const selectedId = e.target.value;
                                    if (!selectedId) return;
                                    
                                    const master = setup.masterProducts?.find(m => String(m.id) === String(selectedId));
                                    if (master) {
                                        setAsset(prev => ({
                                            ...prev,
                                            id_category: master.id_category || prev.id_category,
                                            brand_model: master.product_name || prev.brand_model,
                                            price: master.default_price || prev.price
                                        }));
                                        if (master.specifications) {
                                            const specs = typeof master.specifications === 'string' ? JSON.parse(master.specifications) : master.specifications;
                                            setTechnicalSpecs(specs);
                                        }
                                    }
                                }}
                            >
                                <option value="">-- Ketik manual atau pilih SKU dari Master Data --</option>
                                {setup.masterProducts?.map(master => (
                                    <option key={master.id} value={master.id}>
                                        [{master.sku_code}] - {master.product_name}
                                    </option>
                                ))}
                            </Select>
                        </Field>
                    </div>
                    {/* ---------------------------------------- */}

                    <Field label="Kode Aset *"><Input name="asset_code" value={asset.asset_code} onChange={update(setAsset)} required /></Field>
                    <Field label="Kategori"><Select name="id_category" value={asset.id_category} onChange={update(setAsset)}><option value="">Pilih kategori</option>{setup.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></Field>
                    <Field label="Lokasi/Ruangan *"><Select name="id_ruangan" value={asset.id_ruangan} onChange={update(setAsset)} required><option value="">Pilih ruangan</option>{setup.rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</Select></Field>
                    <Field label="Pengguna"><Select name="id_user" value={asset.id_user} onChange={update(setAsset)}><option value="">Tidak ada</option>{userOptions}</Select></Field>
                    <Field label="Merek/Model"><Input name="brand_model" value={asset.brand_model} onChange={update(setAsset)} /></Field>
                    <Field label="Serial Number"><Input name="serial_number" value={asset.serial_number} onChange={update(setAsset)} /></Field>
                    <Field label="Tanggal Pembelian"><Input name="purchase_year" value={asset.purchase_year} onChange={update(setAsset)} type="date" /></Field>
                    <Field label="Harga"><Input name="price" value={asset.price} onChange={update(setAsset)} type="number" /></Field>
                    <Field label="Status"><Select name="status" value={asset.status} onChange={update(setAsset)}><option value="available">Tersedia</option><option value="in_use">Digunakan</option><option value="repair">Perbaikan</option><option value="retired">Tidak digunakan</option></Select></Field>
                    <Field label="Kondisi"><Select name="condition" value={asset.condition} onChange={update(setAsset)}><option value="good">Baik</option><option value="fair">Cukup</option><option value="broken">Rusak</option></Select></Field>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                         <Field label="Catatan Tambahan"><Textarea name="notes" value={asset.notes} onChange={update(setAsset)} placeholder="Tambahkan deskripsi atau catatan mengenai aset ini..." /></Field>
                    </div>
                    
                    {needsTechnicalSpecs && (
                        <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                             <TechnicalSpecsForm categoryName={selectedCategory?.name} values={technicalSpecs} onChange={(event) => setTechnicalSpecs((current) => ({ ...current, [event.target.name]: event.target.value }))} />
                        </div>
                    )}

                    <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '16px', marginTop: '8px' }}>
                         <FormActions label={assetEditingId ? 'Simpan perubahan' : 'Simpan Aset Baru'} onCancel={() => setShowAssetModal(false)} />
                    </div>
                </form>
            </div>
        </div>
    )}

    {selectedAsset && <AssetDetailModal asset={selectedAsset} onClose={() => setSelectedAsset(null)} />}
  </section>
}

// ================== KOMPONEN BANTUAN & PAGINATION ================== //

function PaginationControls({ currentPage, totalItems, itemsPerPage, onPageChange }) {
  if (totalItems === 0) return null
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 16px', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
        Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} dari total {totalItems} data
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button onClick={() => onPageChange(1)} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>«</button>
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>‹</button>
        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hal {currentPage} / {totalPages}</span>
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>›</button>
        <button onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: currentPage === totalPages ? '#f8fafc' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>»</button>
      </div>
    </div>
  )
}

function WorkSection({ title, items, columns, labels, itemsPerPage = 10, children }) { 
  const [currentPage, setCurrentPage] = useState(1)
  
  // Reset Halaman Jika item/data berubah
  useEffect(() => { setCurrentPage(1) }, [items])

  const paginatedItems = useMemo(() => items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [items, currentPage, itemsPerPage])

  return <section className="inventory-section" style={{ marginTop: '20px' }}>
    <SectionTitle title={title} count={items.length} search="" setSearch={() => {}} />
    {children}
    <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
      <table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {labels.map((label) => <th key={label} style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {paginatedItems.map((item) => <tr key={item.id || `${item.asset_code}-${item.movement_date}`} style={{ borderBottom: '1px solid #f1f5f9' }}>{columns.map((column) => <td key={column} style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item[column] ?? '-'}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
    <PaginationControls currentPage={currentPage} totalItems={items.length} itemsPerPage={itemsPerPage} onPageChange={setCurrentPage} />
  </section> 
}

function SectionTitle({ title, count, search, setSearch }) { return <div className="inventory-section-title" style={{ display: 'flex', gap: '20px', alignItems: 'center'}}><div><h3 style={{ margin: 0 }}>{title}</h3><span style={{ fontSize: '0.8rem', color: '#64748b' }}>{count} data tercatat</span></div>{setSearch && <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari..." style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}/>}</div> }
function RoomSelect({ name, value, onChange, rooms }) { return <Select name={name} value={value} onChange={onChange}><option value="">Tidak berubah</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.ruangan}</option>)}</Select> }
function TechnicalSpecsForm({ categoryName, values, onChange }) { return <section className="inventory-section" style={{ border: '1px solid #a7f3d0', background: '#f0fdf4', padding: '16px', borderRadius: '8px' }}><h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', color: '#047857' }}>Spesifikasi Teknis: {categoryName}</h3><div className="inventory-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}><Field label="Processor"><Input name="processor" value={values.processor} onChange={onChange} placeholder="Contoh: Intel Core i5-1235U" /></Field><Field label="RAM"><Input name="ram" value={values.ram} onChange={onChange} placeholder="Contoh: 16 GB DDR4" /></Field><Field label="Penyimpanan (SSD/HDD)"><Input name="storage" value={values.storage} onChange={onChange} placeholder="Contoh: 512 GB NVMe SSD" /></Field><Field label="Sistem Operasi"><Input name="operating_system" value={values.operating_system} onChange={onChange} placeholder="Contoh: Windows 11 Pro" /></Field><Field label="GPU / VGA"><Input name="gpu" value={values.gpu} onChange={onChange} placeholder="Contoh: Intel Iris Xe" /></Field><Field label="Layar"><Input name="display" value={values.display} onChange={onChange} placeholder="Contoh: 14 inci FHD" /></Field></div></section> }
function AssetTable({ items, isAdmin, remove, onEdit, onView }) { return <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px' }}><table className="inventory-table" style={{ width: '100%', borderCollapse: 'collapse' }}><thead><tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Kode</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Kategori</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Lokasi</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Pengguna</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Merek/Model</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Status</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Kondisi</th><th style={{ padding: '14px 16px', color: '#475569', fontSize: '0.85rem' }}>Aksi</th></tr></thead><tbody>{items.map((item) => <tr key={item.id_asset} style={{ borderBottom: '1px solid #f1f5f9' }}><td style={{ padding: '12px 16px', fontSize: '0.85rem', fontWeight: 'bold' }}>{item.asset_code}</td><td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.category_name || '-'}</td><td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.ruangan || '-'}</td><td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.user_name || '-'}</td><td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.brand_model || '-'}</td><td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.status}</td><td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>{item.condition}</td><td style={{ padding: '12px 16px', display: 'flex', gap: '6px' }}><button style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', fontWeight: 'bold', color: '#334155' }} onClick={() => onView(item)}>Detail</button>{isAdmin && <> <button style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 'bold', color: '#334155' }} onClick={() => onEdit(item)}>Edit</button> <button style={{ padding: '6px 12px', fontSize: '0.8rem', cursor: 'pointer', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#b91c1c', fontWeight: 'bold' }} onClick={() => remove(`/inventory/assets/${item.id_asset}`)}>Hapus</button></>}</td></tr>)}</tbody></table></div> }
function AssetDetailModal({ asset, onClose }) { const specs = asset.specifications && typeof asset.specifications === 'object' ? asset.specifications : {}; const fields = [['Kode Aset', asset.asset_code], ['Kategori', asset.category_name], ['Lokasi', asset.ruangan], ['Pengguna', asset.user_name], ['Merek/Model', asset.brand_model], ['Serial Number', asset.serial_number], ['Tanggal Pembelian', asset.purchase_year], ['Harga', asset.price ? `Rp ${Number(asset.price).toLocaleString('id-ID')}` : '-'], ['Status', asset.status], ['Kondisi', asset.condition], ['Catatan', asset.notes]]; return <div className="modal-backdrop" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><section onClick={(event) => event.stopPropagation()} style={{ background: '#fff', width: 'min(620px, calc(100vw - 32px))', maxHeight: '85vh', overflowY: 'auto', borderRadius: '14px', padding: '24px', position: 'relative' }}><button className="close-ticket-form" type="button" onClick={onClose} aria-label="Tutup detail" style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}>×</button><h2 style={{ margin: '0 0 4px', color: '#0f172a' }}>Detail Aset</h2><p style={{ margin: '0 0 18px', color: '#64748b', fontWeight: 'bold' }}>{asset.asset_code}</p><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>{fields.map(([label, value]) => <div key={label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '10px', border: '1px solid #e2e8f0' }}><small style={{ display: 'block', color: '#64748b', marginBottom: '4px' }}>{label}</small><strong style={{ color: '#1e293b', fontSize: '13px', overflowWrap: 'anywhere' }}>{value || '-'}</strong></div>)}</div>{Object.keys(specs).length > 0 && <section style={{ marginTop: '16px', background: '#f0fdf4', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '14px' }}><h3 style={{ margin: '0 0 10px', color: '#047857', fontSize: '14px' }}>Spesifikasi Teknis</h3><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>{Object.entries(specs).map(([key, value]) => <div key={key}><b style={{ textTransform: 'capitalize', display: 'block', fontSize: '0.8rem', color: '#065f46' }}>{key.replace(/_/g, ' ')}</b> <span style={{ fontSize: '0.9rem', color: '#0f172a' }}>{String(value)}</span></div>)}</div></section>}</section></div> }

export default Inventory