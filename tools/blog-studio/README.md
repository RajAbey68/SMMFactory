# Blog Studio

> The SMMFactory **content pipeline**, as a guided wizard.
> Part of the `tools/` ecosystem (sibling to `asimov-ai`).

A standalone, no-build wizard that turns a topic or source into an on-brand,
campaign-tagged **blog brief + draft + SEO checklist** — the consistent
starting point for every post. It never publishes: the output is always a
`draft`, cleared by a human (the Four-Eyes principle, applied to content).

## Run it

```bash
open tools/blog-studio/index.html      # or just double-click — no build step
```

Walk the six steps → **Assemble brief**. You get three copyable outputs:

| Tab | What it is | Use it to |
|-----|-----------|-----------|
| **Skill brief** | A ready-to-paste `/blog-post` prompt | Drop into a Claude Code / Cowork session — the `blog-post` skill writes the post in the campaign voice. |
| **Draft .md** | Frontmatter filled + an outline scaffold | Download straight into `content/blog/` and write by hand. |
| **SEO checklist** | Title/description/keyword checks + suggested searches | Sanity-check the angle before writing (`npm run seo` for real volume). |

## The steps

1. **Source** — topic idea, **run new research** (LeadSynch), **pick up previous research** (campaign files / stored LeadSynch profiles), pasted text, a URL, or a campaign asset
2. **Campaign** — `KLRtr` / `AICar` / `SKYHV` / generic house post (sets voice + audience)
3. **Angle** — working title + source detail
4. **Keywords** — primary + supporting
5. **Voice** — match the campaign, or override the tone
6. **Format** — length + the closing call to action

## How it fits together

```
tools/blog-studio/index.html   ← this wizard (assembles the brief)
        │  hands off to
        ▼
.claude/skills/blog-post/       ← writes the post in the campaign voice → content/blog/*.md (draft)
.claude/skills/content-repurposing/   ← source → blog-post
.claude/skills/seo-brief/       ← WebSearch keyword/gap brief
        │  grounded by
        ▼
LeadSynch research engine       ← POST /api/research/entity (LEADSYNCH_URL / localhost:3001):
        │                          tiered sources + per-finding provenance
        ▼
content/blog/*.md               ← draft store; a human flips draft:true → false to publish
```

**LeadSynch hookup:** pick "LeadSynch research" as the Source step. The
assembled brief instructs the skill to run `POST /api/research/entity`,
poll the job, and write only from the returned sources (each carries a
`sourceUrl`). Falls back to `WebSearch` — flagged in the draft header —
when the service isn't running.

## Files

```
tools/blog-studio/
├── index.html   # standalone wizard UI (structure + styles)
├── studio.js    # wizard state machine + output assembly (vanilla JS, no deps)
└── README.md    # this file
```

## Design

Dark editorial treatment matching the SMMFactory tools family — near-black
ground, a warm gold accent (paper-and-ink, distinct from `asimov-ai`'s indigo
governance tool), **Fraunces** for display, **Inter** for UI, **JetBrains
Mono** for the generated markdown. Keyboard-navigable, respects
`prefers-reduced-motion`.
