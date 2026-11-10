import { z } from 'zod';

export function registerSkillTools(server, client) {
  // 1. Search Skills
  server.tool(
    'snippkit_search_skills',
    'Search the SnippKit AI Skills Registry for agent capabilities, procedural rules, and autonomous instructions.',
    {
      query: z.string().optional().describe("Search keywords, e.g. 'supabase', 'nextjs', 'docker', 'auth'"),
      agent: z
        .enum(['all', 'antigravity', 'cursor', 'claude-code', 'windsurf', 'chatgpt', 'gemini-cli'])
        .optional()
        .default('all')
        .describe('Filter by AI agent compatibility'),
      limit: z.number().int().min(1).max(25).optional().default(10).describe('Max skills to return'),
    },
    async ({ query = '', agent = 'all', limit = 10 }) => {
      try {
        const skills = await client.searchSkills({ query, agent, limit });
        if (!Array.isArray(skills) || skills.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: `No skills found in SnippKit registry matching "${query}". Try searching with broader terms.`,
              },
            ],
          };
        }

        const formatted = skills.map((s) => {
          const author = s.username || s.author?.username || 'developer';
          const tags = Array.isArray(s.tags) ? s.tags.map((t) => `#${t}`).join(' ') : '';
          return `### ${s.title} (v${s.version || '1.0.0'})
- **Slug / ID**: \`@${author}/${s.slug || s.id}\`
- **Description**: ${s.description || 'No description provided'}
- **Compatibility**: ${(s.compatibility || []).join(', ') || 'universal'}
- **Downloads**: ${s.downloads || 0} installs | **Stars**: ${s.stars || 0}
- **Tags**: ${tags || 'none'}
- **Install CLI**: \`npx @snippkit/cli skill add @${author}/${s.slug || s.id}\`
`;
        }).join('\n---\n\n');

        return {
          content: [
            {
              type: 'text',
              text: `Found ${skills.length} matching skill(s) in SnippKit Registry:\n\n${formatted}\n\n*Tip: Call \`snippkit_get_skill\` with a slug to fetch the full instructions.*`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to search skills: ${err.message}` }],
        };
      }
    }
  );

  // 2. Get Skill
  server.tool(
    'snippkit_get_skill',
    'Fetch the complete SKILL.md instructions and procedural rules for an AI skill from SnippKit. Use this to guide your execution with expert domain knowledge.',
    {
      slug: z.string().describe("The slug or identifier of the skill (e.g. 'hello-world' or '@username/slug')"),
      username: z.string().optional().describe('Author username if known'),
    },
    async ({ slug, username }) => {
      try {
        const skill = await client.getSkill({ slug, username });
        if (!skill) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Skill "${slug}" was not found or is private.` }],
          };
        }

        const author = skill.username || skill.author?.username || username || 'developer';
        const header = `# Skill: ${skill.title} (v${skill.version || '1.0.0'})
Author: @${author}
Slug: ${skill.slug || slug}
Compatibility: ${(skill.compatibility || []).join(', ') || 'universal'}
Description: ${skill.description || 'N/A'}

================================================================================
SKILL.md INSTRUCTIONS
================================================================================
`;
        const content = skill.content || skill.description || 'No instruction body found for this skill.';

        return {
          content: [
            {
              type: 'text',
              text: `${header}\n${content}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch skill "${slug}": ${err.message}` }],
        };
      }
    }
  );

  // 3. Save / Create Skill
  server.tool(
    'snippkit_save_skill',
    'Save or publish an AI agent skill (SKILL.md) directly to SnippKit registry or your private library.',
    {
      title: z.string().describe('Clear, descriptive title for the skill'),
      content: z.string().describe('The full markdown body / instructions (including YAML frontmatter) of SKILL.md'),
      description: z.string().optional().describe('Brief summary of what this skill teaches AI agents'),
      slug: z.string().optional().describe('Optional custom URL slug (e.g. red-white-theme)'),
      is_public: z.boolean().optional().default(true).describe('True to publish to marketplace, false for private encrypted'),
      tags: z.array(z.string()).optional().describe('Tags for indexing, e.g. ["ui", "theme", "red", "white", "tailwind"]'),
      compatibility: z.array(z.string()).optional().default(['antigravity', 'cursor', 'claude-code', 'windsurf']).describe('Supported AI agent platforms'),
      version: z.string().optional().default('1.0.0').describe('Semantic version string, e.g. 1.0.0'),
    },
    async ({ title, content, description = '', slug, is_public = true, tags = [], compatibility = ['antigravity', 'cursor', 'claude-code', 'windsurf'], version = '1.0.0' }) => {
      try {
        const saved = await client.saveSkill({
          title,
          content,
          description,
          slug,
          is_public,
          tags,
          compatibility,
          version,
        });

        const skillObj = saved.skill || saved;
        const author = skillObj.author?.username || 'you';
        const finalSlug = skillObj.slug || slug || 'skill';
        const webUrl = `http://localhost:3000/skills/${finalSlug}`;

        return {
          content: [
            {
              type: 'text',
              text: `Successfully saved skill to SnippKit!\n- **Title**: ${title}\n- **Slug**: \`@${author}/${finalSlug}\`\n- **Version**: ${version}\n- **Access**: ${is_public ? 'Public (Marketplace)' : 'Private (Encrypted)'}\n- **Web URL**: ${webUrl}\n- **Install CLI**: \`npx @snippkit/cli skill add @${author}/${finalSlug}\``,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to save skill to SnippKit: ${err.message}` }],
        };
      }
    }
  );
}

