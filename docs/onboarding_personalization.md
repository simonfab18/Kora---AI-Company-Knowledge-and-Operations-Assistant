# Onboarding and Personalization Plan

## 1. Purpose

The onboarding flow should prevent new users from being sent directly to an empty dashboard after creating an account and organization.

The onboarding experience should:

- Understand the company and the user.
- Personalize the workspace and suggested questions.
- Configure the first knowledge source.
- Guide the user toward the first successful AI answer.
- Save progress so users can leave and continue later.

The main activation goal is:

> The user connects a knowledge source, syncs at least one document, and receives one grounded answer with a citation.

---

## 2. User Types

### Organization Owner

The owner creates the organization and configures company-wide settings.

The owner can:

- Complete the company profile.
- Select the primary use cases.
- Connect Notion.
- Select approved pages.
- Configure assistant preferences.
- Invite team members.

### Admin

An invited admin completes a shorter onboarding flow.

The admin can:

- Complete their personal profile.
- Review the organization configuration.
- Manage knowledge sources if permitted.
- Access administrative features.

### Member

An invited member should not be asked to configure company-wide settings.

The member can:

- Complete their personal profile.
- Select their role and department.
- View personalized suggested questions.
- Start using the assistant.

---

## 3. Recommended User Flow

```text
Create account
    ↓
Create or join organization
    ↓
Complete company profile
    ↓
Complete user profile
    ↓
Select use cases
    ↓
Connect Notion
    ↓
Select approved pages
    ↓
Start initial synchronization
    ↓
Configure assistant preferences
    ↓
Invite team members
    ↓
Review setup
    ↓
Ask first suggested question
    ↓
Open personalized dashboard
```

---

## 4. Onboarding Screens

## Step 1 — Welcome

### Goal

Explain the setup process and the value of completing onboarding.

### Suggested content

```text
Welcome to [Product Name]

Let’s personalize your workspace so your team can find trusted
company knowledge faster.

This should only take a few minutes.
```

### Actions

- Get started
- Continue later

The organization setup itself should remain required before the user can access the full application.

---

## Step 2 — Create or Join an Organization

### Options

- Create a new organization
- Join an existing organization

### Create organization fields

- Organization name
- Workspace slug
- Industry
- Company size
- Website, optional

### Company size options

- 1–10
- 11–50
- 51–200
- 201–1,000
- 1,000+

### Join organization flow

```text
Open invitation link
→ Create account or sign in
→ Accept invitation
→ Complete personal profile
→ Enter organization workspace
```

An invited user should not be asked to recreate the organization profile.

---

## Step 3 — About the User

### Fields

- Full name
- Preferred display name
- Job title
- Department
- Main responsibility

### Department options

- Engineering
- Product
- Human Resources
- Operations
- Customer Support
- Sales
- Marketing
- Leadership
- Other

### Personalization use

This information can personalize:

- Suggested questions
- Dashboard cards
- Search recommendations
- Knowledge categories
- Onboarding guidance

### Example engineering questions

```text
How do I deploy the staging API?
Where is the incident-response guide?
What is the pull-request process?
```

### Example HR questions

```text
What is our leave policy?
How does employee onboarding work?
What benefits are available?
```

---

## Step 4 — Company Goals and Use Cases

### Question

```text
What problems are you trying to solve?
```

### Options

- Employees cannot find documentation.
- New hires ask repeated questions.
- Information is scattered across Notion.
- Teams sometimes follow outdated processes.
- We want an internal AI assistant.
- We want to identify documentation gaps.

Allow multiple selections.

### Initial team selection

Ask which teams will use the product first:

- Entire company
- Engineering
- Operations
- HR
- Customer Support
- Sales
- Leadership
- Other

### Recommended knowledge categories

For an engineering team:

- Development setup
- Deployment procedures
- Architecture documentation
- Incident response
- Coding standards

For an HR team:

- Leave policies
- Benefits
- Onboarding
- Employee handbook
- Workplace policies

---

## Step 5 — Company Context

### Fields

- Short company description
- Preferred term for employees
- Default language

### Example company description

