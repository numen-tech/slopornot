# Multilingual Readability Registry

Single source of truth for multilingual support in the agentic-humanizer skill:
supported languages, BCP-47 variants, the readability formula the app returns
per language, the 5-band reading-level mapping, termination semantics per scale,
and code-normalization rules.

`SKILL.md` reads this file at the start of Step 6 whenever the resolved language
is not English. `references/per-iteration-strategies.md` consults it for the
Iteration 3 grade-gap logic. `references/ai-tells/<code>.md` files hold the
language-specific tells.

Verified against MCP v1.0.9, app connected, Pro active, 2026-05-29. Recalibrate
band ranges if the app version changes.

## Supported languages

| Language | Base code | BCP-47 variants | Readability kind | Scale direction | Tell file |
|---|---|---|---|---|---|
| English | `en` | `en-US`, `en-GB`, `other:<spec>` | `fleschKincaidGradeLevel` (+ `fleschReadingEase`) | grade: higher = harder; ease: higher = easier | (uses `patterns.md` + `supplemental-ai-tells.md`) |
| Spanish | `es` | `es-ES`, `es-419` | `fleschSzigriszt` | higher = easier (0 to 100) | `ai-tells/es.md` |
| German | `de` | `de-DE`, `de-AT`, `de-CH` | `wienerSachtextformel4` | higher = harder (approx 4 to 15) | `ai-tells/de.md` |
| Italian | `it` | `it-IT` | `gulpease` | higher = easier (0 to 100) | `ai-tells/it.md` |
| Swedish | `sv` | `sv` | `lix` | higher = harder | `ai-tells/sv.md` |
| Danish | `da` | `da` | `lix` | higher = harder | `ai-tells/da.md` |
| Norwegian Bokmal | `nb` | `nb` | `lix` | higher = harder | `ai-tells/no.md` |
| Norwegian Nynorsk | `nn` | `nn` | none (unsupported in app) | n/a | `ai-tells/no.md` (Nynorsk section) |

English returns two kinds (`fleschKincaidGradeLevel` and `fleschReadingEase`);
`fleschReadingEase` is informational and does not drive termination. Every
supported non-English language returns exactly one kind.

Formula display names (the single source for output labels): `fleschKincaidGradeLevel`
-> "Flesch-Kincaid grade", `fleschReadingEase` -> "Reading Ease",
`wienerSachtextformel4` -> "Wiener Sachtextformel", `fleschSzigriszt` ->
"Flesch-Szigriszt", `gulpease` -> "Gulpease", `lix` -> "LIX".

## Code normalization rules

Always pass a normalized BCP-47 code on MCP or CLI calls.

| Input or detected form | Normalized code to pass | Notes |
|---|---|---|
| `en`, `en-US`, `en-GB` | `en` | English, any variant |
| `de`, `de-DE`, `de-AT`, `de-CH` | `de` | German, any variant |
| `es`, `es-ES`, `es-419` | `es` | Spanish, any variant |
| `it`, `it-IT` | `it` | Italian |
| `sv` | `sv` | Swedish |
| `da` | `da` | Danish |
| `nb` | `nb` | Norwegian Bokmal |
| `no` (macro) | `nb` | The app treats `no` as unsupported; remap to `nb` |
| `nn` | `nn` | Nynorsk: unsupported for readability and detection (returns `not_english` with null score); tells-only |
| Any other code | as-is | Unsupported language (see policy below) |

Never pass `no`. The macro code returns `unsupported_language:no` even though
Bokmal text scores correctly under `nb`. Always normalize before the call.

## Reading-level band mapping

Five canonical bands. For grade scales (en FK, de Wiener) the target value is
the band midpoint; for 0-to-100 ease scales (es Szigriszt, it Gulpease) and LIX
the range itself is the target zone. Note the inverted direction for es and it
(higher = easier).

| Band | `reading_level` key | en FK grade | de Wiener (grade) | es Szigriszt (high=easy) | it Gulpease (high=easy) | sv/da/nb LIX (high=hard) |
|---|---|---|---|---|---|---|
| Elementary | `elementary` | 3 to 5 (target 4) | 4 to 5 (target 4) | 80 to 100 | 80 to 100 | below 30 |
| Middle school | `middle` | 6 to 8 (target 7) | 6 to 8 (target 7) | 65 to 80 | 60 to 80 | 30 to 40 |
| High school | `high_school` | 9 to 11 (target 10) | 9 to 11 (target 10) | 55 to 65 | 40 to 60 | 40 to 50 |
| College | `college` | 12 to 14 (target 13) | 12 to 14 (target 13) | 40 to 55 | 20 to 40 | 50 to 60 |
| Graduate | `graduate` | 15 and above (target 17) | 15 and above (target 15) | below 40 | below 20 | 60 and above |

