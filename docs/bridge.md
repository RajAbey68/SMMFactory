# Bridge Protocol — Ko Lake Villa Listener

## Source of truth for this doc
- File: docs/bridge.md (this file)
- Deployed config: ecosystem.kolake-community-listener.json (3h cron 0 */3 * * *)
- Relay endpoint: BUZZ_RELAY_URL = wss://theahg.communities.buzz.xyz
- Host: Hermes-Dev (167.233.236.178) — ports hang from outside (verified via curl 000 / rsync exit 124). Firewall/security-group at provider blocks external access; bridge is dark from outside.

## Why this doc exists
So the bridge protocol can be read straight from GitHub (origin/smm-pipeline-backup or PR) without copy-paste through a human.

## Architecture (verified from local repo, not fabricated)
cron (3h) -> kolake-community-listener.mjs
  -> web-search-ingest.mjs (Hermes web_search adapter OR SEARCH_API_URL fallback)
  -> vilaforager-watcher.mjs (scoreSignal + dedupe, SHA-256 key on URL + text)
  -> forager-runner.mjs (grounding gate: $250 buyout $45 room, KoLakeVilla-LIVE.md language, never "qualified leads")
  -> email-digest.mjs (nodemailer SMTP to mrg5ah@mail.instinct.com)
  -> PM2 on Hermes-Dev with ecosystem config

## Status (honest — verified in session)
- .env: IGNORED (.gitignore:9) — safe; NOT production (template, SMTP_USER/SMTP_HOST/SMTP_PASS empty)
- Pipeline: verified exits 0 locally; mock search empty locally (expected)
- Remote server: unreachable (curl 000 all ports, rsync 124, no SSH banner)
- Pushes: kolake-e1c875d-backup (exit 0), smm-pipeline-backup (exit 0); main protected (GH006)
- Digest: BLOCKED on SMTP (needs Gmail app password, 2FA on)

## To make the bridge actually serve (WinsTin — your call)
Option A (provider firewall): open 8080/5678/22 at provider security group.
Option B (Mac tunnel — one command after install):
  # Install: brew install cloudflared  OR  apt install ngrok / download ngrok
  # Run (gives public URL + TLS):
  cloudflared tunnel --url localhost:3000   # or ngrok http 3000
  # Then point BUZZ_RELAY_URL and external access to the tunnel URL.

## Secret rotation list (pending — do not fabricate)
1. TWILIO_AUTH_TOKEN (.env line 69)
2. TWILIO_API_KEY_SECRET (.env line 72)
3. SMM_FOUR_EYES_SECRET (.env line 77, key=smm_vault_prod_secure_four_eyes_key_2026)
4. LeadSynch .git/config embedded GitHub tokens (from Drive audit)

## Next after merge/deploy
- WinsTin confirms live schema (user's step 5, reserved)
- Set real .env SMTP (.env.template is placeholder; use Gmail app password, not main password)
- Fire first digest to mrg5ah@mail.instinct.com
- Rotation of the 4 secrets above
- Naming: WinsTin (capital T after lowercase s — brand compliance, user's directive 23:18)
