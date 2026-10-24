# GATES — VilaForager v1 (DONE) + KLV+ Extension

Solo ledger. One observable outcome per gate. Runnable gates have CHECK + EXPECT.
BMAD: Analyst->Architect->Developer->QA->RedTeam->Release. TDD: RED first.
Review gate for every code task: `node scripts/jcode-reviewer.mjs` clean on touched files.
G1–G5 MET (v1 GREEN, 5/5 vilaforager tests, truth 105/106 with 1 pre-existing fail).

## G1 RED — Watcher scores + routes KLV signal
Watcher `tools/vilaforager-watcher.mjs` exports `scoreSignal(signal, config)`.
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager tests passed`

## G2 RED — Drafter is grounded, HITL-only
Drafter `tools/vilaforager-drafter.mjs` exports `draftReply(lead, config)`.
Draft must contain: `7 AC en-suite`, `From $250`, `www.kolakevilla.com`, canonical closing,
`wa.me/94711730345`, zero `estate|resort|hotel`, `mode: DRAFT_NEEDS_APPROVAL` (never auto-post).
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager tests passed`

## G3 — Dedup, no double-append
Same source_url+text twice -> second call returns `duplicate: true`, store length unchanged.
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager tests passed`

## G4 — Secrets scrub + tokenless
Draft path scrubs `sk-` / `EAA` to `[REDACTED_SECRET]`. No tokens in repo.
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager tests passed`

## G5 — No regressions
- CHECK: `npm run test:core`
- EXPECT: `passing|passed` with zero NEW failures vs v1 baseline (105/106 + pre-existing)

## G6 — Impact Score + dual angles (KLV+)
Watcher emits 1–10 `impact_score` (≥7 high); drafter returns 2 grounded angles,
both scrubbed, both `DRAFT_NEEDS_APPROVAL`. V1 G1 tests unchanged.
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager tests passed`

## G7 — Sensors + Twilio loop stub (KLV+, HITL only)
Reddit new.json + RSS normalize to scoreSignal shape (malformed → safe skip);
Twilio alert = score + angles + URL + lead_id; no auto-post path; vault-only creds.
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager tests passed`

## G8 — Adversarial FIX (GLM-5.3 + Jev 2026-09-30) — MET
RED exploit tests failed honestly (missing `releaseDraft` export), then GREEN 14/14.
- F1 snippet sanitize + output gate (`sanitizeSnippet`, `assertGroundedOutput`)
- F2 structural HITL (`approved:false` + token-gated `releaseDraft`)
- F3 word-boundaried scoring + mandatory intent + large-group rule (FP/FN cases green)
- F4 config live (floors + negative_keywords merged, zero-out)
- F5 sha256 normalized dedup; F6 atomic store + corrupt backup/throw; F7 extended scrub
- Laya System-1 fields (`laya_choice`/`laya_score`, Must_Engage≥0.85 boost, Noise cap)
- Truth 105/106 (only pre-existing fail). jcode: intentional denylists/test fixtures
  flagged — accepted false positives, same class as pre-existing dashboard flags.
- CHECK: `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager FIX tests passed`

