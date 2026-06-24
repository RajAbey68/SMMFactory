import { useState, useEffect } from 'react'
import { AppLayout } from './components/layout/AppLayout'
import { Sidebar } from './components/layout/Sidebar'
import { ThreadFeed } from './components/feed/ThreadFeed'
import { PostingPane } from './components/composer/PostingPane'
import { useCampaigns } from './hooks/useCampaigns'
import { useCommunities } from './hooks/useCommunities'
import { useThreadFeed } from './hooks/useThreadFeed'
import { useComposer } from './hooks/useComposer'
import type { Campaign, Reply } from './types'

export default function App() {
  const [activeCampaign, setActiveCampaign] = useState<Campaign | null>(null)
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null)
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null)

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

  const handleCampaignChange = (campaign: Campaign) => {
    setActiveCampaign(campaign)
    setSelectedCommunityId(null)
    setSelectedReply(null)
    composer.reset()
  }

  const handleSelectReply = (reply: Reply) => {
    setSelectedReply(reply)
    if (reply.thread?.community) {
      composer.setCommunity(reply.thread.community)
    }
  }

  const handleDiscard = () => {
    setSelectedReply(null)
    composer.reset()
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
        feed={
          <ThreadFeed
            replies={filtered}
            loading={loading}
            campaignName={activeCampaign?.name}
            onSelectReply={handleSelectReply}
            selectedReplyId={selectedReply?.id}
          />
        }
        composer={
          <PostingPane
            campaign={activeCampaign}
            communities={communities}
            campaignTag={activeCampaign?.tag ?? ''}
            selectedReply={selectedReply}
            onDiscard={handleDiscard}
            composer={composer}
          />
        }
      />
    </>
  )
}
