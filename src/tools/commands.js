import { z } from 'zod';

export function registerCommandTools(server, client) {
  // 1. Search Commands
  server.tool(
    'snippkit_search_commands',
    'Search verified shell commands, deployment scripts, and terminal runbooks stored in your SnippKit library.',
    {
      query: z.string().optional().describe("Search keywords, e.g. 'docker', 'git', 'kubectl', 'npm'"),
    },
    async ({ query = '' }) => {
      try {
        const commands = await client.searchCommands({ query });
        if (!Array.isArray(commands) || commands.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No shell commands found matching "${query}".`,
              },
            ],
          };
        }

        const formatted = commands.map((c) => {
          const lines = Array.isArray(c.commands) ? c.commands : [];
          return `- **${c.title}**
  ID: \`${c.id}\` | Slug: \`${c.slug || 'n/a'}\`
  Steps: ${c.command_count || lines.length}
  Preview: \`${lines[0] || 'N/A'}\`
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${commands.length} command runbook(s) in your SnippKit library:\n\n${formatted}\n\n*Tip: Call \`snippkit_get_command\` with an ID to inspect the full script.*`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to search commands: ${err.message}` }],
        };
      }
    }
  );

  // 2. Get Command
  server.tool(
    'snippkit_get_command',
    'Retrieve the shell commands/scripts from a runbook in SnippKit by ID or slug.',
    {
      id: z.string().describe('Command runbook UUID or slug'),
    },
    async ({ id }) => {
      try {
        const result = await client.getCommand({ id });
        if (!result) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Command "${id}" not found.` }],
          };
        }

        const title = result.title || 'Command Runbook';
        const lines = Array.isArray(result.commands)
          ? result.commands.join('\n')
          : result.command || result.commands || '';

        return {
          content: [
            {
              type: 'text',
              text: `### Command: ${title}\n\n\`\`\`bash\n${lines}\n\`\`\``,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch command "${id}": ${err.message}` }],
        };
      }
    }
  );

  // 3. Save Command
  server.tool(
    'snippkit_save_command',
    'Save a shell command, deployment script, or multi-step runbook directly into your SnippKit library.',
    {
      title: z.string().describe('Clear, descriptive title for the command runbook'),
      commands: z.union([z.array(z.string()), z.string()]).describe('The shell command or array of sequential shell commands'),
      language: z.string().default('bash').optional().describe("Shell language (e.g. 'bash', 'sh', 'zsh', 'powershell')"),
      tags: z.array(z.string()).optional().describe("Tags for indexing, e.g. ['docker', 'deploy', 'cleanup']"),
      is_public: z.boolean().default(false).optional().describe('Set to true for public runbook, false for encrypted private runbook'),
      slug: z.string().optional().describe('Optional custom URL slug'),
    },
    async ({ title, commands, language = 'bash', tags = [], is_public = false, slug }) => {
      try {
        const result = await client.saveCommand({
          title,
          commands,
          language,
          tags,
          is_public,
          slug,
        });

        const id = result.id || 'saved';
        const urlSlug = result.slug || slug || id;

        return {
          content: [
            {
              type: 'text',
              text: `Successfully saved command runbook "${title}" to your SnippKit library!\n- **ID**: \`${id}\`\n- **Slug**: \`${urlSlug}\`\n- **Visibility**: ${is_public ? 'Public' : 'Private (Encrypted)'}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to save command: ${err.message}` }],
        };
      }
    }
  );
}

