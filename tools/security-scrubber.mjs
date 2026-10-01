// tools/security-scrubber.mjs — Adversarial Sanitization, Credential Scrubber & Cryptographic Phase Locker
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Injection marker patterns commonly used in adversarial prompt poisoning
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
  /system\s*:\s*/i,
  /you\s+are\s+now\s+a/i,
  /\bexec\s*\(/i,
  /\beval\s*\(/i,
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
];

// Sensitive token patterns to prevent outbound credential leakage (Axiom 2: Tokenless Core)
const SENSITIVE_TOKEN_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{20,}/g,
  /EAA[a-zA-Z0-9]{30,}/g,
  /ghp_[a-zA-Z0-9]{20,}/g,
  /AIza[a-zA-Z0-9_-]{35}/g
];

// Prohibited terms for Ko Lake Villa (Must never be called resort/estate/hotel)
const PROHIBITED_PROPERTY_TERMS = ['estate', 'resort', 'hotel'];

/**
 * Sanitizes input text from web scraping / DOM crawls.
 * Strips HTML, detects prompt injections, and flags prohibited terms.
 */
export function sanitizeScrapedContent(rawContent) {
  if (typeof rawContent !== 'string') return '';

  let sanitized = rawContent.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      throw new Error(`[Security Alert] Adversarial prompt injection detected: "${pattern}"`);
    }
  }

  return sanitized;
}

/**
 * Checks for prohibited terminology in property description text.
 */
export function assertNoProhibitedTerms(text) {
  if (!text) return true;
  const lower = text.toLowerCase();
  for (const term of PROHIBITED_PROPERTY_TERMS) {
    // Word boundary check
    const regex = new RegExp(`\\b${term}\\b`, 'i');
    if (regex.test(lower)) {
      throw new Error(`[Axiom Violation] Prohibited term detected: "${term}". Ko Lake Villa is a lakeside villa, NEVER a ${term}.`);
    }
  }
  return true;
}

/**
 * Scrubs high-entropy secrets and API tokens from outbound LLM prompt buffers.
 */
export function scrubOutboundPrompt(promptText) {
  if (typeof promptText !== 'string') return '';
  let scrubbed = promptText;
  for (const pattern of SENSITIVE_TOKEN_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, '[REDACTED_SECRET]');
  }
  return scrubbed;
}

/**
 * Computes SHA-256 digest of a file for cryptographic phase handoffs.
 */
export function computeFileDigest(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`File not found for hash calculation: ${resolved}`);
  }
  const content = fs.readFileSync(resolved);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Generates and writes a .sha256 checksum lock file.
 */
export function lockFileDigest(filePath) {
  const digest = computeFileDigest(filePath);
  const lockPath = `${path.resolve(filePath)}.sha256`;
  fs.writeFileSync(lockPath, `${digest}  ${path.basename(filePath)}\n`, 'utf-8');
  return digest;
}

/**
 * Verifies that a file matches its .sha256 lock.
 */
export function verifyFileDigest(filePath) {
  const resolved = path.resolve(filePath);
  const lockPath = `${resolved}.sha256`;
  if (!fs.existsSync(lockPath)) {
    throw new Error(`Integrity lock missing: ${lockPath}`);
  }
  const expected = fs.readFileSync(lockPath, 'utf-8').trim().split(/\s+/)[0];
  const actual = computeFileDigest(resolved);
  if (expected !== actual) {
    throw new Error(`[Integrity Breach] File tampering detected for ${path.basename(filePath)}!\nExpected: ${expected}\nActual:   ${actual}`);
  }
  return true;
}
