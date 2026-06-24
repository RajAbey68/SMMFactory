import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const body = await req.json()
  const { url, label, diff } = body

  if (!label?.startsWith('brampton-k34yx552')) {
    return new Response('Not a Brampton monitor', { status: 200 })
  }

  const { data: thread } = await supabase
    .from('threads')
    .select('id, community_id')
    .eq('url', url)
    .single()

  if (!thread) return new Response('Thread not found', { status: 200 })

  const content = typeof diff === 'string'
    ? diff.slice(0, 2000)
    : JSON.stringify(diff).slice(0, 2000)

  await supabase.from('replies').insert({
    thread_id: thread.id,
    author: 'Forum Member',
    content,
    url,
    source: 'firecrawl',
  })

  return new Response('OK', { status: 200 })
})
