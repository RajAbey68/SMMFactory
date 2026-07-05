---
name: ad-router-rules
entity_type: Rules
version: 1.2.0
status: RE-SCOPED — governance belongs in the shared @asimov/smm MarketingEngine port; SMMFactory is a backend adapter. DO NOT build this as a standalone module. See §10.
owner: Rajiv Abeysinghe
date: 2026-06-21
reviewed_by: DeepSeek (deepseek-v4-flash) + Gemini 2.5 Flash — independent, author family barred (2026-06-20)
supersedes: "Marketing Factory Architectural Rules (pasted draft, 2026-06-20)"
re_scoped_against: NexStayOff build-plan §9 (MarketingEngine port) + Nexus loop/backend-mvp spike/src/modules/smm/ (already built, 533 tests green)
links: [[SMMFactory]] · [[ad-router-SPEC]] · [[ad-router-TDD]] · [[campaign-registry]]
---

# Ad-Router — Architectural Rules (v1.0.0)

> The **Execution Guard**: the single, governed path between any agent and a live ad
> platform. Reads and writes are separated as a *code boundary*, not as two vendors.
> This document **supersedes** the pasted draft; deltas from the draft are flagged `Δ`.

## 0. Provenance & decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Pipeboard is the single provider for ad-state reads AND writes** (one ID-space). | Avoids the draft's two-vendor ID-mismatch on the write path. Pipeboard verified real: `pipeboard-co/meta-ads-mcp`, write-confirmation safety model, one OAuth/token across ~5 ad platforms. |
| D2 | **InsightfulPipe is a *revenue/attribution-only* read provider — DEFERRED.** Added only when Stripe/PMS/GA4-joined ROAS is needed. **Never** supplies ad-state to a write decision. | Its real value is the revenue join, not generic reads. Verified real: insightfulpipe.com, 35–45+ sources, read-only analytics. |
| D3 | **Native API connectors handle LinkedIn / X / Quora writes** (tokens already in `.env.example`). | Pipeboard does not write these. |
| D4 | Provider layer is abstracted (repository pattern) so D1↔D2↔D3 are swappable by config, not rewrite. | Keeps the cost decision reversible. |

> `Δ` The draft routed **all** reads through InsightfulPipe and **all** writes "exclusively"
> through Pipeboard. Both absolutes are wrong: see D1 (ad-state reads stay with the write
> vendor) and R3 (writes are not exclusively Pipeboard).

## 1. R1 — Separation of read vs write (the Execution Guard)

- The router exposes exactly two public operations: `read(intent)` and `write(action)`.
- **No agent may call an ad-platform MCP/API directly.** All traffic goes through the router.
- `read(intent)` is served from cache where safe (see F2); `write(action)` is never cached.
- Separation is a **boundary in one codebase over one ID-space**, not a split across vendors.

## 2. R2 — Budget-gated intent routing (overridable default, NOT a law)

Default channel prior, **overridable per campaign** and **subordinate to the capability map (§5)**:

```
IF Client_Type == "B2B SaaS" OR Customer_LTV > $5,000:
    Primary = LinkedIn (firmographic) ; Secondary = Google Search (high-intent)
ELSE IF Client_Type == "E-commerce/B2C" OR Creative_Heavy:
    Primary = Meta (demand-gen)       ; Secondary = Reddit (community)
ELSE  # hospitality / local-intent / personal-brand — the actual book of business
    Primary = Google Search + Meta    ; Secondary = per-campaign override
```

> `Δ` The draft's two-class taxonomy (B2B-SaaS vs B2C-ecomm) does not fit **Ko Lake Villa
> (hospitality/local-intent)** or the **AI-career personal brand**. A third default branch is
> added, and every route is overridable from the campaign record in [[campaign-registry]].

## 3. R3 — Native fallback for out-of-scope nodes

- Cross-channel *reasoning* may use any read provider; **publishing** to LinkedIn/X/Quora
  falls back to the factory's native connectors.
- A route from R2 to a channel Pipeboard cannot write **must** resolve through §5, not fail.

## 4. Fail-safes (all enforced in code, all TDD-covered)

