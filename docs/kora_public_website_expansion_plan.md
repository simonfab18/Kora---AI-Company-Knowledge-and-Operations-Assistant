# Kora Public Website Expansion Plan

## Purpose

This document defines how to expand Kora’s public website beyond the current homepage, documentation, login, and signup pages.

The goal is to help visitors clearly understand:

- What Kora is
- Who it is for
- What problem it solves
- How it works
- How it differs from a general chatbot
- How answers remain grounded in company knowledge
- What features are available
- How teams use it
- How security and organization isolation work
- What happens after signup
- How to get started

The existing visual language must remain unchanged. Preserve the dark theme, glass surfaces, typography, borders, spacing, button treatment, iconography, and overall premium enterprise feel.

---

# 1. Current Website Assessment

## Existing Public Pages

- Homepage
- Documentation
- Login
- Signup

## Existing Strengths

The current homepage already communicates:

- Enterprise knowledge assistant positioning
- Searchable company knowledge
- Grounded answers
- Verifiable sources
- Sync visibility
- Knowledge health
- Knowledge gaps
- Team use cases
- Security principles
- FAQ
- Final call to action

## Current Gaps

Visitors may still ask:

- What exactly happens after signup?
- How does Notion connection work?
- How does Kora process documents?
- How is Kora different from ChatGPT?
- Who inside a company uses it?
- What does the real product look like?
- How does Kora avoid unsupported answers?
- What are collections and knowledge gaps?
- How do roles and permissions work?
- Is the product free?
- What happens when documentation does not contain the answer?
- How can users verify a citation?
- How is one organization isolated from another?

The expanded public website should answer these questions directly.

---

# 2. Public Website Goals

## Product Education

Explain the product in plain language.

## Trust Building

Show how answers are grounded, cited, scoped, and auditable.

## Product Demonstration

Use real product screenshots where they help visitors understand a capability.

## Conversion

Guide visitors toward:

- Creating an account
- Requesting access
- Reading the documentation
- Exploring the product
- Understanding the portfolio project

---

# 3. Recommended Site Structure

## Main Navigation

```text
Product
Solutions
How It Works
Security
Resources
Documentation
Pricing
```

Right-side actions:

```text
Login
Request Access
```

Optional later:

```text
Try Demo
```

## Recommended Routes

```text
/
/product
/how-it-works
/solutions
/security
/integrations
/knowledge-gaps
/pricing
/about
/roadmap
/changelog
/documentation
/support
/privacy
/terms
/login
/signup
```

## First Release Priority

Build these first:

```text
/product
/how-it-works
/solutions
/security
/integrations
/pricing
/about
```

---

# 4. Homepage Expansion

Keep the existing homepage and visual structure. Add only sections that improve product understanding.

## Hero Supporting Copy

Keep the current headline:

```text
Your company knowledge, instantly accessible.
```

Recommended supporting copy:

```text
Kora connects approved company knowledge from Notion, turns it into a searchable AI workspace, and gives employees clear answers with citations back to the original source.
```

Add a smaller supporting line:

```text
Built for internal policies, operating procedures, technical documentation, onboarding guides, and team knowledge.
```

## New Section: What Kora Is

Heading:

```text
One place to ask your company anything.
```

Copy:

```text
Kora is an internal knowledge assistant for teams that already maintain documentation in Notion.

Instead of searching through pages, folders, and team messages, employees can ask a question in natural language and receive an answer grounded in approved company content.
```

Three compact cards:

### Ask

Employees ask questions in plain language.

### Verify

Every supported answer links back to the original source.

### Improve

Admins see where documentation is missing, outdated, or incomplete.

## New Section: Why Teams Need Kora

Heading:

```text
Company knowledge exists. Finding it is the problem.
```

Content:

- Important answers are scattered across Notion pages.
- New hires repeatedly ask the same questions.
- Teams rely on memory instead of documented processes.
- Old pages remain accessible after procedures change.
- Employees do not always know which source is authoritative.
- General AI tools do not automatically understand private company knowledge.

## New Section: Kora vs. General Chatbots

Heading:

```text
Not a general chatbot. A grounded company assistant.
```

### General Chatbot

- Does not automatically know internal company documentation
- May answer from general training data
- Cannot reliably cite private company sources
- Does not understand organization-specific permissions

### Kora

- Retrieves approved company knowledge before answering
- Grounds answers in synced documents
- Includes source citations
- Applies organization and role-based access
- Detects missing documentation
- Supports source verification in Kora and Notion

