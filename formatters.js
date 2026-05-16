export const formatPhone = (phone) => {
  if (!phone) return ''
  const cleaned = phone.toString().replace(/\D/g, '')
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return '+91 ' + cleaned.slice(2, 7) + ' ' + cleaned.slice(7)
  }
  return phone
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

export const formatTime = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}

export const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return num.toLocaleString('en-IN')
}

export const formatCost = (num) => {
  if (!num && num !== 0) return ''
  return '₹' + num.toFixed(2)
}

export const formatStatus = (status) => {
  if (!status) return ''
  return status.charAt(0).toUpperCase() + 
         status.slice(1).toLowerCase()
}

export const getMsgStatusColor = (status) => {
  const colors = {
    'YES': 'green',
    'NO': 'amber',
    'FAILED': 'red'
  }
  return colors[status] || 'neutral'
}