```text
We are a software company that provides inventory tools for small
retailers. Our teams include engineering, sales, support, and operations.
```

### Employee terminology examples

- Employees
- Team members
- Associates
- Consultants
- Partners

Only include company context in AI prompts when it materially improves the answer.

Do not send unnecessary private company information to the AI provider.

---

## Step 6 — Connect Notion

### Goal

Connect the first company knowledge source.

### Suggested content

```text
Connect your company knowledge

Connect Notion so the assistant can search approved company pages.
```

### Actions

- Connect Notion
- Continue with demo workspace

### Page selection options

- Entire connected workspace
- Selected pages only
- Specific team spaces

Recommended default:

> Selected pages only

This reduces accidental ingestion of sensitive or irrelevant content.

### Example selection

```text
✓ Employee Handbook
✓ Engineering Documentation
✓ Product Guides
✓ Support Procedures
```

### Permission message

```text
Only selected pages will be processed.
You can update access later in Settings.
```

---

## Step 7 — Initial Synchronization

### Goal

Prepare the selected documents for retrieval and AI answering.

### Progress stages

```text
1. Reading Notion pages
2. Extracting content
3. Splitting documents into chunks
4. Creating embeddings
5. Building the searchable knowledge base
```

### Example progress information

```text
12 of 24 pages synchronized
182 chunks created
```

The synchronization should run in the background.

The user should be allowed to continue onboarding while processing continues.

Once enough documents are available, allow the user to test the assistant before the entire sync finishes.

---

## Step 8 — Assistant Preferences

### Answer length

- Concise
- Balanced
- Detailed

### Tone

- Professional
- Friendly
- Direct
- Technical

### Language

- English
- Filipino
- Use the question’s language

Recommended default:

> Use the question’s language

### Citation behavior

Citations should always be enabled for grounded company answers.

### No-answer behavior

When the answer cannot be found:

- Clearly state that the information was not found.
- Suggest related documents when available.
- Allow the user to submit a knowledge-gap request.

These preferences should never disable security, source grounding, or organization isolation.

---

## Step 9 — Invite Team Members

### Goal

Allow the owner to invite initial users.

### Fields

- Email address
- Role

### Roles

- Owner
- Admin
- Member

### Example

```text
Email                         Role
alex@company.com              Admin
jamie@company.com             Member
```

This step should be skippable.

Invitations should only be sent after the owner confirms.

---

## Step 10 — Setup Summary

### Suggested summary

```text
Your workspace is ready

Organization:
Acme Technologies

Primary use case:
Engineering documentation

Connected source:
Notion

Selected pages:
24

Initial users:
3

Answer style:
Concise with citations
```

### Actions

- Open workspace
- Change settings

---

## Step 11 — First-Value Experience

Do not immediately send the user to a generic dashboard.

Show a guided first-question screen.

### Suggested content

```text
Your knowledge assistant is ready

Try asking:
“How do I deploy the staging environment?”
```

Suggested questions should preferably be generated from the synced documents.

### Example questions

- What is our leave policy?
- How does employee onboarding work?
- Where is the incident-response procedure?
- How do I deploy the staging API?
- Which topics are missing documentation?

The first answer should include:

- A grounded response
- Citations
- Related pages
- Helpful and not-helpful feedback controls

---

## 5. Dashboard After Onboarding

The dashboard should be personalized and should not appear empty.

### Example overview

```text
Welcome back, Simon

Acme Technologies knowledge overview

Documents synced: 24
Knowledge chunks: 182
Last sync: 10 minutes ago
Questions answered: 1
Knowledge gaps: 0
```

### Setup checklist

```text
Workspace setup

✓ Create organization
✓ Complete company profile
✓ Connect Notion
✓ Sync first documents
✓ Ask first question
○ Invite a teammate
○ Configure automatic synchronization
```

The checklist can remain visible until the important setup tasks are complete.

---

## 6. Required and Optional Steps

### Required

- Create or join an organization
- Organization name
- User name and role
- Primary use case
- Connect a knowledge source or select demo mode
- Select approved pages
- Start initial synchronization

### Optional

