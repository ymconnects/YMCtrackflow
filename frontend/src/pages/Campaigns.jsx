// Campaigns.jsx
// Bulk WhatsApp campaign management
// Admin and Campaigner only

import { useEffect, useState } from 'react'
import useCampaigns from '../hooks/useCampaigns'
import ToastContainer from '../components/ToastContainer'
import { Plus, Send, X, Download, Megaphone, Users, IndianRupee, CheckCircle } from 'lucide-react'

const Campaigns = ({ role, onPageChange }) => {

  // get campaigns data from hook
  const {
    campaigns,
    loading,
    creating,
    handleCreateCampaign,
    handleSendCampaign,
    handleCancelCampaign
  } = useCampaigns()

  // modal open/close state
  const [showModal, setShowModal] = useState(false)

  // new campaign form fields
 const [formData, setFormData] = useState({
    name: '',
    template: '',
    city: '',
    tags: '',
    dateFrom: '',
    dateTo: '',
    schedule: ''
  })

  // tell App.jsx we are on campaigns page
  useEffect(() => {
    onPageChange('campaigns')
  }, [onPageChange])

  // handle form input changes
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // handle campaign creation
  const handleCreate = async () => {
    if (!formData.name || !formData.template) {
      ToastContainer.addToast('Please fill campaign name and template', 'error')
      return
    }
    const result = await handleCreateCampaign(formData)
    if (result.success) {
      ToastContainer.addToast(result.message, 'success')
      setShowModal(false)
      setFormData({ name: '', template: '', city: '', tags: '', schedule: '' })
    } else {
      ToastContainer.addToast(result.message, 'error')
    }
  }

  // handle send campaign
  const handleSend = async (campaignId) => {
    const result = await handleSendCampaign(campaignId)
    if (result.success) {
      ToastContainer.addToast(result.message, 'success')
    } else {
      ToastContainer.addToast(result.message, 'error')
    }
  }

  // handle cancel campaign
  const handleCancel = async (campaignId) => {
    const result = await handleCancelCampaign(campaignId)
    if (result.success) {
      ToastContainer.addToast(result.message, 'success')
    } else {
      ToastContainer.addToast(result.message, 'error')
    }
  }

  // get status badge style
  const getStatusStyle = (status) => {
    const styles = {
      'Active':    { bg: 'rgba(18,140,126,0.1)',   color: '#128C7E' },
      'Scheduled': { bg: 'rgba(37,99,235,0.1)',    color: '#2563eb' },
      'Paused':    { bg: 'rgba(245,158,11,0.16)',  color: '#b8770b' },
      'Completed': { bg: 'rgba(148,163,184,0.2)',  color: '#4b5160' },
    }
    return styles[status] || styles['Completed']
  }

  // loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '400px',
        color: '#7a8090', fontSize: '14px'
      }}>
        Loading campaigns...
      </div>
    )
  }

  return (
    <div>

      {/* page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: '22px',
            fontWeight: '700', letterSpacing: '-0.01em',
            textAlign: 'left'
          }}>Campaigns</h1>
          <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px' }}>
            Broadcast WhatsApp templates to targeted customer segments.
          </div>
        </div>

        {/* buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => ToastContainer.addToast('Exporting campaigns...', 'info')}
            style={{
              height: '36px', padding: '0 14px',
              background: 'transparent',
              border: '1px solid #e6e8ee',
              borderRadius: '8px', fontWeight: '600',
              fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              gap: '6px', fontFamily: 'inherit', color: '#4b5160'
            }}
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => setShowModal(true)}
            style={{
              height: '36px', padding: '0 14px',
              background: '#128C7E', color: '#ffffff',
              border: 'none', borderRadius: '8px',
              fontWeight: '600', fontSize: '13px',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '6px',
              fontFamily: 'inherit'
            }}
          >
            <Plus size={14} /> New campaign
          </button>
        </div>
      </div>

      {/* 4 stat cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '22px'
      }}>
        {/* active campaigns */}
        <div style={{
          background: '#ffffff', border: '1px solid #e6e8ee',
          borderRadius: '14px', padding: '18px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(18,140,126,0.1)', color: '#128C7E',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Megaphone size={18} /></div>
          </div>
          <div style={{ fontSize: '12.5px', color: '#4b5160', fontWeight: '600' }}>Active campaigns</div>
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '2px 0', fontFamily: 'JetBrains Mono, monospace' }}>
            {campaigns.filter(c => c.status === 'Active').length}
          </div>
          <div style={{ fontSize: '11.5px', color: '#128C7E' }}>↑ running now</div>
        </div>

        {/* total contacts */}
        <div style={{
          background: '#ffffff', border: '1px solid #e6e8ee',
          borderRadius: '14px', padding: '18px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(37,99,235,0.1)', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><Users size={18} /></div>
          </div>
          <div style={{ fontSize: '12.5px', color: '#4b5160', fontWeight: '600' }}>Total contacts</div>
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '2px 0', fontFamily: 'JetBrains Mono, monospace' }}>0</div>
          <div style={{ fontSize: '11.5px', color: '#7a8090' }}>All segments</div>
        </div>

        {/* cost this month */}
        <div style={{
          background: '#ffffff', border: '1px solid #e6e8ee',
          borderRadius: '14px', padding: '18px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(245,158,11,0.16)', color: '#b8770b',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><IndianRupee size={18} /></div>
          </div>
          <div style={{ fontSize: '12.5px', color: '#4b5160', fontWeight: '600' }}>Cost this month</div>
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '2px 0', fontFamily: 'JetBrains Mono, monospace' }}>₹0</div>
          <div style={{ fontSize: '11.5px', color: '#7a8090' }}>₹0.88 per msg</div>
        </div>

        {/* avg delivery rate */}
        <div style={{
          background: '#ffffff', border: '1px solid #e6e8ee',
          borderRadius: '14px', padding: '18px',
          boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'rgba(18,140,126,0.1)', color: '#128C7E',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}><CheckCircle size={18} /></div>
          </div>
          <div style={{ fontSize: '12.5px', color: '#4b5160', fontWeight: '600' }}>Avg delivery rate</div>
          <div style={{ fontSize: '28px', fontWeight: '700', letterSpacing: '-0.02em', margin: '2px 0', fontFamily: 'JetBrains Mono, monospace' }}>0%</div>
          <div style={{ fontSize: '11.5px', color: '#7a8090' }}>Across all campaigns</div>
        </div>
      </div>

      {/* campaigns grid */}
      {campaigns.length === 0 ? (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e6e8ee',
          borderRadius: '14px',
          padding: '48px',
          textAlign: 'center',
          color: '#7a8090'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📣</div>
          <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px' }}>
            No campaigns yet
          </div>
          <div style={{ fontSize: '13px' }}>
            Click New campaign to create your first bulk WhatsApp campaign
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          {campaigns.map(campaign => {
            const sent = campaign.sent_count || 0
            const failed = campaign.failed_count || 0
            const total = campaign.audience_count || 0
            const remaining = total - sent - failed
            const pct = total > 0 ? Math.round((sent / total) * 100) : 0
            const cost = (sent * 0.88).toFixed(2)
            const s = getStatusStyle(campaign.status)

            return (
              <div key={campaign.id} style={{
                background: '#ffffff',
                border: '1px solid #e6e8ee',
                borderRadius: '14px',
                padding: '18px',
                boxShadow: '0 1px 2px rgba(15,17,23,0.04)'
              }}>
                {/* campaign header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                  <div style={{ fontWeight: '700', fontSize: '15px' }}>{campaign.name}</div>
                  <span style={{
                    padding: '3px 9px', borderRadius: '999px',
                    fontSize: '11.5px', fontWeight: '600',
                    background: s.bg, color: s.color,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, display: 'inline-block' }}></span>
                    {campaign.status}
                  </span>
                </div>

                {/* meta info */}
                <div style={{ fontSize: '12px', color: '#7a8090', marginBottom: '14px' }}>
                  Template: {campaign.template} · {total.toLocaleString('en-IN')} contacts
                </div>

                {/* progress */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#7a8090', marginBottom: '6px', fontFamily: 'JetBrains Mono, monospace' }}>
                  <span>{sent.toLocaleString('en-IN')} of {total.toLocaleString('en-IN')} sent</span>
                  <span>{pct}%</span>
                </div>
                <div style={{ height: '6px', background: '#f3f4f7', borderRadius: '999px', overflow: 'hidden', marginBottom: '14px' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: '#128C7E', borderRadius: '999px' }}></div>
                </div>

                {/* stats row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '4px', paddingTop: '14px',
                  borderTop: '1px solid #e6e8ee', marginBottom: '14px'
                }}>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#128C7E' }}>{sent.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '11px', color: '#7a8090' }}>Sent</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#dc2626' }}>{failed}</div>
                    <div style={{ fontSize: '11px', color: '#7a8090' }}>Failed</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>{remaining.toLocaleString('en-IN')}</div>
                    <div style={{ fontSize: '11px', color: '#7a8090' }}>Remaining</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#128C7E' }}>₹{cost}</div>
                    <div style={{ fontSize: '11px', color: '#7a8090' }}>Cost</div>
                  </div>
                </div>

                {/* action buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSend(campaign.id)}
                    style={{
                      height: '30px', padding: '0 12px',
                      background: '#128C7E', color: '#ffffff',
                      border: 'none', borderRadius: '7px',
                      fontSize: '12px', fontWeight: '600',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', gap: '5px',
                      fontFamily: 'inherit'
                    }}
                  >
                    <Send size={11} /> Send
                  </button>
                  <button
                    onClick={() => handleCancel(campaign.id)}
                    style={{
                      height: '30px', padding: '0 12px',
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      borderRadius: '7px', fontSize: '12px',
                      fontWeight: '600', cursor: 'pointer',
                      display: 'flex', alignItems: 'center',
                      gap: '5px', fontFamily: 'inherit', color: '#dc2626'
                    }}
                  >
                    <X size={11} /> Cancel
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* new campaign modal */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15,17,23,0.42)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 50
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{
            width: 'min(560px, 92vw)',
            maxHeight: '90vh',
            background: '#ffffff',
            border: '1px solid #d9dde4',
            borderRadius: '16px',
            boxShadow: '0 30px 80px rgba(15,17,23,0.18)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>

            {/* modal header */}
            <div style={{
              padding: '20px 22px',
              borderBottom: '1px solid #e6e8ee',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: '700',textAlign: 'left' }}>
                  New campaign
                </h3>
                <div style={{ fontSize: '13px', color: '#7a8090' }}>
                  Configure audience, template and schedule
                </div>
              </div>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#7a8090' }}>
                <X size={18} />
              </button>
            </div>

            {/* modal body */}
            <div style={{ padding: '22px', overflowY: 'auto', flex: 1 ,textAlign: 'left'}}>

              {/* campaign name */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' ,textAlign: 'left'}}>
                  Campaign name
                </label>
                <input
                  value={formData.name}
                  onChange={e => handleFormChange('name', e.target.value)}
                  placeholder='e.g. Eid sale announcement'
                  style={{
                    width: '100%', height: '40px', padding: '0 12px',
                    background: '#eef0f4', border: '1px solid #d9dde4',
                    borderRadius: '8px', fontFamily: 'inherit',
                    fontSize: '13px', color: '#0f1117', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* template dropdown */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' }}>
                  Template
                </label>
                <select
                  value={formData.template}
                  onChange={e => handleFormChange('template', e.target.value)}
                  style={{
                    width: '100%', height: '40px', padding: '0 12px',
                    background: '#eef0f4', border: '1px solid #d9dde4',
                    borderRadius: '8px', fontFamily: 'inherit',
                    fontSize: '13px', color: '#0f1117', outline: 'none',
                    boxSizing: 'border-box', cursor: 'pointer'
                  }}
                >
                  
                  <option value=''>Select campaign template</option>
                  <option value='eid_sale_2025'>eid_sale_2025 — Approved</option>
                  <option value='new_arrivals_v1'>new_arrivals_v1 — Approved</option>
                  <option value='flash_sale_v2'>flash_sale_v2 — Approved</option>
                  <option value='reengagement_v1'>reengagement_v1 — Approved</option>
                </select>
              </div>

              {/* city and tags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' }}>
                    Filter by city
                  </label>
                  <input
                    value={formData.city}
                    onChange={e => handleFormChange('city', e.target.value)}
                    placeholder='e.g. Jaipur'
                    style={{
                      width: '100%', height: '40px', padding: '0 12px',
                      background: '#eef0f4', border: '1px solid #d9dde4',
                      borderRadius: '8px', fontFamily: 'inherit',
                      fontSize: '13px', color: '#0f1117', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' }}>
                    Filter by tag
                  </label>
                  <input
                    value={formData.tags}
                    onChange={e => handleFormChange('tags', e.target.value)}
                    placeholder='e.g. vip, repeat'
                    style={{
                      width: '100%', height: '40px', padding: '0 12px',
                      background: '#eef0f4', border: '1px solid #d9dde4',
                      borderRadius: '8px', fontFamily: 'inherit',
                      fontSize: '13px', color: '#0f1117', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* date range */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' }}>
                    Date range — from
                  </label>
                  <input
                    type='date'
                    value={formData.dateFrom}
                    onChange={e => handleFormChange('dateFrom', e.target.value)}
                    style={{
                      width: '100%', height: '40px', padding: '0 12px',
                      background: '#eef0f4', border: '1px solid #d9dde4',
                      borderRadius: '8px', fontFamily: 'inherit',
                      fontSize: '13px', color: '#0f1117', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' }}>
                    Date range — to
                  </label>
                  <input
                    type='date'
                    value={formData.dateTo}
                    onChange={e => handleFormChange('dateTo', e.target.value)}
                    style={{
                      width: '100%', height: '40px', padding: '0 12px',
                      background: '#eef0f4', border: '1px solid #d9dde4',
                      borderRadius: '8px', fontFamily: 'inherit',
                      fontSize: '13px', color: '#0f1117', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* schedule send */}
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#4b5160', marginBottom: '6px' }}>
                  Schedule send (leave empty = send now)
                </label>
                <input
                  type='datetime-local'
                  value={formData.schedule}
                  onChange={e => handleFormChange('schedule', e.target.value)}
                  style={{
                    width: '100%', height: '40px', padding: '0 12px',
                    background: '#eef0f4', border: '1px solid #d9dde4',
                    borderRadius: '8px', fontFamily: 'inherit',
                    fontSize: '13px', color: '#0f1117', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* estimated audience and cost */}
              <div style={{
                background: '#f6f7f9',
                border: '1px solid #e6e8ee',
                borderRadius: '10px',
                padding: '14px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#7a8090', marginBottom: '4px' }}>
                    Estimated audience
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#128C7E', fontFamily: 'JetBrains Mono, monospace' }}>
                    0 contacts
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#7a8090', marginBottom: '4px' }}>
                    Estimated cost · ₹0.88/msg
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#128C7E', fontFamily: 'JetBrains Mono, monospace' }}>
                    ₹0.00
                  </div>
                </div>
              </div>
            </div>

            {/* modal footer */}
            <div style={{
              padding: '16px 22px',
              borderTop: '1px solid #e6e8ee',
              display: 'flex', justifyContent: 'flex-end',
              gap: '8px'
            }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  height: '38px', padding: '0 16px',
                  background: 'transparent',
                  border: '1px solid #d9dde4',
                  borderRadius: '8px', fontWeight: '600',
                  fontSize: '13px', cursor: 'pointer',
                  fontFamily: 'inherit', color: '#4b5160'
                }}
              >Cancel</button>
              <button
                onClick={handleCreate}
                disabled={creating}
                style={{
                  height: '38px', padding: '0 16px',
                  background: creating ? '#7a8090' : '#128C7E',
                  color: '#ffffff', border: 'none',
                  borderRadius: '8px', fontWeight: '600',
                  fontSize: '13px', cursor: creating ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', display: 'flex',
                  alignItems: 'center', gap: '6px'
                }}
              >
                <Send size={13} />
                {creating ? 'Creating...' : 'Launch campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default Campaigns