| ID | Rule | Enforcement |
|----|------|-------------|
| **F1 Paused-by-Default** | Every `create` (campaign/adset/ad) and every budget mutate is forced to `status: PAUSED` unless the action carries a valid human approval token. | Hard guard; rejects or rewrites the payload. The promotion to `ACTIVE` is the *only* human-in-the-loop gate. |
| **F2 Live-reread-before-write** | Cache may serve reads for analytics/display only. Any mutation re-reads live state first (read-modify-write under a fresh read). | Cache is bypassed inside `write()`. |
| **F3 Idempotency** | Every write carries a **namespaced** key `{agent_id}:{uuid}:{ts_ms}`; a repeat key is a no-op. Keys stored with 24h TTL. Same key + different payload → reject + alert (replay/bug signal). | Prevents duplicate live spend from agent retries/loops **and** cross-agent key collision (review, DeepSeek). |
| **F4 Spend circuit-breaker** | Hard `max_daily_budget` per account + `max_budget_delta` per mutate + global kill-switch. Exceed → blocked, alert. | Protects the post-promotion ACTIVE window F1 does not cover. |
| **F5 Audit / lineage** | Every write **and every rejection** logs: agent id, action, **PII-redacted** payload, before→after, approval token, timestamp. Append-only. Raw payloads retained ≤ 7 days; redacted summaries 90 days. | P3 four-eyes; AKOS "Outputs/lineage". Redaction added so the audit trail isn't a PII/GDPR liability (review, both). |

## 5. Capability map (reconciles R2 ↔ R3)

Source of truth for *which provider executes which operation on which platform*. Versioned
JSON in repo (schema in [[ad-router-SPEC]]). Routing order: **capability map first, intent second.**

```
platform   | ad-state read | revenue read     | write
-----------+---------------+------------------+--------------------
meta       | pipeboard     | insightfulpipe*  | pipeboard
google     | pipeboard     | insightfulpipe*  | pipeboard
tiktok     | pipeboard     | insightfulpipe*  | pipeboard
linkedin   | native        | insightfulpipe*  | native
x / quora  | native        | (none)           | native
```
`*` = DEFERRED (D2) — wired only when revenue-join is switched on.

> ⚠️ **P1 currency caveat:** the exact set of Pipeboard-writable platforms (~5) must be
> re-verified against pipeboard.co before this map is trusted in production. Treat any
> platform not confirmed as `native` until verified.
>
> **CI gate (added v1.1):** a test must reject any map that references a provider not present
> in a live provider health-check, or a platform/operation Pipeboard hasn't confirmed. The map
> ships *validated*, not just *versioned*.

## 6. Config, not constants

`quota_weekly` (draft said 500), `cache_ttl_seconds` (draft said 1800), `max_daily_budget`,
`max_budget_delta`, the rate-limit ceilings (§7), the Pipeboard-writable platform set, and all
provider bindings live in config — never hardcoded.

**Secrets:** macOS **Keychain is the source of truth** (per portfolio rule); `.env.example` holds
**placeholders only** (never real tokens). Production injects secrets at deploy time from a secret
manager; rotation policy required for every ad-platform token. (Review raised file-based tokens as a
risk; clarified here — the repo already follows Keychain-as-SoT.)

## 7. R7 — Rate limiting (added v1.1 — both reviewers, highest-converged gap)

F3/F4 stop *duplicate* and *over-budget* writes but not *request volume*. A looping agent can hit a
platform's API rate limit in seconds and get the account throttled or banned.

