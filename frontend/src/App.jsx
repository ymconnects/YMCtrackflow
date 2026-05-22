// App.jsx
// Root component - manages routing and auth
// Every page renders inside here

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import useAuth from './hooks/useAuth'
import useStatus from './hooks/useStatus'
import Sidebar from './components/Sidebar'
import TopBar from './components/TopBar'
import ToastContainer from './components/ToastContainer'
import ProtectedRoute from './components/ProtectedRoute'
// import all pages
// we will build these next
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Campaigns from './pages/Campaigns'
import Templates from './pages/Templates'
import Logs from './pages/Logs'
import Settings from './pages/Settings'
import useOrders from './hooks/useOrders'
// App component - main function
const App = () => {

  // get auth state and functions from useAuth hook
  const { 
    user, 
    role, 
    loading, 
    handleLogin, 
    handleLogout, 
    isAllowed 
  } = useAuth()

  // get system status from useStatus hook
  const {
    systemOn,
    autoMsg,
    handleToggleSystem,
    handleToggleAutoMsg
  } = useStatus()
  const [ordersCount, setOrdersCount] = useState(0)

  // track which page is currently open
  const [currentPage, setCurrentPage] = useState('dashboard')
  // layout style - sidebar + main content
  const appLayout = {
    display: 'flex',
    minHeight: '120vh',
    background: '#f6f7f9',
    fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
  }

  // main content area - pushed right of sidebar
  const mainStyle = {
    marginLeft: '240px',
    marginTop: '60px',
    flex: 1,
    padding: '24px 28px',
    minHeight: 'calc(100vh - 60px)'
  }

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        <Route path='/login' element={
          user ? <Navigate to='/dashboard' replace /> : <Login onLogin={handleLogin} />
        } />

        <Route path='/dashboard' element={
          <ProtectedRoute isLoggedIn={!!user} isAllowed={isAllowed('dashboard')} loading={loading}>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f9', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <Sidebar user={user} role={role} onLogout={handleLogout} currentPage={currentPage} isAllowed={isAllowed} ordersCount={ordersCount} />
              <div style={{ marginLeft: '240px', flex: 1 }}>
                <TopBar currentPage={currentPage} systemOn={systemOn} autoMsg={autoMsg} onToggleSystem={handleToggleSystem} onToggleAutoMsg={handleToggleAutoMsg} role={role} />
                <div style={{ marginTop: '60px', padding: '24px 28px' , minHeight: 'calc(100vh - 60px)'}}>
                  <Dashboard role={role} onPageChange={setCurrentPage} />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path='/orders' element={
          <ProtectedRoute isLoggedIn={!!user} isAllowed={isAllowed('orders')} loading={loading}>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f9', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <Sidebar user={user} role={role} onLogout={handleLogout} currentPage={currentPage} isAllowed={isAllowed} ordersCount={ordersCount} />
              <div style={{ marginLeft: '240px', flex: 1 , width: 'calc(100% - 240px)'}}>
                <TopBar currentPage={currentPage} systemOn={systemOn} autoMsg={autoMsg} onToggleSystem={handleToggleSystem} onToggleAutoMsg={handleToggleAutoMsg} role={role} />
                <div style={{ marginTop: '60px', padding: '24px 28px' }}>
                  <Orders role={role} onPageChange={setCurrentPage} onOrdersLoad={setOrdersCount} />
                </div>
              </div>
              
            </div>
          </ProtectedRoute>
        } />

        <Route path='/campaigns' element={
          <ProtectedRoute isLoggedIn={!!user} isAllowed={isAllowed('campaigns')} loading={loading}>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f9', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <Sidebar user={user} role={role} onLogout={handleLogout} currentPage={currentPage} isAllowed={isAllowed} ordersCount={ordersCount} />
              <div style={{ marginLeft: '240px', flex: 1 }}>
                <TopBar currentPage={currentPage} systemOn={systemOn} autoMsg={autoMsg} onToggleSystem={handleToggleSystem} onToggleAutoMsg={handleToggleAutoMsg} role={role} />
                <div style={{ marginTop: '60px', padding: '24px 28px' }}>
                  <Campaigns role={role} onPageChange={setCurrentPage} />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path='/templates' element={
          <ProtectedRoute isLoggedIn={!!user} isAllowed={isAllowed('templates')} loading={loading}>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f9', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <Sidebar user={user} role={role} onLogout={handleLogout} currentPage={currentPage} isAllowed={isAllowed} ordersCount={ordersCount} />
              <div style={{ marginLeft: '240px', flex: 1 }}>
                <TopBar currentPage={currentPage} systemOn={systemOn} autoMsg={autoMsg} onToggleSystem={handleToggleSystem} onToggleAutoMsg={handleToggleAutoMsg} role={role} />
                <div style={{ marginTop: '60px', padding: '24px 28px' }}>
                  <Templates role={role} onPageChange={setCurrentPage} />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path='/logs' element={
          <ProtectedRoute isLoggedIn={!!user} isAllowed={isAllowed('logs')} loading={loading}>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f9', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <Sidebar user={user} role={role} onLogout={handleLogout} currentPage={currentPage} isAllowed={isAllowed} ordersCount={ordersCount} />
              <div style={{ marginLeft: '240px', flex: 1 }}>
                <TopBar currentPage={currentPage} systemOn={systemOn} autoMsg={autoMsg} onToggleSystem={handleToggleSystem} onToggleAutoMsg={handleToggleAutoMsg} role={role} />
                <div style={{ marginTop: '60px', padding: '24px 28px' }}>
                  <Logs role={role} onPageChange={setCurrentPage} />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path='/settings' element={
          <ProtectedRoute isLoggedIn={!!user} isAllowed={isAllowed('settings')} loading={loading}>
            <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f9', fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
              <Sidebar user={user} role={role} onLogout={handleLogout} currentPage={currentPage} isAllowed={isAllowed} ordersCount={ordersCount} />
              <div style={{ marginLeft: '240px', flex: 1 }}>
                <TopBar currentPage={currentPage} systemOn={systemOn} autoMsg={autoMsg} onToggleSystem={handleToggleSystem} onToggleAutoMsg={handleToggleAutoMsg} role={role} />
                <div style={{ marginTop: '60px', padding: '24px 28px' }}>
                  <Settings 
                    role={role}
                    onPageChange={setCurrentPage}
                    systemOn={systemOn}
                    autoMsg={autoMsg}
                    onToggleSystem={handleToggleSystem}
                    onToggleAutoMsg={handleToggleAutoMsg}
                  />
                </div>
              </div>
            </div>
          </ProtectedRoute>
        } />

        <Route path='*' element={<Navigate to='/login' replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App