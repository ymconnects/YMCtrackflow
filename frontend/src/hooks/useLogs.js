 import { useState, useEffect } from 'react'
import { getLogs } from '../utils/api'

const useLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
