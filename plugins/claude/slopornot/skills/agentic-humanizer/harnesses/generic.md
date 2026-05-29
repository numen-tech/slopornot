# Harness Routing — Generic (plain-text questions)

`SKILL.md` routes here when the host harness is unrecognized OR when a
recognized harness's question tool is unavailable. Use plain-text
questions and parse the user's reply manually.

## When this file applies

- Any harness not listed in `harnesses/` (AiderDesk, future wrappers, etc.)
- A recognized harness where the question tool fails or returns an error
- A user override: invoking `/agentic-humanizer plain-text [paste]`

## The interview

Only ask Q5 when no inline or saved `voice_path` has resolved,
`~/.agentic-humanizer/voice.txt` is absent, and the saved profile does not
contain `"voice_skip": true`.

Detect the source language first (see `SKILL.md` Step 3). State the detected
language in the opening line and build question 1's options from
`references/multilingual.md` for that language (and show question 2's bands in
that language's metric). The messages below show the English default; substitute
the detected language's variants and metric, and adjust the example token to
match.

Send the user this exact message (English default):

```text
Before I run the agentic humanization loop, I need 4 quick answers.
Reply with the four tokens in order, on one line, e.g. "1 3 b ±10".

1) Confirm language and variant (detected English):
   1. American English (en-US)
   2. British English (en-GB)
   3. Other (different language; specify after your answer)

2) What reading level should the output target?
   1. Elementary (English Grade 3-5)
   2. Middle school (English Grade 6-8)
   3. High school (English Grade 9-11)
   4. College (English Grade 12-15)
   5. Graduate or professional (English Grade 16+)

3) What tone?
   a. Casual
   b. Professional
   c. Academic

4) Length policy?
   ±10  Keep within ±10% of original
   exp  Allow expansion
   trim Allow trimming
```

If Q5 is eligible, send this five-answer variant instead:

```text
Before I run the agentic humanization loop, I need 5 quick answers.
Reply with the five tokens in order, on one line, e.g. "1 3 b ±10 n".

1) Confirm language and variant (detected English):
   1. American English (en-US)
   2. British English (en-GB)
   3. Other (different language; specify after your answer)

2) What reading level should the output target?
   1. Elementary (English Grade 3-5)
   2. Middle school (English Grade 6-8)
   3. High school (English Grade 9-11)
   4. College (English Grade 12-15)
   5. Graduate or professional (English Grade 16+)

3) What tone?
   a. Casual
   b. Professional
   c. Academic

4) Length policy?
   ±10  Keep within ±10% of original
   exp  Allow expansion
   trim Allow trimming

5) Mimic a writing sample of yours?
   y      Yes
   n      No
   never  Never ask again
```

Wait for the user's reply. Parse strictly:

- Q1: integer (1 to the number of variants offered). If it is the "Other
  (different language)" option, prompt once more for the language and resolve it
  and a variant against `references/multilingual.md`. Set `language`/`variant`.
- Q2: integer 1 to 5 -> `reading_level`
  (elementary/middle/high_school/college/graduate); for English also set
  `target_grade` (4, 7, 10, 13, 17).
- Q3: letter a/b/c.
- Q4: token `±10` / `exp` / `trim`.
- Q5, when present: token `y` / `n` / `never`.

If the reply does not parse, send: *"I couldn't parse that. Please reply
with four tokens, e.g. `1 3 b ±10`."* and wait again. Maximum 2 reparse
attempts; on the third bad reply, fall back to defaults
(American · High school · Professional · ±10%) and proceed.

For the five-answer variant, change the reparse example to
`1 3 b ±10 n`.

## After the interview

Capture the four answers as variables:

- `language` and `variant` (for example `en` / `en-US`; `other` means a
  different language resolved against `references/multilingual.md`)
- `reading_level` ∈ {`elementary`, `middle`, `high_school`, `college`,
  `graduate`}; `target_grade` ∈ {4, 7, 10, 13, 17} for English
- `tone` ∈ {`casual`, `professional`, `academic`}
- `length_policy` ∈ {`±10`, `exp`, `trim`}
- `voice_choice` ∈ {`yes`, `no`, `never`} when Q5 is present

When Q5 is `y`, say exactly: *"Paste 200+ words as your next message."*
Capture the next user turn as the voice sample and return to `SKILL.md`
Step 4 for validation, writing, and fingerprint extraction. The parser at
the top of this section already collected any `Other`-language string
before reaching this point, so the voice prompt cannot collide with it.

When Q5 is `never`, persist `voice_skip`.

Return to `SKILL.md` § Loop algorithm with these answers.

## Fingerprint approval (no gate)

The Yes / Edit / Re-extract approval gate from `SKILL.md` Step 4 needs
a structured-question tool that the generic harness does not have. When
Step 4 reaches that gate, degrade to print-and-continue:

1. Print the extracted fingerprint JSON to the user, fenced as a code
   block so the structure is readable.
2. Print this exact line: *"To re-extract or edit this fingerprint
   later, run `/agentic-humanizer reset voice` and rerun."*
3. Validate the fingerprint against
   `references/voice-fingerprint.md` § Required fields. If any required
   field is missing, set `voice_active=false`, add the
   extraction-failure footer flag for Step 7, and skip writing the
   cache. Do not try to ask the user to edit.
4. If validation passes, save the fingerprint to
   `~/.agentic-humanizer/voice-fingerprint.json`, update `profile.json`
   per `SKILL.md` Step 4's `Yes` branch, and proceed.

Do not block the loop on a question the harness cannot render cleanly.
