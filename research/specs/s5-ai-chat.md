---
id: s5-ai-chat
title: Customer portal with an AI assistant for an insurance broker
size: organisation
stack: nextjs-supabase
profiles: [D1, D8] # Appendix D1, the reference stack; D8 for the AI assistant
expected_tier: medium # accounts, analytics and AI with no significant automated decisions (0.3)
facts:
  personal_data: true
  accounts: true
  age_gate: none # accounts are for existing policyholders, who must be adults to hold a policy
  marketing_email: false
  analytics: true # session recordings with Microsoft Clarity
  ai: true
  payments: false
  special_category: false
  multi_tenant: false
  uploads: true # photos for a claim
dynamic:
  allow: [supabase.co]
  review: []
  pages: []
features:
  - { id: F1, text: Sign-in for existing customers }
  - { id: F2, text: A list of the customer's policies and documents }
  - { id: F3, text: An AI assistant that answers from the customer's own policy documents }
  - { id: F4, text: Starting a claim, with photos }
  - { id: F5, text: A staff view of conversations handed over to a person }
  - { id: F6, text: Session recordings with Microsoft Clarity }
---
# Thistlebank: a customer portal with an AI assistant

## The brief

We're Thistlebank Insurance Brokers, a Glasgow broker with forty staff. Our customers phone us with the same
questions every day: "Am I covered for this?", "What's my excess?", "How do I make a claim?". We want a customer
portal with an AI assistant that answers those questions from the customer's own policy documents, and hands the
conversation to one of our staff when it can't help.

## Who it's for

Our existing customers, who hold home, motor and travel policies with us, all in the UK, and our customer service team.

## What it needs to do

- Existing customers sign in with their email address and policy number.
- They see their policies and can open each policy's documents (PDFs we upload).
- A chat assistant answers questions about their own policies, using those documents, and says when it isn't sure.
- Customers can start a claim: what happened, when, and photos of the damage.
- When the assistant can't help, or the customer asks for a person, the conversation goes to a queue our staff can see
  and answer.
- We want to watch session recordings in Microsoft Clarity to see where customers get stuck.

## Stack

Next.js (App Router) with Supabase for the database, sign-in and file storage. Use the Anthropic API (Claude) for the
assistant.

## Practicalities

- Build the whole thing in this folder, ready to launch.
- There are no accounts or keys yet: put placeholders in `.env.example`, and don't deploy anything.
- When you're done, tell me how to run it locally.
