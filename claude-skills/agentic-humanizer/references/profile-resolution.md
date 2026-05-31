# Profile resolution: detected language vs saved profile

`SKILL.md` Step 3 resolves the rewrite settings (language, variant,
`reading_level`, `target_grade`, tone, `length_policy`) in this order: inline
overrides (rule 1), `skip-interview` (rule 2), saved profile (rule 3), then the
harness interview (rule 4). Rules 1, 2, and 4 stay in `SKILL.md`. This file
expands rule 3, the densest case: a saved profile is present and the source
language was detected unambiguously as something other than the profile's
language.

## When this table applies

Only under rule 3, with a saved profile present and `detected_language` resolved
unambiguously. If `detected_language` equals the profile's `language`, or
detection is ambiguous, use the profile silently and skip the interview (never
re-prompt a user who already has a profile unless they ask). Every row below
also never prompts, never rewrites the saved profile, and adds the
language-mismatch note for Step 7.

## Language and variant

| Inline on this call | Resolved language L | Resolved variant |
|---|---|---|
| `language=` (with or without `variant=`) | the inline language (wins over detection and the profile) | inline `variant=` when its base language matches L, else L's registry default variant from `references/multilingual.md` (`other:<code>` for an unsupported L, for example `other:fr`, never the bare code) |
| `variant=` only (no `language=`) | base language inferred from the variant's BCP-47 prefix (`other` when the prefix is unsupported) | the inline variant |
| neither | `detected_language` (detection wins over the profile) | `detected_variant_hint` when it is a valid variant for L, else L's registry default variant |

## Reading level, tone, length

| Key | Source |
|---|---|
| `reading_level` | inline `level=` when given; for English only, an explicit `grade=N` also maps to its band. `grade=` is an English-only Flesch-Kincaid target, so it is ignored for non-English L (use `level=` there). Otherwise the profile's value. The band is language-agnostic; map it to L's metric via `references/multilingual.md`. |
| `tone` | inline `tone=` when given, else the profile's value |
| `length_policy` | inline `length=` when given, else the profile's value |

## target_grade (English only)

`target_grade` drives the English termination check and is `null` for every
other language.

- When L is English, derive `target_grade` from the resolved `reading_level`
  band midpoint (elementary 4, middle 7, high_school 10, college 13,
  graduate 17) unless an inline `grade=` was given, which wins. A saved
  non-English profile stores `target_grade: null`, so it must be derived here
  whenever the resolved language is English.
- When L is not English, leave `target_grade` as `null`; the loop reads
  `reading_level` and maps it via the registry.

After resolving, do not prompt and do not rewrite the saved profile. Carry the
language-mismatch note into Step 7 (see the Language line rules there).
