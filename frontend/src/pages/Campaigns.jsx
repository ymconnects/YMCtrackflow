import { useState, useEffect, useRef } from 'react'
import { uploadContacts, getContactBooks, getBookColumns, getTemplates, createCampaign, sendCampaign, getCampaignStatus } from '../utils/api'

const Campaigns = ({ role, onPageChange }) => {
  useEffect(() => { onPageChange('campaigns') }, [onPageChange])

  const pollIntervalRef = useRef(null)

  // section 1 — upload
  const [bookName, setBookName]   = useState('')
  const [csvFile, setCsvFile]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)

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

  // load books + templates on mount; clean up interval on unmount
  useEffect(() => {
    loadBooks()
    loadTemplates()
    return () => { if (pollIntervalRef.current) clearInterval(pollIntervalRef.current) }
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

  const handleCreateAndSend = async () => {
    setCreating(true)
    setErrorMsg(null)
    setPollProgress(null)
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

        {/* variable mapping — shown when template has variables */}
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

        {/* final result — done or paused */}
        {!polling && pollProgress && (
          <div style={notice(pollProgress.status === 'PAUSED')}>
            {pollProgress.status === 'PAUSED'
              ? `Paused — Daily limit reached. Sent: ${pollProgress.sent} · Failed: ${pollProgress.failed} · Total: ${pollProgress.total}`
              : `Done — Sent: ${pollProgress.sent} · Failed: ${pollProgress.failed} · Total: ${pollProgress.total}`
            }
          </div>
        )}

      </div>

    </div>
  )
}

export default Campaigns
