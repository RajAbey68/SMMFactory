---
name: content-repurposing
description: Turn one source (a campaign asset, research doc, pasted text, or URL) into a SMMFactory blog post by orchestrating the blog-post skill. Use when the user gives a source and asks to "repurpose", "turn this into a blog post", or "write about" it without dictating the exact copy.
---

# content-repurposing orchestrator

One source in, one blog post out. This skill gathers and grounds the source,
then hands off to the `blog-post` skill, which owns voice, structure, and
frontmatter. It has no voice rules of its own.

## Accepted sources

- A campaign asset or research file (`campaigns/<slug>/...`,
  `research/...`, a DNA JSON, an action calendar)
- A path to any doc in the repo
- A URL (fetch with `WebFetch`; if it returns a JS shell or boilerplate,
  say so and ask for pasted text rather than inventing a summary)
- Pasted text (a transcript, an email, notes)
- **A LeadSynch research run** — an entity/topic to research first via the
  LeadSynch engine (`POST /api/research/entity` on `LEADSYNCH_URL` or
  `http://localhost:3001`; poll `GET /api/research/entity-job/:jobId`).
  The job's sources and initiatives, with their `sourceUrl` provenance,
  become the grounded source material for the post.

## Steps

1. **Identify the campaign.** Repurposing almost always targets a campaign
   (KLRtr, AICar, SKYHV). Confirm the ref so the post lands in that
   campaign's voice; if it's unclear, ask.
2. **Gather the source.**
   - Repo file: `Read` it.
   - URL: `WebFetch`. On failure/boilerplate, ask for pasted text.
   - Pasted text: use as-is.
3. **Extract 1-3 concrete, verifiable claims** — the thing the reader
   actually cares about, not a tour of every detail.
4. **Invoke `blog-post`** with those claims + the campaign ref as the brief.
5. **Report** the file path and a one-line summary. Don't emit a second copy
   of the content outside the file `blog-post` wrote.

## Guardrails

- If the source has no useful reader-facing angle, say so instead of padding
  a post out of nothing.
- Never fabricate metrics, dates, offers, or results absent from the source.
  This skill grounds `blog-post`; it doesn't excuse skipping fact-checks.
