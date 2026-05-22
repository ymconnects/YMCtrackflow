 // OrdersTable.jsx
// Shows orders in a table format
// Used in Dashboard and Orders page

import StatusBadge from './StatusBadge'
import { formatPhone, truncate } from '../utils/formatters'

const OrdersTable = ({ orders, showActions, onSend, onRetry }) => {

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
            {['Order ID','Customer','Phone','Courier','Status','Tracking','Msg Sent',
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

              {/* order status */}
              <td style={{ padding: '12px 16px' }}>
                <StatusBadge status={order.status || 'Shipped'} />
              </td>

              {/* tracking link */}
              <td style={{ padding: '12px 16px' }}>
                {order.tracking_link ? (
                  <a href={order.tracking_link} target="_blank" rel="noreferrer"
                    style={{ color: '#128C7E', fontSize: '12px',
                      fontFamily: 'JetBrains Mono, monospace' }}>
                    Track ↗
                  </a>
                ) : order.tracking_id ? (
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#4b5160' }}>
                    {order.tracking_id}
                  </span>
                ) : '—'}
              </td>

              {/* message sent status badge */}
              <td style={{ padding: '12px 16px' }}>
                <StatusBadge status={order.msg_sent || 'NO'} />
              </td>

              {/* action buttons - only if showActions true */}
              {/* action buttons - only if showActions true */}
              {showActions && (
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>

                    {/* send button - only for pending orders */}
                    {order.msg_sent === 'NO' && (
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

                    {/* retry button - for sent or failed orders */}
                    {(order.msg_sent === 'YES' || order.msg_sent === 'FAILED') && (
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
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default OrdersTable
