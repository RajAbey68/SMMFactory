# NexCamp — Community Posting Capability Loop Runbook

**Pattern:** sequential · **Mode:** safe · **Branch:** feat/community-posting-v2

## Outcome

A complete community posting capability front end that shows:
- Campaign **theme** (colour, name, description)
- **Community** context (platform type, URL, posting rules)
- **Topic/Thread** context (the thread being replied to: title, source excerpt)
- **Composer** with platform-aware fields (title only for Reddit)
- **Approval queue** for AI-drafted replies (in-app, not Discord)
- **Post status** (pending / posted / failed) with audit trail

## P0 Architecture Fixes (from adversarial review 2026-06-24)

- [ ] Replace `campaign_tag` string key with `campaign_id UUID FK` on all tables (migration 0003)
- [ ] Switch Reddit posting from password-grant to authorization-code OAuth2 + refresh token in DB
- [ ] Move approval gate from Discord to in-app `drafts` table + approval UI

## Loop Iterations

### Iteration 1 — Enhanced PostingPane UI ✅ DONE (2026-06-24)
- [x] Get Gemini design input for the posting panel
- [x] Build `PostingPane.tsx` — full-width panel replacing the narrow composer aside:
  - Campaign theme strip (colour bar + name)
  - Thread context card (title + excerpt from selected thread)
  - Community badge (platform type + URL)
  - Platform-aware composer (title field for Reddit only)
  - Char count + platform limits
  - Action bar: Post / Save Draft / Discard
- [x] Update `App.tsx` to track `selectedReply` and pass to PostingPane
- [x] `ReplyCard.tsx` — clickable with `isSelected` highlight + community-coloured left border
- [x] `ThreadFeed.tsx` — wires `onSelectReply` + `selectedReplyId` to feed cards
- [x] TypeScript: 0 errors · Build: ✓ 333 modules · No console errors

### Iteration 2 — In-App Approval Queue ✅ DONE (2026-06-24)
- [x] Migration 0004: `anon_delete_posts` RLS policy (soft-delete without needing a status workaround)
- [x] `useDraftPosts.ts` hook — fetches posts where status=draft, Realtime subscription
- [x] `ApprovalQueue.tsx` — per-draft cards: community badge, content preview, Approve (copy+open) / Delete
- [x] `PostingPane.tsx` — COMPOSE / DRAFTS tab switcher; auto-switch to Compose on reply select
- [x] Build: ✓ 335 modules · 0 tsc errors · 0 runtime errors

### Iteration 3 — Reddit OAuth2 Authorization Code Flow
- [ ] Build Reddit OAuth callback Edge Function
- [ ] Store refresh tokens in `user_reddit_tokens` table
- [ ] Update `reddit.ts` to use refresh token flow

### Iteration 4 — Integration + Quality Gate ✅ DONE (2026-06-24)
- [x] adversarial-review on all changed files (DeepSeek + Z.AI — 2 of 4 reviewers responded; Gemini 503)
- [x] P0 fix: removed hardcoded 'LegalAdviceUK' fallback — throws if URL unparseable
- [x] P0 fix: ApprovalQueue clipboard-before-DB; surface clipboard errors to user
- [x] FALSE POSITIVE verified: both DraftCard buttons already guarded by `state !== 'idle'`
- [x] Build: ✓ 335 modules · 0 tsc errors post-fixes
- [x] All code changes committed to feat/community-posting-v2
- [x] PR opened: https://github.com/RajAbey68/SMMFactory/pull/1 (base: nexcamp-main in SMMFactory repo)

## Stop Conditions
- All iteration checkboxes green
- adversarial-review verdict: no P0/P1 issues unresolved
- Build passes: `pnpm build`

## Quality Gate (per iteration)
- TypeScript: `pnpm tsc --noEmit`
- Lint: `pnpm biome lint`
- Build: `pnpm build`
- adversarial-review on diff
