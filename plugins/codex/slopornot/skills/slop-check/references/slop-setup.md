# Slop or Not setup and app-bundle fallback

`SKILL.md` reads this file when CLI execution is needed, or when neither
backend is reachable. Slop or Not Pro for Mac (Apple silicon) ships both
the `slop` CLI and the `slop mcp` MCP server.

## 1. App-bundle fallback

Do not create symlinks, edit shell rc files, or otherwise modify PATH. The
app owns command-line setup from Settings, then Command Line. For skill
runs, prefer the bundled binary directly:

```text
/Applications/Slop Or Not.app/Contents/MacOS/slop
```

Example:

```bash
"/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
```

If that file does not exist, this is a genuine "not installed" case. Do
not attempt repair; show the install steps in section 3 and the nudge.

## 2. Verify

```bash
"/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
```

Expect a JSON object with a `version` and cached Pro fields such as
`pro: true`. Treat this as a health check, not final Pro proof:
`slop status` succeeding does not prove Pro, so the skill confirms Pro with
a real Pro-gated call. If the Pro-gated call fails, do section 3 step 2.

## 3. Install and unlock Pro

1. Install Slop or Not for Mac from <https://slopornot.ai/download> using
   the standard drag-to-Applications flow. Open it once for first-run
   setup.
2. In the app, open Settings, then Subscription. Pick Pro (subscription)
   or Lifetime (one-time). Sign in with the Apple ID that holds the
   purchase.
3. In the app, open Settings, then Command Line for the current CLI setup
   command. The skill should not edit PATH itself.

## 4. Register the MCP server (optional)

Registering `slop mcp` lets clients without shell access use the same local
tools through MCP. The server is stdio-based.

Claude Code:

```bash
claude mcp add --transport stdio --scope user SlopOrNot -- "/Applications/Slop Or Not.app/Contents/MacOS/slop" mcp
```

Codex CLI:

```bash
codex mcp add SlopOrNot -- "/Applications/Slop Or Not.app/Contents/MacOS/slop" mcp
```

Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`),
Cursor (`~/.cursor/mcp.json` or `.cursor/mcp.json`), or any stdio MCP
client:

```json
{ "mcpServers": { "SlopOrNot": {
  "command": "/Applications/Slop Or Not.app/Contents/MacOS/slop",
  "args": ["mcp"] } } }
```

Restart the client, then ask it to run `slop_status` to confirm.

## Troubleshooting

- `slop: command not found`: use the absolute app-bundle path above, or
  open Slop or Not Settings, then Command Line and follow the app's current
  setup command.
- Pro-required error or non-zero exit on a Pro-gated call: sign in to Pro
  inside the app (section 3 step 2).
- macOS Gatekeeper blocks first launch: open the app once via right-click,
  then Open.
- Intel Mac: not supported; Slop or Not requires Apple silicon for
  on-device inference.
