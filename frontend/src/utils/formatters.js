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

export const truncate = (str, length = 30) => {
  if (!str) return ''
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export const getErrorLabel = (code) => {
  const labels = {
    "131026": "Not on WhatsApp",
    "131047": "24hr window expired",
    "131050": "User opted out",
    "131048": "Spam restriction — slow down",
    "130429": "Rate limit hit — retry later",
    "131000": "Unknown error — retry",
    "131049": "Ecosystem throttle — pause",
    "130403": "User blocked by business",
    "131042": "Payment issue",
    "132001": "Template not approved",
    "132000": "Wrong variable count",
    "131056": "Too many messages to same number",
  }
  return labels[String(code)] || (code ? `Error ${code}` : "—")
}

export const getInitials = (name) => {
  if (!name) return ''
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}