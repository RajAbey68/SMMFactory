import { createClient } from 'jsr:@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  const payload = await req.json()
  const reply = payload.record
  if (!reply) return new Response('No record', { status: 400 })

  const { data: thread } = await supabase
    .from('threads')
    .select('*, community:communities(*)')
    .eq('id', reply.thread_id)
    .single()

  if (!thread) return new Response('Thread not found', { status: 404 })

  const communityName = thread.community?.name ?? 'Unknown forum'
  const excerpt = reply.content.slice(0, 280)

  const discordUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
  if (discordUrl) {
    await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `📬 New reply on ${communityName}`,
          description: excerpt,
          color: 0xe94560,
          fields: [
            { name: 'Author', value: reply.author, inline: true },
            { name: 'Thread', value: thread.title, inline: true },
          ],
          url: reply.url ?? thread.url,
          timestamp: new Date().toISOString(),
        }],
      }),
    }).catch(console.error)
  }

  const leadsyncUrl = Deno.env.get('LEADSYNC_API_URL')
  const leadsyncSecret = Deno.env.get('LEADSYNC_INTERNAL_SECRET')
  if (leadsyncUrl && leadsyncSecret) {
    await fetch(`${leadsyncUrl}/api/activities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': leadsyncSecret,
      },
      body: JSON.stringify({
        type: 'inbound_reply',
        channel: 'forum',
        platform: communityName,
        content: excerpt,
        url: reply.url,
        campaign_tag: 'brampton-k34yx552',
      }),
    }).catch(console.error)
  }

  await supabase
    .from('replies')
    .update({ notified_discord: true, notified_leadsync: true })
    .eq('id', reply.id)

  return new Response('OK', { status: 200 })
})
