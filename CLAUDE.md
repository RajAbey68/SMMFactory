# CLAUDE.md — SMMFactory

> Project-level rules. Additive to global `~/.claude/CLAUDE.md`. On conflict, this file wins.

## Project identity

- **Product**: SMMFactory — Cloud-Hybrid Marketing Studio
- **Purpose**: Orchestrates Spyder, Pomelli, and OpenClaw for self-optimising ad campaigns
- **Method**: BMAD (Build → Measure → Analyze → Deploy)

## Key directories

| Path | Purpose |
|------|---------|
| `campaigns/` | Per-campaign directories with DNA profiles, ad configs, tracking pixels |
| `campaigns/registry.json` | Master campaign index — single source of truth |
| `creative/hook-studio/` | Ad hook generation and testing pipeline |
| `dashboard/` | Campaign monitoring UI |
| `landing-page/` | Landing page templates and deployments |
| `research/competitor_intel/` | Competitor analysis data |
| `review-engine/` | Four-eyes automated review gate |
| `scripts/` | Quality gate, Semrush scan, SEO scan |
| `tests/` | Truth tests, structural tests, quality gate tests |
| `tools/ad-router/` | Ad routing logic |
| `tools/asimov-ai/` | ASIMOV-AI governance integration |

## Tech stack

- **Runtime**: Node.js + TypeScript (strict)
- **Linting**: ESLint + Prettier
- **Testing**: Vitest + custom truth-test framework
- **Automation**: Custom scripts (`quality-gate.sh`, `semrush-scan.mjs`, `seo-scan.mjs`)
- **Config**: `ag.config.json` (Antigravity Studio config)

## Development methodology

1. **BMAD Pipeline** — Build → Measure → Analyze → Deploy. Every campaign follows the 8-phase lifecycle.
2. **Four-eyes** — No campaign goes live without automated + human verification.
3. **Truth tests** — Every feature validated through truth tests before completion. "It looks right" is never sufficient.
4. **Campaign registry** — All campaigns registered in `campaigns/registry.json` before any deployment.

## Test tiers

| Tier | Name | Trigger |
|------|------|---------|
| 1 | Structural (config & integrity) | Every commit via pre-commit hook |
| 2 | Truth tests | Feature completion |
| 3 | Quality gate | Pre-deploy via `npm run quality` |

## Commands

```bash
npm test              # Vitest unit tests
npm run test:truth    # Truth-test framework
npm run quality       # Full quality gate
npm run semrush       # Semrush competitive scan
npm run seo           # SEO scan
npm run reviews       # Start review engine
npm run hooks         # Start hook studio
```

## Brand constraints

- Campaign materials must pass the review-engine gate before deployment
- All ad creatives tracked in `creative/` with attribution metadata
- Competitor research stored in `research/competitor_intel/` — update before new campaigns
