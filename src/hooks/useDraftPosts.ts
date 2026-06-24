import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Post } from '../types'

export function useDraftPosts(campaignTag: string) {
  const [drafts, setDrafts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!campaignTag) {
      setDrafts([])
      setLoading(false)
      return
    }

    const fetch = () =>
      supabase
        .from('posts')
        .select('*, community:communities(*)')
        .eq('status', 'draft')
        .eq('campaign_tag', campaignTag)
        .order('created_at', { ascending: false })
        .then(({ data }) => setDrafts((data as Post[]) ?? []))

    fetch().then(() => setLoading(false))

    const channel = supabase
      .channel(`drafts-${campaignTag}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, fetch)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [campaignTag])

  return { drafts, loading }
}
