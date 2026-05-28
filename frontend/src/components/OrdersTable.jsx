 // OrdersTable.jsx
// Shows orders in a table format
// Used in Dashboard and Orders page

import { useState } from 'react'
import StatusBadge from './StatusBadge'
import { formatPhone, truncate } from '../utils/formatters'

const OrdersTable = ({ orders, showActions, onSend, onRetry }) => {
  // track which order is open in view modal
  const [viewOrder, setViewOrder] = useState(null)

  // showActions = false on dashboard (just view)
  // showActions = true on orders page (send/retry)

  return (
    // outer wrapper with rounded border
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6e8ee',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
    }}>
        {/* table element */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>

        {/* header row */}
        <thead>
          <tr>
            {/* column headers */}
            {['Order ID','Customer','Phone','Courier','Tracking ID','Tracking Link','Msg Status',
              ...(showActions ? ['Action'] : [])
            ].map(col => (
              <th key={col} style={{
                padding: '12px 16px',
                textAlign: 'left',
                background: '#eef0f4',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#4b5160',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderBottom: '1px solid #e6e8ee'
              }}>
                {col}
              </th>
            ))}
          </tr>
        </thead>
        {/* table body - loops through orders */}
        <tbody>
          {orders.length === 0 ? (

            // empty state - no orders found
            <tr>
              <td colSpan={showActions ? 8 : 7}
                style={{ padding: '36px', textAlign: 'center', color: '#7a8090' }}>
                No orders found
              </td>
            </tr>

          ) : orders.map((order, index) => (

            // one row per order
            <tr key={order.id || index} style={{
              borderBottom: '1px solid #e6e8ee'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,17,23,0.025)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {/* order id - green monospace */}
              <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace',
                fontSize: '13px', color: '#128C7E', fontWeight: '600' }}>
                {order.order_id}
              </td>

              {/* customer name */}
              <td style={{ padding: '12px 16px', fontSize: '13.5px' }}>
                {order.customer_name}
              </td>

              {/* phone number - formatted */}
              <td style={{ padding: '12px 16px', fontSize: '12px',
                color: '#4b5160', fontFamily: 'JetBrains Mono, monospace' }}>
                {formatPhone(order.phone)}
              </td>

              {/* courier name */}
              {/* courier name */}
              <td style={{ padding: '12px 16px', fontSize: '13.5px' }}>
                {order.courier}
              </td>

              {/* tracking id */}
              <td style={{ padding: '12px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#4b5160' }}>
                {order.tracking_id || '—'}
              </td>

              {/* tracking link */}
              <td style={{ padding: '12px 16px' }}>
                {order.tracking_link ? (
                  <a href={order.tracking_link} target="_blank" rel="noreferrer"
                    style={{ color: '#128C7E', fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace' }}>
                    Track ↗
                  </a>
                ) : '—'}
              </td>

              {/* message sent status badge */}
              <td style={{ padding: '12px 16px' }}>
                <StatusBadge status={
                  order.msg_sent === 'YES' ? 'Sent' :
                  order.msg_sent === 'FAILED' ? 'Failed' :
                  'Pending'
                } />
              </td>

              {/* action buttons - only if showActions true */}
              {/* action buttons - only if showActions true */}
              {showActions && (
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
{/* send button - only for NO */}
                    {order.msg_sent?.toUpperCase() === 'NO' && (
                      <button
                        onClick={() => onSend(order)}
                        style={{
                          width: '30px', height: '30px',
                          borderRadius: '7px',
                          background: 'rgba(18,140,126,0.1)',
                          border: '1px solid rgba(18,140,126,0.22)',
                          color: '#128C7E',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                        title="Send message"
                      >✉</button>
                    )}

                    {/* retry button - only for FAILED */}
                    {order.msg_sent?.toUpperCase() === 'FAILED' && (
                      <button
                        onClick={() => onRetry(order)}
                        style={{
                          width: '30px', height: '30px',
                          borderRadius: '7px',
                          background: 'rgba(245,158,11,0.1)',
                          border: '1px solid rgba(245,158,11,0.22)',
                          color: '#b8770b',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                        title="Retry"
                      >↺</button>
                    )}

                    {/* view button - always show */}
                    <button
                      onClick={() => setViewOrder(order)}
                      style={{
                        width: '30px', height: '30px',
                        borderRadius: '7px',
                        background: 'rgba(37,99,235,0.1)',
                        border: '1px solid rgba(37,99,235,0.22)',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                      title="View details"
                    >👁</button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {/* view order modal */}
      {viewOrder && (
        <div
          onClick={() => setViewOrder(null)}
          style={{
            position: 'fixed', top: 0, left: 0,
            width: '100vw', height: '100vh',
            background: 'rgba(15,17,23,0.5)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 1000
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '28px',
              width: '420px',
              boxShadow: '0 20px 60px rgba(15,17,23,0.2)'
            }}
          >
            {/* modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Order Details</h3>
              <button
                onClick={() => setViewOrder(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7a8090' }}
              >×</button>
            </div>

            {/* order details */}
            {[
              { label: 'Order ID', value: viewOrder.order_id },
              { label: 'Customer', value: viewOrder.customer_name },
              { label: 'Phone', value: formatPhone(viewOrder.phone) },
              { label: 'Courier', value: viewOrder.courier },
              { label: 'Tracking ID', value: viewOrder.tracking_id || '—' },
              { label: 'Last Updated', value: viewOrder.last_updated || '—' },
            ].map(item => (
              <div key={item.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '10px 0', borderBottom: '1px solid #e6e8ee',
                fontSize: '13.5px'
              }}>
                <span style={{ color: '#7a8090', fontWeight: '500' }}>{item.label}</span>
                <span style={{ fontWeight: '600', fontFamily: item.label === 'Order ID' || item.label === 'Tracking ID' || item.label === 'Phone' ? 'JetBrains Mono, monospace' : 'inherit' }}>{item.value}</span>
              </div>
            ))}

            {/* tracking link */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #e6e8ee', fontSize: '13.5px' }}>
              <span style={{ color: '#7a8090', fontWeight: '500' }}>Tracking Link</span>
              {viewOrder.tracking_link ? (
                <a href={viewOrder.tracking_link} target="_blank" rel="noreferrer" style={{ color: '#128C7E', fontWeight: '600' }}>Open ↗</a>
              ) : <span>—</span>}
            </div>

            {/* msg status */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '13.5px' }}>
              <span style={{ color: '#7a8090', fontWeight: '500' }}>Message Status</span>
              <StatusBadge status={
                viewOrder.msg_sent === 'YES' ? 'Sent' :
                viewOrder.msg_sent === 'FAILED' ? 'Failed' :
                'Pending'
              } />
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersTable
