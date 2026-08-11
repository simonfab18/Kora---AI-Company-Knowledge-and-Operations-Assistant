# Top Navigation and Utility Menu Specification

## Purpose

This document defines the updated top navigation for the AI Company Knowledge & Operations Assistant.

The new header should remove the existing **Search Knowledge** bar and replace it with a cleaner set of utility controls focused on workspace actions, notifications, usage, help, and account management.

---

## Recommended Header Layout

```text
Quick Create | Sync Setup | AI Usage | Help | Notifications | Account
```

The account control should use the circular avatar button currently shown in the header.

The standalone **Sign out** button should be removed from the header and moved inside the account menu.

---

# 1. Account Menu

## Trigger

The existing circular avatar button should open the account menu.

The avatar may display:

- User profile image
- User initials
- A generic account icon when no image is available

## Menu Header

Display basic user information at the top of the menu:

- Full name
- Email address
- Organization name
- Current role, such as Owner, Admin, or Member

Example:

```text
Simon Fabregas
simon@example.com
Acme Technologies · Owner
```

## Menu Items

### Profile

Opens the user's profile page.

The page may allow the user to manage:

- Profile image
- Full name
- Display name
- Job title
- Department
- Preferred language

Suggested route:

```text
/settings/profile
```

### Account Settings

Opens personal account settings.

The page may include:

- Email address
- Password or authentication settings
- Appearance preferences
- Notification preferences
- Active sessions
- Account deletion

Suggested route:

```text
/settings/account
```

### Organization Settings

Opens settings for the current organization.

Only users with the required permissions should be able to modify organization-wide settings.

The page may include:

- Organization name
- Company description
- Industry
- Company size
- Organization logo
- Workspace slug
- Member roles
- AI answer preferences
- Connected knowledge sources
- Sync settings

Suggested route:

```text
/settings/organization
```

### Billing

The project is free because it is a portfolio project.

The Billing page should still exist to make the application feel like a complete SaaS product, but it must clearly state that no payment is required.

Suggested content:

```text
Current plan: Portfolio Free

This project is free to use for demonstration and portfolio purposes.
No payment method is required.
```

The page may display non-commercial plan information such as:

- Current plan: Portfolio Free
- Monthly price: $0
- Payment method: Not required
- Billing history: None
- Usage limits for demonstration purposes
- Upgrade button disabled or labeled “Not available”

Do not implement real payment processing, Stripe checkout, invoices, subscriptions, or paid upgrades.

Suggested route:

```text
/settings/billing
```

### Sign Out

Signs the user out of the application.

Placement:

- Last item in the menu
- Separated from the other options by a divider
- Use a confirmation dialog only when unsaved changes may be lost

---

# 2. Quick Create Button

## Purpose

The Quick Create button gives users access to common workspace actions without navigating through multiple pages.

## Trigger

Use a compact button with a plus icon.

Example label:

```text
+ Create
```

Alternative labels:

```text
Quick create
New
```

## Menu Items

### Invite Member

Opens an invitation dialog.

Fields:

- Email address
- Role
- Optional personal message

Supported roles:

- Admin
- Member

Only owners and authorized admins should see this action.

### Connect Source

Opens the knowledge-source connection flow.

For the MVP, the primary source is:

- Notion

The interface should be designed so additional sources can be supported later, such as:

- Google Drive
- Confluence
- SharePoint
- Uploaded documents

Suggested route:

```text
/sources/connect
```

### Start Sync

Starts a knowledge synchronization job for connected sources.

Before starting:

- Confirm a source is connected
- Check that the user has permission
- Prevent duplicate active sync jobs
- Show current sync status

Possible states:

```text
Ready to sync
Syncing
Completed
Failed
```

### Create Collection

Creates a logical group of knowledge documents.

Example collections:

- Human Resources
- Engineering
- Company Policies
- Product Documentation
- Customer Support
- Operations

Suggested fields:

- Collection name
- Description
- Icon
- Visibility
- Included documents or sources

Suggested route:

```text
/collections/new
```

---

# 3. Notifications Panel

## Purpose

The notifications panel informs users about important workspace activity and system events.

## Trigger

Use a bell icon in the top navigation.

The icon should show an unread indicator when new notifications are available.

Examples:

```text
Bell with dot
Bell with unread count
```

## Notification Types

### Sync Completed

Triggered when a synchronization finishes successfully.

Example:

```text
Knowledge sync completed

24 pages were synchronized and 182 chunks were indexed.
```

Actions:

- View sync details
- Open knowledge library

### Sync Failed

Triggered when a synchronization job fails.

Example:

```text
Knowledge sync failed

3 pages could not be processed. Review the errors and try again.
```

Actions:

- View error details
- Retry sync

