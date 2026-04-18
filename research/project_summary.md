# SMMFactory — Project Summary for NotebookLM

## What Is SMMFactory?

SMMFactory is a **cloud-hybrid marketing studio** built inside the Antigravity IDE. It's an AI-orchestrated campaign management platform that uses multiple agents (Spyder, Pomelli, Stitch, OpenClaw) to automate the full marketing lifecycle — from market research to creative generation to ad deployment.

It follows the **BMAD methodology** (Build → Measure → Analyze → Deploy) with a **Four-Eyes Principle** where no campaign goes live without both automated and human verification.

---

## Architecture

### Cloud-Hybrid Strategy
- **Local / Git**: Code, configs, JSON metadata — version-controlled and lean
- **Google Cloud Storage (GCS)**: High-res images, videos, heavy media assets
- **Google Drive**: Agent conversation logs, synced via Antigravity Storage Manager

### Agent Pipeline (per the .agy Blueprint)
1. **Spyder** — Reconnaissance: Crawls properties, extracts brand DNA, analyses competitors via Meta Ad Library and Google Search
2. **Pomelli** — Creative Genesis: Generates ad sets (hero images, copy, CTAs) matched to brand DNA
3. **Stitch** — Landing Pages: Builds high-conversion landing pages matching brand colours exactly
4. **OpenClaw / GravityClaw** — Deployment: Pushes campaigns to Meta Advantage+ and Google Performance Max via browser automation

### CI/CD Pipeline (GitHub Actions)
- Config validation + truth tests on every push
- CodeQL security scanning
- Staging deploy (automatic)
- Production deploy (manual four-eyes approval gate)

---

## Multi-Campaign Management

SMMFactory manages multiple campaigns in parallel, each in a self-contained folder structure with a central registry.

### Campaign Registry (`campaigns/registry.json`)
- Master index of all campaigns
- Each campaign has a **5-character reference code** (e.g., `KLEst`, `AICar`) for quick identification
- Tracks current lifecycle phase and progress

### 8-Phase Campaign Lifecycle
Every campaign follows these phases in order:

1. **💡 Ideation** — Define brief, concept, audience, success criteria
2. **🔍 Research** — Market DNA, competitor analysis, audience insights
3. **📋 Planning** — Strategy document, budget, timeline, action calendar
4. **🎨 Creative** — Asset production: ad copy, visuals, landing pages, video
5. **✅ Review** — Four-eyes gate: human + automated verification
6. **🚀 Launch** — Activate channels, deploy ads, go live
7. **📈 Optimize** — Monitor, A/B test, reallocate budget
8. **🏁 Close** — Wind down, retrospective, extract learnings

### Campaign Dashboard
A web-based Campaign Command Center (`dashboard/index.html`) provides:
- Real-time phase timeline per campaign
- Summary strip (total campaigns, active, avg progress, nearest deadline)
- Metrics grid sourced from Meta Ads, Google Ads, LinkedIn, WhatsApp, AdSpyder
- Embedded AG Prompt for issuing campaign instructions with ref-code targeting
- Dynamic data loading from `registry.json`

---

## Strategy Foundations

All campaigns are built on two proven frameworks:

### Alex Hormozi (from $100M Offers and $100M Leads)

**Value Equation:**
- Value = (Dream Outcome × Perceived Likelihood) / (Time Delay × Effort & Sacrifice)
- Goal: Make people feel "stupid saying no"

**Grand Slam Offer — 5 elements:**
1. Unmatchable value (perceived value 10x the price)
2. Premium pricing (never compete on low price)
3. Risk reversal (guarantee that removes all buyer risk)
4. Transformation focus (sell outcomes, not features)
5. Category of one (incomparable to competitors)

