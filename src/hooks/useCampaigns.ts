import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Campaign } from '../types'

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('campaigns')
      .select('*')
      .eq('active', true)
      .order('created_at')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCampaigns(data ?? [])
        setLoading(false)
      })
  }, [])

  const addCampaign = async (campaign: Omit<Campaign, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('campaigns')
      .insert(campaign)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCampaigns(prev => [...prev, data])
    return data as Campaign
  }

  return { campaigns, loading, error, addCampaign }
}