This notification should use a clear error state and should not expose sensitive tokens or internal stack traces.

### New Member Joined

Triggered when an invited user successfully joins the organization.

Example:

```text
Alex Rivera joined Acme Technologies as a Member.
```

Actions:

- View member
- Open members page

### Invitation Accepted

Triggered when an invitation is accepted.

Example:

```text
Jamie Cruz accepted your invitation.
```

This may be combined with the New Member Joined event when both represent the same action.

### Knowledge Gap Detected

Triggered when the assistant cannot find sufficient documentation for a repeated or important question.

Example:

```text
New knowledge gap detected

Several users asked about the remote-work approval process, but no reliable answer was found.
```

Actions:

- Review knowledge gap
- Assign to an owner
- Create documentation task

## Panel Features

The panel should support:

- Unread and read states
- Mark as read
- Mark all as read
- Notification timestamp
- Filter by notification type
- Link to full notification history
- Empty state

Suggested route:

```text
/notifications
```

## Empty State

```text
You're all caught up

New sync updates, member activity, and knowledge gaps will appear here.
```

---

# 4. AI Usage Indicator

## Purpose

The AI Usage indicator shows how much AI functionality the current organization has used.

Because this is a free portfolio project, the usage display is informational only and should not trigger real billing.

## Header Display

Use a compact indicator in the top navigation.

Examples:

```text
AI Usage
142 questions
```

or:

```text
AI Usage
68%
```

A tooltip or popover can show more details.

## Usage Metrics

The usage panel may include:

- Questions asked
- Answers generated
- Embeddings created
- Documents indexed
- Tokens processed
- Active users
- Usage period
- Last reset date

Example:

```text
AI Usage — This Month

Questions asked: 142
Answers generated: 137
Documents indexed: 24
Embedding chunks created: 182
Estimated tokens processed: 86,400
Plan: Portfolio Free
```

## Free Portfolio Notice

Display:

```text
This workspace uses the Portfolio Free plan.
Usage is shown for demonstration and monitoring only.
No charges will be made.
```

## Optional Demonstration Limits

You may define soft limits for portfolio demonstration purposes.

Example:

```text
Questions: 142 / 500
Documents: 24 / 100
Members: 4 / 10
```

These limits should be configurable and should not require payment.

Suggested route:

```text
/settings/usage
```

---

# 5. Help Button

## Trigger

Use a question-mark icon or a button labeled:

```text
Help
```

## Menu Items

### Documentation

Opens a complete documentation website outside the authenticated application.

The documentation should act as the full user guide for the system.

It should be publicly accessible without requiring a user account.

Example routes:

```text
docs.example.com
```

or:

```text
/documentation
```

## Documentation Site Structure

### Getting Started

- What the platform does
- Who the platform is for
- Creating an account
- Creating an organization
- Completing onboarding
- Understanding roles

### Connecting Knowledge Sources

- Connecting Notion
- Approving workspace access
- Selecting pages
- Managing connected sources
- Disconnecting a source
- Troubleshooting OAuth

### Knowledge Synchronization

- Starting a manual sync
- Automatic synchronization
- Sync statuses
- Failed pages
- Retrying a sync
- Understanding chunking and embeddings

### Knowledge Library

- Viewing documents
- Searching documents
- Creating collections
- Organizing knowledge
- Removing documents
- Viewing source metadata

### AI Assistant

- Asking questions
- Understanding citations
- Suggested questions
- No-answer behavior
- Giving feedback
- Supported question types
- AI limitations

### Members and Roles

- Inviting members
- Owner permissions
- Admin permissions
- Member permissions
- Updating roles
- Removing members

### Knowledge Gaps

- What a knowledge gap is
- How gaps are detected
- Reviewing unanswered questions
- Assigning documentation work
- Resolving a knowledge gap

### Notifications

- Sync notifications
- Member notifications
- Invitation notifications
- Knowledge-gap notifications
- Notification preferences

### Usage

- Understanding AI usage
- Questions and answer counts
- Documents and embeddings
- Portfolio Free plan
- Demonstration limits

### Account and Organization Settings

- Editing a profile
- Account security
- Organization information
- AI preferences
- Notification preferences
- Signing out
- Deleting an account or workspace

### Troubleshooting

- Cannot connect Notion
- Sync remains pending
- Sync failed
- Document not appearing
- Incorrect or missing answer
- Citation not opening
- Invitation not received
- Permission denied
- Browser and network issues

### Security and Privacy

- Organization-level data isolation
- Source permissions
- Encrypted integration tokens
- Authentication
- Data retention
- AI provider usage
- Sensitive-information guidance

### Frequently Asked Questions

- Is the system free?
- Does it train AI models on company data?
- Can one organization access another organization's documents?
- How often does synchronization run?
- Can users choose which Notion pages are indexed?
- What happens when the assistant cannot find an answer?

