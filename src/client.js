import axios from 'axios';
import { getConfig } from './config.js';

export class SnippKitClient {
  constructor() {
    const { apiKey, apiUrl } = getConfig();
    this.apiKey = apiKey;
    this.apiUrl = apiUrl;

    this.http = axios.create({
      baseURL: apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@snippkit/mcp-server/1.0.1',
      },
      timeout: 15000,
    });

    this.http.interceptors.request.use((reqConfig) => {
      // Re-fetch current config in case updated dynamically
      const current = getConfig();
      if (current.apiKey && !reqConfig.headers['Authorization']) {
        reqConfig.headers['Authorization'] = `Bearer ${current.apiKey}`;
      }
      return reqConfig;
    });
  }

  // --------------------------------------------------------------------------
  // SKILLS
  // --------------------------------------------------------------------------
  async searchSkills({ query = '', agent = '', sort = 'installs', limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (agent && agent !== 'all') params.set('agent', agent);
    if (sort) params.set('sort', sort);
    if (limit) params.set('limit', String(limit));

    const res = await this.http.get(`/api/skills/search?${params.toString()}`);
    return res.data;
  }

  async getSkill({ slug, id, username } = {}) {
    const target = id || slug;
    if (!target) throw new Error('Skill slug or ID is required');

    // First try /api/skills/read (full markdown and author details)
    const params = new URLSearchParams();
    if (id) params.set('id', id);
    else if (slug) params.set('slug', slug);
    if (username) params.set('username', username);

    try {
      const res = await this.http.get(`/api/skills/read?${params.toString()}`);
      if (res.data && !res.data.error) {
        return res.data;
      }
    } catch (err) {
      // Fallback to /api/cli/run?type=skills
    }

    const fallbackRes = await this.http.get(`/api/cli/run?type=skills&id=${encodeURIComponent(target)}`);
    return fallbackRes.data;
  }

  async saveSkill({
    title,
    content,
    description = '',
    compatibility = ['antigravity', 'cursor', 'claude-code', 'windsurf'],
    tags = [],
    version = '1.0.0',
    is_public = true,
    slug,
  } = {}) {
    if (!this.apiKey) {
      throw new Error('SnippKit API Key is required to save skills. Set SNIPPKIT_API_KEY environment variable.');
    }
    if (!title) throw new Error('Skill title is required');
    if (!content) throw new Error('Skill content is required');

    const payload = {
      title,
      content,
      description,
      compatibility: Array.isArray(compatibility) ? compatibility : ['antigravity', 'cursor', 'claude-code', 'windsurf'],
      tags: Array.isArray(tags) ? tags : [],
      version,
      is_public: Boolean(is_public),
      slug,
    };

    const res = await this.http.post('/api/skills/create', payload);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // SNIPPETS
  // --------------------------------------------------------------------------
  async searchSnippets({ query = '' } = {}) {
    if (!this.apiKey) {
      throw new Error('SnippKit API Key is required to search private snippets. Set SNIPPKIT_API_KEY environment variable.');
    }
    const params = new URLSearchParams({ type: 'snippets' });
    if (query) params.set('search', query);

    const res = await this.http.get(`/api/cli/list?${params.toString()}`);
    return res.data;
  }

  async getSnippet({ id, slug } = {}) {
    const target = id || slug;
    if (!target) throw new Error('Snippet ID or slug is required');

    const res = await this.http.get(`/api/cli/run?type=snippets&id=${encodeURIComponent(target)}`);
    return res.data;
  }

  async saveSnippet({ title, code, language = 'plaintext', description = '', is_public = false, tags = [] } = {}) {
    if (!this.apiKey) {
      throw new Error('SnippKit API Key is required to save snippets. Set SNIPPKIT_API_KEY environment variable.');
    }
    if (!title) throw new Error('Snippet title is required');
    if (!code) throw new Error('Snippet code is required');

    const payload = {
      title,
      code,
      language: language.toLowerCase(),
      description,
      is_public: Boolean(is_public),
      tags: Array.isArray(tags) ? tags : [],
    };

    const res = await this.http.post('/api/s/create', payload);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // COMMANDS
  // --------------------------------------------------------------------------
  async searchCommands({ query = '' } = {}) {
    if (!this.apiKey) {
      throw new Error('SnippKit API Key is required to search commands. Set SNIPPKIT_API_KEY environment variable.');
    }
    const params = new URLSearchParams({ type: 'commands' });
    if (query) params.set('search', query);

    const res = await this.http.get(`/api/cli/list?${params.toString()}`);
    return res.data;
  }

  async getCommand({ id, slug } = {}) {
    const target = id || slug;
    if (!target) throw new Error('Command ID or slug is required');

    const res = await this.http.get(`/api/cli/run?type=commands&id=${encodeURIComponent(target)}`);
    return res.data;
  }

  async saveCommand({ title, commands, language = 'bash', is_public = false, tags = [], slug, folder_id = null } = {}) {
    if (!this.apiKey) {
      throw new Error('SnippKit API Key is required to save commands. Set SNIPPKIT_API_KEY environment variable.');
    }
    if (!title) throw new Error('Command title is required');
    if (!commands) throw new Error('Command list is required');

    // Normalize commands into an array of command lines
    let commandList = [];
    if (Array.isArray(commands)) {
      commandList = commands.map((c) => String(c).trim()).filter(Boolean);
    } else if (typeof commands === 'string') {
      commandList = commands
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    }

    if (commandList.length === 0) {
      throw new Error('At least one executable shell command or step is required.');
    }

    const payload = {
      title,
      commands: commandList,
      language: language ? language.toLowerCase() : 'bash',
      is_public: Boolean(is_public),
      tags: Array.isArray(tags) ? tags : [],
      slug: slug || null,
      folder_id: folder_id || null,
    };

    const res = await this.http.post('/api/c/create', payload);
    return res.data;
  }

  // --------------------------------------------------------------------------
  // FOLDERS
  // --------------------------------------------------------------------------
  async listFolders() {
    if (!this.apiKey) {
      throw new Error('SnippKit API Key is required to list folders. Set SNIPPKIT_API_KEY environment variable.');
    }
    const res = await this.http.get('/api/cli/list?type=folders');
    return res.data;
  }
}

