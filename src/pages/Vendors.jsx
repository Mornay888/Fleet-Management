import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function Vendors() {
  const { profile } = useAuth()
  const [vendors, setVendors] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name:'', contact_person:'', phone:'', email:'', vat_number:'', payment_terms:'30 days' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('vendors').select('*').order('name')
    setVendors(data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const { error } = await supabase.from('vendors').insert({ ...form, company_id: profile.company_id })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ name:'', contact_person:'', phone:'', email:'', vat_number:'', payment_terms:'30 days' })
    load()
  }

  const f = form; const sf = v => setForm({...form,...v})

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Vendors</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'Add vendor'}
          </button>
        </div>
      </div>
      <div className="content">
        {showForm && (
          <div className="card form-max">
            <div className="card-title">Add vendor</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group"><label>Company name</label><input required value={f.name} onChange={e=>sf({name:e.target.value})} placeholder="e.g. Sasol" /></div>
                <div className="form-group"><label>Contact person</label><input value={f.contact_person} onChange={e=>sf({contact_person:e.target.value})} /></div>
                <div className="form-group"><label>Phone</label><input value={f.phone} onChange={e=>sf({phone:e.target.value})} /></div>
                <div className="form-group"><label>Email</label><input type="email" value={f.email} onChange={e=>sf({email:e.target.value})} /></div>
                <div className="form-group"><label>VAT number</label><input value={f.vat_number} onChange={e=>sf({vat_number:e.target.value})} /></div>
                <div className="form-group">
                  <label>Payment terms</label>
                  <select value={f.payment_terms} onChange={e=>sf({payment_terms:e.target.value})}>
                    <option>COD</option><option>7 days</option><option>30 days</option><option>60 days</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Saving…' : 'Save vendor'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Payment terms</th><th>Status</th></tr></thead>
            <tbody>
              {vendors.length === 0 && <tr><td colSpan={6} style={{color:'var(--text-muted)',padding:'20px'}}>No vendors yet.</td></tr>}
              {vendors.map(v => (
                <tr key={v.id}>
                  <td style={{fontWeight:500}}>{v.name}</td>
                  <td>{v.contact_person || '—'}</td>
                  <td>{v.phone || '—'}</td>
                  <td>{v.email || '—'}</td>
                  <td>{v.payment_terms}</td>
                  <td><span className={`badge ${v.status === 'active' ? 'badge-ok' : 'badge-warn'}`}>{v.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}
