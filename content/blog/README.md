# content/blog

Draft and published blog posts produced by the SMMFactory content pipeline.
Each `.md` file is one post; the filename (minus `.md`) is its slug.
`README.md` is never a post.

## Frontmatter

```yaml
---
title: "Three Days Off-Grid at Ko Lake — What a Reset Actually Feels Like"
description: "One-sentence summary shown on indexes and in search results."
date: "2026-07-20"
campaign: "KLRtr"          # campaign ref, or omit for a generic house post
tags: ["retreats", "wellness"]
keywords: ["sri lanka wellness retreat", "off-grid retreat ko lake"]
author: "SMMFactory"
draft: true
---
```

- `draft: true` is the human-review gate (the Four-Eyes principle applied to
  content). Anything the pipeline generates starts as a draft; a person reads
  it, then flips `draft` to `false` when it's cleared to publish.
- `campaign` ties the post to a registry campaign (`KLRtr`, `AICar`,
  `SKYHV`) so its voice and audience are unambiguous.

## Producing a post

- **Wizard:** open `tools/blog-studio/index.html`, walk the steps, and copy
  the generated brief into a Claude Code / Cowork session — or download the
  draft `.md` scaffold directly.
- **Skills:** in a Claude session, trigger `/blog-post`,
  `/content-repurposing`, or `/seo-brief` (see `.claude/skills/`).

Both paths write a `draft: true` file here. Publishing is a separate,
deliberate step.
