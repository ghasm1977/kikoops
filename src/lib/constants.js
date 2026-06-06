export const STORES = [
  { id:1,  name:'Nakheel Mall - Riyadh',     region:'Centre', city:'Riyadh'  },
  { id:2,  name:'Hamra Mall - Riyadh',        region:'Centre', city:'Riyadh'  },
  { id:3,  name:'Khaleej Mall - Riyadh',      region:'Centre', city:'Riyadh'  },
  { id:4,  name:'Al Noor - Madinah',          region:'Centre', city:'Madinah' },
  { id:5,  name:'Uwalk - Riyadh',             region:'Centre', city:'Riyadh'  },
  { id:6,  name:'Mall of Arabia - Jeddah',    region:'West',   city:'Jeddah'  },
  { id:7,  name:'Makkah Mall - Makkah',       region:'West',   city:'Makkah'  },
  { id:8,  name:'Jeddah Park - Jeddah',       region:'West',   city:'Jeddah'  },
  { id:9,  name:'Jouri Mall - Taif',          region:'West',   city:'Taif'    },
  { id:10, name:'U Walk - Jeddah',            region:'West',   city:'Jeddah'  },
  { id:11, name:'Yasmin Mall - Jeddah',       region:'West',   city:'Jeddah'  },
  { id:12, name:'Aziz Mall - Jeddah',         region:'West',   city:'Jeddah'  },
  { id:13, name:'Nakheel Mall - Dammam',      region:'East',   city:'Dammam'  },
  { id:14, name:'Mall of Dhahran - Khobar',   region:'East',   city:'Khobar'  },
  { id:15, name:'Ehsa Mall - Hofuf',          region:'East',   city:'Hofuf'   },
  { id:16, name:'Jubail Mall - Jubail',       region:'East',   city:'Jubail'  },
]
export const REGIONS = ['Centre','West','East']
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
export const ROLES = { ADMIN:'admin', AREA_MANAGER:'area_manager', STORE_MANAGER:'store_manager', STAFF:'staff' }

export const fmt = (n) => n==null?'—':Math.round(n).toLocaleString()
export const fmtSAR = (n) => {
  if(!n) return 'SAR 0'
  if(n>=1e6) return `SAR ${(n/1e6).toFixed(1)}M`
  if(n>=1e3) return `SAR ${(n/1e3).toFixed(0)}K`
  return `SAR ${Math.round(n)}`
}
export const marginColor = (p) => p>=67?'#10b981':p>=50?'#f59e0b':'#ef4444'
