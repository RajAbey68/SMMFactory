# Architecture Contract: Lean Integration Hub for Ko Lake Villa & SMMFactory

> **Standard:** CAB-LITE Hardened & Tokenless Core Architecture  
> **Host Environment:** `Hermes-Dev` (`root@167.233.236.178`)  
> **Relay Coordination:** `wss://theahg.communities.buzz.xyz` (`#marketing-kolake`, `#KoLake Auction`)  

---

## 1. Executive Summary & SaaS Rationalization

To eliminate SaaS sprawl and unsustainable recurring software costs while maintaining autonomous AI agent operations, Ko Lake Villa and SMMFactory consolidate their integration surface into a lean, self-hosted architecture:

| Tool / Layer | Previous Proposal / Status | Rationalized Decision | Cost Impact |
|---|---|---|---|
| **ETL & Ad Telemetry** | Windsor.ai Standard (~$99/mo) | **Windsor.ai Basic ($19/mo annual)** | Saves ~$960/year. Retains full Read (`get_data`) & Write (`execute_action`) API access across Google Ads & Meta. |
| **Channel Manager (OTAs)** | Channex ($130/mo base + $7/property) | **KILLED.** Single-property villa anchored to **Hostaway** native channel manager with `nextstay` in shadow mode. | Saves ~$1,644/year. Avoids multi-property hotel software bloat. |
| **Workflow Automation** | Make.com / Zapier ($29–$50/mo) | **Self-Hosted n8n** on Hermes-Dev (`:5678`). | Free ($0 recurring). |
| **Communication & Coordination** | Slack / Custom Webhook Loops | **BuzzBar Nostr Service Bus** (`:7070` wss://). | Free ($0 recurring). Real-time agent collaboration and human `/approve` gateway. |

---

## 2. Ingress & Inter-Service Network Topology

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HERMES-DEV INFRASTRUCTURE                             │
├───────────────────────────────┬─────────────────────────────────────────────┤
│ Ingress Layer                 │ Agentic & Coordination Layer                │
│ (Docker Container :5678)      │ (Host PM2 Process :7070)                    │
│                               │                                             │
│ ┌───────────────────────────┐ │ ┌─────────────────────────────────────────┐ │
│ │ n8n Webhook Gateway       │ │ │ BuzzBar Service Bus                     │ │
│ │ /webhook/kolake-marketing │ │ │ • Ed25519 Nostr Bridge                  │ │
│ │                           │ │ │ • ActionTokenStore (SQLite persistence) │ │
│ │ 1. Instant HTTP 200 (<200ms│ │ │ • GrokBuzzAgent (Ad & Yield Auditor)    │ │
│ │ 2. Non-blocking dispatch  │ │ │                                         │ │
│ └─────────────┬─────────────┘ │ └───────────────────▲─────────────────────┘ │
│               │               │                     │                       │
│               └───────────────┼─────────────────────┘                       │
│             POST http://172.17.0.1:7070/api/buzz/send                       │
└───────────────────────────────┴─────────────────────────────────────────────┘
                                        │
                         wss://theahg.communities.buzz.xyz
                                        │
                ┌───────────────────────┴───────────────────────┐
                ▼                                               ▼
     #marketing-kolake                                   #KoLake Auction
  (Ad Surveillance & Alerts)                          (Reverse Auction Bids)
                │                                               │
                └───────────────────────┬───────────────────────┘
                                        │
                        Human Stakeholder (@raj)
                          /approve ACT-XXX
```

---

## 3. Core Invariants (CAB-LITE & Ground-Truth)

### Invariant 1: Master Property Dictionary
- **Property Name:** **Ko Lake Villa** (lakeside villa — **never** an "estate", "resort", or "hotel").
- **Inventory (7 Total):** 7 AC En-Suite Bedrooms (including 2 family suites sleeping 5–6, triple rooms, and double rooms).
- **Canonical Website:** `https://www.kolakevilla.com`
- **Closing CTA:**
  > *"For more information about our unique accommodations and to explore the amenities of Ko Lake Villa, please visit our website at www.kolakevilla.com. Book your stay today and experience the tranquility of lakeside living!"*

### Invariant 2: Perishable Yield Law (Price Floors)
- **Whole Villa Buyout Floor:** Starting at **$250 / night** (strict minimum).
- **Same-Day Emergency Buyout Floor:** **$180 / night** (operational cash-flow floor).
- **Last-Minute Individual Rooms:** From **$45 / night**.
- **Violation Policy:** Any automated bid acceptance below these thresholds is programmatically rejected by `GrokBuzzAgent`.

### Invariant 3: Tokenless Core & Cryptographic Four-Eyes Sign-Off
- No platform mutations (status changes, budget adjustments, negative keyword additions) execute automatically.
- GrokBot generates an action token: `/^ACT-[A-Z0-9]{3,6}$/i` with a 2-hour TTL.
- Mutations execute only upon receiving an authentic `/approve <token>` reply on the designated Buzz channel.
- Zero plaintext API tokens are stored in source control.
