import { useAuth } from '../context/AuthContext'
import { STORES, REGIONS } from '../lib/constants'
import { useState, useEffect } from 'react'

const StoreContext = { store: 'all', region: 'all', setStore: ()=>{}, setRegion: ()=>{} }
export let storeState = { storeId: 'all', region: 'all' }

export default function StoreSelector() {
  const { isAdmin, isAreaManager, region: userRegion } = useAuth()
  const [store, setStore] = useState('all')
  const [region, setRegion] = useState(userRegion || 'all')

  const filteredStores = region === 'all' ? STORES : STORES.filter(s => s.region === region)

  useEffect(() => { storeState = { storeId: store, region } }, [store, region])

  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {isAdmin && (
        <select value={region} onChange={e=>{setRegion(e.target.value);setStore('all')}}
          style={{width:'100%',padding:'5px 8px',borderRadius:6,border:'0.5px solid var(--border)',background:'var(--s2)',fontSize:11,fontFamily:'inherit',color:'var(--text)'}}>
          <option value="all">All Regions</option>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      )}
      <select value={store} onChange={e=>setStore(e.target.value)}
        style={{width:'100%',padding:'5px 8px',borderRadius:6,border:'0.5px solid var(--border)',background:'var(--s2)',fontSize:11,fontFamily:'inherit',color:'var(--text)'}}>
        <option value="all">All Stores</option>
        {filteredStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </div>
  )
}
