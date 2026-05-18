# Voice Fingerprint Reference

`SKILL.md` reads this file from Step 4 when voice matching is enabled.
`references/per-iteration-strategies.md` also points here from Iteration 2
and Iteration 5. The goal is a compact stylometric fingerprint, not a raw
sample pasted into every rewrite prompt.

## When this file applies

Use this reference when the user has not disabled voice matching with
`voice=off` or `voice-skip`. Voice matching does not require Slop or Not;
it runs through the host LLM and can guide both Core-mode rewrites and rewrites
that use Slop or Not Pro.
The fingerprint can be created from either:

- `~/.agentic-humanizer/voice.txt`
- an inline `voice=/path/to/file.txt` override
- the sample captured after conditional interview Q5

The cached fingerprint is advisory. If extraction fails, the normal
5-iteration workflow still runs without voice matching.

## Privacy

The voice sample lives at `~/.agentic-humanizer/voice.txt` (or whichever
path the user passes inline) and is read fresh from disk on each run.
The fingerprint cache lives at `~/.agentic-humanizer/voice-fingerprint.json`.
Neither file is uploaded by the skill. Fingerprint extraction runs through
whatever LLM the host harness provides, so the *sample text* travels with
that LLM's normal request path: local-only if the harness is local, cloud
if it is cloud-based. Tell the user this honestly when they opt in. Do
not copy private facts, names, or anecdotes from the sample into the
fingerprint itself; the extraction prompt enforces this.

## Sample-size policy

- **Recommended:** 200+ words. Grammarly's Humanizer custom-voice flow asks
  for a writing sample of 200 words or more as a style reference:
  <https://support.grammarly.com/hc/en-us/articles/38552339652109-Humanizer-user-guide>.
- **Soft warn:** 50-199 words. Tell the user that 200+ words works better,
  then let them continue or paste a longer sample.
- **Hard reject:** under 50 words. This is roughly 3-10 sentences, and that
  is too thin to infer stable sentence rhythm, function-word habits, and
  paragraph structure.
- **Extraction cap:** use only the first 3000 words. Store the full sample,
  but cap extraction so long files do not crowd out the rewrite task.

The arXiv paper "Catch Me If You Can? Not Yet" submitted on September 18,
2025 evaluates style imitation from user-authored samples and finds that
LLMs can approximate some structured styles but still struggle with nuanced
everyday writing: <https://arxiv.org/abs/2509.14543>. This is why the skill
extracts explicit stylometric fields once instead of passing raw samples to
every rewrite.

## Extraction prompt

Run this prompt against the host LLM with the accepted sample, truncated to
the first 3000 words. Replace placeholders before running.

```text
You are a forensic writing-style analyst creating a reusable voice
fingerprint for a rewrite loop.

<task>
Analyze the writing sample and extract stable style traits. Return JSON
only. The JSON must match the schema exactly. Populate every field under
`fingerprint`. Leave the top-level metadata fields (`version`,
`sample_path`, `sample_hash`, `sample_word_count`, `extracted_at`,
`extracted_by`) as `null`; the orchestrator fills these in after
extraction.
</task>

<constraints>
- Focus on style, not topic.
- Do not copy private facts, names, claims, or anecdotes from the sample.
- Prefer observable habits over generic labels.
- Keep every string short enough to reuse in a prompt.
- If a trait is not visible, write "not enough evidence" for that field.
- Every field under `fingerprint` is required. Do not omit fields.
</constraints>

<fields_to_watch>
Sentence length and variance, paragraph rhythm, openings and closings,
function words, contractions, hedges, punctuation, idioms, register, and
phrases the rewrite should avoid.
</fields_to_watch>

The two examples below show every field populated. Your output must match
this completeness, then be wrapped in the full schema (with metadata
fields null).

<example>
Sample traits: short paragraphs, direct openings, frequent "I think",
light contractions, plain verbs.
{
  "voice_summary": "plainspoken and direct, with light first-person framing",
  "avg_sentence_length": "8-14 words",
  "sentence_length_variance": "medium; mixes short claims with one longer follow-up",
  "signature_openings": ["I think", "Here is the part", "What surprised me"],
  "signature_closings": ["worth a try", "for what it is worth"],
  "function_word_habits": "uses I, this, and but to steer the argument; few therefores",
  "punctuation_quirks": "rare semicolons; uses parenthetical asides; one exclamation per essay max",
  "register": "casual",
  "contraction_use": "medium",
  "hedge_use": "low",
  "idiom_inventory": ["worth a try", "the part where", "a small thing but"],
  "paragraph_rhythm": "short paragraphs of 2-3 sentences; one-line pivots between scenes",
  "do_list": ["keep verbs plain", "use first person when the source supports it"],
  "dont_list": ["do not sound promotional", "do not over-polish casual phrasing"]
}
</example>

<example>
Sample traits: formal clauses, hedged claims, semicolons, careful
transitions, low contractions.
{
  "voice_summary": "measured academic prose with cautious claims",
  "avg_sentence_length": "18-28 words",
  "sentence_length_variance": "low; mostly balanced multi-clause sentences",
  "signature_openings": ["In this context", "This suggests", "The evidence indicates"],
  "signature_closings": ["remains an open question", "warrants further study"],
  "function_word_habits": "uses therefore, however, and which for explicit links",
  "punctuation_quirks": "frequent semicolons; parenthetical citations; almost no exclamation marks",
  "register": "academic",
  "contraction_use": "low",
  "hedge_use": "high",
  "idiom_inventory": ["warrants further study", "an open question", "a body of work"],
  "paragraph_rhythm": "long paragraphs of 5-8 sentences; topic sentence followed by hedged elaboration",
  "do_list": ["preserve hedges", "use precise nouns"],
  "dont_list": ["do not add slang", "do not strengthen unsupported claims"]
}
</example>

<schema>
{
  "version": 1,
  "sample_path": "<sample-path>",
  "sample_hash": "<sha256-prefixed-hash>",
  "sample_word_count": <word-count>,
  "extracted_at": "<utc-iso8601>",
  "extracted_by": "<harness>:<model-id>",
  "fingerprint": {
    "voice_summary": "...",
    "avg_sentence_length": "12-18 words",
    "sentence_length_variance": "high|medium|low + one-line note",
    "signature_openings": ["...", "..."],
    "signature_closings": ["...", "..."],
    "function_word_habits": "...",
    "punctuation_quirks": "...",
    "register": "casual|casual-professional|professional|academic",
    "contraction_use": "high|medium|low",
    "hedge_use": "high|medium|low",
    "idiom_inventory": ["...", "..."],
    "paragraph_rhythm": "...",
    "do_list": ["...", "..."],
    "dont_list": ["...", "..."]
  }
}
</schema>

<writing_sample>
<paste sample here>
</writing_sample>
```

After extraction, the orchestrator (the skill, not the LLM) does this
post-processing before showing the JSON to the user:

1. Sets `version` to `1`.
2. Sets `sample_path` to the resolved sample path.
3. Sets `sample_hash` to `sha256:` plus the SHA-256 of the first 50 KB of
   sample content.
4. Sets `sample_word_count` to a whitespace-token count of the sample
   (capped at 3000 if the source was longer).
5. Sets `extracted_at` to the current UTC timestamp in ISO 8601.
6. Sets `extracted_by` to `<harness-name>:<model-id-or-unknown>`.

Then renders the populated JSON for the approval gate. If the user edits
the JSON, preserve the schema and update only the corrected fields.

## Fingerprint JSON schema

```json
{
  "version": 1,
  "sample_path": "~/.agentic-humanizer/voice.txt",
  "sample_hash": "sha256:...",
  "sample_word_count": 487,
  "extracted_at": "2026-05-08T12:34:56Z",
  "extracted_by": "<harness>:<model-id>",
  "fingerprint": {
    "voice_summary": "...",
    "avg_sentence_length": "12-18 words",
    "sentence_length_variance": "high|medium|low + one-line note",
    "signature_openings": ["...", "..."],
    "signature_closings": ["...", "..."],
    "function_word_habits": "...",
    "punctuation_quirks": "...",
    "register": "casual|casual-professional|professional|academic",
    "contraction_use": "high|medium|low",
    "hedge_use": "high|medium|low",
    "idiom_inventory": ["...", "..."],
    "paragraph_rhythm": "...",
    "do_list": ["...", "..."],
    "dont_list": ["...", "..."]
  }
}
```

## Required fields

Every cached fingerprint MUST contain these fields, populated and
non-empty (a value of `"not enough evidence"` counts as populated):

Top-level: `version`, `sample_path`, `sample_hash`, `sample_word_count`,
`extracted_at`, `extracted_by`, `fingerprint`.

Under `fingerprint`: `voice_summary`, `avg_sentence_length`,
`sentence_length_variance`, `signature_openings`, `signature_closings`,
`function_word_habits`, `punctuation_quirks`, `register`,
`contraction_use`, `hedge_use`, `idiom_inventory`, `paragraph_rhythm`,
`do_list`, `dont_list`.

A cache that is missing any of these is invalid; treat it as a cache miss
and re-extract. The Edit branch of the approval gate must reject saves
that drop any required field.

## Cache invalidation

Compute the cache key as SHA-256 over the first 50 KB of sample content.
Store it as `sha256:<hex>`.

Re-extract when any of these is true:

- `voice-fingerprint.json` is missing.
- `version` is not `1`.
- `sample_hash` does not match the current sample hash.
- Required schema fields are missing.
- The user runs `/agentic-humanizer reset voice`.

## Iter 2 injection contract

Iteration 2 uses only these fields:

- `register`
- `contraction_use`
- `hedge_use`
- `function_word_habits`

Append them to the tone-alignment instruction. The user's `tone=` answer
still applies, but the fingerprint wins when the conflict is about register
rather than task intent. Example: if `tone=professional` and the fingerprint
is `casual-professional`, keep the rewrite work-appropriate but allow the
sample's normal contractions and direct transitions.

## Iter 5 injection contract

Iteration 5 uses only these fields:

- `signature_openings`
- `idiom_inventory`
- `paragraph_rhythm`

Use them when adding the concrete example or anecdote-style sentence. Do
not import facts from the sample. The example must still come from the
source text being rewritten.

## Failure modes

| Mode | User-facing message | Runtime behavior |
|---|---|---|
| LLM extraction error | "Voice extraction failed, so I am running without voice matching for this call." | Set `voice_active=false`; keep the normal loop. |
| Host LLM unavailable | "No host LLM is available to extract a voice fingerprint, so I am running without voice matching for this call." | Set `voice_active=false`; keep the normal loop. |
| Sample under 50 words | "That sample is under 50 words. Please paste at least 50 words, or run without voice matching." | Do not write the sample or profile voice fields. |
| Binary or non-text sample | "I could not read that as plain text, so I am running without voice matching for this call." | Set `voice_active=false`; keep the normal loop. |
| Malformed edited JSON | "That edit removed required fingerprint fields. Please restore the schema or re-extract." | Do not save the malformed cache. |
