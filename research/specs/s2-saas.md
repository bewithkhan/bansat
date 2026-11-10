---
id: s2-saas
title: Multi-tenant project workspace for architecture practices
size: startup
stack: nextjs-supabase
profiles: [D1] # Appendix D1, the reference stack
expected_tier: medium # accounts, analytics, marketing, and a B2B processor role (0.3)
facts:
  personal_data: true
  accounts: true
  age_gate: none # a business tool: staff and clients are invited by a practice
  marketing_email: true # the monthly product update to practice owners
  analytics: true
  ai: false
  payments: false
  special_category: false
  multi_tenant: true
  uploads: true
dynamic:
  allow: [supabase.co]
  review: []
  pages: []
features:
  - { id: F1, text: Sign-up that creates a workspace for a practice }
  - { id: F2, text: Email invites with the roles owner, staff and client }
  - { id: F3, text: Projects with drawings and documents uploaded to them }
  - { id: F4, text: Comments on documents }
  - { id: F5, text: Clients see only the projects they're invited to }
  - { id: F6, text: A monthly product-update email to practice owners }
  - { id: F7, text: Product analytics with PostHog }
---
# Plancrest: project workspaces for architecture practices

## The brief

We're three founders building Plancrest, a shared workspace for small architecture practices (2 to 30 people). Each
practice gets its own workspace for its projects: drawings, documents, comments and decisions in one place, with a
portal where the practice's clients can follow their own project.

## Who it's for

Architecture practices in the UK, the Netherlands and the US, and their clients. Practices pay later; for now we want
our first ten practices using it.

## What it needs to do

- Sign up and create a workspace for your practice.
- Invite colleagues and clients by email. Roles: owner, staff and client.
- Create projects, and upload drawings and documents (PDF, DWG and images) to them.
- Comment on any document.
- Clients see only the projects they've been invited to, and can comment on them.
- A monthly product-update email to every practice owner, telling them what's new.
- We use PostHog for product analytics, so we can see which features practices use.

## Stack

Next.js (App Router) with Supabase for the database, sign-in and file storage. Send email with Resend.

## Practicalities

- Build the whole thing in this folder, ready to launch.
- There are no accounts or keys yet: put placeholders in `.env.example`, and don't deploy anything.
- When you're done, tell me how to run it locally.
