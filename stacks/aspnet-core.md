# ASP.NET Core

> **Group:** Backend · **Covers:** ASP.NET Core 10 (.NET 10 LTS, 10.0.14) with EF Core 10 and ASP.NET Core Identity; .NET 11 is due in November 2026 · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

ASP.NET Core has authorization policies, but no rows are filtered until you say so. Enforce access in three places:

- **Deny by default.** Set a [`FallbackPolicy`](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-10.0) that requires an authenticated user. It is [`null` by default](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-10.0#default-and-fallback-policies), so an endpoint without `[Authorize]` or `.RequireAuthorization()` is public. `[AllowAnonymous]` is the escape hatch: grep for it in review.
- **Rows.** Give every tenant-owned entity an EF Core [global query filter](https://learn.microsoft.com/en-us/ef/core/querying/filters#using-context-data---multi-tenancy) on the tenant from the signed-in user. **Name it** (EF 10): an [unnamed second `HasQueryFilter` call replaces the first](https://learn.microsoft.com/en-us/ef/core/querying/filters#using-multiple-query-filters), so adding a soft-delete filter later can silently drop the tenant filter. These skip filters, so review each one:
  - `IgnoreQueryFilters()`;
  - `ExecuteSql`, `SqlQuery` and Dapper;
  - a filtered entity reached through a [required navigation](https://learn.microsoft.com/en-us/ef/core/querying/filters#query-filters-and-required-navigations), which can drop rows unexpectedly.
- **Actions.** Use [resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0) (`IAuthorizationService.AuthorizeAsync(user, task, "task.update")`) with requirement handlers: your `assertCan()` (7.2).

```csharp
// AppDbContext.cs and Program.cs — the filter hides other tenants; the policy decides the action
public class AppDbContext(DbContextOptions<AppDbContext> options, ITenant tenant) : DbContext(options)
{
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    protected override void OnModelCreating(ModelBuilder b) =>
        b.Entity<TaskItem>().HasQueryFilter("Tenant", t => t.OrganizationId == tenant.OrganizationId);
}
app.MapPatch("/tasks/{id:int}", async (int id, RenameTask body, AppDbContext db, IAuthorizationService authz, ClaimsPrincipal user) =>
{
    var task = await db.Tasks.SingleOrDefaultAsync(t => t.Id == id);              // other tenants: null
    if (task is null) return Results.NotFound();
    if (!(await authz.AuthorizeAsync(user, task, "task.update")).Succeeded) return Results.Forbid();
    task.Title = body.Title; await db.SaveChangesAsync();                          // RenameTask has no OrganizationId
    return Results.NoContent();
});
```

**Postgres RLS as a second layer (optional).** ASP.NET Core doesn't set it up. In each unit of work, open a transaction and run `select set_config('app.org_id', @org, true)` first (an EF Core interceptor can do it). Connect as a role that doesn't own the tables and lacks `BYPASSRLS` ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).

**The 5.4 isolation test**, with [`WebApplicationFactory`](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0) and the docs' [test authentication handler](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0#mock-authentication). Since .NET 10, the [`Program` class is visible to tests](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0#better-support-for-testing-apps-with-top-level-statements) without `public partial class Program`:

```csharp
public class TenantIsolationTests(TestAppFactory factory) : IClassFixture<TestAppFactory>
{
    [Fact]
    public async Task MemberOfACannotReachB()
    {
        var url = $"/tasks/{Seed.TaskB}";                                      // the seed holds two organisations
        Assert.Equal(HttpStatusCode.Unauthorized, (await factory.CreateClient().GetAsync(url)).StatusCode);
        var userA = factory.CreateClientAs(Seed.MemberOfA);                    // signs in through TestAuthHandler
        Assert.Equal(HttpStatusCode.NotFound, (await userA.GetAsync(url)).StatusCode);
        var patch = await userA.PatchAsJsonAsync(url, new { title = "x" });
        Assert.Equal(HttpStatusCode.NotFound, patch.StatusCode);
        Assert.Equal("B's task", await factory.ReadTitleIgnoringFiltersAsync(Seed.TaskB));
    }
}
```

## Authentication

- **Identity's defaults** ([configuration](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0)):
  - passwords are hashed with PBKDF2, at 100,000 iterations by default;
  - the password rules are 6 characters with digit, upper, lower and symbol required. Set `RequiredLength = 12` and turn the composition rules off (7.1);
  - lockout after 5 failures for 5 minutes, applied to new users too.
- **Lockout is off in the default sign-in page.** The Identity UI calls [`PasswordSignInAsync(..., lockoutOnFailure: false)`](https://github.com/dotnet/aspnetcore/blob/release/10.0/src/Identity/UI/src/Areas/Identity/Pages/V5/Account/Login.cshtml.cs), so failed passwords never lock an account. [Set it to `true`](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/2fa?view=aspnetcore-10.0#account-lockout-for-protecting-against-brute-force-attacks), and add the [rate-limiting middleware](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0) per IP on the sign-in endpoints.
- **MFA and passkeys.** TOTP two-factor sign-in is built in.
  - [Passkeys are new in .NET 10](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/passkeys/?view=aspnetcore-10.0). Only the Blazor Web App template includes them. They're a primary factor, not a second one, and attestation isn't validated by default.
- **The cookie.** By default it is [`HttpOnly` and `SameSite=Lax` with `SecurePolicy = SameAsRequest`, and lasts 14 days with sliding expiry](https://github.com/dotnet/aspnetcore/blob/release/10.0/src/Security/Authentication/Cookies/src/CookieAuthenticationOptions.cs).
  - Behind a TLS-terminating proxy, `SameAsRequest` gives no `Secure` flag unless forwarded headers are set up (Deployment). Set `SecurePolicy = Always`.
  - Shorten the lifetime to fit your 7.1 policy.
- **Sign out everywhere.** [`UpdateSecurityStampAsync`](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0#isecuritystampvalidator-and-signout-everywhere) invalidates existing cookies when they are next validated. Call it after a password, email or role change.
- **APIs (changed in .NET 10).** Endpoints with [API metadata](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0#avoid-cookie-login-redirects-for-known-api-endpoints) now get 401 or 403 instead of a redirect to sign-in. [`MapIdentityApi`](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0) issues cookies or proprietary bearer tokens, and the docs recommend cookies for browser apps.
- **Advisories.**
  - [CVE-2026-70175](https://github.com/dotnet/aspnetcore/security/advisories/GHSA-x3vp-85cm-q97r) (13 October 2026, fixed in 10.0.13): Identity's password-reset and confirmation flows could email the address given in the request rather than the stored one.
  - [CVE-2025-24070](https://github.com/dotnet/aspnetcore/security/advisories/GHSA-2865-hh9g-w894): `RefreshSignInAsync` misuse could sign one user in as another.

## Secrets

- **Configuration.** It comes from `appsettings*.json`, environment variables and providers such as [Azure Key Vault](https://learn.microsoft.com/en-us/aspnet/core/security/key-vault-configuration?view=aspnetcore-10.0). The [Secret Manager](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-10.0) is for development only: it doesn't encrypt values. Commit no secrets to `appsettings.json`.
- **Data Protection keys** encrypt auth cookies and antiforgery tokens. If no persistent location is found, [keys live only in the process and are lost when it stops](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/default-settings?view=aspnetcore-10.0). Every user is then signed out, and multiple instances reject each other's cookies. Persist the keys, encrypted, in shared storage ([configuration](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview?view=aspnetcore-10.0)).
- **Blazor WebAssembly is public.** [Settings files in `wwwroot` are visible to users](https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/configuration?view=aspnetcore-10.0), and the app's code is downloaded by the browser: never a secret there.
- **Error pages.** Keep the Developer Exception Page to the Development environment. Use `UseExceptionHandler` with ProblemDetails that carry an ID, not exception text (T-11).

## CSRF and XSS

- **What's protected automatically** ([antiforgery](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0)):
  - Razor Pages validate antiforgery tokens, and the form tag helper adds the token.
  - In MVC, apply [`AutoValidateAntiforgeryTokenAttribute`](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0#automatically-validate-antiforgery-tokens-for-unsafe-http-methods-only) globally, which the docs recommend for non-API apps.
  - Blazor and minimal APIs need `app.UseAntiforgery()`.
- **The gaps.**
  - The middleware [validates only POST, PUT and PATCH](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0#http-method-limitations-and-httpmethodoverridemiddleware-interaction), so a cookie-authenticated `MapDelete` isn't checked: call `IAntiforgery.ValidateRequestAsync` yourself.
  - JSON endpoints that use cookie authentication aren't covered by form validation: send the token in a header, or check `Origin`.
- **Escape hatches.** `[IgnoreAntiforgeryToken]` and `.DisableAntiforgery()`. .NET 11 adds an automatic `Sec-Fetch-Site` and `Origin` check: re-check this section when you upgrade.
- **XSS.** [Razor encodes `@` output](https://learn.microsoft.com/en-us/aspnet/core/security/cross-site-scripting?view=aspnetcore-10.0#explore-html-encoding-with-razor). `Html.Raw`, `HtmlString` and Blazor's `MarkupString` don't, so use them only on sanitised HTML (T-04).
- **CSP.** There's no built-in CSP middleware. Blazor needs the extra sources listed in its [CSP guide](https://learn.microsoft.com/en-us/aspnet/core/blazor/security/content-security-policy?view=aspnetcore-10.0). A small middleware with a per-request nonce:

```csharp
// Program.cs — the 7.4 policy, report-only until the reports are clean
app.Use(async (context, next) =>
{
    var nonce = Convert.ToBase64String(RandomNumberGenerator.GetBytes(16));
    context.Items["csp-nonce"] = nonce;                       // in Razor: nonce="@Context.Items["csp-nonce"]"
    context.Response.Headers["Content-Security-Policy-Report-Only"] =
        $"default-src 'self'; script-src 'self' 'nonce-{nonce}' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; " +
        "base-uri 'self'; form-action 'self'; object-src 'none'";
    await next();
});
```

## Fonts and assets

- **Static assets.** [`MapStaticAssets()`](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files?view=aspnetcore-10.0) serves `wwwroot` from your own domain, fingerprinted and compressed. Put `woff2` files and libraries in `wwwroot/lib`, and restore them at build time (LibMan or npm), never from a CDN at runtime.
- **Layouts.** Check `_Layout.cshtml` and `App.razor` for CDN `<link>` and `<script>` tags. A separate SPA follows its own stack profile.
- **Check it.** Run the 9.9 test, and keep `font-src 'self'`.

## Consent

- **Nothing loads unless a layout prints it.** Razor and Blazor SSR render on the server. Load the 9.7 consent module from `wwwroot` with the request's nonce, and load analytics only through `loadWhenConsented()`. With Blazor's [enhanced navigation](https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/navigation?view=aspnetcore-10.0#enhanced-navigation-and-form-handling) or interactive rendering, the page doesn't fully reload, so do a full reload after withdrawal (9.8).
- **The built-in cookie consent isn't enough.** It's the [2.2-style feature](https://learn.microsoft.com/en-us/aspnet/core/security/gdpr?view=aspnetcore-10.0) (`CookiePolicyOptions.CheckConsentNeeded` and a consent partial). It records one yes or no, and the [sample banner has only "Accept"](https://github.com/dotnet/AspNetCore.Docs/blob/main/aspnetcore/security/gdpr/samples/RP6.0/WebGDPR/Pages/Shared/_CookieConsentPartial.cshtml). That fails 9.8's equal "Reject all" and per-purpose choices. Use the 9.7 module instead, and mark only strictly necessary cookies `IsEssential`.
- **The consent POST.** It needs the antiforgery token in a header (minimal API with `UseAntiforgery`, or an MVC action). It appends to `consent_records` (CR-05), and marketing sends check that table (CR-06).
- **Cookie register (9.8).** List `.AspNetCore.Identity.Application`, `.AspNetCore.Antiforgery.*` and `consent_v1` as strictly necessary.

## Logging

- **What gets logged.** `ILogger` writes structured logs; give each a correlation ID from `Activity` or OpenTelemetry. Never log request bodies, emails or tokens (7.5).
- **HTTP logging** is opt-in (`AddHttpLogging` and `UseHttpLogging`), and [can record personal data](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-logging/?view=aspnetcore-10.0#redacting-sensitive-data). If you enable it, log only fields like `Duration` and turn on redaction with `AddRedaction()` and `AddHttpLoggingRedaction()`.
- **Exceptions.** Log them server-side with the ID you return in ProblemDetails.
- **Error trackers.** Sentry is a processor (3.6). In the .NET SDK, [`SendDefaultPii` is `false` by default](https://docs.sentry.io/platforms/dotnet/guides/aspnetcore/configuration/options/): keep it that way.

## Testing

- **Tools.** Use xUnit, NUnit or MSTest with `WebApplicationFactory` and `TestServer`, and a real database (Testcontainers) for query filters and RLS.
- **Isolation and the role matrix.** Run the section 1 test on every pull request. Add a `[Theory]` over role, action and expected status for the 7.2 matrix.
- **CSRF.** Test that a cookie-authenticated POST, PATCH and DELETE without the token are rejected.
- **No third-party requests (9.9).** Run the framework's Playwright spec as it is against the app, or port it to [Playwright for .NET](https://playwright.dev/dotnet/docs/network) (`page.Request`).
- **Dependencies.** Run [`dotnet package list --vulnerable`](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-package-list) in CI (the .NET 10 form; `dotnet list package` on older SDKs), plus Dependabot or Renovate (7.4).

## Deployment

- **Hosting.** Run on any host with a UK or EU region for the app, database, key storage and logs (9.17).
- **Behind a proxy.** Use the [Forwarded Headers middleware](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0), with `KnownProxies` or `KnownNetworks` set to your proxy. The defaults trust only loopback. `ASPNETCORE_FORWARDEDHEADERS_ENABLED=true` trusts any forwarder.
- **HTTPS and HSTS.** Use `UseHttpsRedirection` and [`UseHsts`](https://learn.microsoft.com/en-us/aspnet/core/security/enforcing-ssl?view=aspnetcore-10.0). HSTS `max-age` defaults to 30 days: set two years with `IncludeSubDomains` and `Preload` once HTTPS is stable (7.4). Add `nosniff`, `Referrer-Policy` and `Permissions-Policy` in the same middleware as the CSP.
- **Migrations.** Don't call [`Database.Migrate()` at start-up](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/migrations?view=aspnetcore-10.0) in production. Run migration bundles or SQL scripts from CI after approval (12.1), with a migration-only database role (7.4). Keep backups as 5.7 describes.

## Limits

- **Rows are your job.** Authorization policies don't filter rows. One query without the filter, or one `IgnoreQueryFilters()`, leaks across tenants (T-01).
- **Support** ([policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core)).
  - .NET 10 LTS is supported until 14 November 2028.
  - **.NET 8 and .NET 9 both reach end of support on 10 November 2026**, five days after this check: move to 10 now.
  - .NET 11, an STS release, launches 10–13 November 2026.
- **Patching.** [CVE-2025-55315](https://github.com/dotnet/aspnetcore/security/advisories/GHSA-5rrx-jjjq-q2r5) (October 2025) was HTTP request smuggling in Kestrel that could bypass security checks. Several 2026 denial-of-service fixes followed. Stay on the latest 10.0.x (10.0.14 when checked).

## Sources

- ASP.NET Core 10 docs: [what's new in 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0), [authorization policies](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies?view=aspnetcore-10.0), [resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resource-based?view=aspnetcore-10.0), [Identity configuration](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-configuration?view=aspnetcore-10.0), [2FA and lockout](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/2fa?view=aspnetcore-10.0), [passkeys](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/passkeys/?view=aspnetcore-10.0), [Identity API endpoints](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization?view=aspnetcore-10.0), [rate limiting](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-10.0), [Secret Manager](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-10.0), [Key Vault configuration](https://learn.microsoft.com/en-us/aspnet/core/security/key-vault-configuration?view=aspnetcore-10.0), [Data Protection defaults](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/default-settings?view=aspnetcore-10.0) and [configuration](https://learn.microsoft.com/en-us/aspnet/core/security/data-protection/configuration/overview?view=aspnetcore-10.0), [antiforgery](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery?view=aspnetcore-10.0), [XSS](https://learn.microsoft.com/en-us/aspnet/core/security/cross-site-scripting?view=aspnetcore-10.0), [Blazor CSP](https://learn.microsoft.com/en-us/aspnet/core/blazor/security/content-security-policy?view=aspnetcore-10.0), [static files](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/static-files?view=aspnetcore-10.0), [GDPR support](https://learn.microsoft.com/en-us/aspnet/core/security/gdpr?view=aspnetcore-10.0), [HTTP logging](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/http-logging/?view=aspnetcore-10.0), [integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0), [proxies and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer?view=aspnetcore-10.0), [HTTPS and HSTS](https://learn.microsoft.com/en-us/aspnet/core/security/enforcing-ssl?view=aspnetcore-10.0), [EF migrations in Razor Pages](https://learn.microsoft.com/en-us/aspnet/core/data/ef-rp/migrations?view=aspnetcore-10.0)
- EF Core: [global query filters](https://learn.microsoft.com/en-us/ef/core/querying/filters)
- .NET: [support policy](https://dotnet.microsoft.com/en-us/platform/support/policy/dotnet-core); source: [Identity UI login page](https://github.com/dotnet/aspnetcore/blob/release/10.0/src/Identity/UI/src/Areas/Identity/Pages/V5/Account/Login.cshtml.cs), [`CookieAuthenticationOptions`](https://github.com/dotnet/aspnetcore/blob/release/10.0/src/Security/Authentication/Cookies/src/CookieAuthenticationOptions.cs), [consent partial sample](https://github.com/dotnet/AspNetCore.Docs/blob/main/aspnetcore/security/gdpr/samples/RP6.0/WebGDPR/Pages/Shared/_CookieConsentPartial.cshtml)
- Advisories: [dotnet/aspnetcore](https://github.com/dotnet/aspnetcore/security/advisories) (GHSA-x3vp-85cm-q97r, GHSA-2865-hh9g-w894, GHSA-5rrx-jjjq-q2r5)
- Other: [Playwright for .NET](https://playwright.dev/dotnet/docs/network), [Sentry ASP.NET Core options](https://docs.sentry.io/platforms/dotnet/guides/aspnetcore/configuration/options/), [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- OWASP Cheat Sheets (linked, not copied): [.NET Security](https://cheatsheetseries.owasp.org/cheatsheets/DotNet_Security_Cheat_Sheet.html), [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
