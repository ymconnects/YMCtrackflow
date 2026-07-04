 // OrdersTable.jsx
// Shows orders in a table format
// Used in Dashboard and Orders page
// pageName prop (e.g. "orders") enables drag-reorder + pin/freeze, persisted via column-settings API.
// Omit pageName (e.g. Dashboard's preview usage) to render plain, no drag/pin.

import { useState, useEffect, useRef } from 'react'
import StatusBadge from './StatusBadge'
import { formatPhone } from '../utils/formatters'
import { GripVertical, Pin, PinOff } from 'lucide-react'
import { getColumnSettings, saveColumnSettings } from '../utils/api'

const DEFAULT_COLUMN_ORDER = ['order_id', 'customer_name', 'phone', 'courier', 'tracking_id', 'tracking_link', 'msg_sent']

const COLUMN_DEFS = {
  order_id: {
    label: 'Order ID',
    render: (order) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#128C7E', fontWeight: '600' }}>
        {order.order_id || '—'}
      </span>
    )
  },
  customer_name: {
    label: 'Customer',
    render: (order) => <span style={{ fontSize: '13.5px' }}>{order.customer_name || '—'}</span>
  },
  phone: {
    label: 'Phone',
    render: (order) => (
      <span style={{ fontSize: '12px', color: '#4b5160', fontFamily: 'JetBrains Mono, monospace' }}>
        {formatPhone(order.phone) || '—'}
      </span>
    )
  },
  courier: {
    label: 'Courier',
    render: (order) => <span style={{ fontSize: '13.5px' }}>{order.courier || '—'}</span>
  },
  tracking_id: {
    label: 'Tracking ID',
    render: (order) => (
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#4b5160' }}>
        {order.tracking_id || '—'}
      </span>
    )
  },
  tracking_link: {
    label: 'Tracking Link',
    render: (order) => order.tracking_link ? (
      <a href={order.tracking_link} target="_blank" rel="noreferrer"
        style={{ color: '#128C7E', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
        Track ↗
      </a>
    ) : '—'
  },
  msg_sent: {
    label: 'Msg Status',
    render: (order) => <StatusBadge status={order.msg_sent} />
  }
}

const COLUMN_MIN_WIDTH = 120 // floor only - columns can grow wider based on content/available space
const ACTION_COLUMN_MIN_WIDTH = 140

const OrdersTable = ({ orders, showActions, onSend, onRetry, pageName }) => {
  // track which order is open in view modal
  const [viewOrder, setViewOrder] = useState(null)

  // column customization state (only meaningful when pageName is set)
  const [columnOrder, setColumnOrder] = useState(DEFAULT_COLUMN_ORDER)
  const [pinnedColumns, setPinnedColumns] = useState([])
  const [dragKey, setDragKey] = useState(null)
  const [hoveredRow, setHoveredRow] = useState(null)
  const [stickyLeft, setStickyLeft] = useState({})
  const pinnedThRefs = useRef({})

  // showActions = false on dashboard (just view)
  // showActions = true on orders page (send/retry)

  useEffect(() => {
    if (!pageName) return
    getColumnSettings(pageName)
      .then(res => {
        if (res.data.success) {
          const saved = res.data.column_order || []
          const merged = [
            ...saved.filter(k => DEFAULT_COLUMN_ORDER.includes(k)),
            ...DEFAULT_COLUMN_ORDER.filter(k => !saved.includes(k))
          ]
          setColumnOrder(merged.length ? merged : DEFAULT_COLUMN_ORDER)
          setPinnedColumns(res.data.pinned_columns || [])
        }
      })
      .catch(() => {})
  }, [pageName])

  const persist = (order, pinned) => {
    if (!pageName) return
    saveColumnSettings(pageName, order, pinned).catch(() => {})
  }

  const handleDrop = (targetKey) => {
    if (!dragKey || dragKey === targetKey) { setDragKey(null); return }
    const next = [...columnOrder]
    const from = next.indexOf(dragKey)
    const to = next.indexOf(targetKey)
    next.splice(from, 1)
    next.splice(to, 0, dragKey)
    setColumnOrder(next)
    persist(next, pinnedColumns)
    setDragKey(null)
  }

  const togglePin = (key) => {
    let next
    if (pinnedColumns.includes(key)) {
      next = pinnedColumns.filter(k => k !== key)
    } else {
      if (pinnedColumns.length >= 4) return
      next = [...pinnedColumns, key]
    }
    setPinnedColumns(next)
    persist(columnOrder, next)
  }

  // pinned columns float to the left edge (in their relative columnOrder), rest follow after
  const orderedKeys = [
    ...columnOrder.filter(k => pinnedColumns.includes(k)),
    ...columnOrder.filter(k => !pinnedColumns.includes(k))
  ]

  // measure real rendered widths of pinned headers so sticky offsets stay
  // accurate at any screen size, instead of assuming a fixed column width
  useEffect(() => {
    if (!pageName) return
    const measure = () => {
      const pinnedKeysInOrder = columnOrder.filter(k => pinnedColumns.includes(k))
      let cumulative = 0
      const next = {}
      pinnedKeysInOrder.forEach(k => {
        next[k] = cumulative
        const el = pinnedThRefs.current[k]
        cumulative += el ? el.offsetWidth : COLUMN_MIN_WIDTH
      })
      setStickyLeft(next)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [pageName, pinnedColumns, columnOrder, orders])

  return (
    // outer wrapper with rounded border
    <div style={{
      background: '#ffffff',
      border: '1px solid #e6e8ee',
      borderRadius: '14px',
      overflow: 'hidden',
      boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
    }}>
        {/* scrollable inner wrapper - both scrollbars, sticky header */}
      <div style={{ maxHeight: '600px', overflow: 'auto' }}>
      <table style={{
        width: '100%',
        minWidth: '900px',
        borderCollapse: 'separate',
        borderSpacing: 0
      }}>

        {/* header row */}
        <thead>
          <tr>
            {orderedKeys.map(key => {
              const isPinned = pinnedColumns.includes(key)
              return (
                <th
                  key={key}
                  ref={isPinned ? (el => { pinnedThRefs.current[key] = el }) : undefined}
                  draggable={!!pageName}
                  onDragStart={() => setDragKey(key)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(key)}
                  style={{
                    padding: '12px 16px',
                    textAlign: 'left',
                    background: isPinned ? '#e4e7ee' : '#eef0f4',
                    fontSize: '11.5px',
                    fontWeight: '600',
                    color: '#4b5160',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid #e6e8ee',
                    position: 'sticky',
                    top: 0,
                    left: isPinned ? (stickyLeft[key] ?? 0) : undefined,
                    zIndex: isPinned ? 4 : 3,
                    minWidth: pageName ? COLUMN_MIN_WIDTH : undefined,
                    cursor: pageName ? 'grab' : 'default',
                    whiteSpace: 'nowrap',
                    overflow: pageName ? 'hidden' : undefined,
                    textOverflow: pageName ? 'ellipsis' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {pageName && <GripVertical size={12} style={{ opacity: 0.4, flexShrink: 0 }} />}
                    <span style={{ flex: 1 }}>{COLUMN_DEFS[key].label}</span>
                    {pageName && (
                      <button
                        onClick={() => togglePin(key)}
                        disabled={!isPinned && pinnedColumns.length >= 4}
                        title={isPinned ? 'Unpin column' : 'Pin column'}
                        style={{
                          background: 'none', border: 'none',
                          cursor: (!isPinned && pinnedColumns.length >= 4) ? 'not-allowed' : 'pointer',
                          padding: 0, display: 'flex', flexShrink: 0,
                          opacity: (!isPinned && pinnedColumns.length >= 4) ? 0.3 : (isPinned ? 1 : 0.5),
                          color: isPinned ? '#128C7E' : '#7a8090'
                        }}
                      >
                        {isPinned ? <Pin size={12} /> : <PinOff size={12} />}
                      </button>
                    )}
                  </div>
                </th>
              )
            })}
            {showActions && (
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                background: '#eef0f4',
                fontSize: '11.5px',
                fontWeight: '600',
                color: '#4b5160',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderBottom: '1px solid #e6e8ee',
                position: 'sticky',
                top: 0,
                zIndex: 3,
                minWidth: pageName ? ACTION_COLUMN_MIN_WIDTH : undefined
              }}>
                Action
              </th>
            )}
          </tr>
        </thead>
        {/* table body - loops through orders */}
        <tbody>
          {orders.length === 0 ? (

            // empty state - no orders found
            <tr>
              <td colSpan={orderedKeys.length + (showActions ? 1 : 0)}
                style={{ padding: '36px', textAlign: 'center', color: '#7a8090' }}>
                No orders found
              </td>
            </tr>

          ) : orders.map((order, index) => (

            // one row per order
            <tr key={order.id || index} style={{
              borderBottom: '1px solid #e6e8ee',
              background: hoveredRow === index ? 'rgba(15,17,23,0.025)' : 'transparent'
            }}
            onMouseEnter={() => setHoveredRow(index)}
            onMouseLeave={() => setHoveredRow(null)}
            >
              {orderedKeys.map(key => {
                const isPinned = pinnedColumns.includes(key)
                return (
                  <td key={key} style={{
                    padding: '12px 16px',
                    minWidth: pageName ? COLUMN_MIN_WIDTH : undefined,
                    position: isPinned ? 'sticky' : undefined,
                    left: isPinned ? (stickyLeft[key] ?? 0) : undefined,
                    background: isPinned ? (hoveredRow === index ? '#f7f8fa' : '#ffffff') : undefined,
                    zIndex: isPinned ? 2 : undefined,
                    overflow: pageName ? 'hidden' : undefined,
                    textOverflow: pageName ? 'ellipsis' : undefined,
                    whiteSpace: pageName ? 'nowrap' : undefined
                  }}>
                    {COLUMN_DEFS[key].render(order)}
                  </td>
                )
              })}

              {/* action buttons - only if showActions true */}
              {showActions && (
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: '6px' }}>
{/* send button - only for NO */}
                    {(order.msg_sent?.toUpperCase() === 'NO' || order.msg_sent?.toUpperCase() === 'SENT') && (
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
      </div>
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
              <StatusBadge status={viewOrder.msg_sent} />
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersTable
