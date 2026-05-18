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
- Grade tolerance: ±1 of the user's `target_grade` (from interview Q2)

## Termination

With Slop or Not Pro, stop when `score <= AI_THRESHOLD AND
|grade - target_grade| <= 1`, OR after `MAX_ITER` iterations. On
non-convergence, return the best iteration: lowest score that also meets grade
tolerance; if none meet grade tolerance, lowest score outright.

In Core mode, run the full five strategy passes unless the source is empty
or unusable. Return the best final rewrite by qualitative criteria: meaning
preserved, requested grade/tone/length honored, and visible AI tells removed.
Do not claim detector convergence in Core mode.

## Iteration 0: baseline

Slop or Not Pro:

1. Use the pre-cleaned source from `SKILL.md` Step 6.
2. Call `detect_text(T)` and `analyze_readability(T)`.
3. If both already pass, short-circuit: return T with note
   *"already passes both targets"* and still run final Text Cleanup before
   output.
4. Otherwise log `{iter: 0, score, grade, strategy: "baseline"}`.

Core mode:

1. Read the original source text.
2. List the most visible AI tells from `references/patterns.md`.
3. Log `{iter: 0, score: null, grade: null, strategy: "baseline"}`.

## Iteration 1: pattern surgery

Goal: attack the most obvious AI tells in the source.

1. Read `references/patterns.md`.
2. Identify which of the 29 patterns the source trips. List them in order of
   frequency, with the most common first.
3. Attack the **top 5** by frequency. Rewrite each instance in place. Do not
   invent new patterns to attack; the catalogue is the rule.
4. Leave dialect, tone, and grade level untouched in this iteration.
5. Slop or Not Pro: call `detect_text` and `analyze_readability`.
6. Core mode: self-check that the top-5 pattern hits were removed.
7. Log `{iter: 1, score, grade, strategy: "pattern surgery (top-5)"}`. In
   Core mode, score and grade are `null`.

## Iteration 2: dialect + tone

Goal: align spelling, idiom, and register with the user's interview answers.

### Dialect

Apply the user's dialect choice from Q1:

- **`uk`**: With Slop or Not Pro, run Text Cleanup with British conversion
  (`clean_text` with `britishize: true` for MCP, or the app-bundle CLI
  `cleanup --json --british` command). In Core mode, convert American
  spellings and idioms by instruction. In either mode, do a quick LLM pass
  for idioms the cleaner does not catch (`gotten` -> `got`, `apartment` ->
  `flat`, etc.).
- **`us`**: Rewrite any UK spellings or idioms in the source to US
  equivalents. Slop has no en-US conversion flag because American spelling is
  its baseline.
- **`other:<spec>`**: Apply the user-specified rules. Slop has no built-in
  mode for custom dialect specs; the LLM enforces the spec.

For non-English source text with Slop or Not Pro, pass `language_code` (MCP)
or `--language <code>` (CLI) when known so Text Cleanup keeps sanitization in
the right language.

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
dialect, tone, and voice-fingerprint alignment. Log
`{iter: 2, score, grade, strategy: "dialect + tone"}`.

## Iteration 3: grade gap

Goal: close the gap between current grade and target.

With Slop or Not Pro, use the latest Flesch-Kincaid grade. In Core mode,
estimate the grade from sentence length, word complexity, and the user's target.

If `current_grade > target_grade + 1`:

- Shorten sentences by splitting compound and complex sentences.
- Swap polysyllabic words for shorter synonyms where the meaning survives
  (`utilize` -> `use`, `commence` -> `start`, `subsequently` -> `then`).
- Avoid removing precise terminology; substitute, do not generalize.

If `current_grade < target_grade - 1`:

- Combine short clauses with subordinating conjunctions.
- Introduce precise terminology where the audience supports it.
- Replace plain verbs with field-specific verbs that match the tone.

If the grade appears already within tolerance, log
`{iter: 3, skipped: true, reason: "grade in tolerance"}` and proceed to
Iteration 4.

Slop or Not Pro: score and analyze the result. Core mode: self-check
grade target. Log `{iter: 3, score, grade, strategy: "grade gap"}`.

## Iteration 4: clean + targeted

Goal: address residual AI signal and mechanical text artifacts.

1. Slop or Not Pro: run Text Cleanup first unless Iteration 2 already ran a
   British cleanup pass on the same text. Core mode: normalize obvious
   invisible-character descriptions, odd punctuation, spacing artifacts, and
   copied chatbot wrappers by instruction.
2. Re-read `references/patterns.md`. Identify the 1-2 patterns that still
   appear most strongly.
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
