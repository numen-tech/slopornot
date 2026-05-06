# Slop MCP Setup

`SKILL.md` reads this file when the user wants to register Slop or Not's
MCP server with their AI client. The MCP server exposes the same Pro
tools as the CLI, but as MCP `tools` callable by any MCP-aware client
(Claude Code, Claude Desktop, Codex CLI, Cursor).

## Prerequisites

- Slop or Not for Mac installed (see `slop-cli-setup.md` step 1).
- Slop or Not Pro active (see `slop-cli-setup.md` step 2).
- The `slop` binary on PATH (see `slop-cli-setup.md` step 3) — required so
  client config snippets can use bare `slop mcp`.

## Tools the server exposes

| Tool | Purpose |
|---|---|
| `mcp__SlopOrNot__slop_status` | Probe presence + Pro tier |
| `mcp__SlopOrNot__detect_text` | Detect AI probability for text |
| `mcp__SlopOrNot__analyze_readability` | Compute Flesch-Kincaid grade |
| `mcp__SlopOrNot__clean_text` | Strip zero-width chars, homoglyphs |
| `mcp__SlopOrNot__detect_image` | Detect AI-generated images (not used by this skill) |

The agentic-humanizer loop uses `detect_text`, `analyze_readability`, and
`clean_text`.

## Client setup

### Claude Code

Add to `~/.claude/mcp.json` (create if missing):

```json
{
  "mcpServers": {
    "SlopOrNot": {
      "command": "slop",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Code. Verify with `/mcp` — `SlopOrNot` should appear
with five tools.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "SlopOrNot": {
      "command": "slop",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Desktop.

### Codex CLI

Add to `~/.codex/config.toml`:

```toml
[mcp_servers.SlopOrNot]
command = "slop"
args = ["mcp"]
```

Restart Codex.

### Cursor

Open Cursor → Settings → MCP. Add a server:

- **Name:** SlopOrNot
- **Command:** `slop`
- **Args:** `mcp`

Save and restart Cursor.

### Other MCP clients

The server is `stdio`-based. Any MCP client that supports a custom
stdio command can register it via:

```yaml
command: slop
args: ["mcp"]
```

## Verify

After registering with any client, ask the LLM:

> "Run slop_status."

Expected: a tool call to `mcp__SlopOrNot__slop_status` that returns
presence + Pro state without error.

## Troubleshooting

- **Client cannot find `slop`.** The symlink in `~/.local/bin/slop` is
  required; if your client launches with a non-login shell, it may not
  pick up `~/.zshrc` PATH edits. Use the absolute binary path in the
  config instead:

  ```json
  "command": "/Applications/Slop Or Not - AI Fake Detector.app/Contents/MacOS/slop"
  ```

- **Tool calls return `isError: true`.** Sign in to Pro inside the app.
  The MCP server keeps running so a single non-Pro call does not
  interrupt a session, but per-tool failures persist until Pro is
  active.
- **macOS quarantine on first launch.** Open the app once via
  right-click → Open before pointing a client at the binary.
