// tools/market-dna-schema.mjs — Market DNA Schema Validator & Canonical Extractor
import fs from 'node:fs';
import path from 'node:path';

export const REQUIRED_MARKET_DNA_FIELDS = [
  'property',
  'brand',
  'pricing',
  'usps',
  'hooks'
];

/**
 * Validates a Market DNA object against strict structural and brand schema requirements.
 * @param {object} dna 
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateMarketDna(dna) {
  const errors = [];

  if (!dna || typeof dna !== 'object') {
    return { valid: false, errors: ['Market DNA must be a non-null object'] };
  }

  for (const field of REQUIRED_MARKET_DNA_FIELDS) {
    if (!dna[field]) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Validate Brand Colors
  if (dna.brand) {
    if (!dna.brand.colors || typeof dna.brand.colors !== 'object') {
      errors.push('brand.colors must be an object with color definitions');
    } else {
      const hexRegex = /^#([0-9A-F]{3}){1,2}$/i;
      for (const [key, hex] of Object.entries(dna.brand.colors)) {
        if (!hexRegex.test(hex)) {
          errors.push(`Invalid hex color in brand.colors.${key}: "${hex}"`);
        }
      }
    }
  }

  // Validate Pricing Structure & Axioms (Axiom 3: Perishable Yield Law)
  if (dna.pricing) {
    if (!dna.pricing.currency) {
      errors.push('pricing must specify a currency (e.g., USD)');
    }
    // Hard floor check: room rate floor ($45) and whole villa floor ($180)
    if (typeof dna.pricing.rooms_starting_floor === 'number' && dna.pricing.rooms_starting_floor < 45) {
      errors.push(`[Axiom 3 Breach] Single room floor cannot be below $45 (got $${dna.pricing.rooms_starting_floor})`);
    }
    if (typeof dna.pricing.entire_villa_starting_floor === 'number' && dna.pricing.entire_villa_starting_floor < 180) {
      errors.push(`[Axiom 3 Breach] Entire villa floor cannot be below $180 (got $${dna.pricing.entire_villa_starting_floor})`);
    }
  }

  // Validate USPs and Hooks (Minimum 3 required for multi-variant generation)
  if (!Array.isArray(dna.usps) || dna.usps.length < 3) {
    errors.push('usps must be an array with at least 3 verifiable USPs');
  }

  if (!Array.isArray(dna.hooks) || dna.hooks.length < 3) {
    errors.push('hooks must be an array with at least 3 hook variations');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Loads and validates a market DNA JSON file from disk.
 * @param {string} filePath 
 */
export function loadMarketDna(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Market DNA file not found: ${resolved}`);
  }
  const raw = fs.readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(raw);
  const validation = validateMarketDna(parsed);
  if (!validation.valid) {
    throw new Error(`Market DNA schema validation failed:\n${validation.errors.join('\n')}`);
  }
  return parsed;
}
