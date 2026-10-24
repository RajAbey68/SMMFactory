# 🔌 WhatHappen MCP Architecture & Integration Guide (v2.0)

> **Classification:** Engineering & Forensic Integration Reference  
> **Host Environment:** Hermes-Dev (`167.233.236.178`) via Local Loopback (`http://127.0.0.1:3000`)  
> **Last Verified:** September 6, 2026 (Commit `8a6eaee`)  
> **Local Script:** `/Users/rajabey/code/WhatHappen/scripts/whathappen-mcp.mjs`

---

## 1. Executive Summary & Security Invariants

The **WhatHappen Model Context Protocol (MCP)** server connects external AI clients (Claude Desktop, Cursor, Windsurf) to decrypted, authentic WhatsApp records.

### Mandatory Operational & Security Invariants:
1. **Strict Loopback Binding:** The MCP server **halts execution** if pointed to any host other than `127.0.0.1` or `localhost`. Public IP routing over plain HTTP is forbidden. Remote Hermes access requires an SSH local forward (`ssh -f -N -L 3000:127.0.0.1:3000 root@167.233.236.178`).
2. **Deterministic Data Path (Zero LLM Hallucination):** Search and financial extraction execute regex and keyword parsers directly over the 11,441 decrypted records in local client memory. No intermediary model summarizes or filters the data.
3. **Strict 100KB Payload Cap:** Output is capped at whole message boundaries under 100,000 UTF-8 bytes to guarantee Claude's context window is never blown.
4. **Context-Safe Metadata:** Metadata queries return a lightweight ~1.5KB summary instead of the raw 229KB histogram dump.

---

## 2. Infrastructure Setup & Port Forward

Ensure the local loopback forward to Hermes is running:
```bash
ssh -f -N -L 3000:127.0.0.1:3000 -o ExitOnForwardFailure=yes root@167.233.236.178
```

Verify connection:
```bash
curl -s http://127.0.0.1:3000/api/projects
```

---

## 3. Client Configuration (`claude_desktop_config.json` & `mcp.json`)

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` or `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "whathappen": {
      "command": "node",
      "args": [
        "/Users/rajabey/code/WhatHappen/scripts/whathappen-mcp.mjs"
      ],
      "env": {
        "WHATHAPPEN_API_URL": "http://127.0.0.1:3000",
        "WHATHAPPEN_PROJECT_ID": "7ba94f4c-fb4e-4ee4-bc90-19984c5a8b59",
        "WHATSAPP_PASSPHRASE_HASH": "74fdebb706158a201a3dcbc3e6a2593dafa51cbbcb889c72952ec2dbc1312b14"
      }
    }
  }
}
```

---

## 4. Exposed Forensic Tools

| Tool | Description | Key Parameters |
| :--- | :--- | :--- |
| `whathappen_search_chat` | Deterministic keyword and regex search returning exact quotes with dates and senders. Matches tokens in any order. | `query` (string, required)<br>`sender` (string, optional)<br>`month` (string, optional)<br>`limit` (number, default 20, max 100) |
| `whathappen_extract_financials` | Regex and ledger extraction for bank transfers, petty cash floats, fees, advances, and currency amounts. | `keywords` (string, optional override)<br>`month` (string, optional)<br>`sender` (string, optional)<br>`limit` (number, default 30, max 100) |
| `whathappen_get_timeline` | Chronological slice of messages across date boundaries. | `month` (string, required)<br>`sender` (string, optional)<br>`limit` (number, default 50, max 100) |
| `whathappen_get_metadata` | Lightweight ~1.5KB overview: message count, participant roster, date range, and executive insights. | `full` (boolean, default false) |

---

## 5. Proven Forensic Evidence (Sample Recoveries)

- **Channa 100,000 Fee Bundled into Float:**
  > `[2026-07-31T06:44:10.000Z] Rajiv: "Total is 175,000. 100,000 your fees. Rest KLV spends and petty cash float."`
- **Chandi Salary Confirmation:**
  > `[2026-04-30T16:12:50.000Z] Chandi KoLake Food&Bev Chef: "Good evening sir, I just finished work and got my salary. Thank you so much 🙏"`
- **May Float Allocation & Incidental Inquiry:**
  > `[2026-05-31T10:09:44.000Z] Rajiv: "@Channa STC This looks like about 20,000 in incidentals as opposed to the monthly service Who authorized this? This is what I want to know"`  
  > `[2026-06-01T18:14:10.000Z] Rajiv: "Fees are in your bank - please confirm"`
