import { z } from 'zod';

export function registerSnippetTools(server, client) {
  // 1. Search Snippets
  server.tool(
    'snippkit_search_snippets',
    'Search your personal and bookmarked code snippets library in SnippKit by title, language, or keyword.',
    {
      query: z.string().optional().describe("Search keywords or language, e.g. 'auth', 'jwt', 'python', 'react'"),
    },
    async ({ query = '' }) => {
      try {
        const snippets = await client.searchSnippets({ query });
        if (!Array.isArray(snippets) || snippets.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No snippets found matching "${query}".`,
              },
            ],
          };
        }

        const formatted = snippets.map((s) => {
          return `- **${s.title}** (\`${s.language || 'plaintext'}\`)
  ID: \`${s.id}\` | Slug: \`${s.slug || 'n/a'}\`
  Public: ${s.is_public ? 'Yes' : 'No (Encrypted)'} | Size: ${s.size_in_bytes || 0} bytes
`;
        }).join('\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${snippets.length} snippet(s) in your SnippKit library:\n\n${formatted}\n\n*Tip: Call \`snippkit_get_snippet\` with an ID to read the full code.*`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to search snippets: ${err.message}` }],
        };
      }
    }
  );

  // 2. Get Snippet
  server.tool(
    'snippkit_get_snippet',
    'Retrieve the decrypted source code of a specific code snippet from SnippKit by ID or slug.',
    {
      id: z.string().describe('Snippet UUID or slug'),
    },
    async ({ id }) => {
      try {
        const result = await client.getSnippet({ id });
        if (!result) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Snippet "${id}" not found.` }],
          };
        }

        const title = result.title || 'Untitled Snippet';
        const lang = result.language || 'plaintext';
        const code = result.code || result.snippet?.code || '';

        return {
          content: [
            {
              type: 'text',
              text: `### Snippet: ${title} (${lang})\n\n\`\`\`${lang}\n${code}\n\`\`\``,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch snippet "${id}": ${err.message}` }],
        };
      }
    }
  );

  // 3. Save Snippet
  server.tool(
    'snippkit_save_snippet',
    'Save newly generated or refactored code directly into your SnippKit library. Persists solutions across your projects and environments.',
    {
      title: z.string().describe('Clear, descriptive title for the snippet'),
      code: z.string().describe('The source code to save'),
      language: z.string().optional().default('plaintext').describe("Programming language (e.g. 'typescript', 'python', 'sql', 'bash')"),
      description: z.string().optional().describe('Brief explanation of what this code does and when to use it'),
      is_public: z.boolean().optional().default(false).describe('Set to true for public snippet, false for zero-knowledge encrypted private snippet'),
      tags: z.array(z.string()).optional().describe('Array of tags for searching'),
    },
    async ({ title, code, language = 'plaintext', description = '', is_public = false, tags = [] }) => {
      try {
        const saved = await client.saveSnippet({
          title,
          code,
          language,
          description,
          is_public,
          tags,
        });

        const id = saved.id || saved.snippet?.id || 'created';
        const slug = saved.slug || saved.snippet?.slug;
        const link = slug ? `https://snippkit.com/s/${slug}` : `https://snippkit.com/s/${id}`;

        return {
          content: [
            {
              type: 'text',
              text: `Successfully saved snippet to SnippKit!\n- **Title**: ${title}\n- **Language**: ${language}\n- **Access**: ${is_public ? 'Public' : 'Private (Encrypted)'}\n- **Snippet ID**: \`${id}\`\n- **Web URL**: ${link}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to save snippet to SnippKit: ${err.message}` }],
        };
      }
    }
  );
}
