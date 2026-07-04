// JS port of backend/tracking_links.py generate_tracking_link
// Used for the live preview table in AddOrdersModal - must stay in sync
// with the Python version, which is the source of truth for what
// actually gets written on submit.

export const generateTrackingLink = (courier, trackingId, courierName) => {
  const tid = (trackingId || '').trim()
  if (!tid) return ''

  const c = (courier || '').trim().toLowerCase()

  if (c === 'dtdc') return `https://www.dtdc.com/track-your-shipment/?awb=${tid}`
  if (c === 'maruti') return `https://shreemaruti.com/track-shipment/?awb=${tid}`
  if (c === 'anjani') return `https://shreeanjani.co.in/tracking?awb=${tid}`
  if (c === 'others' && (courierName || '').trim().toLowerCase() === 'india post') {
    return 'https://www.indiapost.gov.in/'
  }

  return ''
}
