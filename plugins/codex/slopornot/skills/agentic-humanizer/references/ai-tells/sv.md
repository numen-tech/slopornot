# AI Tells: Swedish (Svenska)

> **Attribution.** The shared structural concepts (S1 to S8) come from
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
> (CC BY-SA), via this project's `supplemental-ai-tells.md`. A dedicated
> Swedish-language equivalent of that field guide does not exist at the time of
> writing, so the Swedish lexical entries below are an empirical compilation of
> high-frequency Swedish LLM filler, not a copy of any single source.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. See [supplemental-ai-tells.md](../supplemental-ai-tells.md) for the
shared structural concepts S1 to S8; this file adds Swedish-specific lexical
filler plus localized versions of the structural tells. `references/patterns.md`
(English vocabulary) is not loaded for Swedish text.

## Lexical catalogue

### L1. Hollow significance openers

**Signs to watch:** "Det är viktigt att notera att", "Det är värt att nämna
att", "Det är avgörande att", "Man bör komma ihåg att", "Det bör betonas att".

**Problem:** Swedish LLM output opens with importance claims that add nothing.
They mark hedged generation rather than direct writing. Cut the wrapper and
state the fact.

**Before:**
> Det är viktigt att notera att de nya reglerna påverkar alla företag med fler
> än tio anställda.

**After:**
> De nya reglerna gäller företag med fler än tio anställda.

### L2. Generic summary transitions

**Signs to watch:** "Sammanfattningsvis", "Sammantaget", "Avslutningsvis",
"Slutligen kan man säga att", "Allt som allt".

**Problem:** Explicit summary markers read as templated prose. Strong Swedish
writing states the conclusion instead of labeling it.

**Before:**
> Sammanfattningsvis är de föreslagna åtgärderna rimliga och effektiva.

**After:**
> Åtgärderna fungerar.

### L3. Fast-paced-world hype openers

**Signs to watch:** "I dagens snabbrörliga värld", "I den digitala tidsåldern",
"I dagens samhälle", "I en allt mer uppkopplad värld", "Idag, mer än någonsin".

**Problem:** These mirror the English "In today's fast-paced world". They are
empty scene-setting that delays the real point.

**Before:**
> I dagens snabbrörliga värld är det avgörande att företag digitaliserar sina
> processer.

**After:**
> Företag som inte har digitaliserat sina processer tappar mark mot
> konkurrenterna.

### L4. Invitation-to-explore openers

**Signs to watch:** "Låt oss dyka ner i", "Låt oss utforska", "Låt oss ta en
titt på", "Låt oss titta närmare på".

**Problem:** Literal renderings of "Let's dive into" and "Let's explore". They
add a chatbot narrator to text that should not have one.

**Before:**
> Låt oss dyka ner i kvantdatorernas värld och utforska deras möjligheter.

**After:**
> Kvantdatorer löser problem som klassiska datorer inte klarar.

### L5. Inflated value words and forced triads

**Signs to watch:** "banbrytande", "revolutionerande", "sömlös", "robust",
"holistisk", "framtidssäker"; rule-of-three lists like "snabb, skalbar och
säker"; the "inte bara ..., utan också ..." construction used for emphasis.

**Problem:** Swedish marketing adjectives and tidy triads are a reliable
generation tell. Replace them with a concrete claim.

**Before:**
> Plattformen är inte bara robust, utan också sömlös, skalbar och framtidssäker.

**After:**
> Plattformen hanterar 10 000 förfrågningar per sekund och kan utökas till nya
> datacenter utan driftstopp.

## Localized structural tokens

These cross-reference the shared tells in
[supplemental-ai-tells.md](../supplemental-ai-tells.md) with Swedish examples.

### S5 (Correspondence Wrappers) in Swedish

**Signs to watch:** "Hej [namn],", "Bästa [namn],", "Till den det berör,",
"Med vänliga hälsningar,", "Tveka inte att höra av dig.", and signature blocks.
Remove these when the output is not a letter or email.

### S6 (Abrupt Generation Artifacts) in Swedish

**Signs to watch:** "Som en AI-språkmodell kan jag inte", "Min kunskap sträcker
sig till [datum]", "Jag har inte tillgång till information i realtid". Remove
refusal and capability disclaimers unless they carry real meaning.

### S7 (Compliance and Quality Claims) in Swedish

**Signs to watch:** "uppfyller alla krav", "av högsta kvalitet", "balanserad
och objektiv", "noggrant underbyggd". Replace the self-assessment with the
supporting evidence.

### S8 (Style, Register, or Dialect Discontinuity) in Swedish

**Signs to watch:** abrupt shifts from plain to promotional tone; the rare and
old-fashioned formal "ni" spliced into otherwise modern du-tilltal text;
inconsistent use of English loanwords next to native Swedish equivalents.

**Notes:** Modern Swedish uses "du" as the default address. Keep one tone
throughout, aligned to the interview choice, and smooth any passage that reads
as copied from a different document.
