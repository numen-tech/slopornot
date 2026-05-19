# Slop CLI Setup

`SKILL.md` reads this file when it needs to use the `slop` CLI. The CLI
ships inside the Slop or Not Mac app bundle; macOS is required, and Pro
unlocks the CLI surface.

## 1. Install Slop or Not for Mac

Download from <https://slopornot.ai/download>. Install via the standard
macOS drag-to-Applications flow. Open the app once to complete first-run
setup.

The binary lives at:

```text
/Applications/Slop Or Not.app/Contents/MacOS/slop
```

The path contains spaces, so quote it in shell commands.

## 2. Unlock Pro from inside the app

Open Slop or Not. Go to Settings → Subscription. Pick Pro (subscription)
or Lifetime (one-time). Sign in with the Apple ID that holds the purchase.

The CLI's Pro-gated subcommands return non-zero exit codes with a
Pro-required message until Pro is active.

## 3. Set up command-line access

Open Slop or Not. Go to Settings, then Command Line, and follow the current
in-app setup command. The skill should not create symlinks or edit shell rc
files itself.

You can also call the bundled binary directly:

```bash
"/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json
```

## 4. Verify

Use the absolute binary path from step 3.

Expected: a JSON object with `pro: true` and the CLI version. Recent builds
may also include `localCachePro: true`; older builds may use the legacy
`premium: true` / `localCachePremium: true` fields. If the value is `false`,
return to step 2.

> The field was renamed from `premium` to `pro` to match the in-app tier
> name. The skill probes Pro tier by attempting a real `detect_text`
> call, not by reading this field, so both old and new builds work.

## 5. Subcommands

| Subcommand | Purpose | Pro-gated? |
|---|---|---|
| `slop status --json` | Probe presence and cached Pro status | No |
| `slop text --json` | Detect AI probability for text on stdin | Yes |
| `slop readability --json` | Compute Flesch-Kincaid grade for text on stdin | Yes |
| `slop cleanup` | Strip zero-width chars, fancy punctuation, homoglyphs from text on stdin | Yes |
| `slop image --json` | Detect AI probability for image bytes on stdin | Yes |
| `slop score-image --json` | Return the raw OmniAID image score for image bytes on stdin | Yes |
| `slop mcp` | Run the SlopOrNot MCP stdio server | n/a |

Common flags across all subcommands:

- `--json`: emit JSON.
- `-l, --language <code>`: override language (e.g., `en`, `de`).

`slop cleanup`-specific flags:

- `--invisibles` / `--no-invisibles` (default: on)
- `--punctuation` / `--no-punctuation` (default: on)
- `--homoglyphs` / `--no-homoglyphs` (default: on)
- `--british`: convert American spellings to British (English only)

Examples:

```bash
echo "The quick brown fox jumps over the lazy dog." | "/Applications/Slop Or Not.app/Contents/MacOS/slop" text --json
cat draft.md | "/Applications/Slop Or Not.app/Contents/MacOS/slop" readability --json
pbpaste | "/Applications/Slop Or Not.app/Contents/MacOS/slop" cleanup --british | pbcopy
"/Applications/Slop Or Not.app/Contents/MacOS/slop" image --json < photo.png
"/Applications/Slop Or Not.app/Contents/MacOS/slop" score-image --json < generated.png
```

Current output shape for `slop text --json`:

```json
{
  "detectedLanguage": "en",
  "detection": {
    "result": {
      "_0": 0.0400261,
      "_1": {
        "real": {}
      }
    }
  },
  "readability": {
    "scores": [
      {
        "kind": "fleschReadingEase",
        "value": 31.70789473684212
      },
      {
        "kind": "fleschKincaidGradeLevel",
        "value": 13.556842105263158
      }
    ]
  },
  "sentenceCount": 3
}
```

For short samples, the score can appear at `detection.resultFewSentences._0`
instead of `detection.result._0`. Treat `_0` as a 0-1 decimal and multiply by
100 when showing a percentage. Older or normalized clients may expose
`ai_probability`; handle that field as the same score when present.

For `slop readability --json`, read the grade from `readability.scores[]`
where `kind` is `fleschKincaidGradeLevel`.

For `slop score-image --json`, read the raw OmniAID score from
`rawSlopScore`. It is a 0-1 decimal and is not a provenance-aware detection
verdict.

## Troubleshooting

- **`slop: command not found`**: open Slop or Not Settings, then Command
  Line and follow the app's current setup command, or call the absolute
  binary path from step 1.
- **`Pro required`**: sign in to Pro inside the app (step 2).
- **macOS Gatekeeper blocks first run**: open the app via right-click,
  then Open the first time. macOS remembers the trust decision.
- **Apple silicon vs Intel**: Slop or Not requires Apple silicon for
  on-device inference. Intel Macs are not supported.
