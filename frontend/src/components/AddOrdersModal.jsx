// AddOrdersModal.jsx
// Paste-to-dashboard: shared modal used by both Dashboard and Orders pages.
// Flow: pick courier -> paste rows -> Preview (server-classified dry run)
// -> Add Orders (real submit, same classification logic).

import { useState } from 'react'
import { X, Plus, AlertTriangle } from 'lucide-react'
import { bulkAddOrders } from '../utils/api'
import { generateTrackingLink } from '../utils/trackingLinks'
import ToastContainer from './ToastContainer'

const COURIERS = [
  { value: 'anjani', label: 'Anjani' },
  { value: 'dtdc', label: 'DTDC' },
  { value: 'maruti', label: 'Maruti' },
  { value: 'others', label: 'Others' },
]

const stripStrayQuotes = (s) => s.replace(/^["']+|["']+$/g, '').trim()

const splitLine = (line) => {
  if (line.includes('\t')) return line.split('\t')
  if (line.includes(',')) return line.split(',')
  // fall back to runs of 2+ spaces - handles pasted text with no tab/comma delimiters
  return line.split(/\s{2,}/)
}

const isValidPhone = (phone) => {
  const digits = (phone || '').replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 12 && digits.startsWith('91'))
}

const parseRows = (text) => {
  return text.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(line => {
      const parts = splitLine(line)
      const [name, phone, trackingId] = parts.map(p => stripStrayQuotes(p || ''))
      return { name: name || '', phone: phone || '', tracking_id: trackingId || '' }
    })
}

const AddOrdersModal = ({ isOpen, onClose, onAdded }) => {
  const [courier, setCourier] = useState('')
  const [courierName, setCourierName] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [previewRows, setPreviewRows] = useState(null)
  const [previewing, setPreviewing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  if (!isOpen) return null

  const reset = () => {
    setCourier('')
    setCourierName('')
    setPasteText('')
    setPreviewRows(null)
    setErrorMsg(null)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handlePreview = async () => {
    setErrorMsg(null)
    if (!courier) { setErrorMsg('Pick a courier first'); return }
    if (courier === 'others' && !courierName.trim()) { setErrorMsg('Courier Name is required for Others'); return }

    const parsed = parseRows(pasteText)
    if (!parsed.length) { setErrorMsg('Paste at least one row'); return }

    const hasAllFields = r => r.name && r.phone && r.tracking_id
    const validRows = parsed.filter(r => hasAllFields(r) && isValidPhone(r.phone))
    const invalidRows = parsed.filter(r => !(hasAllFields(r) && isValidPhone(r.phone)))

    setPreviewing(true)
    try {
      const res = await bulkAddOrders(courier, courierName, validRows, true)
      if (!res.data.success) {
        setErrorMsg(res.data.message || 'Preview failed')
        setPreviewing(false)
        return
      }
      const classified = validRows.map((row, i) => ({
        ...row,
        valid: true,
        status: res.data.results[i]?.status,
        existing: res.data.results[i]?.existing || null,
        trackingLink: generateTrackingLink(courier, row.tracking_id, courierName)
      }))
      const invalid = invalidRows.map(row => ({
        ...row,
        valid: false,
        status: !hasAllFields(row) ? 'invalid' : 'invalid_phone',
        trackingLink: ''
      }))
      setPreviewRows([...classified, ...invalid])
    } catch {
      setErrorMsg('Preview failed - check your connection')
    }
    setPreviewing(false)
  }

  const handleSubmit = async () => {
    const validRows = previewRows.filter(r => r.valid).map(({ name, phone, tracking_id }) => ({ name, phone, tracking_id }))
    setSubmitting(true)
    try {
      const res = await bulkAddOrders(courier, courierName, validRows, false)
      if (!res.data.success) {
        setErrorMsg(res.data.message || 'Add failed')
        setSubmitting(false)
        return
      }
      const { added, skipped_duplicates, flagged_conflicts, results } = res.data
      let msg = `${added} order${added === 1 ? '' : 's'} added`
      if (skipped_duplicates) msg += `, ${skipped_duplicates} duplicate${skipped_duplicates === 1 ? '' : 's'} skipped`
      if (flagged_conflicts) msg += `, ${flagged_conflicts} conflict${flagged_conflicts === 1 ? '' : 's'} need review`
      ToastContainer.addToast(msg, added > 0 ? 'success' : 'info')

      if (flagged_conflicts > 0) {
        // don't close silently on a conflict - show exactly which row(s) it was
        let ri = 0
        setPreviewRows(prev => prev.map(r => {
          if (!r.valid) return r
          const result = results[ri]
          ri += 1
          return { ...r, status: result?.status || r.status, existing: result?.existing || r.existing }
        }))
        setSubmitting(false)
        return
      }

      onAdded && onAdded()
      handleClose()
    } catch {
      setErrorMsg('Add failed - check your connection')
    }
    setSubmitting(false)
  }

  const readyCount = previewRows ? previewRows.filter(r => r.status === 'insert').length : 0
  const needsReviewCount = previewRows ? previewRows.filter(r => !r.valid || r.status === 'conflict').length : 0

  const statusBadge = (status) => {
    const map = {
      insert:    { label: 'Ready',              bg: 'rgba(18,140,126,0.10)', color: '#128C7E' },
      duplicate: { label: 'Skipped (duplicate)', bg: 'rgba(122,128,144,0.10)', color: '#7a8090' },
      conflict:  { label: '⚠️ Conflict — review', bg: 'rgba(234,88,12,0.10)', color: '#ea580c' },
      invalid:   { label: 'Missing fields',      bg: 'rgba(220,38,38,0.10)', color: '#dc2626' },
      invalid_phone: { label: '⚠️ Invalid phone number', bg: 'rgba(220,38,38,0.10)', color: '#dc2626' },
    }
    const s = map[status] || map.invalid
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: '20px',
        fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color
      }}>
        {s.label}
      </span>
    )
  }

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
        background: 'rgba(15,17,23,0.5)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 1000
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff', borderRadius: '16px', padding: '28px',
          width: '760px', maxWidth: '92vw', maxHeight: '86vh',
          overflowY: 'auto', boxShadow: '0 20px 60px rgba(15,17,23,0.2)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', textAlign: 'left' }}>Add Orders</h3>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#7a8090' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <select
            value={courier}
            onChange={e => setCourier(e.target.value)}
            style={{
              height: '38px', padding: '0 12px', border: '1px solid #e6e8ee',
              background: '#ffffff', borderRadius: '10px', color: '#0f1117',
              fontFamily: 'inherit', fontSize: '13px', cursor: 'pointer', outline: 'none'
            }}
          >
            <option value=''>Select courier...</option>
            {COURIERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          {courier === 'others' && (
            <input
              value={courierName}
              onChange={e => setCourierName(e.target.value)}
              placeholder='Courier Name (e.g. India Post)'
              style={{
                flex: 1, height: '38px', padding: '0 12px', border: '1px solid #e6e8ee',
                borderRadius: '10px', color: '#0f1117', fontFamily: 'inherit', fontSize: '13px', outline: 'none'
              }}
            />
          )}
        </div>

        <textarea
          value={pasteText}
          onChange={e => setPasteText(e.target.value)}
          placeholder={'Paste rows: Name, Phone, Tracking ID (one per line, comma or tab separated)'}
          rows={6}
          style={{
            width: '100%', padding: '10px 12px', border: '1px solid #e6e8ee',
            borderRadius: '10px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12.5px',
            resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: '12px'
          }}
        />

        {errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '12px',
            background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)'
          }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: previewRows ? '16px' : 0 }}>
          <button
            onClick={handlePreview}
            disabled={previewing}
            style={{
              height: '36px', padding: '0 16px', background: previewing ? '#7a8090' : '#f6f7f9',
              border: '1px solid #e6e8ee', borderRadius: '8px', fontWeight: '600', fontSize: '13px',
              cursor: previewing ? 'not-allowed' : 'pointer', color: previewing ? '#ffffff' : '#4b5160',
              fontFamily: 'inherit'
            }}
          >
            {previewing ? 'Checking...' : 'Preview'}
          </button>
        </div>

        {previewRows && (
          <>
            <div style={{
              border: '1px solid #e6e8ee', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px'
            }}>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead style={{ position: 'sticky', top: 0, background: '#f6f7f9' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#4b5160' }}>Name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#4b5160' }}>Phone</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#4b5160' }}>Tracking ID</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#4b5160' }}>Tracking Link</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: '11px', color: '#4b5160' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((r, i) => (
                      <tr key={i} style={{
                        borderTop: '1px solid #f0f1f4',
                        background: !r.valid ? 'rgba(220,38,38,0.04)' : r.status === 'conflict' ? 'rgba(234,88,12,0.04)' : 'transparent'
                      }}>
                        <td style={{ padding: '7px 10px', color: r.valid ? '#0f1117' : '#dc2626' }}>{r.name || '—'}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{r.phone || '—'}</td>
                        <td style={{ padding: '7px 10px', fontFamily: 'JetBrains Mono, monospace' }}>{r.tracking_id || '—'}</td>
                        <td style={{ padding: '7px 10px', fontSize: '11px', color: '#7a8090', wordBreak: 'break-all' }}>{r.trackingLink || '—'}</td>
                        <td style={{ padding: '7px 10px' }}>
                          {statusBadge(r.status)}
                          {r.status === 'conflict' && r.existing && (
                            <div style={{ fontSize: '10.5px', color: '#7a8090', marginTop: '2px' }}>
                              exists as: {r.existing.customer_name} / {r.existing.phone}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: readyCount > 0 ? '#128C7E' : '#7a8090', fontWeight: '600' }}>
                {readyCount === 0 && <AlertTriangle size={13} style={{ verticalAlign: '-2px', marginRight: '4px' }} />}
                {readyCount} order{readyCount === 1 ? '' : 's'} ready to add
                {needsReviewCount > 0 && (
                  <span style={{ color: '#ea580c', fontWeight: '600', marginLeft: '8px' }}>
                    · {needsReviewCount} row{needsReviewCount === 1 ? '' : 's'} need{needsReviewCount === 1 ? 's' : ''} review before adding
                  </span>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={submitting || readyCount === 0}
                style={{
                  height: '38px', padding: '0 18px',
                  background: (submitting || readyCount === 0) ? '#7a8090' : '#128C7E',
                  color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '600',
                  fontSize: '13px', cursor: (submitting || readyCount === 0) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'inherit'
                }}
              >
                <Plus size={14} /> {submitting ? 'Adding...' : 'Add Orders'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default AddOrdersModal
