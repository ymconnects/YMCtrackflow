// Dashboard.jsx
// Main overview page
// Shows stats, chart, recent orders

import { useEffect, useRef } from 'react'
import useOrders from '../hooks/useOrders'
import useStatus from '../hooks/useStatus'
import StatCard from '../components/StatCard'
import OrdersTable from '../components/OrdersTable'
import ToastContainer from '../components/ToastContainer'
import { Chart, registerables } from 'chart.js'
import { Package, Send, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
Chart.register(...registerables)

const Dashboard = ({ role, onPageChange }) => {

  // get orders data and functions from hook
  const {
    orders,
    loading,
    running,
    fetchOrders,
    handleRunNow,
    getStats
  } = useOrders()

  // get system status from hook
  const { systemOn, autoMsg } = useStatus()

  // chart references - must be before any return
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

  // tell App.jsx we are on dashboard
  useEffect(() => {
    onPageChange('dashboard')
  }, [onPageChange])

  // build chart when component loads
  useEffect(() => {
    if (!chartRef.current) return
    if (loading) return

    // destroy old chart if exists
    if (chartInstance.current) {
      chartInstance.current.destroy()
    }

    const ctx = chartRef.current.getContext('2d')

    // green gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 260)
    gradient.addColorStop(0, 'rgba(18,140,126,0.22)')
    gradient.addColorStop(1, 'rgba(18,140,126,0)')

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Sent',
            data: [186, 224, 198, 312, 287, 168, 242],
            borderColor: '#128C7E',
            backgroundColor: gradient,
            fill: true,
            tension: 0.4,
            borderWidth: 2.2,
            pointRadius: 3,
            pointBackgroundColor: '#128C7E',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          },
          {
            label: 'Failed',
            data: [12, 18, 8, 24, 16, 6, 14],
            borderColor: '#dc2626',
            backgroundColor: 'rgba(220,38,38,0)',
            fill: false,
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 3,
            pointBackgroundColor: '#dc2626',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(15,17,23,0.06)' },
            border: { display: false },
            ticks: { color: '#7a8090', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(15,17,23,0.06)' },
            border: { display: false },
            ticks: { color: '#7a8090', font: { size: 11 } },
            beginAtZero: true
          }
        }
      }
    })
  }, [loading])

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
            fontSize: '28px',
            fontWeight: '700',
            letterSpacing: '-0.01em',
            textAlign: 'left'
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
          <button
            onClick={fetchOrders}
            style={{
              height: '36px',
              padding: '0 14px',
              background: 'transparent',
              border: '1px solid #e6e8ee',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              color: '#4b5160'
            }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
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
          icon={<Package size={18} />}
          tone='green'
          delta='All 4 couriers'
          deltaDir='neutral'
        />
        <StatCard
          label='Sent today'
          value={stats.sent.toLocaleString('en-IN')}
          icon={<Send size={18} />}
          tone='blue'
          delta='WhatsApp delivered'
          deltaDir='up'
        />
        <StatCard
          label='Pending'
          value={stats.pending.toLocaleString('en-IN')}
          icon={<Clock size={18} />}
          tone='amber'
          delta='Not yet sent'
          deltaDir='neutral'
        />
        <StatCard
          label='Failed'
          value={stats.failed.toLocaleString('en-IN')}
          icon={<AlertTriangle size={18} />}
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
            <div>
              <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700' }}>
                Last 7 days — sent vs failed
              </h3>
              <div style={{ fontSize: '12px', color: '#7a8090', marginTop: '2px' }}>
                Hourly aggregation, all couriers
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4b5160' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#128C7E', display: 'inline-block' }}></span>
                Sent
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4b5160' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626', display: 'inline-block' }}></span>
                Failed
              </span>
            </div>
          </div>

          {/* real chart */}
          <div style={{ height: '260px', position: 'relative' }}>
            <canvas ref={chartRef} style={{ width: '100%', height: '100%' }}></canvas>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700' }}>
              Courier split
            </h3>
            <span style={{ fontSize: '12px', color: '#7a8090' }}>Last 30 days</span>
          </div>

          {/* courier bars */}
          {[
            { name: 'Anjani', pct: 42, color: '#25D366', count: '1,044' },
            { name: 'DTDC',   pct: 28, color: '#2563eb', count: '696'   },
            { name: 'Maruti', pct: 18, color: '#7c3aed', count: '448'   },
            { name: 'Others', pct: 12, color: '#f59e0b', count: '298'   },
          ].map(c => (
            <div key={c.name} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '13px',
                marginBottom: '4px'
              }}>
                <span style={{ fontWeight: '600' }}>{c.name}</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span style={{ color: '#7a8090', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                    {c.pct}%
                  </span>
                  <span style={{ color: '#7a8090', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}>
                    {c.count}
                  </span>
                </div>
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
          

          <div style={{
            borderTop: '1px dashed #e6e8ee',
            marginTop: '14px',
            paddingTop: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#7a8090'
          }}>
            <span>Total dispatched</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#0f1117', fontWeight: '600' }}>2,486</span>
          </div>

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
