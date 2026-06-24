import type { Community } from '../../types'

interface PostActionsProps {
  community: Community | null
  content: string
  title: string
  status: 'idle' | 'posting' | 'success' | 'error'
  onPost: () => void
  onCopyAndOpen: () => void
}

export function PostActions({ community, content, status, onPost, onCopyAndOpen }: PostActionsProps) {
  const isReddit = community?.type === 'reddit'
  const disabled = !community || !content.trim() || status === 'posting'

  return (
    <div className="flex flex-col gap-2">
      {isReddit ? (
        <button
          onClick={onPost}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          {status === 'posting' ? 'Posting…' : 'Post to Reddit →'}
        </button>
      ) : (
        <button
          onClick={onCopyAndOpen}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-md transition-colors"
        >
          Copy & Open {community?.name ?? 'Forum'} →
        </button>
      )}
      <p className="text-xs text-gray-500">
        {isReddit
          ? 'Posts via Reddit API. Bot account required.'
          : 'Copies your post to clipboard and opens the forum. Paste and submit manually.'}
      </p>
    </div>
  )
}
