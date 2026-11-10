---
# Scoring facts, never shown to the agent: prepare.ts gives it only the text below the front matter.
id: s1-waitlist
title: Waitlist landing page with email capture
size: individual
stack: astro-supabase
profiles: [D7] # Appendix D7, websites and waitlists; stacks/astro.md and stacks/supabase.md once Phase 3 merges
expected_tier: medium # marketing email and analytics (framework 0.3)
facts:
  personal_data: true # a waitlist email is personal data (how-to-use.md, G2)
  accounts: false
  age_gate: none # no accounts; only an email address
  marketing_email: true # the launch email is marketing (9.11)
  analytics: true
  ai: false
  payments: false
  special_category: false
  multi_tenant: false
  uploads: false
dynamic:
  allow: [supabase.co]
  review: []
  pages: []
features:
  - { id: F1, text: A landing page with a headline and benefit sections }
  - { id: F2, text: An email sign-up form that stores each sign-up with its date }
  - { id: F3, text: A thank-you message after joining }
  - { id: F4, text: A launch email that can be sent to the whole list }
  - { id: F5, text: Visit statistics with Google Analytics }
---
# Ledgerwren: a landing page and waitlist

## The brief

I'm building Ledgerwren, a budgeting app for freelancers that sets aside tax from each invoice as it's paid. Before I
build the app itself, I want a landing page that explains the idea and collects email addresses for a waitlist. When
the app is ready, I'll email everyone on the list to tell them it's live.

## Who it's for

Freelancers and sole traders in the UK, Ireland and Germany. I'm one person doing this in the evenings.

## What it needs to do

- A single landing page: a headline, three short sections on the benefits, and a box to join the waitlist with an
  email address.
- Store every sign-up so I can see who joined and when.
- Show people a thank-you message after they join.
- A "we've launched" email I can send to everyone on the list in one go when the app is ready.
- I want to see how many people visit and where they come from. I already use Google Analytics, so use that.
- Use the Inter font. It should look clean and work well on phones.

## Stack

Astro for the site, with Supabase to store the sign-ups. Send email with Resend.

## Practicalities

- Build the whole thing in this folder, ready to launch.
- There are no accounts or keys yet: put placeholders in `.env.example`, and don't deploy anything.
- When you're done, tell me how to run it locally.
