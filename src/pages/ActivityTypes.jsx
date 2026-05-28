import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function ActivityTypes() {
  const { profile } = useAuth()
  const [types, setTypes] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', description:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('activity_types').select('*').order('name')
    setTypes(data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('activity_types').insert({ ...form, company_id: profile.company_id })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ name:'', description:'' })
    load()
  }

  async function toggle(id, current) {
    await supabase.from('activity_types').update({ is_active: !current }).eq('id', id)
    load()
  }

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Activity types</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Add activity type'}
          </button>
        </div>
      </div>
      <div className="content">
        {showForm && (
          <div className="card form-max">
            <div className="card-title">Add activity type</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Activity name</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Cattle movement" /></div>
                <div className="form-group"><label>Description (optional)</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Activity name</th><th>Description</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {types.length === 0 && <tr><td colSpan={4} style={{color:'var(--text-muted)',padding:'20px'}}>No activity types yet.</td></tr>}
              {types.map(t => (
                <tr key={t.id}>
                  <td style={{fontWeight:500}}>{t.name}</td>
                  <td>{t.description || '—'}</td>
                  <td><span className={`badge ${t.is_active ? 'badge-ok' : 'badge-gray'}`}>{t.is_active ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <button style={{fontSize:11,padding:'3px 8px'}} onClick={() => toggle(t.id, t.is_active)}>
                      {t.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
