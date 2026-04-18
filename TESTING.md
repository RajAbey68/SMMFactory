# TESTING.md — SMMFactory Test Strategy

**Last Updated:** April 2026
**Owner:** Antigravity Studio

---

## Philosophy

Every feature is validated through **truth tests** before it is considered complete.
Tests are the single source of authority on whether the system works.
"It looks right" is never sufficient — tests must pass.

---

## Test Tiers

### Tier 1: Structural Tests (Config & Integrity)
Run on every commit via pre-commit hook.
Validates that the file structure, JSON configs, and campaign registry are correct.

**Command:** `npm test`
**Target:** 30/30 passing (100%)
**Runtime:** < 5 seconds

| Test | What it validates |
|------|-------------------|
| `package.json` valid JSON | Project config is not corrupt |
| `storage.config.json` cloud-hybrid | Storage strategy is declared |
| `mcp_config.json` servers declared | Agent orchestration can start |
| `marketing-studio.agy` blueprint | All 3 BMAD steps + Four-Eyes present |
| Required directories exist | research/, creative/, landing-page/, campaigns/, dashboard/ |
| Campaign registry valid | JSON schema + all campaigns have required fields |
| No duplicate refs/slugs | Dashboard can render without ID collisions |
| 8-phase lifecycle | All campaign phases defined |
| Agent workflows exist | All 5 workflows (.agent/workflows/) present |
| AI Analyst script present | Script exists with AI provider + proof-based enforcement |
| Rate limiter exists | `scripts/rate-limiter.mjs` present |
| Spyder recovery exists | `scripts/spyder-recovery.mjs` present |
| Dashboard files exist | index.html + dashboard.css + dashboard.js |
| Review Engine exists | `review-engine/server.mjs` present |
| Landing page valid | index.html with booking + features + UTM tracking |
| Landing page CSS brand colors | #1B5E20 + #FFD600 present |

---

### Tier 2: Functional Tests (Business Logic)
Validates the logic of key modules in isolation.

**Command:** `npm run test:functional` *(to be wired in Phase 3 W2)*
**Target:** All passing

| Test | Module | What it validates |
|------|--------|-------------------|
| Rate limiter enforces limits | `rate-limiter.mjs` | 10 calls succeed, 11th waits |
| Rate limiter window resets | `rate-limiter.mjs` | After window expires, new calls succeed |
| Spyder recovery: cache fallback | `spyder-recovery.mjs` | Uses cache when crawl fails |
| Spyder recovery: checklist gen | `spyder-recovery.mjs` | Creates markdown checklist when no cache |
| Proof-based ad copy validation | `ai-intelligence-analyst.mjs` | 2+ proof points, 0 superlatives |
| Budget allocation math | TBD | 40% Meta + 40% Google + 20% OpenAI |
| Review request scheduling | `review-engine/server.mjs` | Day +1/+3/+7 slots created on checkout |
| Response draft generation | `review-engine/server.mjs` | Low rating gets apology template |

---

### Tier 3: Integration Tests (End-to-End Pipeline)
Validates the full BMAD pipeline from input to output.

**Command:** `npm run test:e2e` *(Phase 3 W2)*
**Target:** All passing

| Test | What it validates |
|------|-------------------|
| Full BUILD phase | Spyder → Pomelli → Stitch produces all outputs |
| Error recovery path | Spyder failure → cache → checklist fallback |
| Multi-provider AI failover | OpenAI → Anthropic → Gemini cascade |
| Campaign optimization loop | Day 2 data triggers budget reallocation |
| Four-Eyes gate enforcement | No deploy without explicit approval |

---

## Running Tests

```bash
# Tier 1: Structural truth tests (run before every commit)
npm test

# Tier 2: Functional tests (run when modifying business logic)
npm run test:functional

# Tier 3: End-to-end integration (run before releases)
npm run test:e2e

# Full quality gate (lint + type check + all tests)
npm run quality
```

---

## Adding a New Test

1. Open `tests/truth-tests.mjs`
2. Add a new `await test(...)` block at the appropriate section
3. Use the existing `assert()` helper — it throws on failure
4. Run `npm test` — new test must appear and pass
5. If the test reveals a real bug, **fix the bug first**, then commit both

### Test naming convention
```
"[Module] — [what it validates]"

✅ Good: "Rate limiter — enforces call limit within window"
❌ Bad:  "test rate limit"
```

---

## CI/CD

GitHub Actions runs `npm test` on every push to `main` and every PR.
See `.github/workflows/truth-tests.yml`

**A PR cannot be merged if any truth test fails.**

---

## Known Gaps (Phase 3 Backlog)

| Gap | Priority | ETA |
|-----|----------|-----|
| Functional test runner not wired | High | W2 Apr 25 |
| E2E test runner not wired | Medium | W2 Apr 25 |
| No browser/Playwright tests | Low | Phase 4 |
| No load tests for concurrent campaigns | Low | Phase 5 |
