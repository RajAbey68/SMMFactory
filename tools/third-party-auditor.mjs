// tools/third-party-auditor.mjs — Independent Third-Party Drift & Compliance Auditor
// Performs strict, zero-drift verification across:
// 1. Master Property Dictionary invariants (Ko Lake Villa, lakeside villa, $250 buyout / $45 room floor, no "estate")
// 2. Closed-Vocabulary Grounding (no ungrounded speculative phrases)
// 3. Four-Eyes cryptographic signatures (Axiom 1)
// 4. Tokenless Core security (no leaked sk-, EAA, Bearer tokens)

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { assertNoProhibitedTerms, sanitizeScrapedContent, scrubOutboundPrompt } from './security-scrubber.mjs';
import { verifyApprovalRecord } from './approval-signer.mjs';

// Ensure .env is loaded for SMM_FOUR_EYES_SECRET
if (fs.existsSync('.env')) {
  try {
    const envLines = fs.readFileSync('.env', 'utf-8').split('\n');
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch (e) {}
}

export class ThirdPartyAuditor {
  constructor(options = {}) {
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.masterDictPath = path.resolve(this.workspaceRoot, 'MASTER_PROPERTY_DICTIONARY.json');
    this.masterDict = JSON.parse(fs.readFileSync(this.masterDictPath, 'utf-8'));
  }

  /**
   * Scans a file or string for drift against Master Property Dictionary
   */
  auditPropertyDrift(content, contextLabel = '') {
    const findings = [];

    // Check prohibited terminology using security scrubber
    try {
      assertNoProhibitedTerms(content);
    } catch (err) {
      findings.push({
        rule: 'PROHIBITED_TERM',
        severity: 'HIGH',
        message: err.message
      });
    }

    // Check secret / adversarial safety
    try {
      sanitizeScrapedContent(content);
    } catch (err) {
      findings.push({
        rule: 'ADVERSARIAL_SAFETY',
        severity: 'CRITICAL',
        message: err.message
      });
    }

    // Check credential leakage
    const scrubbed = scrubOutboundPrompt(content);
    if (scrubbed !== content) {
      findings.push({
        rule: 'SECURITY_TOKEN_LEAK',
        severity: 'CRITICAL',
        message: `High-entropy credential pattern detected in ${contextLabel}`
      });
    }

    return {
      passed: findings.length === 0,
      context: contextLabel,
      findings_count: findings.length,
      findings
    };
  }

  /**
   * Audits all registered campaigns for governance drift
   */
  auditRegisteredCampaigns() {
    const registryPath = path.resolve(this.workspaceRoot, 'campaigns/registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    const auditResults = {
      timestamp: new Date().toISOString(),
      campaigns_audited: registry.campaigns.length,
      all_passed: true,
      reports: {}
    };

    for (const camp of registry.campaigns) {
      const campReports = [];
      const campDir = path.resolve(this.workspaceRoot, camp.path);

      // Check if approval record exists and verify if in review/launch/optimize
      const approvalFile = path.join(campDir, 'approval_record.json');
      if (fs.existsSync(approvalFile)) {
        try {
          const record = JSON.parse(fs.readFileSync(approvalFile, 'utf-8'));
          verifyApprovalRecord(camp.slug, record.manifest_digest);
        } catch (err) {
          campReports.push({
            rule: 'FOUR_EYES_TAMPER',
            severity: 'CRITICAL',
            message: `Invalid cryptographic signature for ${camp.slug}: ${err.message}`
          });
        }
      }

      // Check creative assets for drift
      const creativeDir = path.join(campDir, 'creative');
      if (fs.existsSync(creativeDir)) {
        const files = fs.readdirSync(creativeDir);
        for (const file of files) {
          const filePath = path.join(creativeDir, file);
          if (fs.statSync(filePath).isFile()) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const drift = this.auditPropertyDrift(content, `${camp.slug}/${file}`);
            if (!drift.passed) {
              campReports.push(...drift.findings);
            }
          }
        }
      }

      const campPassed = campReports.length === 0;
      auditResults.reports[camp.slug] = {
        passed: campPassed,
        findings: campReports
      };

      if (!campPassed) auditResults.all_passed = false;
    }

    return auditResults;
  }
}
