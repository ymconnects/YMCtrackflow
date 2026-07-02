import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Download, RotateCcw } from 'lucide-react'
import { getCampaignHistory, getCampaignRecipients, getCampaignStatus, retryCampaign } from '../utils/api'
import { getErrorLabel } from '../utils/formatters'

const CampaignDetail = ({ onPageChange }) => {
  useEffect(() => { onPageChange('campaigns') }, [onPageChange])

  const { id } = useParams()
  const navigate = useNavigate()
  const pollRef = useRef(null)

  const [campaign, setCampaign]         = useState(null)
  const [recipients, setRecipients]     = useState([])
  const [filter, setFilter]             = useState('All')
  const [loading, setLoading]           = useState(true)
  const [retrying, setRetrying]         = useState(false)

  const loadRecipients = async () => {
    try {
      const res = await getCampaignRecipients(id)
      if (res.data.success) setRecipients(res.data.recipients)
    } catch {}
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getCampaignHistory().then(res => {
        if (res.data.success) {
          const c = res.data.campaigns.find(c => String(c.id) === String(id))
          if (c) setCampaign(c)
        }
      }).catch(() => {}),
      loadRecipients()
    ]).finally(() => setLoading(false))

    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [id])

  const handleRetry = async () => {
    setRetrying(true)
    try {
      await retryCampaign(id)
      pollRef.current = setInterval(async () => {
        try {
          const statusRes = await getCampaignStatus(id)
          if (statusRes.data.success) {
            const d = statusRes.data
            setCampaign(prev => prev ? { ...prev, status: d.status, sent: d.sent, failed: d.failed } : prev)
            if (d.status === 'DONE' || d.status === 'PAUSED') {
              clearInterval(pollRef.current)
              setRetrying(false)
              await loadRecipients()
            }
          }
        } catch {
          clearInterval(pollRef.current)
          setRetrying(false)
        }
      }, 3000)
    } catch {
      setRetrying(false)
    }
  }

  const handleDownloadCSV = () => {
    if (!recipients.length) return
    const rows = [['Name', 'Phone', 'Status', 'Error Code'], ...recipients.map(r => [r.name, r.phone, r.status, r.error_code || ''])]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `campaign_${id}_recipients.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredRecipients = recipients.filter(r => {
    if (filter === 'Sent') return r.status === 'SENT'
    if (filter === 'Delivered') return r.status === 'DELIVERED'
    if (filter === 'Failed') return r.status === 'FAILED'
    return true
  })

  const campaignStatusBadge = (status) => {
    const colors = {
      DRAFT:    { bg: 'rgba(122,128,144,0.10)', color: '#7a8090', border: 'rgba(122,128,144,0.25)' },
      SENDING:  { bg: 'rgba(37,99,235,0.10)',   color: '#2563eb', border: 'rgba(37,99,235,0.25)' },
      RETRYING: { bg: 'rgba(37,99,235,0.10)',   color: '#2563eb', border: 'rgba(37,99,235,0.25)' },
      DONE:     { bg: 'rgba(18,140,126,0.10)',  color: '#128C7E', border: 'rgba(18,140,126,0.25)' },
      FAILED:   { bg: 'rgba(220,38,38,0.10)',   color: '#dc2626', border: 'rgba(220,38,38,0.25)' },
      PAUSED:   { bg: 'rgba(234,88,12,0.10)',   color: '#ea580c', border: 'rgba(234,88,12,0.25)' },
    }
    const c = colors[status] || colors.DRAFT
    return {
      display: 'inline-block', padding: '3px 10px', borderRadius: '20px',
      fontSize: '12px', fontWeight: '700',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }
  }

  const statusBadge = (status) => {
    const colors = {
      SENT:      { bg: 'rgba(18,140,126,0.10)', color: '#128C7E', border: 'rgba(18,140,126,0.25)' },
      FAILED:    { bg: 'rgba(220,38,38,0.10)',  color: '#dc2626', border: 'rgba(220,38,38,0.25)' },
      DELIVERED: { bg: 'rgba(37,99,235,0.10)',  color: '#2563eb', border: 'rgba(37,99,235,0.25)' },
      NO:        { bg: 'rgba(122,128,144,0.10)', color: '#7a8090', border: 'rgba(122,128,144,0.25)' }
    }
    const c = colors[status] || colors.NO
    return {
      display: 'inline-block', padding: '2px 9px', borderRadius: '20px',
      fontSize: '11.5px', fontWeight: '700',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`
    }
  }

  const filterBtn = (active) => ({
    height: '30px', padding: '0 14px',
    background: active ? '#128C7E' : '#f6f7f9',
    border: `1px solid ${active ? '#128C7E' : '#e6e8ee'}`,
    borderRadius: '6px', fontSize: '12.5px', fontWeight: '600',
    color: active ? '#ffffff' : '#4b5160',
    cursor: 'pointer', fontFamily: 'inherit'
  })

  const th = {
    padding: '9px 14px', fontSize: '12px', fontWeight: '700',
    color: '#4b5160', textAlign: 'left', whiteSpace: 'nowrap'
  }

  const td = {
    padding: '9px 14px', fontSize: '13px', color: '#0f1117',
    borderBottom: '1px solid #f0f1f4'
  }

  return (
    <div style={{ maxWidth: '1100px' }}>
      <button
        onClick={() => navigate('/campaigns')}
        style={{
          height: '30px', padding: '0 14px', marginBottom: '16px',
          background: '#f6f7f9', border: '1px solid #e6e8ee', borderRadius: '6px',
          fontSize: '12.5px', fontWeight: '600', color: '#4b5160',
          cursor: 'pointer', fontFamily: 'inherit'
        }}
      >
        ← Back to Campaigns
      </button>

      {loading ? (
        <div style={{ fontSize: '13px', color: '#4b5160' }}>Loading campaign...</div>
      ) : !campaign ? (
        <div style={{ fontSize: '13px', color: '#dc2626' }}>Campaign not found.</div>
      ) : (
        <div style={{
          background: '#ffffff', border: '1px solid #e6e8ee', borderRadius: '12px', padding: '20px'
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '16px', flexWrap: 'wrap', gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{campaign.name}</div>
              <div style={{ fontSize: '12.5px', color: '#7a8090', marginTop: '2px' }}>
                {campaign.template_name} · {campaign.total} recipients · {campaign.sent} sent · {campaign.failed} failed
              </div>
            </div>
            <span style={campaignStatusBadge(campaign.status)}>{campaign.status}</span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: '12px', flexWrap: 'wrap', gap: '8px'
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['All', 'Sent', 'Delivered', 'Failed'].map(f => (
                <button key={f} onClick={() => setFilter(f)} style={filterBtn(filter === f)}>
                  {f}
                  {f === 'All' && ` (${recipients.length})`}
                  {f === 'Sent' && ` (${recipients.filter(r => r.status === 'SENT').length})`}
                  {f === 'Delivered' && ` (${recipients.filter(r => r.status === 'DELIVERED').length})`}
                  {f === 'Failed' && ` (${recipients.filter(r => r.status === 'FAILED').length})`}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {recipients.length > 0 && (
                <button
                  onClick={handleDownloadCSV}
                  title="Download all recipients"
                  style={{
                    width: '30px', height: '30px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: '#f6f7f9', border: '1px solid #e6e8ee',
                    borderRadius: '6px', color: '#4b5160', cursor: 'pointer'
                  }}
                >
                  <Download size={15} />
                </button>
              )}
              {recipients.some(r => r.status === 'FAILED') && (
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  title={retrying ? 'Retrying...' : 'Retry failed'}
                  style={{
                    width: '30px', height: '30px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: retrying ? '#7a8090' : 'rgba(18,140,126,0.08)',
                    border: `1px solid ${retrying ? '#7a8090' : 'rgba(18,140,126,0.25)'}`,
                    borderRadius: '6px', color: retrying ? '#ffffff' : '#128C7E',
                    cursor: retrying ? 'not-allowed' : 'pointer'
                  }}
                >
                  <RotateCcw size={15} />
                </button>
              )}
            </div>
          </div>

          <div style={{ border: '1px solid #e6e8ee', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '40px' }} />
                <col style={{ width: '200px' }} />
                <col style={{ width: '150px' }} />
                <col style={{ width: '130px' }} />
                <col />
              </colgroup>
              <thead style={{ background: '#f6f7f9', borderBottom: '1px solid #e6e8ee' }}>
                <tr>
                  <th style={th}>#</th>
                  <th style={th}>Name</th>
                  <th style={th}>Phone</th>
                  <th style={th}>Status</th>
                  <th style={th}>Error Code</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecipients.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ ...td, textAlign: 'center', color: '#7a8090', padding: '20px' }}>
                      No recipients in this filter.
                    </td>
                  </tr>
                ) : filteredRecipients.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...td, color: '#7a8090' }}>{i + 1}</td>
                    <td style={td}>{r.name || '—'}</td>
                    <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px' }}>{r.phone}</td>
                    <td style={td}><span style={statusBadge(r.status)}>{r.status}</span></td>
                    <td style={{ ...td, color: '#7a8090', fontSize: '12px' }}>{getErrorLabel(r.error_code)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignDetail
