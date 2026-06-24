import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../../lib/supabase'
import type { Post } from '../../types'

interface ApprovalQueueProps {
  drafts: Post[]
  loading: boolean
}

export function ApprovalQueue({ drafts, loading }: ApprovalQueueProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center flex-1 text-gray-500 text-xs">
        Loading drafts…
      </div>
    )
  }

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 text-gray-600 text-xs gap-2 py-10 px-6 text-center">
        <span className="text-2xl">📋</span>
        <p className="font-medium text-gray-500">No pending drafts</p>
        <p>Save a draft from the Compose tab to queue it for review here.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {drafts.map(draft => (
        <DraftCard key={draft.id} draft={draft} />
      ))}
    </div>
  )
}

function DraftCard({ draft }: { draft: Post }) {
  const [state, setState] = useState<'idle' | 'approving' | 'deleting' | 'done'>('idle')
  const communityColor = draft.community?.color ?? '#6366f1'
  const communityName = draft.community?.name ?? 'Unknown community'
  const isReddit = draft.community?.type === 'reddit'

  const [approveError, setApproveError] = useState<string | null>(null)

  const handleApprove = async () => {
    setState('approving')
    setApproveError(null)
    try {
      if (!isReddit && draft.community) {
        try {
          await navigator.clipboard.writeText(draft.content)
        } catch {
          throw new Error('Clipboard blocked — grant clipboard permission and retry')
        }
      }
      await supabase.from('posts').update({ status: 'approved', posted_at: new Date().toISOString() }).eq('id', draft.id)
      if (!isReddit && draft.community) {
        window.open(draft.community.url, '_blank')
      }
      setState('done')
    } catch (err) {
      setApproveError(err instanceof Error ? err.message : 'Approve failed')
      setState('idle')
    }
  }

  const handleDelete = async () => {
    setState('deleting')
    try {
      await supabase.from('posts').delete().eq('id', draft.id)
    } catch {
      setState('idle')
    }
  }

  if (state === 'done') return null

  return (
    <div className="px-4 py-3 border-b border-gray-800">
      {/* Community badge */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${communityColor}22`, color: communityColor }}
        >
          {communityName}
        </span>
        <span className="text-[9px] text-gray-600 ml-auto">
          {formatDistanceToNow(new Date(draft.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Content preview */}
      <p className="text-xs text-gray-300 line-clamp-4 mb-3 leading-relaxed">{draft.content}</p>

      {approveError && (
        <p className="text-[10px] text-red-400 bg-red-950/30 border border-red-900/50 px-2 py-1 mb-2">
          {approveError}
        </p>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={state !== 'idle'}
          className="text-[10px] text-gray-500 hover:text-red-400 disabled:opacity-30 transition-colors px-1"
        >
          {state === 'deleting' ? 'Deleting…' : 'Delete'}
        </button>
        <button
          onClick={handleApprove}
          disabled={state !== 'idle'}
          className="ml-auto text-[10px] font-semibold px-3 py-1 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: state === 'idle' ? communityColor : '#374151' }}
        >
          {state === 'approving'
            ? 'Approving…'
            : isReddit
            ? 'Approve → Post to Reddit'
            : 'Approve → Copy & Open'}
        </button>
      </div>
    </div>
  )
}
