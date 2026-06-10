const StatusBadge = ({ status }) => {
  const map = {
    'YES':       { label: 'Sent',      bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'SENT':      { label: 'Sent',      bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'DELIVERED': { label: 'Delivered', bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'NO':        { label: 'Pending',   bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    'FAILED':    { label: 'Failed',    bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
    'Sent':      { label: 'Sent',      bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'Pending':   { label: 'Pending',   bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    'Delivered': { label: 'Delivered', bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'Running':   { label: 'Running',   bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'Scheduled': { label: 'Scheduled', bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'Completed': { label: 'Completed', bg: 'rgba(148,163,184,0.2)', color: '#4b5160' },
    'Paused':    { label: 'Paused',    bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    'SUCCESS':   { label: 'Success',   bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    'SYSTEM':    { label: 'System',    bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    'CAMPAIGN':  { label: 'Campaign',  bg: 'rgba(124,58,237,0.1)',  color: '#7c3aed' },
  }

  const s = map[status] || { label: status, bg: 'rgba(148,163,184,0.2)', color: '#4b5160' }

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
      {s.label}
    </span>
  )
}

export default StatusBadge