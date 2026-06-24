export interface RedditTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
}

export async function getRedditToken(): Promise<string> {
  const clientId = import.meta.env.VITE_REDDIT_CLIENT_ID
  const clientSecret = import.meta.env.VITE_REDDIT_CLIENT_SECRET
  const username = import.meta.env.VITE_REDDIT_USERNAME
  const password = import.meta.env.VITE_REDDIT_PASSWORD

  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NexCampForumHub/1.0 (by /u/BramptonCaseBot)',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
    }),
  })

  const data: RedditTokenResponse = await res.json()
  return data.access_token
}

export async function submitRedditPost(
  token: string,
  subreddit: string,
  title: string,
  text: string
): Promise<string> {
  const res = await fetch('https://oauth.reddit.com/api/submit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NexCampForumHub/1.0 (by /u/BramptonCaseBot)',
    },
    body: new URLSearchParams({
      sr: subreddit,
      kind: 'self',
      title,
      text,
      api_type: 'json',
    }),
  })

  const data = await res.json()
  const postId: string = data.json?.data?.id
  if (!postId) throw new Error(`Reddit submit failed: ${JSON.stringify(data.json?.errors)}`)
  return `https://www.reddit.com/r/${subreddit}/comments/${postId}/`
}

export async function submitRedditComment(
  token: string,
  parentId: string,
  text: string
): Promise<string> {
  const res = await fetch('https://oauth.reddit.com/api/comment', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'NexCampForumHub/1.0 (by /u/BramptonCaseBot)',
    },
    body: new URLSearchParams({
      parent: parentId,
      text,
      api_type: 'json',
    }),
  })

  const data = await res.json()
  const commentId: string = data.json?.data?.things?.[0]?.data?.id
  if (!commentId) throw new Error(`Reddit comment failed: ${JSON.stringify(data.json?.errors)}`)
  return commentId
}
