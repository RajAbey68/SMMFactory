# 100% Verification & Anti-Hallucination Protocol (Karpathy Grounding Architecture)

> **Core Philosophy (Karpathy / LLM OS):** LLMs are generative "dream engines". Without strict deterministic boundary verification, outputs degrade into plausible-sounding hallucinations. In Antigravity / SMMFactory, **zero assumption is permitted**. Every fact, keyword, price floor, credential, and system state must be mathematically or deterministically grounded.

---

## 1. The 5 Grounding Laws (Deterministic Verification)

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                           ANTI-HALLUCINATION GUARDRAILS                               │
├──────────────────────────┬────────────────────────────────────────────────────────────┤
│ 1. Zero-Speculation Law  │ Never invent keywords, volumes, URLs, or system states.     │
│                          │ If a data point is missing, query the source or state NULL.│
├──────────────────────────┼────────────────────────────────────────────────────────────┤
│ 2. Ground Truth Anchor   │ All marketing claims must trace to a verified source artifact│
│                          │ (e.g. market_dna.json, seo_intel.json).                    │
├──────────────────────────┼────────────────────────────────────────────────────────────┤
│ 3. LLM-Council Consensus │ Critical strategy decisions must be scored against strict  │
│                          │ deterministic criteria (Hormozi / Priestley frameworks).   │
├──────────────────────────┼────────────────────────────────────────────────────────────┤
│ 4. Deterministic State   │ Never claim an external deployment (Meta, n8n, Google) is  │
│                          │ "live" without an HTTP 200 verification check.             │
├──────────────────────────┼────────────────────────────────────────────────────────────┤
│ 5. Perishable Law        │ Commercial pricing must respect actual operating minimums  │
│                          │ ($180 same-day floor), not generic luxury assumptions.     │
└──────────────────────────┴────────────────────────────────────────────────────────────┘
```

---

## 2. Mandatory Pre-Flight Verification Gate

Before any marketing asset, campaign summary, keyword deck, or API payload is presented:

1. **Keyword Grounding**:
   * ❌ BANNED: Generating ad keywords from intuition.
   * ✅ REQUIRED: Keywords must originate from `market_dna.json` or verified SEMrush / SE Ranking research scans.
2. **Property & Amenities Grounding**:
   * ❌ BANNED: Claiming amenities or titles not in the ground truth (e.g., "trained chef").
   * ✅ REQUIRED: Explicitly cross-reference `market_dna.json` ("in-house villa cooks and kitchen team").
3. **Deployment Grounding**:
   * ❌ BANNED: Claiming campaigns or webhooks are active when they return 404/500.
   * ✅ REQUIRED: Run deterministic probe (`curl -s -o /dev/null -w "%{http_code}"`) and report exact HTTP status code.
