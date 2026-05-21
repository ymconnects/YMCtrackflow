// Logs.jsx
// Shows system and campaign logs
// Admin sees all
// Manager/Viewer sees order logs only
// Campaigner sees campaign logs only

import { useEffect } from 'react'
import useLogs from '../hooks/useLogs'
import { Download, RefreshCw } from 'lucide-react'

const Logs = ({ role, onPageChange }) => {

  // get logs from hook
  const {
    logs,
    loading,
    filter,
    fetchLogs,
    getFilteredLogs,
    handleFilterChange,
    exportLogs
  } = useLogs()

  // tell App.jsx we are on logs page
  useEffect(() => {
    onPageChange('logs')
  }, [onPageChange])

  // get filtered logs based on role
  const filteredLogs = getFilteredLogs(role)

  // level badge styles
  const getLevelStyle = (level) => {
    const styles = {
      'SUCCESS':  { bg: 'rgba(18,140,126,0.1)',  color: '#128C7E' },
      'FAILED':   { bg: 'rgba(220,38,38,0.1)',   color: '#dc2626' },
      'SYSTEM':   { bg: 'rgba(37,99,235,0.1)',   color: '#2563eb' },
      'CAMPAIGN': { bg: 'rgba(124,58,237,0.1)',  color: '#7c3aed' },
    }
    return styles[level] || { bg: '#f3f4f7', color: '#4b5160' }
  }

  // loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '400px',
        color: '#7a8090', fontSize: '14px'
      }}>
        Loading logs...
      </div>
    )
  }

  return (
    <div>

      {/* page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: '22px',
            fontWeight: '700', letterSpacing: '-0.01em',
            textAlign: 'left'
          }}>Logs</h1>
          <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px', textAlign: 'left' }}>
            {role === 'admin'
              ? 'All system logs — orders, campaigns, system events'
              : role === 'campaigner'
              ? 'Campaign logs only'
              : 'Order logs only'}
          </div>
        </div>

        {/* action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={fetchLogs}
            style={{
              height: '36px', padding: '0 14px',
              background: 'transparent',
              border: '1px solid #e6e8ee',
              borderRadius: '8px', fontWeight: '600',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: '6px', fontFamily: 'inherit', color: '#4b5160'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => exportLogs(role)}
            style={{
              height: '36px', padding: '0 14px',
              background: 'transparent',
              border: '1px solid #e6e8ee',
              borderRadius: '8px', fontWeight: '600',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: '6px', fontFamily: 'inherit', color: '#4b5160'
            }}
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* filter row */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        {/* filter buttons */}
        {['all', 'SUCCESS', 'FAILED', 'SYSTEM', 'CAMPAIGN'].map(f => {
          // hide system and campaign filters for non-admin
          if (f === 'SYSTEM' && role !== 'admin') return null
          if (f === 'CAMPAIGN' && role === 'manager') return null
          if (f === 'CAMPAIGN' && role === 'viewer') return null

          const s = getLevelStyle(f)
          const isActive = filter === f

          return (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              style={{
                height: '32px', padding: '0 12px',
                borderRadius: '8px', fontSize: '12px',
                fontWeight: '600', cursor: 'pointer',
                fontFamily: 'inherit',
                background: isActive ? s.bg : 'transparent',
                color: isActive ? s.color : '#7a8090',
                border: isActive
                  ? `1px solid ${s.color}40`
                  : '1px solid #e6e8ee'
              }}
            >
              {f === 'all' ? 'All' : f}
            </button>
          )
        })}

        {/* log count */}
        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#7a8090' }}>
          {filteredLogs.length} logs
        </span>
      </div>

      {/* logs table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e6e8ee',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
      }}>
        {filteredLogs.length === 0 ? (
          <div style={{
            padding: '48px',
            textAlign: 'center',
            color: '#7a8090',
            fontSize: '13px'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>📋</div>
            No logs found
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Time', 'Level', 'Order / Campaign', 'Customer', 'Courier', 'Detail'].map(col => (
                  <th key={col} style={{
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: '#eef0f4',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#4b5160',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e6e8ee'
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => {
                const s = getLevelStyle(log.level)
                return (
                  <tr key={index} style={{ borderBottom: '1px solid #f3f4f7' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,17,23,0.02)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    {/* time */}
                    <td style={{
                      padding: '10px 16px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11.5px', color: '#7a8090'
                    }}>
                      {log.time || '—'}
                    </td>

                    {/* level badge */}
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: '4px',
                        fontSize: '10.5px', fontWeight: '700',
                        background: s.bg, color: s.color
                      }}>{log.level}</span>
                    </td>

                    {/* order/campaign id */}
                    <td style={{
                      padding: '10px 16px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '12px',
                      color: log.level === 'CAMPAIGN' ? '#7c3aed' :
                             log.level === 'SYSTEM' ? '#2563eb' : '#128C7E'
                    }}>
                      {log.order_id || log.campaign_id || '—'}
                    </td>

                    {/* customer */}
                    <td style={{ padding: '10px 16px', fontSize: '13px' }}>
                      {log.customer || <span style={{ color: '#7a8090' }}>—</span>}
                    </td>

                    {/* courier */}
                    <td style={{ padding: '10px 16px', fontSize: '13px' }}>
                      {log.courier || <span style={{ color: '#7a8090' }}>—</span>}
                    </td>

                    {/* detail message */}
                    <td style={{ padding: '10px 16px', fontSize: '12.5px', color: '#7a8090' }}>
                      {log.message || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}

export default Logs