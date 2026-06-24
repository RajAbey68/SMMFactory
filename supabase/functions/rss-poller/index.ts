import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

interface FeedItem {
  id: string
  author: string
  content: string
  link: string
  title: string
}

async function parseRSS(url: string): Promise<FeedItem[]> {
  const res = await fetch(url, { headers: { 'User-Agent': 'NexCampForumHub/1.0' } })
  const text = await res.text()
  const items: FeedItem[] = []
  const itemMatches = text.matchAll(/<item>([\s\S]*?)<\/item>/g)

  for (const match of itemMatches) {
    const item = match[1]
    const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
      ?? item.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
    const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? ''
    const author = item.match(/<author>(.*?)<\/author>/)?.[1]
      ?? item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]><\/dc:creator>/)?.[1] ?? 'Anonymous'
    const content = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s)?.[1]
      ?.replace(/<[^>]+>/g, '').trim() ?? ''
    const guid = item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? link

    if (link) items.push({ id: guid, author, content, link, title })
  }

  return items
}

Deno.serve(async () => {
  const { data: communities } = await supabase
    .from('communities')
    .select('*')
    .in('type', ['rss', 'reddit'])
    .eq('active', true)

  if (!communities) return new Response('No communities', { status: 200 })

  for (const community of communities) {
    if (!community.rss_url) continue
    const items = await parseRSS(community.rss_url).catch(() => [])

    for (const item of items.slice(0, 20)) {
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .eq('community_id', community.id)
        .eq('external_id', item.id)
        .single()

      let threadId: string

      if (existingThread) {
        threadId = existingThread.id
      } else {
        const { data: newThread } = await supabase
          .from('threads')
          .insert({
            community_id: community.id,
            external_id: item.id,
            title: item.title,
            url: item.link,
            campaign_tag: community.campaign_tag,
          })
          .select('id')
          .single()

        if (!newThread) continue
        threadId = newThread.id
      }

      await supabase.from('replies').upsert({
        thread_id: threadId,
        external_id: item.id,
        author: item.author,
        content: item.content.slice(0, 2000),
        url: item.link,
        source: 'rss',
      }, { onConflict: 'external_id' })
    }
  }

  return new Response('OK', { status: 200 })
})
