<a id="p1"></a>
## Part 1 — Product requirements (PRD) `[CORE]`

### 1.1 Executive summary

| Field | Content |
|---|---|
| App name | {{ }}. *Example: TaskFlow AI* |
| Vision | {{ }}. *Example: a streamlined, intelligent workspace that helps remote teams triage tasks and run daily standups from contextual AI summaries, with dependable error handling and state management.* |
| Target audience | {{ }}. *Example: remote engineering and product teams of 5–50 people.* |
| Value proposition | {{What gets faster, cheaper or safer for them, and by how much?}} |
| Business model | {{Free · Freemium · Subscription · One-off · Internal tool}} |

### 1.2 Problem statement & evidence

- **Who** has the problem: {{ }}
- **Current workaround** and its cost: {{ }}
- **Evidence** (interviews, data, sign-ups, support tickets): {{ }}
- **Why now**: {{ }}

### 1.3 Goals, non-goals & success metrics

| Metric | Definition | Target | How it's measured |
|---|---|---|---|
| Activation | % of new workspaces that create ≥ 3 tasks within 24 h | {{≥ 40%}} | Server-side counts |
| Core value | % of active teams generating ≥ 3 standups per week | {{≥ 30%}} | Server-side counts |
| Retention | Week-4 workspace retention | {{≥ 25%}} | Aggregate analytics (9.10) |
| Reliability | Monthly availability | {{≥ 99.5%}} | Uptime monitor |

> **Guide:** Prefer server-side counts and aggregate analytics. A metric that needs invasive tracking is a design smell (9.10).

**Non-goals** (deliberately out of scope for this release): {{e.g. native mobile apps, public task sharing, time tracking}}

### 1.4 Users, personas & roles

| Persona | Context | Goals | Frustrations | Accessibility needs | Data sensitivity |
|---|---|---|---|---|---|
| {{Team lead "Amara"}} | {{Runs a 12-person remote team}} | {{Standup in 2 minutes}} | {{Chasing updates}} | {{Keyboard-heavy user}} | {{Work data, names}} |

Roles map to the permission matrix in 7.2: {{OWNER, ADMIN, MEMBER}}.

### 1.5 Features & prioritisation (MoSCoW)

| ID | Feature | Priority | Release | Personal data? | Notes |
|---|---|---|---|---|---|
| FR-001 | Authentication & workspace setup (Google OAuth, magic link) | Must | MVP | Yes | Age check and consent capture at sign-up (9.7, 9.12) |
| FR-002 | Task triage board: Kanban with AI tagging, priority and assignee suggestions | Must | MVP | Yes | Non-drag way to move cards (WCAG 2.5.7) |
| FR-003 | AI daily standup generator, exported as Markdown | Must | MVP | Yes | Part 8 |
| FR-004 | Real-time threaded comments with optimistic updates | Should | MVP | Yes | Sanitised Markdown; abuse threats (7.3) |
| FR-005 | Organisation & member management | Must | MVP | Yes | Permission matrix (7.2) |
| FR-006 | Privacy centre: export, delete, consents, marketing preferences, complaints | Must | MVP | Yes | **Required for any app with accounts** (9.15) |
| FR-007 | Cookie & consent management | Must | MVP | Yes | **Required if anything non-essential runs** (9.8) |

### 1.6 User stories & acceptance criteria

Write one block per requirement, using this template.

```text
FR-003 — Generate a daily standup
As a team member, I want a one-click summary of yesterday's completed tasks, blockers and today's
commitments, so that standups take two minutes.

Acceptance criteria
  Scenario: Summary generated
    Given I am a member of workspace W with tasks completed in the last 24 h
    When I select "Generate standup"
    Then a structured Markdown summary appears within 15 s, labelled "AI-generated — check before sharing"
    And I can copy it or download it as a .md file

  Scenario: Nothing to summarise                     → Empty state (S1)
    Given no tasks changed in the last 24 h
    Then I see "Nothing to summarise yet" and a link back to the board

  Scenario: AI provider slow or down                 → Slow network (S5), then Error (S3)
    Given the provider has not responded after 5 s
    Then I see "Still working…" with Cancel
    And after 30 s I see an error with Retry, and none of my input is lost

  Scenario: Daily limit reached                      → Rate limited (S13)
    Given my workspace has used today's AI quota
    Then I see when the quota resets and nothing is charged

Traceability: SCR-07 · API-003 · DATA tasks, ai_generations · TEST-E2E-012 · ROPA-03
Privacy: task text is minimised before it is sent to the AI provider (8.2); no special category data
```

### 1.7 Business rules

| ID | Rule |
|---|---|
| BR-01 | A workspace always has at least one OWNER. The last owner cannot leave or be demoted. |
| BR-02 | {{Free plan: maximum 5 members and 20 AI standups per month}} |
| BR-03 | Deleting a workspace starts a 30-day recovery window, then hard-deletes everything (5.6). |

### 1.8 Monetisation & pricing `[IF: payments]`

Plans and limits: {{ }} · Trial: {{ }} · Billing provider: {{e.g. Stripe Checkout or Billing}} · VAT: {{ }} · Cancellation and refunds: {{ }} (consumer law, 9.25) · Failed payments: {{retries, grace period}}

### 1.9 Assumptions, constraints & dependencies

| Type | Statement | Impact if wrong | Owner |
|---|---|---|---|
| Assumption | {{Teams already use Google Workspace}} | {{Add email/password sign-in}} | {{ }} |
| Constraint | {{Data must stay in the UK/EU}} | — | {{ }} |
| Dependency | {{AI provider API availability}} | {{Feature-flag the AI off; the app still works}} | {{ }} |

### 1.10 Out of scope

{{Explicit list. Anything not listed here or in 1.5 is out of scope by default.}}
