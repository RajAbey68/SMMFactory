import { useState } from 'react'
import type { Campaign, Community, CommunityType } from '../../types'

const COLORS = ['#e94560', '#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#14b8a6']

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function detectType(url: string): CommunityType {
  if (url.includes('reddit.com')) return 'reddit'
  return 'firecrawl'
}

function redditRssUrl(url: string): string | null {
  const match = url.match(/reddit\.com\/r\/([^/]+)/)
  return match ? `https://www.reddit.com/r/${match[1]}.rss` : null
}

interface CommunityDraft {
  name: string
  url: string
  type: CommunityType
  rss_url: string
  color: string
}

interface NewCampaignModalProps {
  onClose: () => void
  onCreated: (campaign: Campaign) => void
  onAddCampaign: (c: Omit<Campaign, 'id' | 'created_at'>) => Promise<Campaign>
  onAddCommunity: (c: Omit<Community, 'id' | 'created_at'>) => Promise<Community>
}

export function NewCampaignModal({ onClose, onCreated, onAddCampaign, onAddCommunity }: NewCampaignModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [communities, setCommunities] = useState<CommunityDraft[]>([
    { name: '', url: '', type: 'firecrawl', rss_url: '', color: '#6366f1' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCommunity = (i: number, field: keyof CommunityDraft, value: string) => {
    setCommunities(prev => prev.map((c, idx) => {
      if (idx !== i) return c
      const updated = { ...c, [field]: value }
      if (field === 'url') {
        updated.type = detectType(value)
        const rss = redditRssUrl(value)
        if (rss) updated.rss_url = rss
      }
      return updated
    }))
  }

  const addCommunityRow = () =>
    setCommunities(prev => [...prev, { name: '', url: '', type: 'firecrawl', rss_url: '', color: '#6366f1' }])

  const removeCommunityRow = (i: number) =>
    setCommunities(prev => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Campaign name is required'); return }
    const validCommunities = communities.filter(c => c.name.trim() && c.url.trim())
    setSaving(true)
    setError(null)
    try {
      const campaign = await onAddCampaign({
        name: name.trim(),
        tag: slugify(name.trim()),
        description: description.trim() || null,
        color,
        active: true,
      })
      await Promise.all(validCommunities.map(c =>
        onAddCommunity({
          name: c.name.trim(),
          url: c.url.trim(),
          type: c.type,
          rss_url: c.rss_url.trim() || null,
          color: c.color,
          campaign_tag: campaign.tag,
          active: true,
        })
      ))
      onCreated(campaign)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h2 className="text-sm font-semibold text-gray-100">New Campaign</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Campaign Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Python Developers UK, Labour Policy Watch"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {name && (
              <p className="mt-1 text-xs text-gray-600">tag: {slugify(name)}</p>
            )}
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="What is this campaign about?"
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Campaign Colour</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-gray-400 font-medium">Communities to Monitor</label>
              <button
                onClick={addCommunityRow}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                + Add
              </button>
            </div>
            <div className="space-y-3">
              {communities.map((c, i) => (
                <div key={i} className="bg-gray-800/60 rounded-lg p-3 space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => updateCommunity(i, 'name', e.target.value)}
                      placeholder="Display name"
                      className="flex-1 bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <select
                      value={c.type}
                      onChange={e => updateCommunity(i, 'type', e.target.value)}
                      className="bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-xs text-gray-100 focus:outline-none"
                    >
                      <option value="reddit">Reddit</option>
                      <option value="rss">RSS</option>
                      <option value="firecrawl">Web monitor</option>
                    </select>
                    {communities.length > 1 && (
                      <button onClick={() => removeCommunityRow(i)} className="text-gray-600 hover:text-red-400 text-xs">✕</button>
                    )}
                  </div>
                  <input
                    type="url"
                    value={c.url}
                    onChange={e => updateCommunity(i, 'url', e.target.value)}
                    placeholder="https://…"
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {(c.type === 'rss' || c.type === 'reddit') && (
                    <input
                      type="url"
                      value={c.rss_url}
                      onChange={e => updateCommunity(i, 'rss_url', e.target.value)}
                      placeholder="RSS feed URL (auto-detected for Reddit)"
                      className="w-full bg-gray-900 border border-gray-700 rounded px-2.5 py-1.5 text-xs text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">{error}</p>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-800 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-700 text-gray-300 text-sm rounded-md hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-sm rounded-md transition-colors"
          >
            {saving ? 'Creating…' : 'Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  )
}
