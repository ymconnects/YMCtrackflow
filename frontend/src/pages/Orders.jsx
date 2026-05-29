// Orders.jsx
// Shows all orders from Google Sheets
// Admin and Manager can send/retry
// Viewer can only view

import { useEffect, useState } from 'react'
import useOrders from '../hooks/useOrders'
import OrdersTable from '../components/OrdersTable'
import ToastContainer from '../components/ToastContainer'
import { Bot, RefreshCw, RotateCcw } from 'lucide-react'
import { getOrders, runNow, retryFailed, syncOrders, retrySingle } from '../utils/api'

const Orders = ({ role, onPageChange, onOrdersLoad }) => {

  // get orders and functions from hook
  const {
    orders,
    loading,
    running,
    fetchOrders,
    handleSync,
    handleRunNow,
    handleRetryFailed
  } = useOrders()

  // search and filter state
  const [search, setSearch] = useState('')
  const [courierFilter, setCourierFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 20
  const [syncHover, setSyncHover] = useState(false)
  const [retryHover, setRetryHover] = useState(false) 
  const [runHover, setRunHover] = useState(false)

  // tell App.jsx we are on orders page
  useEffect(() => {
    onPageChange('orders')
  }, [onPageChange])
  useEffect(() => {
    if (orders.length > 0 && onOrdersLoad) {
      console.log('orders count:', orders.length)
      onOrdersLoad(orders.length)
    }
  }, [orders])
  // filter orders based on search and filters
  const filteredOrders = orders.filter(order => {
    // search filter
    const matchSearch = search === '' ||
      order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.order_id?.toLowerCase().includes(search.toLowerCase()) ||
      order.phone?.includes(search)

    // courier filter
    const matchCourier = courierFilter === 'all' ||
      order.courier?.toUpperCase() === courierFilter.toUpperCase()

    // status filter
    const matchStatus = statusFilter === 'all' ||
      order.msg_sent?.toUpperCase() === statusFilter.toUpperCase()

    return matchSearch && matchCourier && matchStatus
  })
  // pagination logic
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage)
  const startIndex = (currentPage - 1) * ordersPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ordersPerPage)

  // handle send single order
  const handleSend = async (order) => {
    ToastContainer.addToast(`Sending to ${order.customer_name}...`, 'info')
    const result = await retrySingle(order)
    if (result.data.success) {
      ToastContainer.addToast(`Sent to ${order.customer_name} ✓`, 'success')
      fetchOrders()
    } else {
      ToastContainer.addToast(`Failed: ${result.data.message}`, 'error')
    }
  }

  // handle retry single order
  const handleRetry = async (order) => {
    ToastContainer.addToast(`Retrying ${order.customer_name}...`, 'info')
    const result = await retrySingle(order)
    if (result.data.success) {
      ToastContainer.addToast(`Sent to ${order.customer_name} ✓`, 'success')
      fetchOrders()
    } else {
      ToastContainer.addToast(`Failed: ${result.data.message}`, 'error')
    }
  }

  // handle run now
  const handleRun = async () => {
    const result = await handleRunNow()
    if (result.success) {
      ToastContainer.addToast(result.message, 'success')
    } else {
      ToastContainer.addToast(result.message, 'error')
    }
  }
  // handle retry all failed
  const handleRetryAll = async () => {
    const result = await handleRetryFailed()
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
            letterSpacing: '-0.01em',
            textAlign: 'left'
          }}>Orders</h1>
          <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px' }}>
            {role === 'viewer'
              ? 'Read only access — viewing all order activity.'
              : 'Send tracking messages and retry failed deliveries.'}
          </div>
        </div>

        {/* action buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={async () => {
              const result = await handleSync()
              if (result.success) {
                ToastContainer.addToast('Sheet synced ✓', 'success')
              } else {
                ToastContainer.addToast('Sync failed', 'error')
              }
            }}
            onMouseEnter={() => setSyncHover(true)}
            onMouseLeave={() => setSyncHover(false)}
            style={{
              height: '36px', padding: '0 14px',
              background: syncHover ? '#8bae7b' : 'transparent',
              border: syncHover ? '1px solid #c0c4ce' : '1px solid #e6e8ee',
              borderRadius: '8px', fontWeight: '600',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: '6px', fontFamily: 'inherit', color: '#4b5160',
              transition: 'all 0.15s ease',
              transform: syncHover ? 'translateY(-1px)' : 'none'
            }}
          >
            <RefreshCw size={14} /> Sync sheet
          </button>

          {/* retry failed - admin and manager only */}
          {(role === 'admin' || role === 'manager') && (
            <>
            <button
              onClick={handleRetryAll}
              disabled={running}
              onMouseEnter={() => setRetryHover(true)}
              onMouseLeave={() => setRetryHover(false)}
              style={{
                height: '36px', padding: '0 14px',
                background: retryHover ? 'rgba(220,38,38,0.16)' : 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.25)',
                borderRadius: '8px', fontWeight: '600',
                fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                gap: '6px', fontFamily: 'inherit', color: '#dc2626',
                transition: 'all 0.15s ease',
                transform: retryHover ? 'translateY(-1px)' : 'none'
              }}
            >
              <RotateCcw size={14} /> Retry failed
            </button>
            
            <button
              onClick={handleRun}
              disabled={running}
              onMouseEnter={() => setRunHover(true)}
              onMouseLeave={() => setRunHover(false)}
              style={{
                height: '36px', padding: '0 14px',
                background: running ? '#7a8090' : runHover ? '#0e7268' : '#128C7E',
                border: 'none',
                borderRadius: '8px', fontWeight: '600',
                fontSize: '13px', cursor: running ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                gap: '6px', fontFamily: 'inherit', color: '#ffffff',
                transition: 'all 0.15s ease',
                transform: !running && runHover ? 'translateY(-1px)' : 'none'
              }}
                  
>
              ▶ Run now
              </button>
              </>
 
          )}
        </div>
      </div>
      {/* filters row */}
      <div style={{
        display: 'flex',
        gap: '10px',
        alignItems: 'center',
        marginBottom: '16px',
      }}>

        {/* search input */}
        <div style={{ position: 'relative', width: '420px', flexShrink: 0 }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: '#7a8090', fontSize: '14px'
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by orders ID , customer name, Phone number...'
            style={{
              width: '100%', height: '38px',
              padding: '0 12px 0 36px',
              background: '#ffffff',
              border: '1px solid #e6e8ee',
              borderRadius: '10px', color: '#0f1117',
              fontFamily: 'inherit', fontSize: '13px',
              outline: 'none', boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = '#128C7E'}
            onBlur={e => e.target.style.borderColor = '#e6e8ee'}
          />
        </div>

        {/* courier filter */}
        <select
          value={courierFilter}
          onChange={e => setCourierFilter(e.target.value)}
          style={{
            height: '38px', padding: '0 12px',
            border: '1px solid #e6e8ee',
            background: '#ffffff',
            borderRadius: '10px', color: '#0f1117',
            fontFamily: 'inherit', fontSize: '13px',
            cursor: 'pointer', outline: 'none',
            flexShrink: 0
          }}
        >
          <option value='all'>All couriers</option>
          <option value='Anjani'>Anjani</option>
          <option value='DTDC'>DTDC</option>
          <option value='Maruti'>Maruti</option>
          <option value='Others'>Others</option>
        </select>

        {/* status filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{
            height: '38px', padding: '0 12px',
            border: '1px solid #e6e8ee',
            background: '#ffffff',
            borderRadius: '10px', color: '#0f1117',
            fontFamily: 'inherit', fontSize: '13px',
            cursor: 'pointer', outline: 'none',
            flexShrink: 0
          }}
        >
          <option value='all'>All statuses</option>
          <option value='YES'>Sent</option>
          <option value='NO'>Pending</option>
          <option value='FAILED'>Failed</option>
        </select>

        {/* order count */}
        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#7a8090' }}>
          {filteredOrders.length} orders
        </span>
      </div>
      {/* orders table */}
      <OrdersTable
        orders={paginatedOrders}
        showActions={role === 'admin' || role === 'manager'}
        onSend={handleSend}
        onRetry={handleRetry}
      />
    {/* pagination */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
        <span style={{ fontSize: '12.5px', color: '#7a8090' }}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e6e8ee', background: '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: '#4b5160' }}
        >‹</button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e6e8ee', background: currentPage === page ? '#128C7E' : '#fff', color: currentPage === page ? '#fff' : '#4b5160', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >{page}</button>
        ))}
        <button
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e6e8ee', background: '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: '#4b5160' }}
        >›</button>
      </div> 
    </div>
  )
}

export default Orders