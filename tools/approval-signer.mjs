// tools/approval-signer.mjs — Cryptographic Four-Eyes Approval Token Generator & Validator
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Creates a cryptographically signed approval record for a campaign.
 * @param {object} params
 * @param {string} params.campaign
 * @param {string} params.stakeholder - Name/ID of human approver
 * @param {string} params.manifestDigest - SHA-256 of market_dna.json / creative assets
 * @param {string} params.privateKeySecret - Shared HMAC secret or vault secret
 * @returns {object} signedApprovalRecord
 */
export function signApprovalRecord({ campaign, stakeholder, manifestDigest, privateKeySecret = 'smm-four-eyes-vault-secret' }) {
  const timestamp = new Date().toISOString();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  const payloadToSign = `${campaign}:${stakeholder}:${manifestDigest}:${nonce}:${timestamp}`;
  const signature = crypto.createHmac('sha256', privateKeySecret).update(payloadToSign).digest('hex');

  const record = {
    campaign,
    stakeholder,
    status: 'APPROVED',
    manifest_digest: manifestDigest,
    nonce,
    timestamp,
    signature
  };

  const recordPath = path.resolve(`campaigns/${campaign}/approval_record.json`);
  const outDir = path.dirname(recordPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(recordPath, JSON.stringify(record, null, 2), 'utf-8');
  return record;
}

/**
 * Verifies that a valid, untampered approval record exists for a campaign.
 * @param {string} campaign
 * @param {string} manifestDigest
 * @param {string} privateKeySecret
 * @returns {boolean}
 */
export function verifyApprovalRecord(campaign, manifestDigest, privateKeySecret = 'smm-four-eyes-vault-secret') {
  const recordPath = path.resolve(`campaigns/${campaign}/approval_record.json`);
  if (!fs.existsSync(recordPath)) {
    throw new Error(`[Axiom 1 Gate Violation] Missing approval_record.json for campaign "${campaign}". Human stakeholder sign-off is mandatory.`);
  }

  const record = JSON.parse(fs.readFileSync(recordPath, 'utf-8'));
  if (record.status !== 'APPROVED') {
    throw new Error(`[Axiom 1 Gate Violation] Campaign status is "${record.status}". Stakeholder approval required.`);
  }

  if (record.manifest_digest !== manifestDigest) {
    throw new Error(`[Axiom 1 Gate Violation] Manifest digest mismatch! Assets modified after approval.\nApproved: ${record.manifest_digest}\nCurrent:  ${manifestDigest}`);
  }

  const payloadToSign = `${record.campaign}:${record.stakeholder}:${record.manifest_digest}:${record.nonce}:${record.timestamp}`;
  const expectedSignature = crypto.createHmac('sha256', privateKeySecret).update(payloadToSign).digest('hex');

  if (record.signature !== expectedSignature) {
    throw new Error(`[Security Alert] Invalid cryptographic signature on approval record for "${campaign}"! Potential forgery.`);
  }

  return true;
}
