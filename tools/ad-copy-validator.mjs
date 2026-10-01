// tools/ad-copy-validator.mjs — Proof Point & Superlative Compliance Validator for Pomelli & OpenAI Ads
import { assertNoProhibitedTerms } from './security-scrubber.mjs';

// Common subjective superlatives banned by OpenAI Ads and proof-first ad policies
export const BANNED_SUPERLATIVES = [
  'best',
  'amazing',
  'incredible',
  'unmatched',
  'unbeatable',
  'greatest',
  'ultimate',
  'perfect',
  'breathtaking',
  'stunning',
  'luxurious',
  'world-class'
];

/**
 * Validates generated ad copy against verifiable proof requirements and superlative restrictions.
 * @param {object} adCopy
 * @param {string} platform - 'chatgpt' | 'meta' | 'google' | 'tiktok' | 'linkedin'
 * @returns {{ valid: boolean, errors: string[], superlativeCount: number, proofCount: number }}
 */
export function validateAdCopyCompliance(adCopy, platform = 'meta') {
  const errors = [];
  const text = `${adCopy.headline || ''} ${adCopy.body || ''} ${adCopy.card_title || ''} ${adCopy.card_body || ''}`;
  
  if (!text.trim()) {
    return { valid: false, errors: ['Ad copy text is empty'], superlativeCount: 0, proofCount: 0 };
  }

  // 1. Prohibited property terms check (hotel, resort, estate)
  try {
    assertNoProhibitedTerms(text);
  } catch (err) {
    errors.push(err.message);
  }

  // 2. Count and flag banned superlatives
  const lower = text.toLowerCase();
  const foundSuperlatives = [];
  for (const word of BANNED_SUPERLATIVES) {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    if (regex.test(lower)) {
      foundSuperlatives.push(word);
    }
  }

  // OpenAI Ads platform has ZERO tolerance for superlatives
  if (platform === 'chatgpt' || platform === 'openai_ads') {
    if (foundSuperlatives.length > 0) {
      errors.push(`[OpenAI Ads Policy Violation] Zero superlatives allowed in ChatGPT placements. Found: ${foundSuperlatives.join(', ')}`);
    }
  } else {
    if (foundSuperlatives.length > 2) {
      errors.push(`Excessive superlatives (${foundSuperlatives.length}): ${foundSuperlatives.join(', ')}. Keep copy fact-grounded.`);
    }
  }

  // 3. Verifiable proof points check (Must have 2+ points declared and present)
  const proofPoints = adCopy.proof_points || [];
  if (!Array.isArray(proofPoints) || proofPoints.length < 2) {
    errors.push(`Ad copy must declare at least 2 verifiable proof points (found: ${proofPoints.length})`);
  }

  return {
    valid: errors.length === 0,
    errors,
    superlativeCount: foundSuperlatives.length,
    proofCount: proofPoints.length,
    foundSuperlatives
  };
}

/**
 * Validates a ChatGPT Sponsored Recommendation Card
 * @param {object} card
 */
export function validateChatGPTCard(card) {
  const result = validateAdCopyCompliance(card, 'chatgpt');
  if (!result.valid) {
    throw new Error(`ChatGPT Card Validation Failed: ${result.errors.join('; ')}`);
  }
  return result;
}

