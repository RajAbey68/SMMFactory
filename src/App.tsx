import { useState, useEffect } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar } from './components/layout/Sidebar'
import { ThreadFeed } from './components/feed/ThreadFeed'
import { Composer } from './components/composer/Composer'
import { useCampaigns } from './hooks/useCampaigns'
import { useCommunities } from './hooks/useCommunities'
import { useThreadFeed } from './hooks/useThreadFeed'
import { useComposer } from './hooks/useComposer'
import type { Campaign } from './types'

export default function App() {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)

  const { campaigns, addCampaign } = useCampaigns()
  const { communities, addCommunity } = useCommunities(activeCampaign?.tag ?? '')
  const { replies, loading } = useThreadFeed(activeCampaign?.tag ?? '')
  const composer = useComposer()

  // Set first campaign as active once loaded
  useEffect(() => {
    if (!activeCampaign && campaigns.length > 0) {
      setActiveCampaign(campaigns[0])
    }
  }, [campaigns, activeCampaign])

  // Reset community selection when campaign changes
  const handleCampaignChange = (campaign: Campaign) => {
    setActiveCampaign(campaign)
    setSelectedCommunityId(null)
  }

  const filtered = selectedCommunityId
    ? replies.filter(r => r.thread?.community?.id === selectedCommunityId)
    : replies

  return (
    <>
      <AppLayout
        sidebar={
          <Sidebar
            campaigns={campaigns}
            activeCampaign={activeCampaign}
            onCampaignChange={handleCampaignChange}
            communities={communities}
            selected={selectedCommunityId}
            onSelect={setSelectedCommunityId}
            onAddCampaign={addCampaign}
            onAddCommunity={addCommunity}
          />
        }
        feed={<ThreadFeed replies={filtered} loading={loading} campaignName={activeCampaign?.name} />}
        composer={
          <Composer
            communities={communities}
            campaignTag={activeCampaign?.tag ?? ''}
            composer={composer}
          />
        }
      />
    </>
  )
}
