---
name: ad-router
entity_type: Projects
version: 1.2.0
status: RE-SCOPED — do not build standalone; fold guards into the shared @asimov/smm port
date: 2026-06-21
links: [[ad-router-rules]] · [[ad-router-SPEC]] · [[ad-router-TDD]] · [[SMMFactory]]
---

# Ad-Router — guard-requirements source (RE-SCOPED 2026-06-21)

> ⚠️ **Do NOT build this as a standalone SMMFactory module.** Reviewed against the decided,
> partly-built portfolio marketing layer (NexStayOff build-plan §9 `MarketingEngine` port; Nexus
> `loop/backend-mvp` `spike/src/modules/smm/`, 533 tests green): **SMMFactory is a backend adapter,
> not the router.** Marketing governance lives in the shared **`@asimov/smm`** port. Paused-by-default
> is already a port type (`proposePaid → PaidDraft`). Building it here would recreate decided/already-built
> work. See **RULES.v1.md §10**. This folder is retained only as the **guard-requirements source** for the
> Phase-8 `@asimov/smm` fold (the genuinely-additive guards: F2 live-reread, F4 spend circuit-breaker,
> F5 PII live-write audit, R7 rate-limit — the post-approval execution path the decided design hasn't specced).

The single governed path between any agent and a live ad platform. Separates analytical
**reads** from money-spending **writes**, enforces **paused-by-default**, and prevents an
autonomous loop from causing live-spend incidents.

| File | Entity | Purpose |
|------|--------|---------|
| [RULES.v1.md](RULES.v1.md) | Rules | The corrected, versioned architecture (supersedes the pasted draft) |
| [SPEC.md](SPEC.md) | Workflows | Module layout, interfaces, guard chain, capability-map schema |
| [TDD.md](TDD.md) | Workflows | RED test list — write these failing first (P4) |

## Headline corrections vs the original draft
1. **One vendor on the write path** (Pipeboard read+write, one ID-space) — not reads-from-InsightfulPipe / writes-to-Pipeboard. InsightfulPipe is scoped to the **revenue join only**, and deferred.
2. **R2 ↔ R3 reconciled** by a capability map: route by *writable channel*, not just intent — so a B2B→LinkedIn route can't land on a platform the write layer can't execute.
3. **Three guards the draft omitted**: idempotency (F3), spend circuit-breaker (F4), audit/lineage (F5).
4. **Paused-by-Default (F1) is enforced in code**, not a calendar checklist.

## Independent review status (2026-06-20)
Ruleset taken through independent adversarial review (DeepSeek + Gemini; Claude family barred;
GLM unavailable — credit cap, so **2-reviewer** pass). Accepted findings folded into **RULES v1.1**:
rate limiting (R7), availability/degradation (§8), idempotency-key namespacing (F3), PII-redacted
audit log (F5), capability-map CI validation (§5), secret-manager/rotation (§6). Over-scoped
compliance items deferred with a paper trail (§9).

## Build gate (RE-SCOPED — see RULES §10)
- [x] ~~InsightfulPipe defer vs elevate~~ → **RESOLVED: DEFER** — ROAS join comes from the in-house event mesh, not a paid 3rd party (data-segregation)
- [x] Independent review of the ruleset (P3 four-eyes) — done v1.1 (2 of 3 reviewers; GLM credit-capped)
- [ ] **NEW:** converge NexStayOff `MarketingEngine` + Nexus `MarketingGateway` into one `@asimov/smm` port
- [ ] **NEW:** fold F2/F4/F5/R7 into the `@asimov/smm` approve→execute stage (multi-tenant `organizationId`; money = bigint minor)
- [ ] Pipeboard-writable platform set re-verified — only if/when the `DirectAdsAdapter` is wired
