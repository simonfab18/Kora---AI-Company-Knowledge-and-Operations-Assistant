# Kora AI Answer Quality and Citation UX Improvement Plan

## 1. Objective

Improve Kora so it behaves like a capable company knowledge assistant rather than a system that merely repeats retrieved Notion text.

Kora should:

- Understand the user’s intent.
- Retrieve the most relevant company knowledge.
- Explain retrieved information naturally and clearly.
- Combine information from multiple sources when useful.
- Distinguish complete, partial, ambiguous, and unsupported answers.
- Ask focused follow-up questions when needed.
- Avoid inventing company-specific information.
- Provide compact, trustworthy citations.
- Detect missing documentation as knowledge gaps.

---

## 2. Current Problem

Example question:

```text
How to fix a tire?
```

Current behavior:

```text
I am sorry, but the provided context does not contain step-by-step
instructions...
```

Problems:

1. The answer sounds like a refusal.
2. It repeats the source instead of interpreting it.
3. It does not clarify whether the user means puncture repair, tire replacement, or repairability.
4. It does not provide a useful next step.
5. It exposes retrieval-oriented wording such as “provided context.”
6. The citation card is too large for the amount of evidence shown.
7. The visible “66% match” may be mistaken for answer confidence.

---

## 3. Desired Answer

A better response would be:

```text
A tire puncture may be repairable when it is in the tread area, no larger
than 1/4 inch, and the tire was not driven while flat. [1]

In practice, first check where the damage is and how large it is. Sidewall
damage, a larger puncture, or damage caused by driving while flat may require
replacement instead of repair.

The current company documentation does not include the actual repair steps.
Are you trying to repair a puncture, replace the tire with a spare, or decide
whether the tire is safe to repair?

Sources: [1 Puncture Repair]
```

This answer is still grounded, but it is more natural, useful, and conversational.

---

## 4. Answer Modes

Kora should classify every response into an answer mode.

### Fully Answerable

The available company documentation contains enough information to answer.

Behavior:

- Answer directly.
- Explain important conditions.
- Cite the supporting source.

### Partially Answerable

The sources answer only part of the question.

Behavior:

- Provide the supported information.
- Clearly identify what is missing.
- Suggest a next step.
- Ask a focused follow-up question.

### Ambiguous

The question has multiple likely meanings.

Example:

```text
How to fix a tire?
```

Possible meanings:

- Repair a puncture
- Replace a flat tire
- Decide whether a tire is repairable
- Follow the company’s tire service process

Behavior:

- Give the most useful likely interpretation.
- Ask one concise clarifying question.

### No Reliable Answer

The system cannot find sufficient evidence.

Behavior:

```text
I could not find a reliable answer in the connected company knowledge base.

You can search for a related document, ask a workspace admin, or submit this
question as a knowledge gap.
```

Avoid:

```text
I am sorry, but the provided context does not contain...
```

### Restricted

The answer depends on documents the user cannot access.

Behavior:

```text
You do not have access to the documents required to answer this question.
```

Do not reveal restricted document titles or snippets.

---

## 5. Answer Structure

Use a flexible response structure:

1. **Direct answer**
2. **Explanation**
3. **Conditions, limitations, or safety notes**
4. **Next action or follow-up question**
5. **Inline citations**
6. **Compact source list**

Do not force every response into the same template. The format should adapt to the question.

Supported formats:

- Short paragraphs
- Steps
- Bullet lists
- Comparison tables
- Warnings
- Suggested follow-up questions

---

## 6. Prompting Strategy

The current prompt is likely too restrictive and encourages copying.

### Improved System Prompt

