# Stack profiles

One file per stack. Each says what changes from Bansat's reference stack (Next.js and Supabase, framework Parts 3–7) when
you build on this one. The skill loads only the profile for the stack that Part 0 names (blueprint 3.7, FR-09), and
the site shows each one as a page.

| Group | Profiles |
|---|---|
| Backend | [Laravel](laravel.md), [Django](django.md), [FastAPI](fastapi.md), [Rails](rails.md), [Spring Boot](spring-boot.md), [ASP.NET Core](aspnet-core.md), [Express and NestJS](express-nestjs.md) |
| Frontend and full-stack | [Next.js](nextjs.md) (the reference), [Nuxt](nuxt.md), [SvelteKit](sveltekit.md), [Angular](angular.md), [React Router 7](react-router.md), [Astro](astro.md) |
| Mobile | [Flutter](flutter.md), [React Native and Expo](react-native-expo.md), [Swift (iOS)](swift-ios.md), [Kotlin (Android)](kotlin-android.md) |
| No-code and BaaS | [Lovable](lovable.md), [Bolt](bolt.md), [Bubble](bubble.md), [Webflow](webflow.md), [Firebase](firebase.md), [Supabase](supabase.md), [Appwrite](appwrite.md) |

## The format

Every profile starts with a title (`# Laravel`), then one line in this form:

> **Group:** Backend · **Covers:** Laravel 12 on PHP 8.2+ · **Checked:** 2026-11-05 against the official docs

Then the same ten sections, in this order (blueprint 3.8), each as a `##` heading:

1. **Access and the isolation test.** Where to enforce who can read and change what (database policies, ORM scopes,
   policies or middleware), and how to write the test that proves one tenant or user can't reach another's data
   (framework 5.4), in this stack's own test tools.
2. **Authentication.** The stack's own or usual auth: sessions or tokens, password hashing, MFA and passkeys,
   cookie flags, rate limits and lockout (7.1).
3. **Secrets.** How config and secrets are loaded, what reaches the client or the binary, and where secrets
   should live (7.4).
4. **CSRF and XSS.** What the stack does by default, the escape hatches that switch protection off, and how to set a
   Content Security Policy (7.4).
5. **Fonts and assets.** How to self-host fonts and scripts so nothing loads from a third party before consent (9.9).
6. **Consent.** Where to load analytics, replay and pixels only after consent, given how this stack renders (9.8).
7. **Logging.** Logging without personal data: the defaults, redaction, request and error logs, and error trackers
   (7.5).
8. **Testing.** The usual unit, integration and end-to-end tools, and how to run the isolation test and the
   no-third-party-requests test (9.9) here.
9. **Deployment.** Typical hosting, choosing the region for UK or EU data, security headers, migrations and
   backups.
10. **Limits.** What the stack can't do, and the traps people fall into with it.

Then **Sources**: the links behind the profile.

## Rules

- **Research first** (framework 12.2, step 0). Read the stack's official documentation for each section, and its
  security advisories and GitHub issues for known traps. Don't describe how a library behaves from memory.
- **Official sources.** Every claim about the stack's behaviour links to its own documentation or security guide.
  OWASP Cheat Sheets are CC BY-SA 4.0: link to them, but never copy their text or code. Don't link to blogs,
  courses or affiliate pages.
- **Our own words.** Short original code examples where they help (15 lines at most). Never paste documentation
  text or code.
- **Say the version.** Name the versions the profile covers, and flag behaviour that changed recently.
- **Defaults, then the gap.** For each section, say what the stack does out of the box and what you must add.