## New Section: Product Workflow

Heading:

```text
From Notion pages to trustworthy answers.
```

Flow:

```text
1. Connect Notion
2. Choose approved pages
3. Sync and process knowledge
4. Ask questions
5. Verify citations
6. Review knowledge gaps
```

## New Section: When Kora Cannot Answer

Heading:

```text
Honest when the answer is missing.
```

Copy:

```text
Kora does not pretend every question has an answer.

When connected documentation is incomplete, Kora explains what it found, identifies what is missing, asks a focused follow-up question, and can record the request as a knowledge gap for administrators.
```

## New Section: Role-Based Experience

Heading:

```text
Built for every role in the organization.
```

### Owner

- Creates the organization
- Connects Notion
- Manages settings
- Reviews usage
- Invites users

### Admin

- Manages sources
- Starts syncs
- Reviews knowledge gaps
- Maintains collections
- Monitors sync health

### Member

- Asks questions
- Opens citations
- Searches approved knowledge
- Gives answer feedback

## New Section: Product Screenshots

Heading:

```text
See Kora in action.
```

Recommended screenshots:

- AI assistant answer with compact citations
- Dashboard showing sync health and knowledge gaps

Each screenshot must explain a real capability and include a caption.

Example caption:

```text
Ask a natural-language question, review the answer, and open the exact source used by Kora.
```

## Portfolio Project Notice

Add a subtle, honest statement on the About page, Pricing page, and footer:

```text
Kora is a portfolio SaaS project created to demonstrate modern web development, AI retrieval, multi-tenant architecture, cloud deployment, background processing, and production-style product design.
```

---

# 5. Product Page

## Route

```text
/product
```

## Purpose

Give a complete overview of Kora’s main product areas.

## Hero

Heading:

```text
A complete operating layer for company knowledge.
```

Copy:

```text
Kora turns approved Notion content into a searchable, cited, and continuously improving internal knowledge system.
```

Calls to action:

```text
Request Access
Read the Documentation
```

## Product Areas

### AI Assistant

Explain:

- Natural-language questions
- Grounded responses
- Inline citations
- Suggested follow-ups
- Partial-answer behavior
- Feedback controls

Recommended screenshot:

- Assistant conversation view

### Knowledge Library

Explain:

- Synced documents
- Source metadata
- Collections
- Search
- Document status
- Last synchronized time

Recommended screenshot:

- Knowledge library page

### Source Management

Explain:

- Notion OAuth
- Approved page selection
- Manual sync
- Automatic sync
- Sync status
- Failed page handling

Recommended screenshot:

- Source connection or sync setup

### Knowledge Gaps

Explain:

- Unanswered questions
- Repeated missing topics
- Suggested documentation
- Gap assignment
- Resolution workflow

Recommended screenshot:

- Knowledge gap dashboard

### Members and Roles

Explain:

- Owner, admin, and member roles
- Invitations
- Organization-scoped access
- Permission-aware retrieval

Recommended screenshot:

- Members page

### Analytics and Usage

Explain:

- Questions asked
- Answers generated
- Documents indexed
- AI usage
- Sync activity
- Knowledge gap trends

Recommended screenshot:

- Dashboard or usage page

## Product Principles

Heading:

```text
Designed around trust, clarity, and control.
```

Cards:

- Grounded by default
- Verifiable sources
- Scoped permissions
- Honest uncertainty
- Operational visibility
- Documentation improvement

---

# 6. How It Works Page

## Route

```text
/how-it-works
```

## Hero

```text
How Kora turns documentation into answers.
```

## Step 1 — Create the Workspace

Explain:

- Sign up
- Create an organization
- Complete company onboarding
- Set company profile and use case

## Step 2 — Connect Notion

Explain:

- Secure OAuth connection
- Approved pages only
- Organization owners control scope
- Tokens are stored securely

## Step 3 — Sync Knowledge

Public explanation:

```text
Kora reads the selected pages, preserves useful structure, divides long content into smaller searchable sections, and prepares the content for semantic search.
```

Expandable technical note:

```text
Kora uses chunking, embeddings, PostgreSQL, and pgvector to retrieve relevant sections by meaning.
```

## Step 4 — Ask a Question

Explain:

- User asks in natural language
- Kora interprets intent
- Search runs across approved sources
- Relevant evidence is retrieved

## Step 5 — Generate a Grounded Answer

Explain:

- Kora synthesizes retrieved information
- It does not merely copy the source
- It separates supported and unsupported information
- It adds citations

## Step 6 — Verify the Source

Explain:

- Inline citations
- View inside Kora
- Open the original Notion page
- Compact source previews

## Step 7 — Improve the Knowledge Base

Explain:

- User feedback
- Knowledge gaps
- Repeated missing questions
- Admin review and resolution

## Architecture Summary

Display a visual diagram:

```text
Next.js frontend
→ FastAPI API
→ Supabase PostgreSQL + pgvector
→ Notion API
→ AI provider
→ Cloud background processing
```

Use the current design language for the diagram.

---

# 7. Solutions Page

## Route

```text
/solutions
```

## Hero

```text
One knowledge assistant, shaped around every team.
```

## Engineering

Use cases:

- Development setup
- Deployment procedures
- Architecture decisions
- Incident response
- Coding standards
- Runbooks
- Pull request process

Example question:

```text
How do I deploy the staging API?
```

## Operations

Use cases:

- Standard operating procedures
- Escalation paths
- Internal workflows
- Vendor processes
- Service procedures
- Compliance steps

Example question:

```text
What is the approved process for handling a failed sync?
```

## Human Resources

Use cases:

- Leave policy
- Benefits
- Onboarding
- Employee handbook
- Remote work
- Internal policies

Example question:

```text
How many paid leave days are available?
```

## Customer Support

Use cases:

- Support procedures
- Escalation rules
- Product guidance
- Response standards
- Troubleshooting
- Internal macros

Example question:

```text
When should this issue be escalated to engineering?
```

## Shared Benefits

- Faster onboarding
- Fewer repeated questions
- More consistent answers
- Less time spent searching
- Easier source verification
- Better documentation visibility

---

# 8. Security Page

## Route

```text
/security
```

## Hero

```text
Company knowledge stays scoped, controlled, and auditable.
```

## Organization Isolation

Explain:

- Every record is scoped by organization
- One organization cannot access another organization’s data
- Retrieval applies organization filters before generation

## Role-Based Access

Explain:

- Owner permissions
- Admin permissions
- Member permissions
- Restricted source handling

## Approved Sources Only

Explain:

- Kora indexes only selected pages
- Admins control source access
- Notion permissions remain important

## Token Protection

Explain:

- Integration credentials are encrypted
- Service credentials remain on the backend
- Tokens never reach the browser

## Grounded Responses

Explain:

- Answers rely on retrieved evidence
- Citations show supporting sources
- Missing information is clearly identified

## Prompt Injection Protection

Explain at a high level:

- Source text is treated as data
- System instructions remain separate
- Suspicious instructions in documents are not treated as trusted commands
- Access rules are enforced outside the model

## Logs and Traces

Explain:

- Operational logs
- Sync job IDs
- Error tracking
- Answer traces for authorized admins
- No secrets in logs

## Portfolio Limitation

Use an honest statement:

```text
Kora is a portfolio project and is not currently certified for regulated enterprise workloads.
```

Do not claim certifications or compliance standards that are not implemented.

---

# 9. Integrations Page

## Route

```text
/integrations
```

## Current Integration: Notion

Explain:

- OAuth connection
- Approved pages
- Manual sync
- Automatic sync
- Source links
- Sync status
- Disconnect option

Add a screenshot only when the Notion integration UI is complete.

## Planned Integrations

Clearly label these as planned:

- Google Drive
- Confluence
- SharePoint
- Uploaded documents
- Slack knowledge
- Internal web pages

Use status labels:

```text
Available
In development
Planned
```

Never present planned integrations as available.

---

# 10. Knowledge Gaps Page

## Route

```text
/knowledge-gaps
```

## Hero

```text
See what your documentation still cannot answer.
```

## Core Message

```text
Most knowledge systems show what exists.

Kora also shows what employees are repeatedly looking for but cannot find.
```

## Workflow

```text
Question receives an incomplete answer
→ Kora records the missing topic
→ Similar questions are grouped
→ Admin reviews the gap
→ Documentation is created or updated
→ Gap is marked resolved
```

## Example

```text
Question:
How do I repair a tire puncture?

Existing knowledge:
Repairability criteria

Missing knowledge:
Step-by-step repair procedure
```

## Admin Benefits

- Prioritize documentation work
- See repeated unanswered topics
- Assign owners
- Track resolution
- Improve onboarding and operations

---

# 11. Pricing Page

## Route

```text
/pricing
```

## Plan

```text
Portfolio Free
$0
```

Included:

- One organization
- Notion integration
- Knowledge sync
- AI assistant
- Citations
- Knowledge gaps
- Members and roles
- Usage dashboard
- Public documentation
- Demonstration limits

## Free Plan Notice

```text
Kora is currently free for portfolio and demonstration purposes.

No payment method is required, and no billing is processed.
```

## Suggested Demonstration Limits

- Up to 100 documents
- Up to 10 members
- Up to 500 questions per month
- One connected Notion workspace
- Manual and scheduled sync

Do not implement Stripe or real billing unless the product later becomes commercial.

CTA:

```text
Create Free Workspace
```

---

# 12. About Page

## Route

```text
/about
```

## Suggested Copy

```text
Kora was created as a portfolio SaaS project focused on a common operational problem: companies often have documentation, but employees still struggle to find trusted answers quickly.

The project combines product design, full-stack development, AI retrieval, multi-tenant architecture, background processing, cloud deployment, testing, and documentation into one complete system.
```

## What the Project Demonstrates

- Product discovery
- SaaS onboarding
- Multi-tenancy
- Authentication and roles
- Notion OAuth
- Retrieval-augmented generation
- Embeddings
- pgvector
- Background jobs
- CI/CD
- Cloud deployment
- Testing
- Observability
- Security design

## Creator Section

Include:

- Creator name
- Short professional introduction
- GitHub
- Portfolio
- LinkedIn, when available

Keep the section professional and consistent with the site.

---

# 13. Roadmap Page

## Route

```text
/roadmap
```

## Status Categories

```text
Released
In Progress
Planned
Exploring
```

## Example Roadmap

### Released

- Authentication
- Organizations
- Notion connection
- Knowledge sync
- AI assistant
- Citations
- Members
- Knowledge gaps

### In Progress

- Improved answer synthesis
- Compact citation experience
- AI usage dashboard
- Public documentation
- Onboarding personalization

### Planned

- Additional knowledge sources
- Advanced analytics
- Suggested documentation drafts
- Collection-level permissions
- Team-specific assistant modes

Do not promise release dates unless they are realistic.

---

# 14. Changelog Page

## Route

```text
/changelog
```

Each entry should include:

- Date
- Version or release name
- Summary
- Improvements
- Fixes
- Screenshot when useful

Example:

```text
Answer Quality Update

- Added partial-answer mode
- Added clarification questions
- Improved citation layout
- Removed raw vector match percentages
```

---

# 15. Support Page

## Route

```text
/support
```

Include:

- Documentation link
- Contact form
- Report a problem
- Common troubleshooting links
- System status link, if later implemented

Support categories:

- Account
- Notion connection
- Synchronization
- AI answer
- Citation
- Members
- Permissions
- Other

---

# 16. Documentation Expansion

The documentation should become a complete public product guide.

## Getting Started

- What Kora is
- Who Kora is for
- Creating an account
- Creating an organization
- Completing onboarding
- Understanding roles

## Notion Integration

- Connecting Notion
- Approving pages
- Selecting sources
- Starting a sync
- Disconnecting Notion
- Troubleshooting OAuth

## Knowledge Sync

- How sync works
- Manual sync
- Automatic sync
- Sync statuses
- Failed pages
- Retry behavior

## AI Assistant

- Asking questions
- Answer modes
- Citations
- Follow-up questions
- Feedback
- No-answer behavior

## Knowledge Library

- Viewing documents
- Collections
- Source status
- Metadata
- Search

## Knowledge Gaps

- Gap detection
- Reviewing gaps
- Assigning work
- Resolving gaps

## Members and Roles

- Owner
- Admin
- Member
- Invitations
- Permission rules

## Usage

- AI usage
- Documents indexed
- Questions asked
- Portfolio limits

## Settings

- Profile
- Account
- Organization
- Billing
- Notifications

## Security

- Data isolation
- Approved sources
- Token protection
- Prompt injection handling
- Privacy considerations

## Troubleshooting

- Cannot connect Notion
- Sync remains pending
- Sync failed
- Missing document
- Incorrect answer
- Missing citation
- Permission denied
- Invitation not received

## Technical Concepts

Explain simply:

- RAG
- Chunking
- Embeddings
- pgvector
- Vector search
- Hybrid search
- Reranking
- Grounded answers

---

# 17. Screenshot Strategy

