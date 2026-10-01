import assert from 'node:assert/strict';
import test from 'node:test';
import { callWindsorTool, listWindsorTools } from '../scripts/windsor-mcp-client.mjs';
import { runAnomalyCheck } from '../scripts/windsor-anomaly-guard.mjs';
import { generateWeeklyDigest } from '../scripts/windsor-weekly-digest.mjs';

test('Windsor.ai MCP tools/list returns standard tool catalogue', async () => {
  const result = await listWindsorTools();
  assert.ok(Array.isArray(result.tools), 'result.tools must be an array');
  const toolNames = result.tools.map(t => t.name);
  assert.ok(toolNames.includes('get_current_user'), 'must contain get_current_user tool');
  assert.ok(toolNames.includes('get_connectors'), 'must contain get_connectors tool');
  assert.ok(toolNames.includes('get_data'), 'must contain get_data tool');
});

test('Windsor.ai MCP get_current_user validates authorized user profile', async () => {
  const result = await callWindsorTool('get_current_user');
  assert.equal(result.isError, false);
  const user = result.structuredContent;
  assert.ok(user.email, 'User email must be present');
  assert.equal(user.is_paid, true, 'User subscription status must be paid/active');
});

test('Windsor Anomaly Guard & Weekly Digest run cleanly without errors', async () => {
  const guard = await runAnomalyCheck();
  assert.ok(['STANDBY', 'COMPLETE'].includes(guard.status));

  const digest = await generateWeeklyDigest();
  assert.ok(digest.includes('KOLAKE VILLA'));
  assert.ok(digest.includes('TOTAL AD INVESTMENT'));
});
