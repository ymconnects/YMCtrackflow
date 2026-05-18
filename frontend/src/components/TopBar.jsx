 const TopBar = ({ 
  currentPage, 
  systemOn, 
  autoMsg, 
  onToggleSystem, 
  onToggleAutoMsg,
  role 
}) => {

  const pageTitles = {
    dashboard: 'Dashboard',
    orders:    'Orders',
    campaigns: 'Campaigns',
    templates: 'Templates',
    logs:      'Logs',
    settings:  'Settings'
  }
  return (
    <header style={{
      height: '60px',
      background: '#f6f7f9',
      borderBottom: '1px solid #e6e8ee',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'fixed',
      top: 0,
      left: '240px',
      right: 0,
      zIndex: 10
    }}>

      {/* left side - breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ color: '#7a8090', fontSize: '13.5px' }}>🏠</span>
        <span style={{ color: '#7a8090', fontSize: '13.5px' }}>/</span>
        <span style={{ fontWeight: '600', fontSize: '15px' }}>
          {pageTitles[currentPage]}
        </span>
      </div>

      {/* right side - system pill + run now */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

        {/* system on/off pill */}
        <div
          onClick={onToggleSystem}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '5px 12px',
            borderRadius: '999px',
            background: systemOn ? 'rgba(18,140,126,0.10)' : 'rgba(245,158,11,0.16)',
            border: systemOn ? '1px solid rgba(18,140,126,0.22)' : '1px solid rgba(184,119,11,0.28)',
            color: systemOn ? '#128C7E' : '#b8770b',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: systemOn ? '#25D366' : '#b8770b'
          }}></span>
          {systemOn ? 'System ON' : 'System OFF'}
        </div>

        
      </div>
    </header>
  )
}

export default TopBar