- Company website
- Detailed company description
- Assistant tone
- Team invitations
- Department customization
- Automatic sync schedule

Recommended rule:

```text
Required onboarding: 4–6 screens
Optional personalization: completed progressively after dashboard access
```

---

## 7. Onboarding Progress

Progress must be saved after every step.

Possible statuses:

```text
not_started
organization_created
profile_completed
use_cases_selected
source_connected
sync_started
completed
```

When a user returns, show:

```text
Continue setting up Acme Technologies
```

The application should resume from the last incomplete step.

---

## 8. Role-Based Onboarding

### Organization Owner

```text
Create organization
→ Complete company profile
→ Select use cases
→ Connect Notion
→ Configure assistant
→ Invite team
→ Ask first question
```

### Invited Admin

```text
Accept invitation
→ Complete personal profile
→ Review organization setup
→ Open dashboard
```

### Invited Member

```text
Accept invitation
→ Select role and department
→ View personalized questions
→ Ask first question
```

Members should not see company configuration screens unless they have the required permission.

---

## 9. Demo Mode

Add a demo option for portfolio reviewers and users who do not want to connect Notion immediately.

### Demo workspace content

- Leave Policy
- Engineering Guide
- Remote Work Policy
- Deployment Procedure

### Demo limitations

- Use isolated sample data.
- Do not expose real organization data.
- Do not allow permanent organization-wide changes.
- Clearly label the workspace as a demo.

---

## 10. Error and Recovery States

## Notion Connection Failure

```text
We couldn’t connect to Notion.

Check that you approved access and try again.
```

Actions:

- Try again
- Continue with demo data

## Synchronization Failure

Show:

- Failed document or page
- Error reason
- Retry action
- Number of successfully processed pages

Do not restart the full synchronization when only one page fails.

## Interrupted Onboarding

Save progress automatically and resume from the last incomplete step.

---

## 11. Database Changes

## Organizations

```sql
ALTER TABLE organizations
ADD COLUMN industry TEXT,
ADD COLUMN company_size TEXT,
ADD COLUMN website TEXT,
ADD COLUMN description TEXT,
ADD COLUMN onboarding_status TEXT DEFAULT 'not_started',
ADD COLUMN onboarding_completed_at TIMESTAMPTZ;
```

## Organization Preferences

```text
organization_preferences
├── organization_id
├── primary_use_cases
├── initial_departments
├── answer_length
├── answer_tone
├── default_language
├── citations_required
├── no_answer_behavior
├── created_at
└── updated_at
```

## User Profiles

```text
profiles
├── user_id
├── full_name
├── display_name
├── job_title
├── department
├── main_responsibility
├── onboarding_completed_at
├── created_at
└── updated_at
```

## Onboarding Progress

```text
onboarding_progress
├── organization_id
├── user_id
├── current_step
├── completed_steps
├── skipped_steps
├── completed_at
└── updated_at
```

A dedicated onboarding table is recommended because owners, admins, and members have different flows.

---

## 12. Suggested API Endpoints

```text
GET  /v1/onboarding/status
PUT  /v1/onboarding/organization
PUT  /v1/onboarding/profile
PUT  /v1/onboarding/use-cases
PUT  /v1/onboarding/company-context
PUT  /v1/onboarding/preferences
POST /v1/onboarding/connect-notion
POST /v1/onboarding/select-pages
POST /v1/onboarding/start-sync
POST /v1/onboarding/invitations
POST /v1/onboarding/complete
```

Each endpoint must:

- Validate the authenticated user.
- Validate organization membership.
- Enforce role-based permissions.
- Apply organization scoping.
- Save progress after every successful step.
- Return enough data to resume onboarding.

---

## 13. Suggested Frontend Routes

```text
/onboarding/welcome
/onboarding/organization
/onboarding/profile
/onboarding/use-cases
/onboarding/company-context
/onboarding/connect-notion
/onboarding/select-pages
/onboarding/sync
/onboarding/preferences
/onboarding/invite-team
/onboarding/review
/onboarding/first-question
```

The application should redirect users according to their onboarding status.

Example:

