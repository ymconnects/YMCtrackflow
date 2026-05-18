 import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ children, isAllowed, isLoggedIn, loading }) => {

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontSize: '14px',
        color: '#7a8090'
      }}>
        Loading...
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to='/login' replace />
  }

  if (!isAllowed) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        gap: '12px'
      }}>
        <div style={{ fontSize: '32px' }}>🔒</div>
        <div style={{ fontWeight: '600', fontSize: '16px' }}>Access Denied</div>
        <div style={{ color: '#7a8090', fontSize: '13px' }}>
          You do not have permission to view this page
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute
