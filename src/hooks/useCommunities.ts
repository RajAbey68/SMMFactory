import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Community } from '../types'

export function useCommunities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('communities')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setCommunities(data ?? [])
        setLoading(false)
      })
  }, [])

  return { communities, loading, error }
}
