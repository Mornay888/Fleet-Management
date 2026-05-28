import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Drivers() {
  const { profile } = useAuth()
  const [drivers, setDrivers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name:'', gender:'', date_of_birth:'', id_number:'', licence_number:'', licence_code:'', licence_expiry:'', phone:'', email:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('drivers').select('*').order('full_name')
    setDrivers(data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('drivers').insert({ ...form, company_id: profile.company_id })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ full_name:'', gender:'', date_of_birth:'', id_number:'', licence_number:'', licence_code:'', licence_expiry:'', phone:'', email:'' })
    load()
  }

  const f = form; const sf = v => setForm({...form,...v})

  function licenceBadge(expiry) {
    if (!expiry) return { cls:'badge-gray', label:'No licence' }
    const days = Math.floor((new Date(expiry) - new Date()) / 86400000)
    if (days < 0) return { cls:'badge-danger', label:'Expired' }
    if (days <= 60) return { cls:'badge-warn', label:`Expires in ${days}d` }
    return { cls:'badge-ok', label:'Valid' }
  }

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Drivers</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Add driver'}
          </button>
        </div>
      </div>
      <div className="content">

        {showForm && (
          <div className="card form-max">
            <div className="card-title">Add driver</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Full name</label><input required value={f.full_name} onChange={e=>sf({full_name:e.target.value})} placeholder="e.g. Dawie Fourie" /></div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={f.gender} onChange={e=>sf({gender:e.target.value})}>
                    <option value="">Select…</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group"><label>Date of birth</label><input type="date" value={f.date_of_birth} onChange={e=>sf({date_of_birth:e.target.value})} /></div>
                <div className="form-group"><label>ID number</label><input value={f.id_number} onChange={e=>sf({id_number:e.target.value})} /></div>
                <div className="form-group"><label>Licence number</label><input value={f.licence_number} onChange={e=>sf({licence_number:e.target.value})} /></div>
                <div className="form-group">
                  <label>Licence code</label>
                  <select value={f.licence_code} onChange={e=>sf({licence_code:e.target.value})}>
                    <option value="">Select…</option>
                    <option>A</option><option>B</option><option>C1</option><option>C</option><option>EB</option><option>EC1</option><option>EC</option>
                  </select>
                </div>
                <div className="form-group"><label>Licence expiry</label><input type="date" value={f.licence_expiry} onChange={e=>sf({licence_expiry:e.target.value})} /></div>
                <div className="form-group"><label>Phone</label><input value={f.phone} onChange={e=>sf({phone:e.target.value})} /></div>
                <div className="form-group"><label>Email (optional)</label><input type="email" value={f.email} onChange={e=>sf({email:e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save driver'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Gender</th><th>Licence no.</th><th>Code</th><th>Expiry</th><th>Phone</th><th>Status</th></tr></thead>
            <tbody>
              {drivers.length === 0 && <tr><td colSpan={7} style={{color:'var(--text-muted)',padding:'20px'}}>No drivers yet.</td></tr>}
              {drivers.map(d => {
                const lb = licenceBadge(d.licence_expiry)
                return (
                  <tr key={d.id}>
                    <td style={{fontWeight:500}}>{d.full_name}</td>
                    <td>{d.gender || '—'}</td>
                    <td>{d.licence_number || '—'}</td>
                    <td>{d.licence_code || '—'}</td>
                    <td>{d.licence_expiry ? new Date(d.licence_expiry).toLocaleDateString('en-ZA') : '—'}</td>
                    <td>{d.phone || '—'}</td>
                    <td><span className={`badge ${lb.cls}`}>{lb.label}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
