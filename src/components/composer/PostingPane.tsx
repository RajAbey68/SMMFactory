import { formatDistanceToNow } from 'date-fns'
import { supabase } from '../../lib/supabase'
import { getRedditToken, submitRedditPost } from '../../lib/reddit'
import type { Campaign, Community, Reply } from '../../types'
import type { ComposerState } from '../../hooks/useComposer'
import { CommunityPicker } from './CommunityPicker'

const CHAR_LIMITS: Record<string, number> = {
  reddit: 40000,
  rss: 10000,
  firecrawl: 10000,
  email: 100000,
}

interface PostingPaneProps {
  campaign: Campaign | null
  communities: Community[]
  campaignTag: string
  selectedReply: Reply | null
  onDiscard: () => void
  composer: {
    state: ComposerState
    setCommunity: (c: Community | null) => void
    setContent: (s: string) => void
    setTitle: (s: string) => void
    reset: () => void
    setStatus: (s: ComposerState['status'], err?: string) => void
  }
}

export function PostingPane({
  campaign,
  communities,
  campaignTag,
  selectedReply,
  onDiscard,
  composer,
}: PostingPaneProps) {
  const { state, setCommunity, setContent, setTitle, setStatus, reset } = composer

  // Community from selected reply takes precedence over composer picker
  const activeCommunity = selectedReply?.thread?.community ?? state.community

  const charLimit = CHAR_LIMITS[activeCommunity?.type ?? 'rss'] ?? 10000
  const overLimit = state.content.length > charLimit
  const isPosting = state.status === 'posting'
  const isReddit = activeCommunity?.type === 'reddit'
  const platformColor = activeCommunity?.color ?? campaign?.color ?? '#6366f1'

  const canSubmit =
    !!activeCommunity &&
    state.content.trim().length > 0 &&
    !isPosting &&
    !overLimit &&
    (!isReddit || state.title.trim().length > 0)

  const handlePost = async () => {
    if (!canSubmit || !activeCommunity) return
    setStatus('posting')
    try {
      if (isReddit) {
        const token = await getRedditToken()
        const subreddit = activeCommunity.url.match(/reddit\.com\/r\/([^/]+)/)?.[1] ?? 'LegalAdviceUK'
        await submitRedditPost(token, subreddit, state.title, state.content)
        await supabase.from('posts').insert({
          community_id: activeCommunity.id,
          thread_id: selectedReply?.thread_id ?? null,
          content: state.content,
          status: 'posted',
          post_method: 'reddit_api',
          posted_at: new Date().toISOString(),
          campaign_tag: campaignTag,
        })
      } else {
        const text = state.title ? `${state.title}\n\n${state.content}` : state.content
        await navigator.clipboard.writeText(text)
        await supabase.from('posts').insert({
          community_id: activeCommunity.id,
          thread_id: selectedReply?.thread_id ?? null,
          content: state.content,
          status: 'approved',
          post_method: 'manual_clipboard',
          campaign_tag: campaignTag,
        })
        window.open(activeCommunity.url, '_blank')
      }
      setStatus('success')
      setTimeout(() => { reset(); onDiscard() }, 2000)
    } catch (err) {
      setStatus('error', err instanceof Error ? err.message : 'Post failed')
    }
  }

  const handleSaveDraft = async () => {
    if (!activeCommunity || !state.content.trim()) return
    setStatus('posting')
    try {
      await supabase.from('posts').insert({
        community_id: activeCommunity.id,
        thread_id: selectedReply?.thread_id ?? null,
        content: state.content,
        status: 'draft',
        post_method: isReddit ? 'reddit_api' : 'manual_clipboard',
        campaign_tag: campaignTag,
      })
      setStatus('success')
      setTimeout(() => { reset(); onDiscard() }, 1500)
    } catch (err) {
      setStatus('error', err instanceof Error ? err.message : 'Failed to save draft')
    }
  }

  const handleDiscard = () => {
    reset()
    onDiscard()
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Section 1 — Campaign theme strip */}
      {campaign && (
        <div
          className="h-12 flex-shrink-0 flex items-center px-4 gap-3 border-b border-gray-800"
          style={{ borderTopColor: campaign.color, borderTopWidth: 2 }}
        >
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: campaign.color }} />
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Campaign</p>
            <p className="text-[11px] font-semibold text-gray-200 truncate leading-tight">{campaign.name}</p>
          </div>
        </div>
      )}

      {/* Section 2 — Community context */}
      {activeCommunity ? (
        <div className="h-8 flex-shrink-0 flex items-center justify-between px-4 border-b border-gray-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: activeCommunity.color }} />
            <span className="text-[10px] font-medium text-gray-400 truncate">{activeCommunity.name}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 flex-shrink-0">
              {activeCommunity.type}
            </span>
          </div>
          <a
            href={activeCommunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-gray-300 flex-shrink-0 ml-2 transition-colors"
            aria-label={`Open ${activeCommunity.name}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      ) : (
        <div className="h-8 flex-shrink-0 flex items-center px-4 border-b border-gray-800">
          <span className="text-[10px] text-gray-600">Select a community below</span>
        </div>
      )}

      {/* Section 3 — Thread context card (only when replying to something) */}
      {selectedReply?.thread && (
        <div className="flex-shrink-0 px-3 py-2.5 border-b border-gray-800">
          <div
            className="pl-3 border-l-2 py-0.5"
            style={{ borderLeftColor: activeCommunity?.color ?? '#6366f1' }}
          >
            <p className="text-[10px] font-medium text-gray-300 truncate">
              {selectedReply.thread.title}
            </p>
            <p className="text-[10px] text-gray-500 line-clamp-2 leading-snug mt-0.5">
              {selectedReply.content}
            </p>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-gray-600">{selectedReply.author}</span>
              <span className="text-[9px] text-gray-600">
                {formatDistanceToNow(new Date(selectedReply.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Section 4 — Composer */}
      <div className="flex-1 flex flex-col min-h-0 px-4 pt-3 pb-2 gap-3 overflow-hidden">
        {!selectedReply && (
          <CommunityPicker
            communities={communities}
            selected={state.community}
            onSelect={setCommunity}
          />
        )}

        {isReddit && (
          <div>
            <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
              Post Title
            </label>
            <input
              type="text"
              value={state.title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Thread title…"
              maxLength={300}
              className="w-full bg-[#0d0d10] border border-gray-800 px-3 py-2 text-xs text-gray-100 placeholder-gray-700 focus:outline-none focus:border-gray-600 transition-colors"
            />
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <label className="block text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">
            {selectedReply ? 'Your Reply' : 'Message'}
          </label>
          <textarea
            value={state.content}
            onChange={e => setContent(e.target.value)}
            placeholder={selectedReply ? 'Write your reply…' : 'Write your post…'}
            className="flex-1 resize-none bg-[#0d0d10] border border-gray-800 px-3 py-2 text-xs text-gray-100 placeholder-gray-700 focus:outline-none focus:border-gray-600 transition-colors min-h-0"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-gray-600">
              {selectedReply ? `Replying to ${selectedReply.author}` : ''}
            </span>
            <span className={`text-[9px] ${overLimit ? 'text-red-400' : 'text-gray-600'}`}>
              {state.content.length.toLocaleString()}/{charLimit.toLocaleString()}
            </span>
          </div>
        </div>

        {state.status === 'error' && (
          <p className="flex-shrink-0 text-[10px] text-red-400 bg-red-950/30 border border-red-900/50 px-3 py-1.5">
            {state.error}
          </p>
        )}
        {state.status === 'success' && (
          <p className="flex-shrink-0 text-[10px] text-green-400 bg-green-950/30 border border-green-900/50 px-3 py-1.5">
            {isReddit ? 'Posted successfully.' : 'Copied to clipboard. Forum opened.'}
          </p>
        )}
      </div>

      {/* Section 5 — Action bar */}
      <div className="h-14 flex-shrink-0 flex items-center justify-end gap-2 px-4 border-t border-gray-800">
        <button
          onClick={handleDiscard}
          className="text-[11px] text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
        >
          Discard
        </button>
        <button
          onClick={handleSaveDraft}
          disabled={!activeCommunity || !state.content.trim() || isPosting}
          className="text-[11px] px-3 py-1.5 border border-gray-700 text-gray-400 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Save Draft
        </button>
        <button
          onClick={handlePost}
          disabled={!canSubmit}
          className="text-[11px] font-semibold px-4 py-1.5 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: canSubmit ? platformColor : '#374151' }}
        >
          {isPosting ? 'Posting…' : isReddit ? 'Post to Reddit →' : 'Copy & Open →'}
        </button>
      </div>
    </div>
  )
}
