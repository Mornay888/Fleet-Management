import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'

export default function Reports() {
  const [issues, setIssues] = useState([])
  const [activities, setActivities] = useState([])
  const [tanks, setTanks] = useState([])
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0]
  })
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadReports() }, [from, to])

  async function loadReports() {
    setLoading(true)
    const [iRes, aRes, tRes] = await Promise.all([
      supabase.from('v_fuel_issues_detail').select('*').gte('issued_at', from).lte('issued_at', to + 'T23:59:59').order('issued_at'),
      supabase.from('v_daily_activities_detail').select('*').gte('activity_date', from).lte('activity_date', to).order('activity_date'),
      supabase.from('v_tank_status').select('*').order('name'),
    ])
    setIssues(iRes.data || [])
    setActivities(aRes.data || [])
    setTanks(tRes.data || [])
    setLoading(false)
  }

  // Group issues by vehicle
  const byVehicle = issues.reduce((acc, i) => {
    const key = i.vehicle_registration || 'Unknown'
    if (!acc[key]) acc[key] = { litres: 0, count: 0 }
    acc[key].litres += Number(i.litres_issued)
    acc[key].count++
    return acc
  }, {})

  // Group activities by vehicle
  const actByVehicle = activities.reduce((acc, a) => {
    const key = a.vehicle_registration || 'Unknown'
    if (!acc[key]) acc[key] = { hours: 0, km: 0, count: 0 }
    acc[key].hours += Number(a.hours_worked || 0)
    acc[key].km += Number(a.km_travelled || 0)
    acc[key].count++
    return acc
  }, {})

  const totalIssued = issues.reduce((s, i) => s + Number(i.litres_issued), 0)
  const totalHours = activities.reduce((s, a) => s + Number(a.hours_worked || 0), 0)

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Reports</div>
      </div>
      <div className="content">

        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:20,flexWrap:'wrap'}}>
          <div className="form-group" style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <label style={{whiteSpace:'nowrap'}}>From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={{width:'auto'}} />
          </div>
          <div className="form-group" style={{flexDirection:'row',alignItems:'center',gap:8}}>
            <label style={{whiteSpace:'nowrap'}}>To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={{width:'auto'}} />
          </div>
          {loading && <span style={{fontSize:12,color:'var(--text-muted)'}}>Loading…</span>}
        </div>

        <div className="metric-row" style={{marginBottom:24}}>
          <div className="metric"><div className="metric-label">Total issued in period</div><div className="metric-value">{Math.round(totalIssued).toLocaleString()} L</div></div>
          <div className="metric"><div className="metric-label">Issue transactions</div><div className="metric-value">{issues.length}</div></div>
          <div className="metric"><div className="metric-label">Total hours logged</div><div className="metric-value">{totalHours.toFixed(1)} h</div></div>
          <div className="metric"><div className="metric-label">Activity logs</div><div className="metric-value">{activities.length}</div></div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
          <div className="card">
            <div className="card-title"><i className="ti ti-droplet" /> Diesel issued by vehicle</div>
            <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={{textAlign:'left',padding:'4px 0',color:'var(--text-muted)',fontSize:11}}>Vehicle</th>
                <th style={{textAlign:'right',padding:'4px 0',color:'var(--text-muted)',fontSize:11}}>Issues</th>
                <th style={{textAlign:'right',padding:'4px 0',color:'var(--text-muted)',fontSize:11}}>Litres</th>
              </tr></thead>
              <tbody>
                {Object.keys(byVehicle).length === 0 && <tr><td colSpan={3} style={{color:'var(--text-muted)',padding:'8px 0'}}>No issues in period.</td></tr>}
                {Object.entries(byVehicle).sort((a,b) => b[1].litres - a[1].litres).map(([reg, d]) => (
                  <tr key={reg}>
                    <td style={{padding:'5px 0',fontWeight:500}}>{reg}</td>
                    <td style={{textAlign:'right',padding:'5px 0'}}>{d.count}</td>
                    <td style={{textAlign:'right',padding:'5px 0'}}>{Math.round(d.litres).toLocaleString()} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-title"><i className="ti ti-clock" /> Activity hours by vehicle</div>
            <table style={{width:'100%',fontSize:12,borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={{textAlign:'left',padding:'4px 0',color:'var(--text-muted)',fontSize:11}}>Vehicle</th>
                <th style={{textAlign:'right',padding:'4px 0',color:'var(--text-muted)',fontSize:11}}>Hours</th>
                <th style={{textAlign:'right',padding:'4px 0',color:'var(--text-muted)',fontSize:11}}>Km</th>
              </tr></thead>
              <tbody>
                {Object.keys(actByVehicle).length === 0 && <tr><td colSpan={3} style={{color:'var(--text-muted)',padding:'8px 0'}}>No activities in period.</td></tr>}
                {Object.entries(actByVehicle).sort((a,b) => b[1].hours - a[1].hours).map(([reg, d]) => (
                  <tr key={reg}>
                    <td style={{padding:'5px 0',fontWeight:500}}>{reg}</td>
                    <td style={{textAlign:'right',padding:'5px 0'}}>{d.hours.toFixed(1)} h</td>
                    <td style={{textAlign:'right',padding:'5px 0'}}>{Math.round(d.km).toLocaleString()} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-title"><i className="ti ti-tank" /> Current tank levels</div>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {tanks.map(t => (
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:160,fontSize:12,fontWeight:500}}>{t.name}</div>
                <div style={{flex:1}}>
                  <div className="tank-bar-bg">
                    <div className={`tank-bar ${t.level_pct <= 25 ? 'bar-danger' : t.level_pct <= 40 ? 'bar-warn' : 'bar-ok'}`} style={{width:`${t.level_pct}%`}} />
                  </div>
                </div>
                <div style={{fontSize:12,color:'var(--text-muted)',minWidth:160,textAlign:'right'}}>
                  {Math.round(t.current_level_litres).toLocaleString()} / {Math.round(t.capacity_litres).toLocaleString()} L ({t.level_pct}%)
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Layout>
  )
}
