// Templates.jsx
// Live template management — fetch, create, delete
// Admin and Campaigner only

import { useEffect, useState } from 'react'
import { getTemplates, deleteTemplate } from '../utils/api'
import { RefreshCw, Plus, Trash2, Copy } from 'lucide-react'

const Templates = ({ role, onPageChange }) => {

  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    onPageChange('templates')
  }, [onPageChange])

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await getTemplates()
      if (res.data.success) {
        setTemplates(res.data.templates)
      }
    } catch (err) {
      console.error('Failed to fetch templates', err)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTemplates()
    setRefreshing(false)
  }

  const handleDelete = async (name) => {
    if (!window.confirm(`Delete template "${name}"? This cannot be undone.`)) return
    setDeleting(name)
    try {
      const res = await deleteTemplate(name)
      if (res.data.success) {
        setTemplates(prev => prev.filter(t => t.name !== name))
      } else {
        alert('Delete failed: ' + res.data.message)
      }
    } catch (err) {
      alert('Delete failed')
    }
    setDeleting(null)
  }

  const getType = (template) => {
    const components = template.components || []
    const hasButton = components.some(c => c.type === 'BUTTONS')
    return hasButton ? 'Button' : 'Text'
  }

  const getStatusBadge = (status) => {
    const map = {
      APPROVED: { bg: 'rgba(18,140,126,0.1)', color: '#128C7E' },
      PENDING: { bg: 'rgba(234,179,8,0.1)', color: '#a16207' },
      REJECTED: { bg: 'rgba(220,38,38,0.1)', color: '#dc2626' },
      DRAFT: { bg: 'rgba(107,114,128,0.1)', color: '#4b5160' },
    }
    const s = map[status] || map['DRAFT']
    return (
      <span style={{
        background: s.bg, color: s.color,
        fontSize: '11px', padding: '3px 9px',
        borderRadius: '999px', fontWeight: '600'
      }}>{status}</span>
    )
  }

  const tabs = ['all', 'draft', 'pending', 'approved']

  const filteredTemplates = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase())
    const matchTab =
      activeTab === 'all' ? true :
      activeTab === 'draft' ? t.status === 'DRAFT' :
      activeTab === 'pending' ? t.status === 'PENDING' :
      activeTab === 'approved' ? t.status === 'APPROVED' : true
    return matchSearch && matchTab
  })

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', height: '400px',
        color: '#7a8090', fontSize: '14px'
      }}>
        Loading templates...
      </div>
    )
  }

  return (
    <div>

      {/* page header */}
      <div style={{ marginBottom: '22px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', letterSpacing: '-0.01em' }}>Templates</h1>
        <div style={{ color: '#4b5160', fontSize: '13.5px', marginTop: '2px' }}>
          View, create and delete WhatsApp message templates.
        </div>
      </div>

      {/* section 1 — toolbar */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '0px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <span style={{
            position: 'absolute', left: '12px', top: '50%',
            transform: 'translateY(-50%)', color: '#7a8090', fontSize: '14px'
          }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder='Search by template name...'
            style={{
              width: '100%', height: '38px',
              padding: '0 12px 0 36px',
              background: '#ffffff',
              border: '1px solid #e6e8ee',
              borderRadius: '10px', color: '#0f1117',
              fontFamily: 'inherit', fontSize: '13px',
              outline: 'none', boxSizing: 'border-box'
            }}
            onFocus={e => e.target.style.borderColor = '#128C7E'}
            onBlur={e => e.target.style.borderColor = '#e6e8ee'}
          />
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
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
          <RefreshCw size={14} /> {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        <button
          style={{
            height: '36px', padding: '0 14px',
            background: '#128C7E', border: 'none',
            borderRadius: '8px', fontWeight: '600',
            fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center',
            gap: '6px', fontFamily: 'inherit', color: '#ffffff'
          }}
        >
          <Plus size={14} /> Add new template
        </button>

        <span style={{ marginLeft: 'auto', fontSize: '12.5px', color: '#7a8090' }}>
          {filteredTemplates.length} templates
        </span>
      </div>

      {/* section 2 — filter tabs */}
      <div style={{
        display: 'flex', gap: '4px',
        borderBottom: '1px solid #e6e8ee',
        marginBottom: '16px', marginTop: '16px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px', border: 'none',
              background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '13px',
              fontWeight: activeTab === tab ? '600' : '500',
              color: activeTab === tab ? '#128C7E' : '#4b5160',
              borderBottom: activeTab === tab ? '2px solid #128C7E' : '2px solid transparent',
              marginBottom: '-1px', textTransform: 'capitalize'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* section 3 — templates table */}
      <div style={{
        background: '#ffffff', border: '1px solid #e6e8ee',
        borderRadius: '14px', overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e6e8ee', background: '#f9fafb' }}>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '600', color: '#7a8090', textTransform: 'uppercase', letterSpacing: '0.04em', width: '35%' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '600', color: '#7a8090', textTransform: 'uppercase', letterSpacing: '0.04em', width: '17%' }}>Category</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '600', color: '#7a8090', textTransform: 'uppercase', letterSpacing: '0.04em', width: '17%' }}>Status</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '11.5px', fontWeight: '600', color: '#7a8090', textTransform: 'uppercase', letterSpacing: '0.04em', width: '13%' }}>Type</th>
              <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '11.5px', fontWeight: '600', color: '#7a8090', textTransform: 'uppercase', letterSpacing: '0.04em', width: '18%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#7a8090', fontSize: '13.5px' }}>
                  No templates found
                </td>
              </tr>
            ) : (
              filteredTemplates.map(t => (
                <tr key={t.id || t.name} style={{ borderBottom: '1px solid #f3f4f7' }}>
                  <td style={{ padding: '14px 16px', fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', fontWeight: '600' }}>
                    {t.name}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5160' }}>
                    {t.category}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {getStatusBadge(t.status)}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#4b5160' }}>
                    {getType(t)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      <button
                        title='Copy template'
                        style={{
                          width: '32px', height: '32px', padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid #e6e8ee', borderRadius: '8px',
                          background: 'transparent', cursor: 'pointer', color: '#4b5160'
                        }}
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        title='Delete template'
                        onClick={() => handleDelete(t.name)}
                        disabled={deleting === t.name}
                        style={{
                          width: '32px', height: '32px', padding: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid rgba(220,38,38,0.25)', borderRadius: '8px',
                          background: 'rgba(220,38,38,0.06)', cursor: 'pointer', color: '#dc2626'
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    </div>
  )
}

export default Templates