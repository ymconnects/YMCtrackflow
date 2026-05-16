import { useState, useEffect } from 'react'
import { login, logout, getMe, saveToken, removeToken } from '../utils/api'

const useAuth = () => {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await getMe()
        setUser(res.data.username)
        setRole(res.data.role)
      } catch (err) {
        removeToken()
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])
  const handleLogin = async (username, password) => {
    try {
      setError(null)
      setLoading(true)
      const res = await login(username, password)
      saveToken(res.data.token)
      setUser(res.data.username)
      setRole(res.data.role)
      return true
    } catch (err) {
      setError('Wrong username or password')
      return false
    } finally {
      setLoading(false)
    }
  }
  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      console.log('Logout error', err)
    } finally {
      removeToken()
      setUser(null)
      setRole(null)
    }
  }
  const isAllowed = (page) => {
    const pages = {
      admin:      ['dashboard','orders','campaigns','templates','logs','settings'],
      manager:    ['dashboard','orders','logs'],
      campaigner: ['dashboard','campaigns','templates','logs'],
      viewer:     ['dashboard','orders','logs']
    }
    return pages[role]?.includes(page) || false
  }

  return {
    user,
    role,
    loading,
    error,
    handleLogin,
    handleLogout,
    isAllowed
  }
}

export default useAuth