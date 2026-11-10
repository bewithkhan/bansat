---
id: s6-marketplace
title: Marketplace for second-hand climbing gear, with payments
size: startup
stack: laravel-mysql
profiles: [D1] # web app; stacks/laravel.md once Phase 3 merges. MySQL has no RLS, so access is enforced in the data layer (5.4)
expected_tier: medium # accounts, payments and marketing (0.3)
facts:
  personal_data: true
  accounts: true
  age_gate: age-check # buying and selling with money: an adults-only position is the simplest (9.12)
  marketing_email: true # the weekly digest
  analytics: false
  ai: false
  payments: true
  special_category: false
  multi_tenant: false
  uploads: true # listing photos, which are meant to be public
dynamic:
  allow: []
  review: [] # the payment provider's hosts are in the check's own review list
  pages: []
features:
  - { id: F1, text: Sign-up for buyers and sellers }
  - { id: F2, text: Listings with photos, price, size and condition }
  - { id: F3, text: Search and browse by category and location }
  - { id: F4, text: Card payment with an 8% commission and payouts to sellers }
  - { id: F5, text: Messages between buyer and seller }
  - { id: F6, text: A weekly email of new listings near you }
---
# Cragmarket: buy and sell second-hand climbing gear

## The brief

We're a two-person startup building Cragmarket, a marketplace where climbers buy and sell used gear: shoes, harnesses,
ropes, quickdraws and crash pads. Buyers pay through the site, we keep an 8% commission, and the rest goes to the seller.

## Who it's for

Climbers in the UK, Ireland, Germany and France, buying and selling from each other.

## What it needs to do

- Sign up to buy or sell.
- Sellers list an item with photos, a price, the size and its condition.
- Buyers search and browse by category and location.
- Buyers pay by card on the site; we take 8% and pay out the rest to the seller once the buyer confirms it arrived.
- Buyers and sellers can message each other about a listing.
- A weekly email to each user with new listings near them.

## Stack

Laravel with MySQL. Use Stripe for payments and payouts.

## Practicalities

- Build the whole thing in this folder, ready to launch.
- There are no accounts or keys yet: put placeholders in `.env.example`, and don't deploy anything.
- When you're done, tell me how to run it locally.
