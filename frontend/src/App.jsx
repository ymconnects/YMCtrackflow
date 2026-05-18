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

  // track which page is currently open
  const [currentPage, setCurrentPage] = useState('dashboard')
  // layout style - sidebar + main content
  const appLayout = {
    display: 'flex',
    minHeight: '100vh',
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
    // router wraps everything
    // enables page navigation
    <BrowserRouter>
      
      {/* toast notifications container */}
      {/* shows success/error messages */}
      <ToastContainer />

      <Routes>

        {/* login route - public */}
        {/* anyone can access this */}
        <Route path='/login' element={
          user ? <Navigate to='/dashboard' replace /> : <Login onLogin={handleLogin} />
        } />
        {/* protected app route */}
        {/* shows sidebar and topbar */}
        <Route path='/' element={
          <ProtectedRoute 
            isLoggedIn={!!user} 
            isAllowed={true}
            loading={loading}
          >
            {/* app shell - sidebar + topbar */}
            <div style={appLayout}>
              
              {/* sidebar navigation */}
              <Sidebar
                user={user}
                role={role}
                onLogout={handleLogout}
                currentPage={currentPage}
                isAllowed={isAllowed}
              />

              {/* topbar */}
              <TopBar
                currentPage={currentPage}
                systemOn={systemOn}
                autoMsg={autoMsg}
                onToggleSystem={handleToggleSystem}
                onToggleAutoMsg={handleToggleAutoMsg}
                role={role}
              />

              {/* page content */}
              <main style={mainStyle}>
                <Routes>
                  {/* dashboard route */}
                  <Route path='dashboard' element={
                    <ProtectedRoute
                      isLoggedIn={!!user}
                      isAllowed={isAllowed('dashboard')}
                      loading={loading}
                    >
                      <Dashboard 
                        role={role}
                        onPageChange={setCurrentPage}
                      />
                    </ProtectedRoute>
                  } />

                  {/* orders route */}
                  <Route path='orders' element={
                    <ProtectedRoute
                      isLoggedIn={!!user}
                      isAllowed={isAllowed('orders')}
                      loading={loading}
                    >
                      <Orders 
                        role={role}
                        onPageChange={setCurrentPage}
                      />
                    </ProtectedRoute>
                  } />

                  {/* campaigns route */}
                  <Route path='campaigns' element={
                    <ProtectedRoute
                      isLoggedIn={!!user}
                      isAllowed={isAllowed('campaigns')}
                      loading={loading}
                    >
                      <Campaigns 
                        role={role}
                        onPageChange={setCurrentPage}
                      />
                    </ProtectedRoute>
                  } />
                  {/* templates route */}
                  <Route path='templates' element={
                    <ProtectedRoute
                      isLoggedIn={!!user}
                      isAllowed={isAllowed('templates')}
                      loading={loading}
                    >
                      <Templates 
                        role={role}
                        onPageChange={setCurrentPage}
                      />
                    </ProtectedRoute>
                  } />

                  {/* logs route */}
                  <Route path='logs' element={
                    <ProtectedRoute
                      isLoggedIn={!!user}
                      isAllowed={isAllowed('logs')}
                      loading={loading}
                    >
                      <Logs 
                        role={role}
                        onPageChange={setCurrentPage}
                      />
                    </ProtectedRoute>
                  } />

                  {/* settings route - admin only */}
                  <Route path='settings' element={
                    <ProtectedRoute
                      isLoggedIn={!!user}
                      isAllowed={isAllowed('settings')}
                      loading={loading}
                    >
                      <Settings 
                        role={role}
                        onPageChange={setCurrentPage}
                      />
                    </ProtectedRoute>
                  } />

                  {/* default redirect to dashboard */}
                  <Route path='*' element={<Navigate to='dashboard' replace />} />

                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        } />

        {/* catch all - redirect to login */}
        <Route path='*' element={<Navigate to='/login' replace />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App