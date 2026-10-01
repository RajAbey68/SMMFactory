# SMMFactory — Work Order for Antigravity (Phase 1 hardening)

Issued: 3 September 2026
Assessor: Claude (Cowork session), acting as overarching reviewer
HITL: Raj
Source review: `docs/CODE_REVIEW_2026-09-03.md`
Tickets: Linear RAJ-919 (epic) → RAJ-920 … RAJ-925 (WO-1 … WO-6)

## Who does what

Antigravity implements. Claude assesses. Raj rotates credentials and merges. Nobody else merges.

The Linear tickets are the single source of truth for scope. If the ticket and this file disagree, the ticket wins. If the ticket and the review disagree, stop and ask on the ticket.

## Order

WO-1 (secrets) is blocked until Raj comments "rotated" on RAJ-920. Do not touch it before then.
WO-2, WO-3, WO-4 can run in parallel, each on its own branch.
WO-5 runs after WO-2..4 merge (its acceptance depends on their tests).
WO-6 runs last.

## Loop for every ticket

1. `git checkout main && git pull`, then `git checkout -b wo/<RAJ-id>-<slug>`.
2. Move the Linear ticket to In Progress.
3. Implement only what the ticket's "Do" list says. Anything extra becomes a new ticket, filed under RAJ-919, not folded into this branch.
4. Run every command in the ticket's "Acceptance" list yourself. Paste the actual output (not a summary) into the completion comment.
5. `npm test` and `bash scripts/quality-gate.sh` before pushing. If they fail for reasons outside the ticket, say so in the comment; do not "fix" unrelated things.
6. Push. Open a PR against `main` titled `<RAJ-id> <ticket title>`. PR body: what changed, why, the acceptance output, what you could not do.
7. Comment on the Linear ticket: PR link + the same summary. Move the ticket to In Review.
8. Wait. Do not merge. Do not start the next ticket on the same branch.
9. The assessor comments `PASS` or `FAIL: <reasons>`. On FAIL, fix on the same branch, push, comment again.

## Hard rules

- Never print, log, echo, or commit a secret value. Variable names only. If you see a value in a file you are editing, delete it, do not quote it anywhere.
- Never call a live ad platform, Telegram, Twilio, Windsor, Linear's write API, or the Buzz relay from a test or from a script run during this work. Dry-run only.
- Never use `--emergency-bypass`. It is being deleted.
- Never rewrite git history. Rotation makes old values dead; history rewriting is Raj's decision, separately.
- Never edit `docs/CODE_REVIEW_2026-09-03.md` or this file.
- No work on `main`.

## Talking to the bus (ESB)

Buzz (`wss://theahg.communities.buzz.xyz`) is the bus. Linear is the HITL ticket board. They are not the same thing.

For this phase, Linear is the only channel you need: every handoff is a ticket comment. The assessor reads Linear directly.

If you also have a working `buzz` CLI on this machine (`~/.local/bin/buzz`, or the stdio MCP at `~/.buzz/REPOS/buzz-mcp`), post a one-line status to `#smmfactory` at each state change, in this shape:

```
[SMMF] RAJ-921 in-review — PR #<n> — wo/RAJ-921-approval-gate
```

Use the CLI as it exists. Do not write a new WebSocket client, do not send raw Nostr events, do not create or use any key. If the CLI is not set up, skip the Buzz post; the Linear comment is the record.

Do not use `.agent-bus.json` or `scripts/register-buzz-bot.mjs` to reach the bus — the review found they do not speak the relay's protocol.

## Definition of Done for the phase

All six tickets merged to `main` with a PASS comment from the assessor on each, `npm test` green offline with a clean `git status` afterwards, GitHub Actions green, and Raj's four rotated credentials never appearing in the tree.
