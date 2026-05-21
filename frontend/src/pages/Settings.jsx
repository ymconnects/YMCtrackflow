// Settings.jsx
// Admin only page
// Meta credentials, Google Sheets config,
// system controls, users and roles

import { useEffect, useState } from 'react'
import useStatus from '../hooks/useStatus'
import ToastContainer from '../components/ToastContainer'
import { Save, Eye, EyeOff, Key, Sheet, Settings2, FileText, Lock } from 'lucide-react'

// ── defined OUTSIDE Settings to prevent re-renders and cursor loss ──

const CardTitle = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
    <div style={{ color: '#128C7E' }}>{icon}</div>
    <h3 style={{ margin: 0, fontSize: '14.5px', fontWeight: '700' }}>{title}</h3>
  </div>
)

const Row = ({ label, subtitle, children, last }) => (
  <div style={{
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: last ? 'none' : '1px solid #f3f4f7',
    gap: '12px'
  }}>
    <div>
      <div style={{ fontSize: '13.5px', color: '#4b5160', fontWeight: '500' }}>{label}</div>
      {subtitle && <div style={{ fontSize: '12px', color: '#7a8090', marginTop: '2px' }}>{subtitle}</div>}
    </div>
    {children}
  </div>
)

const Toggle = ({ on, onToggle, onText, offText }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <div
      onClick={onToggle}
      style={{
        width: '48px', height: '26px',
        borderRadius: '999px',
        background: on ? '#128C7E' : '#d9dde4',
        position: 'relative', cursor: 'pointer',
        transition: 'background 0.3s ease', flexShrink: 0
      }}
    >
      <div style={{
        position: 'absolute', top: '3px',
        left: on ? '25px' : '3px',
        width: '20px', height: '20px',
        borderRadius: '50%', background: '#ffffff',
        transition: 'left 0.3s ease',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)'
      }}></div>
    </div>
    <span style={{
      fontSize: '13px', fontWeight: '600',
      color: on ? '#128C7E' : '#7a8090',
      width: '70px'
    }}>
      {on ? onText : offText}
    </span>
  </div>
)

// ── main component ──

