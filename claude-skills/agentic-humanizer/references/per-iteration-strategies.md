# Per-Iteration Strategy Cookbook

`SKILL.md` reads this file at the start of every loop invocation. It tells the
rewriter what to attack on each iteration in Core mode and with Slop or Not
Pro. Each iteration MUST target a different axis; repeating the same axis twice
in a row produces oscillation, not convergence.

## Loop modes

- **Core mode:** run all rewrite strategies without `detect_text`,
  `analyze_readability`, or `clean_text`. Log score and grade as `null`.
- **Slop or Not Pro:** run Text Cleanup, detection, and readability checks as
  described in `SKILL.md`.

Voice matching is independent of Slop availability. If `voice_active=true`,
use the cached fingerprint in Iteration 2 and Iteration 5 in either mode.

## Loop constants

- `AI_THRESHOLD = 40` (override: `threshold=N`, Slop or Not Pro only)
- `MAX_ITER = 5` (override: `max=N`, Slop or Not Pro only)
- Grade tolerance: ±1 (English: of `target_grade` from interview Q2 or inline
  `grade=`/`level=`; non-English grade scales: of the target band midpoint in
  `references/multilingual.md`)

## Termination

The orchestrator resolves a language L and branches loading and termination
(see `SKILL.md` Step 6); the schedule below composes with that branch.

For **English** with Slop or Not Pro, stop when `score <= AI_THRESHOLD AND
|grade - target_grade| <= 1`, OR after `MAX_ITER` iterations. On non-convergence,
return the best iteration: lowest score that also meets grade tolerance; if none
meet grade tolerance, lowest score outright.

For **supported non-English** (es, de, it, sv, da, nb) with Slop or Not Pro,
there is no AI threshold (the AI score is `n/a`). Stop when the readability score
for L's formula lands in the target band (per the scale semantics in
`references/multilingual.md`), OR after `MAX_ITER`. On non-convergence, return
the iteration closest to the target band.

In **Core mode**, and for **Nynorsk or unsupported languages** in any mode, run
the full five strategy passes unless the source is empty or unusable. Return the
best final rewrite by qualitative criteria: meaning preserved, requested reading
level, tone, and length honored, and visible AI tells removed. Do not claim
detector convergence.

**Language note (composes with this schedule).** All five iterations run for
every language. Wherever an iteration below names `references/patterns.md`, that
catalogue is English only and is not loaded for other languages. For supported
non-English L (es, de, it, sv, da, nb), substitute `references/ai-tells/<L>.md`
(Norwegian Bokmal and Nynorsk both use `references/ai-tells/no.md`), read
alongside `references/supplemental-ai-tells.md`. For Nynorsk (nn) and
unsupported languages there is no per-language tell file: read
`references/supplemental-ai-tells.md` only (plus the Nynorsk section of
`references/ai-tells/no.md` for nn), matching `SKILL.md` Step 6's
unsupported-language branch. On non-English Slop or Not Pro calls, pass the
normalized `language_code` and never pass `britishize`. Read readability by the
returned `kind` and map it to a band via `references/multilingual.md` (see
`SKILL.md` Step 6).

Wherever an iteration below calls `detect_text` or says to "score and analyze,"
that full detector path is English only. For supported non-English L (es, de, it,
sv, da, nb), "score" means `analyze_readability` alone: do not call `detect_text`
(it returns `kind: "not_english"` with a null score, adding nothing). For Nynorsk
(nn) and unsupported languages, skip both `detect_text` and `analyze_readability`
(no readability is available) and self-assess as in Core mode.

## Iteration 0: baseline

Slop or Not Pro:

1. Use the pre-cleaned source from `SKILL.md` Step 6.
2. For English, call `detect_text(T)` and `analyze_readability(T)`. For
   supported non-English, call `analyze_readability(T)` only (the AI score is
   n/a, so `detect_text` adds nothing). For Nynorsk or unsupported, skip both
   (no readability is available).
