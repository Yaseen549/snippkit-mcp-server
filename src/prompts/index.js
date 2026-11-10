import { z } from 'zod';

export function registerPrompts(server, client) {
  // 1. Prompt: use-skill
  server.prompt(
    'use-skill',
    'Load and apply a procedural AI skill from SnippKit into your context window.',
    {
      slug: z.string().describe("The slug or identifier of the skill to apply (e.g. 'hello-world')"),
    },
    async ({ slug }) => {
      try {
        const skill = await client.getSkill({ slug });
        const title = skill?.title || slug;
        const content = skill?.content || skill?.description || 'No instructions found.';

        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I want you to follow the rules and procedures from the SnippKit Skill "${title}".

Instructions from SKILL.md:
================================================================================
${content}
================================================================================

Please confirm you have read and understood these instructions before proceeding.`,
              },
            },
          ],
        };
      } catch (err) {
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `Please fetch and apply the skill "${slug}" from SnippKit. (Auto-fetch failed: ${err.message})`,
              },
            },
          ],
        };
      }
    }
  );

  // 2. Prompt: save-solution
  server.prompt(
    'save-solution',
    'Prompt the AI agent to review the code just written and save it as a reusable snippet in SnippKit.',
    {
      title: z.string().optional().describe('Proposed title for the snippet'),
      language: z.string().optional().describe('Programming language'),
    },
    async ({ title = '', language = '' }) => {
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please review the code we just developed. Format it cleanly, add comments explaining how to use it, and save it to my SnippKit library using \`snippkit_save_snippet\` with:
- Title: ${title || 'Meaningful, descriptive title'}
- Language: ${language || 'appropriate programming language'}
- Description: summary of why this code works and when to reuse it`,
            },
          },
        ],
      };
    }
  );
}

