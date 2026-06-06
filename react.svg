import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import StoreSelector from './StoreSelector'

const navItems = [
  { section: 'OVERVIEW', items: [
    { to:'/', label:'Dashboard', icon:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { to:'/performance', label:'Performance', icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ]},
  { section: 'COMMERCIAL', items: [
    { to:'/best-sellers', label:'Best Sellers', icon:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
    { to:'/soh', label:'Stock on Hand', icon:'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { to:'/orders', label:'Order Tracker', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  ]},
  { section: 'TEAM', items: [
    { to:'/checklist', label:'Opening Checklist', icon:'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
    { to:'/schedule', label:'Schedule', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { to:'/kpi', label:'KPI Tracker', icon:'M13 10V3L4 14h7v7l9-11h-7z' },
    { to:'/team', label:'Team', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  ]},
]

export default function Layout() {
  const { profile, signOut, isAdmin, canViewAllStores } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden'}}>
      {/* Sidebar */}
      <div style={{width:sidebarOpen?220:0,flexShrink:0,background:'var(--surface)',borderRight:'0.5px solid var(--border)',overflow:'hidden',transition:'width .2s',display:'flex',flexDirection:'column'}}>
        {/* Logo */}
        <div style={{padding:'16px 16px 12px',borderBottom:'0.5px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:30,height:30,borderRadius:7,background:'#6c3fc5',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{color:'#fff',fontWeight:800,fontSize:14}}>K</span>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,lineHeight:1.2}}>KIKO Ops</div>
              <div style={{fontSize:10,color:'var(--t3)'}}>16 Stores · 3 Regions</div>
            </div>
          </div>
        </div>

        {/* Store selector */}
        {canViewAllStores && <div style={{padding:'10px 12px',borderBottom:'0.5px solid var(--border)'}}><StoreSelector /></div>}

        {/* Nav */}
        <nav style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {navItems.map(section => (
            <div key={section.section}>
              <div style={{fontSize:9,fontWeight:700,color:'var(--t3)',letterSpacing:'.08em',padding:'10px 16px 4px'}}>{section.section}</div>
              {section.items.map(item => (
                <NavLink key={item.to} to={item.to} end={item.to==='/'} style={({isActive})=>({
                  display:'flex',alignItems:'center',gap:9,padding:'7px 16px',fontSize:13,fontWeight:500,
                  color:isActive?'#6c3fc5':'var(--t2)',background:isActive?'var(--accent-light)':'transparent',
                  borderRight:isActive?'2px solid #6c3fc5':'2px solid transparent',textDecoration:'none',transition:'all .1s'
                })}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d={item.icon}/>
                  </svg>
                  <span style={{whiteSpace:'nowrap'}}>{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User */}
        <div style={{padding:'10px 14px',borderTop:'0.5px solid var(--border)'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:28,height:28,borderRadius:'50%',background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:'#6c3fc5',flexShrink:0}}>
              {profile?.full_name?.[0] || 'U'}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name || 'User'}</div>
              <div style={{fontSize:10,color:'var(--t3)',textTransform:'capitalize'}}>{profile?.role?.replace('_',' ')}</div>
            </div>
            <button onClick={signOut} title="Sign out" style={{background:'none',border:'none',cursor:'pointer',color:'var(--t3)',padding:4}}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* Topbar */}
        <div style={{height:48,background:'var(--surface)',borderBottom:'0.5px solid var(--border)',display:'flex',alignItems:'center',padding:'0 20px',gap:12,flexShrink:0}}>
          <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--t2)',padding:4}}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div style={{flex:1}}/>
          <span style={{fontSize:11,color:'var(--t3)'}}>{new Date().toLocaleDateString('en-SA',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</span>
          <div style={{width:1,height:18,background:'var(--border)'}}/>
          <span style={{fontSize:11,fontWeight:600,color:'#6c3fc5',background:'var(--accent-light)',padding:'3px 8px',borderRadius:5}}>{profile?.role?.replace('_',' ')?.toUpperCase()}</span>
        </div>

        {/* Page content */}
        <div style={{flex:1,overflow:'auto',padding:20}}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
