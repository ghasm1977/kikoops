import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(email, password)
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--s2)'}}>
      <div style={{width:'100%',maxWidth:400,padding:'0 20px'}}>
        {/* Logo */}
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:10,marginBottom:8}}>
            <div style={{width:36,height:36,borderRadius:9,background:'#6c3fc5',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <span style={{color:'#fff',fontWeight:800,fontSize:16}}>K</span>
            </div>
            <span style={{fontSize:22,fontWeight:700,color:'var(--text)'}}>KIKO Ops</span>
          </div>
          <p style={{fontSize:13,color:'var(--t3)'}}>Retail Operations Portal · KSA</p>
        </div>

        <div className="card" style={{padding:28}}>
          <h2 style={{fontSize:16,fontWeight:600,marginBottom:20}}>Sign in to your account</h2>
          <form onSubmit={handleSubmit}>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:11,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5}}>EMAIL</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
                style={{width:'100%',padding:'9px 12px',borderRadius:7,border:'0.5px solid var(--border)',background:'var(--s2)',fontSize:13,fontFamily:'inherit',color:'var(--text)'}}
                placeholder="you@cenomi.com" />
            </div>
            <div style={{marginBottom:20}}>
              <label style={{fontSize:11,fontWeight:600,color:'var(--t2)',display:'block',marginBottom:5}}>PASSWORD</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
                style={{width:'100%',padding:'9px 12px',borderRadius:7,border:'0.5px solid var(--border)',background:'var(--s2)',fontSize:13,fontFamily:'inherit',color:'var(--text)'}}
                placeholder="••••••••" />
            </div>
            {error && <div style={{background:'#fee2e2',color:'#991b1b',padding:'8px 12px',borderRadius:7,fontSize:12,marginBottom:14}}>{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary" style={{width:'100%',padding:'10px',fontSize:13}}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
        <p style={{textAlign:'center',fontSize:11,color:'var(--t3)',marginTop:20}}>
          KIKO Milano · Saudi Arabia · 16 Stores · 3 Regions
        </p>
      </div>
    </div>
  )
}
