import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Tanks() {
  const { profile } = useAuth()
  const [tanks, setTanks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', location:'', capacity_litres:'', current_level_litres:'', low_level_alert_pct:'25' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('v_tank_status').select('*').order('name')
    setTanks(data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('tanks').insert({
      ...form,
      company_id: profile.company_id,
      capacity_litres: Number(form.capacity_litres),
      current_level_litres: Number(form.current_level_litres),
      low_level_alert_pct: Number(form.low_level_alert_pct),
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ name:'', location:'', capacity_litres:'', current_level_litres:'', low_level_alert_pct:'25' })
    load()
  }

  const barClass = p => p <= 25 ? 'bar-danger' : p <= 40 ? 'bar-warn' : 'bar-ok'
  const badgeMap = { healthy:'badge-ok', monitor:'badge-warn', low:'badge-danger' }
  const labelMap = { healthy:'Healthy', monitor:'Monitor', low:'Low — order now' }

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Tanks</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Add tank'}
          </button>
        </div>
      </div>
      <div className="content">

        {showForm && (
          <div className="card form-max">
            <div className="card-title">Add tank</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Tank name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Tank 1" /></div>
                <div className="form-group"><label>Location</label><input value={form.location} onChange={e=>setForm({...form,location:e.target.value})} placeholder="e.g. Farm 11" /></div>
                <div className="form-group"><label>Capacity (litres)</label><input required type="number" value={form.capacity_litres} onChange={e=>setForm({...form,capacity_litres:e.target.value})} placeholder="e.g. 1000" /></div>
                <div className="form-group"><label>Current stock (litres)</label><input required type="number" value={form.current_level_litres} onChange={e=>setForm({...form,current_level_litres:e.target.value})} placeholder="e.g. 750" /></div>
                <div className="form-group"><label>Low-level alert at (%)</label><input required type="number" value={form.low_level_alert_pct} onChange={e=>setForm({...form,low_level_alert_pct:e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save tank'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tank name</th><th>Location</th><th>Capacity</th>
                <th>Current level</th><th>Level</th><th>Status</th><th>Alert at</th>
              </tr>
            </thead>
            <tbody>
              {tanks.length === 0 && <tr><td colSpan={7} style={{color:'var(--text-muted)',padding:'20px'}}>No tanks yet. Add your first tank above.</td></tr>}
              {tanks.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight:500}}>{t.name}</td>
                  <td>{t.location || '—'}</td>
                  <td>{Number(t.capacity_litres).toLocaleString()} L</td>
                  <td>{Number(t.current_level_litres).toLocaleString()} L</td>
                  <td style={{width:120}}>
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <div className="tank-bar-bg" style={{flex:1}}>
                        <div className={`tank-bar ${barClass(t.level_pct)}`} style={{width:`${t.level_pct}%`}} />
                      </div>
                      <span style={{fontSize:11,minWidth:32}}>{t.level_pct}%</span>
                    </div>
                  </td>
                  <td><span className={`badge ${badgeMap[t.level_status] || 'badge-gray'}`}>{labelMap[t.level_status] || t.level_status}</span></td>
                  <td>{t.low_level_alert_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
