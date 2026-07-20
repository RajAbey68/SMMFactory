---
name: blog-post
description: Write one on-brand blog post for a SMMFactory campaign and save it to content/blog/ as a draft. Use whenever the user asks to write, draft, or add a blog post, or gives a topic and a campaign ref (KLRtr, AICar, SKYHV) and says "blog" — even if they don't name this skill.
---

# blog-post skill

Writes one blog post for a SMMFactory campaign in that campaign's voice,
with correct frontmatter, and saves it to `content/blog/` as a draft. It
never publishes, schedules, or pushes anything live.

## Hard rules

1. **Draft only.** Every new post is written with `draft: true`. Flipping a
   post to `draft: false` is a human decision made after reading it — never
   do it automatically. This is the Four-Eyes gate applied to content.
2. **Stay in `content/blog/`.** This skill writes Markdown. It does not edit
   campaign registries, ad configs, or any code.
3. **Voice comes from the campaign, not a fixed house style.** Resolve the
   campaign from its ref, read its brief, and match that campaign's audience
   and tone (see below). A Ko Lake Villa retreats post and an AI-career
   personal-brand post do not sound alike.
4. **Ground every factual claim.** If the post states something about a
   product, offer, price, or result, verify it against the campaign's own
   files (`campaigns/<slug>/`, its brief, research) before writing it.
   Don't invent specifics. Hedge or drop anything you can't ground.
5. **One post per invocation** unless asked for more.

## Resolve the campaign

| Ref | Campaign | Audience & register |
|-----|----------|---------------------|
| `KLRtr` | Ko Lake Villa — Retreats & Events | Retreat organisers & discerning travellers. Warm, sensory, unhurried; sells calm and place, not features. |
| `AICar` | AI Adoption Advisor — Career Push | Professionals & hiring managers. Credible, plain, confident; practical authority without hype. |
| `SKYHV` | Sky High Villas — Heli-Tours Push | Luxury/experience seekers. Vivid, aspirational, precise; the thrill is concrete, never generic. |
| _(none)_ | Generic SMMFactory house post | Plain, direct, ~7th–9th grade. Lead with the reader's problem. |

Read `campaigns/<slug>/Campaign_Summary.md` (and its brief/research if
present) before writing, so the post matches the strategy already agreed for
that campaign. If the ref is unknown, ask which campaign — don't guess.

## Voice defaults (all campaigns)

- Short paragraphs (2-4 sentences); a `##` heading every ~150-250 words.
- Lead with the reader, not the brand. Mention the offer once the reader
  cares, not in the opening line.
- No hype adjectives ("revolutionary", "seamless", "game-changing"), no
  exclamation points in body copy.
- Specific beats clever. Concrete detail over adjectives.

## Structure

```markdown
---
title: "..."                 # states the reader's outcome, <70 chars
description: "..."           # one sentence for the index + search snippet
date: "YYYY-MM-DD"            # today
campaign: "KLRtr"            # ref, or omit for a generic house post
tags: ["...", "..."]          # 2-4 lowercase tags
keywords: ["...", "..."]      # 2-5 phrases a reader would actually search
author: "SMMFactory"
draft: true
---

Opening: the reader's problem in concrete terms — no throat-clearing.

## A section per sub-point

Body in GitHub-flavored Markdown.

## Close

One specific next step tied to the campaign's CTA.
```

Target 500-1000 words unless the topic genuinely needs more.

## Output

Save to `content/blog/YYYY-MM-DD-slug.md` (the filename is the slug — see
`content/blog/README.md`). Report the path back. Do not open a PR or deploy.
