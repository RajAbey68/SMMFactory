# MCP Credential & Architecture Guide: Linear & Postgres / Supabase

> **Date:** September 4, 2026  
> **Audience:** Core Engineering, Hermes Agents, Antigravity IDE Users  
> **Status:** Reference Architecture & Troubleshooting Runbook  

---

## Executive Summary

When setting up or troubleshooting MCP servers across environments (Antigravity IDE, Claude Code, Cursor, Hermes Agent), differences in transport protocols and credential storage mechanisms can cause authentication errors even when "everything else connects".

This guide documents the root cause and resolution for **Linear MCP** and **Postgres / Supabase MCP**.

---

## 1. Linear MCP

### Why It Failed in Antigravity IDE
* **Antigravity Config (`~/.gemini/config/mcp_config.json`):**
  Antigravity runs the npm package `@mseep/linear-mcp` via `stdio`, expecting a static Personal API key via the `LINEAR_API_KEY` environment variable:
  ```json
  "linear": {
    "command": "npx",
    "args": ["-y", "@mseep/linear-mcp"],
    "env": {
      "LINEAR_API_KEY": "${LINEAR_API_KEY}"
    }
  }
  ```
  Because `${LINEAR_API_KEY}` was not set in the shell session launching Antigravity, the process ran with an empty string and returned `401 Authentication Required`.

### Where the Working Credentials Actually Live
* **Hermes Agent (`~/.hermes/config.yaml`):**
  Hermes connects directly to Linear's official remote HTTP MCP endpoint:
  ```yaml
  linear:
    url: https://mcp.linear.app/mcp
    auth: oauth
    enabled: true
  ```
* The OAuth tokens are stored in:
  - **Path:** `~/.hermes/mcp-tokens/linear.json`
  - **Token Endpoint:** `https://mcp.linear.app/token`
  - **Client ID:** `DeapIdwDFdQXWAVO` (Hermes Agent)

### How to Resolve for All Tools
* **Option A (Recommended for Static IDEs / Antigravity / Claude Code):**
  Generate a persistent Personal API Key:
  1. Open [Linear Settings -> Security & Access -> Personal API Keys](https://linear.app/settings/api).
  2. Create a key named `Antigravity-MCP` (starts with `lin_api_...`).
  3. Set `LINEAR_API_KEY` directly in `~/.gemini/config/mcp_config.json`:
     ```json
     "env": {
       "LINEAR_API_KEY": "lin_api_xxxxxxxxxxxxxxxxxxxxxxxx"
     }
     ```
* **Option B (For OAuth-capable agents like Hermes):**
  Use the remote endpoint `https://mcp.linear.app/mcp` with automatic token refresh via `~/.hermes/mcp-tokens/linear.json`.

---

## 2. Postgres / Supabase MCP

### Why It Failed
* **Antigravity Config (`~/.gemini/config/mcp_config.json`):**
  Uses the official `@modelcontextprotocol/server-postgres` package:
  ```json
  "postgres-supabase": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-postgres",
      "postgresql://postgres:postgres@db.pomgvxdokjmxyfbgazls.supabase.co:5432/postgres"
    ]
  }
  ```
* **The Root Cause:**
  The connection URI was using the default placeholder password (`postgres:postgres@...`).
  Postgres immediately rejected the handshake:
  ```
  calling "tools/call": password authentication failed for user "postgres"
  ```

### What Is Stored vs. What Is NOT Stored

| Credential Type | Location | What It Can Do | Can It Connect to Postgres Port 5432? |
| :--- | :--- | :--- | :--- |
| **Supabase CLI Management Token** | macOS Keychain (`Supabase CLI` -> `sbp_502fe26448...`) | List projects, manage infra, fetch JWT API keys | **No** (Supabase does not expose the database user password via API) |
| **Supabase API Keys (Anon / Service Role)** | `.env.local` / Server config | HTTP REST & GraphQL queries via PostgREST | **No** (Direct Postgres TCP port 5432 requires the master DB password) |
| **PostgreSQL Database Password** | User Password Manager / Supabase Vault | Direct connection to PostgreSQL database | **Yes** (Required by `@modelcontextprotocol/server-postgres`) |

### How to Resolve
1. Retrieve or reset the database password in the Supabase Dashboard:
   - Go to [Supabase Project Database Settings (`pomgvxdokjmxyfbgazls`)](https://supabase.com/dashboard/project/pomgvxdokjmxyfbgazls/settings/database).
   - Under **Database password**, click **Reset database password** if unknown.
2. Update the URI in `~/.gemini/config/mcp_config.json`:
   ```json
   "postgresql://postgres:<YOUR_REAL_DB_PASSWORD>@db.pomgvxdokjmxyfbgazls.supabase.co:5432/postgres"
   ```
   *(Note: For Supabase IPv4 / connection pooling support, port 6543 with pooler mode can also be used if on restricted networks).*

---

## Quick Reference: Active Working MCP Endpoints

* **Windsor.ai:** 🟢 `~/.local/bin/windsor-mcp-bridge` (Key: active in `mcp_config.json`)
* **SQLite:** 🟢 `gravity-claw.db` (`@mokei/mcp-sqlite`)
* **GitHub:** 🟢 `@modelcontextprotocol/server-github` (Personal token active)
* **Obsidian Vault:** 🟢 `@modelcontextprotocol/server-filesystem` (`/Users/rajabey/Documents/Obsidian Vault`)
* **Linear:** 🔴 Needs static `lin_api_...` key in `mcp_config.json` OR OAuth refresh
* **Postgres / Supabase:** 🔴 Needs database user password in `mcp_config.json`
