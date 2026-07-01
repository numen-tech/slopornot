# Detection Guidance

## How this file is used

`SKILL.md` reads this file on English runs, alongside `patterns.md` and
`supplemental-ai-tells.md`. It is a false-positive guard: consult it before
finalizing edits so the rewrite tightens real AI tells without gutting prose a
human actually wrote. The tells in `patterns.md` are signals to inspect, not
proof; this file lists what those signals look like on innocent human writing,
and what to protect.

**Weigh clusters, not isolated tells.** Treat two or more patterns co-occurring
in the same paragraph, or an exact `patterns.md` "Words to watch" phrase, as a
real tell worth fixing even when the surrounding prose reads clean. A single
isolated signal from the lists below does not justify cutting on its own; when a
passage only trips isolated signals, leave it.

## What not to flag (false positives)

A clean human writer can hit several of the patterns in `patterns.md` without any
AI involvement. Before rewriting, sanity-check that you are not gutting
legitimate prose. The following are *not* reliable indicators on their own:

- **Perfect grammar and consistent style.** Many writers are professionals or have been edited. Polish does not equal AI.
- **Mixed casual and formal registers.** This often signals a person in a technical field, a young writer, or someone with neurodivergent prose habits, not a chatbot.
- **"Bland" or "robotic" prose.** AI prose has *specific* tells. Generic dryness without those tells is just dry writing.
- **Formal or academic vocabulary.** AI overuses *specific* fancy words (see pattern 7 in `patterns.md`), not all fancy words. Don't flatten "ostensibly" or "constituent" just because they sound brainy.
- **Letter-style opening or closing on a comment.** Salutations and sign-offs predate ChatGPT by centuries.
- **Common transition words in isolation.** *Additionally*, *moreover*, *consequently* are AI-coded only when piled up. One *however* is not a tell.
- **Curly quotes alone.** macOS, Word, Google Docs, and most CMSes auto-curl by default. Curly quotes only count when stacked with other tells.
- **Em dashes alone.** Many editors and journalists use them often. Em dashes are evidence only when paired with formulaic sales-y rhythm. This is a detection point, not an output rule: a lone dash is not proof the source is AI-written, but pattern 14 still strips every em and en dash from the final rewrite regardless of who wrote it.
- **One short emphatic sentence.** Humans use clipped sentences to land a point. Flag staccato drama only when several short fragments appear in a row and inflate the tone.
- **"Honestly" or "look" mid-sentence.** These are ordinary in casual writing. The tell is the standalone theatrical opener, not the word itself.
- **Unsourced claims.** Most of the web is unsourced. Lack of citations doesn't prove anything. This does not excuse vague-authority phrasing like "experts argue" or "observers have cited"; that stays a pattern 5 tell whether or not a citation is present.
- **Correct, complex formatting.** Visual editors and templates produce clean output without any AI.
- **Secondhand text.** Do not rewrite watched phrases inside quotations, titles, proper names, or examples where the phrase is being discussed rather than used.

When in doubt, look for **clusters** of tells, not isolated ones. A single em dash means nothing; em dashes plus rule-of-three plus *vibrant tapestry* plus a "Conclusion" section is a confession.

## Signs of human writing (preserve these)

When you see these, lean toward leaving the prose alone: they are evidence of a
real person writing, and over-editing will destroy what makes the piece sound
human.

- **Specific, unusual, hard-to-fabricate detail.** A real address. A weird quote. The phrase "the lawyer who used to work upstairs from my dentist." LLMs round off specifics; humans hoard them.
- **Mixed feelings and unresolved tension.** "I think this is mostly good, but it bothers me, and I can't fully explain why." LLMs default to clean takes.
- **Dated, era-bound references.** Slang, memes, or in-jokes that map to a specific year and subculture. Models lag by a year or more.
- **First-person editorial choices the writer can defend.** If the writer can explain *why* they made a particular cut or used a particular word, that's a strong human signal.
- **Variety in sentence length.** Real writing alternates short and long. AI writing tends toward an even, mid-length cadence.
- **Genuine asides, parentheticals, or self-corrections.** "(I keep wanting to say 'almost' here, but it really was certain.)" Models rarely interrupt themselves like this.
- **Edits made before November 30, 2022.** ChatGPT's public launch. Anything older than that is, with very rare exceptions, not AI-written. This applies only when the input itself carries an explicit date, byline, or timestamp; the skill has no other signal for when prose was written.

## Example: cluster versus isolated

**Leave it (isolated signals).** "Honestly, the launch was rough, but we shipped on the 14th and the team was proud of it." A casual opener and a short aside, plus a specific date and real sentiment. No cluster, so do not rewrite.

**Fix it (clustered tells).** "In today's fast-paced landscape, this pivotal solution stands as a testament to innovation, seamlessly empowering teams to unlock their full potential." AI vocabulary, promotional tone, copula avoidance, and a generic flourish stacked in one sentence. Rewrite it.
