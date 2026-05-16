 import { useEffect } from 'react'

const Toast = ({ message, type, onClose }) => {
    const styles = {
    success: {
      borderLeft: '3px solid #128C7E',
      iconColor: '#128C7E',
      icon: '✓'
    },
    error: {
      borderLeft: '3px solid #dc2626',
      iconColor: '#dc2626',
      icon: '✕'
    },
    info: {
      borderLeft: '3px solid #2563eb',
      iconColor: '#2563eb',
      icon: 'ℹ'
    }
  }

  const s = styles[type] || styles.info

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #d9dde4',
      borderLeft: s.borderLeft,
      borderRadius: '11px',
      padding: '12px 14px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '10px',
      boxShadow: '0 12px 28px rgba(15,17,23,0.12)',
      minWidth: '280px',
      maxWidth: '360px'
    }}>
        <span style={{
        color: s.iconColor,
        fontWeight: '700',
        fontSize: '16px',
        marginTop: '1px',
        flexShrink: 0
      }}>
        {s.icon}
      </span>
      <div>
        <div style={{
          fontWeight: '600',
          fontSize: '13px',
          color: '#0f1117'
        }}>
          {message}
        </div>
      </div>
    </div>
  )
}

export default Toast

