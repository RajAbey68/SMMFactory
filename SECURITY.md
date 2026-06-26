# SECURITY.md — API Key Management

**Last Updated:** April 2026
**Owner:** Antigravity Studio

> ⚠️ **NEVER commit API keys, tokens, or credentials to git.**
> This file tells you how to manage them safely.

---

## The Golden Rule

**Secrets live in `.env` only. `.env` is gitignored. It never enters GitHub.**

If you discover a key has been committed:
1. Immediately rotate the key on the provider's dashboard
2. Force-push to remove it from history (or use `git filter-repo`)
3. Audit logs to check whether the key was used

---

## Environment Variable Reference

Create a `.env` file at the root of this project (never inside any subdirectory).
Copy `.env.example` as your starting template.

### AI Providers (at least one required)

```env
# Primary — OpenAI
OPENAI_API_KEY=sk-...

# Secondary fallback — Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Tertiary fallback — Google Gemini
GEMINI_API_KEY=AIza...

# Override auto-detection (optional)
AI_PROVIDER=openai   # or: anthropic | gemini
```

**Auto-detection order:** OpenAI → Anthropic → Gemini
If `AI_PROVIDER` is set, only that provider is used.

---

### Google Cloud (Storage + Drive + Ads)

```env
GCS_BUCKET_NAME=marketing-studio-assets
GCS_PROJECT_ID=antigravity-studio
GCS_REGION=us-central1

# Path to Service Account JSON (do NOT commit this file)
GOOGLE_APPLICATION_CREDENTIALS=/Users/your-name/.secrets/smm-factory-sa.json

GOOGLE_DRIVE_ROOT_DIR=Antigravity_Studio_Project
GOOGLE_ADS_CUSTOMER_ID=1234567890
GOOGLE_ADS_DEVELOPER_TOKEN=abcd1234
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

---

### Ad Platforms

```env
# Meta (Facebook/Instagram)
META_AD_ACCOUNT_ID=act_1234567890
META_API_TOKEN=EAA...
META_BUSINESS_ACCOUNT_ID=123456789

# TikTok Ads
TIKTOK_AD_ACCOUNT_ID=xxx
TIKTOK_ACCESS_TOKEN=xxx
TIKTOK_BUSINESS_ACCOUNT_ID=xxx

# LinkedIn
LINKEDIN_ACCESS_TOKEN=xxx
LINKEDIN_CAMPAIGN_GROUP_ID=xxx

# OpenAI Ads Platform
OPENAI_ADS_API_KEY=xxx
OPENAI_ADS_ACCOUNT_ID=org-xxx
```

---

### Research / Intelligence APIs

```env
# AdSpyder — competitor ad intelligence
ADSPYDER_API_KEY=xxx

# SEMrush — SEO + PPC intelligence (Analytics API)
# Requires a subscription WITH the API-units add-on.
# Key location: SEMrush account → Subscription info → API units.
SEMRUSH_API_KEY=xxx
SEMRUSH_DATABASE=uk   # uk | us | au | de | ...

# SE Ranking — SEO + PPC intelligence (Data API, SEMrush alternative)
# One key authenticates every endpoint. Sent as "Authorization: Token <key>".
SERANKING_API_KEY=xxx
SERANKING_SOURCE=uk

# Provider selector for scripts/seo-scan.mjs
SEO_PROVIDER=semrush   # semrush | seranking
```

> ⚠️ The SEMrush key is passed as a URL query parameter by the Analytics API.
> The client never logs it in full (only `first5...last4`), and `.env` is gitignored —
> never paste a real key into a shared API-call example.

---

### Notifications

```env
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SLACK_CHANNEL=#marketing-studio
```

---

### App

```env
NODE_ENV=development   # or: production
PORT=3000
```

---

## Service Account JSON Files

Google APIs use a Service Account JSON file, not an env variable API key.
Store it **outside** the project directory:

```
~/.secrets/smm-factory-sa.json    ← NOT inside the SMMFactory folder
```

Set the path in `.env`:
```env
GOOGLE_APPLICATION_CREDENTIALS=/Users/arajiv/.secrets/smm-factory-sa.json
```

The `.gitignore` already excludes `service-account*.json` patterns,
but storing it outside the project directory is an extra safety layer.

---

## Key Rotation Policy

| Provider | Rotate Every | How |
|----------|-------------|-----|
| OpenAI | 90 days or on compromise | platform.openai.com → API keys |
| Anthropic | 90 days | console.anthropic.com |
| Meta | On employee offboarding | Facebook Business Manager |
| Google | On compromise only | Google Cloud Console → IAM |
| SEMrush | 90 days or on compromise | SEMrush → Subscription info → API units |
| SE Ranking | 90 days or on compromise | SE Ranking → Account → API |
| All | Immediately on accidental commit | See Golden Rule above |

---

## Checking for Leaked Keys

Before making the GitHub repo public, run:

```bash
git log --all --full-history -- '*.env' '*.key' '*.pem'
git grep -i "sk-" -- '*.json' '*.md' '*.mjs' '*.ts'
git grep -i "api_key" -- '*.json' '*.md' '*.mjs' '*.ts'
```

If any results appear, rotate those keys immediately.

---

## .env.example Template

This file IS committed to git — it shows the required keys
without any real values. Always keep it up to date.

See [.env.example](.env.example) in the project root.

---

## What's Already Protected

The `.gitignore` in this project already excludes:

```gitignore
.env
.env.local
.env.production
*.pem
*.key
*.p12
service-account*.json
oauth-credentials*.json
```

**Do not remove any of these entries.**
