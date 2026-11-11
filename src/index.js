import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { SnippKitClient } from './client.js';
import { getConfig } from './config.js';
import { registerSkillTools } from './tools/skills.js';
import { registerSnippetTools } from './tools/snippets.js';
import { registerCommandTools } from './tools/commands.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

export function createServer() {
  const config = getConfig();
  const client = new SnippKitClient();

  const server = new McpServer(
    {
      name: 'snippkit',
      version: '1.0.2',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
        logging: {},
      },
    }
  );

  // Register all capabilities
  registerSkillTools(server, client);
  registerSnippetTools(server, client);
  registerCommandTools(server, client);
  registerResources(server, client);
  registerPrompts(server, client);

  return { server, client, config };
}

export async function startServer() {
  const { server, config } = createServer();
  const transport = new StdioServerTransport();

  // Log diagnostic info to stderr (stdout is strictly reserved for JSON-RPC MCP messages!)
  console.error('[snippkit-mcp] Initializing SnippKit MCP Server v1.0.2...');
  console.error(`[snippkit-mcp] API Endpoint: ${config.apiUrl}`);
  if (config.apiKey) {
    const masked = `${config.apiKey.slice(0, 7)}...${config.apiKey.slice(-4)}`;
    console.error(`[snippkit-mcp] Authentication: Configured (${masked})`);
  } else {
    console.error('[snippkit-mcp] Authentication: Public access only (Set SNIPPKIT_API_KEY for private snippets)');
  }

  await server.connect(transport);
  console.error('[snippkit-mcp] Connected over stdio transport. Listening for agent requests.');
}

