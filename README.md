# SMMFactory — Cloud-Hybrid Marketing Studio

> **BMAD Method** — Build → Measure → Analyze → Deploy  
> **Four-Eyes Principle** — No campaign goes live without automated + human verification.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    BMAD Pipeline                        │
├──────────┬──────────┬──────────┬────────────────────────┤
│  BUILD   │ MEASURE  │ ANALYZE  │         DEPLOY         │
│          │          │          │                        │
│ Spyder   │ Truth    │ Four-    │ OpenClaw → Meta/Google │
│ → DNA    │ Tests    │ Eyes     │ GCS ← Pomelli assets   │
│ Pomelli  │ CodeQL   │ Review   │ GitHub → Production    │
│ → Ads    │ Quality  │ Gate     │                        │
│ Stitch   │ Gate     │          │                        │
│ → Page   │          │          │                        │
└──────────┴──────────┴──────────┴────────────────────────┘
```

## Cloud-Hybrid Strategy

| Asset Type | Where | Why |
|---|---|---|
| Code & configs | 📂 Local / Git | Version-controlled, lean |
| High-res media | ☁️ GCS bucket | Heavy, agent-accessible |
| Agent history | 📁 Google Drive | Synced via Storage Manager |

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run truth tests (validates scaffold)
npm test

# 3. Run full quality gate
npm run quality

# 4. Copy MCP config to Antigravity global
cp mcp_config.json ~/.antigravity/mcp_config.json
```

## Agent Workflows

| Command | What it does |
|---|---|
| `/truth-test` | Validates configs, structure, and cross-references |
| `/verify` | Full pre-deploy quality gate |
| `/quality` | Quick quality check |
| `/status` | Workspace health snapshot |

## Blueprint

Open `marketing-studio.agy` in the Antigravity Playground to run the full orchestration:

1. **RECON** (Spyder) → `research/market_dna.json`
2. **CREATIVE** (Pomelli + Stitch) → ads + landing page
3. **DEPLOY** (OpenClaw) → Meta + Google campaigns

## CI/CD (GitHub Actions)

The `.github/workflows/deploy_ads.yml` pipeline enforces:

- ✅ Config validation + truth tests
- 🛡️ CodeQL security scanning
- 🏗️ Landing page build
- 🚀 Staging deploy (auto)
- 🎯 Production deploy (**manual four-eyes approval required**)

### Required GitHub Secrets

| Secret | Purpose |
|---|---|
| `GCP_SA_KEY` | GCS service account JSON |
| `META_API_KEY` | Meta Ads API (used by OpenClaw) |
| `GOOGLE_ADS_KEY` | Google Ads API (used by OpenClaw) |

> ⚠️ **Never hardcode credentials.** Store in GitHub Secrets and inject at runtime.

## Setup Checklist

- [ ] Run `Antigravity Storage: Setup Google Drive Sync` from Command Palette
- [ ] Install GCS MCP from the Antigravity MCP Store
- [ ] Create GCS bucket `marketing-studio-assets` in Google Cloud Console
- [ ] Enable Google Drive API + Cloud Storage API in Cloud Console
- [ ] Add GitHub Secrets for GCP, Meta, and Google Ads
- [ ] Configure GitHub Environments: `staging` (auto) + `production` (manual approval)
