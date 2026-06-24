import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Community } from '../types'

export function useCommunities(campaignTag: string) {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!campaignTag) return
    setLoading(true)
    supabase
      .from('communities')
      .select('*')
      .eq('campaign_tag', campaignTag)
      .eq('active', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCommunities(data ?? [])
        setLoading(false)
      })
  }, [campaignTag])

  const addCommunity = async (community: Omit<Community, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('communities')
      .insert(community)
      .select()
      .single()
    if (error) throw new Error(error.message)
    setCommunities(prev => [...prev, data])
    return data as Community
  }

  return { communities, loading, error, addCommunity }
}
