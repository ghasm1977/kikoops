import { useState } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabase'
import { STORES } from '../lib/constants'

// ── Tab definitions ──────────────────────────────────────────────
const TABS = [
  {
    id: 'sales_actuals',
    label: 'Sales Actuals',
    table: 'sales_actuals',
    description: 'Daily or monthly net sales, gross profit, units and transactions per store.',
    fields: [
      { key:'store',        label:'Store',         match:['store','store name','branch'],            type:'store',  required:true },
      { key:'year',         label:'Year',          match:['year'],                                    type:'int',    required:true },
      { key:'month',        label:'Month',         match:['month'],                                   type:'month',  required:true },
      { key:'date',         label:'Date',          match:['date'],                                    type:'date',   required:false },
      { key:'net_sales',    label:'Net Sales',     match:['net sales','net_sales','sales'],           type:'number', required:true },
      { key:'gross_profit', label:'Gross Profit',  match:['gross profit','gross_profit','gp'],        type:'number', required:false },
      { key:'units',        label:'Units',         match:['units','qty','quantity'],                  type:'int',    required:false },
      { key:'transactions', label:'Transactions',  match:['transactions','txns','tickets'],           type:'int',    required:false },
    ],
    templateRow: { Store:'Nakheel Mall - Riyadh', Year:2026, Month:6, Date:'2026-06-01', 'Net Sales':125000, 'Gross Profit':83750, Units:540, Transactions:310 },
  },
  {
    id: 'sales_targets',
    label: 'Store Targets',
    table: 'sales_targets',
    description: 'Monthly net sales target and UPT target per store.',
    fields: [
      { key:'store',      label:'Store',      match:['store','store name','branch'],   type:'store',  required:true },
      { key:'year',       label:'Year',       match:['year'],                          type:'int',    required:true },
      { key:'month',      label:'Month',      match:['month'],                         type:'month',  required:true },
      { key:'target',     label:'Target',     match:['target','sales target'],         type:'number', required:true },
      { key:'upt_target', label:'UPT Target', match:['upt target','upt_target','upt'], type:'number', required:false },
    ],
    templateRow: { Store:'Nakheel Mall - Riyadh', Year:2026, Month:6, Target:140000, 'UPT Target':2.5 },
  },
  {
    id: 'best_sellers',
    label: 'Best Sellers',
    table: 'best_sellers',
    description: 'Top-selling SKUs per store and month, with units, sales and cost.',
    fields: [
      { key:'store',         label:'Store',         match:['store','store name','branch'],       type:'store',   required:true },
      { key:'report_date',   label:'Report Date',   match:['report date','report_date','date'],  type:'date',    required:false },
      { key:'year',          label:'Year',          match:['year'],                              type:'int',     required:true },
      { key:'month',         label:'Month',         match:['month'],                             type:'month',   required:true },
      { key:'sku',           label:'SKU',           match:['sku','code','item code'],            type:'text',    required:true },
      { key:'description',   label:'Description',   match:['description','desc','item'],         type:'text',    required:false },
      { key:'category',      label:'Category',      match:['category','cat'],                    type:'text',    required:false },
      { key:'lifecycle',     label:'Lifecycle',     match:['lifecycle'],                          type:'text',    required:false },
      { key:'is_collection', label:'Is Collection', match:['is collection','is_collection','collection'], type:'bool', required:false },
      { key:'units',         label:'Units',         match:['units','qty','quantity'],            type:'int',     required:false },
      { key:'sales_net',     label:'Sales Net',     match:['sales net','sales_net','net sales'], type:'number',  required:false },
      { key:'cost',          label:'Cost',          match:['cost'],                              type:'number',  required:false },
    ],
    templateRow: { Store:'Nakheel Mall - Riyadh', 'Report Date':'2026-06-01', Year:2026, Month:6, SKU:'KK-12345', Description:'Lip Gloss 06', Category:'Lips', Lifecycle:'Core', 'Is Collection':false, Units:120, 'Sales Net':14400, Cost:6200 },
  },
]

const MONTH_NAMES = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']

function findStoreId(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim()
  if (/^\d+$/.test(raw)) {
    const id = parseInt(raw, 10)
    return STORES.some(s => s.id === id) ? id : null
  }
  const norm = raw.toLowerCase().replace(/^kiko\s+/, '')
  let match = STORES.find(s => s.name.toLowerCase() === norm)
  if (!match) match = STORES.find(s => s.name.toLowerCase().includes(norm) || norm.includes(s.name.toLowerCase()))
  if (!match) match = STORES.find(s => norm.includes(s.city.toLowerCase()) && norm.includes(s.name.split(' - ')[0].toLowerCase()))
  return match ? match.id : null
}

