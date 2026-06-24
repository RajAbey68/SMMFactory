import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Reply } from '../types'

export function useThreadFeed(campaignTag: string) {
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReplies = async () => {
      const { data, error } = await supabase
        .from('replies')
        .select('*, thread:threads(*, community:communities(*))')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) setError(error.message)
      else setReplies((data ?? []).filter((r: Reply) => r.thread?.campaign_tag === campaignTag))
      setLoading(false)
    }

    fetchReplies()

    const channel = supabase
      .channel('replies-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'replies' }, (payload) => {
        setReplies(prev => [payload.new as Reply, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campaignTag])

  return { replies, loading, error }
}
