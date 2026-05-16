 import { useState, useEffect } from 'react'
import { getOrders, runNow, retryFailed } from '../utils/api'

const useOrders = () => {
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
    fetchOrders()
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
    const sent = orders.filter(o => o.msg_sent === 'YES').length
    const pending = orders.filter(o => o.msg_sent === 'NO').length
    const failed = orders.filter(o => o.msg_sent === 'FAILED').length
    return { total, sent, pending, failed }
  }

  return {
    orders,
    loading,
    error,
    running,
    fetchOrders,
    handleRunNow,
    handleRetryFailed,
    getStats
  }
}

export default useOrders
