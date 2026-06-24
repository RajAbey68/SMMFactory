import type { ReactNode } from 'react'

interface AppLayoutProps {
  sidebar: ReactNode
  feed: ReactNode
  composer: ReactNode
}

export function AppLayout({ sidebar, feed, composer }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      <aside className="w-64 shrink-0 border-r border-gray-800 flex flex-col">
        {sidebar}
      </aside>
      <main className="flex-1 overflow-y-auto">
        {feed}
      </main>
      <aside className="w-96 shrink-0 border-l border-gray-800 flex flex-col">
        {composer}
      </aside>
    </div>
  )
}
