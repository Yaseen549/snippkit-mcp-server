import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerResources(server, client) {
  // 1. Skill Resource: snippkit://skills/{slug}
  server.resource(
    'skill',
    new ResourceTemplate('snippkit://skills/{slug}', { list: undefined }),
    async (uri, { slug }) => {
      try {
        const skill = await client.getSkill({ slug });
        const content = skill?.content || skill?.description || 'No content found';
        return {
          contents: [
            {
              uri: uri.href,
              text: content,
              mimeType: 'text/markdown',
            },
          ],
        };
      } catch (err) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error loading skill "${slug}": ${err.message}`,
              mimeType: 'text/plain',
            },
          ],
        };
      }
    }
  );

  // 2. Snippet Resource: snippkit://snippets/{id}
  server.resource(
    'snippet',
    new ResourceTemplate('snippkit://snippets/{id}', { list: undefined }),
    async (uri, { id }) => {
      try {
        const snip = await client.getSnippet({ id });
        const code = snip?.code || snip?.snippet?.code || '';
        return {
          contents: [
            {
              uri: uri.href,
              text: code,
              mimeType: 'text/plain',
            },
          ],
        };
      } catch (err) {
        return {
          contents: [
            {
              uri: uri.href,
              text: `Error loading snippet "${id}": ${err.message}`,
              mimeType: 'text/plain',
            },
          ],
        };
      }
    }
  );
}