**Core Four Lead Generation:**
1. Warm Outreach (one-to-one, people who know you) — always first
2. Content (one-to-many, people who know you) — organic social, email
3. Cold Outreach (one-to-one, people who don't know you) — personalised messages
4. Paid Ads (one-to-many, people who don't know you) — Meta, Google, YouTube

**Key rule:** Warm outreach always comes before paid ads. "More, Better, New" — do more of what works, make it better, then add new channels.

### Daniel Priestley (from Key Person of Influence and Oversubscribed)

**Key Person of Influence — 5 Ps:**
1. Pitch — Craft a compelling message
2. Publish — Share expertise through content
3. Product — Turn expertise into scalable offerings
4. Profile — Build visible authority
5. Partnership — Collaborate to expand reach

**Oversubscribed Method:**
- Define your official capacity (max clients you can serve well)
- Collect signals of interest (50:1 ratio — 50 signals per 1 available slot)
- Build anticipation and demand before opening sales
- Campaign types: Perfect Repeatable Week, Quarterly Spotlight, 7-11-4

**7-11-4 Rule (before someone buys):**
- 7 hours of content consumption
- 11 touchpoints with your brand
- 4 different platforms/locations

**Scorecard Strategy:**
- Use assessments/scorecards as lead magnets instead of generic PDFs
- Identifies customer tension, provides personalised insight, creates natural next steps
- Qualifies leads by revealing their pain points before the first conversation

---

## Active Campaigns

### KLEst — Ko Lake Villa Easter/Avurudu Push
- **Type:** Paid media campaign
- **Window:** March 24 – April 17, 2026 (25-day push)
- **Current Phase:** Creative (38% complete)
- **Property:** Ko Lake Villa — 7-room lakefront villa in Koggala/Ahangama, Sri Lanka
- **Product:** Private luxury villa for families/groups, up to 24 guests
- **Offer:** Free airport pickup for 3+ night direct bookings
- **Booking path:** WhatsApp + landing page form
- **Three sellable blocks:** Easter (Mar 30–Apr 6), Gap-Fill (Apr 7–12), Avurudu (Apr 13–17)
- **Channels:** Meta Ads (3 ad sets), Google Ads (search + Performance Max), WhatsApp broadcasts, organic social
- **Market DNA:** Brand colours (#1B5E20 green, #1565C0 blue, #FFD600 gold), luxury tone
- **Landing page:** Built (HTML/CSS/JS) with booking section, features grid, UTM tracking

### AICar — AI Adoption Advisor Career Push
- **Type:** Personal brand campaign
- **Window:** March 25 – April 7, 2026 (14-day push)
- **Current Phase:** Review (50% complete)
- **Positioning:** Enterprise AI Adoption Lead / Customer Success (Strategic / Enterprise)
- **Core message:** "I help organisations move from AI curiosity to safe, scalable adoption"
- **Edge:** 20+ years delivering complex systems in regulated environments
- **Target companies:** Tier 1 (OpenAI, Google Cloud, Anthropic, AWS, Microsoft), Tier 2 (Databricks, Snowflake, Hugging Face, Scale AI, Palantir, Accenture)
- **Channels:** LinkedIn (3 posts/week), Direct outreach (10 messages/week), Expert networks (GLG, AlphaSights, Guidepoint)
- **6 LinkedIn posts drafted**, profile copy ready, outreach templates prepared
- **No agents used** — this is a human-driven campaign where authenticity matters

---

## Quality & Testing Infrastructure

### Truth Tests (26 tests, 100% pass rate)
Validates:
- Environment integrity (package.json, storage config, MCP config, blueprint)
- Directory structure (research, creative, landing-page, campaigns, dashboard)
- Campaign registry (valid JSON, required fields, no duplicate refs/slugs, all 8 lifecycle phases)
- Agent workflows (truth-test, verify, quality, status)
- Storage tier consistency (GCS bucket names match across configs)
- Dashboard files and registry integration
- Landing page structure and brand colour compliance

### Slash Command Workflows
- `/truth-test` — Validate configs, structure, registry
- `/verify` — Full pre-deploy quality gate
- `/quality` — Quick quality check
- `/status` — Workspace health snapshot
- `/adspyder-scan` — Competitive intelligence scan

---

## Key Files

| File | Purpose |
|---|---|
| `marketing-studio.agy` | Blueprint — orchestrates Spyder → Pomelli → OpenClaw pipeline |
| `campaigns/registry.json` | Master campaign index with lifecycle tracking |
| `research/strategy_foundations.md` | Hormozi + Priestley strategy frameworks |
| `dashboard/index.html` | Campaign Command Center (web dashboard) |
| `storage.config.json` | Cloud-hybrid storage tier definitions |
| `mcp_config.json` | MCP server connections (GCS, Drive, Spyder) |
| `tests/truth-tests.mjs` | 26 automated truth tests |
| `scripts/quality-gate.sh` | Quality gate validation script |

---

## What's Not Yet Done (Backlog)

### Infrastructure
- GCS bucket not created yet
- Google Drive Sync not configured
- GitHub Secrets not set (GCP, Meta, Google Ads API keys)
- Competitor intel folder empty

### Agent Integration
- Spyder, Pomelli, Stitch, OpenClaw — all blueprinted but none executed yet
- Google Sheets campaign tracker not created

### Future Roadmap
- Multi-property support (parameterise blueprint)
- Campaign templating (reusable structures)
- Auto performance feedback loop (ingest ad data → adjust creative)
- A/B testing framework
- Client portal / dashboard
