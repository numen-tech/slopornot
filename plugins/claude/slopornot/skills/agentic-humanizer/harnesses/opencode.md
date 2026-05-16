# Harness Routing — OpenCode

`SKILL.md` routes here when running inside OpenCode. OpenCode's native
skill loader reads from `~/.config/opencode/skills/`,
`~/.opencode/skills/`, `~/.claude/skills/`, `~/.agents/skills/`, and the
project-local equivalents. A single clone into `~/.claude/skills/`
covers BOTH Claude Code AND OpenCode in one step.

## The interview

OpenCode's question-tool surface evolves quickly. Prefer the first of
these that is available in the running session:

1. **OpenCode's built-in question tool** (if exposed by the running
   harness version). Use the same shape as the
   `harnesses/gemini-cli.md` schema — `questions` array with `header`,
   `question`, `type`, `options`.
2. **AUQ (`ask-user-questions-mcp`) plugin** at
   <https://github.com/paulp-o/ask-user-questions-mcp> — install per its
   README, then issue questions via its CLI/MCP tool.
3. **Plain-text fallback** — fall through to `harnesses/generic.md`.

For path 1 or path 2, ask all four required questions (dialect, reading
level, tone, length) in one call. The wording matches
`harnesses/claude-code.md`.

Only add Q5 when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`. When Q5 is eligible, append this question to
the same call:

```json
{
  "header": "Voice",
  "question": "Mimic a writing sample of yours?",
  "type": "choice",
  "options": [
    { "label": "Yes" },
    { "label": "No" },
    { "label": "Never ask again" }
  ]
}
```

## After the interview

Map the labels to internal variables (same as Claude Code):

- Q1 → `dialect`
- Q2 → `target_grade` (4, 7, 10, 13, 17)
- Q3 → `tone`
- Q4 → `length_policy` (`±10`, `exp`, `trim`)
- Q5 → voice choice: `Yes` starts Step 3.5 sample capture, `No` skips
  voice matching for this call, `Never ask again` persists `voice_skip`.

When Q5 is `Yes`, say exactly: *"Paste 200+ words as your next message."*
Capture the next user turn as the voice sample and return to `SKILL.md`
Step 3.5 for validation, writing, and fingerprint extraction.

Return to `SKILL.md` § Loop algorithm with these answers.