**Band assignment (deterministic).** Published ranges can share an endpoint or
leave a gap, so apply these tie-break rules for both the loop-history band label
and band-range termination:

- Range-membership scales (`fleschSzigriszt`, `gulpease`, `lix`): treat each
  range as lower-bound inclusive and upper-bound exclusive, with the outermost
  bands open-ended. A boundary value belongs to the band that has it as its
  lower bound (the band covering the numerically higher scores): LIX `40` is
  High school (40-50), not Middle (30-40); es Szigriszt `80` is Elementary
  (80-100), not Middle (65-80).
- Grade scales (`fleschKincaidGradeLevel`, `wienerSachtextformel4`): a score that
  falls in a gap between two band ranges takes the nearest band midpoint, ties to
  the higher band (FK `11.5` -> College; de Wiener `11.5` -> College). This
  matches the `|score - band_midpoint| <= 1` termination test.

`reading_level` is stored in `profile.json` (v3). Numeric `target_grade` is
meaningful only for English; for other languages the loop reads `reading_level`
and maps via this table.

## Termination semantics per scale

The loop reads whatever numeric value `scores[]` returns, labels it by the
returned `kind`, and consults the band table.

- Grade scales (`fleschKincaidGradeLevel`, `wienerSachtextformel4`): terminate on
  `|score - band_midpoint| <= 1` (the existing plus-or-minus-1 tolerance applied
  to the target band midpoint, not a hardcoded `target_grade`). Open-ended
  Graduate band exception: Graduate has no upper edge and its midpoint sits at
  the band's lower edge, so terminate on range membership (`score >=` the
  Graduate lower edge) instead of the symmetric tolerance. For German Wiener,
  this range-membership rule applies unconditionally. For English FK, it applies
  when Graduate was selected as a band (via `level=graduate` or the interview,
  `target_grade` derived as 17); when an explicit inline `grade=N` was given
  (English only), keep the symmetric `|grade - target_grade| <= 1` tolerance so
  the explicit target is honored rather than collapsed to range membership.
  Range membership stops a College-level score (FK `14` or Wiener `14`,
  which `|14 - 15| <= 1` would otherwise accept) from satisfying a Graduate
  target, while still converging on scores harder than the midpoint. Non-graduate
  bands (elementary through college) still use `|score - band_midpoint| <= 1`.
- Ease scales (`fleschSzigriszt`, `gulpease`): terminate on band-range membership
  (the range is the tolerance). Higher means easier, so driving toward Elementary
  drives the score toward 100 and toward Graduate drives it toward 0.
- LIX (`lix`; sv, da, nb): terminate on band-range membership. Higher means
  harder; Elementary is below 30, Graduate is 60 and above.
- Unknown kind: log as advisory, do not terminate on readability, continue to
  MAX_ITER, and warn in Step 7.

## Norwegian notes

- Bokmal (`nb`): pass `language_code: "nb"`; the app returns LIX. Use the
  `ai-tells/no.md` Bokmal section.
- Nynorsk (`nn`): `detect_text` returns `kind: "not_english"` with a null score
  (AI score is `n/a`) and `analyze_readability` returns `unsupported_language:nn`
  with empty scores. Tells-only, no readability, no AI score, warn. Use the
  `ai-tells/no.md` Nynorsk section.
- Never pass `no`; remap to `nb` before any tool call.

## Unsupported-language policy

When the detected language is not in the table above (for example French, Dutch,
Japanese, Portuguese):

1. Do not load `patterns.md` (English vocabulary).
2. Do not load any per-language tell file (none exists).
3. Load `supplemental-ai-tells.md` (language-agnostic structural tells).
4. Apply LLM judgment with those structural tells.
5. Readability: if `scores[]` returns a known kind, log it as advisory without
   band termination; if empty, skip readability.
6. AI score: always `n/a`.
7. Warn clearly in Step 7: no curated tell catalogue or readability bands exist
   for that language; results are advisory.

**Variant fallback.** Unsupported codes have no row in the supported-languages
table and therefore no variant list, so the registry's "default variant" for any
unsupported code is `other:<code>` (for example `language=fr` resolves to
`variant: "other:fr"`). Resolution rules in `SKILL.md` that read the default
variant from this registry use this value for unsupported languages, so Step 7
display and profile writes always have a variant. The `other:<code>` form is the
profile and display variant only; on tool calls still pass the bare language code
(normalized as-is per the table above) as `language_code`, never `other:<code>`.

## Provenance

Score kinds and sample values verified empirically against MCP v1.0.9 with Pro
active, 2026-05-29. `insufficient_text:NN` is a soft warning (scores still
returned). `approximate_syllable_counts:<lang>` is benign (en, es, de).
Band ranges are adapted from published scale literature and calibrated against
sample values. Recalibrate if the app version changes; re-run
`analyze_readability` per language code with representative text.
