import { useState } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar } from './components/layout/Sidebar'
import { ThreadFeed } from './components/feed/ThreadFeed'
import { Composer } from './components/composer/Composer'
import { useCommunities } from './hooks/useCommunities'
import { useThreadFeed } from './hooks/useThreadFeed'
import { useComposer } from './hooks/useComposer'

export default function App() {
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)
  const { communities } = useCommunities()
  const { replies, loading } = useThreadFeed('brampton-k34yx552')
  const composer = useComposer()

  const filtered = selectedCommunityId
    ? replies.filter(r => r.thread?.community?.id === selectedCommunityId)
    : replies

  return (
    <AppLayout
      sidebar={
        <Sidebar
          communities={communities}
          selected={selectedCommunityId}
          onSelect={setSelectedCommunityId}
        />
      }
      feed={<ThreadFeed replies={filtered} loading={loading} />}
      composer={
        <Composer
          communities={communities}
          composer={composer}
        />
      }
    />
  )
}
