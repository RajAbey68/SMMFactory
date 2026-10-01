# BMAD (Breakthrough Method for Agile AI-Driven Development) in SMMFactory

## 1. Overview & Core Philosophy

The **BMAD Method** (*Breakthrough Method for Agile AI-Driven Development*) structures AI-assisted engineering into a **simulated agile team of specialized, role-based agents** collaborating across formalized lifecycle phases with explicit handoffs and human gates.

In SMMFactory, BMAD operationalizes the studio pipeline:
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                BMAD AGILE LIFECYCLE                                    │
├────────────────────┬────────────────────┬─────────────────────┬────────────────────────┤
│   1. ANALYSIS      │    2. PLANNING     │   3. SOLUTIONING    │   4. IMPLEMENTATION    │
│  (Market & Intel)  │  (Spec & Strategy) │ (Creative & Engine) │   (Quality & Deploy)   │
├────────────────────┼────────────────────┼─────────────────────┼────────────────────────┤
│ • Spyder Agent     │ • Strategy PM      │ • Pomelli (Copy)    │ • QA Truth Architect   │
│ • SEMrush / Spyder │ • Yield Architect  │ • Stitch (Landing)  │ • Red Team Auditor     │
│                    │                    │                     │ • OpenClaw Dispatcher  │
└────────────────────┴────────────────────┴─────────────────────┴────────────────────────┘
```

---

## 2. Specialized Agent Roles & Responsibility Matrix

| BMAD Persona | SMMFactory Agent Role | Primary Responsibilities | Core Artifact Produced | Strict Gate / Axiom |
|---|---|---|---|---|
| **Analyst (Mary)** | **Spyder & Competitive Intel Agent** | Crawls competitor domains, queries SEMrush/AdSpyder, extracts brand DNA & USPs. | `research/market_dna.json`<br>`research/seo_intel.json` | **Axiom 4:** Closed-Vocabulary gate. Zero speculative keywords. |
| **Product Manager (John)** | **Strategy & Campaign PM** | Defines campaign hypotheses, sets target audience briefs, validates Hormozi value scores. | `Campaign_Summary.md`<br>`action_calendar.md` | PRD & Brief sign-off before creative genesis. |
| **Architect (Winston)** | **System & Yield Architect** | Enforces technical schemas, rate floors, rate limiters, tokenless vaulting, and data contracts. | `tools/market-dna-schema.mjs`<br>`MASTER_PROPERTY_DICTIONARY.json` | **Axiom 2 & 3:** Tokenless core + Perishable Yield Law ($250 / $45 floors). |
| **Developer (Amelia)** | **Creative Studio (Pomelli & Stitch)** | Synthesizes 3 thematic ad copy variants, OpenAI placement cards, and brand-matched landing pages. | `creative/ad_variants.json`<br>`landing-page/generated/` | **Proof Policy:** 2+ verifiable proof points, 0 superlatives on ChatGPT. |
| **QA Test Architect** | **Deterministic Truth Gate Agent** | Executes automated test suites, validates JSON schemas, runs functional logic & integration tests. | `tests/truth-tests.mjs`<br>`scripts/quality-gate.sh` | **100% Truth Test Pass:** Hard stop if any test fails. |
| **Red Team / Security Reviewer** | **Adversarial Security Auditor** | Performs prompt injection defense, credential scrubbing, and cryptographic SHA-256 phase locking. | `tools/security-scrubber.mjs`<br>`research/adversarial_red_team_report.json` | Zero secret leakage (`sk-`, `EAA`), no unscrubbed DOM strings. |
| **Orchestrator / Release Gate** | **OpenClaw & Four-Eyes Dispatcher** | Coordinates multi-platform deployment (Meta, Google, OpenAI, TikTok, LinkedIn) and BuzzBar events. | `scripts/deploy-campaign.mjs`<br>`dashboard/review-engine` | **Axiom 1:** Four-Eyes Principle. Mandatory human stakeholder signature. |

---

## 3. Collaboration Patterns (Methodology as Code)

1. **Sequential Handoff:**
   - `Analyst` (`extract-market-dna.mjs`) → `Architect` (`market-dna-schema.mjs` + SHA-256 lock) → `Developer` (`generate-ad-copy.mjs` + `generate-landing-page.mjs`) → `QA Architect` (`truth-tests.mjs`) → `Release Gate` (`review-engine`).
2. **Party Mode (Roundtable / Third-Party Review):**
   - Independent LLM personas (DeepSeek, GLM, Claude) review architectural changes prior to merge.
3. **On-Demand Specialists:**
   - Rate limiting, SEO provider adapters (SEMrush vs SE Ranking), and BuzzBar WebSocket broadcasters invoked for dedicated sub-tasks.
