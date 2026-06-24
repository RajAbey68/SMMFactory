export async function notifyDiscord(payload: {
  platform: string
  author: string
  excerpt: string
  threadUrl: string
  replyUrl: string | null
}): Promise<void> {
  const webhookUrl = import.meta.env.VITE_DISCORD_WEBHOOK_URL
  if (!webhookUrl) return

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: `📬 New reply on ${payload.platform}`,
        description: payload.excerpt.slice(0, 300),
        color: 0xe94560,
        fields: [
          { name: 'Author', value: payload.author, inline: true },
          { name: 'Thread', value: `[Open](${payload.threadUrl})`, inline: true },
          ...(payload.replyUrl ? [{ name: 'Reply', value: `[View](${payload.replyUrl})`, inline: true }] : []),
        ],
        timestamp: new Date().toISOString(),
      }],
    }),
  })
}
