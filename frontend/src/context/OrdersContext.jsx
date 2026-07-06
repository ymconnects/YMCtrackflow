// OrdersContext.jsx
// Single shared copy of the orders list for the whole app - fetched once
// here instead of every page (Dashboard, Orders) independently re-fetching
// the full table on its own mount.

import { createContext, useContext, useState, useEffect } from 'react'
import { getOrders, runNow, retryFailed } from '../utils/api'

const OrdersContext = createContext(null)

export const OrdersProvider = ({ children }) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [running, setRunning] = useState(false)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getOrders()
      setOrders(res.data.orders)
    } catch (err) {
      setError('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // this provider wraps the whole app, including the public /login route -
    // only fetch once there's actually a session, same as the old per-page
    // behavior (fetchOrders lived inside pages that only mounted post-login)
    if (localStorage.getItem('token')) {
      fetchOrders()
    } else {
      setLoading(false)
    }
  }, [])

  const handleRunNow = async () => {
    try {
      setRunning(true)
      await runNow()
      await fetchOrders()
      return { success: true, message: 'Messages sent successfully' }
    } catch (err) {
      return { success: false, message: 'Failed to run' }
    } finally {
      setRunning(false)
    }
  }

  const handleRetryFailed = async () => {
    try {
      setRunning(true)
      await retryFailed()
      await fetchOrders()
      return { success: true, message: 'Retry completed' }
    } catch (err) {
      return { success: false, message: 'Failed to retry' }
    } finally {
      setRunning(false)
    }
  }

  const getStats = () => {
    const total = orders.length
    const sent = orders.filter(o => ['YES', 'SENT', 'DELIVERED', 'READ'].includes(o.msg_sent)).length
    const pending = orders.filter(o => !['YES', 'SENT', 'DELIVERED', 'READ', 'FAILED'].includes(o.msg_sent)).length
    const failed = orders.filter(o => o.msg_sent === 'FAILED').length
    return { total, sent, pending, failed }
  }

  const value = {
    orders,
    loading,
    error,
    running,
    fetchOrders,
    handleRunNow,
    handleRetryFailed,
    getStats
  }

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  )
}

export const useOrdersContext = () => {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
