import { formatDistanceToNow } from 'date-fns'
import type { Reply } from '../../types'

interface ReplyCardProps {
  reply: Reply
}

export function ReplyCard({ reply }: ReplyCardProps) {
  const community = reply.thread?.community
  const communityColor = community?.color ?? '#6366f1'
  const communityName = community?.name ?? 'Unknown'
  const threadTitle = reply.thread?.title ?? 'Thread'

  return (
    <article className="px-5 py-4 border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-medium"
          style={{ backgroundColor: `${communityColor}22`, color: communityColor }}
        >
          {communityName}
        </span>
        <span className="text-xs text-gray-500 truncate flex-1">{threadTitle}</span>
        <time className="text-xs text-gray-500 shrink-0">
          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
        </time>
      </div>
      <p className="text-sm font-medium text-gray-200 mb-1">{reply.author}</p>
      <p className="text-sm text-gray-400 line-clamp-3">{reply.content}</p>
      {reply.url && (
        <a
          href={reply.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-xs text-blue-400 hover:underline"
        >
          View on {communityName} →
        </a>
      )}
    </article>
  )
}
