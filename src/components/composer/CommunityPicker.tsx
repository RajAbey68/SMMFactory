import type { Community } from '../../types'

interface CommunityPickerProps {
  communities: Community[]
  selected: Community | null
  onSelect: (c: Community | null) => void
}

export function CommunityPicker({ communities, selected, onSelect }: CommunityPickerProps) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Target Community</label>
      <select
        value={selected?.id ?? ''}
        onChange={e => {
          const found = communities.find(c => c.id === e.target.value) ?? null
          onSelect(found)
        }}
        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">Select a community…</option>
        {communities.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  )
}
