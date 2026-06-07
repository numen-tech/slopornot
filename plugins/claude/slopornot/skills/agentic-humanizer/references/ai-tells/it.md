# AI Tells: Italian (Italiano)

> **Attribution.** The shared structural concepts (S1 to S8) come from
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
> (CC BY-SA), via this project's `supplemental-ai-tells.md`. A dedicated
> Italian-language equivalent of that field guide does not exist at the time of
> writing, so the Italian lexical entries below are an empirical compilation of
> high-frequency Italian LLM filler, not a copy of any single source.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. See [supplemental-ai-tells.md](../supplemental-ai-tells.md) for the
shared structural concepts S1 to S8; this file adds Italian-specific lexical
filler plus localized versions of the structural tells. `references/patterns.md`
(English vocabulary) is not loaded for Italian text.

## Lexical catalogue

### L1. Hollow significance openers

**Signs to watch:** "È importante sottolineare che", "È fondamentale considerare
che", "Vale la pena notare che", "È bene ricordare che", "Occorre tenere
presente che".

**Problem:** Italian LLM output opens with importance claims that add nothing.
They mark hedged generation. Remove the wrapper and state the fact directly.

**Before:**
> È importante sottolineare che la nuova normativa riguarda tutte le aziende con
> più di dieci dipendenti.

**After:**
> La nuova normativa riguarda le aziende con più di dieci dipendenti.

### L2. Generic summary transitions

**Signs to watch:** "In conclusione", "In sintesi", "Riassumendo", "In
definitiva", "Tutto sommato".

**Problem:** Explicit summary markers read as template prose. Good Italian
writing states the conclusion rather than labeling it.

**Before:**
> In conclusione, le misure proposte sono ragionevoli ed efficaci.

**After:**
> Le misure funzionano.

### L3. Fast-paced-world hype openers

**Signs to watch:** "Nel mondo frenetico di oggi", "Nell'era digitale", "Nel
panorama attuale", "In un mondo sempre più connesso", "Oggi più che mai".

**Problem:** These mirror the English "In today's fast-paced world". They are
empty scene-setting that delays the real point.

**Before:**
> Nel mondo frenetico di oggi, è indispensabile che le aziende digitalizzino i
> propri processi.

**After:**
> Le aziende che non hanno digitalizzato i propri processi perdono terreno
> rispetto ai concorrenti.

### L4. Invitation-to-explore openers

**Signs to watch:** "Immergiamoci", "Esploriamo", "Addentriamoci nel mondo di",
"Diamo un'occhiata a", "Scopriamo insieme".

**Problem:** Literal renderings of "Let's dive into" and "Let's explore". They
add a chatbot narrator to prose that should not have one.

**Before:**
> Immergiamoci nel mondo dell'informatica quantistica e scopriamone le
> potenzialità.

**After:**
> L'informatica quantistica risolve problemi che i computer classici non
> riescono ad affrontare.

### L5. Inflated value words and forced triads

**Signs to watch:** "rivoluzionario", "innovativo", "all'avanguardia", "senza
soluzione di continuità", "robusto", "olistico"; rule-of-three lists like
"veloce, scalabile e sicuro"; the "non solo ..., ma anche ..." construction
used for emphasis.

**Problem:** Italian marketing adjectives and tidy triads are a strong
generation tell. Replace them with a concrete, checkable claim.

**Before:**
> La piattaforma non solo è robusta, ma anche scalabile, sicura e
> all'avanguardia.

**After:**
> La piattaforma gestisce 10.000 richieste al secondo e si estende a nuovi data
> center senza interruzioni.

## Localized structural tokens

These cross-reference the shared tells in
[supplemental-ai-tells.md](../supplemental-ai-tells.md) with Italian examples.

### S5 (Correspondence Wrappers) in Italian

**Signs to watch:** "Gentile Signore/Signora,", "Spettabile [azienda],", "Alla
cortese attenzione di", "Cordiali saluti,", "Distinti saluti,", "Resto a
disposizione per qualsiasi chiarimento.", and signature blocks. Remove these
when the output is not a letter or email.

### S6 (Abrupt Generation Artifacts) in Italian

**Signs to watch:** "In quanto modello linguistico di IA, non posso", "Le mie
conoscenze si fermano a [data]", "Non ho accesso a informazioni in tempo
reale". Remove refusal and capability disclaimers unless they carry real
meaning.

### S7 (Compliance and Quality Claims) in Italian

**Signs to watch:** "soddisfa tutti i requisiti", "della massima qualità",
"completo e obiettivo", "accuratamente documentato". Replace the
self-assessment with the supporting evidence.

### S8 (Style, Register, or Dialect Discontinuity) in Italian

**Signs to watch:** mixing "tu" (informal) and "Lei" (formal) in the same text;
abrupt shifts between plain prose and formal burocratese; copied passages whose
tone does not match the rest.

**Notes:** Choose one register and hold it throughout, aligned to the tone
chosen in the interview. Flag every "tu"/"Lei" inconsistency for the user.
