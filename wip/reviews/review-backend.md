# Review: six backend stack profiles (Laravel, Django, FastAPI, Rails, Spring Boot, ASP.NET Core)

The profiles hold up well: every cited advisory is real with the right IDs, dates and affected versions; every version
and support date matches the project's own records. Sources: GitHub's web pages and API were blocked, so the reviewer
used OSV for GHSA advisories; raw.githubusercontent.com for source code and templates; the Rails forum's raw posts;
release records on Packagist, PyPI, RubyGems, Maven Central, Spring's API and .NET's release metadata. Working copies:
/tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/rv6-backend-stacks-k7q (and OSV JSON for the
ASP.NET advisories in .../scratchpad/phase3/backend-osv/).

Blockers: FastAPI (two wrong "safe from" versions), Laravel (one wrong, low-risk sentence on Telescope).

## laravel.md
1. BLOCKER (wrong fact, low risk) · Logging, Telescope: says any `APP_ENV` other than `production` makes the dashboard
   public. Telescope is open only when `APP_ENV=local`; any other value goes through the `viewTelescope` gate.
   `TelescopeApplicationServiceProvider::authorization()`: `app()->environment('local') || Gate::check('viewTelescope', …)`
   (https://raw.githubusercontent.com/laravel/telescope/5.x/src/TelescopeApplicationServiceProvider.php). Fix: "If
   `APP_ENV` is still `local` in production, the dashboard is open to anyone. Set `production` and limit the gate to
   named staff."
2. Should fix · Authentication, enumeration: publishing language files doesn't remove the leak. Fortify answers an
   unknown address on password reset with a validation error (422 JSON or redirect with errors) and a known one with
   200/status (`FailedPasswordResetLinkRequestResponse.php`, `SuccessfulPasswordResetLinkRequestResponse.php` under
   https://raw.githubusercontent.com/laravel/fortify/1.x/src/Http/Responses/). The broker returns "Please wait before
   retrying" only for real accounts (`PasswordBroker::sendResetLink`, 13.x). Starter kits validate
   `Rule::unique(User::class)` so sign-up says "The email has already been taken." (react-starter-kit
   `app/Concerns/ProfileValidationRules.php`). Fix: bind your own
   `Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse` returning the success response for unknown and
   throttled addresses; give sign-up one "check your email" outcome (email the existing address), or record the risk
   in 7.3.
3. Should fix · Secrets, what reaches the browser (gap; only `VITE_` covered): kits share
   `'auth' => ['user' => $request->user()]` on every page, so every User column not `#[Hidden]` is in the page JSON
   (react-starter-kit `app/Http/Middleware/HandleInertiaRequests.php`). Livewire public properties are sent to the
   browser and are untrusted input (https://livewire.laravel.com/docs/4.x/security). Fix: share a minimal array or an
   API Resource; keep secrets and other tenants' data out of public properties; `#[Locked]` for IDs.
4. Should fix · CSRF and XSS, CSP (gap): Livewire's Alpine expressions need `'unsafe-eval'` unless `'csp_safe' => true`
   in `config/livewire.php` (https://livewire.laravel.com/docs/4.x/csp). Add one line: switch on CSP-safe mode before
   enforcing.
5. Should fix · Consent, CSRF note: "Over HTTPS the `fetch()` passes" holds only for browsers sending `Sec-Fetch-Site`;
   others fall back to the token check and get 419 (https://laravel.com/framework/docs/13.x/csrf;
   `PreventRequestForgery::hasValidOrigin` looks only at that header). Fix: always send `X-CSRF-TOKEN` from the meta
   tag.
6. Should fix · Access, Postgres RLS: "at the start of each request's transaction" — Laravel doesn't open a transaction
   per request; `set_config(…, true)` outside one lasts a single statement (PostgreSQL docs). Fails closed but
   confusing. Fix: open the transaction in a middleware and run `set_config` inside it.
7. Nits: `Password::uncompromised()` calls Have I Been Pwned from the server, list it in 3.6. Kits enable
   `Features::passkeys()` with the RP from `APP_URL`, and `user_handle_secret` defaults to `APP_KEY`
   (react-starter-kit `config/fortify.php`): tell builders to set `APP_URL` correctly and consider a separate
   `user_handle_secret`. "Pest 4": Pest 5.0.0 came out 24 July 2026 and 5.3.5 is current; write "Pest (browser testing
   since 4)". Give the 12.x floor: 12.69.0 clears all four 2026 advisories. Every `migrate` in production asks for
   confirmation, not only destructive ones. Add `withoutGlobalScopesExcept()` to the calls that skip the scope. Name
   the two `#[Authorize]` attributes: Laravel's `Illuminate\Routing\Attributes\Controllers\Authorize` and Livewire's
   (the advisory is about Livewire's). Add the `remember_web_*` cookie to the register if "remember me" is offered.

## django.md
1. Should fix · Access, isolation test: no "write into org B" case (5.4 includes one). Add a create POST carrying org
   B's ID and assert org B's count is unchanged; merge assertions to stay within 15 lines.
2. Should fix · Access, DRF (gap): `ModelSerializer` with `fields = "__all__"` exposes every column and lets clients set
   `organization` (https://www.django-rest-framework.org/api-guide/serializers/). Fix: list fields, make
   `organization` and role read-only, set them in `perform_create()`.
3. Nits: Sentry permissive defaults apply only once you pass a `data_collection` dict, and `event_scrubber` "only runs
   if data_collection is not defined" (https://docs.sentry.io/platforms/python/configuration/options/). The example is
   report-only, so mention `@csp_report_only_override({})` (https://docs.djangoproject.com/en/6.1/ref/csp/).
   `MFA_PASSKEY_LOGIN_ENABLED` defaults to False and needs `"webauthn"` in `MFA_SUPPORTED_TYPES`
   (https://docs.allauth.org/en/latest/mfa/configuration.html).

## fastapi.md
1. BLOCKER · Limits, "Pin Starlette": "fixed in 1.0.1 to 1.3.0" leaves CVE-2026-54283 open (GHSA-82w8-qh3p-5jfq, HIGH:
   `request.form()` ignores `max_fields` and `max_part_size` for urlencoded bodies, DoS), fixed in 1.3.1. All five
   2026 Starlette advisories were published 4 and 15 June, not May; fixes shipped 21 May to 12 June.
   https://api.osv.dev/v1/vulns/GHSA-82w8-qh3p-5jfq; https://pypi.org/pypi/starlette/json. Fix: "June 2026 … use 1.3.1
   or later (1.10.0 when checked)". Optionally the 1.1.0 fixes GHSA-x746-7m8f-x49c (HTTP method dispatch in
   `HTTPEndpoint`) and GHSA-wqp7-x3pw-xc5r (Windows UNC-path SSRF).
2. BLOCKER · Limits, multipart: "0.0.30 or later" leaves CVE-2026-53540 open (GHSA-v9pg-7xvm-68hf: a negative
   `Content-Length` loads the whole body into memory), fixed in 0.0.31 (4 June 2026).
   https://api.osv.dev/v1/vulns/GHSA-v9pg-7xvm-68hf. Fix: 0.0.31 or later. Optionally January's arbitrary-file-write
   GHSA-wp53-j4wj-2cfg (non-default configuration, fixed in 0.0.22).
3. Should fix · CSRF and XSS, middleware example requires `Sec-Fetch-Site: same-origin`; a front end on another origin
   (the usual case, as the profile says) sends `same-site` or `cross-site`, so every write is blocked. Fix: say the
   example assumes one origin; for a sibling subdomain accept `same-site` only when `Origin` is on the allowlist.
4. Nits: SQLAlchemy's recipe adds criteria only when `is_select`, but the hook also sees ORM bulk `UPDATE`/`DELETE`
   (https://docs.sqlalchemy.org/en/21/orm/session_events.html); handle or scope them. Sentry wording as Django.

## rails.md
1. Should fix · Access, Active Storage (gap): all Active Storage controllers are public by default; URLs are permanent
   signed IDs and work even when `ApplicationController` requires sign-in
   (https://guides.rubyonrails.org/active_storage_overview.html#authenticated-controllers). Fix: serve tenant files
   through your own authenticated controllers looking up through `current_organization`; consider
   `config.active_storage.draw_routes = false` (configuring guide).
2. Should fix · Access, isolation test: add a write-into-org-B case (5.4).
3. Should fix · Limits, Trilogy: no fixed version named; it's trilogy 2.13.2, which also makes `sjis`, `cp932`, `big5`,
   `gbk`, `gb18030` connection encodings raise `ArgumentError` (breaking).
   https://raw.githubusercontent.com/trilogy-libraries/trilogy/main/CHANGELOG.md. No CVE yet when announced
   (https://discuss.rubyonrails.org/raw/91797), not in OSV, so scanners may not flag it.
4. Should fix · Access, Postgres RLS: Rails doesn't open a transaction per request; wrap the action in a transaction
   (`around_action`) and run `set_config` inside it.
5. Nits: 8.1.4.1 also fixed IP spoofing in `remote_ip` through the `Forwarded` header (GHSA-2gff-2mmg-m73p, High, 8.1
   only; https://discuss.rubyonrails.org/raw/91802); `rate_limit` keys on that IP, tie to the rate-limit and CDN
   bullets. Mention `config.content_security_policy_nonce_auto = true` so the consent module's script tag gets the
   nonce. After the CVE-2026-66066 fix, Active Storage won't boot on libvips older than 8.13
   (https://discuss.rubyonrails.org/raw/91432). `render json: @task` serialises every column.

## spring-boot.md
1. Should fix · Access, Spring Data REST (gap): on the classpath it publishes every public repository and its query
   methods; `spring.data.rest.detection-strategy` defaults to `default` (Boot properties appendix); query methods
   appear under `/search`
   (https://docs.spring.io/spring-data/rest/reference/customizing/configuring-the-rest-url-path.html). The profile's
   own `findByIdAndOrganizationId(Long, Long)` would become a search endpoint where the caller picks the organisation.
   Fix: `detection-strategy=annotated`, `@RepositoryRestResource(exported = false)`, secure what you publish.
2. Should fix · Logging, Sentry: setting any one `dataCollection` field turns Data Collection on; every unset field
   takes its permissive default (user info, cookies, headers, all request and response bodies, query parameters,
   GraphQL documents and variables), and `sendDefaultPii` is ignored
   (https://docs.sentry.io/platforms/java/guides/spring-boot/configuration/options/). Say so explicitly.
3. Should fix · Access, isolation test: add a write-into-org-B case.
4. Should fix · CSRF and XSS, CSP: the "static policy" isn't 7.4's nonce-based policy; it lacks `form-action 'self'`
   (doesn't fall back to `default-src`), `frame-src 'none'`, `upgrade-insecure-requests`. Present the nonce filter as
   the default and add the missing directives.
5. Nits: 7.4 wants HSTS `max-age=63072000`; Spring's default is one year
   (https://docs.spring.io/spring-security/reference/7.1/features/exploits/headers.html). The CVE-2026-47842 fix
   deprecates `AesBytesEncryptor` and `Encryptors.standard()`, `stronger()`, `text()`, `delux()` for
   `AesGcmBytesEncryptor`; data may need re-encrypting (https://spring.io/security/cve-2026-47842). In the test,
   `user(...)` must receive your `Member` UserDetails, not a username, or `@AuthenticationPrincipal Member me` is null
   and the request 500s.

## aspnet-core.md
1. Should fix · Fonts and assets, and Testing: the default Identity UI loads Bootstrap from `cdn.jsdelivr.net` and
   jQuery/jquery-validation from `cdnjs.cloudflare.com` in every environment except Development
   (`<environment exclude="Development">`; release/10.0 `src/Identity/UI/src/Areas/Identity/Pages/V5/_Layout.cshtml`
   and `_ValidationScriptsPartial.cshtml`). Checking your `_Layout.cshtml` won't find it (it's inside the package); a
   9.9 test in Development won't catch it. The .NET 10 templates themselves have no CDN links. Fix: scaffold the
   Identity pages or point the Identity area at your own layout; run 9.9 with `ASPNETCORE_ENVIRONMENT=Production` and
   include `/Identity/Account/Login` and `/Identity/Account/Register`.
2. Should fix · Authentication, sign-out (gap vs 7.1): cookie sign-out only deletes the cookie; "the cookie is the
   single source of identity"
   (https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie?view=aspnetcore-10.0), so a copied
   cookie stays valid until expiry. Fix: server-side ticket store (`CookieAuthenticationOptions.SessionStore`) and
   delete at sign-out, or `UpdateSecurityStampAsync` noting `ValidationInterval` defaults to 30 minutes.
3. Should fix · Authentication, enumeration: the Register page shows `CreateAsync` errors including "Email '{0}' is
   already taken." (release/10.0 `Register.cshtml.cs`, `Resources.resx`). ForgotPassword is fine. Fix: one sign-up
   outcome whether or not the account exists.
4. Should fix · Consent, CSRF note: `UseAntiforgery` only enforces tokens on minimal APIs that bind form data, so a JSON
   consent POST isn't checked
   (https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0). Fix: call
   `IAntiforgery.ValidateRequestAsync` in the handler or add `RequireAntiforgeryTokenAttribute` metadata; set
   `HeaderName` and send that header from `saveConsent()`.
5. Should fix · Limits, patching: "several 2026 DoS fixes followed" omits three October fixes in 10.0.13:
   CVE-2026-70183 (GHSA-494h-xx7x-5frh, Blazor `AuthorizeRouteView` stale authorization result bypassing
   `[Authorize]`), CVE-2026-88092 (GHSA-rv87-ccxw-8ggf, Kestrel HTTP/1 request smuggling), CVE-2026-70188
   (GHSA-fpq8-4vhr-rcxx, Kestrel accepting newlines in HTTP/2 trailers). 10.0.14 (25 October) was an out-of-band
   security release (.NET release metadata). Name the Blazor bypass under Access or Limits.
6. Should fix · Access, isolation test: add a write-into-org-B case.
7. Nits: the lockout link opens the ASP.NET Core 1.1 SMS 2FA article (falls back to `view=aspnetcore-1.1`); link the
   10.0 Identity configuration page. `HttpMethodOverrideMiddleware` in form-field mode before antiforgery turns a POST
   into an unchecked DELETE. The test's anonymous 401 relies on .NET 10's API-endpoint detection (JSON body, JSON
   return type or `TypedResults`); a handler returning plain `IResult` still redirects. With 2FA or external logins
   Identity also sets `.AspNetCore.Identity.TwoFactorUserId`, `.AspNetCore.Identity.TwoFactorRememberMe` and
   `.AspNetCore.Identity.External` cookies; add them to the cookie register.

## All six
- Nit: CSP examples labelled "the 7.4 policy" leave out `frame-src 'none'` and `upgrade-insecure-requests` (browsers
  ignore the second in report-only mode, so "add it when you enforce").
- Nit: the 9.7 module posts to `/api/privacy/consent`, but Laravel, FastAPI and Spring use `/privacy/consent`; tell
  builders to change the URL in `saveConsent()`. In Laravel, warn against moving the route to `routes/api.php` (no
  session or CSRF there).
- Nit: no isolation test has a positive control; add one assertion that user A gets their own task.

## Checked and correct (don't change)
All advisories, versions, support dates, defaults and docs claims listed in the reviewer's report: Laravel's six GHSAs
and 13.x facts, Django 6.1.3/6.0.10/5.2.19 and its CSP, FastAPI 0.162.0 and its tutorial facts, Rails 8.1.4.1/8.0.5.2,
Spring Boot 4.1.2 BOM and Security 7 facts, ASP.NET Core 10.0.14 and .NET 11 RC3 facts; framework references; format;
own words.
