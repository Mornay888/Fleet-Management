import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'

export default function Dashboard() {
  const [tanks, setTanks] = useState([])
  const [metrics, setMetrics] = useState({ totalLitres: 0, issuedMonth: 0, vehicles: 0, openPOs: 0 })
  const [recentIssues, setRecentIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [tanksRes, issuesRes, vehiclesRes, posRes] = await Promise.all([
      supabase.from('v_tank_status').select('*').order('name'),
      supabase.from('v_fuel_issues_detail').select('*').order('issued_at', { ascending: false }).limit(5),
      supabase.from('vehicles').select('id', { count: 'exact' }).eq('status','active'),
      supabase.from('purchase_orders').select('id', { count: 'exact' }).in('status',['pending','in_transit']),
    ])

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const { data: monthIssues } = await supabase
      .from('fuel_issues')
      .select('litres_issued')
      .gte('issued_at', startOfMonth)

    const totalLitres = (tanksRes.data || []).reduce((s, t) => s + Number(t.current_level_litres), 0)
    const issuedMonth = (monthIssues || []).reduce((s, i) => s + Number(i.litres_issued), 0)

    setTanks(tanksRes.data || [])
    setRecentIssues(issuesRes.data || [])
    setMetrics({
      totalLitres,
      issuedMonth,
      vehicles: vehiclesRes.count || 0,
      openPOs: posRes.count || 0,
    })
    setLoading(false)
  }

  const barClass = (pct) => pct <= 25 ? 'bar-danger' : pct <= 40 ? 'bar-warn' : 'bar-ok'
  const badgeClass = (status) => ({ healthy: 'badge-ok', monitor: 'badge-warn', low: 'badge-danger' }[status] || 'badge-gray')
  const badgeLabel = (status) => ({ healthy: 'Healthy', monitor: 'Monitor', low: 'Low — order now' }[status] || status)

  const lowTanks = tanks.filter(t => t.level_status === 'low')

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Dashboard</div>
      </div>
      <div className="content">
        {loading ? <p style={{color:'var(--text-muted)'}}>Loading…</p> : <>

          {lowTanks.map(t => (
            <div key={t.id} className="alert-low">
              <i className="ti ti-alert-triangle" />
              <strong>{t.name}</strong> is critically low — {t.current_level_litres} L remaining ({t.level_pct}%). Raise a purchase order now.
            </div>
          ))}

          <div className="metric-row">
            <div className="metric">
              <div className="metric-label">Total diesel in tanks</div>
              <div className="metric-value">{Math.round(metrics.totalLitres).toLocaleString()} L</div>
              <div className="metric-sub ok">{tanks.filter(t=>t.level_status==='healthy').length} tanks healthy</div>
            </div>
            <div className="metric">
              <div className="metric-label">Issued this month</div>
              <div className="metric-value">{Math.round(metrics.issuedMonth).toLocaleString()} L</div>
            </div>
            <div className="metric">
              <div className="metric-label">Active vehicles</div>
              <div className="metric-value">{metrics.vehicles}</div>
            </div>
            <div className="metric">
              <div className="metric-label">Open purchase orders</div>
              <div className="metric-value">{metrics.openPOs}</div>
              {metrics.openPOs > 0 && <div className="metric-sub warn">Awaiting delivery</div>}
            </div>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div className="card">
              <div className="card-title"><i className="ti ti-tank" /> Tank levels</div>
              {tanks.length === 0 && <p style={{color:'var(--text-muted)',fontSize:13}}>No tanks set up yet.</p>}
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                {tanks.map(t => (
                  <div key={t.id}>
                    <div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}>
                      <span style={{fontWeight:500}}>{t.name}</span>
                      <span style={{color:'var(--text-muted)'}}>{t.level_pct}% · {Math.round(t.current_level_litres).toLocaleString()} / {Math.round(t.capacity_litres).toLocaleString()} L</span>
                    </div>
                    <div className="tank-bar-bg">
                      <div className={`tank-bar ${barClass(t.level_pct)}`} style={{width:`${t.level_pct}%`}} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-title"><i className="ti ti-activity" /> Recent fuel issues</div>
              {recentIssues.length === 0 && <p style={{color:'var(--text-muted)',fontSize:13}}>No issues recorded yet.</p>}
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {recentIssues.map(i => (
                  <div key={i.id} style={{padding:'8px',background:'var(--bg)',borderRadius:8}}>
                    <div style={{fontSize:12,fontWeight:500}}>{i.vehicle_registration} — {i.litres_issued} L</div>
                    <div style={{fontSize:11,color:'var(--text-muted)'}}>
                      {i.driver_name} · {i.tank_name} · {new Date(i.issued_at).toLocaleDateString('en-ZA')} · Posted by {i.posted_by_name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>}
      </div>
    </Layout>
  )
}