const Settings = ({ role, onPageChange, systemOn, autoMsg, onToggleSystem, onToggleAutoMsg }) => {


  const [showToken, setShowToken] = useState(false)

  const [metaForm, setMetaForm] = useState({
    access_token: '',
    phone_number_id: '',
    waba_id: '',
    webhook_token: ''
  })

  const [sheetsForm, setSheetsForm] = useState({
    sheet_id: '',
    tab1: 'Anjani',
    tab2: 'DTDC',
    tab3: 'MARUTI',
    tab4: 'Others'
  })

  const [systemForm, setSystemForm] = useState({
    check_interval: '10',
    batch_size: '80',
    retry_interval: '2'
  })

  const [templateForm, setTemplateForm] = useState({
    anjani: 'anjani_shipping',
    dtdc: 'dtdc_shipping',
    maruti: 'Maruti_shipping',
    others: 'general_shipping'
  })

  useEffect(() => {
    onPageChange('settings')
  }, [onPageChange])

  const handleSave = () => {
    ToastContainer.addToast('Settings saved', 'success')
  }

  const handleSysToggle = async () => {
    const result = await onToggleSystem()
    if (result.success) {
      ToastContainer.addToast(systemOn ? 'System paused' : 'System resumed', systemOn ? 'error' : 'success')
    }
  }

  const handleAutoToggle = async () => {
    const result = await onToggleAutoMsg()
    if (result.success) {
      ToastContainer.addToast(autoMsg ? 'Auto message disabled' : 'Auto message enabled', autoMsg ? 'error' : 'success')
    }
  }

  const inputStyle = {
    height: '40px', padding: '0 12px',
    background: '#eef0f4', border: '1px solid #d9dde4',
    borderRadius: '8px', fontFamily: 'inherit',
    fontSize: '13px', color: '#0f1117', outline: 'none',
    boxSizing: 'border-box', width: '220px'
  }

  const cardStyle = {
    background: '#ffffff', border: '1px solid #e6e8ee',
    borderRadius: '14px', padding: '20px',
    boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
  }

  return (
    <div>

      {/* page header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '22px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em', textAlign: 'left' }}>Settings</h1>
          <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px', textAlign: 'left' }}>
            Meta credentials, sheets sync, system controls and user roles.
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => ToastContainer.addToast('Testing connection...', 'info')} style={{ height: '36px', padding: '0 14px', background: 'transparent', border: '1px solid #e6e8ee', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit', color: '#4b5160' }}>
            ⚡ Test connection
          </button>
          <button onClick={handleSave} style={{ height: '36px', padding: '0 14px', background: '#128C7E', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit' }}>
            <Save size={14} /> Save changes
          </button>
        </div>
      </div>

      {/* two column grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px', textAlign: 'left' }}>

        {/* Meta credentials */}
        <div style={cardStyle}>
          <CardTitle icon={<Key size={16} />} title='Meta WhatsApp credentials' />
          <Row label='Access token' subtitle='Used to authenticate Cloud API calls'>
            <div style={{ position: 'relative' }}>
              <input type={showToken ? 'text' : 'password'} value={metaForm.access_token} onChange={e => setMetaForm(p => ({ ...p, access_token: e.target.value }))} placeholder='EAAxxxxxxxxx' style={{ ...inputStyle, paddingRight: '36px' }} />
              <button onClick={() => setShowToken(!showToken)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8090' }}>
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Row>
          <Row label='Phone number ID'><input value={metaForm.phone_number_id} onChange={e => setMetaForm(p => ({ ...p, phone_number_id: e.target.value }))} placeholder='108472389172364' style={inputStyle} /></Row>
          <Row label='WABA ID'><input value={metaForm.waba_id} onChange={e => setMetaForm(p => ({ ...p, waba_id: e.target.value }))} placeholder='218938472019283' style={inputStyle} /></Row>
          <Row label='Webhook verify token' last><input type='password' value={metaForm.webhook_token} onChange={e => setMetaForm(p => ({ ...p, webhook_token: e.target.value }))} placeholder='••••••••••••' style={inputStyle} /></Row>
        </div>

        {/* Google Sheets */}
        <div style={cardStyle}>
          <CardTitle icon={<Sheet size={16} />} title='Google Sheets' />
          <Row label='Sheet ID'><input value={sheetsForm.sheet_id} onChange={e => setSheetsForm(p => ({ ...p, sheet_id: e.target.value }))} placeholder='1AbCd...ZyXw9876' style={inputStyle} /></Row>
          {[
            { key: 'tab1', label: 'Orders tab' },
            { key: 'tab2', label: 'Logs tab' },
            { key: 'tab3', label: 'Campaigns tab' },
            { key: 'tab4', label: 'Templates tab' },
          ].map((t, i, arr) => (
            <Row key={t.key} label={t.label} last={i === arr.length - 1}>
              <input value={sheetsForm[t.key]} onChange={e => setSheetsForm(p => ({ ...p, [t.key]: e.target.value }))} style={inputStyle} />
            </Row>
          ))}
        </div>

        {/* System controls */}
        <div style={cardStyle}>
          <CardTitle icon={<Settings2 size={16} />} title='System controls' />
          <Row label='System status' subtitle='Master switch for scheduler'>
            <Toggle on={systemOn} onToggle={handleSysToggle} onText='Running' offText='Paused' />
          </Row>
          <Row label='Auto message' subtitle='Auto-send when new rows appear'>
            <Toggle on={autoMsg} onToggle={handleAutoToggle} onText='Enabled' offText='Disabled' />
          </Row>
          <Row label='Check interval (seconds)'>
            <input
              type='number' min='1'
              value={systemForm.check_interval}
              onChange={e => setSystemForm(p => ({ ...p, check_interval: e.target.value }))}
              onBlur={e => { if (!e.target.value) setSystemForm(p => ({ ...p, check_interval: '10' })) }}
              style={inputStyle}
            />
          </Row>
          <Row label='Batch size'>
            <input
              type='number' min='1' max='80'
              value={systemForm.batch_size}
              onChange={e => setSystemForm(p => ({ ...p, batch_size: e.target.value }))}
              onBlur={e => { if (!e.target.value) setSystemForm(p => ({ ...p, batch_size: '80' })) }}
              style={inputStyle}
            />
          </Row>
          <Row label='Retry interval (minutes)' last>
            <input
              type='number' min='1'
              value={systemForm.retry_interval}
              onChange={e => setSystemForm(p => ({ ...p, retry_interval: e.target.value }))}
              onBlur={e => { if (!e.target.value) setSystemForm(p => ({ ...p, retry_interval: '2' })) }}
              style={inputStyle}
            />
          </Row>
        </div>

        {/* Template names */}
        <div style={cardStyle}>
          <CardTitle icon={<FileText size={16} />} title='Template names per courier' />
          {[
            { key: 'anjani', label: 'Anjani' },
            { key: 'dtdc',   label: 'DTDC' },
            { key: 'maruti', label: 'Maruti' },
            { key: 'others', label: 'Others (fallback)' },
          ].map((t, i, arr) => (
            <Row key={t.key} label={t.label} last={i === arr.length - 1}>
              <input value={templateForm[t.key]} onChange={e => setTemplateForm(p => ({ ...p, [t.key]: e.target.value }))} style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }} />
            </Row>
          ))}
        </div>

      </div>

      {/* Users and roles - full width */}
      <div style={{ ...cardStyle, padding: '0' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #e6e8ee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: '0 0 2px', fontSize: '14.5px', fontWeight: '700' }}>Users & roles</h3>
            <div style={{ fontSize: '12.5px', color: '#7a8090' }}>4 accounts · managed via config</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#7a8090' }}>
            <Lock size={13} /> Read-only — defined in backend config
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Username', 'Display name', 'Role', 'Last sign-in', 'Status', 'Actions'].map(col => (
                <th key={col} style={{ padding: '10px 20px', textAlign: 'left', background: '#eef0f4', fontSize: '11px', fontWeight: '600', color: '#4b5160', letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #e6e8ee' }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { user: 'admin',     display: 'System Admin',       role: 'Admin',      color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  lastSeen: '2 min ago'  },
              { user: 'manager1',  display: 'Operations Manager', role: 'Manager',    color: '#128C7E', bg: 'rgba(18,140,126,0.1)',  lastSeen: '24 min ago' },
              { user: 'campaign1', display: 'Campaign Lead',      role: 'Campaigner', color: '#b8770b', bg: 'rgba(245,158,11,0.16)', lastSeen: '3 hr ago'   },
              { user: 'viewer1',   display: 'Read-only Viewer',   role: 'Viewer',     color: '#4b5160', bg: '#f3f4f7',              lastSeen: 'Yesterday'  },
            ].map((u, i, arr) => (
              <tr key={u.user} style={{ borderBottom: i < arr.length - 1 ? '1px solid #f3f4f7' : 'none' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(15,17,23,0.02)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <td style={{ padding: '14px 20px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px' }}>{u.user}</td>
                <td style={{ padding: '14px 20px', fontSize: '13.5px' }}>{u.display}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: '600', background: u.bg, color: u.color, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: u.color, display: 'inline-block' }}></span>
                    {u.role}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', fontSize: '13px', color: '#7a8090' }}>{u.lastSeen}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{ color: '#128C7E', fontSize: '12.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>⊙ Active</span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <button style={{ width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e6e8ee', background: '#f6f7f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7a8090' }}>
                    <Key size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default Settings