## Can the Coding Agent Capture Screenshots?

Yes. A coding agent can capture screenshots if it can access:

- The running local application
- A preview deployment
- A browser automation tool such as Playwright

Recommended flow:

```text
Start the application
→ Seed realistic demo data
→ Open a target page using Playwright
→ Set a fixed viewport
→ Wait for the UI to stabilize
→ Hide sensitive or unstable data
→ Capture the screenshot
→ Save and optimize the image
→ Add it to the public page
```

## Recommended Tool

Use Playwright.

Example:

```bash
npm run dev
npx playwright test screenshots.spec.ts
```

The script can:

- Log into a demo account
- Navigate to a specific route
- Wait for loading states to finish
- Capture a page or component
- Save the image under `public/screenshots/`

## Good Screenshot Candidates

- AI assistant answer with compact citations
- Knowledge health dashboard
- Notion source setup
- Knowledge library
- Knowledge gaps dashboard
- Members and roles
- Onboarding flow

## Avoid Screenshots Of

- Login form
- Signup form
- Empty pages
- Repetitive settings pages
- Unfinished features
- Real user or company data

## Screenshot Rules

- Use realistic demo data
- Use a consistent viewport
- Preserve the current dark theme
- Do not crop important context
- Hide browser chrome unless intentionally shown
- Use high-resolution PNG or WebP
- Add descriptive alt text
- Optimize file size
- Avoid localhost URLs in final public images unless intentional

## Recommended Sizes

```text
Desktop: 1440 × 900
Wide product section: 1600 × 1000
Component screenshot: 1200 × 750
```

## File Structure

```text
public/
└── screenshots/
    ├── assistant-citations.webp
    ├── knowledge-dashboard.webp
    ├── notion-sync.webp
    ├── knowledge-library.webp
    ├── knowledge-gaps.webp
    ├── members.webp
    └── onboarding.webp
```

## Reusable Screenshot Component

Create:

```text
ProductScreenshot
```

Suggested props:

- `src`
- `alt`
- `caption`
- `aspectRatio`
- `priority`
- `showBrowserFrame`
- `position`

The component must preserve the current glass, border, shadow, and radius language.

---

# 18. Navigation and Footer Updates

## Header Groups

### Product

- Product Overview
- Features
- How It Works
- Knowledge Gaps

### Solutions

- Engineering
- Operations
- HR
- Support

### Resources

- Documentation
- Roadmap
- Changelog
- Support

### Company

- About
- Security
- Privacy
- Terms

## Footer Groups

### Product

- Product
- Features
- Integrations
- Security
- Pricing

### Solutions

- Engineering
- Operations
- HR
- Support

### Resources

- Documentation
- Getting Started
- Roadmap
- Changelog
- Support

### Company

- About
- Privacy
- Terms

Also include:

- GitHub
- LinkedIn
- Copyright
- Portfolio project notice

---

# 19. Content Rules for the Coding Agent

The coding agent must use actual Kora functionality and project documentation as the source of truth.

## Required Rules

- Do not invent features.
- Do not claim enterprise certifications.
- Do not claim customers, revenue, or usage statistics.
- Do not claim integrations that are not available.
- Label planned features clearly.
- Do not add generic AI marketing language without explaining the actual feature.
- Keep terminology consistent.
- Use “organization,” “workspace,” “knowledge source,” “sync,” “collection,” “knowledge gap,” and “citation” consistently.
- Keep Notion as the primary supported integration.
- State that the current product is free for portfolio purposes.
- Do not add fake testimonials.
- Do not add fake company logos.
- Do not add fake case studies.
- Do not add fake security badges.
- Do not add fake uptime guarantees.
- Do not claim zero hallucinations.
- Do not claim production readiness unless it is true.

## Tone

Use:

- Clear
- Confident
- Professional
- Specific
- Product-focused
- Honest

Avoid:

- Excessive hype
- Empty slogans
- Overly technical language on public pages
- Repetitive copy
- Unverifiable claims

---

# 20. Design Rules

Do not redesign the current visual system.

Preserve:

- Deep black background
- Refined glass surfaces
- Thin borders
- Soft blur
- Existing typography scale
- Existing corner radius
- Existing button styles
- Existing icon treatment
- Existing spacing rhythm
- Existing blue and green accents
- Existing card system
- Existing screenshot framing
- Existing responsive behavior

## Layout Rules

