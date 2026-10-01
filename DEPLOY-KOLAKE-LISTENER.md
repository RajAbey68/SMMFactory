# Ko Lake Villa Community Listener — Deployment Guide

## Overview
3-hourly community listener that monitors Reddit, web search, and X/Twitter for Sri Lanka travel planning signals, scores them via `forager-runner`, and emails a digest to `mrg5ah@mail.instinct.com`.

## Architecture
```
cron (3h) → kolake-community-listener.mjs
    → web-search-ingest.mjs (search adapter: Hermes web_search or SEARCH_API_URL)
    → vilaforager-watcher.mjs (scoreSignal + dedupe)
    → forager-runner.mjs (draft + grounding gate)
    → email-digest.mjs (nodemailer SMTP)
    → PM2 on Hermes-Dev (167.233.236.178)
```

## Prerequisites on Hermes-Dev
- Node 26+
- PM2 (`npm install -g pm2`)
- SMTP credentials (Gmail app password or transactional provider)
- Search API fallback (optional) — `SEARCH_API_URL` env var

## Deploy Steps

### 1. Copy project to Hermes-Dev
```bash
# From local
rsync -avz --exclude node_modules --exclude .git \
  /Users/rajabey/code/SMMFactory/ \
  root@167.233.236.178:/home/rajabey/SMMFactory/
```

### 2. Install dependencies on Hermes-Dev
```bash
ssh root@167.233.236.178
cd /home/rajabey/SMMFactory
npm install
```

### 3. Configure environment
Create `/home/rajabey/SMMFactory/.env`:
```bash
# SMTP (required for email digest)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-gmail@gmail.com
SMTP_PASS=your-app-password
DIGEST_TO=mrg5ah@mail.instinct.com
DIGEST_FROM="Ko Lake Villa Listener <noreply@kolakevilla.com>"

# Optional: external search API fallback (if Hermes web_search unavailable)
# SEARCH_API_URL=https://your-search-api.example.com/search

# Buzz relay (already in ecosystem config)
BUZZ_RELAY_URL=wss://theahg.communities.buzz.xyz
```

### 4. Start with PM2
```bash
cd /home/rajabey/SMMFactory
pm2 start ecosystem.kolake-community-listener.json --env production
pm2 save
pm2 startup  # follow instructions to persist across reboots
```

### 5. Verify
```bash
pm2 logs kolake-community-listener --lines 50
# Should show: "Starting run at ...", "Ingested X signals", "Digest sent successfully"
```

### 6. Test manual run
```bash
cd /home/rajabey/SMMFactory
node scripts/kolake-community-listener.mjs
```

## Email Digest Format
```
Subject: KLV listener digest - 2026-10-01 14:30:00 UTC

RAW SIGNALS (3)
───────────────────────────────────────
1. REDDIT | SriLankaTravel
   URL: https://reddit.com/r/SriLankaTravel/comments/...
   Author: traveler123
   Time: 2026-09-30T10:15:00Z
   Ask: Looking for group villa in Ahangama for 12 people in December
   Matched: Group-buyout intent, Corroboration: location or party size

VETTED SIGNALS (passed grounding gate: 2/3)
───────────────────────────────────────
1. REDDIT | SriLankaTravel
   URL: https://reddit.com/r/SriLankaTravel/comments/...
   Author: traveler123
   Time: 2026-09-30T10:15:00Z
   Ask: Looking for group villa in Ahangama for 12 people in December
   Matched: Group-buyout intent, Corroboration: location or party size
   Draft: Hi — spotted your note on "looking for group villa in ahangama for 12 people in december" and Ko Lake Villa (Koggala / Ahangama) may fit: 7 AC en-suite bedrooms for group buyouts. From $250/night whole villa, private pool, in-house chef, 300 Mbps Starlink. WhatsApp concierge https://wa.me/94711730345 · www.kolakevilla.com. For more information about our unique accommodations and to explore the amenities of Ko Lake Villa, please visit our website at www.kolakevilla.com. Book your stay today and experience the tranquility of lakeside living!

SOURCES CHECKED: 7
SOURCES FAILED: 0
DEDUPLICATION WINDOW: 3 days (URL + title)
TOTAL ITEMS IN DIGEST: 5
```

## Monitoring
- **PM2**: `pm2 monit` or `pm2 logs kolake-community-listener`
- **Log files**: `/home/rajabey/logs/kolake-community-listener-*.log`
- **Digest log**: `/home/rajabey/SMMFactory/campaigns/digest_log.json`
- **Lead states**: `/home/rajabey/SMMFactory/campaigns/lead_states.json`
- **Discovered leads**: `/home/rajabey/SMMFactory/campaigns/discovered_leads.json`

## Troubleshooting
| Issue | Fix |
|-------|-----|
| Email not sending | Check SMTP creds, test with `node -e "require('./tools/email-digest.mjs').sendDigestEmail({...})"` |
| No signals found | Verify search queries in `web-search-ingest.mjs`, check `sources_failed` in logs |
| Dedupe not working | Check `discovered_leads.json` format, ensure `dedupKey` matches |
| Grounding gate failing | Review `assertGroundedOutput` in `vilaforager-drafter.mjs` — no banned words, prices ≥ $250 |

## Rollback
```bash
pm2 stop kolake-community-listener
pm2 delete kolake-community-listener
# Fix code, then restart
pm2 start ecosystem.kolake-community-listener.json --env production
```

## Key Files
| File | Purpose |
|------|---------|
| `scripts/kolake-community-listener.mjs` | Main orchestrator |
| `tools/web-search-ingest.mjs` | Search ingestion (Reddit, web, X) |
| `tools/vilaforager-watcher.mjs` | Scoring + dedupe |
| `scripts/forager-runner.mjs` | Draft + grounding gate |
| `tools/vilaforager-drafter.mjs` | Draft generation + grounding |
| `tools/email-digest.mjs` | Email formatting + sending |
| `tools/lead-lifecycle.mjs` | Lead state machine |
| `ecosystem.kolake-community-listener.json` | PM2 config |