// Templates.jsx
// Shows all 4 courier WhatsApp templates
// Admin and Campaigner only

import { useEffect, useState } from 'react'

const Templates = ({ role, onPageChange }) => {

  // active courier tab
  const [activeTab, setActiveTab] = useState('anjani')

  // tell App.jsx we are on templates page
  useEffect(() => {
    onPageChange('templates')
  }, [onPageChange])

  // template data for all 4 couriers
  const templates = {
    anjani: {
      name: 'anjani_shipping',
      courier: 'Anjani Express',
      status: 'Approved',
      category: 'UTILITY',
      sender: 'Anjani Updates',
      preview: {
        name: 'Rahul Sharma',
        tracking_id: 'ANJ2048',
        tracking_link: 'anjani.in/track/ANJ2048',
        courier: 'Anjani Courier'
      }
    },
    dtdc: {
      name: 'dtdc_shipping',
      courier: 'DTDC',
      status: 'Approved',
      category: 'UTILITY',
      sender: 'DTDC Updates',
      preview: {
        name: 'Priya Singh',
        tracking_id: 'DTC9921',
        tracking_link: 'dtdc.in/track/DTC9921',
        courier: 'DTDC'
      }
    },
    maruti: {
      name: 'Maruti_shipping',
      courier: 'Maruti Courier',
      status: 'Approved',
      category: 'UTILITY',
      sender: 'Maruti Updates',
      preview: {
        name: 'Anil Mehta',
        tracking_id: 'MRT4412',
        tracking_link: 'maruti.in/track/MRT4412',
        courier: 'Maruti'
      }
    },
    others: {
      name: 'general_shipping',
      courier: 'Others',
      status: 'Approved',
      category: 'UTILITY',
      sender: 'YMC Updates',
      preview: {
        name: 'Seema Gupta',
        tracking_id: 'OTH7730',
        tracking_link: 'track.ymc.in/OTH7730',
        courier: 'courier'
      }
    }
  }

  const t = templates[activeTab]
  return (
    <div>

      {/* page header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{
          margin: 0, fontSize: '22px',
          fontWeight: '700', letterSpacing: '-0.01em',
          textAlign: 'left'
        }}>Templates</h1>
        <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px',textAlign: 'left' }}>
          Meta-approved WhatsApp templates — one per courier
        </div>
      </div>

      {/* courier tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        borderBottom: '1px solid #e6e8ee',
        marginBottom: '22px'
      }}>
        {[
          { key: 'anjani', label: 'Anjani' },
          { key: 'dtdc',   label: 'DTDC'   },
          { key: 'maruti', label: 'Maruti' },
          { key: 'others', label: 'Others' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: '13px',
              fontWeight: activeTab === tab.key ? '600' : '500',
              color: activeTab === tab.key ? '#128C7E' : '#4b5160',
              borderBottom: activeTab === tab.key ? '2px solid #128C7E' : '2px solid transparent',
              marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* two column layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gap: '16px',
        alignItems: 'start'
      }}>
      {/* left column - template details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* template info card */}
          <div style={{
            background: '#ffffff', border: '1px solid #e6e8ee',
            borderRadius: '14px', padding: '18px',
            boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '14px'
            }}>
              <span style={{ fontWeight: '700', fontSize: '15px', fontFamily: 'JetBrains Mono, monospace' }}>
                {t.name}
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span style={{
                  padding: '3px 8px', borderRadius: '999px',
                  fontSize: '11.5px', fontWeight: '600',
                  background: '#f3f4f7', color: '#4b5160'
                }}>{t.category}</span>
                <span style={{
                  padding: '3px 8px', borderRadius: '999px',
                  fontSize: '11.5px', fontWeight: '600',
                  background: 'rgba(18,140,126,0.1)', color: '#128C7E'
                }}>✓ {t.status}</span>
              </div>
            </div>

            {/* raw template text */}
            <div style={{ fontSize: '12px', color: '#7a8090', marginBottom: '8px', fontWeight: '500' }}>
              Raw template text
            </div>
            <div style={{
              background: '#f6f7f9', border: '1px solid #e6e8ee',
              borderRadius: '8px', padding: '14px',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '12.5px', lineHeight: '1.65',
              color: '#4b5160', whiteSpace: 'pre-wrap',
              textAlign: 'left'
            }}>
              {'Hello '}
              <span style={{ background: 'rgba(18,140,126,0.1)', color: '#128C7E', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>{'{{name}}'}</span>
              {`, your order shipped via ${t.courier}.\nYOUR tracking id: `}
              <span style={{ background: 'rgba(18,140,126,0.1)', color: '#128C7E', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>{'{{tracking_id}}'}</span>
              {'\nTrack here: '}
              <span style={{ background: 'rgba(18,140,126,0.1)', color: '#128C7E', padding: '1px 5px', borderRadius: '4px', fontWeight: '600' }}>{'{{tracking_link}}'}</span>
              {' 🚚\nThank you for shopping with us!'}
            </div>
          </div>

          {/* variable mapping card */}
          <div style={{
            background: '#ffffff', border: '1px solid #e6e8ee',
            borderRadius: '14px', padding: '18px',
            boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '14px'
            }}>
              <span style={{ fontWeight: '700', fontSize: '14.5px' }}>Variable mapping</span>
              <span style={{ fontSize: '12px', color: '#7a8090' }}>From Google Sheets</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <tbody>
                {[
                  { var: '{{name}}',          col: 'Column A', desc: 'Customer Name' },
                  { var: '{{tracking_id}}',   col: 'Column D', desc: 'Tracking ID'   },
                  { var: '{{tracking_link}}', col: 'Column E', desc: 'Tracking Link' },
                ].map(row => (
                  <tr key={row.var} style={{ borderBottom: '1px solid #f3f4f7' }}>
                    <td style={{ padding: '10px 0', width: '140px' }}>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        color: '#128C7E', fontSize: '12.5px', fontWeight: '600'
                      }}>{row.var}</span>
                    </td>
                    <td style={{ padding: '10px', color: '#7a8090', fontSize: '12px' }}>
                      → {row.col} ({row.desc})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* right column - whatsapp phone mockup */}
        <div style={{
          background: '#11141c',
          border: '1px solid #e6e8ee',
          borderRadius: '14px',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {/* phone frame */}
          <div style={{
            width: '260px',
            background: '#0b0f15',
            border: '7px solid #1f242f',
            borderRadius: '32px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
          }}>

            {/* whatsapp header */}
            <div style={{
              background: '#1f2c33',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '32px', height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: '#fff',
                fontWeight: '800', fontSize: '13px'
              }}>
                {t.sender[0]}
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>
                  {t.sender} ✓
                </div>
                <div style={{ color: '#8696a0', fontSize: '11px' }}>Business account</div>
              </div>
            </div>

            {/* chat body */}
            <div style={{
              background: '#0b141a',
              padding: '16px 12px',
              minHeight: '280px'
            }}>
              {/* message bubble */}
              <div style={{
                background: '#1f2c33',
                padding: '10px 12px',
                borderRadius: '0 8px 8px 8px',
                fontSize: '12.5px',
                lineHeight: '1.5',
                color: '#e9edf0',
                maxWidth: '90%',
                position: 'relative'
              }}>
                {/* triangle */}
                <div style={{
                  position: 'absolute', top: 0, left: '-6px',
                  borderTop: '6px solid #1f2c33',
                  borderLeft: '6px solid transparent'
                }}></div>

                Hello <span style={{ color: '#25D366', fontWeight: '600' }}>{t.preview.name}</span>, your order shipped via <span style={{ color: '#25D366', fontWeight: '600' }}>{t.preview.courier}</span>.
                <br /><br />
                YOUR tracking id: <span style={{ color: '#25D366', fontWeight: '600' }}>{t.preview.tracking_id}</span>
                <br />
                Track here: <span style={{ color: '#25D366', fontWeight: '600' }}>{t.preview.tracking_link}</span> 🚚
                <br /><br />
                Thank you for shopping with us!

                <div style={{ textAlign: 'right', fontSize: '10px', color: '#8696a0', marginTop: '4px' }}>
                  10:42 AM ✓✓
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Templates