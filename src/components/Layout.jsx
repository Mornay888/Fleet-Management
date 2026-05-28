import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const initials = name => name ? name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() : '?'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const company = profile?.companies?.name || 'No company'

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="app-name"><i className="ti ti-fuel" /> FuelTrack Pro</div>
          <div className="app-sub">Fleet & fuel management</div>
        </div>
        <div className="company-pill">
          <i className="ti ti-building" style={{fontSize:13}} />
          {company}
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-label">Overview</div>
            <NavLink to="/dashboard" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-dashboard" />Dashboard
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Fuel</div>
            <NavLink to="/tanks" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-tank" />Tanks
            </NavLink>
            <NavLink to="/purchase-orders" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-file-invoice" />Purchase orders
            </NavLink>
            <NavLink to="/vendors" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-building-store" />Vendors
            </NavLink>
            <NavLink to="/fuel-issues" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-droplet" />Fuel issues
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Fleet</div>
            <NavLink to="/vehicles" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-truck" />Vehicles
            </NavLink>
            <NavLink to="/drivers" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-id-badge" />Drivers
            </NavLink>
            <NavLink to="/daily-activity" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-clock-record" />Daily activity
            </NavLink>
          </div>

          <div className="nav-section">
            <div className="nav-label">Admin</div>
            <NavLink to="/activity-types" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-list" />Activity types
            </NavLink>
            <NavLink to="/users" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-users" />Users
            </NavLink>
            <NavLink to="/reports" className={({isActive}) => 'nav-item' + (isActive ? ' active' : '')}>
              <i className="ti ti-chart-bar" />Reports
            </NavLink>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="avatar">{initials(profile?.full_name)}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:12,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{profile?.full_name}</div>
            <div style={{fontSize:11,color:'var(--text-muted)'}}>{profile?.role}</div>
          </div>
          <button style={{border:'none',background:'none',padding:4,cursor:'pointer',color:'var(--text-muted)'}} onClick={handleSignOut} title="Sign out">
            <i className="ti ti-logout" style={{fontSize:16}} />
          </button>
        </div>
      </aside>

      <div className="main">{children}</div>
    </div>
  )
}
