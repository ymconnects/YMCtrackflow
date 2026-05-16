 import { useState, useEffect } from 'react'
import { 
  getCampaigns, 
  createCampaign, 
  sendCampaign, 
  cancelCampaign,
  getCampaignReport,
  estimateAudience
} from '../utils/api'

const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)

  const fetchCampaigns = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await getCampaigns()
      setCampaigns(res.data.campaigns)
    } catch (err) {
      setError('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const handleCreateCampaign = async (data) => {
    try {
      setCreating(true)
      await createCampaign(data)
      await fetchCampaigns()
      return { success: true, message: 'Campaign created successfully' }
    } catch (err) {
      return { success: false, message: 'Failed to create campaign' }
    } finally {
      setCreating(false)
    }
  }

  const handleSendCampaign = async (campaignId) => {
    try {
      await sendCampaign(campaignId)
      await fetchCampaigns()
      return { success: true, message: 'Campaign started' }
    } catch (err) {
      return { success: false, message: 'Failed to start campaign' }
    }
  }

  const handleCancelCampaign = async (campaignId) => {
    try {
      await cancelCampaign(campaignId)
      await fetchCampaigns()
      return { success: true, message: 'Campaign cancelled' }
    } catch (err) {
      return { success: false, message: 'Failed to cancel' }
    }
  }

  const handleGetReport = async (campaignId) => {
    try {
      const res = await getCampaignReport(campaignId)
      return { success: true, data: res.data }
    } catch (err) {
      return { success: false, message: 'Failed to load report' }
    }
  }

  const handleEstimateAudience = async (filters) => {
    try {
      const res = await estimateAudience(filters)
      return { success: true, count: res.data.count }
    } catch (err) {
      return { success: false, count: 0 }
    }
  }

  return {
    campaigns,
    loading,
    error,
    creating,
    fetchCampaigns,
    handleCreateCampaign,
    handleSendCampaign,
    handleCancelCampaign,
    handleGetReport,
    handleEstimateAudience
  }
}

export default useCampaigns
