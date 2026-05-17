# Slop or Not tool surface (CLI + MCP)

`SKILL.md` reads this file to look up exact tool names, parameters, flags,
and JSON field paths. Never guess these. Everything below runs on-device on
an Apple silicon Mac. No text or image is uploaded for the analysis step.

## Contents

1. Backend selection
2. Score normalization (read this before formatting any result)
3. MCP tools (preferred backend)
4. CLI subcommands (fallback backend)
5. Operation-to-tool map

## 1. Backend selection

Two backends expose the same six capabilities:

- **MCP server** (preferred): the SlopOrNot MCP server. Claude Code surfaces
  its tools as `mcp__SlopOrNot__<tool>`. Other harnesses expose the same
  server under the registered name `SlopOrNot`; the tool short names
  (`detect_text`, etc.) are identical.
- **CLI** (fallback): the `slop` binary, used when MCP is unavailable,
  erroring, or the harness has no MCP wiring.

Pro gating: `detect_text`, `analyze_readability`, `clean_text`,
`detect_image`, `score_image` require Slop or Not Pro. `slop_status` /
`slop status` does NOT, so it can never prove Pro. Verify Pro only by a
real Pro-gated call.

## 2. Score normalization

Detection scores are 0-1 decimals. Multiply by 100 for a percentage. Treat
a value as already a percentage only if it is greater than 1. Do not apply
this conversion to readability values: Flesch-Kincaid is a grade number and
Flesch Reading Ease is already on its own readability scale.

Verdict shape differs by backend:

- **MCP** returns `verdict` as a plain string, for example `"real"` or
  `"most_likely_ai_slop"`.
- **CLI** returns the verdict as a single-key object at
  `detection.result._1`, for example `{"real": {}}` or
  `{"most_likely_ai_slop": {}}`. The single key is the verdict string.

The verdict string has gradations, for example `real`, `probably_ai_slop`,
`most_likely_ai_slop`. Normalize either backend form to the string, then
render by rule (not by enumerating every value):

- `real` -> "Likely human"
- contains `ai_slop` -> "Likely AI"
- anything else -> title-cased words

Always show the human-readable label, the raw verdict in parentheses, and
the percentage, for example: `Likely AI (probably_ai_slop), 61%`.

Readability: read the Flesch-Kincaid grade from the `scores[]` entry whose
`kind` is `fleschKincaidGradeLevel`. Read Flesch Reading Ease from the entry
whose `kind` is `fleschReadingEase`. Never read the grade from any other
field. `scores[]` can be **empty** for short input; the response then
carries a `warnings` entry such as `insufficient_text:NN`. When the grade
entry is absent, report the warning instead of a grade, do not invent one.

## 3. MCP tools (preferred backend)

Transport: stdio. Six tools. Pro-gated tools return an error (Claude Code:
`isError: true`; other clients: a Pro-required message) when Pro is
inactive; the server keeps running.

### slop_status

- Input: none (`{}`).
- Output: `pro` (boolean), `version` (string).
- Not Pro-gated. Use for health and setup checks only, never as a Pro
  proof. A status result of `pro: true` can be displayed as cached status,
  but the skill only reports "Pro: active" after a Pro-gated probe succeeds.

### detect_text

- Input:
  - `text` (string, required)
  - `include_readability` (boolean, optional) include the readability block
  - `language_code` (string, optional) e.g. `"en"`
- Output: `kind` (`"result"`), `verdict` (plain string, e.g. `"real"`),
  `score` (number 0-1), `language` (string), `sentence_count` (integer),
  `generator` (string or null), `readability` (object or null). The
  `readability` object carries `language`, `language_confidence`, `scores`
  (array of `{kind, value}`, possibly empty for short text),
  `avg_words_per_sentence`, `word_count`, `sentence_count`, `warnings`.

Some builds return the score at `score`; older or normalized clients use
`ai_probability`. Handle both as the same 0-1 score.

### analyze_readability

- Input:
  - `text` (string, required)
  - `language_code` (string, optional)
- Output: `language`, `language_confidence`, `scores` (array of
  `{kind, value}`), `avg_words_per_sentence`, `sentence_count`,
  `word_count`, `warnings`.

### clean_text

- Input:
  - `text` (string, required)
  - `remove_invisibles` (boolean, optional, default true)
  - `remove_punctuation` (boolean, optional, default true)
  - `remove_homoglyphs` (boolean, optional, default true)
  - `britishize` (boolean, optional, default false) convert American
    spellings to British (CLI equivalent: `--british`)
  - `language_code` (string, optional)
- Output: `cleaned_text` (string), `language` (string),
  `removed_invisibles` (integer), `punctuation_replacements` (integer),
  `homoglyphs_replaced` (integer), `british_substitutions` (integer).

### detect_image

- Input:
  - `image_base64` (string, base64, required)
  - `recognize_text` (boolean, optional) OCR screenshots
- Output: `kind` (`"result"`), `verdict` (string, e.g.
  `"most_likely_ai_slop"`), `score` (number 0-1), `generator` (string or
  null), `recognized_text` (string or null), `recognized_sentence_count`
  (integer or null). Reads C2PA and IPTC provenance first, then falls back
  to the on-device model.

### score_image

- Input: `image_base64` (string, base64, required).
- Output: `raw_slop_score` (number 0-1). Raw OmniAID model score only, no
  verdict metadata. Requires Pro and OmniAID installed.