## Documentation Design

The documentation site should include:

- Sidebar navigation
- Search
- Table of contents
- Previous and next page navigation
- Code and configuration examples
- Screenshots
- Callout boxes
- Troubleshooting steps
- Mobile-friendly layout
- Link back to the main application

The documentation site should use the same branding as the application while remaining visually simpler and easier to read.

### Contact Support

Opens a support page or contact form.

Suggested fields:

- Name
- Email
- Organization
- Subject
- Category
- Description
- Optional screenshot
- Optional error or request ID

Suggested categories:

- Account issue
- Notion connection
- Synchronization
- AI answer issue
- Member management
- General question

Because this is a portfolio project, the form may:

- Create a database support ticket
- Send an email
- Open a pre-filled email client
- Store the submission for demonstration

Suggested route:

```text
/support
```

### Report a Problem

Opens a structured bug-report form.

Suggested fields:

- Problem title
- What happened?
- What did you expect?
- Steps to reproduce
- Page URL
- Browser and device
- Optional screenshot
- Request ID or sync job ID
- Permission to include diagnostic details

Suggested categories:

- User interface
- Authentication
- Notion connection
- Synchronization
- Knowledge search
- AI response
- Notifications
- Members and permissions
- Other

Suggested route:

```text
/report-problem
```

Do not include secrets, access tokens, full document contents, or personal data in diagnostic submissions.

---

# 6. Search Bar Removal

Remove the **Search Knowledge** bar from the top navigation.

Knowledge search should instead be available from dedicated locations:

- Knowledge Library page
- AI Assistant page
- Command palette, if added later
- Documentation site search for help content

This keeps the global header focused on workspace utilities.

---

# 7. Recommended Final Header

```text
[Page title and description]

[Quick Create] [Sync Setup] [AI Usage] [Help] [Notifications] [Account Avatar]
```

## Account Avatar Menu

```text
User name
Email
Organization · Role
--------------------
Profile
Account settings
Organization settings
Billing
--------------------
Sign out
```

## Quick Create Menu

```text
Invite member
Connect source
Start sync
Create collection
```

## Help Menu

```text
Documentation
Contact support
Report a problem
```

---

# 8. Role and Permission Rules

## Owner

Can access:

- All Quick Create actions
- Organization settings
- Billing
- Usage
- All notifications
- Member invitations

## Admin

Can access:

- Invite member, when permitted
- Connect source
- Start sync
- Create collection
- Organization settings, based on permission
- Usage
- Operational notifications

## Member

Can access:

- Profile
- Account settings
- Documentation
- Contact support
- Report a problem
- Relevant notifications
- AI usage when organization policy allows it

Members should not see organization-wide administrative actions they cannot use.

---

# 9. Suggested Routes

```text
/settings/profile
/settings/account
/settings/organization
/settings/billing
/settings/usage
/members/invite
/sources/connect
/sync
/collections/new
/notifications
/support
/report-problem
```

External documentation:

```text
https://docs.example.com
```

---

# 10. Acceptance Criteria

The navigation update is complete when:

- The Search Knowledge bar is removed.
- The circular avatar opens the account menu.
- Sign out is moved inside the account menu.
- Profile opens the user profile page.
- Account Settings opens personal settings.
- Organization Settings is permission-protected.
- Billing clearly states that the product uses a free portfolio plan.
- No real payment processing is implemented.
- Quick Create includes Invite Member, Connect Source, Start Sync, and Create Collection.
- Notifications support sync, member, invitation, and knowledge-gap events.
- Unread notifications are visually indicated.
- AI Usage displays informative usage metrics.
- AI Usage does not create charges.
- Help includes Documentation, Contact Support, and Report a Problem.
- Documentation is accessible outside the authenticated application.
- The documentation contains a complete guide to the system.
- Menus are keyboard accessible.
- Buttons include tooltips or accessible labels.
- Menu items respect organization roles and permissions.
- The header remains responsive on smaller screens.

---

# 11. Suggested Implementation Order

## Phase 1 — Header Structure

- Remove search bar
- Add Quick Create
- Add AI Usage
- Add Help
- Keep notifications
- Convert circle into account avatar menu
- Move Sign Out into account menu

## Phase 2 — Menus and Pages

- Account menu pages
- Quick Create dialogs
- Notifications panel
- Usage popover and page
- Support and problem-report forms

## Phase 3 — Documentation Website

- Create public documentation layout
- Write complete system guide
- Add screenshots
- Add search
- Add troubleshooting
- Link documentation from Help menu

## Phase 4 — Permissions and Polish

- Role-based visibility
- Keyboard navigation
- Mobile responsiveness
- Empty states
- Loading states
- Error states
- Analytics events
