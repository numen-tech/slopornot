# Supplemental AI Tells

> **Attribution.** This SlopOrNot-authored supplement is inspired by
> [Wikipedia:Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing),
> accessed May 20, 2026. It paraphrases broadly reusable signals from that
> field guide and omits Wikipedia-specific process, template, shortcut, and
> category signals.

## How to apply

Treat each tell as a clue to inspect, not proof that the passage is
AI-written. For source, citation, and verification artifacts, do not invent
missing facts or citations: remove obvious wrappers only when they are
non-content artifacts, otherwise flag the issue in the highest-impact edits.

## Supplemental catalogue

### S1. Placeholder Scaffolding

**Signs to watch:** `[Your Name]`, `[Date]`, `[Insert source]`,
`<title here>`, `TODO`, `Lorem ipsum`, unfilled bracketed fields,
template-like paragraphs that preserve instruction text.

**Problem:** AI-generated drafts often leave behind form scaffolding from a
prompt, template, or completion. Human-facing prose should not include
unresolved slots.

**Before:**
> Subject: [Insert subject here]
>
> Dear [Recipient],
>
> I am writing to share the updated project summary for [Project Name].

**After:**
> The updated project summary is ready.

### S2. Markdown or Platform Markup Leakage

**Signs to watch:** stray `###`, `**bold**`, bullet markers in paragraph text,
unrendered tables, HTML fragments, copied UI labels, `contentReference`,
`oaicite`, `oai_citation`, `attached_file`, `grok_card`, `attribution`, or
`attributableIndex`.

**Problem:** Model outputs can include formatting syntax or platform-internal
citation tokens that were meant for an assistant interface, not the final text.

**Before:**
> The draft starts with `### Overview` and says the report **highlights**
> three areas. contentReference[oaicite:0]

**After:**
> The report covers three areas.

### S3. Search and Citation Leakage

**Signs to watch:** `turn0search0`, `turn1view2`, `utm_source=chatgpt.com`,
links to search result pages, malformed citation markers, references declared
but not used, external links that do not support the sentence.

**Problem:** AI-assisted browsing can leak tool identifiers, tracking
parameters, or citations that were never checked against the claim. This is a
source-integrity problem, not just a style problem.

**Before:**
> The company was founded in 2019, according to turn0search0 and the official
> site?utm_source=chatgpt.com.

**After:**
> The company says it was founded in 2019.

### S4. Unrequested Structured Summaries

**Signs to watch:** unnecessary tables, scorecards, comparison grids, checklist
blocks, section recaps, and "key takeaways" added where the user requested
ordinary prose.

**Problem:** LLMs often transform simple answers into structured deliverables.
That can make the text look generated, especially when the structure repeats
information already stated in prose.

**Before:**
> Key takeaways:
>
> | Area | Summary |
> |---|---|
> | Budget | The budget is unchanged. |

**After:**
> The budget is unchanged.

### S5. Correspondence Wrappers

**Signs to watch:** `Subject:`, `Dear`, `I hope this email finds you well`,
`Best regards`, signature blocks, meeting-note wrappers, or message metadata
when the requested output is not an email or memo.

**Problem:** Chatbots frequently default to correspondence formats. If the
target document is article prose, product copy, notes, or a report, these
wrappers should be removed.

**Before:**
> Subject: Quarterly update
>
> Dear team,
>
> I hope this email finds you well. Revenue rose 8 percent.
>
> Best regards,
> [Your Name]

**After:**
> Revenue rose 8 percent in the quarter.

### S6. Abrupt Generation Artifacts

**Signs to watch:** unfinished sentences, duplicated trailing phrases, refusal
remnants, "I cannot assist with that" inside otherwise usable prose, or notes
about being unable to access current information.

**Problem:** Partial completions and safety refusals sometimes get pasted into
the final document. Remove them only when doing so does not remove real
meaning.

**Before:**
> The grant will support three programs across the region, including youth
> training, transit access, and I cannot verify the latest data[truncated]

**After:**
> The grant will support youth training and transit access programs across the
> region.

### S7. Compliance and Quality Performance Claims

**Signs to watch:** "meets all guidelines", "fully compliant", "constructive
and balanced", "high-quality sources", "well-sourced", "adheres to policy",
or broad claims that the text satisfies an external rule set without evidence.

**Problem:** LLMs often assert that their output complies with rules instead
of showing the supporting evidence. In ordinary prose, remove the performance
claim or replace it with the actual evidence.

**Before:**
> This article is well-sourced, neutral, and fully compliant with all relevant
> guidelines.

**After:**
> The article cites city records, court filings, and two interviews.

### S8. Style, Register, or Dialect Discontinuity

**Signs to watch:** sudden shifts from plain to promotional prose, inconsistent
US and UK spellings, abrupt changes in formality, mixed punctuation styles, or
paragraphs that sound copied from a different document.

**Problem:** AI-assisted edits can splice unlike voices together. Smooth the
passage toward the user's requested dialect and tone while preserving facts.

**Before:**
> The app stores receipts locally. Furthermore, its robust capabilities
> exemplify a commitment to seamless customer-centric innovation.

**After:**
> The app stores receipts locally and lets customers retrieve them later.
