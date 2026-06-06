import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { STORES, fmt } from '../lib/constants'
import { useAuth } from '../context/AuthContext'

export default function SOH() {
  const { canViewAllStores, storeId } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [storeFilter, setStoreFilter] = useState('all')
  const [sortBy, setSortBy] = useState('qty')
  const [lastSync, setLastSync] = useState(null)

  useEffect(() => {
    async function load() {
      let q = supabase.from('soh_data').select('*').order('report_date', { ascending: false })
      if (!canViewAllStores && storeId) q = q.eq('store_id', storeId)
      const { data: rows } = await q.limit(5000)
      setData(rows || [])
      if (rows?.length) setLastSync(rows[0].report_date)
      setLoading(false)
    }
    load()
  }, [])

  const stores = canViewAllStores ? STORES : STORES.filter(s => s.id === storeId)

  const filtered = data.filter(r => {
    if (storeFilter !== 'all' && r.store_id !== parseInt(storeFilter)) return false
    if (search && !r.description?.toLowerCase().includes(search.toLowerCase()) && !r.sku?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => sortBy === 'qty' ? b.qty - a.qty : sortBy === 'value' ? b.retail_value - a.retail_value : a.description?.localeCompare(b.description))

  const totalQty = filtered.reduce((s, r) => s + (r.qty || 0), 0)
  const totalValue = filtered.reduce((s, r) => s + (r.retail_value || 0), 0)
  const zeroStock = filtered.filter(r => r.qty === 0).length
  const lowStock = filtered.filter(r => r.qty > 0 && r.qty <= 2).length

  if (loading) return <div style={{color:'var(--t3)',fontSize:13,padding:20}}>Loading SOH data...</div>

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700}}>Stock on Hand</h1>
          <p style={{fontSize:12,color:'var(--t3)',marginTop:2}}>
            {lastSync ? `Last sync: ${new Date(lastSync).toLocaleDateString('en-SA',{day:'numeric',month:'short',year:'numeric'})} — auto-updated daily from Gmail` : 'No data yet — connect Gmail sync to auto-update'}
          </p>
        </div>
        <div style={{display:'flex',gap:8}}>
          {lastSync && <span className="badge badge-green">✓ Synced today</span>}
        </div>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          { label:'Total SKUs', value:fmt(filtered.length), color:'var(--text)' },
          { label:'Total Units', value:fmt(totalQty), color:'var(--text)' },
          { label:'Retail Value', value:`SAR ${fmt(Math.round(totalValue))}`, color:'var(--accent)' },
          { label:'Zero Stock', value:zeroStock, color:zeroStock>0?'var(--red)':'var(--green)' },
        ].map(c => (
          <div key={c.label} className="card" style={{padding:'14px 16px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',letterSpacing:'.06em',marginBottom:5}}>{c.label.toUpperCase()}</div>
            <div style={{fontSize:22,fontWeight:800,color:c.color}}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{padding:'10px 14px',marginBottom:12,display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search SKU or description..."
          style={{padding:'6px 10px',borderRadius:6,border:'0.5px solid var(--border)',background:'var(--s2)',fontSize:12,fontFamily:'inherit',width:220}}/>
        {canViewAllStores && (
          <select value={storeFilter} onChange={e=>setStoreFilter(e.target.value)}
            style={{padding:'6px 10px',borderRadius:6,border:'0.5px solid var(--border)',background:'var(--s2)',fontSize:12,fontFamily:'inherit'}}>
            <option value="all">All Stores</option>
            {STORES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}
        <div style={{display:'flex',gap:6}}>
          {['qty','value','name'].map(s => (
            <button key={s} className={`btn ${sortBy===s?'btn-primary':''}`} onClick={()=>setSortBy(s)} style={{fontSize:11}}>
              {s==='qty'?'By Units':s==='value'?'By Value':'A–Z'}
            </button>
          ))}
        </div>
        {lowStock > 0 && <span className="badge badge-amber">⚠ {lowStock} low stock (≤2 units)</span>}
        {zeroStock > 0 && <span className="badge badge-red">⛔ {zeroStock} out of stock</span>}
      </div>

      {/* Table */}
      <div className="card" style={{overflow:'hidden'}}>
        <div style={{overflowX:'auto'}}>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:'var(--s3)'}}>
                {['Store','SKU','Description','Category','Qty','Retail Value','Status'].map(h => (
                  <th key={h} style={{padding:'8px 12px',textAlign:'left',fontSize:10,fontWeight:700,color:'var(--t3)',letterSpacing:'.05em',borderBottom:'0.5px solid var(--border)',whiteSpace:'nowrap'}}>{h.toUpperCase()}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0,200).map((r, i) => {
                const store = STORES.find(s => s.id === r.store_id)
                const status = r.qty === 0 ? { label:'Out of stock', cls:'badge-red' } :
                              r.qty <= 2 ? { label:'Low', cls:'badge-amber' } :
                              r.qty <= 5 ? { label:'Watch', cls:'badge-gray' } :
                              { label:'OK', cls:'badge-green' }
                return (
                  <tr key={i} style={{background:i%2===0?'var(--surface)':'var(--s2)',borderBottom:'0.5px solid var(--border)'}}>
                    <td style={{padding:'7px 12px',color:'var(--t2)',whiteSpace:'nowrap',fontSize:11}}>{store?.name?.replace('KIKO ','') || r.store_id}</td>
                    <td style={{padding:'7px 12px',fontFamily:'monospace',fontSize:10,color:'var(--t3)'}}>{r.sku}</td>
                    <td style={{padding:'7px 12px',fontWeight:500,maxWidth:240,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.description}</td>
                    <td style={{padding:'7px 12px'}}><span style={{fontSize:10,background:'var(--s3)',padding:'2px 7px',borderRadius:20,whiteSpace:'nowrap'}}>{r.category}</span></td>
                    <td style={{padding:'7px 12px',fontWeight:700,color:r.qty===0?'var(--red)':r.qty<=2?'var(--amber)':'var(--text)',textAlign:'right'}}>{r.qty}</td>
                    <td style={{padding:'7px 12px',textAlign:'right',color:'var(--t2)'}}>SAR {fmt(Math.round(r.retail_value))}</td>
                    <td style={{padding:'7px 12px'}}><span className={`badge ${status.cls}`}>{status.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length > 200 && (
            <div style={{padding:'10px 14px',fontSize:11,color:'var(--t3)',borderTop:'0.5px solid var(--border)'}}>Showing 200 of {filtered.length} rows — use search to filter</div>
          )}
          {filtered.length === 0 && !loading && (
            <div style={{padding:40,textAlign:'center',color:'var(--t3)',fontSize:13}}>
              {data.length === 0 ? 'No SOH data yet. Gmail sync will auto-update this daily at 7am.' : 'No results matching your search.'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
