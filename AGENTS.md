# SMMFactory — Repository Governance & Agent Axioms

> **Standard:** Strict Deterministic Grounding & Automated Reasoning Safeguards  
> **Reference:** Karpathy LLM OS Grounding Framework & AWS Bedrock Automated Reasoning Principles

---

## Core Axioms

### Axiom 1: Four-Eyes Principle
No campaign, ad set, budget change, or media asset may be deployed live to external platforms (Meta, Google, TikTok, LinkedIn) without automated truth test validation and explicit human stakeholder sign-off.

### Axiom 2: Tokenless Core
SMMFactory client workspaces remain deliberately tokenless. Outbound credentials and platform tokens reside exclusively in secure runtime vaults (`Hermes-Dev` / Supabase).

### Axiom 3: Perishable Yield Law
Hospitality inventory pricing must respect actual operational minimums ($180 same-day whole-villa floor / $45 single-room floor) rather than speculative rack-rate calculations.

### Axiom 4: Grounding & Zero Hallucination (Strict Closed-Vocabulary Gate)
All dynamic outputs must pass `scripts/validate-grounding.mjs` before being committed to campaign manifests or execution payloads.

### Axiom 5: Deterministic Hub Pre-Flight Gate (Session Standard)
Every agent or session start must verify the live integration hub (`bash scripts/test-remote-hub.sh`) and deterministic truth suite (`node tests/integration-hub-truth.mjs`). Inbound webhook latency must remain <200ms and buzz-bar must be online with active relay connection.

---

## BMAD (Breakthrough Method for Agile AI-Driven Development) Role Matrix

To prevent the "one-chat trap" and context drift, SMMFactory organizes agents into a simulated agile team with strict sequential handoffs and cryptographic phase gates:

| BMAD Role | SMMFactory Implementation | Domain & Ownership | Phase Gate / Axiom |
|---|---|---|---|
| **Analyst** | `Spyder` (`scripts/extract-market-dna.mjs`, SEMrush, AdSpyder) | Market reconnaissance, competitor scraping, keyword harvesting | **Axiom 4:** Closed-Vocabulary Gate. Verifiable proof points. |
| **Product Manager** | `Strategy PM` (`campaigns/registry.json`, `Campaign_Summary.md`) | Campaign brief, audience targeting, Hormozi offer structure | Brief approval prior to creative generation. |
| **Architect** | `Yield & Schema Architect` (`tools/market-dna-schema.mjs`, Rate Limiters) | Technical contracts, pricing invariants, tokenless vaults | **Axioms 2 & 3:** $250 / $45 price floors, SHA-256 locks. |
| **Developer** | `Pomelli & Stitch` (`generate-ad-copy.mjs`, `generate-landing-page.mjs`) | Multi-variant ad copy, responsive HTML landing pages | **Policy:** 2+ proof points, 0 superlatives on ChatGPT. |
| **QA Test Architect** | `Truth Test Engine` (`tests/truth-tests.mjs`, `scripts/quality-gate.sh`) | Deterministic unit, schema, and integration truth testing | **Zero Tolerance:** 100% test pass rate required. |
| **Red Team Auditor** | `Security Scrubber` (`tools/security-scrubber.mjs`) | Prompt injection defense, secret redaction, tamper detection | Zero high-entropy secret leakage (`sk-`, `EAA`). |
| **Release Orchestrator** | `OpenClaw & Review Engine` (`review-engine/`, `deploy-campaign.mjs`) | Four-Eyes approval gate, multi-platform dispatch | **Axiom 1:** Cryptographic stakeholder sign-off required. |