## 4. CLI subcommands (fallback backend)

Binary path inside the signed app bundle:

```text
/Applications/Slop Or Not.app/Contents/MacOS/slop
```

The path contains spaces; always quote it. On PATH it is just `slop`. See
`slop-setup.md` for the app-bundle fallback and client registration.

Common flags: `--json` (emit JSON), `-l, --language <code>` (override
language, e.g. `en`, `de`).

| Subcommand | Stdin | Purpose | Pro-gated |
|---|---|---|---|
| `slop status --json` | none | presence + `pro` + `version` | no |
| `slop text --json` | UTF-8 text | AI text detection + readability | yes |
| `slop readability --json` | text | readability only | yes |
| `slop cleanup --json` | text | strip AI artifacts | yes |
| `slop image --json` | raw image bytes | AI image detection | yes |
| `slop mcp` | stdio | start the MCP server | n/a |

`slop cleanup` flags: `--invisibles` / `--no-invisibles` (default on),
`--punctuation` / `--no-punctuation` (default on), `--homoglyphs` /
`--no-homoglyphs` (default on), `--british` (convert American spellings to
British, English only).

`slop mcp` flag: `--print-config` prints the supported clients and tool
list as JSON instead of starting the server.

Pro-gated subcommands exit non-zero with a Pro-required message until Pro
is active.

### CLI JSON shapes

`slop text --json`:

```json
{
  "detectedLanguage": "en",
  "detection": { "result": { "_0": 0.0400261, "_1": { "real": {} } } },
  "readability": {
    "scores": [
      { "kind": "fleschReadingEase", "value": 31.7 },
      { "kind": "fleschKincaidGradeLevel", "value": 13.55 }
    ]
  },
  "sentenceCount": 3
}
```

Read the score from `detection.result._0`. For short samples it can appear
at `detection.resultFewSentences._0` instead. Normalized clients may expose
`ai_probability`. The verdict object is `detection.result._1` (single-key,
e.g. `{"real": {}}` or `{"most_likely_ai_slop": {}}`).

`slop readability --json`: same `readability.scores[]` shape. Grade is the
entry with `kind == fleschKincaidGradeLevel`. The CLI wraps the scores under
`readability`, and the word/sentence counts live under `readability.stats`.
If `scores[]` is empty, read `readability.warnings[]`; warning objects use
camelCase types such as `insufficientText` and may include `wordCount`.

`slop cleanup --json`:

```json
{
  "cleanedText": "<cleaned text>",
  "detectedLanguage": "en",
  "invisibleCounts": [{ "count": 1, "kind": "<name>" }],
  "punctuationCounts": [{ "count": 1, "kind": "<name>" }],
  "homoglyphCounts": [],
  "britishMappings": []
}
```

Normalize CLI cleanup output before formatting:

- Cleaned text: `cleanedText`
- Invisibles: sum `invisibleCounts[].count`
- Punctuation: sum `punctuationCounts[].count`
- Homoglyphs: sum `homoglyphCounts[].count`
- British substitutions: `britishMappings.length`

`slop image --json`:

```json
{ "detection": { "result": { "_0": 0.80, "_1": { "most_likely_ai_slop": {} } } } }
```

`slop status --json`:

```json
{ "localCachePro": true, "pro": true, "version": "1.0.9" }
```

Older builds may use legacy `premium` / `localCachePremium` fields. The
runtime never trusts these for Pro proof; it makes a real Pro-gated call.

### Pro proof probe for status

For the `status` operation, use `slop_status` or `slop status --json` only
for server health and version. Then run a real Pro-gated probe:

- MCP: call `detect_text` with this three-sentence text and
  `include_readability: false`.
- CLI: pipe the same text into `slop text --json`.

```text
This is a local Slop or Not Pro status probe. It has enough sentences to
exercise the Pro-gated detector. The result is used only to confirm access.
```

If the probe succeeds, report `Slop or Not Pro: active` and include the
version from the health call when available. If the health call works but
the probe returns a Pro-required error or exits non-zero, report
`Slop or Not Pro: inactive` and point to the Pro unlock step in
`slop-setup.md`.

## 5. Operation-to-tool map

| Operation | MCP tool | CLI command | Read from |
|---|---|---|---|
| text-detect | `detect_text` (`include_readability: true`) | `slop text --json` (stdin) | MCP `score` / `verdict`; CLI `detection.result._0` / `._1` |
| image-detect | `detect_image` (base64) | `slop image --json < file` | `verdict`, `score` / `detection.result` |
| image-score | `score_image` (base64) | n/a (use `slop image --json`) | MCP `raw_slop_score`; CLI `detection.result._0` |
| readability | `analyze_readability` | `slop readability --json` (stdin) | `scores[]` where `kind == fleschKincaidGradeLevel` |
| cleanup | `clean_text` | `slop cleanup --json` (stdin) | MCP `cleaned_text` + counts; CLI `cleanedText` + count arrays |
| status | `slop_status` + `detect_text` proof probe | `slop status --json` + `slop text --json` proof probe | health/version plus Pro-gated probe success |

Image input: MCP needs base64 (`base64 -i <path>`); the CLI reads raw
bytes (`slop image --json < <path>`). `score_image` is MCP-only; with the
CLI, run `slop image --json` and report `detection.result._0` as the score.
