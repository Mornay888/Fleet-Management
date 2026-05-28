import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import Layout from '../components/Layout'

export default function Users() {
  const [users, setUsers] = useState([])

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('full_name')
    setUsers(data || [])
  }

  const roleBadge = r => ({ super_admin:'badge-danger', admin:'badge-warn', site_manager:'badge-info', operator:'badge-gray' }[r] || 'badge-gray')

  return (
    <Layout>
      <div className="topbar">
        <div className="topbar-title">Users</div>
        <div className="topbar-actions">
          <span style={{fontSize:12,color:'var(--text-muted)'}}>New users sign up via the login page, then are assigned to a company in Supabase.</span>
        </div>
      </div>
      <div className="content">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Company</th><th>Status</th></tr></thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={4} style={{color:'var(--text-muted)',padding:'20px'}}>No users yet.</td></tr>}
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight:500}}>{u.full_name}</td>
                  <td><span className={`badge ${roleBadge(u.role)}`}>{u.role.replace('_',' ')}</span></td>
                  <td>{u.company_id || <span style={{color:'var(--text-muted)'}}>Unassigned</span>}</td>
                  <td><span className={`badge ${u.status === 'active' ? 'badge-ok' : 'badge-gray'}`}>{u.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{marginTop:16,maxWidth:540}}>
          <div className="card-title">Assigning a user to a company</div>
          <p style={{fontSize:13,color:'var(--text-muted)',lineHeight:1.6}}>After a user signs up, run this in the Supabase SQL editor:</p>
          <pre style={{background:'var(--bg)',padding:'10px 14px',borderRadius:8,fontSize:12,marginTop:10,overflowX:'auto'}}>
{`UPDATE profiles
SET company_id = 'a1000000-0000-0000-0000-000000000001',
    role = 'admin'
WHERE id = 'PASTE-USER-UUID-HERE';`}
          </pre>
        </div>
      </div>
    </Layout>
  )
}