```text
You are Kora, an internal company knowledge assistant.

Answer the user as helpfully and naturally as possible using the retrieved
company knowledge.

Rules:

1. Treat retrieved company documents as the source of truth for
   company-specific facts.
2. Do not simply copy the sources. Explain, organize, and synthesize them.
3. Give the direct answer first.
4. Combine relevant information from multiple sources when appropriate.
5. If the sources only partially answer the question, provide the supported
   part, explain what is missing, and suggest the next best action.
6. If the question is ambiguous, ask a focused clarifying question. You may
   still provide the most likely useful interpretation.
7. Never invent company policies, procedures, numbers, permissions, or facts.
8. General knowledge may be used only when clearly labeled and when it does
   not conflict with company documentation.
9. Attach citations to the claims they support.
10. Do not mention chunks, vector search, context windows, retrieval prompts,
    or other internal implementation details.
11. When no reliable answer is available, say so clearly without apologizing
    and offer a useful next step.
12. Be concise by default, but include enough explanation to be useful.
```

### Prohibited Phrases

Kora should avoid:

```text
The provided context says...
The retrieved chunk contains...
Based on the context window...
I am sorry, but...
```

Prefer:

```text
According to the company’s guidance...
The current documentation confirms...
The knowledge base does not yet include...
```

---

## 7. Company Knowledge and General Knowledge

Kora should use a two-layer policy.

### Company Knowledge

Authoritative for:

- Company policies
- Internal procedures
- Product rules
- Technical documentation
- Team responsibilities
- Private organizational information

### General Knowledge

May be used carefully for:

- Explaining common concepts
- Interpreting company documentation
- Giving general safety guidance
- Suggesting standard next steps

General knowledge must be labeled when it goes beyond the source.

Example:

```text
The company documentation confirms the conditions under which a puncture may
be repairable. As general safety guidance, a damaged tire should be inspected
by a qualified technician before continued use.
```

General knowledge must never overwrite or invent internal company policy.

---

## 8. Retrieval Improvement Plan

### Query Understanding

Before retrieval, identify:

- Intent
- Topic
- Entities
- Requested action
- Department or collection
- Ambiguity
- Whether clarification is required

Example:

```text
Original question: How to fix a tire?
Intent: Procedure request
Topic: Tire repair
Ambiguity: High
```

### Query Rewriting

Generate several retrieval queries:

```text
tire puncture repair procedure
flat tire replacement instructions
tire repair eligibility
tire damage service policy
```

### Hybrid Search

Use both:

- pgvector semantic search
- PostgreSQL full-text or keyword search

Pipeline:

```text
Question
→ Query rewriting
→ Vector search
→ Keyword search
→ Merge results
→ Remove duplicates
→ Rerank
```

### Reranking

Rerank retrieved chunks using:

- Relevance to the exact question
- Source authority
- Document recency
- Organization and permission scope
- Section completeness
- Whether the chunk contains instructions or only background information

### Neighboring Context

When a chunk is selected, optionally retrieve:

- Previous chunk
- Next chunk
- Parent heading
- Document title
- Section hierarchy

This prevents answers from relying on isolated sentences.

### Metadata Filtering

Always filter by:

- `organization_id`
- User permissions
- Source status
- Document status
- Collection or department when relevant
- Language
- Last synchronized date

### Confidence

Do not treat raw vector similarity as answer confidence.

Internally calculate confidence using:

- Vector score
- Keyword score
- Reranker score
- Number of supporting sources
- Agreement between sources
- Query coverage
- Source completeness

Possible internal states:

```text
high
medium
low
```

These states should influence answer behavior.

---

## 9. Chunking Improvements

Use structure-aware chunking.

Split Notion pages using:

- Headings
- Subheadings
- Paragraphs
- Lists
- Tables
- Callouts
- Toggles

Preserve hierarchy:

```text
Document: Metroo Tire Company Knowledge Base
Section: Tire Repair
Subsection: Puncture Repair
```

Recommended starting configuration:

```text
Chunk size: 400–800 tokens
Overlap: 50–120 tokens
```

Rules:

- Keep numbered procedures together.
- Keep warnings with the related instructions.
- Keep tables intact where possible.
- Do not separate headings from their content.
- Store section and page metadata with each chunk.
- Add contextual prefixes for embedding, but do not show those prefixes as source text.

