 import { useNavigate } from 'react-router-dom'
import { getInitials } from '../utils/formatters'

const Sidebar = ({ user, role, onLogout, currentPage, isAllowed }) => {
  const navigate = useNavigate()
  const navItems = [
    { label: 'Dashboard', page: 'dashboard', icon: '⊞' },
    { label: 'Orders',    page: 'orders',    icon: '📦' },
    { label: 'Campaigns', page: 'campaigns', icon: '📣' },
    { label: 'Templates', page: 'templates', icon: '💬' },
    { label: 'Logs',      page: 'logs',      icon: '📋' },
    { label: 'Settings',  page: 'settings',  icon: '⚙' },
  ]
  return (
    <aside style={{
      width: '240px',
      background: '#eef0f4',
      borderRight: '1px solid #e6e8ee',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0
    }}>

      <div style={{
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        borderBottom: '1px solid #e6e8ee'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '9px',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontSize: '16px'
        }}>✉</div>
        <div style={{
          fontWeight: '800',
          fontSize: '15px'
        }}>
          YMC<span style={{ color: '#128C7E' }}>TrackFlow</span>
        </div>
      </div>
      <nav style={{ padding: '14px 10px', flex: 1 }}>
        <div style={{
          fontSize: '10.5px',
          color: '#7a8090',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          padding: '14px 12px 6px'
        }}>Workspace</div>

        {navItems.filter(item => isAllowed(item.page)).map(item => (
          <div
            key={item.page}
            onClick={() => navigate('/' + item.page)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '11px',
              padding: '9px 12px',
              borderRadius: '8px',
              color: currentPage === item.page ? '#128C7E' : '#4b5160',
              background: currentPage === item.page ? 'rgba(18,140,126,0.10)' : 'transparent',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '13.5px',
              marginBottom: '2px'
            }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div style={{
        padding: '14px',
        borderTop: '1px solid #e6e8ee'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px',
          borderRadius: '10px',
          background: '#ffffff'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: '700',
            fontSize: '13px'
          }}>
            {getInitials(user)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '13px' }}>{user}</div>
            <div style={{ color: '#7a8090', fontSize: '11px' }}>{role}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#7a8090',
              fontSize: '16px',
              padding: '4px'
            }}
            title="Sign out"
          >↪</button>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
