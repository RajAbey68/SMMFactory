# Anti-Gravity — Detailed System Prompt & TDD Specification

**Last Updated:** April 18, 2026  
**Status:** Production-Ready with Phase 3 Enhancements  
**Owner:** Antigravity Studio  

---

## Table of Contents

1. [System Overview & Vision](#system-overview--vision)
2. [Test-Driven Development Framework](#test-driven-development-framework)
3. [Core Outcomes & Success Metrics](#core-outcomes--success-metrics)
4. [Required Integrations](#required-integrations)
5. [Skills & Capabilities to Add](#skills--capabilities-to-add)
6. [Implementation Roadmap](#implementation-roadmap)

---

## System Overview & Vision

### Mission

Anti-Gravity is a **self-optimizing marketing studio** that transforms competitive intelligence and market DNA into proof-based ad campaigns across Meta, Google, TikTok, LinkedIn, and OpenAI Ads (ChatGPT placements).

The studio eliminates manual campaign creation through:
- **Spyder** (Research): Automated competitor intelligence extraction
- **Pomelli** (Creative): AI-generated ad copy with 3 thematic variants per campaign
- **Stitch** (Landing): Responsive landing pages matching brand DNA
- **OpenClaw** (Deployment): Coordinated multi-platform campaign launch and optimization

### Core Architecture

```
Input (Market DNA + Competitor Intel)
    ↓
BUILD (Spyder → Pomelli → Stitch)
    ↓
MEASURE (Truth Tests + Configuration Validation)
    ↓
ANALYZE (AI Intelligence Analyst + Rate Limiting)
    ↓
DEPLOY (OpenClaw → Meta Advantage+ / Google PMax / OpenAI Ads)
    ↓
Output (Campaign Results + Attribution + Optimization Recommendations)
```

### Campaign Lifecycle (8 Phases)

| Phase | Owner | Input | Output | Gate |
|-------|-------|-------|--------|------|
| 1. Ideation | Strategist | Client brief | Campaign hypothesis | Approval |
| 2. Research | Spyder | Domain + competitors | market_dna.json | Completeness check |
| 3. Planning | Analyst | Market DNA + Intel | Creative brief | Strategy review |
| 4. Creative | Pomelli | Creative brief | 3 ad sets + copy variants | Four-Eyes human review |
| 5. Review | Human + AI | Ad copy + landing page | Quality score | Pass/fail gate |
| 6. Launch | OpenClaw | Approved assets | Live campaigns | Deployment confirmation |
| 7. Optimize | Feedback loop | Performance data | Bid adjustments + pause rules | Weekly review |
| 8. Close | Analyst | Final results | Campaign postmortem | Archive + learnings |

---

## Test-Driven Development Framework

### Philosophy

Every feature and integration is validated through **truth tests** before deployment. Tests are organized in three tiers:

1. **Structural Tests** (Configuration & Integrity)
2. **Functional Tests** (Logic & Business Rules)
3. **Integration Tests** (End-to-End Pipeline)

### Tier 1: Structural Tests (Unit Level)

#### Test Suite: Configuration Validation

```
Test 1.1 — market_dna.json Schema Validation
├─ File exists and is valid JSON
├─ Contains required fields: property, brand, colors, pricing, hooks
├─ Pricing format: { usd: number, currency: string }
├─ Hooks array has 3+ hooks with proof points
└─ PASS: Campaign can proceed to creative phase

Test 1.2 — Competitor Intel Format Validation
├─ File exists in research/competitor_intel/
├─ Contains required fields: competitors[], market_size, opportunity_gaps
├─ Each competitor has: name, hook, proof_points, estimated_spend
├─ Proof points are verifiable (numbers, named features, outcomes)
└─ PASS: Analysis can be performed

Test 1.3 — Campaign Registry Integrity
├─ registry.json is valid JSON
├─ All campaigns have unique IDs
├─ Campaign states match phase definitions
├─ No orphaned campaign folders
└─ PASS: Dashboard can render all campaigns

Test 1.4 — MCP Configuration Declaration
├─ mcp_config.json has all required servers
├─ Each server has: name, type, capabilities
├─ google-drive, google-cloud-storage, spyder-agent, adspyder declared
└─ PASS: Agent orchestration can proceed

Test 1.5 — Environment Variable Coverage
├─ At least one AI provider key is set (OPENAI/ANTHROPIC/GEMINI)
├─ GCS_BUCKET_NAME is set
├─ GOOGLE_DRIVE_ROOT_DIR is set
├─ NODE_ENV is set (development/production)
└─ PASS: Application can initialize
```

**Outcome:** 100% config integrity (30/30 truth tests passing)

---

### Tier 2: Functional Tests (Business Logic)

#### Test Suite: Campaign Execution Logic

```
Test 2.1 — Rate Limiting Enforcement
├─ Initialize RateLimiter(provider, limit=10, window=60000)
├─ Make 10 API calls → all succeed immediately
├─ 11th call → waits for oldest call to exit window
├─ After wait, 11th call succeeds
├─ Verify no cost overruns from burst calling
└─ PASS: Cost protection active

Test 2.2 — Environment Variable Validation
├─ No API keys set → validateEnv() throws error
├─ One key set → correctly selects provider
├─ AI_PROVIDER env var → overrides auto-detection
├─ Selected provider has no key → explicit error message
└─ PASS: Early failure prevents silent errors

Test 2.3 — Proof-Based Ad Copy Validation
├─ Parse generated ad copy
├─ Extract all superlatives (best, amazing, incredible, etc.)
├─ Count verifiable proof points
├─ OpenAI Ads variant must have: 2+ proof points, 0 superlatives
├─ Other platforms allow 1+ proof points, 1-2 superlatives
├─ If validation fails → return specific correction suggestions
└─ PASS: Ad copy is OpenAI-compliant

Test 2.4 — Market DNA Extraction (Spyder)
├─ Given domain + competitors list
├─ Extract: brand colors, USPs, pricing strategy, peak season
├─ Validate colors are hex codes
├─ Validate USPs have 2+ supporting proof points
├─ Compare against known benchmarks
└─ PASS: Market DNA is complete and accurate

Test 2.5 — Landing Page Generation (Stitch)
├─ Input: market_dna.json + ad copy variants
├─ Generate: Responsive HTML matching brand colors exactly
├─ Validate: Mobile viewport (375px), Tablet (768px), Desktop (1920px)
├─ Check: All CTAs are present and functional
├─ Ensure: Page loads in <2s on 3G connection
└─ PASS: Landing page is brand-aligned and performant

Test 2.6 — Budget Allocation Logic
├─ Given total daily budget (e.g., $1000)
├─ Allocate across Meta (40%), Google (40%), OpenAI Ads (20%)
├─ For OpenAI Ads at $60 CPM:
│  ├─ $200/day → ~3,333 impressions/day
│  ├─ Verify high-intent targeting applies
│  └─ Reject allocations <$100/day (too small for testing)
└─ PASS: Budget allocation follows Hormozi value equation
```

**Outcome:** 100% business logic validation before launch

---

### Tier 3: Integration Tests (End-to-End)

#### Test Suite: Full BMAD Pipeline

```
Test 3.1 — Complete Campaign Execution (BUILD → MEASURE)
├─ Input: market_dna.json + competitor_intel.json
├─ Build Phase:
│  ├─ Spyder extracts market DNA ✓
│  ├─ Pomelli generates 3 ad sets (romantic, professional, family) ✓
│  ├─ Stitch creates responsive landing page ✓
├─ Measure Phase:
│  ├─ Truth tests validate all outputs ✓
│  ├─ Config validation passes ✓
├─ Analyze Phase:
│  ├─ AI Intelligence Analyst scores hooks using Hormozi equation ✓
│  ├─ Rate limiting enforced (10 calls/60s) ✓
│  └─ Ad copy has 2+ proof points (ChatGPT compliance) ✓
├─ Deploy Phase:
│  ├─ OpenClaw validates all assets ✓
│  ├─ Schedules Meta/Google/OpenAI campaigns ✓
│  └─ Logs deployment confirmation ✓
└─ PASS: Campaign is live and optimizing

Test 3.2 — Error Recovery (Spyder Failure Scenario)
├─ Spyder crawl fails (domain blocked, timeout, etc.)
├─ Fallback: Use existing market_dna.json from previous scan
├─ If no previous scan:
│  ├─ Notify strategist with manual research checklist
│  ├─ Allow manual market_dna.json upload
│  └─ Continue pipeline with incomplete data
├─ Log failure reason for post-mortem
└─ PASS: Pipeline continues despite upstream failure

Test 3.3 — Multi-Provider AI Failover
├─ Primary provider (OpenAI) rate-limited or errored
├─ Automatically fail over to secondary (Anthropic)
├─ If secondary fails, try tertiary (Gemini)
├─ If all fail → alert operator, pause campaign
└─ PASS: No single provider dependency

Test 3.4 — Campaign Optimization Loop
├─ Day 1: Campaign launches with $1000 budget
├─ Day 2: Collect performance data (CTR, CPC, conversion)
├─ Day 3: AI Analyst reviews metrics:
│  ├─ High-performing ads: +25% budget
│  ├─ Low-performing ads: pause or -50% budget
│  ├─ Landing page: Analyze scroll depth, bounce rate
├─ Day 4: Updates deploy automatically
└─ PASS: Self-optimization works

Test 3.5 — Four-Eyes Gate Enforcement
├─ Draft campaign reaches review phase
├─ Human reviewer sees:
│  ├─ AI-generated ad copy with proof validation
│  ├─ Landing page with color-matched branding
│  ├─ Budget allocation with Hormozi scores
├─ Reviewer can:
│  ├─ Approve → auto-deploy
│  ├─ Revise → return to Pomelli for regeneration
│  ├─ Reject → archive and log feedback
├─ No campaign launches without explicit approval
└─ PASS: Quality gate is enforced
```

**Outcome:** End-to-end campaign delivery in <24 hours from input to launch

---

### Test Execution Strategy

```bash
# Run all truth tests (structural validation)
npm test
Expected: 30/30 passing ✓

# Run business logic tests (functional)
npm run test:integration
Expected: All BMAD phases validate ✓

# Run end-to-end pipeline test
npm run test:e2e (to be implemented in Phase 3)
Expected: Full campaign from input to launch ✓

# Quality gate before commit
npm run quality
Expected: Lint ✓ + Type check ✓ + Tests ✓
```

---

## Core Outcomes & Success Metrics

### Phase 1: Campaign Discovery (Week 1)

**Outcome:** Strategist uploads brief, system extracts market DNA and competitor intelligence

| Metric | Target | Validation |
|--------|--------|------------|
| Market DNA completeness | 100% of required fields | Schema validation test |
| Competitor intel coverage | 3-5 competitors identified | Count and proof point check |
| Research time | <30 minutes (fully automated) | Execution time logging |
| Spyder success rate | 100% (no timeouts) | 5 consecutive runs succeed |

---

### Phase 2: Creative Generation (Week 1)

**Outcome:** AI generates 3 ad variants (romantic, professional, family) + landing page

| Metric | Target | Validation |
|--------|--------|------------|
| Ad copy variants | 3 per campaign | Count in output |
| Proof-based compliance | 100% (2+ points, 0 superlatives) | Validation test 2.3 |
| Landing page load time | <2s on 3G | Lighthouse audit |
| Brand color match | 100% exact hex match | CSS variable check |
| Mobile responsiveness | Pass (375px, 768px, 1920px) | Multi-viewport test |

---

### Phase 3: Platform Deployment (Week 2)

**Outcome:** Campaigns launch on Meta, Google, OpenAI Ads with optimized budgets

| Metric | Target | Validation |
|--------|--------|------------|
| Deploy success rate | 100% (all platforms) | Confirmation logs |
| Meta Advantage+ setup | Automatic with audience | Account API validation |
| Google PMax creation | 1 per campaign | Performance Max API check |
| OpenAI Ads approval | Within 2 hours | Moderation layer check |
| Budget allocation | Within 5% of plan | Spend tracking |

---

### Phase 4: Optimization & Scale (Weeks 3-4)

**Outcome:** Campaigns optimize daily, underperformers pause, winners scale

| Metric | Target | Validation |
|--------|--------|------------|
| Automated optimization | Daily (no human touch) | Execution logs |
| CTR improvement | +15% week-over-week | Analytics comparison |
| Cost per result | -10-20% week-over-week | Trend analysis |
| ROAS (Return on Ad Spend) | 3:1 or better | Attribution reporting |
| Scale success | Can handle 10-20 concurrent campaigns | Load test |

---

### Quarter-End Business Outcomes

| Goal | Target | How We Measure |
|------|--------|----------------|
| **Campaign Success Rate** | 95%+ campaigns hit ROAS 3:1 | Dashboard reporting |
| **Time to Launch** | 24 hours input→live | Execution logs |
| **Cost Reduction** | 40% lower cost per result vs. manual | Month-over-month comparison |
| **Operator Efficiency** | 1 operator manages 20+ campaigns | Team capacity analysis |
| **AI Provider Resilience** | No single-provider failures | Failover test results |
| **Quality Gate Compliance** | 100% Four-Eyes approval | Audit logs |

---

## Required Integrations

### Tier 1: Critical (Must-Have for Phase 3)

#### 1. Meta (Facebook/Instagram) Ads API
**Purpose:** Deploy and optimize campaigns on Meta platforms  
**Endpoints:**
- `POST /v18.0/ad_accounts/{ad_account_id}/campaigns` (create)
- `POST /v18.0/ad_accounts/{ad_account_id}/adsets` (create sets with audience targeting)
- `POST /v18.0/ad_accounts/{ad_account_id}/ads` (create ads with creative)
- `GET /v18.0/{campaign_id}/insights` (fetch daily performance)
- `POST /v18.0/{campaign_id}` (update budget, bid strategy, status)

**Configuration:**
```env
META_AD_ACCOUNT_ID=act_1234567890
META_API_TOKEN=EAA...
META_BUSINESS_ACCOUNT_ID=123456789
```

**Test Case:** TBD — Deploy test campaign, verify insights pull, pause campaign

---

#### 2. Google Ads API
**Purpose:** Deploy Performance Max campaigns (automated full-funnel)  
**Endpoints:**
- `CreateCampaignRequest` (create Performance Max campaign)
- `CreateAdGroupRequest` (audience group setup)
- `CreateAssetGroupRequest` (upload headlines, descriptions, images)
- `SearchRequest` (query campaign stats daily)
- `MutateRequest` (adjust budgets, pause campaigns)

**Configuration:**
```env
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=abcd1234
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

**Test Case:** TBD — Create Performance Max campaign, verify asset upload, fetch daily stats

---

#### 3. Google Cloud Storage (GCS) — Media Asset Management
**Purpose:** Store ad creatives (images, videos, PSDs) without bloating git  
**Operations:**
- `storage.buckets.upload()` — Upload images/video from Pomelli output
- `storage.buckets.list()` — List available assets for campaign
- `storage.buckets.signedUrl()` — Generate shareable URLs for review

**Configuration:**
```env
GCS_BUCKET_NAME=gs://marketing-studio-assets
GCS_PROJECT_ID=antigravity-studio
GCS_REGION=us-central1
```

**Test Case:** Upload 3 ad images, generate signed URLs, verify 7-day expiry

---

#### 4. Google Drive API — Logs & Conversation History
**Purpose:** Archive campaign planning documents, agent logs, stakeholder feedback  
**Operations:**
- `drive.files.create()` — Create campaign folder + subfolders
- `drive.files.update()` — Update campaign status doc
- `drive.files.list()` — Retrieve all campaigns for dashboard

**Configuration:**
```env
GOOGLE_DRIVE_ROOT_DIR=Antigravity_Studio_Project
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

**Test Case:** Create folder structure, upload sample campaign file, list and retrieve

---

#### 5. OpenAI Ads Platform (ChatGPT Placements)
**Purpose:** Deploy high-CPM recommendation cards inside ChatGPT conversations  
**Endpoints:**
- `POST /api/ads/create` — Submit recommendation card
- `GET /api/ads/{ad_id}/performance` — Fetch daily impressions & CTR
- `POST /api/ads/{ad_id}/update` — Adjust budget or pause

**Configuration:**
```env
OPENAI_ADS_API_KEY=xxx
OPENAI_ADS_ACCOUNT_ID=org-xxx
```

**Proof Requirements:**
- Card title: Fact-based (no superlatives)
- Card body: 2-3 sentences with 2+ verifiable proof points
- CTA: Conversational (e.g., "Message us on WhatsApp")
- No moderation rejects

**Test Case:** Submit card with proof validation, verify approval within 2 hours, monitor impressions

---

### Tier 2: Strategic (Phase 3 Enhancement)

#### 6. TikTok Ads Manager API
**Purpose:** Reach younger demographics on highest-growth platform  
**Endpoints:**
- `POST /v0.9/adgroup/create` — Create ad group with targeting
- `POST /v0.9/ad/create` — Upload creative (video 9:16 vertical)
- `GET /v0.9/adgroup/{adgroup_id}/insights` — Daily performance metrics

**Configuration:**
```env
TIKTOK_AD_ACCOUNT_ID=xxx
TIKTOK_ACCESS_TOKEN=xxx
TIKTOK_BUSINESS_ACCOUNT_ID=xxx
```

**Rationale:** TikTok CPMs are 60-70% lower than Meta, making high-volume testing viable

---

#### 7. LinkedIn Campaign Manager API
**Purpose:** B2B and professional service advertising  
**Endpoints:**
- `POST /v2/adCampaignCreateRequests` — Create LinkedIn campaign
- `GET /v2/adAnalytics` — Fetch engagement metrics

**Configuration:**
```env
LINKEDIN_ACCESS_TOKEN=xxx
LINKEDIN_CAMPAIGN_GROUP_ID=xxx
```

**Rationale:** For B2B campaigns (AI Career, professional services)

---

#### 8. Slack Integration (Team Notifications)
**Purpose:** Real-time alerts for campaign milestones and anomalies  
**Events to Alert:**
- Campaign launched ✓
- Conversion spike detected (>30% improvement)
- Cost per result spike (+25%)
- Budget exhausted
- Four-Eyes review needed

**Configuration:**
```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#marketing-studio
```

---

### Tier 3: Future (Post-Launch Roadmap)

#### 9. Shopify Storefront API (E-Commerce)
**Purpose:** Direct integration for e-commerce campaigns with real-time inventory  
**Use Case:** Dropshipping, print-on-demand, luxury goods

---

#### 10. Stripe Payment API (Conversion Tracking)
**Purpose:** Track paid conversions and ROAS for digital products  
**Use Case:** Online courses, SaaS, digital downloads

---

#### 11. Mixpanel / Amplitude Analytics
**Purpose:** Deep-dive user behavior analysis beyond platform analytics  
**Use Case:** Multi-touch attribution and user journey mapping

---

## Skills & Capabilities to Add

### Tier 1: Core Skills (MVP)

#### Skill 1.1: Market DNA Extraction (Spyder Enhancement)
**Current State:** Manual research checklist  
**Desired State:** Automated competitor crawling with domain intelligence  
**Implementation:**
- Crawl target domain for brand colors, CTAs, pricing pages
- Extract hero copy, value props, testimonials
- Identify top 3-5 competitors and their ad spend estimates
- Generate market_dna.json automatically

**Test:**
```bash
node scripts/extract-market-dna.mjs --domain kolakevilla.com --competitors 3
Expected Output: research/market_dna.json with:
  ✓ Brand colors (hex codes)
  ✓ Pricing (ranges identified)
  ✓ USPs (extracted from hero copy)
  ✓ Competitor estimates
```

---

#### Skill 1.2: Ad Copy Regeneration (Pomelli Enhancement)
**Current State:** Single AI pass with manual proof validation  
**Desired State:** Multi-variant generation with automatic proof point insertion  
**Implementation:**
- Generate 3 thematic variants (romantic, professional, family)
- Each variant: headline (8 words) + body (15 words) + CTA (3 words)
- Auto-validate 2+ proof points per variant
- Flag superlatives and suggest replacements

**Test:**
```bash
OPENAI_API_KEY=sk-xxx node scripts/generate-ad-copy.mjs \
  --input research/market_dna.json \
  --themes romantic,professional,family
Expected Output: 
  ✓ 3 ad variants
  ✓ Each has 2+ proof points
  ✓ 0 superlatives in ChatGPT variant
  ✓ JSON with proof validation metadata
```

---

#### Skill 1.3: Landing Page Generation (Stitch Enhancement)
**Current State:** Responsive HTML + inline CSS  
**Desired State:** Brand-color matched, performance-optimized React component  
**Implementation:**
- Input: market_dna.json + ad copy variant
- Generate responsive React component
- Inject brand colors as CSS variables
- Optimize for Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)

**Test:**
```bash
npm run generate:landing-page -- \
  --market-dna research/market_dna.json \
  --ad-variant 1 \
  --output landing-page/generated/
Expected Validation:
  ✓ Mobile (375px) renders perfectly
  ✓ Tablet (768px) layout adjusts
  ✓ Desktop (1920px) full width
  ✓ Lighthouse scores: 90+ Performance, 100+ Accessibility
  ✓ LCP < 2.5s, FID < 100ms, CLS < 0.1
```

---

#### Skill 1.4: Budget Optimization Engine (OpenClaw Enhancement)
**Current State:** Fixed budget allocation (40% Meta, 40% Google, 20% OpenAI)  
**Desired State:** Dynamic allocation based on Hormozi value equation and real-time performance  
**Implementation:**
- Hourly: Pull performance data (CTR, CPC, conversion rate)
- Calculate ROI per platform
- Reallocate budget: high-ROI +25%, low-ROI -50% or pause
- Respect min/max constraints ($10-$500/day per platform)

**Test:**
```bash
npm run test:budget-optimization
├─ Day 1: Meta underperforming (CTR 0.8%) → pause
├─ Day 2: Google outperforming (CTR 2.1%, ROI 4:1) → increase 25%
├─ Day 3: OpenAI Ads cold start → maintain test budget
└─ Expected: Automated reallocation, no manual intervention
```

---

#### Skill 1.5: Four-Eyes Review Dashboard
**Current State:** JSON schema for review, manual CLI interaction  
**Desired State:** Web-based UI with side-by-side approval view  
**Implementation:**
- Dashboard shows: Campaign name, ad variants (3), landing page preview, budget
- Reviewer can: Approve, Revise (feedback), Reject
- On Approve: Auto-deploy to Meta/Google/OpenAI
- On Revise: Return to Pomelli with specific feedback
- On Reject: Archive campaign, log rejection reason for postmortem

**Test:**
```bash
npm run dev:dashboard
Browser: http://localhost:3000
├─ Load campaign "Ko-Lake Retreats"
├─ Review 3 ad variants + landing page
├─ Click "Approve" → campaign deploys within 2 minutes
├─ Verify Meta/Google/OpenAI campaigns are live
└─ Check deployment logs in research/ai_analysis.json
```

---

### Tier 2: Advanced Skills (Phase 3)

#### Skill 2.1: Competitor Ad Library Monitoring (AdSpyder Enhancement)
**Purpose:** Real-time tracking of competitor spend and creative rotation  
**Implementation:**
- Daily crawl of Meta Ad Library, Google Ads Transparency Center, TikTok Ad Archive
- Track creative changes, budget estimates, landing page changes
- Alert when competitor launches new campaign or major spend increase
- Generate weekly competitive brief

**Integration Points:**
- Meta Ad Library API
- Google Transparency Center (via web scraping)
- TikTok Ad Archive (via web scraping)
- Slack notifications

**Test:** TBD

---

#### Skill 2.2: Conversion Attribution (Multi-Touch)
**Purpose:** Understand which ad touchpoint drove the final conversion  
**Implementation:**
- Track user journey: Click → Landing Page → Conversion
- Use UTM parameters, pixel data, CRM integration
- Assign credit (first-touch, last-touch, linear, time-decay models)
- Generate attribution report by campaign

**Integration Points:**
- Google Analytics 4 (via Measurement Protocol)
- Stripe for transaction data
- Custom CRM webhooks

**Test:** TBD

---

#### Skill 2.3: A/B Testing Engine
**Purpose:** Automatically test landing page variants and measure statistical significance  
**Implementation:**
- Split traffic 50/50 between variant A and B
- Measure: CTR, scroll depth, time-on-page, conversion rate
- Calculate confidence interval (95%) and winner
- Auto-pause losing variant after N samples (min 100 conversions)

**Integration Points:**
- Hotjar or custom analytics pixel
- Google Analytics 4

**Test:** TBD

---

#### Skill 2.4: Predictive Lead Scoring (Prospecting)
**Purpose:** Pre-identify high-intent prospects before they convert  
**Implementation:**
- Build model: Landing page behavior + ad engagement → likelihood to purchase
- Score every visitor 0-100
- Feed scores back to campaign for audience lookalike targeting
- High-scorers get retargeted with upsell offers

**Integration Points:**
- Google Analytics 4 (event tracking)
- Facebook Pixel (custom conversions)
- CRM API (for training data)

**Test:** TBD

---

#### Skill 2.5: Regulatory Compliance Check
**Purpose:** Ensure ads meet platform policies before launch  
**Implementation:**
- Scan ad copy for forbidden terms (by jurisdiction)
- Verify landing page legal compliance (GDPR privacy, CCPA disclosure)
- Check image/video compliance (no restricted categories)
- Alert on policy violations before submission

**Platforms:**
- Meta Brand Safety
- Google Ads Quality Approval
- OpenAI Ads Moderation Layer

**Test:** TBD

---

### Tier 3: Intelligence & Insights (Post-Launch)

#### Skill 3.1: Winning Hook Generator
**Purpose:** Discover new hooks empirically through testing  
**Implementation:**
- Analyze all previous ad copy and performance data
- Extract hooks that drove conversions
- Identify patterns (specificity, proof points, emotional triggers)
- Auto-generate new hook variations based on patterns
- A/B test new hooks against existing winners

**Test:** TBD

---

#### Skill 3.2: Campaign Playbook Generator
**Purpose:** Create repeatable templates for future campaigns  
**Implementation:**
- After campaign closes, analyze what worked (hooks, budget splits, audience)
- Generate playbook: "For property/service type X, use:
  - Hooks: [list]
  - Audience targeting: [definition]
  - Budget split: Meta 50% / Google 30% / OpenAI 20%
  - Expected ROAS: 3.5:1"

**Test:** TBD

---

#### Skill 3.3: Market Intelligence Feed
**Purpose:** Continuous market monitoring and opportunity detection  
**Implementation:**
- Monitor industry trends (travel, real estate, SaaS)
- Track seasonal demand patterns
- Alert on macro events (recession, new platform launch, policy changes)
- Feed intelligence into campaign planning

**Integration Points:**
- Google Trends API
- News APIs (NewsAPI, AlphaNews)
- Industry databases (Crunchbase for startups, STR for hospitality)

**Test:** TBD

---

## Implementation Roadmap

### Phase 3: Foundation (Now → May 15, 2026)

**Goals:** Rate limiting ✓, Error recovery, Integration tests, Team documentation

| Week | Task | Owner | Status |
|------|------|-------|--------|
| W1 (Apr 18) | ✅ Rate limiting for AI API calls | Claude | Complete |
| W1 | Error recovery for Spyder failures | Claude | In Progress |
| W1 | TESTING.md (test strategy guide) | Claude | Pending |
| W1 | SECURITY.md (API key management) | Claude | Pending |
| W2 (Apr 25) | DEPLOYMENT.md (local dev → production) | Claude | Pending |
| W2 | Integration tests for BMAD pipeline | Claude | Pending |
| W2 | GitHub Actions CI/CD setup | Claude | Pending |
| W2 | ESLint + Prettier configuration | Claude | Pending |
| W3 (May 2) | Dashboard caching (5-min TTL) | Claude | Pending |
| W3 | Team documentation & onboarding | Claude | Pending |
| W4 (May 9) | Production sign-off & testing | Claude | Pending |
| W4 | Go-live preparation | Claude | Pending |

---

### Phase 4: Integration Layer (May 15 → June 30, 2026)

**Goals:** Meta + Google deployment, OpenAI Ads approval, Slack notifications

| Month | Integration | Scope | Owner |
|-------|-----------|-------|-------|
| May | Meta Ads API | Create campaigns, fetch insights, adjust budget | TBD |
| May | Google Ads API | Performance Max setup, daily optimization | TBD |
| May | OpenAI Ads Platform | Card creation, proof validation, moderation loop | TBD |
| Jun | GCS media management | Upload creatives, version control, signed URLs | TBD |
| Jun | Google Drive logging | Archive campaigns, store planning docs | TBD |
| Jun | Slack notifications | Launch alerts, anomaly detection, weekly summaries | TBD |

---

### Phase 5: Advanced Capabilities (July → September 2026)

**Goals:** TikTok + LinkedIn, Competitor monitoring, Attribution, A/B testing

| Quarter | Feature | Business Impact | Owner |
|---------|---------|-----------------|-------|
| Q3 | TikTok Ads deployment | 60% lower CPM, reach Gen Z | TBD |
| Q3 | LinkedIn campaigns | B2B vertical expansion | TBD |
| Q3 | AdSpyder monitoring | Weekly competitive brief | TBD |
| Q3 | Multi-touch attribution | True ROAS measurement | TBD |
| Q4 | A/B testing engine | Landing page optimization | TBD |
| Q4 | Predictive lead scoring | Pre-conversion identification | TBD |
| Q4 | Regulatory compliance check | Policy violation prevention | TBD |

---

### Success Criteria by Phase

#### Phase 3 (May 15): Production-Ready
- ✅ All truth tests passing (30/30)
- ✅ Rate limiting active (0 cost overruns)
- ✅ Error recovery for Spyder failures
- ✅ Integration tests for full BMAD pipeline
- ✅ Comprehensive documentation (ARCHITECTURE, TESTING, SECURITY, DEPLOYMENT)
- ✅ GitHub Actions CI/CD running
- ✅ Team training complete

#### Phase 4 (June 30): Platform Integration Complete
- ✅ Meta campaigns deploy automatically
- ✅ Google campaigns deploy automatically
- ✅ OpenAI Ads cards pass moderation and appear in ChatGPT
- ✅ Campaign performance dashboard live
- ✅ Slack notifications working
- ✅ First 5 client campaigns launched

#### Phase 5 (September 30): Full Multi-Channel Optimization
- ✅ TikTok + LinkedIn campaigns live
- ✅ Competitor monitoring dashboard active
- ✅ Attribution model validated against real data
- ✅ A/B testing engine running on 10+ campaigns
- ✅ 95%+ of campaigns hitting 3:1 ROAS
- ✅ Operating 20+ concurrent campaigns with <1 FTE operator

---

## Summary: What We're Building

**Anti-Gravity** is a self-healing marketing machine that:

1. **Takes** competitive intelligence + market data as input
2. **Generates** proof-based ad copy across 3 thematic variants
3. **Creates** brand-matched landing pages in minutes
4. **Deploys** simultaneously to Meta, Google, TikTok, LinkedIn, OpenAI Ads
5. **Optimizes** budgets hourly based on real-time performance
6. **Operates** with zero manual intervention after Four-Eyes approval

**By September 2026**, Anti-Gravity will be operating **20+ concurrent campaigns** for multiple clients, each generating **3:1+ ROAS**, with **<1 FTE operator** managing the entire platform.

---

**Questions or clarifications?** This prompt defines the complete vision and test framework for Anti-Gravity's evolution through September 2026.