- Use generous vertical spacing.
- Keep copy width readable.
- Use compact labels above section headings.
- Alternate text and visual layouts.
- Avoid making every section a grid of cards.
- Use screenshots as proof, not decoration.
- Keep animations subtle.
- Preserve the quiet, premium visual tone.

---

# 21. SEO and Metadata

Each public page should include:

- Unique title
- Meta description
- Open Graph title
- Open Graph description
- Canonical URL
- Social image
- Correct heading hierarchy

Examples:

## Product

```text
Title: Kora Product — AI Company Knowledge Assistant

Description: Connect approved Notion knowledge, ask questions, verify citations, and identify documentation gaps with Kora.
```

## Security

```text
Title: Kora Security — Scoped and Verifiable Company Knowledge

Description: Learn how Kora protects organization data, secures Notion connections, and grounds AI answers in approved sources.
```

## How It Works

```text
Title: How Kora Works — From Notion Pages to Grounded AI Answers

Description: See how Kora syncs approved Notion pages, retrieves relevant knowledge, and generates cited answers.
```

---

# 22. Accessibility Requirements

All new pages must support:

- Keyboard navigation
- Visible focus states
- Semantic headings
- Descriptive links
- Alt text
- Sufficient contrast
- Reduced-motion preferences
- Screen-reader labels
- Accessible accordions
- Accessible navigation menus
- Accessible screenshot captions

---

# 23. Analytics Events

Track:

```text
homepage_cta_clicked
product_page_viewed
how_it_works_viewed
security_page_viewed
documentation_opened
pricing_viewed
request_access_clicked
signup_started
signup_completed
screenshot_opened
integration_viewed
knowledge_gap_page_viewed
```

Do not collect unnecessary personal data.

---

# 24. Recommended Implementation Order

## Phase 1 — Homepage Content

- Audit current copy
- Add What Kora Is
- Add Why Teams Need Kora
- Add Kora vs. General Chatbots
- Add When Kora Cannot Answer
- Expand FAQ
- Update footer

## Phase 2 — Core Public Pages

Create:

- `/product`
- `/how-it-works`
- `/solutions`
- `/security`
- `/integrations`
- `/pricing`
- `/about`

## Phase 3 — Screenshots

- Seed a demo organization
- Seed demo documents and questions
- Capture real product screenshots
- Add a reusable screenshot component
- Optimize the images

## Phase 4 — Documentation

- Expand public documentation
- Add complete guides
- Add troubleshooting
- Add technical concepts
- Add security explanations

## Phase 5 — Transparency Pages

Create:

- `/roadmap`
- `/changelog`
- `/support`
- `/privacy`
- `/terms`

## Phase 6 — Polish

- SEO
- Responsive review
- Accessibility
- Analytics
- Performance optimization
- Broken-link checks
- Content consistency review

---

# 25. Minimum Viable Public Website

The first complete version should include:

```text
Homepage
Product
How It Works
Solutions
Security
Integrations
Pricing
About
Documentation
Login
Signup
```

---

# 26. Acceptance Criteria

The website expansion is complete when:

- A first-time visitor can explain what Kora is after reading the homepage.
- A visitor can identify the target users.
- A visitor understands that Notion is the current primary source.
- A visitor understands how knowledge is synced and searched.
- A visitor understands that answers include citations.
- A visitor understands what happens when documentation is incomplete.
- A visitor understands the difference between Kora and a general chatbot.
- A visitor can see real product screenshots where relevant.
- No screenshot contains private or unstable data.
- Every public claim maps to an implemented or clearly labeled planned feature.
- The existing design language remains unchanged.
- Navigation works across all public pages.
- Documentation provides a complete system guide.
- Pricing clearly states that the project is free for portfolio purposes.
- Security claims are honest and specific.
- Planned integrations are labeled as planned.
- The site works on desktop, tablet, and mobile.
- Pages meet accessibility and SEO requirements.
- The coding agent can build the pages without inventing unrelated content.

---

# 27. Final Recommendation

Keep the current homepage visual structure and theme.

Do not redesign it.

Expand the website through deeper pages that answer specific visitor questions:

- Product explains what Kora includes.
- How It Works explains the complete flow.
- Solutions explains who uses it.
- Security builds trust.
- Integrations explains Notion and future sources.
- Pricing explains the free portfolio plan.
- About explains why the project exists.
- Documentation teaches users how to use the system.

Use real screenshots only where they demonstrate an actual feature. The coding agent can capture them with Playwright after the relevant product page and demo data are stable.
