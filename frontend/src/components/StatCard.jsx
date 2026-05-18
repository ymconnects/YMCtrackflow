 // StatCard.jsx
// Shows one stat box on dashboard
// Used 4 times on dashboard page

const StatCard = ({ label, value, icon, tone, delta, deltaDir }) => {

  // color map based on tone prop
  // tone = 'green' / 'blue' / 'amber' / 'red'
  const toneColors = {
    green: { bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
    blue:  { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
    amber: { bg: 'rgba(245,158,11,0.16)', color: '#b8770b' },
    red:   { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
  }

  // pick correct color or default to grey
  const t = toneColors[tone] || { bg: '#f3f4f7', color: '#4b5160' }
  return (
    // outer card container
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6e8ee',
      borderRadius: '14px',
      padding: '18px',
      boxShadow: '0 1px 2px rgba(15,17,23,0.04), 0 6px 18px rgba(15,17,23,0.06)'
    }}>

      {/* top row - icon on left, sparkline on right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

        {/* colored icon box */}
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: t.bg,
          color: t.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px'
        }}>
          {icon}
        </div>

        {/* small sparkline graphic */}
        <svg width="60" height="20" viewBox="0 0 60 20" fill="none"
          stroke={t.color} strokeWidth="1.5" opacity="0.6">
          <path d="M0 14 L10 12 L20 15 L30 8 L40 10 L50 4 L60 6"/>
        </svg>
      </div>
      {/* label text - small grey text */}
      <div style={{
        color: '#4b5160',
        fontSize: '12.5px',
        fontWeight: '600',
        marginTop: '14px'
      }}>
        {label}
      </div>

      {/* big number value */}
      <div style={{
        fontSize: '28px',
        fontWeight: '700',
        letterSpacing: '-0.02em',
        marginTop: '2px',
        fontFamily: 'JetBrains Mono, monospace'
      }}>
        {value}
      </div>

      {/* delta - change indicator */}
      <div style={{
        fontSize: '11.5px',
        marginTop: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        color: deltaDir === 'up' ? '#128C7E' :
               deltaDir === 'down' ? '#dc2626' : '#7a8090'
      }}>
        {/* arrow based on direction */}
        {deltaDir === 'up'   && <span>↑</span>}
        {deltaDir === 'down' && <span>↓</span>}
        {delta}
      </div>

    </div>
  )
}

export default StatCard
