import { useState } from 'react'
import type { Campaign, Community } from '../../types'
import { NewCampaignModal } from '../campaigns/NewCampaignModal'

interface SidebarProps {
  campaigns: Campaign[]
  activeCampaign: Campaign | null
  onCampaignChange: (c: Campaign) => void
  communities: Community[]
  selected: string | null
  onSelect: (id: string | null) => void
  onAddCampaign: (c: Omit<Campaign, 'id' | 'created_at'>) => Promise<Campaign>
  onAddCommunity: (c: Omit<Community, 'id' | 'created_at'>) => Promise<Community>
}

export function Sidebar({
  campaigns,
  activeCampaign,
  onCampaignChange,
  communities,
  selected,
  onSelect,
  onAddCampaign,
  onAddCommunity,
}: SidebarProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="flex flex-col h-full">
      <div className="px-3 py-4 border-b border-gray-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NexCamp</span>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            title="New Campaign"
          >
            + New
          </button>
        </div>
        <select
          value={activeCampaign?.id ?? ''}
          onChange={e => {
            const found = campaigns.find(c => c.id === e.target.value)
            if (found) onCampaignChange(found)
          }}
          className="w-full bg-gray-900 border border-gray-700 rounded-md px-2.5 py-1.5 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          style={{ borderLeftColor: activeCampaign?.color, borderLeftWidth: 3 }}
        >
          {campaigns.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
          {campaigns.length === 0 && (
            <option disabled>No campaigns yet</option>
          )}
        </select>
        {activeCampaign?.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-snug">{activeCampaign.description}</p>
        )}
      </div>

      <div className="px-3 py-2">
        <p className="text-xs text-gray-600 uppercase tracking-wider font-medium px-1 mb-1">Communities</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selected === null ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
          }`}
        >
          All
        </button>
        {communities.map(c => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
              selected === c.id ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: c.color }}
            />
            <span className="truncate">{c.name}</span>
          </button>
        ))}
        {communities.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-600">No communities yet.</p>
        )}
      </nav>

      {showModal && (
        <NewCampaignModal
          onClose={() => setShowModal(false)}
          onCreated={(campaign) => {
            onCampaignChange(campaign)
            setShowModal(false)
          }}
          onAddCampaign={onAddCampaign}
          onAddCommunity={onAddCommunity}
        />
      )}
    </div>
  )
}
