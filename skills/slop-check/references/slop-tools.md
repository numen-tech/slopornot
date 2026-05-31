# Slop or Not tool surface (CLI + MCP)

`SKILL.md` reads this file to look up exact tool names, parameters, flags,
and JSON field paths. Never guess these. Everything below runs on-device on
an Apple silicon Mac. No text or image is uploaded for the analysis step.

## Contents

1. Backend selection
2. Score normalization (read this before formatting any result)
3. MCP tools
4. CLI subcommands
5. Operation-to-tool map

## 1. Backend selection

Two backends expose the same local capabilities:

- **CLI**: use the signed app-bundle binary at
  `/Applications/Slop Or Not.app/Contents/MacOS/slop`. It is preferred for
  `image-detect` and `image-score` when the client can run shell commands,
  because local image paths can be passed with shell redirection instead of
  base64 conversion.
- **MCP server**: the SlopOrNot MCP server. Claude Code surfaces its tools as
  `mcp__SlopOrNot__<tool>`. Other harnesses expose the same server under the
  registered name `SlopOrNot`; the tool short names (`detect_text`, etc.) are
  identical. Use MCP for image operations when CLI execution is unsupported,
  and try MCP first for text, readability, cleanup, and status.

Pro gating: `detect_text`, `analyze_readability`, `clean_text`,
`detect_image`, `score_image`, and CLI `score-image` require Slop or Not
Pro. `slop_status` / `slop status` does NOT, so it can never prove Pro.
Verify Pro only by a real Pro-gated call.

For image requests, image detection is the default. It matches the Slop or
Not app's image check because it returns provenance-aware verdict metadata
plus the detection probability. Prefer the CLI `image` subcommand for local
paths when shell commands are available; use MCP `detect_image` when CLI
execution is unsupported. Use CLI `score-image` or MCP `score_image` only
when the user explicitly asks for a raw or absolute OmniAID score. Do not
treat generic "score this image" wording as an OmniAID request.

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

Readability: read whatever `kind` the `scores[]` entries carry; do not assume
`fleschKincaidGradeLevel`. The kind depends on the input language:

| Language | `kind` | Scale | Direction |
|---|---|---|---|
| English | `fleschKincaidGradeLevel` (+ `fleschReadingEase`) | grade | higher = harder |
| German | `wienerSachtextformel4` | grade approx 4 to 15 | higher = harder |
| Spanish | `fleschSzigriszt` | 0 to 100 | higher = easier |
| Italian | `gulpease` | 0 to 100 | higher = easier |
| Swedish | `lix` | open index | higher = harder |
| Danish | `lix` | open index | higher = harder |
| Norwegian Bokmal (`nb`) | `lix` | open index | higher = harder |
| Norwegian (`no`), Nynorsk (`nn`) | none (`unsupported_language`) | n/a | n/a |

Display names: `fleschKincaidGradeLevel` -> "Flesch-Kincaid grade",
`fleschReadingEase` -> "Reading Ease", `wienerSachtextformel4` -> "Wiener
Sachtextformel", `fleschSzigriszt` -> "Flesch-Szigriszt", `gulpease` ->
"Gulpease", `lix` -> "LIX". English returns two kinds (grade plus Reading
Ease); each other language returns exactly one. For English, the primary score
is the Flesch-Kincaid grade: band the reading level from it and treat Reading
Ease (an inverted 0-to-100 ease scale) as a supplemental display value only,
never the band source. Reading values are never percentages.

Reading-level band guide (for the "Band:" label in `SKILL.md` Step 4):

| Band | en FK grade | de Wiener | es Szigriszt (high=easy) | it Gulpease (high=easy) | sv/da/nb LIX (high=hard) |
|---|---|---|---|---|---|
| Elementary | 3 to 5 | 4 to 5 | 80 to 100 | 80 to 100 | below 30 |
| Middle school | 6 to 8 | 6 to 8 | 65 to 80 | 60 to 80 | 30 to 40 |
| High school | 9 to 11 | 9 to 11 | 55 to 65 | 40 to 60 | 40 to 50 |
| College | 12 to 14 | 12 to 14 | 40 to 55 | 20 to 40 | 50 to 60 |
| Graduate | 15+ | 15+ | below 40 | below 20 | 60+ |

Band assignment is deterministic. Range-membership scales (`fleschSzigriszt`,
`gulpease`, `lix`) treat each range as lower-bound inclusive and upper-bound
exclusive with open-ended outer bands. A boundary value belongs to the band that
has it as its lower bound (the band covering the numerically higher scores):
LIX `40` is High school (40-50), not Middle (30-40); es Szigriszt `80` is
Elementary (80-100), not Middle (65-80). Grade scales
(`fleschKincaidGradeLevel`, `wienerSachtextformel4`) label a score that lands
between two ranges by the nearest band midpoint, ties to the higher band
(FK `11.5` -> College).

