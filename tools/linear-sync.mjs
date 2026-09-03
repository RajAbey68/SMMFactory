// tools/linear-sync.mjs — Linear Lifecycle Phase & Milestone Sync Adapter
// Syncs completed campaign phases directly to Linear (or writes linear_sync_log.json when token is absent)

import fs from 'node:fs';
import path from 'node:path';

export class LinearSyncManager {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.LINEAR_API_KEY || null;
    this.teamKey = config.teamKey || process.env.LINEAR_TEAM_KEY || 'SMM';
    this.isLive = Boolean(this.apiKey && !this.apiKey.startsWith('mock_'));
    this.logPath = path.resolve('campaigns/linear_sync_log.json');
  }

  /**
   * Records completed phase in Linear issue tracker
   * @param {object} params
   * @param {string} params.campaignSlug
   * @param {string} params.phaseId - 'ideation' | 'research' | 'planning' | 'creative' | 'review' | 'launch' | 'optimize' | 'close'
   * @param {string} params.status - 'COMPLETED' | 'IN_PROGRESS'
   * @param {string} params.summary
   * @param {string[]} params.artifacts
   */
  async syncPhaseCompletion({ campaignSlug, phaseId, status = 'COMPLETED', summary = '', artifacts = [] }) {
    if (!campaignSlug || !phaseId) {
      throw new Error('LinearSyncManager: campaignSlug and phaseId are required');
    }

    const record = {
      id: `lin_sync_${Date.now()}`,
      campaign: campaignSlug,
      phase: phaseId,
      team: this.teamKey,
      status,
      summary,
      artifacts,
      synced_at: new Date().toISOString(),
      mode: this.isLive ? 'LIVE_LINEAR_MUTATION' : 'LOCAL_AUDIT_LOG'
    };

    if (this.isLive) {
      // GraphQL mutation to Linear API: https://api.linear.app/graphql
      try {
        const query = `
          mutation IssueCreate($input: IssueCreateInput!) {
            issueCreate(input: $input) {
              success
              issue { id identifier title url }
            }
          }
        `;
        const res = await fetch('https://api.linear.app/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': this.apiKey
          },
          body: JSON.stringify({
            query,
            variables: {
              input: {
                title: `[${campaignSlug.toUpperCase()}] Phase Completed: ${phaseId}`,
                description: `${summary}\n\nArtifacts:\n${artifacts.map(a => `- ${a}`).join('\n')}`,
                teamId: this.teamKey
              }
            }
          })
        });
        const data = await res.json();
        record.linear_issue = data.data?.issueCreate?.issue;
      } catch (err) {
        record.error = err.message;
      }
    }

    // Always maintain persistent ledger
    let history = [];
    if (fs.existsSync(this.logPath)) {
      try {
        history = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
      } catch (e) {
        history = [];
      }
    }
    history.push(record);
    fs.writeFileSync(this.logPath, JSON.stringify(history, null, 2), 'utf8');

    return record;
  }

  getSyncHistory(campaignSlug = null) {
    if (!fs.existsSync(this.logPath)) return [];
    try {
      const history = JSON.parse(fs.readFileSync(this.logPath, 'utf8'));
      return campaignSlug ? history.filter(h => h.campaign === campaignSlug) : history;
    } catch (e) {
      return [];
    }
  }
}
