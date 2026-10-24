import fs from 'node:fs';
import path from 'node:path';

// 1. Load Ground Truth (SSOT)
const marketDnaPath = path.resolve('campaigns/ko-lake-retreats/research/market_dna.json');
let verifiedKeywords = new Set([
  "kolake villa",
  "kolake villa ahangama",
  "ko lake villa",
  "ko lake villa ahangama",
  "villa ahangama",
  "villa kabalana",
  "surf stay ahangama",
  "kabalana surf stay",
  "villa galle",
  "large family holiday ahangama",
  "digital nomad ahangama",
  "digital nomad koggala"
]);

if (fs.existsSync(marketDnaPath)) {
  try {
    const marketDna = JSON.parse(fs.readFileSync(marketDnaPath, 'utf8'));
    const sourceKeywords = marketDna.target_keywords || marketDna.hooks || [];
    for (const kw of sourceKeywords) {
      verifiedKeywords.add(kw.toLowerCase().trim());
    }
  } catch (e) {
    // Keep baseline
  }
}

/**
 * Validates generated campaign payloads against Ground Truth
 */
export function verifyGroundedKeywords(targetedKeywords) {
  const keywordsList = Array.isArray(targetedKeywords) 
    ? targetedKeywords 
    : (targetedKeywords?.targeted_keywords || targetedKeywords?.keywords || []);

  const violations = [];
  for (const rawKw of keywordsList) {
    // Strip brackets/quotes for exact/phrase search syntax: [kw] -> kw, "kw" -> kw
    const cleaned = String(rawKw).replace(/[\[\]"]/g, '').toLowerCase().trim();
    if (!verifiedKeywords.has(cleaned)) {
      violations.push({
        keyword: rawKw,
        cleanedKeyword: cleaned,
        reason: "Ungrounded entity: Not present in market_dna.json canonical registry."
      });
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `[Four-Eyes Gate Violation] Hallucinated keywords detected:\n` +
      JSON.stringify(violations, null, 2)
    );
  }
  return true;
}

export function getVerifiedKeywords() {
  return Array.from(verifiedKeywords);
}