- **Inbound:** per-`agent_id` sliding-window limit at the router; exceed → `429`. Defaults configurable per agent.
- **Outbound:** per-platform / per-token limiter inside the provider layer, sized to each platform's published quota (start conservative: Meta 100 rpm, LinkedIn 50, Google 150).
- **Backoff:** 3 consecutive `429/5xx` from a provider → exponential backoff (5s → 300s).
- **Reuse:** wire the existing [`scripts/rate-limiter.mjs`](../../scripts/rate-limiter.mjs) — do not re-implement (integrate-don't-recreate).

## 8. Availability & degradation (added v1.1 — DeepSeek)

The router is a single choke point; it must fail safe, not fail closed-to-everything.

- **Read-only degraded mode:** if the write path is unhealthy, reads continue serving from cache (TTL + grace). Writes return a clear `write-path-unavailable` error — never a silent drop.
- **Split health:** `/health` reports read-path and write-path health separately, so monitoring distinguishes "factory is read-only" from "factory is down."
- **Provider fallback:** `time_since_last_successful_write > 5m` on a Pipeboard platform → auto-route that platform to its native connector (proves D4's abstraction is real, not just declared).

## 9. Independent review response (v1.1)

Reviewed by **DeepSeek** + **Gemini 2.5 Flash** (independent; Claude family barred). Verbatim verdicts
held in session log. Z.AI/GLM unavailable (OpenRouter credit cap) — this was a **2-reviewer** pass.

**Folded in:** F3 key namespacing · F5 PII redaction + retention · §5 CI validation · §6 secret-manager/rotation · R7 rate limiting · §8 availability/degradation.

**Deferred — revisit at scale, NOT a v1 blocker** (Karpathy YAGNI; current book = Ko Lake villa + AI-career brand, not an agency): consent-management/CMP, data-residency mapping, WORM audit storage, automated ad-content moderation engine. Recorded so they are not silently dropped (P1).

**OPEN STRATEGIC DECISION (owner's call):** Gemini argues InsightfulPipe should be **elevated to P1**, not deferred (D2) — deferring it makes the router a *spend-management* tool, not a *profit/ROAS* tool. This matches Rajiv's earlier two-vendor lean. **Decision pending:** keep D2 deferred (ship ad-state-only v1) **or** elevate InsightfulPipe revenue-join to P1. Until resolved, D2 stands as written.

> **RESOLVED in v1.2 (§10):** DEFER. The ROAS revenue-join is satisfied by the in-house event mesh, not a third party.

## 10. Portfolio re-scope (v1.2 — reviewed against NexStayOff + Nexus PMS)

Re-reviewed against the DECIDED, partly-BUILT portfolio marketing layer
([NexStayOff build-plan §9](../../../NexStayOff/docs/ARCHITECTURE-AND-BUILD-PLAN.md);
[Nexus `loop/backend-mvp` spike/src/modules/smm/](../../../NexStay/spike/src/modules/smm/marketing-gateway.ts), 533 tests green):

- **SMMFactory is a backend adapter, not the router.** Apps depend on the shared `MarketingEngine`/`MarketingGateway` port (`@asimov/smm`); SMMFactory's contract is `registry.json` + `campaigns/<slug>/`, deployed via its own 8-phase BMAD + OpenClaw. **Platform-write governance must not live inside one backend** — a consumer routing paid via GravityClaw or the direct MCP would bypass it.
- **F1 paused-by-default is already decided at the port as a TYPE:** `proposePaid → PaidDraft` (P7). Redundant here for the draft stage.
- **RELOCATE the genuinely-additive guards to the `@asimov/smm` approve→execute stage** (the path AFTER a human approves a PaidDraft — not yet specced in the decided design): **F2 live-reread, F4 spend circuit-breaker, R7 rate-limit, F5 PII-redacted live-write audit.** This is the half worth keeping.
- **Capability map = the `MarketingRouter` config** (SmmFactory/GravityClaw/DirectAds adapters). Converge, don't duplicate.
- **Multi-tenant:** key every campaign/budget/audit by `organizationId` (was single-brand). **Money = bigint minor units** (bus convention), not `number` — correctness fix.
- **Idempotency already exists** in Nexus via deterministic `campaignSlug`; align, don't reinvent F3.
- **InsightfulPipe (D2/§9) → DEFER, decided.** ROAS join comes from the event mesh (`getPerformance` + booking/payment/`bid.placed` events from Nexus/NexStayOff/BookLets), per [[feedback_data_segregation]]. Supersedes the earlier "Gemini: elevate" — Gemini didn't know the in-house mesh exists. InsightfulPipe only earns its cost if SMMFactory is sold to EXTERNAL clients.
- **R2 B2B branch validated:** Nexus PMS is the B2B-SaaS customer (LTV ≫ $5k) → `B2B → LinkedIn + Google` is now a primary route.
- **Write path:** default = SMMFactory pipeline → OpenClaw → Meta/Google; `meta-ads`/`google-ads` (Pipeboard) MCP = optional `DirectAdsAdapter`. The earlier Pipeboard-vs-two-vendor deliberation is largely subsumed by the adapter model.

**ACTION:** do **not** build `tools/ad-router/` as a standalone module (would recreate decided/already-built work — [[feedback_integrate_dont_recreate]]). Fold F2/F4/F5/R7 into the Phase-8 `@asimov/smm` design and converge the two existing port shapes. This doc is retained as the **guard-requirements source** for that fold.
