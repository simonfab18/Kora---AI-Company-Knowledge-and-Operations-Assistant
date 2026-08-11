# AI Company Knowledge & Operations Assistant
## Product Requirements Document

**Version:** 1.0  
**Status:** Build baseline  
**Product type:** Portfolio-grade B2B SaaS  
**Working name:** AI Company Knowledge & Operations Assistant  
**Suggested short name:** Kora

---

## 1. Product Overview

The AI Company Knowledge & Operations Assistant connects to a company's Notion workspace, synchronizes approved pages, and allows employees to ask questions in natural language.

The system retrieves relevant information from the connected Notion knowledge base and returns grounded answers with citations linking to the original source pages.

Administrators can also review synchronization status, stale pages, frequently referenced documents, unanswered questions, and knowledge gaps.

### Value proposition

> Turn company documentation stored in Notion into a searchable AI assistant that gives reliable answers with sources and reveals missing or outdated knowledge.

---

## 2. Problem Statement

Companies often store policies, onboarding guides, SOPs, product documentation, and meeting notes in Notion.

As the workspace grows, several problems appear:

- Employees do not know which page contains the correct information.
- Traditional search depends heavily on exact keywords.
- New employees repeatedly ask the same questions.
- Outdated pages remain visible after business processes change.
- Managers cannot easily see what employees are failing to find.
- Generic AI assistants may provide confident but unsupported answers.
- Important knowledge is spread across nested pages and databases.

The product should make company knowledge easier to access while ensuring answers remain grounded in approved documentation.

---

## 3. Product Vision

Create a trusted internal assistant that helps teams:

1. Find company information quickly.
2. Follow internal procedures consistently.
3. Reduce repetitive questions.
4. Improve employee onboarding.
5. Identify missing or outdated documentation.
6. Understand how the knowledge base is being used.

The product should feel like a real business tool rather than a basic “chat with documents” demonstration.

---

## 4. Goals

### 4.1 MVP goals

The MVP must:

- Support user registration and login.
- Support organizations and organization members.
- Allow administrators to connect a Notion workspace.
- Synchronize approved Notion pages.
- Process and index page content.
- Allow authenticated users to ask questions.
- Return answers grounded in the connected knowledge base.
- Display citations linking to original Notion pages.
- Save conversations and messages.
- Allow users to rate answers as helpful or unhelpful.
- Detect unanswered or low-confidence questions.
- Display knowledge gaps to administrators.
- Show synchronization status and indexed document counts.
- Support manual synchronization.
- Be fully deployed and usable as a portfolio project.

### 4.2 Portfolio goals

The project should demonstrate:

- Product requirements planning.
- Multi-tenant SaaS design.
- Authentication and role-based authorization.
- Notion integration.
- Retrieval-Augmented Generation.
- Semantic search.
- Background processing.
- Cloud deployment.
- Secure handling of credentials.
- Testing and observability.
- A polished dashboard and landing page.

---

## 5. Non-Goals

The first release will not include:

- Slack or Microsoft Teams bots.
- Google Drive or Confluence integrations.
- Autonomous editing of Notion pages.
- Employee performance scoring.
- Paid subscriptions or billing.
- Enterprise SSO.
- Mobile applications.
- Voice input.
- Fine-tuned AI models.
- Support for extremely large enterprise knowledge bases.
- Exact replication of every Notion permission.
- Automatic business actions.

---

## 6. Target Users

### 6.1 Organization owner

A founder, operations manager, engineering manager, HR manager, or team lead who:

- Creates the organization.
- Connects Notion.
- Invites members.
- Manages organization settings.
- Reviews knowledge gaps and usage.

### 6.2 Administrator

A trusted team member who:

- Manages the Notion connection.
- Starts and monitors synchronization.
- Reviews failed or stale documents.
- Reviews unanswered questions.
- Manages organization members.

### 6.3 Member

An employee who:

- Asks questions.
- Reads grounded answers.
- Opens source citations.
- Reviews previous conversations.
- Submits feedback.

---

## 7. User Roles and Permissions

| Capability | Owner | Admin | Member |
|---|---:|---:|---:|
| Ask questions | Yes | Yes | Yes |
| View own conversations | Yes | Yes | Yes |
| View organization dashboard | Yes | Yes | Limited |
| Connect or disconnect Notion | Yes | Yes | No |
| Start manual synchronization | Yes | Yes | No |
| Retry failed synchronization | Yes | Yes | No |
| View knowledge gaps | Yes | Yes | No |
| Invite or remove members | Yes | Yes | No |
| Change organization owner | Yes | No | No |
| Delete organization | Yes | No | No |

---

