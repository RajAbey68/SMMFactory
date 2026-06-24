export interface Campaign {
  id: string
  name: string
  tag: string
  description: string | null
  color: string
  active: boolean
  created_at: string
}

export type CommunityType = 'reddit' | 'rss' | 'firecrawl' | 'email'
export type ThreadStatus = 'active' | 'resolved' | 'archived'
export type PostStatus = 'draft' | 'approved' | 'posted' | 'scheduled'
export type PostMethod = 'reddit_api' | 'manual_clipboard' | 'email'
export type ReplySource = 'rss' | 'firecrawl' | 'reddit_api' | 'manual'

export interface Community {
  id: string
  name: string
  type: CommunityType
  url: string
  rss_url: string | null
  color: string
  campaign_tag: string
  active: boolean
  created_at: string
}

export interface Thread {
  id: string
  community_id: string
  external_id: string | null
  title: string
  url: string
  posted_by_us: boolean
  status: ThreadStatus
  firecrawl_monitor_id: string | null
  campaign_tag: string
  created_at: string
  last_activity_at: string
  community?: Community
}

export interface Reply {
  id: string
  thread_id: string
  external_id: string | null
  author: string
  content: string
  url: string | null
  source: ReplySource
  notified_discord: boolean
  notified_leadsync: boolean
  created_at: string
  thread?: Thread
}

export interface Post {
  id: string
  community_id: string
  thread_id: string | null
  content: string
  status: PostStatus
  post_method: PostMethod
  posted_at: string | null
  campaign_tag: string
  created_at: string
  community?: Community
}
