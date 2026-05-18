// Dashboard.jsx
// Main overview page
// Shows stats, chart, recent orders

import { useEffect } from 'react'
import useOrders from '../hooks/useOrders'
import useStatus from '../hooks/useStatus'
import StatCard from '../components/StatCard'
import OrdersTable from '../components/OrdersTable'
import ToastContainer from '../components/ToastContainer'

const Dashboard = ({ role, onPageChange }) => {

  // get orders data and functions from hook
  const {
    orders,
    loading,
    error,
    running,
    handleRunNow,
    handleRetryFailed,
    getStats
  } = useOrders()

  // get system status from hook
  const { systemOn, autoMsg } = useStatus()

  // tell App.jsx we are on dashboard
  useEffect(() => {
    onPageChange('dashboard')
  }, [onPageChange])

  // get stats for cards
  const stats = getStats()
  // run now button handler
  const handleRun = async () => {
    const result = await handleRunNow()
    if (result.success) {
      ToastContainer.addToast(result.message, 'success')
    } else {
      ToastContainer.addToast(result.message, 'error')
    }
  }

  // loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: '#7a8090',
        fontSize: '14px'
      }}>
        Loading orders...
      </div>
    )
  }
  return (
    // page wrapper
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
            margin: 0,
            fontSize: '22px',
            fontWeight: '700',
            letterSpacing: '-0.01em'
          }}>Operations overview</h1>
          <div style={{
            color: '#4b5160',
            fontSize: '13.5px',
            marginTop: '2px'
          }}>
            Live snapshot of order messaging and courier dispatch.
          </div>
        </div>

        {/* run now button - admin and manager only */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {(role === 'admin' || role === 'manager') && (
            <button
              onClick={handleRun}
              disabled={running}
              style={{
                height: '36px',
                padding: '0 14px',
                background: running ? '#7a8090' : '#128C7E',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '13px',
                cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'inherit'
              }}
            >
              {running ? '⏳ Running...' : '▶ Run now'}
            </button>
          )}
        </div>
      </div>
      {/* 4 stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '16px'
      }}>
        <StatCard
          label='Total orders'
          value={stats.total.toLocaleString('en-IN')}
          icon='📦'
          tone='green'
          delta='All 4 couriers'
          deltaDir='neutral'
        />
        <StatCard
          label='Sent today'
          value={stats.sent.toLocaleString('en-IN')}
          icon='✓'
          tone='blue'
          delta='WhatsApp delivered'
          deltaDir='up'
        />
        <StatCard
          label='Pending'
          value={stats.pending.toLocaleString('en-IN')}
          icon='⏰'
          tone='amber'
          delta='Not yet sent'
          deltaDir='neutral'
        />
        <StatCard
          label='Failed'
          value={stats.failed.toLocaleString('en-IN')}
          icon='⚠'
          tone='red'
          delta='Need retry'
          deltaDir='down'
        />
      </div>
      {/* chart and courier split row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2.4fr 1fr',
        gap: '16px',
        marginBottom: '16px'
      }}>

        {/* line chart card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e6e8ee',
          borderRadius: '14px',
          padding: '18px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px'
          }}>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700' }}>
              Message activity — last 7 days
            </h3>
            <span style={{ fontSize: '12px', color: '#7a8090' }}>
              Sent vs Failed
            </span>
          </div>

          {/* chart placeholder - will add chart later */}
          <div style={{
            height: '200px',
            background: '#f6f7f9',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7a8090',
            fontSize: '13px'
          }}>
            📊 Chart coming soon
          </div>
        </div>

        {/* courier split card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid #e6e8ee',
          borderRadius: '14px',
          padding: '18px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '14.5px', fontWeight: '700' }}>
            Courier split
          </h3>
          {/* recent orders table */}
          {/* courier bars */}
          {[
            { name: 'Anjani', pct: 42, color: '#25D366' },
            { name: 'DTDC',   pct: 28, color: '#2563eb' },
            { name: 'Maruti', pct: 18, color: '#7c3aed' },
            { name: 'Others', pct: 12, color: '#f59e0b' },
          ].map(c => (
            <div key={c.name} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '4px'
              }}>
                <span style={{ fontWeight: '600' }}>{c.name}</span>
                <span style={{ color: '#7a8090', fontFamily: 'JetBrains Mono, monospace' }}>
                  {c.pct}%
                </span>
              </div>
              <div style={{
                height: '8px',
                background: '#f3f4f7',
                borderRadius: '999px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${c.pct}%`,
                  background: c.color,
                  borderRadius: '999px'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* recent orders table */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #e6e8ee',
        borderRadius: '14px',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
      }}>
        {/* table header */}
        <div style={{
          padding: '16px 18px',
          borderBottom: '1px solid #e6e8ee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700' }}>
              Recent orders
            </h3>
            <div style={{ fontSize: '12px', color: '#7a8090', marginTop: '2px' }}>
              Latest activity across all couriers
            </div>
          </div>
          <button
            onClick={() => onPageChange('orders')}
            style={{
              height: '32px',
              padding: '0 12px',
              background: 'transparent',
              border: '1px solid #e6e8ee',
              borderRadius: '8px',
              fontSize: '12.5px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
              color: '#4b5160'
            }}
          >
            View all →
          </button>
        </div>

        {/* orders table - last 6 orders only */}
        <OrdersTable
          orders={orders.slice(0, 6)}
          showActions={false}
          onSend={() => {}}
          onRetry={() => {}}
        />
      </div>

    </div>
  )
}

export default Dashboard