# Slop MCP Setup

`SKILL.md` reads this file when the user wants to register Slop or Not's
MCP server with their AI client. The MCP server exposes the same Pro
tools as the CLI, but as MCP `tools` callable by any MCP-aware client
(Claude Code, Claude Desktop, Codex CLI, Cursor, OpenClaw, Hermes Agent,
or another MCP client).

## Prerequisites

- Slop or Not for Mac installed (see `slop-cli-setup.md` step 1).
- Slop or Not Pro active (see `slop-cli-setup.md` step 2).
- Command-line access configured from Slop or Not Settings, then Command
  Line, or use the absolute app-bundle binary path in the snippets below.

## Tools the server exposes

| Tool | Purpose |
|---|---|
| `mcp__SlopOrNot__slop_status` | Probe server health and cached Pro status |
| `mcp__SlopOrNot__detect_text` | Detect AI probability for text |
| `mcp__SlopOrNot__analyze_readability` | Compute Flesch-Kincaid grade |
| `mcp__SlopOrNot__clean_text` | Strip zero-width chars, homoglyphs |
| `mcp__SlopOrNot__detect_image` | Detect AI-generated images |
| `mcp__SlopOrNot__score_image` | Return the raw OmniAID image score |

The agentic-humanizer loop uses `detect_text`, `analyze_readability`, and
`clean_text`. The bundled `slop-check` skill also uses the image tools when
CLI execution is unavailable.

Current `detect_text` responses include a numeric `score` field, `verdict`,
`language`, `sentence_count`, and optional `readability`. Treat `score` as a
0-1 decimal and multiply by 100 when showing a percentage. Read the
Flesch-Kincaid grade from `readability.scores[]` where `kind` is
`fleschKincaidGradeLevel`.

## Client setup

### Claude Code

Run:

```bash
claude mcp add --transport stdio --scope user SlopOrNot -- "/Applications/Slop Or Not.app/Contents/MacOS/slop" mcp
```

Or add to `~/.claude/mcp.json` (create if missing):

```json
{
  "mcpServers": {
    "SlopOrNot": {
      "command": "/Applications/Slop Or Not.app/Contents/MacOS/slop",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Code. Verify with `/mcp`; `SlopOrNot` should appear with six
tools.

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "SlopOrNot": {
      "command": "/Applications/Slop Or Not.app/Contents/MacOS/slop",
      "args": ["mcp"]
    }
  }
}
```

Restart Claude Desktop.

### Codex CLI

Run:

```bash
codex mcp add SlopOrNot -- "/Applications/Slop Or Not.app/Contents/MacOS/slop" mcp
```

Or add to `~/.codex/config.toml`:

```toml
[mcp_servers.SlopOrNot]
command = "/Applications/Slop Or Not.app/Contents/MacOS/slop"
args = ["mcp"]
```

Restart Codex.

### Cursor

Open Cursor → Settings → MCP. Add a server:

- **Name:** SlopOrNot
- **Command:** `/Applications/Slop Or Not.app/Contents/MacOS/slop`
- **Args:** `mcp`

Save and restart Cursor.

### Other MCP clients

The server is `stdio`-based. Any MCP client that supports a custom
stdio command can register it via:

```yaml
command: /Applications/Slop Or Not.app/Contents/MacOS/slop
args: ["mcp"]
```

## Verify

After registering with any client, ask the LLM:

> "Run slop_status."

Expected: a tool call to `mcp__SlopOrNot__slop_status` that returns
server health and cached Pro status without error. Pro-gated tools still
need an actual Pro call, such as `detect_text`, to confirm access.

## Troubleshooting

- **Client cannot find `slop`.** Use the absolute binary path in the config,
  or open Slop or Not Settings, then Command Line and follow the app's
  current setup command:

  ```json
  "command": "/Applications/Slop Or Not.app/Contents/MacOS/slop"
  ```

- **Tool calls return `isError: true`.** Sign in to Pro inside the app.
  The MCP server keeps running so a single non-Pro call does not interrupt a
  session, but per-tool failures persist until Pro is active.
- **macOS quarantine on first launch.** Open the app once via
  right-click → Open before pointing a client at the binary.