3. Short-circuit if the resolved language's targets already pass: for English,
   both `score <= AI_THRESHOLD` and `|grade - target_grade| <= 1`; for supported
   non-English, the readability score already lands in the target band (the AI
   score is n/a, so readability alone is the gate). Return T with the note
   (English *"already passes both targets"*; non-English *"already in the target
   readability band"*) and still run final Text Cleanup before output. Nynorsk
   and unsupported languages have no measurable target here and never
   short-circuit.
4. Otherwise log `{iter: 0, score, grade, strategy: "baseline"}`.

Core mode:

1. Read the original source text.
2. List the most visible AI tells from `references/patterns.md` (English; for
   non-English L substitute `references/ai-tells/<L>.md`, per the language note
   above) and `references/supplemental-ai-tells.md`.
3. Log `{iter: 0, score: null, grade: null, strategy: "baseline"}`.

## Iteration 1: pattern surgery

Goal: attack the most obvious AI tells in the source.

1. Read `references/patterns.md` and `references/supplemental-ai-tells.md` (for
   non-English L, use `references/ai-tells/<L>.md` in place of `patterns.md`,
   per the language note above).
2. Identify which canonical patterns and supplemental tells the source trips.
   List them in order of frequency, with the most common first.
3. Attack the **top 5** by frequency. Rewrite each instance in place. Do not
   invent new patterns to attack; the catalogues are the rule. For
   supplemental source-integrity tells, remove obvious wrapper artifacts but
   do not invent missing facts, citations, or verification.
4. Leave dialect, tone, and grade level untouched in this iteration.
5. Slop or Not Pro: call `detect_text` and `analyze_readability`.
6. Core mode: self-check that the top-5 pattern hits were removed.
7. Log `{iter: 1, score, grade, strategy: "pattern surgery (top-5)"}`. In
   Core mode, score and grade are `null`.

## Iteration 2: variant + tone

Goal: align spelling, idiom, and register with the user's interview answers.

### Variant

Apply the user's language and variant choice from Q1:

- **English `en-GB` (uk)**: With Slop or Not Pro, run Text Cleanup with British
  conversion (`clean_text` with `britishize: true` for MCP, or the app-bundle
  CLI `cleanup --json --british` command). The `britishize` flag is English
  only; never pass it for any other language. In Core mode, convert American
  spellings and idioms by instruction. In either mode, do a quick LLM pass for
  idioms the cleaner does not catch (`gotten` -> `got`, `apartment` -> `flat`,
  etc.).
- **English `en-US` (us)**: Rewrite any UK spellings or idioms in the source to
  US equivalents. Slop has no en-US conversion flag because American spelling is
  its baseline.
- **English `other:<spec>`**: Apply the user-specified rules. Slop has no
  built-in mode for custom dialect specs; the LLM enforces the spec.
- **Non-English (es, de, it, sv, da, nb, nn)**: Do NOT pass `britishize`. Apply
  LLM-side variant rules (German de-DE vs de-AT vs de-CH; Spanish es-ES vs
  es-419; Norwegian Bokmal nb vs Nynorsk nn). See `references/multilingual.md`.

For non-English source text with Slop or Not Pro, pass `language_code` (MCP)
or `--language <code>` (CLI) so Text Cleanup keeps sanitization in the right
language.

### Tone

Apply the user's tone choice from Q3:

- **`casual`**: contractions allowed, shorter sentences, conversational openers.
- **`professional`**: full forms, neutral verbs, no slang.
- **`academic`**: passive voice acceptable, hedged claims, citations where
  appropriate, terminology preferred over plain words.

If a voice fingerprint is cached, append `register`, `contraction_use`,
`hedge_use`, and `function_word_habits` from `references/voice-fingerprint.md`
to the tone-alignment instruction. The voice fingerprint takes precedence over
`tone=` only for register-level conflicts. It does not override the user's task
intent.

Do not retarget grade level in this iteration.

Slop or Not Pro: score and analyze the result. Core mode: self-check
variant, tone, and voice-fingerprint alignment. Log
`{iter: 2, score, grade, strategy: "variant + tone"}`.

## Iteration 3: grade gap

Goal: close the gap between current grade and target.

With Slop or Not Pro, read the latest readability score from `scores[]` for the
resolved language L (read the `kind` and `value`; do not assume Flesch-Kincaid)
and map it to the target band via `references/multilingual.md`. In Core mode, or
for Nynorsk and unsupported languages, estimate the level from sentence length,
word complexity, and the target band. English uses a direct grade; other scales
compare against the band range, noting that the es Szigriszt and it Gulpease
ease scales invert (higher = easier) while sv/da/nb LIX is a difficulty index
(higher = harder).

If the text is harder than the target band (en and de grade scales:
`current_grade` above the band's upper edge; sv/da/nb LIX above the band; es
Szigriszt and it Gulpease ease scales below the band):

- Shorten sentences by splitting compound and complex sentences.
- Swap polysyllabic words for shorter synonyms where the meaning survives
  (`utilize` -> `use`, `commence` -> `start`, `subsequently` -> `then`).
- Avoid removing precise terminology; substitute, do not generalize.

If the text is easier than the target band (grade scales: `current_grade` below
the band's lower edge; LIX below the band; ease scales above the band):

- Combine short clauses with subordinating conjunctions.
- Introduce precise terminology where the audience supports it.
- Replace plain verbs with field-specific verbs that match the tone.

If the readability already lands in the target band, log
`{iter: 3, skipped: true, reason: "readability in target band"}` and proceed to
Iteration 4.

Slop or Not Pro: score and analyze the result. Core mode: self-check
grade target. Log `{iter: 3, score, grade, strategy: "grade gap"}`.

## Iteration 4: clean + targeted

Goal: address residual AI signal and mechanical text artifacts.

1. Slop or Not Pro: run Text Cleanup first unless Iteration 2 already ran a
   British cleanup pass on the same text. Core mode: normalize obvious
   invisible-character descriptions, odd punctuation, spacing artifacts, and
   copied chatbot wrappers by instruction.
2. Re-read `references/patterns.md` (or `references/ai-tells/<L>.md` for
   non-English L, per the language note above) and
   `references/supplemental-ai-tells.md`. Identify the 1-2 patterns or tells
   that still appear most strongly.
3. Make targeted, small edits; do not retarget large sections of text in this
   iteration. The goal is residual signal, not bulk rewrite.
4. Slop or Not Pro: score and analyze the result. Core mode: self-check
   that the targeted patterns are gone.
5. Log `{iter: 4, score, grade, strategy: "clean + targeted"}`.

## Iteration 5: emergency surgery

Goal: convergence with Slop or Not Pro, and best-quality final polish in
Core mode. Apply structural changes that earlier iterations avoided.

1. Vary sentence openings: at least 4 of the first 5 sentences should begin
   with different parts of speech.
2. Break any remaining rule-of-three constructions (`fast, reliable, and
   secure` style); pick the strongest item, drop the others, or re-cast as a
   sentence.
3. If `length_policy` allows expansion: introduce one concrete example or
   anecdote-style sentence per paragraph that the source paragraphs support.
   AI text reads generic; specific examples read human. If a voice fingerprint
   is cached, draw phrasing cues from `idiom_inventory` and use
   `signature_openings` and `paragraph_rhythm` instead of generic phrasing. Do
   not import facts from the sample.
4. If `length_policy` is `±10`: trim filler from earlier iterations to make
   budget for the example, or skip the example if budget is unavailable.
5. Slop or Not Pro: score and analyze the result. Core mode: self-check
   sentence variety, specificity, length, and voice.
6. Log `{iter: 5, score, grade, strategy: "emergency surgery"}`.

## Mid-flight Pro-gate fallback

If `detect_text`, `analyze_readability`, or `clean_text` returns
`isError: true` (MCP) or non-zero exit with a Pro-required message (CLI) on any
iteration >= 1, fall through to Core mode for the remaining iterations:

1. Skip the score, grade, and Text Cleanup calls for remaining iterations.
2. Apply the iteration's strategy as planned with Core-mode equivalents for
   cleanup, British conversion, and residual pattern checks.
3. If `voice_active=true`, keep using the cached fingerprint for Iteration 2
   and Iteration 5.
4. The LLM self-assesses whether the patterns it attacked are gone.
5. Log `{iter: N, score: null, grade: null, strategy: "<name>", note:
   "Core-mode fallback"}`.
6. In the final output's history table, render score and grade columns as
   `n/a` for fallback iterations and add the footer note from `SKILL.md`.
