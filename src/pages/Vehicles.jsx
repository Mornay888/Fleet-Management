import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

const TYPES = ['Light vehicle','Bakkie','Truck','Tractor','Excavator','Grader','ADT','Generator','Other']

export default function Vehicles() {
  const { profile } = useAuth()
  const [vehicles, setVehicles] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ registration:'', fleet_number:'', make:'', model:'', year:'', vehicle_type:'Light vehicle', tank_capacity_litres:'', current_odometer_km:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('vehicles').select('*').order('registration')
    setVehicles(data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('vehicles').insert({
      ...form,
      company_id: profile.company_id,
      year: form.year ? Number(form.year) : null,
      tank_capacity_litres: form.tank_capacity_litres ? Number(form.tank_capacity_litres) : null,
      current_odometer_km: form.current_odometer_km ? Number(form.current_odometer_km) : 0,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ registration:'', fleet_number:'', make:'', model:'', year:'', vehicle_type:'Light vehicle', tank_capacity_litres:'', current_odometer_km:'' })
    load()
  }

  const f = form; const sf = v => setForm({...form,...v})
  const statusBadge = s => ({ active:'badge-ok', service:'badge-warn', inactive:'badge-gray' }[s] || 'badge-gray')

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Vehicles</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Add vehicle'}
          </button>
        </div>
      </div>
      <div className="content">

        {showForm && (
          <div className="card form-max">
            <div className="card-title">Add vehicle</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Registration</label><input required value={f.registration} onChange={e=>sf({registration:e.target.value})} placeholder="e.g. CC 87 DD GP" /></div>
                <div className="form-group"><label>Fleet number (optional)</label><input value={f.fleet_number} onChange={e=>sf({fleet_number:e.target.value})} placeholder="Internal code" /></div>
                <div className="form-group"><label>Make</label><input required value={f.make} onChange={e=>sf({make:e.target.value})} placeholder="e.g. Toyota" /></div>
                <div className="form-group"><label>Model</label><input required value={f.model} onChange={e=>sf({model:e.target.value})} placeholder="e.g. Hilux" /></div>
                <div className="form-group"><label>Year</label><input type="number" value={f.year} onChange={e=>sf({year:e.target.value})} placeholder="e.g. 2020" /></div>
                <div className="form-group">
                  <label>Vehicle type</label>
                  <select value={f.vehicle_type} onChange={e=>sf({vehicle_type:e.target.value})}>
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Fuel tank capacity (L)</label><input type="number" value={f.tank_capacity_litres} onChange={e=>sf({tank_capacity_litres:e.target.value})} placeholder="e.g. 80" /></div>
                <div className="form-group"><label>Current odometer (km)</label><input type="number" value={f.current_odometer_km} onChange={e=>sf({current_odometer_km:e.target.value})} placeholder="e.g. 12000" /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save vehicle'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Registration</th><th>Make / model</th><th>Type</th><th>Year</th><th>Odometer</th><th>Status</th></tr></thead>
            <tbody>
              {vehicles.length === 0 && <tr><td colSpan={6} style={{color:'var(--text-muted)',padding:'20px'}}>No vehicles yet.</td></tr>}
              {vehicles.map(v => (
                <tr key={v.id}>
                  <td style={{fontWeight:500}}>{v.registration}</td>
                  <td>{v.make} {v.model}</td>
                  <td>{v.vehicle_type}</td>
                  <td>{v.year || '—'}</td>
                  <td>{v.current_odometer_km ? `${Number(v.current_odometer_km).toLocaleString()} km` : '—'}</td>
                  <td><span className={`badge ${statusBadge(v.status)}`}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
