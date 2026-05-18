 const StatusBadge = ({ status }) => {
  const styles = {
    'YES':       { bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'NO':        { bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    'FAILED':    { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
    'Sent':      { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'Pending':   { bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    'Delivered': { bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'Running':   { bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'Scheduled': { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'Completed': { bg: 'rgba(148,163,184,0.2)', color: '#4b5160' },
    'Paused':    { bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    'SUCCESS':   { bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'SYSTEM':    { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'CAMPAIGN':  { bg: 'rgba(124,58,237,0.1)',  color: '#7c3aed' },
  }

  const s = styles[status] || { 
    bg: 'rgba(148,163,184,0.2)', 
    color: '#4b5160' 
  }

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 9px',
      borderRadius: '999px',
      fontSize: '11.5px',
      fontWeight: '600',
      background: s.bg,
      color: s.color
    }}>
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: s.color,
        flexShrink: 0
      }}></span>
      {status}
    </span>
  )
}

export default StatusBadge
