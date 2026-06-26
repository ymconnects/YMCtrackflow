import { useState, useEffect } from 'react'
import { uploadContacts, getContactBooks, createCampaign, sendCampaign } from '../utils/api'

const Campaigns = ({ role, onPageChange }) => {
  useEffect(() => { onPageChange('campaigns') }, [onPageChange])

  // section 1 — upload
  const [bookName, setBookName]   = useState('')
  const [csvFile, setCsvFile]     = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState(null)

  // section 2 — create
  const [books, setBooks]               = useState([])
  const [selectedBook, setSelectedBook] = useState('')
  const [campName, setCampName]         = useState('')
  const [templateName, setTemplateName] = useState('')
  const [creating, setCreating]         = useState(false)
  const [createMsg, setCreateMsg]       = useState(null)

  // section 3 — send
  const [campaignId, setCampaignId] = useState('')
  const [sending, setSending]       = useState(false)
  const [sendResult, setSendResult] = useState(null)

  const loadBooks = () => {
    getContactBooks()
      .then(res => { if (res.data.success) setBooks(res.data.books) })
      .catch(() => {})
  }

  useEffect(() => { loadBooks() }, [])

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

  const handleCreate = async () => {
    if (!selectedBook || !campName || !templateName) return
    setCreating(true)
    setCreateMsg(null)
    try {
      const res = await createCampaign({
        name: campName,
        template_name: templateName,
        book_id: selectedBook,
        variables: {}
      })
      if (res.data.success) {
        setCreateMsg(`Campaign created — ID: ${res.data.campaign_id} · ${res.data.total} recipients`)
        setCampaignId(res.data.campaign_id)
        setCampName('')
        setTemplateName('')
        setSelectedBook('')
      } else {
        setCreateMsg(`Error: ${res.data.message}`)
      }
    } catch {
      setCreateMsg('Create failed')
    }
    setCreating(false)
  }

  const handleSend = async () => {
    if (!campaignId) return
    setSending(true)
    setSendResult(null)
    try {
      const res = await sendCampaign(campaignId)
      if (res.data.success) {
        setSendResult(res.data)
      } else {
        setSendResult({ error: res.data.message })
      }
    } catch {
      setSendResult({ error: 'Send failed' })
    }
    setSending(false)
  }

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

      {/* section 2 — create campaign */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14.5px', fontWeight: '700' }}>
          Create Campaign
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={lbl}>Contact Book</label>
            <select
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">Select a book...</option>
              {books.map(b => (
                <option key={b.id} value={b.id}>{b.name} ({b.total} contacts)</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '160px' }}>
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
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={lbl}>Template Name</label>
            <input
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              placeholder="e.g. ymc_anjani"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#128C7E'}
              onBlur={e => e.target.style.borderColor = '#e6e8ee'}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !selectedBook || !campName || !templateName}
            style={primaryBtn(creating || !selectedBook || !campName || !templateName)}
          >
            {creating ? 'Creating...' : 'Create Campaign'}
          </button>
        </div>
        {createMsg && (
          <div style={notice(createMsg.startsWith('Error'))}>
            {createMsg}
          </div>
        )}
      </div>

      {/* section 3 — send campaign */}
      <div style={card}>
        <h3 style={{ margin: '0 0 16px', fontSize: '14.5px', fontWeight: '700' }}>
          Send Campaign
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Campaign ID</label>
            <input
              value={campaignId}
              onChange={e => setCampaignId(e.target.value)}
              placeholder="Paste campaign ID — or it fills automatically after Create"
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = '#128C7E'}
              onBlur={e => e.target.style.borderColor = '#e6e8ee'}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !campaignId}
            style={primaryBtn(sending || !campaignId)}
          >
            {sending ? 'Sending...' : 'Send Now'}
          </button>
        </div>
        {sending && (
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#7a8090' }}>
            Sending messages one by one — this may take a while...
          </div>
        )}
        {sendResult && !sendResult.error && (
          <div style={notice(false)}>
            Done — Sent: {sendResult.sent} · Failed: {sendResult.failed} · Total: {sendResult.total}
          </div>
        )}
        {sendResult?.error && (
          <div style={notice(true)}>
            Error: {sendResult.error}
          </div>
        )}
      </div>

    </div>
  )
}

export default Campaigns
