#!/usr/bin/env bash
set -euo pipefail

HERMES_HOST="root@167.233.236.178"
echo "=== 1. Checking buzz-bar service health on Hermes-Dev ==="
ssh -o StrictHostKeyChecking=no "$HERMES_HOST" "curl -s http://127.0.0.1:7070/health"
echo -e "\n"

echo "=== 2. Checking Docker n8n container route to buzz-bar ==="
ssh -o StrictHostKeyChecking=no "$HERMES_HOST" "docker exec n8n node -e \"fetch('http://172.17.0.1:7070/health').then(r=>r.json()).then(console.log).catch(console.error)\""
echo -e "\n"

echo "=== 3. Testing live n8n webhook latency & instant response ==="
ssh -o StrictHostKeyChecking=no "$HERMES_HOST" "curl -s -w '\nHTTP_STATUS: %{http_code} | TIME_TOTAL: %{time_total}s\n' -X POST http://127.0.0.1:5678/webhook/kolake-marketing -H 'Content-Type: application/json' -d '{\"event\":\"PROBE_HEALTH_TEST\"}'"

echo '=== 4. Emitting Agent Session Handshake to BuzzBar ==='
node /Users/rajabey/.buzz/bin/register-buzz-session.mjs
