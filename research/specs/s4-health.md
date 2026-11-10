---
id: s4-health
title: Fitness and recovery tracker for a personal trainer's clients
size: individual
stack: sveltekit-supabase
profiles: [D1] # web app; stacks/sveltekit.md and stacks/supabase.md once Phase 3 merges
expected_tier: high # health data: special category (0.3, 9.13)
facts:
  personal_data: true
  accounts: true
  age_gate: age-check # open sign-up with a free trial, so under-18s could join
  marketing_email: true # the monthly newsletter with offers
  analytics: false
  ai: false
  payments: false
  special_category: true # heart rate, sleep, weight, injuries and pain
  multi_tenant: false
  uploads: true # progress photos
dynamic:
  allow: [supabase.co]
  review: []
  pages: []
features:
  - { id: F1, text: Open sign-up with a two-week free trial }
  - { id: F2, text: A daily log of workouts, weight, sleep, resting heart rate and pain or injuries }
  - { id: F3, text: Progress photos }
  - { id: F4, text: A trainer dashboard of every client's logs }
  - { id: F5, text: A weekly check-in reminder email }
  - { id: F6, text: A monthly newsletter with tips and offers }
---
# Stridebook: training and recovery logs for my clients

## The brief

I'm a personal trainer working on my own. I want Stridebook, an app where my clients log their training and recovery
each day, so I can see how they're doing between sessions and adjust their plans.

## Who it's for

My clients, and anyone who finds me online: people in the UK and France who want to get fitter or come back from an
injury. Anyone can sign up from my website and get a two-week free trial.

## What it needs to do

- Sign up with an email address and start the free trial.
- A daily log: workouts done, weight, hours of sleep, resting heart rate, and any pain or injuries (where it hurts and
  how much, on a 1 to 10 scale).
- Upload progress photos.
- A dashboard for me showing every client's logs, with charts over time.
- A weekly email reminding clients to do their check-in.
- A monthly newsletter with training tips and my latest offers.

## Stack

SvelteKit with Supabase for the database, sign-in and photo storage. Send email with Resend.

## Practicalities

- Build the whole thing in this folder, ready to launch.
- There are no accounts or keys yet: put placeholders in `.env.example`, and don't deploy anything.
- When you're done, tell me how to run it locally.
