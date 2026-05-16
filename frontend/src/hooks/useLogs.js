 import { useState, useEffect } from 'react'
import { getLogs } from '../utils/api'

const useLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getLogs()
      setLogs(res.data.logs)
    } catch (err) {
      setError('Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const getFilteredLogs = (role) => {
    let filtered = logs

    if (role === 'manager' || role === 'viewer') {
      filtered = logs.filter(log => 
        log.level === 'SUCCESS' || 
        log.level === 'FAILED'
      )
    }

    if (role === 'campaigner') {
      filtered = logs.filter(log => 
        log.level === 'CAMPAIGN'
      )
    }

    if (filter !== 'all') {
      filtered = filtered.filter(log => 
        log.level === filter
      )
    }

    return filtered
  }
  
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
  }

  const exportLogs = (role) => {
    const filtered = getFilteredLogs(role)
    const csv = [
      ['Time', 'Level', 'Order ID', 'Customer', 'Courier', 'Detail'],
      ...filtered.map(log => [
        log.time,
        log.level,
        log.order_id || '',
        log.customer || '',
        log.courier || '',
        log.message
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'logs.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    logs,
    loading,
    error,
    filter,
    fetchLogs,
    getFilteredLogs,
    handleFilterChange,
    exportLogs
  }
}

export default useLogs
