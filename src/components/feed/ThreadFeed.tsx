import type { Reply } from '../../types'
import { ReplyCard } from './ReplyCard'

interface ThreadFeedProps {
  replies: Reply[]
  loading: boolean
}

export function ThreadFeed({ replies, loading }: ThreadFeedProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        Loading…
      </div>
    )
  }

  if (replies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm gap-3 py-20">
        <span className="text-3xl">💬</span>
        <p>No replies yet.</p>
        <p className="text-xs text-gray-600">Post to a community to start monitoring.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-950/95 backdrop-blur-sm z-10">
        <h2 className="text-sm font-semibold text-gray-300">Activity Feed</h2>
        <span className="text-xs text-gray-500">{replies.length} replies</span>
      </div>
      {replies.map(reply => (
        <ReplyCard key={reply.id} reply={reply} />
      ))}
    </div>
  )
}
