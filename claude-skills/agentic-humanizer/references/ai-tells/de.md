# AI Tells: German (Deutsch)

> **Attribution.** The shared structural concepts (S1 to S8) come from
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
> (CC BY-SA), via this project's `supplemental-ai-tells.md`. A dedicated
> German-language equivalent of that field guide does not exist at the time of
> writing, so the German lexical entries below are an empirical compilation of
> high-frequency German LLM filler, not a copy of any single source.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. See [supplemental-ai-tells.md](../supplemental-ai-tells.md) for the
shared structural concepts S1 to S8; this file adds German-specific lexical
filler plus localized versions of the structural tells. `references/patterns.md`
(English vocabulary) is not loaded for German text, so rely on this catalogue
and the supplemental tells instead.

## Lexical catalogue

### L1. Hollow significance openers

**Signs to watch:** "Es ist wichtig zu beachten, dass", "Es ist entscheidend,
dass", "Es ist von großer Bedeutung", "Es sei darauf hingewiesen, dass", "Man
sollte bedenken, dass".

**Problem:** German LLM output opens sentences with importance claims that add
no information. They signal hedged generation rather than direct expert writing.
Delete the wrapper and state the fact.

**Before:**
> Es ist wichtig zu beachten, dass die neue Regelung alle Unternehmen betrifft,
> die mehr als zehn Mitarbeiter beschäftigen.

**After:**
> Die neue Regelung gilt für alle Unternehmen mit mehr als zehn Mitarbeitern.

### L2. Generic summary transitions

**Signs to watch:** "Insgesamt lässt sich sagen", "Zusammenfassend kann man
sagen", "Abschließend ist festzuhalten", "Alles in allem", "Letztendlich".

**Problem:** Explicit summary markers read as template prose. German writers
fold the conclusion into the final sentence instead of announcing it.

**Before:**
> Insgesamt lässt sich sagen, dass die Maßnahmen sinnvoll und wirksam sind.

**After:**
> Die Maßnahmen greifen.

### L3. Fast-paced-world hype openers

**Signs to watch:** "In der heutigen schnelllebigen Welt", "Angesichts der
rasanten Entwicklungen", "Im digitalen Zeitalter", "In der heutigen digitalen
Landschaft", "In Zeiten des Wandels".

**Problem:** These mirror the English "In today's rapidly evolving landscape".
They are contextless throat-clearing that delays the actual point.

**Before:**
> In der heutigen schnelllebigen Welt ist es unerlässlich, dass Unternehmen ihre
> Prozesse digitalisieren.

**After:**
> Unternehmen, die ihre Prozesse noch nicht digitalisiert haben, verlieren
> gegenüber Wettbewerbern an Boden.

### L4. Invitation-to-explore openers

**Signs to watch:** "Tauchen wir ein", "Lassen Sie uns eintauchen", "Lassen Sie
uns einen Blick werfen auf", "Lassen Sie uns erkunden".

**Problem:** Literal translations of "Let's dive into" and "Let's explore".
They read as chatbot voice inserted into a document that has no narrator.

**Before:**
> Tauchen wir ein in die Welt der Quanteninformatik und erkunden wir ihre
> Möglichkeiten.

**After:**
> Quanteninformatik löst Aufgaben, an denen klassische Rechner scheitern.

### L5. Inflated value words and forced triads

**Signs to watch:** "bahnbrechend", "revolutionär", "nahtlos", "robust",
"ganzheitlich", "zukunftssicher"; rule-of-three lists like "effizient,
skalierbar und zukunftssicher"; the "nicht nur ..., sondern auch ..."
construction used for emphasis rather than contrast.

**Problem:** German marketing-grade adjectives and tidy triads are a strong
generation tell. Replace them with a concrete claim a reader can check.

**Before:**
> Die Plattform ist nicht nur robust, sondern auch nahtlos, skalierbar und
> zukunftssicher.

**After:**
> Die Plattform verarbeitet 10.000 Anfragen pro Sekunde und lässt sich ohne
> Ausfallzeit auf weitere Rechenzentren verteilen.

## Localized structural tokens

These cross-reference the shared tells in
[supplemental-ai-tells.md](../supplemental-ai-tells.md) with German examples.

### S5 (Correspondence Wrappers) in German

**Signs to watch:** "Sehr geehrte Damen und Herren,", "Mit freundlichen
Grüßen,", "Ich hoffe, diese E-Mail erreicht Sie gut.", "Bezugnehmend auf Ihre
Anfrage", and signature blocks. Remove these when the requested output is not a
letter or email; German LLM output often defaults to Geschäftsbrief structure.

### S6 (Abrupt Generation Artifacts) in German

**Signs to watch:** "Als KI-Sprachmodell kann ich dazu keine Stellung nehmen,",
"Bitte beachten Sie, dass meine Daten nur bis [Datum] reichen", "Darauf kann
ich leider nicht zugreifen". Remove refusal and capability disclaimers unless
they represent a genuine content caveat.

### S7 (Compliance and Quality Claims) in German

**Signs to watch:** "erfüllt alle Anforderungen", "entspricht den höchsten
Standards", "ausgewogen und objektiv", "sorgfältig recherchiert". Replace the
self-assessment with the evidence that supports it.

### S8 (Style, Register, or Dialect Discontinuity) in German

**Signs to watch:** mixing "Sie" (formal) and "du" (informal) in the same text;
sudden shifts between plain German and formal Geschäftsdeutsch; inconsistent
national orthography (Swiss German writes "ss" where standard German uses "ß";
Austrian German uses words such as "Jänner" for "Januar").

**Notes:** German has a sharp formal and informal register divide. AI-assisted
edits sometimes splice Sie-register boilerplate into a du-register document or
the reverse. Flag every Sie and du inconsistency for the user and align the text
to the variant chosen in the interview (de-DE, de-AT, or de-CH).
