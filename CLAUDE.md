# SMMFactory — session context

Read `docs/CAPABILITIES.md` before asking the user which repo does what —
it maps every repo (SMMFactory / LeadSynch / BookLets) to its job and lists
what's already built here.

House rules:
- SMMFactory is the marketing gateway: campaigns, creative, dashboards,
  SEO tooling, and the blog pipeline (`tools/blog-studio/`,
  `.claude/skills/`, `content/blog/`). Audience-facing output belongs here.
- Content ships as `draft: true` and a human publishes — the Four-Eyes
  principle applies to content as well as campaigns.
- Cross-repo integrations (e.g. the LeadSynch research engine) are optional
  couplings behind env-var URLs with graceful fallback — never hard
  dependencies.
