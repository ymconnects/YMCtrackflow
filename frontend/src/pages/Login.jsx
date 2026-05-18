 // Login.jsx
// First page user sees
// Has username, password, role buttons

import { useState } from 'react'

const Login = ({ onLogin }) => {

  // form field values
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  // show/hide password toggle
  const [showPass, setShowPass] = useState(false)

  // loading state when login button clicked
  const [loading, setLoading] = useState(false)

  // error message if login fails
  const [error, setError] = useState('')
  // called when login button clicked
  const handleSubmit = async (e) => {
    // stops page from refreshing
    e.preventDefault()

    // clear old errors
    setError('')

    // basic validation
    if (!username || !password) {
      setError('Please enter username and password')
      return
    }

    // show spinner
    setLoading(true)

    // call login function from App.jsx
    const result = await onLogin(username, password)

    // if failed show error
    if (!result) {
      setError('Wrong username or password')
    }

    // hide spinner
    setLoading(false)
  }
  // fills username and password
  // when demo role button clicked
  const fillDemo = (user, pass) => {
    setUsername(user)
    setPassword(pass)
    setError('')
  }

  return (
    // full screen two column layout
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'grid',
      gridTemplateColumns: '1.05fr 1fr',
      background: '#f6f7f9',
      fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif'
    }}>
        {/* LEFT SIDE - branding and stats */}
      <div style={{
        padding: '56px 64px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #e6e8ee',
        background: `
          radial-gradient(1200px 600px at 80% 110%, rgba(37,211,102,0.14), transparent 60%),
          radial-gradient(800px 500px at 10% -20%, rgba(18,140,126,0.08), transparent 60%),
          #f6f7f9`
      }}>

        {/* brand logo and name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px',
            borderRadius: '11px',
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff', fontSize: '20px',
            boxShadow: '0 8px 22px rgba(18,140,126,0.28)'
          }}>✉</div>
          <div style={{ fontWeight: '800', fontSize: '19px' }}>
            YMC<span style={{ color: '#128C7E' }}>TrackFlow</span>
          </div>
        </div>
        {/* hero text section */}
        <div>
          {/* live indicator */}
          <div style={{
            color: '#128C7E',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            marginBottom: '18px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              width: '8px', height: '8px',
              borderRadius: '50%',
              background: '#25D366',
              boxShadow: '0 0 0 4px rgba(37,211,102,0.18)'
            }}></span>
            WhatsApp Operations Console
          </div>

          {/* main heading */}
          <h1 style={{
            fontSize: '52px',
            fontWeight: '800',
            letterSpacing: '-0.025em',
            margin: '0 0 18px',
            lineHeight: '1.05'
          }}>
            Track every order.<br/>
            Send at <em style={{
              fontStyle: 'normal',
              color: '#128C7E'
            }}>bulk scale.</em>
          </h1>

          {/* subtitle */}
          <p style={{
            color: '#4b5160',
            fontSize: '16px',
            maxWidth: '480px',
            margin: '0 0 36px'
          }}>
            One control room for courier-aware order tracking
            messages wired straight to your Google Sheet
            and WhatsApp Business API.
          </p>

          {/* 3 stat boxes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '18px',
            maxWidth: '520px'
          }}>
            {[
              { n: '12,847', l: 'Messages this month' },
              { n: '97.4%',  l: 'Delivery rate'       },
              { n: '₹0.88',  l: 'Cost per message'     }
            ].map(stat => (
              <div key={stat.l} style={{
                padding: '18px',
                border: '1px solid #e6e8ee',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.72)',
                backdropFilter: 'blur(6px)'
              }}>
                <div style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  fontFamily: 'JetBrains Mono, monospace'
                }}>{stat.n}</div>
                <div style={{
                  color: '#7a8090',
                  fontSize: '12px',
                  marginTop: '2px'
                }}>{stat.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* footer */}
        <div style={{
          color: '#7a8090',
          fontSize: '12px',
          display: 'flex',
          gap: '18px'
        }}>
          {['v1.0.0', 'Meta Cloud API', 'Asia/Kolkata'].map(t => (
            <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>•</span>
              {t}
            </span>
          ))}
        </div>
        </div>
      {/* RIGHT SIDE - login form */}
      <div style={{
        padding: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'

      }}>
        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: '#ffffff',
          border: '1px solid #d9dde4',
          borderRadius: '18px',
          padding: '36px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04), 0 6px 18px rgba(15,17,23,0.06)'
        }}>

          {/* form heading */}
          <h2 style={{
            margin: '0 0 6px',
            fontSize: '24px',
            fontWeight: '700',
            letterSpacing: '-0.01em',
            textAlign: 'left'
          }}>Welcome back</h2>
          <p style={{
            color: '#4b5160',
            margin: '0 0 26px',
            fontSize: '14px',
            textAlign: 'left'
          }}>Sign in to your operations dashboard.</p>

          {/* login form */}
          <form onSubmit={handleSubmit}>

            {/* username field */}
            <div style={{ marginBottom: '16px',textAlign: 'left' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#4b5160',
                marginBottom: '7px',
                fontWeight: '600',
                letterSpacing: '0.02em',
                textAlign: 'left'
              }}>Username</label>
              <input
                type='text'
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder='ENTER YOUR USERNAME'
                onFocus={e => e.target.style.borderColor = '#128C7E'}
                onBlur={e => e.target.style.borderColor = '#d9dde4'}
                 onFocus={e => {
                  e.target.style.borderColor = '#128C7E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(18,140,126,0.18)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#d9dde4'
                  e.target.style.boxShadow = 'none'
                }}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  background: '#eef0f4',
                  border: '1px solid #d9dde4',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#0f1117',
                  outline: 'none',
                  boxSizing: 'border-box'
                  
                }}
              />
            </div>
           {/* password field */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                color: '#4b5160',
                marginBottom: '7px',
                fontWeight: '600',
                letterSpacing: '0.02em',
                textAlign: 'left'
              }}>Password</label>
              <div style={{ 
                position: 'relative',
                width: '100%'
              }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='ENTER YOUR PASSWORD'
                  onFocus={e => e.target.style.borderColor = '#128C7E'}
                  onBlur={e => e.target.style.borderColor = '#d9dde4'}
                   onFocus={e => {
                  e.target.style.borderColor = '#128C7E'
                  e.target.style.boxShadow = '0 0 0 3px rgba(18,140,126,0.18)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = '#d9dde4'
                  e.target.style.boxShadow = 'none'
                }}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 44px 0 14px',
                    background: '#eef0f4',
                    border: '1px solid #d9dde4',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    color: '#0f1117',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type='button'
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#7a8090',
                    fontSize: '16px',
                    padding: '0',
                    lineHeight: '1'
                  }}
                >{showPass ? '🙈' : '👁'}</button>
              </div>
            </div>
            {/* error message box */}
            {error && (
              <div style={{
                marginBottom: '14px',
                padding: '10px 12px',
                borderRadius: '10px',
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.3)',
                color: '#dc2626',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                ⚠ {error}
              </div>
            )}

            {/* submit button */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '22px'
            }}>
              <span 
                onClick={() => alert('Please contact Admin to reset your password.')}
                style={{ 
                  fontSize: '12px', 
                  color: '#7a8090',
                  cursor: 'pointer'
                }}
              >Forgot password?</span>
              <button
                type='submit'
                disabled={loading}
                onMouseEnter={e => e.currentTarget.style.background = '#0e7a6e'}
                onMouseLeave={e => e.currentTarget.style.background = '#128C7E'}
                style={{
                  height: '44px',
                  padding: '0 24px',
                  background: loading ? '#7a8090' : '#128C7E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'inherit'
                }}
              >
                {loading ? 'Signing in...' : 'Sign in →'}
              </button>
            </div>
          </form>
          

         

        </div>
      </div>
    </div>
  )
}

export default Login