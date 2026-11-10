# @snippkit/mcp-server

Official **Model Context Protocol (MCP)** server for **SnippKit**.

Connect your AI coding agents (**Google Antigravity**, **Cursor**, **Claude Desktop**, **Windsurf**, **Claude Code**) directly to your SnippKit library. Empower your agents with procedural **AI Skills**, verified **Code Snippets**, and executable **Shell Commands**.

---

## ⚡ Quick Start

### 1. Cursor Setup
Add the following to your Cursor MCP settings (`.cursor/mcp.json` or Settings > Features > MCP):

```json
{
  "mcpServers": {
    "snippkit": {
      "command": "npx",
      "args": ["-y", "@snippkit/mcp-server"],
      "env": {
        "SNIPPKIT_API_KEY": "sk_live_YOUR_API_KEY"
      }
    }
  }
}
```

### 2. Claude Desktop Setup
Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "snippkit": {
      "command": "npx",
      "args": ["-y", "@snippkit/mcp-server"],
      "env": {
        "SNIPPKIT_API_KEY": "sk_live_YOUR_API_KEY"
      }
    }
  }
}
```

### 3. Antigravity & Windsurf Setup
In your MCP configuration file:

```json
{
  "mcpServers": {
    "snippkit": {
      "command": "npx",
      "args": ["-y", "@snippkit/mcp-server"],
      "env": {
        "SNIPPKIT_API_KEY": "sk_live_YOUR_API_KEY"
      }
    }
  }
}
```

---

## 🛠️ Provided Tools

| Tool | Description |
| :--- | :--- |
| `snippkit_search_skills` | Search public and team AI Skills in the SnippKit registry by keywords or agent compatibility. |
| `snippkit_get_skill` | Fetch complete `SKILL.md` instructions and procedural rules to guide agent execution. |
| `snippkit_search_snippets` | Search your private and public code snippets by title, tag, or language. |
| `snippkit_get_snippet` | Retrieve decrypted code from your SnippKit library. |
| `snippkit_save_snippet` | Save newly written or refactored code directly into SnippKit from the agent. |
| `snippkit_search_commands` | Search verified shell scripts and DevOps command runbooks. |
| `snippkit_get_command` | Retrieve shell command scripts. |

---

## 📚 Resources & Prompts

- **Resources:**
  - `snippkit://skills/{slug}`: Read a skill's full instructions as a direct context resource.
  - `snippkit://snippets/{id}`: Read a snippet as a direct context resource.
- **Prompts:**
  - `use-skill`: Injects a named SnippKit skill into the agent's context window.
  - `save-solution`: Prompts the agent to format and persist code to SnippKit.

---

## 🔐 Authentication

Generate your API key from [SnippKit Dashboard > Settings > Developer Keys](https://snippkit.com/settings/developer).

The server checks credentials in this order:
1. `SNIPPKIT_API_KEY` environment variable.
2. Command-line flag `--api-key <key>`.
3. Local `snix` CLI vault (if you have already logged in via `snix login`).

---

## 📄 License

MIT © [SnippKit](https://snippkit.com)

