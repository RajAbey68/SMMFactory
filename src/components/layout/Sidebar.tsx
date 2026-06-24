import type { Community } from '../../types'

interface SidebarProps {
  communities: Community[]
  selected: string | null
  onSelect: (id: string | null) => void
}

export function Sidebar({ communities, selected, onSelect }: SidebarProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-gray-800">
        <h1 className="text-lg font-bold tracking-tight">NexCamp</h1>
        <p className="text-xs text-gray-400 mt-0.5">Brampton K34YX552</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
            selected === null ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50'
          }`}
        >
          All Communities
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
            {c.name}
          </button>
        ))}
      </nav>
    </div>
  )
}
