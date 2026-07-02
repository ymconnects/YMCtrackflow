import { useState, useEffect, useRef } from 'react'
import { uploadContacts, getContactBooks, getBookColumns, getTemplates, createCampaign, sendCampaign, retryCampaign, getCampaignStatus, getBookContacts, getCampaignRecipients, deleteContactBook, getCampaignHistory, deleteCampaign } from '../utils/api'

function getErrorLabel(code) {
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

const Campaigns = ({ role, onPageChange }) => {
  useEffect(() => { onPageChange('campaigns') }, [onPageChange])

  const pollIntervalRef = useRef(null)
  const histPollRef    = useRef(null)

  // section 1 — upload
  const [bookName, setBookName]   = useState('')
  const [csvFile, setCsvFile]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)

  // section 1b — saved contact books viewer
  const [viewingBookId, setViewingBookId]     = useState(null)
  const [viewingBookName, setViewingBookName] = useState('')
  const [bookContacts, setBookContacts]       = useState([])
  const [loadingContacts, setLoadingContacts] = useState(false)

  // section 2 — create & send
  const [books, setBooks]                     = useState([])
  const [selectedBookId, setSelectedBookId]   = useState('')
  const [columns, setColumns]                 = useState([])
  const [campName, setCampName]               = useState('')
  const [allTemplates, setAllTemplates]       = useState([])
  const [selectedTemplateName, setSelectedTemplateName] = useState('')
  const [templateVars, setTemplateVars]       = useState([])
  const [variableMap, setVariableMap]         = useState({})
  const [creating, setCreating]               = useState(false)
  const [polling, setPolling]                 = useState(false)
  const [pollProgress, setPollProgress]       = useState(null)
  const [errorMsg, setErrorMsg]               = useState(null)

  // section 2b — per-recipient results
  const [completedCampaignId, setCompletedCampaignId] = useState(null)
  const [recipients, setRecipients]                   = useState([])
  const [recipientFilter, setRecipientFilter]         = useState('All')
  const [loadingRecipients, setLoadingRecipients]     = useState(false)
  const [retrying, setRetrying]                       = useState(false)

  // campaign history
  const [history, setHistory]                       = useState([])
  const [loadingHistory, setLoadingHistory]         = useState(false)
  const [histViewId, setHistViewId]                 = useState(null)
  const [histRecipients, setHistRecipients]         = useState([])
  const [histLoadingRecipients, setHistLoadingRecipients] = useState(false)
  const [histFilter, setHistFilter]                 = useState('All')
  const [resumingId, setResumingId]                 = useState(null)

  // load books + templates + history on mount; clean up interval on unmount
  useEffect(() => {
    loadBooks()
    loadTemplates()
    loadHistory()
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      if (histPollRef.current)    clearInterval(histPollRef.current)
    }
  }, [])

  const loadBooks = () => {
    getContactBooks()
      .then(res => { if (res.data.success) setBooks(res.data.books) })
      .catch(() => {})
  }

  const loadTemplates = () => {
    getTemplates()
      .then(res => {
        if (res.data.success)
          setAllTemplates(res.data.templates.filter(t => t.status === 'APPROVED'))
      })
      .catch(() => {})
  }

  const loadHistory = () => {
    setLoadingHistory(true)
    getCampaignHistory()
      .then(res => { if (res.data.success) setHistory(res.data.campaigns) })
      .catch(() => {})
      .finally(() => setLoadingHistory(false))
  }

  const handleViewHistoryCampaign = async (c) => {
    if (histViewId === c.id) {
      setHistViewId(null)
      setHistRecipients([])
      return
    }
    setHistViewId(c.id)
    setHistFilter('All')
    setHistLoadingRecipients(true)
    setHistRecipients([])
    try {
      const res = await getCampaignRecipients(c.id)
      if (res.data.success) setHistRecipients(res.data.recipients)
    } catch {}
    setHistLoadingRecipients(false)
  }

  const handleResumeCampaign = async (c) => {
    setResumingId(c.id)
    try {
      await sendCampaign(c.id)
      histPollRef.current = setInterval(async () => {
        try {
          const statusRes = await getCampaignStatus(c.id)
          if (statusRes.data.success) {
            const d = statusRes.data
            setHistory(prev => prev.map(h =>
              h.id === c.id ? { ...h, status: d.status, sent: d.sent, failed: d.failed } : h
            ))
            if (d.status === 'DONE' || d.status === 'PAUSED') {
              clearInterval(histPollRef.current)
              setResumingId(null)
            }
          }
        } catch {
          clearInterval(histPollRef.current)
          setResumingId(null)
        }
      }, 3000)
    } catch {
      setResumingId(null)
    }
  }

  const handleDeleteCampaign = async (c) => {
    if (!window.confirm(`Delete campaign "${c.name}" and all its recipients?`)) return
    try {
      const res = await deleteCampaign(c.id)
      if (res.data.success) {
        setHistory(prev => prev.filter(h => h.id !== c.id))
        if (histViewId === c.id) { setHistViewId(null); setHistRecipients([]) }
      }
    } catch {}
  }

  // fetch columns when book changes
  useEffect(() => {
    if (!selectedBookId) { setColumns([]); return }
    getBookColumns(selectedBookId)
      .then(res => { if (res.data.success) setColumns(res.data.columns) })
      .catch(() => setColumns(['name', 'phone']))
  }, [selectedBookId])

  // extract {{N}} variables when template changes
  useEffect(() => {
    if (!selectedTemplateName) {
      setTemplateVars([])
      setVariableMap({})
      return
    }
    const t = allTemplates.find(t => t.name === selectedTemplateName)
    if (!t) { setTemplateVars([]); setVariableMap({}); return }
    const body = (t.components || []).find(c => c.type === 'BODY')
    const bodyText = body?.text || ''
    const matches = [...bodyText.matchAll(/\{\{(\d+)\}\}/g)]
    const vars = [...new Set(matches.map(m => m[1]))].sort((a, b) => +a - +b)
    setTemplateVars(vars)
    setVariableMap({})
  }, [selectedTemplateName, allTemplates])

  const handleUpload = async () => {
    if (!bookName || !csvFile) return
    setUploading(true)
    setUploadMsg(null)
    try {
      const formData = new FormData()
      formData.append('file', csvFile)
      formData.append('book_name', bookName)
      const res = await uploadContacts(formData)
      if (res.data.success) {
        setUploadMsg(`Book saved — ${res.data.total_contacts} contacts loaded`)
        setBookName('')
        setCsvFile(null)
        loadBooks()
      } else {
        setUploadMsg(`Error: ${res.data.message}`)
      }
    } catch {
      setUploadMsg('Upload failed')
    }
    setUploading(false)
  }

  const handleViewBook = async (book) => {
    if (viewingBookId === book.id) {
      setViewingBookId(null)
      setBookContacts([])
      return
    }
    setViewingBookId(book.id)
    setViewingBookName(book.name)
    setLoadingContacts(true)
    setBookContacts([])
    try {
      const res = await getBookContacts(book.id)
      if (res.data.success) setBookContacts(res.data.contacts)
    } catch {}
    setLoadingContacts(false)
  }

  const handleDeleteBook = async (book) => {
    if (!window.confirm('Delete this book and all its contacts?')) return
    try {
      const res = await deleteContactBook(book.id)
      if (res.data.success) {
        setBooks(prev => prev.filter(b => b.id !== book.id))
        if (viewingBookId === book.id) { setViewingBookId(null); setBookContacts([]) }
      }
    } catch {}
  }

  const handleCreateAndSend = async () => {
    setCreating(true)
    setErrorMsg(null)
    setPollProgress(null)
    setRecipients([])
    setCompletedCampaignId(null)
    setRecipientFilter('All')
    try {
      const createRes = await createCampaign({
        name: campName,
        template_name: selectedTemplateName,
        book_id: selectedBookId,
        variables: variableMap
      })
      if (!createRes.data.success) {
        setErrorMsg(createRes.data.message || 'Create failed')
        setCreating(false)
        return
      }
      const cid = createRes.data.campaign_id
      await sendCampaign(cid)
      setCreating(false)
      setPolling(true)
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await getCampaignStatus(cid)
          if (statusRes.data.success) {
            const d = statusRes.data
            setPollProgress({ status: d.status, sent: d.sent, failed: d.failed, total: d.total })
            if (d.status === 'DONE' || d.status === 'PAUSED') {
              clearInterval(pollIntervalRef.current)
              setPolling(false)
              setCompletedCampaignId(cid)
              setLoadingRecipients(true)
              try {
                const rRes = await getCampaignRecipients(cid)
                if (rRes.data.success) setRecipients(rRes.data.recipients)
              } catch {}
              setLoadingRecipients(false)
            }
          }
        } catch {
          clearInterval(pollIntervalRef.current)
          setPolling(false)
          setErrorMsg('Status polling failed')
        }
      }, 3000)
    } catch {
      setErrorMsg('Failed to start campaign')
      setCreating(false)
    }
  }

  const handleRetryCampaign = async (campaignId) => {
    setRetrying(true)
    try {
      await retryCampaign(campaignId)
      pollIntervalRef.current = setInterval(async () => {
        try {
          const statusRes = await getCampaignStatus(campaignId)
          if (statusRes.data.success) {
            const d = statusRes.data
            setPollProgress({ status: d.status, sent: d.sent, failed: d.failed, total: d.total })
            if (d.status === 'DONE' || d.status === 'PAUSED') {
              clearInterval(pollIntervalRef.current)
              setRetrying(false)
              setLoadingRecipients(true)
              try {
                const rRes = await getCampaignRecipients(campaignId)
                if (rRes.data.success) setRecipients(rRes.data.recipients)
              } catch {}
              setLoadingRecipients(false)
            }
          }
        } catch {
          clearInterval(pollIntervalRef.current)
          setRetrying(false)
        }
      }, 3000)
    } catch {
      setRetrying(false)
    }
  }

  const handleDownloadFailedCSV = () => {
    const failed = recipients.filter(r => r.status === 'FAILED')
    if (!failed.length) return
    const rows = [['Name', 'Phone', 'Error Code'], ...failed.map(r => [r.name, r.phone, r.error_code || ''])]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `failed_recipients_${completedCampaignId}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredRecipients = recipients.filter(r => {
    if (recipientFilter === 'Sent') return r.status === 'SENT'
    if (recipientFilter === 'Failed') return r.status === 'FAILED'
    return true
  })

  const isReadyToSend = selectedBookId && campName && selectedTemplateName &&
    templateVars.every(v => variableMap[v])

  // shared styles
  const card = {
    background: '#ffffff',
    border: '1px solid #e6e8ee',
    borderRadius: '14px',
    padding: '20px 24px',
    boxShadow: '0 1px 2px rgba(15,17,23,0.04)',
    marginBottom: '16px'
  }

  const inputStyle = {
    height: '38px',
    padding: '0 12px',
    background: '#ffffff',
    border: '1px solid #e6e8ee',
    borderRadius: '10px',
    color: '#0f1117',
    fontFamily: 'inherit',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box'
  }

  const primaryBtn = (disabled) => ({
    height: '36px',
    padding: '0 18px',
    background: disabled ? '#7a8090' : '#128C7E',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: '#ffffff',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  })

  const lbl = {
    display: 'block',
    fontSize: '12.5px',
    fontWeight: '600',
    color: '#4b5160',
    marginBottom: '6px'
  }

  const notice = (isError) => ({
    marginTop: '12px',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    background: isError ? 'rgba(220,38,38,0.08)' : 'rgba(18,140,126,0.08)',
    color: isError ? '#dc2626' : '#128C7E',
    border: `1px solid ${isError ? 'rgba(220,38,38,0.2)' : 'rgba(18,140,126,0.2)'}`
  })

  const tblHeader = {
    background: '#f6f7f9',
    borderBottom: '1px solid #e6e8ee'
  }

  const th = {
    padding: '9px 14px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#4b5160',
    textAlign: 'left',
    whiteSpace: 'nowrap'
  }

  const td = {
    padding: '9px 14px',
    fontSize: '13px',
    color: '#0f1117',
    borderBottom: '1px solid #f0f1f4'
  }

  const campaignStatusBadge = (status) => {
    const colors = {
      DRAFT:   { bg: 'rgba(122,128,144,0.10)', color: '#7a8090', border: 'rgba(122,128,144,0.25)' },
      SENDING: { bg: 'rgba(37,99,235,0.10)',   color: '#2563eb', border: 'rgba(37,99,235,0.25)' },
      DONE:    { bg: 'rgba(18,140,126,0.10)',  color: '#128C7E', border: 'rgba(18,140,126,0.25)' },
      FAILED:  { bg: 'rgba(220,38,38,0.10)',   color: '#dc2626', border: 'rgba(220,38,38,0.25)' },
      PAUSED:  { bg: 'rgba(234,88,12,0.10)',   color: '#ea580c', border: 'rgba(234,88,12,0.25)' },
    }
    const c = colors[status] || colors.DRAFT
    return {
      display: 'inline-block', padding: '2px 9px', borderRadius: '20px',
      fontSize: '11.5px', fontWeight: '700',
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
      display: 'inline-block',
      padding: '2px 9px',
      borderRadius: '20px',
      fontSize: '11.5px',
      fontWeight: '700',
      background: c.bg,
      color: c.color,
      border: `1px solid ${c.border}`
    }
  }

  const filterBtn = (active) => ({
    height: '30px',
    padding: '0 14px',
    background: active ? '#128C7E' : '#f6f7f9',
    border: `1px solid ${active ? '#128C7E' : '#e6e8ee'}`,
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    color: active ? '#ffffff' : '#4b5160',
    cursor: 'pointer',
    fontFamily: 'inherit'
  })

  const formatDate = (iso) => {
    if (!iso) return '—'
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div>

      {/* page header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em' }}>
          Campaigns
        </h1>
        <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px' }}>
          Upload contacts, create campaigns, and send bulk WhatsApp messages.
        </div>
      </div>

      {/* campaign history */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14.5px', fontWeight: '700' }}>
          Campaign History
        </h3>
        {loadingHistory ? (
          <div style={{ fontSize: '13px', color: '#4b5160' }}>Loading...</div>
        ) : history.length === 0 ? (
          <div style={{ fontSize: '13px', color: '#4b5160' }}>No campaigns yet.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={tblHeader}>
                  <th style={th}>Campaign Name</th>
                  <th style={th}>Template</th>
                  <th style={th}>Total</th>
                  <th style={th}>Sent</th>
                  <th style={th}>Failed</th>
                  <th style={th}>Status</th>
                  <th style={th}>Date</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {history.map(c => (
                  <>
                    <tr key={c.id}>
                      <td style={{ ...td, fontWeight: '600' }}>{c.name}</td>
                      <td style={td}>{c.template_name}</td>
                      <td style={td}>{c.total}</td>
                      <td style={td}>{c.sent}</td>
                      <td style={td}>{c.failed}</td>
                      <td style={td}><span style={campaignStatusBadge(c.status)}>{c.status}</span></td>
                      <td style={{ ...td, color: '#4b5160' }}>{formatDate(c.created_at)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleViewHistoryCampaign(c)}
                            style={{
                              height: '28px', padding: '0 12px',
                              background: histViewId === c.id ? '#128C7E' : '#f6f7f9',
                              border: `1px solid ${histViewId === c.id ? '#128C7E' : '#e6e8ee'}`,
                              borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                              color: histViewId === c.id ? '#ffffff' : '#4b5160',
                              cursor: 'pointer', fontFamily: 'inherit'
                            }}
                          >
                            {histViewId === c.id ? 'Close' : 'View'}
                          </button>
                          {c.status === 'PAUSED' && (
                            <button
                              onClick={() => handleResumeCampaign(c)}
                              disabled={resumingId === c.id}
                              style={{
                                height: '28px', padding: '0 12px',
                                background: resumingId === c.id ? '#7a8090' : 'rgba(18,140,126,0.08)',
                                border: `1px solid ${resumingId === c.id ? '#7a8090' : 'rgba(18,140,126,0.25)'}`,
                                borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                color: resumingId === c.id ? '#ffffff' : '#128C7E',
                                cursor: resumingId === c.id ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit'
                              }}
                            >
                              {resumingId === c.id ? 'Resuming...' : 'Resume'}
                            </button>
                          )}
                          {role === 'admin' && (
                            <button
                              onClick={() => handleDeleteCampaign(c)}
                              style={{
                                height: '28px', padding: '0 12px',
                                background: 'rgba(220,38,38,0.08)',
                                border: '1px solid rgba(220,38,38,0.25)',
                                borderRadius: '6px', fontSize: '12px', fontWeight: '600',
                                color: '#dc2626', cursor: 'pointer', fontFamily: 'inherit'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {histViewId === c.id && (
                      <tr key={`${c.id}-recipients`}>
                        <td colSpan={8} style={{ padding: '0 0 12px 0', borderBottom: '1px solid #f0f1f4' }}>
                          <div style={{
                            margin: '0 0 0 16px', background: '#f6f7f9',
                            border: '1px solid #e6e8ee', borderRadius: '10px', overflow: 'hidden'
                          }}>
                            {histLoadingRecipients ? (
                              <div style={{ padding: '16px', fontSize: '13px', color: '#4b5160' }}>
                                Loading recipients...
                              </div>
                            ) : (
                              <>
                                <div style={{
                                  padding: '10px 14px', display: 'flex', gap: '6px',
                                  alignItems: 'center', borderBottom: '1px solid #e6e8ee'
                                }}>
                                  {['All', 'Sent', 'Failed'].map(f => (
                                    <button key={f} onClick={() => setHistFilter(f)} style={filterBtn(histFilter === f)}>
                                      {f}
                                      {f === 'All' && ` (${histRecipients.length})`}
                                      {f === 'Sent' && ` (${histRecipients.filter(r => r.status === 'SENT').length})`}
                                      {f === 'Failed' && ` (${histRecipients.filter(r => r.status === 'FAILED').length})`}
                                    </button>
                                  ))}
                                </div>
                                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                                    <colgroup>
                                      <col style={{ width: '40px' }} />
                                      <col style={{ width: '160px' }} />
                                      <col style={{ width: '130px' }} />
                                      <col style={{ width: '120px' }} />
                                      <col />
                                    </colgroup>
                                    <thead>
                                      <tr>
                                        <th style={{ ...th, background: '#eff0f3', padding: '8px 10px' }}>#</th>
                                        <th style={{ ...th, background: '#eff0f3', padding: '8px 10px' }}>Name</th>
                                        <th style={{ ...th, background: '#eff0f3', padding: '8px 10px' }}>Phone</th>
                                        <th style={{ ...th, background: '#eff0f3', padding: '8px 10px' }}>Status</th>
                                        <th style={{ ...th, background: '#eff0f3', padding: '8px 10px' }}>Error</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {histRecipients
                                        .filter(r => histFilter === 'All' || r.status === histFilter.toUpperCase())
                                        .map((r, i) => (
                                          <tr key={i}>
                                            <td style={{ ...td, color: '#7a8090', padding: '8px 10px' }}>{i + 1}</td>
                                            <td style={{ ...td, padding: '8px 10px' }}>{r.name || '—'}</td>
                                            <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', padding: '8px 10px' }}>{r.phone}</td>
                                            <td style={{ ...td, padding: '8px 10px' }}><span style={statusBadge(r.status)}>{r.status}</span></td>
                                            <td style={{ ...td, color: '#7a8090', fontSize: '12px', padding: '8px 10px' }}>{getErrorLabel(r.error_code)}</td>
                                          </tr>
                                        ))
                                      }
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* section 1 — upload contacts */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14.5px', fontWeight: '700' }}>
          Upload Contacts
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={lbl}>Book Name</label>
            <input
              value={bookName}
              onChange={e => setBookName(e.target.value)}
              placeholder="e.g. June Students"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#128C7E'}
              onBlur={e => e.target.style.borderColor = '#e6e8ee'}
            />
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={lbl}>CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={e => setCsvFile(e.target.files[0])}
              style={{ ...inputStyle, padding: '6px 12px', cursor: 'pointer' }}
            />
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading || !bookName || !csvFile}
            style={primaryBtn(uploading || !bookName || !csvFile)}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadMsg && (
          <div style={notice(uploadMsg.startsWith('Error'))}>
            {uploadMsg}
          </div>
        )}
      </div>

      {/* section 1b — saved contact books */}
      {books.length > 0 && (
        <div style={card}>
          <h3 style={{ margin: '0 0 16px', fontSize: '14.5px', fontWeight: '700' }}>
            Saved Contact Books
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={tblHeader}>
                  <th style={th}>Book Name</th>
                  <th style={th}>Total Contacts</th>
                  <th style={th}>Created</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {books.map(b => (
                  <>
                    <tr key={b.id}>
                      <td style={{ ...td, fontWeight: '600' }}>{b.name}</td>
                      <td style={td}>{b.total}</td>
                      <td style={{ ...td, color: '#4b5160' }}>{formatDate(b.created_at)}</td>
                      <td style={{ ...td, textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleViewBook(b)}
                            style={{
                              height: '28px',
                              padding: '0 12px',
                              background: viewingBookId === b.id ? '#128C7E' : '#f6f7f9',
                              border: `1px solid ${viewingBookId === b.id ? '#128C7E' : '#e6e8ee'}`,
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                              color: viewingBookId === b.id ? '#ffffff' : '#4b5160',
                              cursor: 'pointer',
                              fontFamily: 'inherit'
                            }}
                          >
                            {viewingBookId === b.id ? 'Close' : 'View'}
                          </button>
                          {role === 'admin' && (
                            <button
                              onClick={() => handleDeleteBook(b)}
                              style={{
                                height: '28px',
                                padding: '0 12px',
                                background: 'rgba(220,38,38,0.08)',
                                border: '1px solid rgba(220,38,38,0.25)',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: '600',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontFamily: 'inherit'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {viewingBookId === b.id && (
                      <tr key={`${b.id}-contacts`}>
                        <td colSpan={4} style={{ padding: '0 0 12px 0', borderBottom: '1px solid #f0f1f4' }}>
                          <div style={{
                            margin: '0 0 0 16px',
                            background: '#f6f7f9',
                            border: '1px solid #e6e8ee',
                            borderRadius: '10px',
                            overflow: 'hidden'
                          }}>
                            {loadingContacts ? (
                              <div style={{ padding: '16px', fontSize: '13px', color: '#4b5160' }}>
                                Loading contacts...
                              </div>
                            ) : (
                              <>
                                <div style={{
                                  padding: '10px 14px',
                                  fontSize: '12px',
                                  fontWeight: '700',
                                  color: '#4b5160',
                                  borderBottom: '1px solid #e6e8ee'
                                }}>
                                  {viewingBookName} — {bookContacts.length} contacts
                                </div>
                                <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                      <tr>
                                        <th style={{ ...th, background: '#eff0f3' }}>#</th>
                                        <th style={{ ...th, background: '#eff0f3' }}>Name</th>
                                        <th style={{ ...th, background: '#eff0f3' }}>Phone</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {bookContacts.map((c, i) => (
                                        <tr key={i}>
                                          <td style={{ ...td, color: '#7a8090', width: '48px' }}>{i + 1}</td>
                                          <td style={td}>{c.name || '—'}</td>
                                          <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px' }}>{c.phone}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* section 2 — create & send campaign */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14.5px', fontWeight: '700' }}>
          Create &amp; Send Campaign
        </h3>

        {/* row 1 — book + campaign name */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={lbl}>Contact Book</label>
            <select
              value={selectedBookId}
              onChange={e => { setSelectedBookId(e.target.value); setVariableMap({}) }}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select a book...</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.total} contacts)</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '180px' }}>
            <label style={lbl}>Campaign Name</label>
            <input
              value={campName}
              onChange={e => setCampName(e.target.value)}
              placeholder="e.g. June Offer"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#128C7E'}
              onBlur={e => e.target.style.borderColor = '#e6e8ee'}
            />
          </div>
        </div>

        {/* row 2 — template */}
        <div style={{ marginBottom: '12px' }}>
          <label style={lbl}>Template (Approved only)</label>
          <select
            value={selectedTemplateName}
            onChange={e => setSelectedTemplateName(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">Select a template...</option>
            {allTemplates.map(t => (
              <option key={t.name} value={t.name}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* variable mapping */}
        {templateVars.length > 0 && (
          <div style={{
            background: '#f6f7f9',
            border: '1px solid #e6e8ee',
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '16px'
          }}>
            <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#4b5160', marginBottom: '12px' }}>
              Variable Mapping — map each template variable to a CSV column
            </div>
            {templateVars.map(v => (
              <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#128C7E',
                  background: 'rgba(18,140,126,0.08)',
                  border: '1px solid rgba(18,140,126,0.2)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  whiteSpace: 'nowrap'
                }}>
                  {`{{${v}}}`}
                </span>
                <span style={{ color: '#7a8090', fontSize: '13px' }}>→</span>
                <select
                  value={variableMap[v] || ''}
                  onChange={e => setVariableMap(prev => ({ ...prev, [v]: e.target.value }))}
                  style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}
                >
                  <option value="">Pick a column...</option>
                  {columns.map(col => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* create & send button */}
        <button
          onClick={handleCreateAndSend}
          disabled={creating || polling || !isReadyToSend}
          style={primaryBtn(creating || polling || !isReadyToSend)}
        >
          {creating ? 'Creating...' : polling ? 'Sending...' : 'Create & Send'}
        </button>

        {/* error */}
        {errorMsg && (
          <div style={notice(true)}>{errorMsg}</div>
        )}

        {/* live progress while polling */}
        {polling && pollProgress && (
          <div style={{
            marginTop: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            background: 'rgba(18,140,126,0.06)',
            border: '1px solid rgba(18,140,126,0.15)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#128C7E', marginBottom: '6px' }}>
              Sending...
            </div>
            <div style={{ fontSize: '13px', color: '#0f1117', fontFamily: 'JetBrains Mono, monospace' }}>
              Sent: {pollProgress.sent}&nbsp;&nbsp;Failed: {pollProgress.failed}&nbsp;&nbsp;/&nbsp;&nbsp;Total: {pollProgress.total}
            </div>
          </div>
        )}

        {/* final result */}
        {!polling && pollProgress && (
          <div style={notice(pollProgress.status === 'PAUSED')}>
            {pollProgress.status === 'PAUSED'
              ? `Paused — Daily limit reached. Sent: ${pollProgress.sent} · Failed: ${pollProgress.failed} · Total: ${pollProgress.total}`
              : `Done — Sent: ${pollProgress.sent} · Failed: ${pollProgress.failed} · Total: ${pollProgress.total}`
            }
          </div>
        )}

        {/* per-recipient results */}
        {(loadingRecipients || recipients.length > 0) && (
          <div style={{ marginTop: '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div style={{ fontSize: '13.5px', fontWeight: '700' }}>
                Recipient Results
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {['All', 'Sent', 'Failed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setRecipientFilter(f)}
                    style={filterBtn(recipientFilter === f)}
                  >
                    {f}
                    {f === 'All' && ` (${recipients.length})`}
                    {f === 'Sent' && ` (${recipients.filter(r => r.status === 'SENT').length})`}
                    {f === 'Failed' && ` (${recipients.filter(r => r.status === 'FAILED').length})`}
                  </button>
                ))}
                {recipients.some(r => r.status === 'FAILED') && (
                  <button
                    onClick={handleDownloadFailedCSV}
                    style={{
                      height: '30px',
                      padding: '0 14px',
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid rgba(220,38,38,0.25)',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    Download Failed CSV
                  </button>
                )}
                {recipients.some(r => r.status === 'FAILED') && (
                  <button
                    onClick={() => handleRetryCampaign(completedCampaignId)}
                    disabled={retrying}
                    style={{
                      height: '30px',
                      padding: '0 14px',
                      background: retrying ? '#7a8090' : 'rgba(18,140,126,0.08)',
                      border: `1px solid ${retrying ? '#7a8090' : 'rgba(18,140,126,0.25)'}`,
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      fontWeight: '600',
                      color: retrying ? '#ffffff' : '#128C7E',
                      cursor: retrying ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    {retrying ? 'Retrying...' : 'Retry Failed'}
                  </button>
                )}
              </div>
            </div>

            {loadingRecipients ? (
              <div style={{ fontSize: '13px', color: '#4b5160', padding: '12px 0' }}>
                Loading results...
              </div>
            ) : (
              <div style={{
                border: '1px solid #e6e8ee',
                borderRadius: '10px',
                overflow: 'hidden'
              }}>
                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', tableLayout: 'fixed' }}>
                    <colgroup>
                      <col style={{ width: '40px' }} />
                      <col style={{ width: '160px' }} />
                      <col style={{ width: '130px' }} />
                      <col style={{ width: '120px' }} />
                      <col />
                    </colgroup>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                      <tr style={tblHeader}>
                        <th style={{ ...th, padding: '8px 10px' }}>#</th>
                        <th style={{ ...th, padding: '8px 10px' }}>Name</th>
                        <th style={{ ...th, padding: '8px 10px' }}>Phone</th>
                        <th style={{ ...th, padding: '8px 10px' }}>Status</th>
                        <th style={{ ...th, padding: '8px 10px' }}>Error Code</th>
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
                          <td style={{ ...td, color: '#7a8090', padding: '8px 10px' }}>{i + 1}</td>
                          <td style={{ ...td, padding: '8px 10px' }}>{r.name || '—'}</td>
                          <td style={{ ...td, fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px', padding: '8px 10px' }}>{r.phone}</td>
                          <td style={{ ...td, padding: '8px 10px' }}><span style={statusBadge(r.status)}>{r.status}</span></td>
                          <td style={{ ...td, color: '#7a8090', fontSize: '12px', padding: '8px 10px' }}>
                            {getErrorLabel(r.error_code)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  )
}

export default Campaigns
