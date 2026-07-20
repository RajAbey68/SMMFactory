# Capabilities Register

> One page answering "which repo does what, and what's already built" — so no
> session has to ask again. Update this when a capability moves or ships.
> Last updated: 2026-07-20.

## Repos and their jobs

| Repo | Job | Do NOT put here |
|------|-----|-----------------|
| **RajAbey68/SMMFactory** | The marketing gateway. Campaigns (BMAD lifecycle, Four-Eyes gate), creative, dashboards, SEO tooling, **all content production — including the blog pipeline**. | CRM/lead data, bookkeeping |
| **RajAbey68/LeadSynch** (private) | CRM + the **grounded research engine**: `POST /api/research/entity` on port 3001 (`LEADSYNCH_URL` in prod), Exa + OpenRouter source providers, tiered source-trust policy, per-finding `sourceUrl` provenance, batch + Method-B runs, NotebookLM/Obsidian export. Next.js frontend + Express backend, Biome lint. | Marketing content, campaign assets |
| **RajAbey68/BookLets** | Bookkeeping for short-term lettings (double-entry ledger, Next.js 16 + Prisma + Supabase). **Nothing marketing-related belongs here** — a blog system briefly landed here by mistake (BookLets PR #115, closed unmerged; leftover branch `claude/blog-population-system-r5xvjh` can be deleted). | Blogs, campaigns, marketing |

## SMMFactory: what's already built

- **Blog pipeline** (branch `feat/blog-studio`, PR #3):
  - `tools/blog-studio/` — standalone wizard UI (open `index.html`, no build).
    Source → Campaign → Angle → Keywords → Voice → Format → assembled
    brief / draft `.md` / SEO checklist.
  - `.claude/skills/blog-post|content-repurposing|seo-brief` — the writing
    skills. Campaign voices resolved from refs `KLRtr` / `AICar` / `SKYHV`.
    Everything lands as `draft: true` in `content/blog/`; a human publishes.
  - LeadSynch research is an **optional** grounding source (falls back to
    WebSearch when the service isn't running).
- **Campaign registry** — `campaigns/registry.json`, 8-phase lifecycle,
  refs above.
- **Dashboards** — `dashboard/` (Campaign Command Center), `landing-page/`.
- **SEO tooling** — `npm run seo` / `npm run semrush` (SE Ranking / SEMrush
  clients in `scripts/`).
- **Other tools** — `tools/asimov-ai/` (governance config wizard),
  `review-engine/`, `creative/hook-studio/`.

## Cross-repo rules

- Marketing/content work → SMMFactory. Lead/contact research → LeadSynch.
  Money/ledger → BookLets. When in doubt, it's SMMFactory if the output is
  audience-facing.
- Cross-repo integrations are **optional couplings** (env-var service URLs,
  graceful fallback) — never hard dependencies.

## Second-brain sync

To make this register queryable in the AI Brain NotebookLM notebook, run on
the Mac (after this branch merges to main):

```bash
notebooklm use <ai-brain-notebook-id>
notebooklm source add "https://raw.githubusercontent.com/RajAbey68/SMMFactory/main/docs/CAPABILITIES.md"
```

Re-add after significant updates so the notebook copy stays current.