```text
Authenticated + onboarding incomplete
→ redirect to current onboarding step

Authenticated + onboarding complete
→ allow dashboard access
```

---

## 14. State Management

The server should remain the source of truth for onboarding progress.

The frontend may keep temporary form state, but each completed step should be saved to the backend.

Recommended behavior:

- Autosave completed forms.
- Prevent duplicate organization creation.
- Allow users to move backward.
- Validate required fields before continuing.
- Preserve progress across devices.

---

## 15. Security Requirements

- Enforce organization-level data isolation.
- Only owners or authorized admins may change company settings.
- Members must not configure organization-wide knowledge sources.
- Store Notion tokens encrypted.
- Never expose service-role credentials to the frontend.
- Only process pages explicitly approved by the organization.
- Validate all redirect and OAuth state parameters.
- Log source connection and permission changes.
- Do not place unnecessary private company information in AI prompts.

---

## 16. Analytics Events

Track the onboarding funnel using events such as:

```text
onboarding_started
organization_created
company_profile_completed
user_profile_completed
use_cases_selected
notion_connection_started
notion_connection_completed
page_selection_completed
sync_started
sync_completed
first_question_asked
first_grounded_answer_received
team_member_invited
onboarding_completed
```

### Example funnel

```text
100 accounts created
80 organizations created
55 connected Notion
40 completed synchronization
32 received a grounded answer
```

This helps identify where users abandon setup.

---

## 17. Testing Plan

## Unit Tests

Test:

- Onboarding status transitions
- Required-field validation
- Role-based step selection
- Completion calculations
- Redirect decision logic
- Preference validation

## Integration Tests

Test:

- Saving and resuming progress
- Organization and profile creation
- Invitation acceptance
- Notion OAuth callback handling
- Starting initial synchronization
- Permission enforcement

## End-to-End Tests

Use Playwright to test:

```text
New owner signs up
→ creates organization
→ completes company profile
→ selects use cases
→ connects or mocks Notion
→ selects pages
→ starts synchronization
→ asks first question
→ receives a citation
→ reaches dashboard
```

Also test:

- User leaves and resumes onboarding.
- Invited member receives a shorter flow.
- Member cannot access owner-only steps.
- Failed Notion connection can be retried.
- Completed users are not shown onboarding again.

---

## 18. Milestone Placement

Add onboarding after authentication and organization management.

### Milestone 5A — Profile Onboarding

Build:

- Welcome screen
- Organization profile
- User profile
- Role and department selection
- Use case selection
- Company context
- Assistant preferences
- Progress persistence
- Role-based redirects

### Milestone 5B — Knowledge Onboarding

Build:

- Notion OAuth
- Page selection
- Initial synchronization
- Sync progress
- Suggested first questions
- First grounded answer
- Onboarding completion

This separation prevents Notion and synchronization work from blocking the initial onboarding UI.

---

## 19. Acceptance Criteria

The onboarding feature is complete when:

- A new owner is not sent directly to an empty dashboard.
- A new owner can create and personalize an organization.
- A user can complete their personal profile.
- The owner can select one or more company use cases.
- Progress is saved after every step.
- Users can leave and resume onboarding.
- Invited users receive a shorter role-based flow.
- Only owners and authorized admins can configure knowledge sources.
- The owner can connect Notion and select approved pages.
- Initial synchronization can run in the background.
- The system displays synchronization progress.
- The user can ask a suggested first question.
- The first answer includes a valid citation.
- Completed users are not shown onboarding again.
- Skipped optional settings remain available in Settings.
- Organization data remains isolated between tenants.
- Errors can be retried without restarting the full flow.

---

## 20. Final Recommended Flow

```text
Sign up
→ Create or join organization
→ Tell us about the company
→ Tell us about your role
→ Select company use cases
→ Connect Notion or use demo workspace
→ Select approved pages
→ Start synchronization
→ Configure answer preferences
→ Invite team members
→ Ask the first suggested question
→ Enter the personalized dashboard
```

This onboarding flow makes the product feel like a complete SaaS application and guides users toward experiencing its main value before they begin exploring the dashboard independently.
