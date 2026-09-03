// tools/lead-discovery-agent.mjs — Autonomous Inbound Discovery & Lead Harvesting Agent
// Interconnects BuzzBar relay bus, social monitors (Grok / X), and web signals,
// scoring and routing qualified leads to Asimov-AI, AI-Integ, and Ko Lake Villa.

import fs from 'node:fs';
import path from 'node:path';

export class LeadDiscoveryAgent {
  constructor(config = {}) {
    this.buzzRelay = config.buzzRelay || 'wss://theahg.communities.buzz.xyz';
    this.channels = config.channels || ['#AHG_Forager', '#marketing-kolake', '#General'];
    this.minContractRateGbp = config.minContractRateGbp || 800; // >= £800/day Outside IR35
    this.discoveredLeadsPath = path.resolve('campaigns/discovered_leads.json');
  }

  /**
   * Evaluates raw social / broadcast signal and routes to corresponding venture
   * @param {object} signal - { source: string, channel: string, text: string, author: string, rate_gbp: number }
   */
  processSignal(signal) {
    if (!signal || !signal.text) {
      throw new Error('LeadDiscoveryAgent: signal with text is required');
    }

    const textLower = signal.text.toLowerCase();
    let targetVenture = null;
    let qualificationScore = 0;
    const matchedCriteria = [];

    // 1. Asimov-AI Intent Recognition (Autonomous agents, BMAD, swarms, research)
    if (/multi-agent|agentic|autonomous agent|bmad|llm os|swarm architecture/i.test(textLower)) {
      targetVenture = 'asimov-ai';
      qualificationScore += 40;
      matchedCriteria.push('Autonomous Agent Architecture Intent');
    }

    // 2. AI-Integ Intent Recognition (Enterprise modernization, systems integration, RAG, n8n)
    if (/integration|enterprise ai|legacy migration|rag pipeline|n8n|supabase|workflow automation/i.test(textLower)) {
      targetVenture = 'ai-integ';
      qualificationScore += 40;
      matchedCriteria.push('Enterprise AI Integration Intent');
    }

    // 3. Ko Lake Villa Intent Recognition (Sri Lanka villa, private buyout, lakeside)
    if (/sri lanka|koggala|ahangama|villa buyout|private chef|infinity pool/i.test(textLower)) {
      targetVenture = 'ko-lake-retreats';
      qualificationScore += 40;
      matchedCriteria.push('Boutique Lakeside Villa Intent');
    }

    // Rate / Budget Qualifier (e.g. >= £800/day outside IR35 lead from #AHG_Forager)
    if (signal.rate_gbp && signal.rate_gbp >= this.minContractRateGbp) {
      qualificationScore += 50;
      matchedCriteria.push(`High-Value Contract Rate (£${signal.rate_gbp}/day >= £${this.minContractRateGbp})`);
    } else if (/£[89]\d\d|\boutside ir35\b|\benterprise budget\b/i.test(textLower)) {
      qualificationScore += 40;
      matchedCriteria.push('High-Value Enterprise / Outside IR35 Signal');
    }

    // Urgency Signal
    if (/immediate|urgent|this week|starting soon|q2 launch/i.test(textLower)) {
      qualificationScore += 10;
      matchedCriteria.push('High Urgency');
    }

    const isQualified = qualificationScore >= 50;

    const leadRecord = {
      lead_id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      source: signal.source || 'BuzzBar',
      channel: signal.channel || '#AHG_Forager',
      author: signal.author || 'Anonymous Observer',
      text_snippet: signal.text.substring(0, 140),
      target_venture: targetVenture || 'unassigned',
      qualification_score: qualificationScore,
      is_qualified: isQualified,
      matched_criteria: matchedCriteria,
      recommended_action: isQualified ? `DISPATCH_DIRECT_RESPONSE_TO_${targetVenture.toUpperCase()}` : 'ARCHIVE_LOW_FIT'
    };

    // Append to persistent discovered leads store
    let leads = [];
    if (fs.existsSync(this.discoveredLeadsPath)) {
      try {
        leads = JSON.parse(fs.readFileSync(this.discoveredLeadsPath, 'utf-8'));
      } catch (e) {
        leads = [];
      }
    }
    leads.push(leadRecord);
    fs.writeFileSync(this.discoveredLeadsPath, JSON.stringify(leads, null, 2), 'utf-8');

    return leadRecord;
  }

  /**
   * Returns all qualified leads for a specific venture
   */
  getQualifiedLeads(ventureSlug) {
    if (!fs.existsSync(this.discoveredLeadsPath)) return [];
    try {
      const leads = JSON.parse(fs.readFileSync(this.discoveredLeadsPath, 'utf-8'));
      return leads.filter(l => l.is_qualified && (!ventureSlug || l.target_venture === ventureSlug));
    } catch (e) {
      return [];
    }
  }
}
