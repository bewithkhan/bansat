---
id: s3-children
title: Children's reading and spelling practice app
size: organisation
stack: nextjs-supabase
profiles: [D1, D2] # Appendix D1, the reference stack, as a progressive web app (D2)
expected_tier: high # children are the audience (0.3)
facts:
  personal_data: true
  accounts: true
  age_gate: parental # children aged 7 to 11: a parent's consent in every market (9.12)
  marketing_email: true # the parents' newsletter
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
  - { id: F1, text: Parent sign-up }
  - { id: F2, text: Child profiles under a parent's account }
  - { id: F3, text: Daily ten-minute practice sessions for children }
  - { id: F4, text: A progress view for parents }
  - { id: F5, text: A monthly newsletter for parents }
  - { id: F6, text: Statistics on which exercises are used most }
---
# Wordkite: reading and spelling practice for children

## The brief

We're the Lantern Lane Reading Trust, a UK charity with twelve staff. We want Wordkite, a free app where children
practise reading and spelling for ten minutes a day, with exercises that get harder as they improve. Parents set it
up and follow their children's progress.

## Who it's for

Children aged 7 to 11 and their parents, in the UK and in Nigeria, where we work with schools in Lagos. Many families
will use it on a shared tablet or phone.

## What it needs to do

- Parents create an account, then add a profile for each of their children.
- Children pick their profile and do a ten-minute practice session: reading short passages and spelling words.
- Parents see each child's progress: sessions completed, words mastered, and words to work on.
- A monthly newsletter to parents with reading tips and news from the Trust.
- We need to see which exercises are used most, so we can improve them.
- It should work well on tablets and phones, and be installable from the browser.

## Stack

Next.js (App Router) with Supabase for the database and sign-in. Send email with Resend.

## Practicalities

- Build the whole thing in this folder, ready to launch.
- There are no accounts or keys yet: put placeholders in `.env.example`, and don't deploy anything.
- When you're done, tell me how to run it locally.