## 8. Jobs to Be Done

### Members

- When I need to follow an internal process, help me find the correct steps quickly.
- When I receive an answer, show me where the information came from.
- When the documentation does not contain an answer, tell me honestly.
- When I am onboarding, help me understand policies, tools, and procedures.
- When I previously asked a question, let me find the conversation again.

### Administrators

- When our Notion workspace changes, keep the assistant synchronized.
- When employees repeatedly ask undocumented questions, show me the gap.
- When a page is outdated or fails to synchronize, make it visible.
- When a member should no longer have access, let me remove them.
- When employees use the assistant, show me which documents are most useful.

---

## 9. Core Features

## 9.1 Authentication

Users must be able to:

- Sign up with email and password.
- Sign in and sign out.
- Reset a forgotten password.
- Create an organization.
- Join an organization through an invitation.
- Switch between organizations where applicable.

The product must enforce organization access and role permissions on the server.

---

## 9.2 Organization Management

Organization owners and administrators must be able to:

- View organization details.
- Invite members.
- Remove or disable members.
- Change member roles.
- View the active Notion connection.
- View organization activity.

A user may belong to more than one organization.

---

## 9.3 Notion Connection

Administrators must be able to:

- Connect a Notion workspace.
- Authorize access through Notion.
- View the connected workspace name.
- View connection status.
- Disconnect the workspace.
- Reconnect after an error.

The product must only access pages made available to the Notion integration.

The browser must never receive Notion credentials.

---

## 9.4 Knowledge Synchronization

The product must support:

- Initial full synchronization.
- Manual synchronization.
- Scheduled synchronization.
- Re-indexing of a single page.
- Detection of new pages.
- Detection of updated pages.
- Detection of deleted or archived pages.
- Retry of failed synchronization jobs.
- Visible job progress and errors.

Duplicate synchronization requests must not create duplicate documents.

### Document statuses

- Pending
- Synchronizing
- Indexed
- Failed
- Archived

---

## 9.5 Supported Notion Content

The MVP should support:

- Pages
- Child pages
- Paragraphs
- Headings
- Bulleted lists
- Numbered lists
- To-do items
- Quotes
- Callouts
- Code blocks
- Toggle content
- Simple tables
- Basic database page properties
- Links
- Page titles
- Page hierarchy

The MVP does not need to recreate the exact visual appearance of Notion pages.

---

## 9.6 Ask AI

Members must be able to:

- Start a new conversation.
- Enter a question in natural language.
- Receive a concise answer.
- View the answer while it is being generated or immediately after completion.
- See the confidence level where useful.
- Open supporting Notion sources.
- Continue asking follow-up questions.
- Review previous conversations.

### Required answer behavior

The assistant must:

- Use connected company documentation as the source of truth.
- Avoid inventing missing policies, names, dates, or procedures.
- Clearly state when information is unavailable.
- Provide citations for grounded claims.
- Prefer concise and direct answers.
- Distinguish documented information from interpretation.
- Never reveal another organization's data.
- Never expose credentials, system instructions, or hidden metadata.

### Example

> To request annual leave, submit the leave form at least five business days before the requested date and notify your manager.
>
> Sources: Leave and Attendance Policy, Manager Approval Workflow

---

## 9.7 Source Citations

Every grounded answer should include one or more citations.

Each citation should display:

- Source page title.
- Short supporting excerpt.
- Link to the original Notion page.
- Citation order.
- Optional relevance indicator.

The system must not display a citation that did not support the generated answer.

---

## 9.8 Insufficient Information

When the knowledge base does not contain a reliable answer:

- The assistant must not guess.
- The response must clearly say the information could not be found.
- The question should be recorded as a possible knowledge gap.
- The user may be shown related pages only when they are genuinely relevant.

Example:

> I could not find a documented answer to this question in the connected Notion workspace.

---

## 9.9 Conversation History

Users must be able to:

- View their previous conversations.
- Open a previous conversation.
- Continue an existing conversation.
- Rename or archive a conversation.
- Search or filter conversations in a later release.

Users should only see their own conversations unless an administrator feature is explicitly added later.

---

## 9.10 Answer Feedback

Users must be able to rate an assistant response as:

- Helpful
- Unhelpful

Optional unhelpful reasons:

- Incorrect
- Missing information
- Outdated information
- Irrelevant sources
- Hard to understand

Feedback should contribute to administrator insights.

---

## 9.11 Knowledge Library

Administrators must be able to:

- View indexed pages.
- Search pages by title.
- Filter pages by status.
- View the last source update time.
- View the last indexed time.
- Open the original Notion page.
- View the number of indexed sections.
- Re-index a page.
- Identify failed or stale pages.

