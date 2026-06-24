import { useState } from 'react'
import type { Community } from '../types'

export interface ComposerState {
  community: Community | null
  content: string
  title: string
  status: 'idle' | 'posting' | 'success' | 'error'
  error: string | null
}

export function useComposer() {
  const [state, setState] = useState<ComposerState>({
    community: null,
    content: '',
    title: '',
    status: 'idle',
    error: null,
  })

  const setCommunity = (community: Community | null) =>
    setState(s => ({ ...s, community }))

  const setContent = (content: string) =>
    setState(s => ({ ...s, content }))

  const setTitle = (title: string) =>
    setState(s => ({ ...s, title }))

  const reset = () =>
    setState({ community: null, content: '', title: '', status: 'idle', error: null })

  const setStatus = (status: ComposerState['status'], error?: string) =>
    setState(s => ({ ...s, status, error: error ?? null }))

  return { state, setCommunity, setContent, setTitle, reset, setStatus }
}
