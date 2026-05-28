import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'

export default function PurchaseOrders() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [tanks, setTanks] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ vendor_id:'', tank_id:'', order_date:'', expected_delivery_date:'', quantity_ordered_litres:'', price_per_litre:'', reference_number:'', notes:'' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [oRes, vRes, tRes] = await Promise.all([
      supabase.from('purchase_orders').select('*, vendors(name), tanks(name)').order('created_at', { ascending: false }),
      supabase.from('vendors').select('id,name').eq('status','active').order('name'),
      supabase.from('tanks').select('id,name').eq('status','active').order('name'),
    ])
    setOrders(oRes.data || [])
    setVendors(vRes.data || [])
    setTanks(tRes.data || [])
  }

  async function save(e) {
    e.preventDefault(); setSaving(true); setError('')
    const nextNum = `PO-${String(orders.length + 1).padStart(4,'0')}`
    const { error } = await supabase.from('purchase_orders').insert({
      company_id: profile.company_id,
      vendor_id: form.vendor_id,
      tank_id: form.tank_id || null,
      po_number: nextNum,
      order_date: form.order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: form.expected_delivery_date || null,
      quantity_ordered_litres: Number(form.quantity_ordered_litres),
      price_per_litre: form.price_per_litre ? Number(form.price_per_litre) : null,
      reference_number: form.reference_number,
      notes: form.notes,
      created_by: profile.id,
    })
    setSaving(false)
    if (error) { setError(error.message); return }
    setShowForm(false)
    setForm({ vendor_id:'', tank_id:'', order_date:'', expected_delivery_date:'', quantity_ordered_litres:'', price_per_litre:'', reference_number:'', notes:'' })
    loadAll()
  }

  async function markReceived(order) {
    const qty = window.prompt(`Litres actually received for ${order.po_number}?`, order.quantity_ordered_litres)
    if (!qty) return
    await supabase.from('purchase_orders').update({
      status: 'received',
      quantity_received_litres: Number(qty),
      received_at: new Date().toISOString(),
    }).eq('id', order.id)
    loadAll()
  }

  const statusBadge = s => ({ pending:'badge-warn', in_transit:'badge-info', received:'badge-ok', overdue:'badge-danger', cancelled:'badge-gray' }[s] || 'badge-gray')
  const f = form; const sf = v => setForm({...form,...v})

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Purchase orders</div>
        <div className="topbar-actions">
          <button className="primary" onClick={() => setShowForm(!showForm)}>
            <i className="ti ti-plus" />{showForm ? 'Cancel' : 'New PO'}
          </button>
        </div>
      </div>
      <div className="content">
        {showForm && (
          <div className="card form-max">
            <div className="card-title">New purchase order</div>
            {error && <div className="error-msg">{error}</div>}
            <form onSubmit={save}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Vendor</label>
                  <select required value={f.vendor_id} onChange={e=>sf({vendor_id:e.target.value})}>
                    <option value="">Select vendor…</option>
                    {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Deliver into tank</label>
                  <select value={f.tank_id} onChange={e=>sf({tank_id:e.target.value})}>
                    <option value="">Select tank…</option>
                    {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Order date</label><input type="date" value={f.order_date} onChange={e=>sf({order_date:e.target.value})} /></div>
                <div className="form-group"><label>Expected delivery</label><input type="date" value={f.expected_delivery_date} onChange={e=>sf({expected_delivery_date:e.target.value})} /></div>
                <div className="form-group"><label>Quantity (litres)</label><input required type="number" value={f.quantity_ordered_litres} onChange={e=>sf({quantity_ordered_litres:e.target.value})} placeholder="e.g. 500" /></div>
                <div className="form-group"><label>Price per litre (R)</label><input type="number" step="0.01" value={f.price_per_litre} onChange={e=>sf({price_per_litre:e.target.value})} placeholder="e.g. 22.50" /></div>
                <div className="form-group"><label>Reference / delivery note</label><input value={f.reference_number} onChange={e=>sf({reference_number:e.target.value})} /></div>
                <div className="form-group"><label>Notes</label><input value={f.notes} onChange={e=>sf({notes:e.target.value})} /></div>
              </div>
              <div className="form-actions">
                <button type="submit" className="primary" disabled={saving}>{saving ? 'Creating…' : 'Create PO'}</button>
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        <div className="table-wrap">
          <table>
            <thead><tr><th>PO #</th><th>Vendor</th><th>Order date</th><th>Qty (L)</th><th>R/L</th><th>Tank</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={8} style={{color:'var(--text-muted)',padding:'20px'}}>No purchase orders yet.</td></tr>}
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{fontWeight:500}}>{o.po_number}</td>
                  <td>{o.vendors?.name}</td>
                  <td>{new Date(o.order_date).toLocaleDateString('en-ZA')}</td>
                  <td>{Number(o.quantity_ordered_litres).toLocaleString()}</td>
                  <td>{o.price_per_litre ? `R ${Number(o.price_per_litre).toFixed(2)}` : '—'}</td>
                  <td>{o.tanks?.name || '—'}</td>
                  <td><span className={`badge ${statusBadge(o.status)}`}>{o.status.replace('_',' ')}</span></td>
                  <td>
                    {o.status !== 'received' && o.status !== 'cancelled' && (
                      <button style={{fontSize:11,padding:'3px 8px'}} onClick={() => markReceived(o)}>
                        <i className="ti ti-check" />Receive
                      </button>
                    )}
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