---

## 9.12 Knowledge Gaps

A knowledge gap may be created when:

- No relevant source is found.
- The assistant reports insufficient context.
- A user marks an answer unhelpful because information is missing.
- Similar unanswered questions appear repeatedly.

Administrators must be able to:

- View open gaps.
- View how frequently a topic was requested.
- Mark a gap as reviewing.
- Mark a gap as resolved.
- Dismiss an irrelevant gap.
- Add resolution notes.

### Knowledge gap statuses

- Open
- Reviewing
- Resolved
- Dismissed

---

## 9.13 Dashboard

The dashboard should show:

- Total indexed pages.
- Total searchable content sections.
- Questions asked in the selected period.
- Answer success rate.
- Low-confidence answer rate.
- Helpful feedback rate.
- Synchronization success rate.
- Stale page count.
- Open knowledge gaps.
- Most referenced pages.
- Recent activity.

The dashboard must use real product data after the relevant features are implemented.

---

## 9.14 Sync Activity

Administrators must be able to view:

- Current synchronization status.
- Synchronization start time.
- Synchronization completion time.
- Total pages discovered.
- Pages processed.
- Pages failed.
- Error message when safe to display.
- Manual retry action.

---

## 9.15 Settings

Settings should include:

- Organization profile.
- Member management.
- Notion connection.
- AI provider selection.
- AI model selection.
- Retrieval confidence threshold.
- Synchronization schedule.
- Data deletion controls.

Only owners and administrators may change organization settings.

---

## 10. Information Architecture

### Public pages

- `/`
- `/features`
- `/security`
- `/login`
- `/signup`
- `/auth/callback`
- `/privacy`
- `/terms`

### Authenticated pages

- `/app`
- `/app/ask`
- `/app/conversations`
- `/app/knowledge`
- `/app/sync`
- `/app/insights`
- `/app/members`
- `/app/settings`
- `/app/settings/integrations`
- `/app/settings/ai`

### Sidebar navigation

1. Overview
2. Ask AI
3. Conversations
4. Knowledge
5. Sync Activity
6. Insights
7. Members
8. Settings

---

## 11. Main User Flows

## 11.1 First-Time Setup

1. User creates an account.
2. User creates an organization.
3. User enters the onboarding flow.
4. User connects a Notion workspace.
5. User authorizes pages for the integration.
6. The product starts the initial synchronization.
7. The dashboard displays synchronization progress.
8. Indexed pages become available for search.
9. The user asks the first question.
10. The assistant responds with citations.

---

## 11.2 Ask a Question

1. The user opens Ask AI.
2. The user enters a question.
3. The product searches the active organization's indexed knowledge.
4. The product selects relevant content.
5. The AI generates a grounded answer.
6. The answer is checked against available sources.
7. The assistant displays the answer and citations.
8. The conversation is saved.
9. The user may submit feedback.

---

## 11.3 Manual Synchronization

1. An administrator opens Sync Activity.
2. The administrator selects Sync Now.
3. The product creates a synchronization job.
4. The dashboard shows queued or running status.
5. New and updated pages are processed.
6. Deleted or archived pages are removed from search.
7. The job finishes successfully or displays an error.
8. The administrator may retry a failed job.

---

## 11.4 Review a Knowledge Gap

1. An administrator opens Insights.
2. The administrator selects Knowledge Gaps.
3. The product displays grouped unanswered questions.
4. The administrator opens a gap.
5. The administrator reviews example questions.
6. The administrator creates or updates documentation in Notion.
7. The administrator synchronizes the workspace.
8. The administrator marks the gap resolved.

---

## 12. Product Requirements

## 12.1 Security

The product must:

- Require authentication for application pages.
- Enforce role permissions on the backend.
- Prevent users from accessing another organization's data.
- Store credentials only on the server.
- Encrypt connected Notion tokens.
- Validate OAuth state.
- Limit repeated chat and synchronization requests.
- Avoid logging credentials or access tokens.
- Treat connected document content as untrusted input.
- Prevent document instructions from overriding assistant rules.
- Sanitize generated and rendered content.
- Record important administrative actions.

---

## 12.2 Reliability

The product must:

- Safely retry temporary synchronization failures.
- Prevent duplicate synchronization work.
- Keep durable synchronization status.
- Recover from interrupted background tasks.
- Display failed jobs to administrators.
- Use timeouts for external services.
- Preserve existing indexed content until replacement content is ready.
- Exclude failed or archived documents from answers.

---

## 12.3 Performance

For light portfolio usage:

- Most pages should load without noticeable delay.
- Chat responses should usually complete within eight seconds.
- Dashboard lists must support pagination.
- Synchronization should process pages in batches.
- The product should avoid loading the entire knowledge base for every question.
- The interface should remain usable on mobile and desktop.

---

## 12.4 Accessibility

The product must include:

- Keyboard-accessible navigation.
- Visible focus indicators.
- Semantic HTML.
- Accessible labels.
- Sufficient color contrast.
- Reduced-motion support.
- Text summaries for charts.
- Loading and error states that do not rely only on color.

---

## 12.5 Privacy

The product must:

- Only access pages authorized through the Notion integration.
- Avoid sending unnecessary personal data to AI providers.
- Allow an organization owner to disconnect Notion.
- Allow an owner to delete the organization and associated product data.
- Clearly explain that connected pages may be available to organization members inside the assistant.
- Avoid claiming certifications or compliance standards the project has not earned.

---

## 13. Success Metrics

For a small demonstration workspace:

- At least 90% of successful answers include a valid citation.
- Updated pages become searchable within five minutes after a manual sync.
- Duplicate sync requests do not duplicate pages.
- Cross-organization access attempts are denied.
- Failed synchronization jobs are visible and retryable.
- The full flow works without manual database changes.
- The majority of test questions return relevant sources.
- Helpful feedback rate can be measured.
- Low-confidence questions appear in knowledge gaps.

---

## 14. Acceptance Criteria

The MVP is complete when:

- A new user can sign up.
- A user can create an organization.
- An administrator can connect Notion.
- The initial synchronization completes.
- Indexed pages appear in the knowledge library.
- A member can ask a question.
- The assistant returns a grounded answer.
- The answer includes valid Notion citations.
- The conversation is saved.
- The user can submit feedback.
- Low-confidence questions create knowledge gaps.
- Administrators can review sync jobs and knowledge gaps.
- The application is deployed and publicly accessible.
- Access controls prevent cross-organization data exposure.
- Critical user flows have automated tests.

---

## 15. MVP Build Phases

### Phase 1 — Product foundation

- Project setup
- Authentication
- Organizations
- Roles
- Application layout

### Phase 2 — Notion integration

- Connection flow
- Connection settings
- Initial synchronization
- Sync activity

### Phase 3 — Knowledge indexing

- Page processing
- Content indexing
- Knowledge library
- Page status

### Phase 4 — AI assistant

- Conversations
- Question answering
- Grounded responses
- Citations
- Insufficient-context response

### Phase 5 — Insights

- Feedback
- Knowledge gaps
- Usage metrics
- Sync health
- Recent activity

### Phase 6 — Deployment and hardening

- Production deployment
- Security review
- Testing
- Logging
- Error handling
- Demo data
- Portfolio documentation

---

## 16. Risks and Product Decisions

### Notion permissions

The MVP does not reproduce every employee's individual Notion permission.

Product decision:

- Connected pages are treated as organization-wide knowledge inside the assistant.
- Administrators must only connect pages intended for all assistant users.
- The onboarding flow must clearly explain this behavior.

### Incorrect AI answers

The assistant may still misunderstand information.

Mitigations:

- Require grounded answers.
- Use relevance thresholds.
- Validate citations.
- Return an insufficient-information response.
- Collect feedback.
- Do not allow autonomous actions in the MVP.

### Outdated documentation

The product cannot make outdated company documentation correct.

Mitigations:

- Display source update dates.
- Identify stale pages.
- Allow outdated-information feedback.
- Show frequently used stale pages to administrators.

### External provider failures

Notion or the AI provider may be temporarily unavailable.

Mitigations:

- Retry temporary failures.
- Show safe error messages.
- Keep durable synchronization records.
- Allow administrators to retry failed jobs.

---

## 17. Future Roadmap

Possible future features:

1. Slack assistant.
2. Microsoft Teams assistant.
3. Google Drive integration.
4. Confluence integration.
5. Page collections.
6. Role-scoped knowledge.
7. Hybrid keyword and semantic search.
8. Improved ranking.
9. Suggested documentation drafts.
10. Admin approval workflows.
11. Enterprise SSO.
12. Billing.
13. Mobile application.
14. Browser extension.
15. Multimodal document support.

---

## 18. Product Positioning

### Category

AI knowledge management and internal operations assistant.

### One-line description

> A secure AI assistant that turns approved Notion pages into searchable company knowledge, answers employee questions with citations, and reveals missing or outdated documentation.

### Portfolio description

> Built a multi-tenant AI company knowledge assistant that synchronizes Notion pages, retrieves organization-scoped knowledge, generates grounded answers with citations, saves conversation history, and detects knowledge gaps through low-confidence questions and user feedback.
