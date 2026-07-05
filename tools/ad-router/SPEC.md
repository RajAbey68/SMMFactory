---
name: ad-router-SPEC
entity_type: Workflows
version: 1.0.0
status: SPEC — no implementation yet
date: 2026-06-20
links: [[ad-router-rules]] · [[ad-router-TDD]] · [[SMMFactory]]
---

# Ad-Router — Implementation Spec (v1.0.0)

> Plan only. No code until [[ad-router-rules]] is signed off (P3 four-eyes) and the
> RED test list in [[ad-router-TDD]] is written and failing (P4 TDD).

## 1. Module layout (many small files; ≤400 lines each)

```
tools/ad-router/
  router.ts            # ONLY public surface: read(intent) | write(action)
  capability-map.json  # platform → { adStateRead, revenueRead, write } provider bindings (§4)
  config.ts            # quota, ttl, budget caps, provider bindings — all from env/JSON
  guards/
    paused-by-default.ts   # F1
    live-reread.ts         # F2
    idempotency.ts         # F3
    spend-ceiling.ts       # F4
  providers/
    provider.ts            # ReadProvider / WriteProvider interfaces (repository pattern)
    pipeboard.ts           # ad-state read + write (D1)
    insightfulpipe.ts      # revenue read only — DEFERRED stub (D2)
    native-linkedin.ts     # write via native API (D3)
  audit-log.ts         # F5 append-only lineage
  cache.ts             # read cache, TTL from config; bypassed by write()
```

## 2. Public contract (interfaces — documentation, not implementation)

```ts
type ReadIntent =
  | { kind: 'ad-state'; platform: Platform; scope: 'campaign'|'adset'|'ad'; id?: string }
  | { kind: 'revenue';  platform: Platform; window: DateRange }   // DEFERRED provider

type WriteAction =
  | { op: 'create';        platform: Platform; entity: 'campaign'|'adset'|'ad'; payload: object;
      idempotencyKey: string }
  | { op: 'budget-mutate'; platform: Platform; id: string; dailyBudget: number;
      idempotencyKey: string }
  | { op: 'promote';       platform: Platform; id: string; approvalToken: string;  // ACTIVE
      idempotencyKey: string }

interface Router {
  read(intent: ReadIntent): Promise<ApiEnvelope<ReadResult>>   // cache-eligible
  write(action: WriteAction): Promise<ApiEnvelope<WriteResult>> // never cached; full guard chain
}
```

`ApiEnvelope<T>` = `{ success, data: T|null, error: string|null, meta }` (repo API convention).

## 3. Write path — guard chain (order is load-bearing)

```
write(action)
  └─ 1. idempotency.check(key) ........ seen? → return prior result (F3)
     2. capability.resolve(platform,op)  pick provider via map (§4, R2/R3 reconciled)
     3. paused-by-default.enforce() .... non-promote create/mutate → force status:PAUSED (F1)
     4. live-reread.fetch(id) .......... fresh live state, cache bypassed (F2)
     5. spend-ceiling.check() ......... dailyBudget ≤ cap AND Δ ≤ maxDelta AND !killSwitch (F4)
     6. provider.write(action) ........ Pipeboard | native
     7. audit-log.append() ............ agent, payload, before→after, token, ts (F5)
     8. idempotency.record(key, result)
```
`promote` is the only op that may set `ACTIVE`, and only with a valid `approvalToken` (F1 gate).

## 4. capability-map.json schema

```json
{
  "$schema": "https://smmfactory.dev/schemas/ad-router-capability.json",
  "version": "1.0.0",
  "platforms": {
    "meta":     { "adStateRead": "pipeboard", "revenueRead": "insightfulpipe", "write": "pipeboard" },
    "google":   { "adStateRead": "pipeboard", "revenueRead": "insightfulpipe", "write": "pipeboard" },
    "tiktok":   { "adStateRead": "pipeboard", "revenueRead": "insightfulpipe", "write": "pipeboard" },
    "linkedin": { "adStateRead": "native",    "revenueRead": "insightfulpipe", "write": "native"    },
    "x":        { "adStateRead": "native",    "revenueRead": null,             "write": "native"    },
    "quora":    { "adStateRead": "native",    "revenueRead": null,             "write": "native"    }
  },
  "deferred": ["insightfulpipe"]
}
```
Unverified-writable platforms default to `"native"` until confirmed against pipeboard.co (P1).

## 5. Read path

`read(intent)` → if `revenue` and provider deferred → `error: 'revenue-join not enabled'`
(no silent fallback to ad-state). If `ad-state` → cache hit within TTL returns cached;
miss → provider read → cache → return. **`write()` never touches this path.**

## 6. Integration point

The router is invoked **only** from the BMAD **Deploy** phase (README: "OpenClaw → Meta/Google").
The `review` gate must pass before any `promote`. First wiring target: the live **Ko Lake** campaign
that today relies on a manual "keep paused" calendar checklist.

## 7. Out of scope for v1

Auto-learning channel selection (R2 stays a static, overridable prior); multi-account
parallelism; the InsightfulPipe revenue provider (stub only).