Language code: always pass a normalized BCP-47 code when known. Norwegian
Bokmal is `nb`; always remap a detected or user-supplied `no` (macro) to `nb`
before any tool call (the app returns `unsupported_language:no` even though
Bokmal text scores correctly under `nb`). Never pass `no` to `detect_text` or
`analyze_readability`. Passing `nn` (Nynorsk) to `analyze_readability` returns
`unsupported_language:nn` with empty scores; passing it to `detect_text`
returns `kind: "not_english"` with a null score (same as any non-English
language).

`scores[]` can be **empty**. Read `warnings`:

- `unsupported_language:<code>`: the language is not supported; no score is
  available. Report "Readability not available for <language> in this app
  version."
- `insufficient_text:NN`: a soft warning for short input; scores are usually
  still present (treat as advisory). If the entry is truly absent, report "Not
  enough text to score reliably (insufficient_text:NN)." and do not invent one.
- `approximate_syllable_counts:<lang>`: benign (syllable-based formulas: en,
  es, de). Do not surface it as an error.

Detector language: `detect_text` returns `kind: "result"` for English and
`kind: "not_english"` for non-English input. For `not_english`, `score` and
`verdict` are null but the `readability` block is still populated. Never invent
an AI score for non-English input.

(Kinds and ranges verified against MCP v1.0.9 on 2026-05-29.)

## 3. MCP tools

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
- Output: `kind` (`"result"` for English, `"not_english"` for non-English),
  `verdict` (plain string, e.g. `"real"`; `null` when `not_english`), `score`
  (number 0-1; `null` when `not_english`), `language` (string), `sentence_count`
  (integer), `generator` (string or null), `readability` (object or null). The
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
  `{kind, value}`; the `kind` depends on the language, see section 2),
  `avg_words_per_sentence`, `sentence_count`, `word_count`, `warnings`
  (may include `unsupported_language:<code>`, `insufficient_text:NN`, or
  `approximate_syllable_counts:<lang>`).

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

## 4. CLI subcommands

Binary path inside the signed app bundle:

```text
/Applications/Slop Or Not.app/Contents/MacOS/slop
```

The path contains spaces; always quote it. Prefer this absolute path over
`slop` from PATH. See `slop-setup.md` for setup and client registration.

Common flags: `--json` (emit JSON), `-l, --language <code>` (override
language, e.g. `en`, `de`).

| Subcommand | Stdin | Purpose | Pro-gated |
|---|---|---|---|
| `slop status --json` | none | presence + `pro` + `version` | no |
| `slop text --json` | UTF-8 text | AI text detection + readability | yes |
| `slop readability --json` | text | readability only | yes |
| `slop cleanup --json` | text | strip AI artifacts | yes |
| `slop image --json` | raw image bytes | AI image detection | yes |
| `slop score-image --json` | raw image bytes | raw OmniAID image score | yes |
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

`slop readability --json`: same `readability.scores[]` shape. Read the entry's
`kind` and `value`; do not assume `fleschKincaidGradeLevel` (the kind depends on
the language, see section 2). Pass `-l, --language <code>` to set the language
(Norwegian Bokmal is `nb`). The CLI wraps the scores under `readability`, and
the word/sentence counts live under `readability.stats`. If `scores[]` is empty,
read `readability.warnings[]`; warning objects use camelCase types such as
`insufficientText` or `unsupportedLanguage` and may include `wordCount`.

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

`slop score-image --json`:

```json
{ "rawSlopScore": 0.62939453125 }
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
This is an on-device Slop or Not Pro status probe. It has enough sentences to
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
| text-detect | `detect_text` (`include_readability: true`, optional `language_code`) | `"/Applications/Slop Or Not.app/Contents/MacOS/slop" text --json [-l <code>]` (stdin) | MCP `score` / `verdict` (both null when `kind: not_english`); CLI `detection.result._0` / `._1` |
| image-detect | `detect_image` (base64) | `"/Applications/Slop Or Not.app/Contents/MacOS/slop" image --json < file` | `verdict`, `score` / `detection.result` |
| image-score (explicit OmniAID only) | `score_image` (base64) | `"/Applications/Slop Or Not.app/Contents/MacOS/slop" score-image --json < file` | MCP `raw_slop_score`; CLI `rawSlopScore` |
| readability | `analyze_readability` (+ optional `language_code`) | `"/Applications/Slop Or Not.app/Contents/MacOS/slop" readability --json [-l <code>]` (stdin) | `scores[]` (read the returned `kind`, not always FK; see section 2); `warnings[]` for unsupported or short input |
| cleanup | `clean_text` | `"/Applications/Slop Or Not.app/Contents/MacOS/slop" cleanup --json` (stdin) | MCP `cleaned_text` + counts; CLI `cleanedText` + count arrays |
| status | `slop_status` + `detect_text` proof probe | `"/Applications/Slop Or Not.app/Contents/MacOS/slop" status --json` + text proof probe | health/version plus Pro-gated probe success |

Image input: MCP needs base64 (`base64 -i <path>`); the CLI reads raw bytes
from the path through shell redirection. For local image paths, prefer CLI
when shell commands are available.
