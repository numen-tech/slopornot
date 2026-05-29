# AI Tells: Norwegian (Norsk)

> **Attribution.** The shared structural concepts (S1 to S8) come from
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
> (CC BY-SA), via this project's `supplemental-ai-tells.md`. A dedicated
> Norwegian-language equivalent of that field guide does not exist at the time
> of writing, so the Norwegian lexical entries below are an empirical
> compilation of high-frequency Norwegian LLM filler, not a copy of any single
> source.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. See [supplemental-ai-tells.md](../supplemental-ai-tells.md) for the
shared structural concepts S1 to S8; this file adds Norwegian-specific lexical
filler plus localized versions of the structural tells. `references/patterns.md`
(English vocabulary) is not loaded for Norwegian text.

This file has two clearly labeled sections. Use the Bokmal section for Bokmal
(`nb`) text and the Nynorsk section for Nynorsk (`nn`) text. Readability scoring
(LIX) is available for Bokmal via `nb`; it is not available for Nynorsk in this
app version, so Nynorsk runs tells-only.

## Bokmal (nb)

### L1. Hollow significance openers

**Signs to watch:** "Det er viktig å merke seg at", "Det er verdt å nevne at",
"Det er avgjørende at", "Man bør huske at", "Det må understrekes at".

**Problem:** Norwegian Bokmal LLM output opens with importance claims that add
nothing. Cut the wrapper and state the fact directly.

**Before:**
> Det er viktig å merke seg at de nye reglene påvirker alle bedrifter med flere
> enn ti ansatte.

**After:**
> De nye reglene gjelder bedrifter med flere enn ti ansatte.

### L2. Generic summary transitions

**Signs to watch:** "Oppsummert", "Alt i alt", "Avslutningsvis", "Kort sagt",
"Til slutt kan man si at".

**Problem:** Explicit summary markers read as templated prose. State the
conclusion instead of labeling it.

**Before:**
> Oppsummert er de foreslåtte tiltakene fornuftige og effektive.

**After:**
> Tiltakene virker.

### L3. Fast-paced-world hype openers

**Signs to watch:** "I dagens hektiske verden", "I den digitale tidsalderen", "I
dagens samfunn", "I en stadig mer tilkoblet verden", "I dag, mer enn noensinne".

**Problem:** These mirror the English "In today's fast-paced world". They are
empty scene-setting that delays the real point.

**Before:**
> I dagens hektiske verden er det avgjørende at bedrifter digitaliserer
> prosessene sine.

**After:**
> Bedrifter som ikke har digitalisert prosessene sine, taper terreng mot
> konkurrentene.

### L4. Invitation-to-explore openers

**Signs to watch:** "La oss dykke ned i", "La oss utforske", "La oss ta en titt
på", "La oss se nærmere på".

**Problem:** Literal renderings of "Let's dive into" and "Let's explore". They
add a chatbot narrator to text that should not have one.

**Before:**
> La oss dykke ned i kvantedatamaskinenes verden og utforske mulighetene deres.

**After:**
> Kvantedatamaskiner løser problemer som klassiske datamaskiner ikke klarer.

### L5. Inflated value words and forced triads

**Signs to watch:** "banebrytende", "revolusjonerende", "sømløs", "robust",
"helhetlig", "fremtidsrettet"; rule-of-three lists like "rask, skalerbar og
sikker"; the "ikke bare ..., men også ..." construction used for emphasis.

**Problem:** Marketing adjectives and tidy triads are a reliable generation
tell. Replace them with a concrete claim.

**Before:**
> Plattformen er ikke bare robust, men også sømløs, skalerbar og fremtidsrettet.

**After:**
> Plattformen håndterer 10 000 forespørsler i sekundet og kan utvides til nye
> datasentre uten nedetid.

### S5 (Correspondence Wrappers) in Bokmal

**Signs to watch:** "Kjære [navn],", "Til den det måtte angå,", "Med vennlig
hilsen,", "Ikke nøl med å ta kontakt.", and signature blocks. Remove these when
the output is not a letter or email.

### S6 (Abrupt Generation Artifacts) in Bokmal

**Signs to watch:** "Som en KI-språkmodell kan jeg ikke", "Kunnskapen min
strekker seg til [dato]", "Jeg har ikke tilgang til sanntidsinformasjon".
Remove refusal and capability disclaimers unless they carry real meaning.

### S7 (Compliance and Quality Claims) in Bokmal

**Signs to watch:** "oppfyller alle krav", "av høyeste kvalitet", "balansert og
objektiv", "grundig underbygd". Replace the self-assessment with the supporting
evidence.

### S8 (Style, Register, or Dialect Discontinuity) in Bokmal

**Signs to watch:** abrupt shifts from plain to promotional tone; Nynorsk word
forms drifting into Bokmal text (see the Nynorsk section for the contrast
table); inconsistent use of English loanwords next to Norwegian equivalents.
Keep the text in consistent Bokmal aligned to the interview choice.

## Nynorsk (nn)

Readability scoring is not available for Norwegian Nynorsk in this app version
(the app returns `unsupported_language:nn`), so Nynorsk runs tells-only with no
band termination. Apply the lexical and structural tells below plus the shared
S1 to S8 concepts.

### Nynorsk filler equivalents

**Signs to watch:** "Det er viktig å merke seg at", "Det er verdt å nemne at",
"Lat oss dykke ned i", "Lat oss utforske", "Oppsummert", "I dagens hektiske
verd", "ikkje berre ..., men også ...".

**Problem:** The same hollow openers, summary markers, and forced triads appear
in Nynorsk LLM output as in Bokmal. Treat them the same way: cut the wrapper and
state the claim.

**Before:**
> Det er viktig å merke seg at lat oss dykke ned i emnet for å forstå det fullt
> ut.

**After:**
> Emnet handlar om tre ting.

### Mixed-standard tell (Nynorsk and Bokmal contamination)

**Signs to watch:** Bokmal word forms leaking into Nynorsk text (or the
reverse). LLMs are weaker at holding consistent Nynorsk and tend to drift toward
Bokmal. Watch for these contrasts:

| Concept | Nynorsk | Bokmal |
|---|---|---|
| not | `ikkje` | `ikke` |
| I | `eg` | `jeg` |
| from | `frå` | `fra` |
| what | `kva` | `hva` |
| something | `noko` | `noe` |
| much | `mykje` | `mye` |
| we | `me` or `vi` | `vi` |
| only | `berre` | `bare` |
| remember | `hugse` | `huske` |

**Problem:** A single `ikke`, `jeg`, or `noe` inside otherwise Nynorsk prose is
a strong sign of machine generation or a sloppy machine edit. This is the
Nynorsk-specific form of S8 (Style, Register, or Dialect Discontinuity).

**Before:**
> Eg meiner at dette ikke er noe godt argument.

**After:**
> Eg meiner at dette ikkje er eit godt argument.

### Localized structural tokens in Nynorsk

For S5 to S7, use the Bokmal examples above as a guide and convert to Nynorsk
forms (for example "Med vennleg helsing" rather than "Med vennlig hilsen", "Som
ein KI-språkmodell" rather than "Som en KI-språkmodell"). The structural intent
is identical; only the word forms change.
