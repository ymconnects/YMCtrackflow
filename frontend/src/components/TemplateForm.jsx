// TemplateForm.jsx
// 3-step create template flow: Setup → Edit → Submit
// Opens from Templates page (Add new / Copy)

import { useState } from 'react'
import { createTemplate } from '../utils/api'
import { Check, Plus, Trash2, ExternalLink, Phone, Copy as CopyIcon } from 'lucide-react'

const GREEN = '#128C7E'

const card = {
  background: '#ffffff', border: '1px solid #e6e8ee',
  borderRadius: '12px', padding: '16px'
}
const labelStyle = {
  display: 'block', fontSize: '12px', color: '#4b5160',
  marginBottom: '5px', fontWeight: '500'
}
const inputStyle = {
  width: '100%', height: '38px', padding: '0 12px',
  background: '#fff', border: '1px solid #e6e8ee',
  borderRadius: '10px', color: '#0f1117',
  fontFamily: 'inherit', fontSize: '13px',
  outline: 'none', boxSizing: 'border-box'
}

const TemplateForm = ({ initialData, onClose, onCreated }) => {
  const [step, setStep] = useState(initialData ? 2 : 1)
  const [category, setCategory] = useState(initialData?.category || 'UTILITY')
  const [name, setName] = useState(initialData?.name || '')
  const [varFormat, setVarFormat] = useState('number')
  const [headerType, setHeaderType] = useState(initialData?.headerType || 'NONE')
  const [headerText, setHeaderText] = useState(initialData?.headerText || '')
  const [body, setBody] = useState(initialData?.body || '')
  const [footer, setFooter] = useState(initialData?.footer || '')
  const [buttons, setButtons] = useState(initialData?.buttons || [])
  const [bodySamples, setBodySamples] = useState({})
  const [headerSample, setHeaderSample] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)

  // parse {{1}} {{2}} from text
  const getVars = (text) => {
    const matches = text.match(/\{\{(\d+)\}\}/g) || []
    const nums = matches.map(m => parseInt(m.replace(/[^\d]/g, '')))
    return [...new Set(nums)].sort((a, b) => a - b)
  }
  const bodyVars = getVars(body)
  const headerVars = getVars(headerText)

  const addBodyVar = () => {
    const next = bodyVars.length ? Math.max(...bodyVars) + 1 : 1
    setBody(body + ` {{${next}}}`)
  }
  const addHeaderVar = () => {
    if (headerVars.length >= 1) return
    setHeaderText(headerText + ` {{1}}`)
  }

  const buttonOptions = ['Custom', 'Visit website', 'Call on WhatsApp', 'Call Phone Number', 'Complete flow', 'Copy offer code']
  const addButton = (type) => {
    if (!type || type === 'Add button' || buttons.length >= 3) return
    setButtons([...buttons, { type, text: '', value: '' }])
  }
  const updateButton = (i, field, val) => {
    const copy = [...buttons]
    copy[i][field] = val
    setButtons(copy)
  }
  const removeButton = (i) => setButtons(buttons.filter((_, idx) => idx !== i))

  // build Meta payload
  const buildPayload = () => {
    const components = []
    if (headerType === 'TEXT' && headerText) {
      const h = { type: 'HEADER', format: 'TEXT', text: headerText }
      if (headerVars.length) h.example = { header_text: [headerSample || 'Sample'] }
      components.push(h)
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT', 'LOCATION'].includes(headerType)) {
      components.push({ type: 'HEADER', format: headerType })
    }
    const bodyComp = { type: 'BODY', text: body }
    if (bodyVars.length) {
      bodyComp.example = { body_text: [bodyVars.map(v => bodySamples[v] || 'Sample')] }
    }
    components.push(bodyComp)
    if (footer) components.push({ type: 'FOOTER', text: footer })
    if (buttons.length) {
      const btns = buttons.map(b => {
        if (b.type === 'Visit website') return { type: 'URL', text: b.text, url: b.value }
        if (b.type === 'Call Phone Number') return { type: 'PHONE_NUMBER', text: b.text, phone_number: b.value }
        if (b.type === 'Copy offer code') return { type: 'COPY_CODE', example: b.value || '12345' }
        return { type: 'QUICK_REPLY', text: b.text }
      })
      components.push({ type: 'BUTTONS', buttons: btns })
    }
    return {
      name: name.toLowerCase().trim().replace(/\s+/g, '_'),
      language: 'en_US',
      category,
      components
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await createTemplate(buildPayload())
      if (res.data.success) {
        setResult({ ok: true, msg: 'Template submitted to Meta for review.' })
        if (onCreated) onCreated()
      } else {
        setResult({ ok: false, msg: res.data.message })
      }
    } catch (err) {
      setResult({ ok: false, msg: 'Submit failed. Check console.' })
    }
    setSubmitting(false)
  }

  const fillPreview = (text) =>
    text.replace(/\{\{(\d+)\}\}/g, (m, n) => bodySamples[n] || 'sample')

  // STEPPER
  const steps = ['Setup', 'Edit template', 'Submit for review']
  const Stepper = (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
      {steps.map((label, i) => {
        const num = i + 1
        const done = step > num
        const active = step === num
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: done || active ? GREEN : '#f3f4f7',
                color: done || active ? '#fff' : '#7a8090',
                border: done || active ? 'none' : '1px solid #e6e8ee',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '600'
              }}>
                {done ? <Check size={15} /> : num}
              </div>
              <span style={{
                fontSize: '13.5px',
                fontWeight: active ? '600' : '500',
                color: active ? GREEN : done ? '#0f1117' : '#7a8090'
              }}>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: '40px', height: '2px',
                background: step > num ? GREEN : '#e6e8ee',
                margin: '0 10px'
              }} />
            )}
          </div>
        )
      })}
    </div>
  )

  return (
    <div>
      {Stepper}

      {/* STEP 1 — SETUP */}
      {step === 1 && (
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Choose template category</div>
          <div style={{ fontSize: '13px', color: '#7a8090', marginBottom: '18px' }}>
            Category affects cost and approval. Meta may re-categorize after review.
          </div>
          <div style={{ display: 'flex', gap: '14px' }}>
            {[
              { key: 'UTILITY', title: 'Utility', desc: 'Order updates, alerts, reminders. Lower cost.' },
              { key: 'MARKETING', title: 'Marketing', desc: 'Offers, promotions, announcements. Higher cost.' }
            ].map(c => (
              <div
                key={c.key}
                onClick={() => setCategory(c.key)}
                style={{
                  flex: 1, padding: '18px', cursor: 'pointer',
                  border: category === c.key ? `2px solid ${GREEN}` : '1px solid #e6e8ee',
                  borderRadius: '12px',
                  background: category === c.key ? 'rgba(18,140,126,0.04)' : '#fff'
                }}
              >
                <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{c.title}</div>
                <div style={{ fontSize: '12.5px', color: '#7a8090', lineHeight: '1.5' }}>{c.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
            <button onClick={onClose} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>Cancel</button>
            <button onClick={() => setStep(2)} style={{ ...inputStyle, width: 'auto', background: GREEN, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Next: Edit →</button>
          </div>
        </div>
      )}

      {/* STEP 2 — EDIT */}
      {step === 2 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: '20px', alignItems: 'start' }}>

          {/* editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div style={card}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 2 }}>
                  <label style={labelStyle}>Template name</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder='ymc_new_template' style={{ ...inputStyle, fontFamily: 'JetBrains Mono, monospace' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Language</label>
                  <input value='English (US)' disabled style={{ ...inputStyle, background: '#f6f7f9', color: '#7a8090' }} />
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#7a8090', lineHeight: '1.55', padding: '0 2px' }}>
              Add a header, body and footer for your template. Cloud API hosted by Meta will review the template variables and content to protect the security and integrity of our services.
            </div>

            <div style={card}>
              <label style={labelStyle}>Variable format</label>
              <select value={varFormat} onChange={e => setVarFormat(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value='number'>Number — {'{{1}}, {{2}}'}</option>
                <option value='named'>Named — {'{{name}}'}</option>
              </select>
            </div>

           {/* header */}
             <div style={card}>
               <div style={{ fontSize: '13.5px', fontWeight: '600', marginBottom: '10px' }}>
                 Header <span style={{ fontWeight: '400', color: '#7a8090', fontSize: '12px' }}>· optional · text only</span>
               </div>
               <input value={headerText} onChange={e => setHeaderText(e.target.value)} maxLength={60} placeholder='Order Update' style={inputStyle} />
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                 <button onClick={addHeaderVar} style={{ fontSize: '11.5px', padding: '3px 8px', color: GREEN, background: '#fff', border: '1px solid #e6e8ee', borderRadius: '6px', cursor: 'pointer' }}>
                   <Plus size={12} style={{ verticalAlign: '-1px' }} /> Add variable
                 </button>
                 <span style={{ fontSize: '11px', color: '#7a8090' }}>{headerText.length} / 60</span>
               </div>
               {headerVars.length > 0 && (
                 <input value={headerSample} onChange={e => setHeaderSample(e.target.value)} placeholder='Sample value for header {{1}}' style={{ ...inputStyle, marginTop: '8px' }} />
               )}
             </div>
             
             {/* media */}
             <div style={card}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                 <span style={{ fontSize: '13.5px', fontWeight: '600' }}>
                   Media <span style={{ fontWeight: '400', color: '#7a8090', fontSize: '12px' }}>· optional</span>
                 </span>
                 <select value={headerType} onChange={e => setHeaderType(e.target.value)} style={{ ...inputStyle, width: 'auto', height: '30px', cursor: 'pointer', fontSize: '12px' }}>
                   <option value='NONE'>None</option>
                   <option value='IMAGE'>Image</option>
                   <option value='VIDEO'>Video</option>
                   <option value='DOCUMENT'>Document</option>
                   <option value='LOCATION'>Location</option>
                 </select>
               </div>
               {headerType !== 'NONE' && (
                 <div style={{ fontSize: '12px', color: '#7a8090', lineHeight: '1.5' }}>
                   Selected: <strong>{headerType}</strong> — actual media will be attached when sending the message. No upload needed during template creation.
                 </div>
               )}
             </div>

            {/* body */}
            <div style={card}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', marginBottom: '10px' }}>Body <span style={{ fontWeight: '400', color: '#dc2626', fontSize: '12px' }}>· required</span></div>
              <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={1024} placeholder='Dear {{1}}, your order is dispatched...' style={{ ...inputStyle, height: 'auto', minHeight: '90px', padding: '10px 12px', lineHeight: '1.5', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                <button onClick={addBodyVar} style={{ fontSize: '11.5px', padding: '3px 8px', color: GREEN, background: '#fff', border: '1px solid #e6e8ee', borderRadius: '6px', cursor: 'pointer' }}><Plus size={12} style={{ verticalAlign: '-1px' }} /> Add variable</button>
                <span style={{ fontSize: '11px', color: '#7a8090' }}>{body.length} / 1024</span>
              </div>
              {bodyVars.length > 0 && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11.5px', color: '#7a8090' }}>Sample values (required for review):</div>
                  {bodyVars.map(v => (
                    <div key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: GREEN, width: '40px' }}>{`{{${v}}}`}</span>
                      <input value={bodySamples[v] || ''} onChange={e => setBodySamples({ ...bodySamples, [v]: e.target.value })} placeholder={`Sample for {{${v}}}`} style={{ ...inputStyle, height: '32px' }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* footer */}
            <div style={card}>
              <div style={{ fontSize: '13.5px', fontWeight: '600', marginBottom: '10px' }}>Footer <span style={{ fontWeight: '400', color: '#7a8090', fontSize: '12px' }}>· optional · no variables</span></div>
              <input value={footer} onChange={e => setFooter(e.target.value)} maxLength={60} placeholder='Team Yashvant Mangal Classes' style={inputStyle} />
              <div style={{ textAlign: 'right', marginTop: '6px' }}><span style={{ fontSize: '11px', color: '#7a8090' }}>{footer.length} / 60</span></div>
            </div>

            {/* buttons */}
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600' }}>Buttons <span style={{ fontWeight: '400', color: '#7a8090', fontSize: '12px' }}>· optional · max 3</span></span>
                <select value='' onChange={e => addButton(e.target.value)} style={{ ...inputStyle, width: 'auto', height: '30px', cursor: 'pointer', fontSize: '12px' }}>
                  <option value=''>Add button</option>
                  {buttonOptions.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              {buttons.map((b, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#f6f7f9', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#4b5160' }}>{b.type}</span>
                    <Trash2 size={14} style={{ color: '#dc2626', cursor: 'pointer' }} onClick={() => removeButton(i)} />
                  </div>
                  <input value={b.text} onChange={e => updateButton(i, 'text', e.target.value)} placeholder='Button text' style={{ ...inputStyle, height: '32px' }} />
                  {(b.type === 'Visit website' || b.type === 'Call Phone Number' || b.type === 'Copy offer code') && (
                    <input value={b.value} onChange={e => updateButton(i, 'value', e.target.value)} placeholder={b.type === 'Visit website' ? 'https://...' : b.type === 'Call Phone Number' ? '+91...' : 'OFFER CODE'} style={{ ...inputStyle, height: '32px' }} />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>← Back</button>
              <button onClick={() => setStep(3)} disabled={!name || !body} style={{ ...inputStyle, width: 'auto', background: (!name || !body) ? '#7a8090' : GREEN, color: '#fff', border: 'none', cursor: (!name || !body) ? 'not-allowed' : 'pointer', fontWeight: '600' }}>Next: Submit →</button>
            </div>
          </div>

          {/* live preview */}
          <div style={{ position: 'sticky', top: '12px' }}>
            <div style={{ fontSize: '11.5px', color: '#7a8090', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: '600', marginBottom: '10px', textAlign: 'center' }}>Live preview</div>
            <div style={{ background: '#0b141a', borderRadius: '18px', padding: '16px 12px' }}>
              <div style={{ background: '#005c4b', color: '#e9edf0', padding: '10px 12px', borderRadius: '8px 0 8px 8px', fontSize: '12.5px', lineHeight: '1.5', maxWidth: '92%', marginLeft: 'auto', whiteSpace: 'pre-wrap' }}>
                {headerType === 'TEXT' && headerText && <div style={{ fontWeight: '700', marginBottom: '6px' }}>{fillPreview(headerText)}</div>}
                {body ? fillPreview(body) : <span style={{ color: '#8696a0' }}>Your message preview...</span>}
                {footer && <div style={{ color: '#8696a0', fontSize: '11px', marginTop: '6px' }}>{footer}</div>}
                <div style={{ textAlign: 'right', fontSize: '10px', color: '#8696a0', marginTop: '3px' }}>10:42 AM</div>
              </div>
              {buttons.map((b, i) => (
                <div key={i} style={{ marginTop: '6px', maxWidth: '92%', marginLeft: 'auto' }}>
                  <div style={{ background: '#1f2c33', color: '#53bdeb', textAlign: 'center', padding: '9px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '500' }}>
                    {b.type === 'Visit website' && <ExternalLink size={13} style={{ verticalAlign: '-2px' }} />}
                    {b.type === 'Call Phone Number' && <Phone size={13} style={{ verticalAlign: '-2px' }} />}
                    {b.type === 'Copy offer code' && <CopyIcon size={13} style={{ verticalAlign: '-2px' }} />}
                    {' '}{b.text || b.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — SUBMIT */}
      {step === 3 && (
        <div>
          {!result ? (
            <>
              <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '4px' }}>Review and submit</div>
              <div style={{ fontSize: '13px', color: '#7a8090', marginBottom: '18px' }}>
                Template goes to Meta for review. Approval can take minutes to 24 hours.
              </div>
              <div style={{ ...card, marginBottom: '18px' }}>
                <table style={{ width: '100%', fontSize: '13px' }}>
                  <tbody>
                    <tr><td style={{ padding: '6px 0', color: '#7a8090', width: '120px' }}>Name</td><td style={{ fontFamily: 'JetBrains Mono, monospace' }}>{name.toLowerCase().trim().replace(/\s+/g, '_')}</td></tr>
                    <tr><td style={{ padding: '6px 0', color: '#7a8090' }}>Category</td><td>{category}</td></tr>
                    <tr><td style={{ padding: '6px 0', color: '#7a8090' }}>Language</td><td>en_US</td></tr>
                    <tr><td style={{ padding: '6px 0', color: '#7a8090' }}>Header</td><td>{headerType === 'NONE' ? '—' : headerType}</td></tr>
                    <tr><td style={{ padding: '6px 0', color: '#7a8090' }}>Buttons</td><td>{buttons.length || '—'}</td></tr>
                  </tbody>
                </table>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setStep(2)} style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}>← Back</button>
                <button onClick={handleSubmit} disabled={submitting} style={{ ...inputStyle, width: 'auto', background: GREEN, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>{submitting ? 'Submitting...' : 'Submit to Meta'}</button>
              </div>
            </>
          ) : (
            <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: '15px', fontWeight: '600', color: result.ok ? GREEN : '#dc2626', marginBottom: '8px' }}>
                {result.ok ? '✓ Submitted' : '✗ Failed'}
              </div>
              <div style={{ fontSize: '13px', color: '#4b5160', marginBottom: '18px' }}>{result.msg}</div>
              <button onClick={onClose} style={{ ...inputStyle, width: 'auto', background: GREEN, color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Back to templates</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TemplateForm