// ════════════════════════════════════════════════════════════════
// KIKO OPS — Gmail SOH Auto-Sync
// Runs daily at 7am via cron — reads KKO_SOH_KSA.xlsx from Gmail
// Deploy on: Railway / Render / any Node.js host
// ════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js')
const { google } = require('googleapis')
const XLSX = require('xlsx')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // service key (not anon) for server-side writes
)

const STORE_NAME_MAP = {
  'KIKO Nakheel Mall - Riyadh':    1,  'KIKO Hamra Mall - Riyadh':       2,
  'KIKO Khaleej Mall - Riyadh':    3,  'KIKO Al Noor - Madinah':         4,
  'KIKO Uwalk - Riyadh':           5,  'KIKO Mall of Arabia - Jeddah':   6,
  'KIKO Makkah Mall - Makkah':     7,  'KIKO Jeddah Park - Jeddah':      8,
  'KIKO Jouri Mall - Taif':        9,  'KIKO U Walk - Jeddah':           10,
  'KIKO Yasmin Mall - Jeddah':     11, 'KIKO Aziz Mall - Jeddah':        12,
  'KIKO Nakheel Mall - Dammam':    13, 'KIKO Mall of Dhahran - Khobar':  14,
  'KIKO Ehsa Mall - Hofuf':        15, 'KIKO Jubail Mall - Jubail':      16,
}

async function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  )
  auth.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
  })
  return google.gmail({ version: 'v1', auth })
}

async function findLatestSOHEmail(gmail) {
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'subject:"SOH Master Report-KKO" from:application.support@fahretail.com has:attachment',
    maxResults: 1,
  })
  return res.data.messages?.[0]?.id
}

async function getAttachment(gmail, messageId) {
  const msg = await gmail.users.messages.get({ userId: 'me', id: messageId })
  const parts = msg.data.payload.parts || []

  for (const part of parts) {
    if (part.filename?.includes('.xlsx') || part.filename?.includes('SOH')) {
      const att = await gmail.users.messages.attachments.get({
        userId: 'me', messageId, id: part.body.attachmentId
      })
      const buffer = Buffer.from(att.data.data, 'base64url')
      const emailDate = new Date(parseInt(msg.data.internalDate))
      return { buffer, date: emailDate.toISOString().slice(0, 10) }
    }
  }
  return null
}

function parseSOHExcel(buffer, reportDate) {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true, raw: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true })

  // Find header row
  let hRow = -1
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const r = rows[i]
    if (r && r.some(v => v && String(v).toLowerCase().includes('store')) &&
             r.some(v => v && String(v).toLowerCase() === 'qty' || String(v).toLowerCase() === 'quantity')) {
      hRow = i; break
    }
  }
  if (hRow < 0) {
    // Fallback: try known SOH column positions
    hRow = 1
  }

  const h = rows[hRow]
  let cStore = -1, cSKU = -1, cDesc = -1, cCat = -1, cQty = -1, cRetail = -1, cCost = -1

  h.forEach((v, i) => {
    const hv = v ? String(v).trim().toLowerCase().replace(/\s+/g, '') : ''
    if (hv.includes('store') || hv.includes('location')) cStore = i
    else if (hv === 'sku' || hv === 'item' || hv === 'itemcode') cSKU = i
    else if (hv.includes('desc')) cDesc = i
    else if (hv.startsWith('cat')) cCat = i
    else if (hv === 'qty' || hv === 'quantity' || hv === 'oh') cQty = i
    else if (hv.includes('retail') || hv.includes('rrp')) cRetail = i
    else if (hv.startsWith('cost')) cCost = i
  })

  const records = []
  for (let i = hRow + 1; i < rows.length; i++) {
    const row = rows[i]
    if (!row) continue
    const qty = parseInt(row[cQty]) || 0
    const storeName = cStore >= 0 && row[cStore] ? String(row[cStore]).trim() : ''
    const storeId = STORE_NAME_MAP[storeName]
    if (!storeId) continue

    records.push({
      store_id:     storeId,
      report_date:  reportDate,
      sku:          cSKU >= 0 && row[cSKU] ? String(row[cSKU]).trim() : null,
      description:  cDesc >= 0 && row[cDesc] ? String(row[cDesc]).trim() : null,
      category:     cCat >= 0 && row[cCat] ? String(row[cCat]).trim().toUpperCase() : null,
      qty:          qty,
      retail_value: cRetail >= 0 ? (parseFloat(row[cRetail]) || 0) : 0,
      cost_value:   cCost >= 0 ? (parseFloat(row[cCost]) || 0) : 0,
    })
  }
  return records
}

async function syncSOH() {
  console.log(`[${new Date().toISOString()}] Starting SOH sync...`)
  try {
    const gmail = await getGmailClient()
    const messageId = await findLatestSOHEmail(gmail)
    if (!messageId) throw new Error('No SOH email found')

    const attachment = await getAttachment(gmail, messageId)
    if (!attachment) throw new Error('No attachment found in email')

    console.log(`Found SOH attachment for date: ${attachment.date}`)

    // Check if already synced today
    const { data: existing } = await supabase
      .from('soh_data').select('id').eq('report_date', attachment.date).limit(1)
    if (existing?.length) {
      console.log('Already synced for this date — skipping')
      await supabase.from('sync_log').insert({ sync_type:'soh', status:'skipped', email_date:attachment.date, rows_inserted:0 })
      return
    }

    const records = parseSOHExcel(attachment.buffer, attachment.date)
    console.log(`Parsed ${records.length} SOH records`)

    // Delete old data for this date and upsert new
    await supabase.from('soh_data').delete().eq('report_date', attachment.date)

    // Insert in batches of 500
    let inserted = 0
    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500)
      const { error } = await supabase.from('soh_data').insert(batch)
      if (error) throw error
      inserted += batch.length
    }

    await supabase.from('sync_log').insert({
      sync_type: 'soh', status: 'success',
      email_date: attachment.date, rows_inserted: inserted
    })
    console.log(`✓ SOH sync complete: ${inserted} rows inserted`)

  } catch (err) {
    console.error('SOH sync error:', err.message)
    await supabase.from('sync_log').insert({ sync_type:'soh', status:'error', error:err.message })
  }
}

syncSOH()
