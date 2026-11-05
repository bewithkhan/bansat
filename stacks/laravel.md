# Laravel

> **Group:** Backend · **Covers:** Laravel 13 (13.40) on PHP 8.3–8.5, with notes for 12.x · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

Laravel apps usually run on MySQL, MariaDB or SQLite (the skeleton's default), and none of them has row-level security. So the database layer of 7.2 lives in Eloquent, and you enforce access in three places:

- **Tenant scope.** Give every tenant-owned model a [global scope](https://laravel.com/framework/docs/13.x/eloquent#global-scopes) (`#[ScopedBy(TenantScope::class)]`) that adds `where organization_id = ?`. Work out the tenant on the server from the signed-in user's membership. Never take it from a request field or header (T-03).
- **Policies.** Write one [policy](https://laravel.com/framework/docs/13.x/authorization#creating-policies) per model (`php artisan make:policy TaskPolicy --model=Task`). Check it in every controller action with `Gate::authorize('update', $task)`, the new `#[Authorize('update', 'task')]` attribute (13.x), or `->can('update', 'task')` on the route. This is your `assertCan()` (7.2). [`Response::denyAsNotFound()`](https://laravel.com/framework/docs/13.x/authorization#customizing-policy-response-status) returns a 404, so a user can't tell that another tenant's record exists.
- **Writes.** Leave `organization_id`, `creator_id` and `role` out of the model's `#[Fillable]` list and set them on the server. Never put [`#[Unguarded]`](https://laravel.com/framework/docs/13.x/eloquent#mass-assignment) on tenant data.

These skip the scope, so review each use:
- `withoutGlobalScope()` and `withoutGlobalScopes()`.
- The query builder (`DB::table`, `DB::select`) and raw SQL: global scopes are an Eloquent feature.
- Nested route parameters, unless the route uses [`scopeBindings()`](https://laravel.com/framework/docs/13.x/routing#implicit-model-binding-scoping).
- Queued jobs, Artisan commands and scheduled tasks. They run with no signed-in user, so pass the tenant ID in and check it again.

**Postgres RLS as a second layer (optional).** Laravel doesn't set this up for you. At the start of each request's transaction, run `select set_config('app.org_id', ?, true)` and write policies on `current_setting('app.org_id')`. The `true` keeps the setting to that transaction, so it can't leak to the next request on a pooled connection ([PostgreSQL](https://www.postgresql.org/docs/current/functions-admin.html)). Connect as a role that doesn't own the tables: superusers and `BYPASSRLS` roles skip policies, and so do table owners unless the table has `FORCE ROW LEVEL SECURITY` ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)). Keep the Eloquent scope as well.

**The 5.4 isolation test** in Pest. It needs two organisations in the seed (5.5):

```php
// tests/Feature/TenantIsolationTest.php
use App\Models\{Organization, Task, User};
uses(Illuminate\Foundation\Testing\RefreshDatabase::class);

test('a member of org A cannot reach org B', function () {
    $userA = User::factory()->create();
    $userA->organizations()->attach(Organization::factory()->create(), ['role' => 'MEMBER']);
    $taskB = Task::factory()->for(Organization::factory())->create();

    $this->getJson("/tasks/{$taskB->id}")->assertUnauthorized();                 // anonymous
    $this->actingAs($userA)->getJson("/tasks/{$taskB->id}")->assertNotFound();   // hidden by the scope
    $this->actingAs($userA)->patchJson("/tasks/{$taskB->id}", ['title' => 'x'])->assertNotFound();
    $this->actingAs($userA)->postJson('/tasks', ['organization_id' => $taskB->organization_id, 'title' => 'x']);
    expect(Task::withoutGlobalScopes()->whereBelongsTo($taskB->organization)->count())->toBe(1);
});
```

## Authentication

- **Starting point.** The [starter kits](https://laravel.com/framework/docs/13.x/starter-kits) (React, Svelte, Vue, Livewire) run on Fortify. They give you sign-in, registration, password reset and email verification, plus TOTP two-factor sign-in, which is on by default (`Features::twoFactorAuthentication()` in `config/fortify.php`). The [WorkOS AuthKit variant](https://laravel.com/framework/docs/13.x/starter-kits#workos) hands authentication to WorkOS, so add WorkOS to the processor register (3.6).
- **Passkeys (new in Fortify 1.37, April 2026).** Fortify's [`Features::passkeys()`](https://laravel.com/framework/docs/13.x/fortify#passkeys) wraps `laravel/passkeys`, which is still 0.x ([Packagist](https://packagist.org/packages/laravel/passkeys)), with the `@laravel/passkeys` browser client and its own rate limiter (`fortify.limiters.passkeys`). Set `relying_party_id` and `allowed_origins` to your production domain.
- **Cookies.** In the skeleton's [`config/session.php`](https://github.com/laravel/laravel/blob/13.x/config/session.php), `http_only` is true and `same_site` is `lax`, but `secure` is unset. Set `SESSION_SECURE_COOKIE=true` in production, and keep `SESSION_DOMAIN=null` so the cookie stays host-only (7.1). Sessions are stored in the database and last 120 minutes. `SESSION_ENCRYPT=true` encrypts the stored session data.
- **Session IDs.** Fortify and the starter kits [regenerate the session](https://laravel.com/framework/docs/13.x/session#regenerating-the-session-id) at sign-in. If you call `Auth::attempt()` yourself:
  - after sign-in, call `$request->session()->regenerate()`;
  - at sign-out, call [`invalidate()` and `regenerateToken()`](https://laravel.com/framework/docs/13.x/authentication#logging-out);
  - after a password change, call `Auth::logoutOtherDevices()`, which needs the `auth.session` middleware.
- **Passwords.** Laravel hashes with [bcrypt at 12 rounds](https://laravel.com/framework/docs/13.x/hashing) (`BCRYPT_ROUNDS`), and argon2id is available. Set `Password::defaults(fn () => Password::min(12)->uncompromised())` to get 7.1's length rule and [breached-password check](https://laravel.com/framework/docs/13.x/validation#validating-passwords), with no composition rules.
- **Throttling.** Fortify [throttles sign-in attempts](https://laravel.com/framework/docs/13.x/fortify#customizing-the-authentication-pipeline) per username and IP pair. 7.1 also wants a limit per account, so point `fortify.limiters.login` at a `RateLimiter::for()` that returns one limit keyed by the email and one keyed by the IP.
- **Re-authentication.** Put the [`password.confirm`](https://laravel.com/framework/docs/13.x/authentication#password-confirmation) middleware on account deletion, email change, export and role changes. It asks again only after `auth.password_timeout`, which is three hours by default, so consider shortening it.
- **Account enumeration.** The framework's [default reset message](https://github.com/laravel/framework/blob/13.x/src/Illuminate/Translation/lang/en/passwords.php) is "We can't find a user with that email address.", which tells an attacker the account doesn't exist. Publish the language files (`php artisan lang:publish`) and give the same answer either way (7.1).
- **API tokens.** [Sanctum](https://laravel.com/framework/docs/13.x/sanctum#token-expiration) stores tokens as SHA-256 hashes, but by default they never expire. Set `expiration` and schedule `sanctum:prune-expired`. A single-page app on your own domain should use Sanctum's cookie mode (`statefulApi()`), not tokens kept in `localStorage`.
- **Advisory, October 2026.** The built-in `token` guard could be bypassed on MySQL or MariaDB with a non-string credential. It's fixed in 13.29.0 and 12.68.0 ([GHSA-f9x3-7vq9-cph6](https://github.com/laravel/framework/security/advisories/GHSA-f9x3-7vq9-cph6)).

## Secrets

- **`.env`** must never be committed ([configuration](https://laravel.com/framework/docs/13.x/configuration#environment-configuration)). Call `env()` only inside `config/*.php`: once `php artisan config:cache` has run in production, `.env` isn't read and `env()` sees only real environment variables.
- **What reaches the browser.** Only variables prefixed with [`VITE_`](https://laravel.com/framework/docs/13.x/vite#environment-variables) are built into the JavaScript bundle. They are Laravel's `NEXT_PUBLIC_*`, so never put a secret in one.
- **`APP_KEY`** encrypts and signs cookies, and anything you pass to `Crypt`. Treat it as a production secret and give each environment its own. To [rotate it](https://laravel.com/framework/docs/13.x/encryption#gracefully-rotating-encryption-keys), move the old key into `APP_PREVIOUS_KEYS` so existing sessions keep working.
- **`APP_DEBUG=false`** in production. The [debug page shows configuration values](https://laravel.com/framework/docs/13.x/configuration#debug-mode), and it had an XSS fixed in 13.30.0 ([GHSA-jh5r-qr3c-85q8](https://github.com/laravel/framework/security/advisories/GHSA-jh5r-qr3c-85q8)). The skeleton's [`.env.example`](https://github.com/laravel/laravel/blob/13.x/.env.example) ships with `APP_DEBUG=true` and `LOG_LEVEL=debug`, so set both on purpose in each environment.
- **Where secrets live.** Keep them in the host's secret store. [Laravel Cloud's Secrets Manager](https://laravel.com/cloud/docs/secrets) injects them as environment variables when it deploys. Laravel can also commit an [encrypted `.env.encrypted`](https://laravel.com/framework/docs/13.x/configuration#encrypting-environment-files) (`php artisan env:encrypt`); if you use it, keep `LARAVEL_ENV_ENCRYPTION_KEY` in the CI secret store.

## CSRF and XSS

- **CSRF (changed in 13).** [`PreventRequestForgery`](https://laravel.com/framework/docs/13.x/csrf#preventing-csrf-requests) replaces `VerifyCsrfToken` and `ValidateCsrfToken`, which remain as [deprecated aliases](https://laravel.com/framework/docs/13.x/upgrade#request-forgery-protection). It sits in the `web` middleware group. It lets a request through when its `Sec-Fetch-Site` header says same-origin, and otherwise checks the session token: `@csrf` in forms, or the `X-CSRF-TOKEN` or `X-XSRF-TOKEN` header. `preventRequestForgery(originOnly: true)` drops the token fallback and answers 403. Browsers send `Sec-Fetch-Site` only over HTTPS.
- **Escape hatches:**
  - `preventRequestForgery(except: [...])`;
  - `allowSameSite: true`, which trusts every subdomain;
  - any route outside the `web` group, such as `routes/api.php`.

  Put webhooks outside `web` and verify the sender's signature on each one.
- **XSS.** Blade's [`{{ }}`](https://laravel.com/framework/docs/13.x/blade#displaying-data) escapes output with `htmlspecialchars`, but `{!! !!}` prints raw HTML. [`Str::markdown()`](https://laravel.com/framework/docs/13.x/strings#method-str-markdown) passes raw HTML through by default, so for user content pass `['html_input' => 'strip', 'allow_unsafe_links' => false]` (T-04).
- **Livewire** sends public properties and action parameters from the browser.
  - In Livewire 4.3 to 4.4.7, `#[Authorize]` could be bypassed ([fixed in 4.4.8](https://github.com/livewire/livewire/security/advisories/GHSA-mhf7-xp6r-6qrc), October 2026).
  - Livewire 3 before 3.6.4 had an unauthenticated remote code execution flaw ([GHSA-29cq-5w36-x7w3](https://github.com/livewire/livewire/security/advisories/GHSA-29cq-5w36-x7w3)).
- **CSP.** Laravel sends no Content Security Policy. Call [`Vite::useCspNonce()`](https://laravel.com/framework/docs/13.x/vite#content-security-policy-csp-nonce) in a middleware, and `@vite` adds the nonce to its tags. Start report-only (7.4), and register the middleware with `$middleware->web(append: [...])`:

```php
// app/Http/Middleware/ContentSecurityPolicy.php — the 7.4 policy, report-only until the reports are clean
public function handle(Request $request, Closure $next): Response
{
    Vite::useCspNonce();                       // before the view renders
    $response = $next($request);
    $policy = ["default-src 'self'", "script-src 'self' 'nonce-".Vite::cspNonce()."' 'strict-dynamic'",
        "style-src 'self' 'unsafe-inline'", "img-src 'self' blob: data:", "font-src 'self'",
        "connect-src 'self'", "frame-ancestors 'none'", "base-uri 'self'", "form-action 'self'",
        "object-src 'none'"];
    $response->headers->set('Content-Security-Policy-Report-Only', implode('; ', $policy));
    return $response;
}
```

## Fonts and assets

- **Fonts (new in 13).** The Laravel Vite plugin's [`fonts` option](https://laravel.com/framework/docs/13.x/vite#working-with-fonts) has `google()`, `bunny()`, `fontsource()` and `local()` providers. It resolves the font files and emits them as your own Vite assets, and [`@fonts`](https://laravel.com/framework/docs/13.x/blade#fonts) in the layout prints the preload links and CSS. The 13.x skeleton loads Instrument Sans this way ([`vite.config.js`](https://github.com/laravel/laravel/blob/13.x/vite.config.js)).
- **Apps started on 12.x.** The 12.x skeleton's [`welcome.blade.php`](https://github.com/laravel/laravel/blob/12.x/resources/views/welcome.blade.php) links `fonts.bunny.net` at runtime, and layouts copied from it do the same. That's a third-party request before consent (9.9). Swap it for the `fonts` option or a `@fontsource/*` package.
- **Scripts and styles.** Install them from npm and bundle them with `@vite`. Don't put CDN `<script>` or `<link>` tags in Blade layouts, and don't use Gravatar for avatars (9.9).
- **Check it.** Keep `font-src 'self'` in the CSP, and run the 9.9 test against a production build (`npm run build`), since that's what visitors get.

## Consent

- **Nothing loads unless a layout prints it.** Blade renders on the server, so keep vendor tags out of `resources/views/layouts/*`. Bundle the 9.7 consent module as `resources/js/privacy/consent.ts`, import it from `app.js` (or from the root component in an Inertia app), and load every analytics or replay script through `loadWhenConsented()`.
- **The consent cookie needs an exception.** The [`EncryptCookies`](https://laravel.com/framework/docs/13.x/responses#cookies-and-encryption) middleware turns any cookie it can't decrypt into null ([source](https://github.com/laravel/framework/blob/13.x/src/Illuminate/Cookie/Middleware/EncryptCookies.php)). The browser writes `consent_v1`, so `$request->cookie('consent_v1')` stays empty until you add `$middleware->encryptCookies(except: ['consent_v1'])` in `bootstrap/app.php`. On the server, use the cookie only to decide whether to show the banner. Before any marketing send, check `consent_records` (CR-06).
- **Recording consent.** Put `POST /privacy/consent` in `routes/web.php`, validate it with a Form Request, and insert into append-only `consent_records` (CR-05). Over HTTPS, the `fetch()` in `saveConsent()` passes `PreventRequestForgery` because the request is same-origin. In plain-HTTP local development, send the `X-CSRF-TOKEN` header from a `<meta name="csrf-token">` tag.
- **Cookie register (9.8).** List the session cookie (`SESSION_COOKIE`, by default your app's name plus `-session`), `XSRF-TOKEN` and `consent_v1` as strictly necessary.

## Logging

- **Level.** [Monolog channels](https://laravel.com/framework/docs/13.x/logging) are set in `config/logging.php`. In production, set `LOG_LEVEL` to `info` or above.
- **Context.** Laravel [adds the signed-in user's ID](https://laravel.com/framework/docs/13.x/errors#global-log-context) to every exception log: an ID, which is what 7.5 asks for. Don't add emails through `$exceptions->context()`.
- **Correlation ID.** In a middleware, call [`Context::add('trace_id', (string) Str::uuid())`](https://laravel.com/framework/docs/13.x/context). Context goes into every log entry and follows queued jobs, and `Context::addHidden()` holds values that must not be logged.
- **Redaction.**
  - Never log `$request->all()`.
  - Add a Monolog processor through the channel's [`tap`](https://laravel.com/framework/docs/13.x/logging#customizing-monolog-for-channels) to mask emails and tokens.
  - Mark password parameters [`#[\SensitiveParameter]`](https://www.php.net/manual/en/class.sensitiveparameter.php) so stack traces leave them out.
- **Telescope** records requests, queries and mail. Install it only in development ([`--dev`](https://laravel.com/framework/docs/13.x/telescope#local-only-installation)) and keep `hideSensitiveRequestDetails()`. Set `APP_ENV=production` in production: with any other value, [the dashboard is public](https://laravel.com/framework/docs/13.x/telescope#dashboard-authorization).
- **Error trackers.** Nightwatch, Sentry and Flare are processors (3.6). In Sentry's Laravel SDK, the new [`data_collection`](https://docs.sentry.io/platforms/php/guides/laravel/configuration/options/) option (SDK 4.29+, replacing `send_default_pii`) collects the user, cookies, request bodies and SQL bindings for any key you leave unset. Set every category explicitly, or keep `send_default_pii` false.

## Testing

- **Tools.** Use Pest 4 or PHPUnit, run with [`php artisan test`](https://laravel.com/framework/docs/13.x/testing). Feature tests use `actingAs()` and [`RefreshDatabase`](https://laravel.com/framework/docs/13.x/database-testing#resetting-the-database-after-each-test).
- **Isolation (5.4).** Run the section 1 test on every pull request, against the same database engine as production (MySQL or Postgres in CI, not SQLite), so raw SQL and any RLS behave as they will live.
- **Role matrix (7.2).** Turn it into a Pest dataset of role, action and expected status, so every cell has a test (11.3).
- **CSRF.** [CSRF protection is switched off in tests](https://laravel.com/framework/docs/13.x/csrf#csrf-excluding-uris), so feature tests won't notice a route you've exempted. Review every `except:` list, and submit one real form in a browser test.
- **No third-party requests (9.9).** For browser tests, Laravel [recommends Pest 4 over Dusk](https://laravel.com/framework/docs/13.x/dusk). For the 9.9 test, run the framework's Playwright spec as it is against `php artisan serve` after `npm run build`, with `ALLOWED_HOSTS` set to your domains.
- **Dependencies.** Add [`composer audit`](https://getcomposer.org/doc/03-cli.md#audit) to CI, next to `npm audit` (7.4).

## Deployment

- **Hosting.** [Laravel Cloud](https://laravel.com/cloud/docs/applications) has EU West (London) `eu-west-2`, as well as Ireland and Frankfurt. Choose the region when you create the app: [moving later](https://laravel.com/cloud/docs/knowledge-base/migrate-to-different-region) means building new infrastructure and switching traffic over. You can also run Laravel on your own UK or EU servers.
- **Deploy from CI (12.1).** Run `composer install --no-dev`, then [`php artisan optimize`](https://laravel.com/framework/docs/13.x/deployment#optimization) (it caches config, events, routes and views), then [`php artisan migrate --force`](https://laravel.com/framework/docs/13.x/migrations#running-migrations). Without `--force`, a destructive migration in production stops to ask for confirmation.
- **Headers.** The docs' [Nginx example](https://laravel.com/framework/docs/13.x/deployment#nginx) sets only `X-Frame-Options` and `X-Content-Type-Options`. Add HSTS, `Referrer-Policy` and `Permissions-Policy` (7.4) there or in middleware, next to the CSP.
- **Proxies.** Behind a load balancer, set [`trustProxies(at: [...])`](https://laravel.com/framework/docs/13.x/requests#configuring-trusted-proxies) to its addresses, so HTTPS detection, secure cookies and per-IP limits see the real client. Use `'*'` only when nothing else can reach the app.
- **Backups.** Turn on the provider's database backups in the same region, and keep a separate copy as 5.7 describes.

## Limits

- **No isolation in the database by default.** One model without the scope, or one `DB::` query, leaks data across tenants (T-01). The isolation test is your safety net, so add a case for every new table.
- **Support windows** ([release notes](https://laravel.com/framework/docs/13.x/releases#support-policy)). Laravel 13 gets security fixes until 17 March 2028 and 12.x until 24 February 2027. Laravel 11 lost security support on 12 March 2026.
- **2026 advisories.** Stay on the latest 13.x (13.40.0 when checked) so you're past all of these:
  - a read endpoint that includes relationships could empty a related table (13.27.0, [GHSA-5wcm-3v2w-8362](https://github.com/laravel/framework/security/advisories/GHSA-5wcm-3v2w-8362));
  - the token guard could be bypassed (13.29.0);
  - the debug page had an XSS (13.30.0);
  - temporary signed URLs on the local disk could outlive their expiry (13.12.0, [GHSA-crmm-hgp2-wgrp](https://github.com/laravel/framework/security/advisories/GHSA-crmm-hgp2-wgrp)).
- **Octane** [keeps the application in memory](https://laravel.com/framework/docs/13.x/octane#dependency-injection-and-octane) between requests. Never hold the current user or tenant in a singleton or a static property, or one request's tenant reaches the next.
- **The starter kits are your code.** Their routes, controllers and views are [copied into your app](https://laravel.com/framework/docs/13.x/starter-kits#react-customization), so fixes to that code don't arrive through `composer update`; only Fortify, underneath, does. After an advisory, compare your copy against the kit's repository.

## Sources

- Laravel 13 docs: [release notes and support policy](https://laravel.com/framework/docs/13.x/releases), [upgrade guide](https://laravel.com/framework/docs/13.x/upgrade), [authorization](https://laravel.com/framework/docs/13.x/authorization), [Eloquent](https://laravel.com/framework/docs/13.x/eloquent), [routing](https://laravel.com/framework/docs/13.x/routing), [authentication](https://laravel.com/framework/docs/13.x/authentication), [session](https://laravel.com/framework/docs/13.x/session), [Fortify](https://laravel.com/framework/docs/13.x/fortify), [Sanctum](https://laravel.com/framework/docs/13.x/sanctum), [starter kits](https://laravel.com/framework/docs/13.x/starter-kits), [hashing](https://laravel.com/framework/docs/13.x/hashing), [validation](https://laravel.com/framework/docs/13.x/validation), [configuration](https://laravel.com/framework/docs/13.x/configuration), [encryption](https://laravel.com/framework/docs/13.x/encryption), [CSRF](https://laravel.com/framework/docs/13.x/csrf), [Blade](https://laravel.com/framework/docs/13.x/blade), [strings](https://laravel.com/framework/docs/13.x/strings), [Vite](https://laravel.com/framework/docs/13.x/vite), [responses](https://laravel.com/framework/docs/13.x/responses), [logging](https://laravel.com/framework/docs/13.x/logging), [errors](https://laravel.com/framework/docs/13.x/errors), [context](https://laravel.com/framework/docs/13.x/context), [Telescope](https://laravel.com/framework/docs/13.x/telescope), [testing](https://laravel.com/framework/docs/13.x/testing), [database testing](https://laravel.com/framework/docs/13.x/database-testing), [Dusk](https://laravel.com/framework/docs/13.x/dusk), [deployment](https://laravel.com/framework/docs/13.x/deployment), [migrations](https://laravel.com/framework/docs/13.x/migrations), [requests](https://laravel.com/framework/docs/13.x/requests), [Octane](https://laravel.com/framework/docs/13.x/octane)
- Laravel source: [skeleton 13.x](https://github.com/laravel/laravel/tree/13.x) (`config/session.php`, `.env.example`, `vite.config.js`), [skeleton 12.x welcome view](https://github.com/laravel/laravel/blob/12.x/resources/views/welcome.blade.php), [framework 13.x](https://github.com/laravel/framework/tree/13.x) (`EncryptCookies`, `passwords.php`)
- Laravel Cloud: [applications and regions](https://laravel.com/cloud/docs/applications), [moving region](https://laravel.com/cloud/docs/knowledge-base/migrate-to-different-region), [secrets](https://laravel.com/cloud/docs/secrets)
- Advisories: [laravel/framework](https://github.com/laravel/framework/security/advisories), [livewire/livewire](https://github.com/livewire/livewire/security/advisories)
- PostgreSQL: [row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [`set_config`](https://www.postgresql.org/docs/current/functions-admin.html); PHP: [`SensitiveParameter`](https://www.php.net/manual/en/class.sensitiveparameter.php); Composer: [`audit`](https://getcomposer.org/doc/03-cli.md#audit); Sentry: [Laravel options](https://docs.sentry.io/platforms/php/guides/laravel/configuration/options/)
- OWASP Cheat Sheets (linked, not copied): [Laravel](https://cheatsheetseries.owasp.org/cheatsheets/Laravel_Cheat_Sheet.html), [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