---

## 10. Multi-Stage RAG Pipeline

```text
1. Receive user question
2. Validate authentication and organization access
3. Classify intent and ambiguity
4. Rewrite the query
5. Run hybrid retrieval
6. Apply permission and metadata filters
7. Rerank results
8. Retrieve neighboring context
9. Calculate retrieval confidence
10. Select an answer mode
11. Build the grounded prompt
12. Generate the answer
13. Validate claims and citations
14. Return the answer with compact citations
15. Collect feedback
16. Record a knowledge gap when appropriate
```

---

## 11. Answer Validation

Before returning an answer, verify:

- Company-specific claims are supported.
- Citations refer to sources actually used.
- Restricted content is not exposed.
- The answer does not contradict the sources.
- Weak retrieval is not presented with high confidence.
- The answer does not mention internal retrieval terminology.
- The response addresses the user’s actual question.

### Optional Second-Pass Evaluator

Use a smaller model to return:

```json
{
  "grounded": true,
  "complete": false,
  "citation_valid": true,
  "needs_clarification": true
}
```

When validation fails:

- Regenerate the answer.
- Remove unsupported details.
- Switch to partial-answer mode.
- Ask a clarifying question.

---

## 12. Citation UX Redesign

### Current Problems

The existing citation card:

- Uses too much vertical space.
- Displays full source text by default.
- Shows actions as large buttons.
- Shows a raw match percentage.
- Looks more like a developer debug panel than a normal user citation.

### Recommended Default

Use inline citation markers:

```text
A puncture may be repairable when it is in the tread area and no larger than
1/4 inch. [1]
```

Show a compact source row below the answer:

```text
Sources (1)
[1] Puncture Repair · Metroo Tire Company Knowledge Base
```

### Expanded Citation

Clicking the source should open a compact popover, accordion, or side panel:

```text
Puncture Repair
Metroo Tire Company Knowledge Base

“A puncture may be repairable if it is located in the tread area...”

View in Kora     Open in Notion
```

### Remove Match Percentage From Normal UI

Remove:

```text
66% match
```

Reasons:

- Similarity is not the same as answer confidence.
- Users may misunderstand the number.
- It suggests false precision.
- It adds visual noise.

Keep raw scores only in:

- Developer diagnostics
- Admin retrieval traces
- Evaluation tools

### Compact UI Rules

- Align width with the answer body.
- Use smaller text than the main answer.
- Use reduced padding.
- Show only one or two lines in collapsed state.
- Hide full source text until expanded.
- Use subtle borders and backgrounds.
- Make all actions keyboard accessible.
- Use icons for Kora and Notion links when space is limited.

### MVP Citation Pattern

Use:

```text
Inline markers + collapsible source list
```

Later, add a desktop evidence side panel.

---

## 13. Answer UI Improvements

### Header

Display:

- Kora avatar
- Timestamp
- Copy button
- Feedback controls

Replace unexplained labels such as:

```text
medium
```

with meaningful labels:

```text
Grounded in 1 source
Partial answer
More information needed
```

### Footer

Display:

```text
Sources (1)     Helpful? 👍 👎
```

Optional:

```text
Ask a follow-up
Submit as knowledge gap
```

### Suggested Follow-Ups

For the tire example:

```text
Can this puncture be repaired?
When should a tire be replaced?
How do I inspect the sidewall?
```

Suggested questions should come from:

- User intent
- Retrieved evidence
- Missing information
- Related document sections

---

## 14. Knowledge Gap Detection

The example reveals a documentation gap:

```text
The knowledge base explains repairability but not the repair procedure.
```

Create a gap record:

```text
Question: How to fix a tire?
Gap: No step-by-step tire repair procedure found
Related source: Metroo Tire Company Knowledge Base
Suggested article: Tire Puncture Repair Procedure
```

User action:

```text
This question may reveal missing documentation.
[Submit as knowledge gap]
```