function coerceMonth(value) {
  if (value == null || value === '') return null
  const raw = String(value).trim().toLowerCase()
  if (/^\d+$/.test(raw)) {
    const m = parseInt(raw, 10)
    return m >= 1 && m <= 12 ? m : null
  }
  const idx = MONTH_NAMES.findIndex(m => raw.startsWith(m))
  return idx >= 0 ? idx + 1 : null
}

function coerceDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number') {
    const d = XLSX.SSF.parse_date_code(value)
    if (d) return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`
  }
  const raw = String(value).trim()
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return raw
}

function coerceNumber(value) {
  if (value == null || value === '') return null
  const n = parseFloat(String(value).replace(/[^0-9.-]/g, ''))
  return isNaN(n) ? null : n
}

function coerceInt(value) {
  const n = coerceNumber(value)
  return n == null ? null : Math.round(n)
}

function coerceBool(value) {
  if (value == null || value === '') return false
  const raw = String(value).trim().toLowerCase()
  return raw === 'true' || raw === 'yes' || raw === '1' || raw === 'y'
}

function coerceCell(field, value) {
  switch (field.type) {
    case 'store':  return findStoreId(value)
    case 'month':  return coerceMonth(value)
    case 'date':   return coerceDate(value)
    case 'number': return coerceNumber(value)
    case 'int':    return coerceInt(value)
    case 'bool':   return coerceBool(value)
    default:       return value == null ? null : String(value).trim()
  }
}

function downloadTemplate(tab) {
  const headers = tab.fields.map(f => f.label)
  const ws = XLSX.utils.json_to_sheet([tab.templateRow], { header: headers })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, `kiko-ops-${tab.id}-template.csv`, { bookType: 'csv' })
}

function parseFile(tab, file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true })
        const sheet = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        if (!rows.length) return resolve({ rows: [], errors: ['The file has no data rows.'] })

        const headerKeys = Object.keys(rows[0])
        const fieldMap = {}
        for (const field of tab.fields) {
          const found = headerKeys.find(h => field.match.includes(String(h).trim().toLowerCase()))
          if (found) fieldMap[field.key] = found
        }

        const missingRequired = tab.fields.filter(f => f.required && !fieldMap[f.key])
        if (missingRequired.length) {
          return resolve({ rows: [], errors: [
            `Missing required column(s): ${missingRequired.map(f => f.label).join(', ')}. ` +
            `Found columns: ${headerKeys.join(', ')}`
          ] })
        }

        const errors = []
        const parsed = []
        rows.forEach((raw, i) => {
          const out = {}
          let rowError = null
          for (const field of tab.fields) {
            const sourceCol = fieldMap[field.key]
            const cellValue = sourceCol ? raw[sourceCol] : null
            const coerced = coerceCell(field, cellValue)
            if (field.required && (coerced == null || coerced === '')) {
              rowError = `Row ${i + 2}: invalid or missing "${field.label}" (got "${cellValue}")`
              break
            }
            out[field.key] = coerced
          }
          if (rowError) errors.push(rowError)
          else { out.store_id = out.store; delete out.store; parsed.push(out) }
        })
        resolve({ rows: parsed, errors })
      } catch (err) {
        reject(err)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

function TabPanel({ tab }) {
  const [fileName, setFileName] = useState('')
  const [parsedRows, setParsedRows] = useState([])
  const [parseErrors, setParseErrors] = useState([])
  const [parsing, setParsing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setParsedRows([])
    setParseErrors([])
    setResult(null)
    setParsing(true)
    try {
      const { rows, errors } = await parseFile(tab, file)
      setParsedRows(rows)
      setParseErrors(errors)
    } catch (err) {
      setParseErrors([err.message || 'Failed to parse file. Make sure it is a valid CSV or Excel file.'])
    } finally {
      setParsing(false)
    }
  }

  async function handleUpload() {
    if (!parsedRows.length) return
    setUploading(true)
    setResult(null)
    try {
      const chunkSize = 500
      let inserted = 0
      for (let i = 0; i < parsedRows.length; i += chunkSize) {
        const chunk = parsedRows.slice(i, i + chunkSize)
        const { error } = await supabase.from(tab.table).insert(chunk)
        if (error) throw error
        inserted += chunk.length
      }
      setResult({ ok: true, message: `Uploaded ${inserted} row${inserted === 1 ? '' : 's'} to ${tab.label}.` })
      setParsedRows([])
      setFileName('')
    } catch (err) {
      setResult({ ok: false, message: err.message || 'Upload failed.' })
    } finally {
      setUploading(false)
    }
  }

  const previewFields = tab.fields.slice(0, 5)

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16,gap:12}}>
        <p style={{fontSize:12,color:'var(--t3)',maxWidth:520}}>{tab.description}</p>
        <button className="btn" onClick={() => downloadTemplate(tab)} style={{fontSize:12,whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:6}}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download Template
        </button>
      </div>

      {/* File picker */}
      <label style={{
        display:'flex',alignItems:'center',gap:10,padding:'12px 16px',
        border:'1.5px dashed var(--border)',borderRadius:8,cursor:'pointer',
        background:'var(--bg2)',marginBottom:12,fontSize:13,color:'var(--t2)',
      }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
        {fileName || 'Choose CSV or Excel file…'}
        <input type="file" accept=".csv,.xlsx,.xls" style={{display:'none'}} onChange={handleFile}/>
      </label>

      {parsing && <p style={{fontSize:12,color:'var(--t3)',marginBottom:8}}>Parsing file…</p>}

      {parseErrors.length > 0 && (
        <div style={{background:'#fff1f1',border:'1px solid #fca5a5',borderRadius:6,padding:'10px 14px',marginBottom:12}}>
          {parseErrors.map((e,i) => <p key={i} style={{fontSize:12,color:'#dc2626',margin:'2px 0'}}>{e}</p>)}
        </div>
      )}

      {parsedRows.length > 0 && (
        <div style={{marginBottom:12}}>
          <p style={{fontSize:12,color:'var(--t3)',marginBottom:6}}>
            Preview — {parsedRows.length} rows ready to upload
          </p>
          <div style={{overflowX:'auto',borderRadius:6,border:'0.5px solid var(--border)'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'var(--bg2)'}}>
                  {previewFields.map(f => (
                    <th key={f.key} style={{padding:'6px 10px',textAlign:'left',fontWeight:600,color:'var(--t2)',borderBottom:'0.5px solid var(--border)'}}>
                      {f.label}
                    </th>
                  ))}
                  {tab.fields.length > 5 && <th style={{padding:'6px 10px',color:'var(--t3)',borderBottom:'0.5px solid var(--border)'}}>…</th>}
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0,5).map((row,i) => (
                  <tr key={i} style={{borderBottom:'0.5px solid var(--border)'}}>
                    {previewFields.map(f => (
                      <td key={f.key} style={{padding:'6px 10px',color:'var(--t1)'}}>
                        {row[f.key] == null ? <span style={{color:'var(--t3)'}}>—</span> : String(row[f.key])}
                      </td>
                    ))}
                    {tab.fields.length > 5 && <td style={{padding:'6px 10px',color:'var(--t3)'}}>…</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsedRows.length > 5 && (
            <p style={{fontSize:11,color:'var(--t3)',marginTop:4}}>…and {parsedRows.length - 5} more rows</p>
          )}
        </div>
      )}

      {result && (
        <div style={{
          padding:'10px 14px',borderRadius:6,marginBottom:12,fontSize:13,fontWeight:500,
          background: result.ok ? '#f0fdf4' : '#fff1f1',
          border: `1px solid ${result.ok ? '#86efac' : '#fca5a5'}`,
          color: result.ok ? '#15803d' : '#dc2626',
        }}>
          {result.message}
        </div>
      )}

      <button
        className="btn"
        onClick={handleUpload}
        disabled={!parsedRows.length || uploading}
        style={{
          opacity: (!parsedRows.length || uploading) ? 0.5 : 1,
          cursor: (!parsedRows.length || uploading) ? 'not-allowed' : 'pointer',
          background:'#6c3fc5',color:'#fff',border:'none',padding:'9px 20px',
          borderRadius:6,fontSize:13,fontWeight:600,fontFamily:'inherit',
        }}
      >
        {uploading ? 'Uploading…' : `Upload ${parsedRows.length ? parsedRows.length + ' rows' : ''}`}
      </button>
    </div>
  )
}

export default function DataUpload() {
  const [activeTab, setActiveTab] = useState(TABS[0].id)
  const tab = TABS.find(t => t.id === activeTab)
  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:700}}>Data Upload</h1>
        <p style={{fontSize:12,color:'var(--t3)',marginTop:2}}>Import sales actuals, store targets and best sellers from CSV or Excel files into Supabase.</p>
      </div>
      <div style={{display:'flex',gap:6,marginBottom:16,borderBottom:'0.5px solid var(--border)'}}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding:'9px 16px',fontSize:13,fontWeight:600,fontFamily:'inherit',cursor:'pointer',background:'none',border:'none',
            borderBottom:activeTab===t.id?'2px solid #6c3fc5':'2px solid transparent',
            color:activeTab===t.id?'#6c3fc5':'var(--t3)',marginBottom:-1,
          }}>{t.label}</button>
        ))}
      </div>
      <TabPanel key={tab.id} tab={tab}/>
    </div>
  )
}
 
