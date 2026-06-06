import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { STORES, MONTHS, fmtSAR, fmt } from '../lib/constants'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const { profile, canViewAllStores, storeId } = useAuth()
  const [actuals, setActuals] = useState([])
  const [targets, setTargets] = useState([])
  const [loading, setLoading] = useState(true)
  const curMonth = new Date().getMonth()
  const curYear = new Date().getFullYear()

  useEffect(() => {
    Promise.all([
      supabase.from('sales_actuals').select('*').eq('year', curYear).order('month'),
      supabase.from('sales_targets').select('*').eq('year', curYear).order('month'),
    ]).then(([a, t]) => {
      setActuals(a.data || [])
      setTargets(t.data || [])
      setLoading(false)
    })
  }, [])

  const totalActual = actuals.filter(r => r.month <= curMonth + 1)
    .reduce((s, r) => s + (r.net_sales || 0), 0)
  const totalTarget = targets.filter(r => r.month <= curMonth + 1)
    .reduce((s, r) => s + (r.target || 0), 0)
  const vsTarget = totalTarget > 0 ? Math.round((totalActual - totalTarget) / totalTarget * 100) : null
  const totalGP = actuals.filter(r => r.month <= curMonth + 1)
    .reduce((s, r) => s + (r.gross_profit || 0), 0)
  const blendedMargin = totalActual > 0 ? Math.round(totalGP / totalActual * 100) : 0

  const chartData = MONTHS.slice(0, curMonth + 1).map((m, i) => {
    const act = actuals.filter(r => r.month === i + 1).reduce((s, r) => s + (r.net_sales || 0), 0)
    const tgt = targets.filter(r => r.month === i + 1).reduce((s, r) => s + (r.target || 0), 0)
    return { month: m, actual: Math.round(act), target: Math.round(tgt) }
  })

  const storeRanking = STORES.map(s => {
    const sales = actuals.filter(r => r.store_id === s.id && r.month === curMonth + 1)
      .reduce((sum, r) => sum + (r.net_sales || 0), 0)
    const tgt = targets.filter(r => r.store_id === s.id && r.month === curMonth + 1)
      .reduce((sum, r) => sum + (r.target || 0), 0)
    return { ...s, sales, target: tgt, pct: tgt > 0 ? Math.round(sales / tgt * 100) : 0 }
  }).sort((a, b) => b.sales - a.sales)

  if (loading) return <div style={{color:'var(--t3)',fontSize:13,padding:20}}>Loading dashboard...</div>

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h1 style={{fontSize:20,fontWeight:700}}>Dashboard</h1>
        <p style={{fontSize:12,color:'var(--t3)',marginTop:2}}>KIKO KSA · {MONTHS[curMonth]} {curYear} · 16 stores</p>
      </div>

      {/* KPI cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[
          { label:'YTD Net Sales', value:fmtSAR(totalActual), sub:`excl. VAT · ${MONTHS[0]}–${MONTHS[curMonth]}`, color:'var(--text)' },
          { label:`vs Target YTD`, value:vsTarget!==null?`${vsTarget>0?'+':''}${vsTarget}%`:'—', sub:fmtSAR(totalTarget)+' target', color:vsTarget>=0?'var(--green)':'var(--red)' },
          { label:'Blended Margin', value:`${blendedMargin}%`, sub:fmtSAR(totalGP)+' gross profit', color:blendedMargin>=67?'var(--green)':blendedMargin>=50?'var(--amber)':'var(--red)' },
          { label:'Active Stores', value:'16', sub:'Centre · West · East', color:'var(--text)' },
        ].map(c => (
          <div key={c.label} className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:10,fontWeight:700,color:'var(--t3)',letterSpacing:'.06em',marginBottom:6}}>{c.label.toUpperCase()}</div>
            <div style={{fontSize:24,fontWeight:800,color:c.color,lineHeight:1,marginBottom:4}}>{c.value}</div>
            <div style={{fontSize:11,color:'var(--t3)'}}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* Chart + ranking */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div className="card" style={{padding:16}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Monthly Sales vs Target</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barGap={2}>
              <XAxis dataKey="month" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
              <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v>=1e6?`${(v/1e6).toFixed(1)}M`:v>=1e3?`${(v/1e3).toFixed(0)}K`:v}/>
              <Tooltip formatter={(v,n)=>[fmtSAR(v),n==='actual'?'Actual':'Target']} contentStyle={{fontSize:11,borderRadius:8,border:'0.5px solid var(--border)'}}/>
              <Bar dataKey="target" fill="#e5e3da" radius={[3,3,0,0]}/>
              <Bar dataKey="actual" radius={[3,3,0,0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.actual>=entry.target?'#6c3fc5':'#f59e0b'}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{padding:16}}>
          <div style={{fontSize:12,fontWeight:700,marginBottom:12}}>Store Ranking — {MONTHS[curMonth]}</div>
          <div style={{overflow:'auto',maxHeight:220}}>
            {storeRanking.map((s, i) => (
              <div key={s.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'0.5px solid var(--border)'}}>
                <div style={{width:18,fontSize:11,fontWeight:700,color:'var(--t3)',textAlign:'center'}}>{i+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s.name.replace('KIKO ','')}</div>
                  <div style={{display:'flex',alignItems:'center',gap:4,marginTop:2}}>
                    <div style={{flex:1,height:4,background:'var(--s3)',borderRadius:2}}>
                      <div style={{height:4,borderRadius:2,width:`${Math.min(s.pct,100)}%`,background:s.pct>=100?'var(--green)':s.pct>=80?'var(--accent)':'var(--amber)',transition:'width .3s'}}/>
                    </div>
                    <span style={{fontSize:10,color:'var(--t3)',whiteSpace:'nowrap'}}>{s.pct}%</span>
                  </div>
                </div>
                <div style={{fontSize:11,fontWeight:700,whiteSpace:'nowrap'}}>{fmtSAR(s.sales)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Region cards */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {['Centre','West','East'].map(reg => {
          const regStores = STORES.filter(s => s.region === reg)
          const regSales = actuals.filter(r => regStores.some(s => s.id === r.store_id) && r.month === curMonth + 1)
            .reduce((s, r) => s + (r.net_sales || 0), 0)
          const regTarget = targets.filter(r => regStores.some(s => s.id === r.store_id) && r.month === curMonth + 1)
            .reduce((s, r) => s + (r.target || 0), 0)
          const pct = regTarget > 0 ? Math.round(regSales / regTarget * 100) : 0
          return (
            <div key={reg} className="card" style={{padding:'14px 16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <span style={{fontSize:12,fontWeight:700}}>{reg} Region</span>
                <span style={{fontSize:11,fontWeight:700,color:pct>=100?'var(--green)':pct>=80?'var(--amber)':'var(--red)'}}>{pct}% of target</span>
              </div>
              <div style={{fontSize:18,fontWeight:800,marginBottom:4}}>{fmtSAR(regSales)}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:8}}>{regStores.length} stores · target {fmtSAR(regTarget)}</div>
              <div style={{height:5,background:'var(--s3)',borderRadius:3}}>
                <div style={{height:5,borderRadius:3,width:`${Math.min(pct,100)}%`,background:pct>=100?'var(--green)':pct>=80?'var(--accent)':'var(--amber)'}}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
