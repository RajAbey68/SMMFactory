---
name: seo-brief
description: Produce a short SEO / AI-search brief for a blog post or planned topic using WebSearch. Use when the user asks for keyword ideas, an SEO review, a content-gap check, or "will this rank" for something in content/blog/. A lightweight stand-in when the SEMrush/SE Ranking scan (npm run seo) isn't warranted.
---

# seo-brief skill

Approximates a keyword/gap brief using only `WebSearch` and `WebFetch` —
directionally useful, not a replacement for the repo's real SEO tooling
(`npm run seo` / `npm run semrush`, which hit SEMrush / SE Ranking). Say so
in the output.

## When to use which

- **This skill** — quick angle/keyword/title check while drafting, no API
  budget needed.
- **`npm run seo` / `npm run semrush`** — real search volume, difficulty, and
  competitor data. Point the user there when they need hard numbers.

## Steps

1. **Identify the topic** — an existing `content/blog/*.md` (read its
   frontmatter + body) or a topic the user describes.
2. **Search how people phrase the problem.** Run 2-4 `WebSearch` queries in
   question phrasing ("how do I…", "best way to…"), not internal jargon.
   Note recurring phrases — those are candidate keywords.
3. **Spot-check 2-3 top results** with `WebFetch` for the same query. Note
   what they cover that the draft doesn't — that's the content gap.
4. **Check the on-page basics**: title states the outcome and is <60 chars;
   `description` is one sentence <155 chars stating the payoff; at least one
   `##` heading is phrased like a real query.
5. **Write the brief** (Markdown, not a file unless asked): target keywords,
   1-2 content gaps, and specific title/description fixes if the current ones
   are weak.

## Guardrails

- No invented search volumes or difficulty scores — `WebSearch` doesn't give
  those. Describe findings qualitatively ("this phrasing recurs across top
  results"), and defer to `npm run seo` for real numbers.
- This is a brief, not a rewrite — hand fixes back to `blog-post` or the user.
