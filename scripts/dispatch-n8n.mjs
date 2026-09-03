#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   Dispatch Reverse Auction Payload to n8n Runtime
   ═══════════════════════════════════════════════════════════ */

import { readFileSync, existsSync } from 'fs';
import http from 'http';

const PAYLOAD_PATH = 'campaigns/ko-lake-reverse-auction/n8n_deploy_payload.json';
const TARGET_URL = process.env.HERMES_N8N_URL || 'http://127.0.0.1:5679/webhook/kolake-marketing';

if (!existsSync(PAYLOAD_PATH)) {
  console.error(`❌ Payload missing at ${PAYLOAD_PATH}`);
  process.exit(1);
}

const payload = readFileSync(PAYLOAD_PATH, 'utf-8');
const urlObj = new URL(TARGET_URL);

console.log(`🚀 Dispatching Reverse Auction payload to n8n (${TARGET_URL})...`);

const req = http.request({
  hostname: urlObj.hostname,
  port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
  path: urlObj.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      console.log(`✅ Dispatched successfully to Hermes-Dev! Status: ${res.statusCode}`);
      console.log(`📡 Response: ${body}`);
    } else {
      console.log(`⚠️ n8n responded with status ${res.statusCode}: ${body}`);
    }
  });
});

req.on('error', (err) => {
  console.error(`❌ Error connecting to n8n: ${err.message}`);
});

req.write(payload);
req.end();
