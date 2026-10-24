/**
 * Windsor.ai MCP Client
 * Standard JSON-RPC / SSE client interface for Windsor.ai MCP Server (https://mcp.windsor.ai/)
 */

export const WINDSOR_KEY = process.env.WINDSOR_API_KEY || null;
export const WINDSOR_MCP_URL = 'https://mcp.windsor.ai/';

/**
 * Call a remote MCP tool on Windsor.ai
 * @param {string} toolName - Tool name (e.g., 'get_current_user', 'get_connectors', 'get_data')
 * @param {object} args - Tool arguments
 * @returns {Promise<any>}
 */
export async function callWindsorTool(toolName, args = {}) {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/call',
    params: {
      name: toolName,
      arguments: args
    }
  };

  const response = await fetch(WINDSOR_MCP_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WINDSOR_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Windsor MCP HTTP Error: ${response.status} ${response.statusText}`);
  }

  const rawText = await response.text();
  return parseMcpResponse(rawText);
}

/**
 * List available tools from Windsor.ai MCP
 */
export async function listWindsorTools() {
  const payload = {
    jsonrpc: '2.0',
    id: Date.now(),
    method: 'tools/list'
  };

  const response = await fetch(WINDSOR_MCP_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WINDSOR_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Windsor MCP HTTP Error: ${response.status} ${response.statusText}`);
  }

  const rawText = await response.text();
  return parseMcpResponse(rawText);
}

/**
 * Parse standard MCP SSE or JSON response
 */
function parseMcpResponse(rawText) {
  // If response is SSE formatted (event: message \n data: {...})
  const lines = rawText.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const json = JSON.parse(line.slice(6));
      if (json.error) {
        throw new Error(`Windsor MCP RPC Error [${json.error.code}]: ${json.error.message}`);
      }
      return json.result;
    }
  }

  // Fallback direct JSON parsing
  try {
    const json = JSON.parse(rawText);
    if (json.error) {
      throw new Error(`Windsor MCP RPC Error [${json.error.code}]: ${json.error.message}`);
    }
    return json.result;
  } catch {
    throw new Error(`Failed to parse Windsor MCP response: ${rawText.slice(0, 300)}`);
  }
}

// CLI direct run
if (process.argv[1]?.endsWith('windsor-mcp-client.mjs')) {
  (async () => {
    try {
      console.log('🔌 Connecting to Windsor.ai MCP...');
      const user = await callWindsorTool('get_current_user');
      console.log('👤 Windsor User:', user?.structuredContent || user);

      const connectors = await callWindsorTool('get_connectors');
      console.log('🔗 Connected Channels:', connectors?.structuredContent || connectors);
    } catch (err) {
      console.error('❌ Windsor MCP Error:', err.message);
    }
  })();
}
