import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function DailyActivity() {
  const { profile } = useAuth()
  const [activities, setActivities] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [actTypes, setActTypes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vehicle_id:'', driver_id:'', activity_type_id:'', activity_date:'', shift:'day', hours_worked:'', km_travelled:'', start_odometer_km:'', end_odometer_km:'', task_description:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [aRes, vRes, dRes, atRes] = await Promise.all([
      supabase.from('v_daily_activities_detail').select('*').order('activity_date', { ascending: false }).limit(50),
      supabase.from('vehicles').select('id,registration,make,model').eq('status','active').order('registration'),
      supabase.from('drivers').select('id,full_name').eq('status','active').order('full_name'),
      supabase.from('activity_types').select('id,name').eq('is_active',true).order('name'),
    ])
    setActivities(aRes.data || [])
    setVehicles(vRes.data || [])
    setDrivers(dRes.data || [])
    setActTypes(atRes.data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('daily_activities').insert({
      company_id: profile.company_id,
      vehicle_id: form.vehicle_id,
      driver_id: form.driver_id,
      activity_type_id: form.activity_type_id || null,
      activity_date: form.activity_date || new Date().toISOString().split('T')[0],
      shift: form.shift,
      hours_worked: form.hours_worked ? Number(form.hours_worked) : null,
      km_travelled: form.km_travelled ? Number(form.km_travelled) : null,
      start_odometer_km: form.start_odometer_km ? Number(form.start_odometer_km) : null,
      end_odometer_km: form.end_odometer_km ? Number(form.end_odometer_km) : null,
      task_description: form.task_description,
      notes: form.notes,
      posted_by: profile.id,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ vehicle_id:'', driver_id:'', activity_type_id:'', activity_date:'', shift:'day', hours_worked:'', km_travelled:'', start_odometer_km:'', end_odometer_km:'', task_description:'', notes:'' })
    loadAll()
  }

  const f = form; const sf = v => setForm({...form,...v})

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Daily activity log</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Log activity'}
          </button>
        </div>
      </div>
      <div className="content">

        {showForm && (
          <div className="card form-max">
            <div className="card-title">Log daily activity</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vehicle</label>
                  <select required value={f.vehicle_id} onChange={e=>sf({vehicle_id:e.target.value})}>
                    <option value="">Select vehicle…</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.registration} — {v.make} {v.model}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Driver</label>
                  <select required value={f.driver_id} onChange={e=>sf({driver_id:e.target.value})}>
                    <option value="">Select driver…</option>
                    {drivers.map(d => <option key={d.id} value={d.id}>{d.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Date</label><input type="date" required value={f.activity_date} onChange={e=>sf({activity_date:e.target.value})} /></div>
                <div className="form-group">
                  <label>Shift</label>
                  <select value={f.shift} onChange={e=>sf({shift:e.target.value})}>
                    <option value="day">Day shift</option>
                    <option value="night">Night shift</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Activity type</label>
                  <select value={f.activity_type_id} onChange={e=>sf({activity_type_id:e.target.value})}>
                    <option value="">Select…</option>
                    {actTypes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Task / location description</label><input value={f.task_description} onChange={e=>sf({task_description:e.target.value})} placeholder="e.g. Moved cattle from camp 2 to 4" /></div>
                <div className="form-group"><label>Hours worked</label><input type="number" step="0.5" value={f.hours_worked} onChange={e=>sf({hours_worked:e.target.value})} placeholder="e.g. 8.5" /></div>
                <div className="form-group"><label>Km travelled</label><input type="number" value={f.km_travelled} onChange={e=>sf({km_travelled:e.target.value})} placeholder="e.g. 120" /></div>
                <div className="form-group"><label>Start odometer (km)</label><input type="number" value={f.start_odometer_km} onChange={e=>sf({start_odometer_km:e.target.value})} /></div>
                <div className="form-group"><label>End odometer (km)</label><input type="number" value={f.end_odometer_km} onChange={e=>sf({end_odometer_km:e.target.value})} /></div>
                <div className="form-group" style={{gridColumn:'1/-1'}}><label>Notes</label><input value={f.notes} onChange={e=>sf({notes:e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Posting…' : 'Post activity'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Vehicle</th><th>Driver</th><th>Activity</th><th>Hours</th><th>Km</th><th>Task</th><th>Posted by</th></tr></thead>
            <tbody>
              {activities.length === 0 && <tr><td colSpan={8} style={{color:'var(--text-muted)',padding:'20px'}}>No activities logged yet.</td></tr>}
              {activities.map(a => (
                <tr key={a.id}>
                  <td>{new Date(a.activity_date).toLocaleDateString('en-ZA')}</td>
                  <td style={{fontWeight:500}}>{a.vehicle_registration}</td>
                  <td>{a.driver_name}</td>
                  <td>{a.activity_type_name || '—'}</td>
                  <td>{a.hours_worked != null ? `${a.hours_worked} h` : '—'}</td>
                  <td>{a.km_travelled != null ? `${a.km_travelled} km` : '—'}</td>
                  <td style={{maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.task_description || '—'}</td>
                  <td>{a.posted_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
