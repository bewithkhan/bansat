---
# A spec for the harness's own tests, never given to an agent. Every fact is switched on, so every check applies to
# the fixture apps.
id: fixture
title: Fixture app (tests only)
size: individual
stack: nextjs-supabase
profiles: [D1]
expected_tier: high
facts:
  personal_data: true
  accounts: true
  age_gate: parental
  marketing_email: true
  analytics: true
  ai: true
  payments: true
  special_category: false
  multi_tenant: false
  uploads: true
dynamic:
  allow: [supabase.co]
  review: []
  pages: [/privacy/]
features:
  - { id: F1, text: Sign-up with year of birth and a parent's email for under-13s }
  - { id: F2, text: Account page with data export and account deletion }
---
# Fixture app

This file exists only for `research/checks/checks.test.ts` and `research/run/run.test.ts`. It is never a prompt.
