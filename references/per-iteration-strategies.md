# Per-Iteration Strategy Cookbook

`SKILL.md` reads this file at the start of every loop invocation that has
slop reachable. It tells the rewriter what to attack on each iteration.
Each iteration MUST target a different axis — repeating the same axis
twice in a row produces oscillation, not convergence.

## Loop constants

- `AI_THRESHOLD = 30` (override: `threshold=N`)
- `MAX_ITER = 5` (override: `max=N`)
- Grade tolerance: ±1 of the user's `target_grade` (from interview Q2)

## Termination

Stop when `score ≤ AI_THRESHOLD AND |grade − target_grade| ≤ 1`, OR after
`MAX_ITER` iterations. On non-convergence, return the *best* iteration:
lowest score that also meets grade tolerance; if none meet grade tolerance,
lowest score outright.

## Iteration 0 — baseline

Call `detect_text(T)` and `analyze_readability(T)` on the source text.
If both already pass, short-circuit: return T with note
*"already passes both targets"*. Skip iterations 1–5.

Otherwise log `{iter: 0, score, grade, strategy: "baseline"}` and proceed.

## Iteration 1 — pattern surgery

Goal: knock the AI score down by attacking the most obvious AI tells in
the source.

1. Read `references/patterns.md`.
2. Identify which of the 29 patterns the source trips. List them in
   order of frequency (most occurrences first).
3. Attack the **top 5** by frequency. Rewrite each instance in place.
   Do not invent new patterns to attack — the catalogue is the rule.
4. Leave dialect, tone, and grade level untouched in this iteration.
5. Call `detect_text` and `analyze_readability` on the rewritten text.
6. Log `{iter: 1, score, grade, strategy: "pattern surgery (top-5)"}`.

## Iteration 2 — dialect + tone

Goal: align spelling, idiom, and register with the user's interview answers.

### Dialect

Apply the user's dialect choice from Q1:

- **`british`** (UK English): pipe the current text through
  `slop cleanup --british` (CLI) or call `clean_text` with the British
  variant flag (MCP). The slop CLI's `--british` flag converts American
  spellings to British in one pass — `colour`, `realise`, `whilst`,
  `aluminium`, etc. — while also stripping invisibles, fancy punctuation,
  and homoglyphs. After the pipe, do a quick LLM pass for idioms the
  cleaner doesn't catch (`gotten` → `got`, `smart` → `clever` in UK
  contexts, `apartment` → `flat`, etc.).

- **`american`** (US English): the slop CLI has no en-US conversion
  flag (American is its baseline). The LLM rewrites any UK spellings or
  idioms in the source to US equivalents.

- **`other:<spec>`**: apply the user-specified rules. The slop CLI
  has no built-in mode; the LLM enforces the spec.

For non-English source text, pass `--language <code>` (e.g.,
`slop cleanup --language de` for German) to keep slop's text
sanitisation working in the right language.

### Tone

Apply the user's tone choice from Q3:

- **`casual`**: contractions allowed, shorter sentences, conversational openers.
- **`professional`**: full forms, neutral verbs, no slang.
- **`academic`**: passive voice acceptable, hedged claims, citations
  where appropriate, terminology preferred over plain words.

Do not retarget grade level in this iteration.

Log `{iter: 2, score, grade, strategy: "dialect + tone"}`.

## Iteration 3 — grade gap

Goal: close the gap between current Flesch-Kincaid grade and target.

If `current_grade > target_grade + 1`:
- Shorten sentences (split compound and complex sentences at conjunctions).
- Swap polysyllabic words for shorter synonyms where the meaning
  survives (`utilize → use`, `commence → start`, `subsequently → then`).
- Avoid removing precise terminology — substitute, do not generalize.

If `current_grade < target_grade − 1`:
- Combine short clauses with subordinating conjunctions.
- Introduce precise terminology where the audience supports it.
- Replace plain verbs with the field-specific verbs that match the tone.

If `current_grade` is already within tolerance, log
`{iter: 3, skipped: true, reason: "grade in tolerance"}` and proceed
to Iteration 4.

## Iteration 4 — clean + targeted

Goal: address residual detection signal, including hidden-character tricks
that homoglyph cleaners catch.

1. Run `clean_text(current)` first — strips zero-width spaces,
   right-to-left marks, and homoglyph substitutions that bias detectors.
   (Skip if Iteration 2 already ran `slop cleanup --british`, which
   includes the same sanitisation by default.)
2. Re-read `references/patterns.md`. Identify the 1–2 patterns that are
   still flagging the highest detect_text contribution (the LLM
   estimates this from the latest score and the rewritten text).
3. Make targeted, small edits — do not retarget large sections of text
   in this iteration. The goal is residual signal, not bulk rewrite.
4. Log `{iter: 4, score, grade, strategy: "clean + targeted"}`.

## Iteration 5 — emergency surgery

Goal: convergence on the last iteration. Apply structural changes that
earlier iterations avoided.

1. Vary sentence openings — at least 4 of the first 5 sentences should
   begin with different parts of speech.
2. Break any remaining rule-of-three constructions
   (`fast, reliable, and secure` style) — pick the strongest item, drop
   the others, or re-cast as a sentence.
3. If `length_policy` allows expansion: introduce one concrete example
   or anecdote-style sentence per paragraph that the source paragraphs
   support. AI text reads generic; specific examples read human.
4. If `length_policy` is `Keep within ±10%`: trim filler from earlier
   iterations to make budget for the example, OR skip the example if
   budget is unavailable.
5. Log `{iter: 5, score, grade, strategy: "emergency surgery"}`.

## Mid-flight Pro-gate fallback

If `detect_text`, `analyze_readability`, or `clean_text` returns
`isError: true` (MCP) or non-zero exit with a Pro-required message
(CLI) on any iteration ≥ 1, fall through to **LLM-only mode** for the
remaining iterations:

1. Skip the score and grade calls.
2. Apply the iteration's strategy as planned (skip the slop pipes —
   use LLM-only equivalents for `slop cleanup --british` and
   `clean_text`).
3. The LLM self-assesses whether the patterns it attacked are gone.
4. Log `{iter: N, score: null, grade: null, strategy: "<name>",
   note: "LLM-only fallback"}`.
5. In the final output's history table, render score and grade columns
   as `—` for fallback iterations and add a footer note:
   *"Iterations N–M ran without on-device scoring. Install Slop or Not
   Pro to measure the loop end-to-end."*
