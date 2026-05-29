# AI Tells: Danish (Dansk)

> **Attribution.** The shared structural concepts (S1 to S8) come from
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
> (CC BY-SA), via this project's `supplemental-ai-tells.md`. A dedicated
> Danish-language equivalent of that field guide does not exist at the time of
> writing, so the Danish lexical entries below are an empirical compilation of
> high-frequency Danish LLM filler, not a copy of any single source.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. See [supplemental-ai-tells.md](../supplemental-ai-tells.md) for the
shared structural concepts S1 to S8; this file adds Danish-specific lexical
filler plus localized versions of the structural tells. `references/patterns.md`
(English vocabulary) is not loaded for Danish text.

## Lexical catalogue

### L1. Hollow significance openers

**Signs to watch:** "Det er vigtigt at bemærke, at", "Det er værd at nævne, at",
"Det er afgørende at", "Man bør huske, at", "Det skal understreges, at".

**Problem:** Danish LLM output opens with importance claims that add nothing.
They mark hedged generation rather than direct writing. Cut the wrapper and
state the fact.

**Before:**
> Det er vigtigt at bemærke, at de nye regler påvirker alle virksomheder med
> mere end ti ansatte.

**After:**
> De nye regler gælder virksomheder med mere end ti ansatte.

### L2. Generic summary transitions

**Signs to watch:** "Sammenfattende", "Alt i alt", "Afslutningsvis", "Kort
sagt", "Endelig kan man sige, at".

**Problem:** Explicit summary markers read as templated prose. Strong Danish
writing states the conclusion instead of labeling it.

**Before:**
> Sammenfattende er de foreslåede tiltag fornuftige og effektive.

**After:**
> Tiltagene virker.

### L3. Fast-paced-world hype openers

**Signs to watch:** "I dagens hurtige verden", "I den digitale tidsalder", "I
nutidens samfund", "I en stadig mere forbundet verden", "I dag, mere end
nogensinde".

**Problem:** These mirror the English "In today's fast-paced world". They are
empty scene-setting that delays the real point.

**Before:**
> I dagens hurtige verden er det afgørende, at virksomheder digitaliserer deres
> processer.

**After:**
> Virksomheder, der ikke har digitaliseret deres processer, taber terræn til
> konkurrenterne.

### L4. Invitation-to-explore openers

**Signs to watch:** "Lad os dykke ned i", "Lad os udforske", "Lad os tage et
kig på", "Lad os se nærmere på".

**Problem:** Literal renderings of "Let's dive into" and "Let's explore". They
add a chatbot narrator to text that should not have one.

**Before:**
> Lad os dykke ned i kvantecomputernes verden og udforske deres muligheder.

**After:**
> Kvantecomputere løser problemer, som klassiske computere ikke kan klare.

### L5. Inflated value words and forced triads

**Signs to watch:** "banebrydende", "revolutionerende", "problemfri", "robust",
"holistisk", "fremtidssikret"; rule-of-three lists like "hurtig, skalerbar og
sikker"; the "ikke kun ..., men også ..." construction used for emphasis.

**Problem:** Danish marketing adjectives and tidy triads are a reliable
generation tell. Replace them with a concrete claim.

**Before:**
> Platformen er ikke kun robust, men også problemfri, skalerbar og
> fremtidssikret.

**After:**
> Platformen håndterer 10.000 forespørgsler i sekundet og kan udvides til nye
> datacentre uden nedetid.

## Localized structural tokens

These cross-reference the shared tells in
[supplemental-ai-tells.md](../supplemental-ai-tells.md) with Danish examples.

### S5 (Correspondence Wrappers) in Danish

**Signs to watch:** "Kære [navn],", "Til rette vedkommende,", "Med venlig
hilsen,", "Tøv ikke med at kontakte mig.", and signature blocks. Remove these
when the output is not a letter or email.

### S6 (Abrupt Generation Artifacts) in Danish

**Signs to watch:** "Som en AI-sprogmodel kan jeg ikke", "Min viden rækker til
[dato]", "Jeg har ikke adgang til oplysninger i realtid". Remove refusal and
capability disclaimers unless they carry real meaning.

### S7 (Compliance and Quality Claims) in Danish

**Signs to watch:** "opfylder alle krav", "af højeste kvalitet", "afbalanceret
og objektiv", "grundigt underbygget". Replace the self-assessment with the
supporting evidence.

### S8 (Style, Register, or Dialect Discontinuity) in Danish

**Signs to watch:** abrupt shifts from plain to promotional tone; the very
formal "De" spliced into otherwise modern du-address text; inconsistent use of
English loanwords next to native Danish equivalents.

**Notes:** Modern Danish uses "du" as the default address; "De" is rare and
formal. Keep one tone throughout, aligned to the interview choice, and smooth
any passage that reads as copied from a different document.
