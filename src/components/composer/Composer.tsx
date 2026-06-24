import { supabase } from '../../lib/supabase'
import { getRedditToken, submitRedditPost } from '../../lib/reddit'
import type { Community } from '../../types'
import type { ComposerState } from '../../hooks/useComposer'
import { CommunityPicker } from './CommunityPicker'
import { PostActions } from './PostActions'

interface ComposerProps {
  communities: Community[]
  campaignTag: string
  composer: {
    state: ComposerState
    setCommunity: (c: Community | null) => void
    setContent: (s: string) => void
    setTitle: (s: string) => void
    reset: () => void
    setStatus: (s: ComposerState['status'], err?: string) => void
  }
}

export function Composer({ communities, campaignTag, composer }: ComposerProps) {
  const { state, setCommunity, setContent, setTitle, setStatus, reset } = composer

  const handleRedditPost = async () => {
    if (!state.community || !state.content || !state.title) return
    setStatus('posting')
    try {
      const token = await getRedditToken()
      const subreddit = state.community.url.match(/reddit\.com\/r\/([^/]+)/)?.[1] ?? 'LegalAdviceUK'
      await submitRedditPost(token, subreddit, state.title, state.content)
      await supabase.from('posts').insert({
        community_id: state.community.id,
        content: state.content,
        status: 'posted',
        post_method: 'reddit_api',
        posted_at: new Date().toISOString(),
        campaign_tag: campaignTag,
      })
      setStatus('success')
      setTimeout(reset, 2000)
    } catch (err) {
      setStatus('error', err instanceof Error ? err.message : 'Post failed')
    }
  }

  const handleCopyAndOpen = async () => {
    if (!state.community || !state.content) return
    const text = state.title ? `${state.title}\n\n${state.content}` : state.content
    await navigator.clipboard.writeText(text)
    await supabase.from('posts').insert({
      community_id: state.community.id,
      content: state.content,
      status: 'approved',
      post_method: 'manual_clipboard',
      campaign_tag: campaignTag,
    })
    window.open(state.community.url, '_blank')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="text-sm font-semibold text-gray-300">Compose Post</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <CommunityPicker
          communities={communities}
          selected={state.community}
          onSelect={setCommunity}
        />
        {state.community?.type === 'reddit' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 font-medium">Post Title</label>
            <input
              type="text"
              value={state.title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Thread title…"
              className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">Message</label>
          <textarea
            value={state.content}
            onChange={e => setContent(e.target.value)}
            rows={12}
            placeholder="Write your post here…"
            className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-600 mt-1">{state.content.length} chars</p>
        </div>
        {state.status === 'error' && (
          <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">{state.error}</p>
        )}
        {state.status === 'success' && (
          <p className="text-xs text-green-400 bg-green-900/20 px-3 py-2 rounded">Posted successfully.</p>
        )}
      </div>
      <div className="px-4 py-4 border-t border-gray-800">
        <PostActions
          community={state.community}
          content={state.content}
          title={state.title}
          status={state.status}
          onPost={handleRedditPost}
          onCopyAndOpen={handleCopyAndOpen}
        />
      </div>
    </div>
  )
}
