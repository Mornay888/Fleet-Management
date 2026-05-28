import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function FuelIssues() {
  const { profile } = useAuth()
  const [issues, setIssues] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [tanks, setTanks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vehicle_id:'', driver_id:'', tank_id:'', issued_at:'', litres_issued:'', odometer_reading_km:'', hours_meter:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [issuesRes, vRes, dRes, tRes] = await Promise.all([
      supabase.from('v_fuel_issues_detail').select('*').order('issued_at', { ascending: false }).limit(50),
      supabase.from('vehicles').select('id,registration,make,model').eq('status','active').order('registration'),
      supabase.from('drivers').select('id,full_name').eq('status','active').order('full_name'),
      supabase.from('v_tank_status').select('*').order('name'),
    ])
    setIssues(issuesRes.data || [])
    setVehicles(vRes.data || [])
    setDrivers(dRes.data || [])
    setTanks(tRes.data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')

    const tank = tanks.find(t => t.id === form.tank_id)
    if (tank && Number(form.litres_issued) > Number(tank.current_level_litres)) {
      setError(`Tank only has ${tank.current_level_litres} L available.`); setSaving(false); return
    }

    const payload = {
      company_id: profile.company_id,
      vehicle_id: form.vehicle_id,
      driver_id: form.driver_id,
      tank_id: form.tank_id,
      issued_at: form.issued_at || new Date().toISOString(),
      litres_issued: Number(form.litres_issued),
      odometer_reading_km: form.odometer_reading_km ? Number(form.odometer_reading_km) : null,
      hours_meter: form.hours_meter ? Number(form.hours_meter) : null,
      notes: form.notes,
      posted_by: profile.id,
    }

    const { error } = await supabase.from('fuel_issues').insert(payload)
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ vehicle_id:'', driver_id:'', tank_id:'', issued_at:'', litres_issued:'', odometer_reading_km:'', hours_meter:'', notes:'' })
    loadAll()
  }

  const f = form; const sf = v => setForm({...form,...v})

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Fuel issues</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Issue fuel'}
          </button>
        </div>
      </div>
      <div className="content">

        {showForm && (
          <div className="card form-max">
            <div className="card-title">Issue fuel to vehicle</div>
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
                <div className="form-group">
                  <label>Tank to draw from</label>
                  <select required value={f.tank_id} onChange={e=>sf({tank_id:e.target.value})}>
                    <option value="">Select tank…</option>
                    {tanks.map(t => <option key={t.id} value={t.id}>{t.name} ({Math.round(t.current_level_litres)} L available)</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date & time</label>
                  <input type="datetime-local" value={f.issued_at} onChange={e=>sf({issued_at:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Litres issued</label>
                  <input required type="number" step="0.01" value={f.litres_issued} onChange={e=>sf({litres_issued:e.target.value})} placeholder="e.g. 60" />
                </div>
                <div className="form-group">
                  <label>Odometer reading (km)</label>
                  <input type="number" value={f.odometer_reading_km} onChange={e=>sf({odometer_reading_km:e.target.value})} placeholder="e.g. 12050" />
                </div>
                <div className="form-group">
                  <label>Hours meter (optional)</label>
                  <input type="number" step="0.1" value={f.hours_meter} onChange={e=>sf({hours_meter:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <input value={f.notes} onChange={e=>sf({notes:e.target.value})} placeholder="Optional" />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Posting…' : 'Post issue'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Vehicle</th><th>Driver</th><th>Litres</th><th>Odometer</th><th>Tank used</th><th>Posted by</th></tr>
            </thead>
            <tbody>
              {issues.length === 0 && <tr><td colSpan={7} style={{color:'var(--text-muted)',padding:'20px'}}>No fuel issues recorded yet.</td></tr>}
              {issues.map(i => (
                <tr key={i.id}>
                  <td>{new Date(i.issued_at).toLocaleString('en-ZA')}</td>
                  <td style={{fontWeight:500}}>{i.vehicle_registration}</td>
                  <td>{i.driver_name}</td>
                  <td>{Number(i.litres_issued).toLocaleString()} L</td>
                  <td>{i.odometer_reading_km ? `${Number(i.odometer_reading_km).toLocaleString()} km` : '—'}</td>
                  <td>{i.tank_name}</td>
                  <td>{i.posted_by_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
