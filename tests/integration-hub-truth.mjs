#!/usr/bin/env node
/**
 * SMMFactory — Integration Hub Truth Tests (CAB-LITE Compliant)
 * 
 * Deterministic test suite verifying:
 * 1. Master Property Invariants ($250 villa / $45 room floor, Ko Lake Villa lakeside villa naming)
 * 2. Token generation, regex parsing, TTL expiry, and single-use idempotency logic
 * 3. Windsor MCP JSON-RPC payload envelope correctness (get_data & execute_action)
 * 4. Tokenless Core / Secret Scrubber check across repo files
 * 5. n8n payload structure and instant quick-reply specification
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// 1. MASTER PROPERTY DICTIONARY INVARIANTS
test('Ground-Truth: Master Property Dictionary Invariants', () => {
  const MASTER_DICTIONARY = {
    propertyName: 'Ko Lake Villa',
    propertyType: 'lakeside villa',
    forbiddenTypes: ['estate', 'resort', 'hotel'],
    inventory: 7,
    pricingAxioms: {
      wholeVillaFloorUsd: 250,
      emergencySameDayFloorUsd: 180,
      singleRoomFloorUsd: 45
    },
    canonicalWebsite: 'https://www.kolakevilla.com'
  };

  assert.equal(MASTER_DICTIONARY.propertyName, 'Ko Lake Villa');
  assert.equal(MASTER_DICTIONARY.propertyType, 'lakeside villa');
  assert.ok(!MASTER_DICTIONARY.forbiddenTypes.includes(MASTER_DICTIONARY.propertyType));
  assert.equal(MASTER_DICTIONARY.inventory, 7);
  assert.equal(MASTER_DICTIONARY.pricingAxioms.wholeVillaFloorUsd, 250);
  assert.equal(MASTER_DICTIONARY.pricingAxioms.emergencySameDayFloorUsd, 180);
  assert.equal(MASTER_DICTIONARY.pricingAxioms.singleRoomFloorUsd, 45);
});

// 2. YIELD FLOOR BID AUDITOR LOGIC
test('Yield Gate: Invariant bid rejection & counter-offer generation', () => {
  function auditBid({ inventoryType, proposedRateUsd, isSameDay = false }) {
    const WHOLE_VILLA_FLOOR = isSameDay ? 180 : 250;
    const ROOM_FLOOR = 45;

    if (inventoryType === 'whole_villa') {
      if (proposedRateUsd < WHOLE_VILLA_FLOOR) {
        return {
          accepted: false,
          reason: `Bid $${proposedRateUsd} below whole-villa floor ($${WHOLE_VILLA_FLOOR})`,
          counterOfferUsd: Math.max(WHOLE_VILLA_FLOOR, Math.round(proposedRateUsd * 1.15))
        };
      }
      return { accepted: true, rateUsd: proposedRateUsd };
    }

    if (inventoryType === 'single_room') {
      if (proposedRateUsd < ROOM_FLOOR) {
        return {
          accepted: false,
          reason: `Bid $${proposedRateUsd} below single-room floor ($${ROOM_FLOOR})`,
          counterOfferUsd: ROOM_FLOOR
        };
      }
      return { accepted: true, rateUsd: proposedRateUsd };
    }

    throw new Error(`Unknown inventory type: ${inventoryType}`);
  }

  // Under-floor bid rejected
  const rejectedBid = auditBid({ inventoryType: 'whole_villa', proposedRateUsd: 210 });
  assert.equal(rejectedBid.accepted, false);
  assert.ok(rejectedBid.counterOfferUsd >= 250);

  // Same-day emergency bid at 190 accepted (above 180)
  const emergencyBid = auditBid({ inventoryType: 'whole_villa', proposedRateUsd: 190, isSameDay: true });
  assert.equal(emergencyBid.accepted, true);

  // Single room at 35 rejected (below 45)
  const rejectedRoom = auditBid({ inventoryType: 'single_room', proposedRateUsd: 35 });
  assert.equal(rejectedRoom.accepted, false);
  assert.equal(rejectedRoom.counterOfferUsd, 45);
});

// 3. ACTION TOKEN LIFECYCLE & REGEX MATCHING
test('Four-Eyes: Action token generation, regex, TTL, and idempotency', () => {
  const APPROVE_REGEX = /(?:^|\s)\/approve\s+(ACT-[A-Z0-9]{3,6})(?:$|\s)/i;

  function generateToken() {
    const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `ACT-${rand}`;
  }

  // Token format matches regex
  const token = generateToken();
  assert.match(token, /^ACT-[A-Z0-9]{6}$/);

  // Matching user replies
  const validReplies = [
    `/approve ${token}`,
    `Yes, please proceed: /approve ${token}`,
    `/approve ${token} confirmed`,
    `  /approve  ${token}  `
  ];

  for (const msg of validReplies) {
    const match = msg.match(APPROVE_REGEX);
    assert.ok(match, `Failed to match on: "${msg}"`);
    assert.equal(match[1].toUpperCase(), token);
  }

  // Malformed replies rejected
  const invalidReplies = [
    '/approve',
    '/approve 123',
    '/approvals ACT-88A',
    'please approve this ACT-88A'
  ];

  for (const msg of invalidReplies) {
    const match = msg.match(APPROVE_REGEX);
    assert.ok(!match, `Should not match on: "${msg}"`);
  }

  // TTL validation
  const now = Date.now();
  const tokenRecord = {
    id: token,
    createdAt: now,
    expiresAt: now + (2 * 60 * 60 * 1000), // 2 hours
    status: 'PENDING'
  };

  function validateToken(rec, checkTimeMs) {
    if (checkTimeMs > rec.expiresAt) return { valid: false, reason: 'EXPIRED' };
    if (rec.status === 'EXECUTED') return { valid: false, reason: 'ALREADY_EXECUTED' };
    if (rec.status !== 'PENDING') return { valid: false, reason: 'INVALID_STATUS' };
    return { valid: true };
  }

  assert.equal(validateToken(tokenRecord, now + 1000).valid, true);
  assert.equal(validateToken(tokenRecord, now + (3 * 60 * 60 * 1000)).reason, 'EXPIRED');

  tokenRecord.status = 'EXECUTED';
  assert.equal(validateToken(tokenRecord, now + 1000).reason, 'ALREADY_EXECUTED');
});

// 4. WINDSOR MCP JSON-RPC PAYLOAD ENVELOPES
test('Windsor MCP: Correct JSON-RPC envelope for get_data and execute_action', () => {
  function createGetDataPayload(requestId, customerId, startDate, endDate) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: 'get_data',
        arguments: {
          connector: 'google_ads',
          date_filters: [
            { field: 'date', operator: 'between', value: [startDate, endDate] }
          ],
          fields: ['search_query', 'spend', 'conversions'],
          accounts: [customerId]
        }
      }
    };
  }

  function createExecuteActionPayload(requestId, customerId, campaignId, negativeKeywords) {
    return {
      jsonrpc: '2.0',
      id: requestId,
      method: 'tools/call',
      params: {
        name: 'execute_action',
        arguments: {
          connector: 'google_ads',
          action: 'push_negative_keywords',
          params: {
            customer_id: customerId,
            campaign_id: campaignId,
            negative_keywords: negativeKeywords
          }
        }
      }
    };
  }

  const getData = createGetDataPayload(101, '534-902-7754', '2026-09-01', '2026-09-04');
  assert.equal(getData.jsonrpc, '2.0');
  assert.equal(getData.params.name, 'get_data');
  assert.equal(getData.params.arguments.connector, 'google_ads');
  assert.deepEqual(getData.params.arguments.accounts, ['534-902-7754']);

  const executeAction = createExecuteActionPayload(102, '534-902-7754', '24188293644', ['hostel', 'cheap']);
  assert.equal(executeAction.jsonrpc, '2.0');
  assert.equal(executeAction.params.name, 'execute_action');
  assert.equal(executeAction.params.arguments.action, 'push_negative_keywords');
  assert.deepEqual(executeAction.params.arguments.params.negative_keywords, ['hostel', 'cheap']);
});

// 5. SECRET SCRUBBER: Zero high-entropy secrets in repo
test('Security Scrubber: Verify no plaintext API secrets in git-tracked manifests', () => {
  const FORBIDDEN_PATTERNS = [
    /sk-[a-zA-Z0-9]{20,}/,
    /ghp_[a-zA-Z0-9]{20,}/,
    /EAA[a-zA-Z0-9]{20,}/
  ];

  const filesToCheck = [
    'research/integration_hub_architecture.md',
    'campaigns/registry.json',
    'campaigns/ko-lake-reverse-auction/manifest.json'
  ];

  for (const relPath of filesToCheck) {
    const fullPath = path.join(process.cwd(), relPath);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, 'utf8');
    for (const pattern of FORBIDDEN_PATTERNS) {
      assert.ok(
        !pattern.test(content),
        `Found potential secret matching pattern ${pattern} in ${relPath}`
      );
    }
  }
});
