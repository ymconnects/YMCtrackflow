 import { useState, useEffect } from 'react'
import { getStatus, toggleSystem, toggleAutoMessage, getAutoMessageStatus } from '../utils/api'

const useStatus = () => {
  const [systemOn, setSystemOn] = useState(true)
  const [autoMsg, setAutoMsg] = useState(true)
  const [loading, setLoading] = useState(true)

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await getStatus()
      setSystemOn(res.data.system_on)
      setAutoMsg(res.data.auto_message)
    } catch (err) {
      console.log('Status fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const handleToggleSystem = async () => {
    try {
      const newValue = !systemOn
      await toggleSystem(newValue)
      setSystemOn(newValue)
      return { success: true }
    } catch (err) {
      return { success: false }
    }
  }

  const handleToggleAutoMsg = async () => {
    try {
      const newValue = !autoMsg
      await toggleAutoMessage(newValue)
      setAutoMsg(newValue)
      return { success: true }
    } catch (err) {
      return { success: false }
    }
  }

  return {
    systemOn,
    autoMsg,
    loading,
    fetchStatus,
    handleToggleSystem,
    handleToggleAutoMsg
  }
}

export default useStatus
