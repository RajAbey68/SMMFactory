---
name: ad-router-TDD
entity_type: Workflows
version: 1.0.0
status: RED list — write these failing first (P4)
date: 2026-06-20
links: [[ad-router-rules]] · [[ad-router-SPEC]]
runner: vitest / tsx (repo convention — see tests/truth-tests.mjs)
---

# Ad-Router — TDD Test List (write RED first)

> ⚠️ **RE-SCOPED 2026-06-21 (RULES §10):** these tests do NOT belong in SMMFactory. The guard half
> that survives (F2 live-reread, F4 spend circuit-breaker, F5 PII live-write audit, R7 rate-limit)
> moves to the shared **`@asimov/smm`** approve→execute stage, multi-tenant (`organizationId`) with
> money as **bigint minor**. F1/F3/capability-map are already decided/built at the port — don't re-test here.

> No implementation until each test below exists and **fails**. Then GREEN, then refactor.
> Coverage target ≥ 80% (lib code), 100% on every guard. AAA structure.

## F1 — Paused-by-Default (the critical guard)
- [ ] `create campaign without status → payload is rewritten to status:PAUSED`
- [ ] `create adset with status:ACTIVE and no approvalToken → REJECTED`
- [ ] `budget-mutate with no approvalToken → applied but entity stays PAUSED`
- [ ] `promote with valid approvalToken → ACTIVE allowed`
- [ ] `promote with missing/invalid approvalToken → REJECTED`

## F2 — Live-reread-before-write
- [ ] `budget-mutate triggers a fresh live read before mutating (cache bypassed)`
- [ ] `a cached ad-state value is never the basis for a write decision`
- [ ] `read(ad-state) within TTL returns cache; outside TTL re-fetches`

## F3 — Idempotency
- [ ] `same idempotencyKey twice → second call is a no-op returning the first result`
- [ ] `write without idempotencyKey → REJECTED`
- [ ] `distinct keys → two distinct writes`

## F4 — Spend circuit-breaker
- [ ] `dailyBudget > max_daily_budget → BLOCKED`
- [ ] `budget delta > max_budget_delta → BLOCKED`
- [ ] `kill-switch engaged → all writes BLOCKED`
- [ ] `within all caps → allowed`

## F5 — Audit / lineage
- [ ] `every successful write appends one audit record (agent, payload, before→after, token, ts)`
- [ ] `a REJECTED write is also recorded with the rejection reason`
- [ ] `audit log is append-only (no in-place edit/delete)`

## R3 / §5 — Capability map routing
- [ ] `write(linkedin) → resolves to native provider, NOT pipeboard`
- [ ] `write(meta) → resolves to pipeboard`
- [ ] `R2 routes a B2B campaign to LinkedIn → write still resolves native via map (R2↔R3 reconciled)`
- [ ] `platform not confirmed Pipeboard-writable → defaults to native`

## Read/provider
- [ ] `read(revenue) while insightfulpipe deferred → error, NO fallback to ad-state`
- [ ] `read(ad-state, meta) → pipeboard provider`

## Router boundary
- [ ] `there is no public export that reaches a platform MCP/API except via router.read/write`
- [ ] `quota_weekly and cache_ttl come from config, not literals`

## R7 — Rate limiting (added v1.1, both reviewers)
- [ ] `agent exceeding inbound per-agent window → 429, write not attempted`
- [ ] `outbound calls to a platform stay within its configured rpm ceiling`
- [ ] `3 consecutive 429/5xx from a provider → exponential backoff before retry`
- [ ] `rate limiter reuses scripts/rate-limiter.mjs (no re-implementation)`

## F3 refinement — idempotency key namespacing (added v1.1)
- [ ] `key not matching {agent_id}:{uuid}:{ts} format → REJECTED`
- [ ] `same key + DIFFERENT payload → REJECTED + alert (replay/bug)`
- [ ] `stored idempotency key expires after 24h TTL`

## F5 refinement — PII redaction (added v1.1)
- [ ] `audit record redacts targeting PII fields from the stored payload`
- [ ] `raw payload retention ≤ 7 days; redacted summary retained 90 days`

## §5 — capability-map CI validation (added v1.1)
- [ ] `map referencing a provider failing health-check → CI test FAILS`
- [ ] `map referencing an unconfirmed Pipeboard write platform → CI test FAILS`

## §8 — availability / degradation (added v1.1, DeepSeek)
- [ ] `write path unhealthy → reads still serve from cache (degraded mode)`
- [ ] `write path unhealthy → write returns write-path-unavailable, never a silent drop`
- [ ] `/health reports read-path and write-path health separately`
- [ ] `time_since_last_successful_write > 5m on a platform → auto-route to native`
