# AI Tells: Spanish (Español)

> **Attribution.** The shared structural concepts (S1 to S8) come from
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
> (CC BY-SA), via this project's `supplemental-ai-tells.md`. A dedicated
> Spanish-language equivalent of that field guide does not exist at the time of
> writing, so the Spanish lexical entries below are an empirical compilation of
> high-frequency Spanish LLM filler, not a copy of any single source.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. See [supplemental-ai-tells.md](../supplemental-ai-tells.md) for the
shared structural concepts S1 to S8; this file adds Spanish-specific lexical
filler plus localized versions of the structural tells. `references/patterns.md`
(English vocabulary) is not loaded for Spanish text.

## Lexical catalogue

### L1. Hollow significance openers

**Signs to watch:** "Es importante destacar que", "Es importante señalar que",
"Cabe destacar que", "Vale la pena mencionar que", "Es fundamental tener en
cuenta que".

**Problem:** Spanish LLM output opens with importance claims that carry no
information. They mark hedged generation rather than confident writing. Cut the
wrapper and lead with the fact.

**Before:**
> Es importante destacar que la nueva normativa afecta a todas las empresas con
> más de diez empleados.

**After:**
> La nueva normativa afecta a las empresas con más de diez empleados.

### L2. Generic summary transitions

**Signs to watch:** "En resumen", "En conclusión", "En definitiva", "Para
concluir", "En última instancia".

**Problem:** Explicit summary markers read as templated prose. Strong Spanish
writing closes by stating the conclusion directly, not by labeling it.

**Before:**
> En conclusión, las medidas propuestas son razonables y eficaces.

**After:**
> Las medidas funcionan.

### L3. Fast-paced-world hype openers

**Signs to watch:** "En el vertiginoso mundo actual", "En la era digital", "En
el panorama actual", "En un mundo cada vez más conectado", "Hoy en día, más que
nunca".

**Problem:** These mirror the English "In today's fast-paced world". They are
empty scene-setting that postpones the real claim.

**Before:**
> En el vertiginoso mundo actual, resulta imprescindible que las empresas
> digitalicen sus procesos.

**After:**
> Las empresas que no han digitalizado sus procesos pierden terreno frente a la
> competencia.

### L4. Invitation-to-explore openers

**Signs to watch:** "Adentrémonos en", "Exploremos", "Sumérgete en", "Vamos a
explorar", "Echemos un vistazo a".

**Problem:** Literal renderings of "Let's dive into" and "Let's explore". They
introduce a chatbot narrator into prose that should have none.

**Before:**
> Sumérgete en el mundo de la computación cuántica y descubre sus posibilidades.

**After:**
> La computación cuántica resuelve problemas que los ordenadores clásicos no
> pueden abordar.

### L5. Inflated value words and forced triads

**Signs to watch:** "revolucionario", "innovador", "de vanguardia", "sin
fisuras", "robusto", "integral"; rule-of-three lists like "rápido, escalable y
seguro"; the "no solo ..., sino que también ..." construction used for emphasis.

**Problem:** Spanish marketing adjectives and neat triads are a reliable
generation tell. Replace them with a measurable claim.

**Before:**
> La plataforma no solo es robusta, sino que también es escalable, segura y de
> vanguardia.

**After:**
> La plataforma procesa 10.000 solicitudes por segundo y se amplía a nuevos
> centros de datos sin interrupciones.

## Localized structural tokens

These cross-reference the shared tells in
[supplemental-ai-tells.md](../supplemental-ai-tells.md) with Spanish examples.

### S5 (Correspondence Wrappers) in Spanish

**Signs to watch:** "Estimado/a Sr./Sra.", "A quien corresponda,", "Atentamente,",
"Quedo a la espera de su respuesta.", "No dude en ponerse en contacto conmigo.",
and signature blocks. Remove these when the output is not a letter or email.

### S6 (Abrupt Generation Artifacts) in Spanish

**Signs to watch:** "Como modelo de lenguaje de IA, no puedo", "Mi conocimiento
llega hasta [fecha]", "No tengo acceso a información en tiempo real". Remove
refusal and capability disclaimers unless they carry real meaning.

### S7 (Compliance and Quality Claims) in Spanish

**Signs to watch:** "cumple con todos los requisitos", "de la más alta
calidad", "exhaustivo y objetivo", "rigurosamente documentado". Replace the
self-assessment with the supporting evidence.

### S8 (Style, Register, or Dialect Discontinuity) in Spanish

**Signs to watch:** mixing "tú" and "usted" in the same text; mixing European
Spanish (es-ES) with Latin American Spanish (es-419), for example "vosotros"
plus "ustedes", or "ordenador"/"coche" alongside "computadora"/"carro".

**Notes:** Choose one register and one regional variant and hold it throughout.
Align the text to the variant chosen in the interview (es-ES or es-419) and flag
any "tú"/"usted" inconsistency for the user.