Admin dashboard should show:

- Normalized missing topic
- Example questions
- Number of occurrences
- Related documents
- Suggested article title
- Assigned owner
- Status
- First and latest occurrence

---

## 15. Personalization

Adapt answer presentation based on:

- Role
- Department
- Organization preferences
- Requested detail level
- Question type

Examples:

**Technician**

```text
Provide steps, required tools, and safety warnings.
```

**Customer support agent**

```text
Provide a customer-friendly explanation and escalation guidance.
```

**Manager**

```text
Summarize the rule, risk, and required decision.
```

Personalization must never change factual grounding.

---

## 16. Answer Length

Support:

```text
Concise
Balanced
Detailed
```

Default:

```text
Balanced
```

### Concise

- Direct answer
- Essential condition
- Citation

### Balanced

- Direct answer
- Explanation
- Conditions
- Next step

### Detailed

- Structured explanation
- Examples
- Warnings
- Related information
- Multiple citations

---

## 17. Feedback Loop

Allow users to select:

- Helpful
- Not helpful
- Incorrect
- Missing information
- Wrong citation
- Too vague
- Too long

Store:

```text
question
answer
answer_mode
retrieved_chunks
vector_scores
reranker_scores
citations
feedback_type
feedback_comment
organization_id
user_role
model
prompt_version
created_at
```

Use feedback to:

- Improve retrieval
- Adjust chunking
- Refine prompts
- Add query synonyms
- Identify stale documents
- Create missing documentation
- Compare model versions

---

## 18. Evaluation Plan

Create a fixed RAG evaluation dataset.

| Question | Expected source | Expected fact | Expected mode |
|---|---|---|---|
| How to fix a tire? | Puncture Repair | Repairability conditions | Partial |
| What size puncture is repairable? | Puncture Repair | 1/4 inch or smaller | Full |
| Can a sidewall puncture be repaired? | Puncture Repair | Current criteria only cover tread damage | Partial |
| How many leave days are provided? | Leave Policy | Expected leave count | Full |
| Who approves remote work? | Remote Work Policy | Expected approver | Full |

### Retrieval Metrics

- Recall@K
- Precision@K
- Correct source in top 3
- Mean reciprocal rank

### Answer Metrics

- Relevance
- Groundedness
- Completeness
- Citation accuracy
- Hallucination rate
- Clarification quality

### Product Metrics

- Helpful-answer rate
- No-answer rate
- Knowledge-gap rate
- Follow-up rate
- Citation open rate
- Time to useful answer

---

## 19. Testing Plan

### Unit Tests

Test:

- Intent classification
- Query rewriting
- Answer-mode selection
- Confidence thresholds
- Citation formatting
- Knowledge-gap creation
- Permission filtering

### Integration Tests

Test:

- pgvector search
- Full-text search
- Hybrid retrieval
- Reranking
- Neighbor chunk retrieval
- Prompt construction
- Citation mapping
- Organization isolation

### End-to-End Tests

```text
User asks a question
→ correct source is retrieved
→ grounded answer appears
→ inline citation appears
→ citation expands
→ Kora and Notion links work
→ feedback can be submitted
```

### AI Evaluation Tests

For fixed questions, check:

- Expected facts are present.
- Expected source is cited.
- Unsupported claims are absent.
- Correct answer mode is selected.
- Clarifying question is useful.

---

## 20. Observability

Store an internal trace for every answer:

```text
request_id
organization_id
user_id
original_query
rewritten_queries
retrieved_chunk_ids
vector_scores
keyword_scores
reranker_scores
selected_sources
answer_mode
prompt_version
model
latency_ms
token_usage
validation_result
```

Create an admin-only debug view showing:

- Original query
- Rewritten queries
- Retrieved evidence
- Scores
- Prompt version
- Generated answer
- Citation mapping
- Validation warnings

Normal users must not see this debug data.

---

## 21. Database Additions