## G9 — Laya stub service + trust policy — MET
`tools/laya-stub/laya_service.py` live-verified: /health stub_ready/model_loaded:false;
KLV text -> Must_Engage capped 0.70 (never clears 0.85); pizza -> Noise.
Contract uses rubric labels/fields (laya_choice/laya_score), KLV-domain heuristics
(proposal's AI-topic patterns rejected), E2E node check proves stub+keywords compose.
Watcher: stub runtime advisory-only by default, `trust_stub:true` opt-in (RED proven).
- CHECK: service smoke via curl + `node tests/vilaforager.test.mjs`
- EXPECT: `All VilaForager FIX tests passed`

## G10 — Lifecycle + audit trail
State machine (new→reviewing→approved→replied→converted/skipped/rejected),
hash-chained JSONL audit, token stored as SHA-256 only, tamper breaks verifyChain.
- CHECK: `node tests/forager-ops.test.mjs`
- EXPECT: `All ForagerOps tests passed`

## G11 — Inbox UI + daily digest
Static `dashboard/forager-inbox.html` renders leads/states/audit from disk with
APPROVE-command panels (no auto-post path); `scripts/forager-digest.mjs` emits the
dated Markdown digest with exact counts.
- CHECK: `node tests/forager-ops.test.mjs`
- EXPECT: `All ForagerOps tests passed`

## R2 — Re-review (Qwen3.8-max-prime + Gemini-3.8-flash + live Laya probe, 2026-09-30)
Cost $0.16 ($0.12 Qwen + $0.04 Gemini). Both models burned budgets on reasoning —
no finished verdicts; candidate bypasses verified live against code by operator:
- CONFIRMED HIGH: `$ 10` (spaced dollar) bypasses sanitize + gate, lands in draft.
- CONFIRMED HIGH: bare domains (`evil.com/pay`, `t.me/scam`) bypass URL strip, land in draft.
- CONFIRMED MEDIUM: alt price formats (`20 dollars`) bypass $ gate (same class).
- Qwen direction (unfinished): Unicode/homoglyph banned-word evasion — plausible, unverified.
- Laya probe: cap HOLDS at 0.70 under max stacking; hostile text → Noise; empty → Noise.
- R1 per-finding HOLDS/BYPASSED verdicts NOT delivered (truncated) — not claimed.
Status: R2-FINDINGS OPEN, fix pending.

## R2-FIX — closed TDD 2026-09-30 — MET
Merged remediation (adapted, not verbatim): kept sanitize-then-gate architecture —
draftReply does NOT throw on priced OP text (own-budget leads are legit); the OUTPUT
gate is the enforcement point. Divergences from proposal recorded: floors/close/mode
fields preserved (no G2 regression); 80-char cap kept; visible `[link removed]` /
`[price omitted]` placeholders for approver transparency.
- Spaced/word/foreign prices: strip patterns + gate rules (`$`-spaced sub-floor,
  foreign-currency ban, word-price ban) — 5/5 cases green.
- Bare domains: schemed + multi-label bare-domain regex (common TLDs + lk/lka).
- Homoglyphs: NFKC + documented Cyrillic confusable subset applied before ALL
  matching (sanitize AND gate); test builds U+043E from code point so the source
  can never be silently normalized in transit.
- Suites: vilaforager 17/17 (14 + 3 R2), ops 5/5, truth 105/106 (pre-existing only).
  jcode: BANNED denylist line flagged — accepted false positive (intentional list).

## R3 — Advisory review (Gemini-3.8-flash delivered; Qwen truncated) 2026-09-30 — OPEN
$0.02 Gemini + $0.14 Qwen. Verdict: **NOT production-ready** — tested library, not a
running system. Gemini's one line: *"the pipeline is deadlocked on an unprovisioned
model threshold and the safety code is disconnected from the actual messaging path."*

**Confirmed architectural sin (accepted):** `assertGroundedOutput` lives in Node but the
n8n workflow's draft path hooks an off-the-shelf OpenAI node straight into Twilio —
grounding checks are out-of-band for the runtime execution path. Paper + repo tests only.
**Fix shape (agreed):** route generation through Node (`POST /generate-and-verify`) so the
gate runs *in* the execution path before any message queues.

**Confirmed deadlock:** n8n requires `laya_score >= 0.85`, stub caps at 0.70 → mathematically
zero leads pass. Short-term: lower to 0.65 or `TRUST_STUB=true`. Production: real engine.

**Other confirmed findings:** no inbound Twilio webhook (APPROVE:<id> goes nowhere),
unauthenticated Reddit JSON → 429/IP-block within hours, repetitive canonical close →
anti-spam, no orchestrator script, static inbox can't mutate disk state.

**Priority list (agreed, 1-5):** 1) single Node orchestrator in the execution path,
2) reconcile gate threshold, 3) PRAW/OAuth2 authenticated ingestion,
4) inbound Twilio webhook closing the HITL loop, 5) parameterized angles.

**Operating model (agreed):** 2 roles — Operator (approves + posts) and Custodian
(ingestion tokens + health + audit reconciliation). SOP: ingest 08:30/16:00, review
09:00/16:30, approve, post manually, reconcile 18:00 with `verifyChain()`.

**Honest gap I'd add:** angle variety (priority 5) raises ungrounded-copy risk — the gate
must run on every variant, not the canonical one. Not yet addressed.

## R3-FIX — addressed TDD 2026-09-30 — MET
- **#1 grounding in-path:** `scripts/forager-runner.mjs` — ingest → triage → `draftReply`
  → `assertGroundedOutput` IN the execution path. Ungrounded → `gate: FAILED`, never
  queued, never dispatched. E2E verified: mixed batch → 1 PASSED / 1 DROPPED.
- **#4 inbound webhook:** `tools/inbound-webhook.mjs` (port 8090) — Twilio inbound →
  `parseInboundApproval` → `releaseDraft` token contract → `applyTransition(→approved)`
  → hash-chained `logRelease`. Refuses if `verifyChain()` fails. Spec:
  `skills/vilaforager/references/n8n-inbound-approval.workflow.json`.
- **#2 deadlock:** short-term = `TRUST_STUB=true` flag + lower n8n filter to 0.65 (stub
  mathematically cannot clear 0.85); production = real SetFit engine. Flag exists in
  `forager.config.json` (not yet wired to n8n).
- **#3 PRAW/OAuth2:** `tools/reddit-ingest.py` — OAuth2 client-credentials + token
  cache (no PRAW dependency), Bearer auth, normalizes to scoreSignal shape
  (`{id, source, author, title, content, metrics, source_url}`). Verified: unauth
  returns HTTP 403, adapter exits 2 on missing creds. Tests 3/3. Vault-only env.
  **#5 angle parameterization:** deferred — gate must run on every variant, not just
  the canonical one.
- Suites: runner 6/6, vilaforager 17/17, ops 5/5, truth 105/106 (pre-existing only).