### `answer_traces`

```text
id
organization_id
user_id
conversation_id
question
rewritten_queries
answer
answer_mode
model
prompt_version
retrieval_confidence
validation_status
latency_ms
input_tokens
output_tokens
created_at
```

### `answer_evidence`

```text
id
answer_trace_id
chunk_id
source_id
vector_score
keyword_score
reranker_score
citation_number
used_in_answer
created_at
```

### `answer_feedback`

```text
id
answer_trace_id
user_id
rating
feedback_type
comment
created_at
```

### `knowledge_gaps`

```text
id
organization_id
normalized_topic
example_question
related_source_id
occurrence_count
status
assigned_to
first_seen_at
last_seen_at
resolved_at
```

---

## 22. API Response Design

Suggested endpoint:

```text
POST /v1/assistant/query
```

Example response:

```json
{
  "answer_id": "uuid",
  "answer": "A tire puncture may be repairable...",
  "answer_mode": "partial",
  "status_label": "Partial answer",
  "follow_up_question": "Are you trying to repair a puncture or replace a flat tire?",
  "citations": [
    {
      "number": 1,
      "document_title": "Metroo Tire Company Knowledge Base",
      "section_title": "Puncture Repair",
      "preview": "A puncture may be repairable if...",
      "internal_url": "/app/knowledge/...",
      "external_url": "https://notion.so/..."
    }
  ],
  "knowledge_gap_detected": true
}
```

Do not return raw similarity percentages to the normal UI.

Other endpoints:

```text
POST /v1/assistant/feedback
GET  /v1/assistant/answers/{answer_id}/sources
POST /v1/knowledge-gaps
GET  /v1/admin/answer-traces/{answer_id}
GET  /v1/admin/evaluations
```

---

## 23. Implementation Phases

### Phase 1 — Prompt and Answer Behavior

- Add answer modes.
- Replace refusal-like language.
- Add direct-answer-first behavior.
- Add partial-answer handling.
- Add clarifying questions.
- Prevent internal retrieval terminology.
- Add suggested follow-ups.

### Phase 2 — Citation UI

- Add inline citation markers.
- Replace the large card with a compact source row.
- Hide source text by default.
- Remove visible match percentages.
- Add expandable source details.
- Preserve View in Kora and Open in Notion actions.

### Phase 3 — Retrieval Quality

- Add query rewriting.
- Add hybrid search.
- Add metadata filtering.
- Add neighboring chunks.
- Add reranking.
- Add internal confidence calculation.

### Phase 4 — Validation

- Validate citations.
- Detect unsupported claims.
- Add partial-answer fallback.
- Add an optional second-pass evaluator.

### Phase 5 — Knowledge Gaps

- Detect incomplete documentation.
- Record and group repeated gaps.
- Add Submit as knowledge gap.
- Build the admin knowledge-gap view.

### Phase 6 — Evaluation and Analytics

- Create a fixed evaluation dataset.
- Track retrieval and answer metrics.
- Store user feedback.
- Compare model and prompt versions.
- Add admin diagnostics.

---

## 24. Acceptance Criteria

The improvement is complete when:

- Kora answers directly before explaining limitations.
- Kora explains and synthesizes retrieved knowledge instead of copying it.
- Kora distinguishes complete, partial, ambiguous, unsupported, and restricted answers.
- Ambiguous questions receive a focused follow-up question.
- Company-specific facts remain grounded.
- General knowledge is clearly distinguished from company knowledge.
- Relevant information from multiple sources can be combined.
- Citations appear beside supported claims.
- Citation cards are compact by default.
- Source text is hidden until expanded.
- Raw match percentages are removed from the normal UI.
- Users can open sources in Kora or Notion.
- Missing documentation can be submitted as a knowledge gap.
- User feedback is stored.
- Retrieval traces are available to authorized developers or admins.
- Organization and document permissions are enforced before generation.
- Fixed RAG evaluation tests pass before deployment.
