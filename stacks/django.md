# Django

> **Group:** Backend · **Covers:** Django 6.1 (6.1.3) on Python 3.12–3.15, with notes for 5.2 LTS · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

Django's auth system gives you permissions per model (add, change, delete, view), not per row. [Object-level permissions and login throttling are left to third-party packages](https://docs.djangoproject.com/en/6.1/topics/auth/). So the database layer of 7.2 is the queryset, and the view checks the action:

- **Start every query from the user.** Put a queryset method on each tenant-owned model, and make views build on it. In class-based views, override `get_queryset()`.
- **Then check the action.** Call your `can(user, action, obj)`, the `assertCan()` of 7.2, and raise `PermissionDenied` (403, S7) when it says no.
- **Deny by default.** Add [`LoginRequiredMiddleware`](https://docs.djangoproject.com/en/6.1/ref/middleware/#django.contrib.auth.middleware.LoginRequiredMiddleware) (5.1+). It sends every anonymous request to sign-in, except views marked `@login_not_required`.

```python
# tasks/models.py and views.py — tenancy comes from the user's memberships, never from the request
class TaskQuerySet(models.QuerySet):
    def visible_to(self, user):
        return self.filter(organization__memberships__user=user)

class Task(models.Model):
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    objects = TaskQuerySet.as_manager()

def task_detail(request, pk):
    task = get_object_or_404(Task.objects.visible_to(request.user), pk=pk)   # 404 for other tenants
    if request.method == "POST" and not can(request.user, "task.update", task):
        raise PermissionDenied
```

These skip your scoping:
- **Managers can't see the request.** Related-object access (`task.organization`) also goes through [`_base_manager`](https://docs.djangoproject.com/en/6.1/topics/db/managers/#using-managers-for-related-object-access), which ignores a filtering default manager. A manager helps, but the view must still filter.
- **Raw SQL.** `raw()`, `extra()`, `RawSQL` and `connection.cursor()` bypass your queryset methods.
- **Forms.** Keep `organization` and `role` out of `ModelForm` fields and set them in the view. An October 2026 fix covered model formsets with editable primary keys ([security archive](https://docs.djangoproject.com/en/6.1/releases/security/)).
- **The admin.** It shows staff everything their model permissions allow. Scope it with [`ModelAdmin.get_queryset()`](https://docs.djangoproject.com/en/6.1/ref/contrib/admin/#django.contrib.admin.ModelAdmin.get_queryset) and `has_view_permission()`, and keep it for internal staff with MFA.
- **Django REST framework.** The [default permission is unrestricted access](https://www.django-rest-framework.org/api-guide/permissions/), so set `DEFAULT_PERMISSION_CLASSES` to `IsAuthenticated`. `has_object_permission()` runs only on single-object views, and not on create, so filter `get_queryset()` as well.

**Postgres RLS as a second layer (optional).** Django doesn't set it up. [`ATOMIC_REQUESTS = True`](https://docs.djangoproject.com/en/6.1/topics/db/transactions/#tying-transactions-to-http-requests) wraps each view in a transaction, but middleware and `TemplateResponse` rendering run outside it. So call `select set_config('app.org_id', %s, true)` at the start of the view (a decorator does it), and evaluate querysets inside the view. Connect as a role that doesn't own the tables and lacks `BYPASSRLS`: owners skip policies unless the table has `FORCE ROW LEVEL SECURITY` ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).

**The 5.4 isolation test** with Django's [test client](https://docs.djangoproject.com/en/6.1/topics/testing/tools/#django.test.Client.force_login):

```python
# tasks/tests/test_isolation.py
class TenantIsolationTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        org_a, org_b = Organization.objects.create(name="A"), Organization.objects.create(name="B")
        cls.user_a = get_user_model().objects.create_user("user-a")
        Membership.objects.create(user=cls.user_a, organization=org_a, role="MEMBER")
        cls.task_b = Task.objects.create(organization=org_b, title="B's task")
    def test_member_of_a_cannot_reach_b(self):
        url = reverse("task-detail", args=[self.task_b.pk])
        self.assertEqual(self.client.get(url).status_code, 302)      # anonymous: sent to sign-in
        self.client.force_login(self.user_a)
        self.assertEqual(self.client.get(url).status_code, 404)
        self.assertEqual(self.client.post(url, {"title": "x"}).status_code, 404)
        self.task_b.refresh_from_db(); self.assertEqual(self.task_b.title, "B's task")
```

## Authentication

- **Sessions.** Django stores sessions in the database. [`login()` rotates the session key](https://docs.djangoproject.com/en/6.1/topics/http/sessions/#django.contrib.sessions.backends.base.SessionBase.cycle_key) to stop session fixation, and `logout()` clears the session completely. [Changing the password ends the user's other sessions](https://docs.djangoproject.com/en/6.1/topics/auth/default/#session-invalidation-on-password-change), and `update_session_auth_hash()` keeps the current one signed in.
- **Cookies.** By default [`SESSION_COOKIE_SECURE`](https://docs.djangoproject.com/en/6.1/ref/settings/#session-cookie-secure) and `CSRF_COOKIE_SECURE` are `False`: set both to `True` in production. `HttpOnly` and `SameSite=Lax` are already the defaults, and `SESSION_COOKIE_DOMAIN = None` keeps the cookie host-only. [`SESSION_COOKIE_AGE`](https://docs.djangoproject.com/en/6.1/ref/settings/#session-cookie-age) is two weeks by default, so shorten it to fit your 7.1 policy.
- **Passwords.**
  - [PBKDF2](https://docs.djangoproject.com/en/6.1/topics/auth/passwords/) is the default hasher, at 1,500,000 iterations from 6.1. To use Argon2, install `argon2-cffi` and put `Argon2PasswordHasher` first.
  - Set `MinimumLengthValidator` to `min_length: 12`.
  - `CommonPasswordValidator` checks a bundled list of 20,000 common passwords. That isn't a breached-password list (7.1), so add one.
- **Not in core: MFA, passkeys, throttling.** Django [doesn't throttle sign-in attempts](https://docs.djangoproject.com/en/6.1/topics/security/#additional-security-topics). [django-allauth](https://docs.allauth.org/en/latest/mfa/introduction.html) adds:
  - TOTP, recovery codes and WebAuthn, including passkey sign-in (`MFA_PASSKEY_LOGIN_ENABLED`);
  - [rate limits](https://docs.allauth.org/en/latest/account/rate_limits.html): by default, failed sign-ins are limited to 10 a minute per IP and 5 in 5 minutes per account;
  - [re-authentication](https://docs.allauth.org/en/latest/account/configuration.html) before sensitive actions (`ACCOUNT_REAUTHENTICATION_TIMEOUT`, 300 seconds) and `ACCOUNT_PREVENT_ENUMERATION`, which is on by default.
- **Password reset.** Django's own [`PasswordResetView`](https://docs.djangoproject.com/en/6.1/topics/auth/default/#django.contrib.auth.views.PasswordResetView) shows the same page whether or not the address exists, and sends no email for an unknown one. That's the no-enumeration rule in 7.1.

## Secrets

- **Settings are Python.** Read secrets from the environment or a file (`SECRET_KEY = os.environ["SECRET_KEY"]`), as the [deployment checklist](https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/#secret-key) shows, and never commit them. To rotate `SECRET_KEY`, move the old value into [`SECRET_KEY_FALLBACKS`](https://docs.djangoproject.com/en/6.1/ref/settings/#secret-key-fallbacks) and remove it once old sessions have expired.
- **`DEBUG = False` in production.** The debug page shows settings and request data. Error reports hide settings whose names match [`API|AUTH|TOKEN|KEY|SECRET|PASS|SIGNATURE|HTTP_COOKIE`](https://docs.djangoproject.com/en/6.1/howto/error-reporting/#django.views.debug.SafeExceptionReporterFilter.hidden_settings), but a secret named anything else shows in full.
- **What reaches the browser.** Only what a template prints, or what a JavaScript bundler injects under its own public prefix. Never print a setting into a page.
- **Where secrets live.** Keep them in the host's secret store, with a separate set for each environment (7.4). Run [`manage.py check --deploy`](https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/#run-manage-py-check-deploy) in CI against the production settings.

## CSRF and XSS

- **CSRF.** [`CsrfViewMiddleware`](https://docs.djangoproject.com/en/6.1/ref/csrf/#how-it-works) is on by default. Every POST, PUT, PATCH or DELETE needs the token: `{% csrf_token %}` in forms, or the [`X-CSRFToken` header](https://docs.djangoproject.com/en/6.1/howto/csrf/#using-csrf-protection-with-ajax) from JavaScript. The middleware also checks `Origin` against the host and `CSRF_TRUSTED_ORIGINS`, and over HTTPS it checks the `Referer` strictly when there's no `Origin`.
- **Escape hatches.** [`@csrf_exempt`](https://docs.djangoproject.com/en/6.1/ref/csrf/#django.views.decorators.csrf.csrf_exempt), and broad `CSRF_TRUSTED_ORIGINS` entries. List exact origins only, and verify each webhook's signature instead of relying on the token.
- **XSS.** Templates escape output automatically. These [switch that off](https://docs.djangoproject.com/en/6.1/topics/security/#cross-site-scripting-xss-protection):
  - the [`|safe`](https://docs.djangoproject.com/en/6.1/ref/templates/builtins/#safe) filter and `mark_safe()`;
  - `{% autoescape off %}`;
  - custom filters marked `is_safe`.

  Build HTML in Python with `format_html()`, and pass data to scripts with [`json_script`](https://docs.djangoproject.com/en/6.1/ref/templates/builtins/#json-script) (T-04).
- **CSP (built in since 6.0).** [`ContentSecurityPolicyMiddleware`](https://docs.djangoproject.com/en/6.1/ref/csp/) sends `SECURE_CSP` or `SECURE_CSP_REPORT_ONLY`. With the `csp` context processor, templates get `{{ csp_nonce }}` and, new in 6.1, the `{% csp_nonce_attr %}` tag. In 6.1 the context processor also puts nonces into the admin's and other built-in templates. [`@csp_override({})`](https://docs.djangoproject.com/en/6.1/ref/csp/#django.views.decorators.csp.csp_override) removes the header from a view. Django doesn't collect violation reports, and a page served from cache [reuses its nonce](https://docs.djangoproject.com/en/6.1/howto/csp/):

```python
# settings.py — the 7.4 policy, report-only until the reports are clean
from django.utils.csp import CSP

MIDDLEWARE += ["django.middleware.csp.ContentSecurityPolicyMiddleware"]
SECURE_CSP_REPORT_ONLY = {
    "default-src": [CSP.SELF],
    "script-src": [CSP.SELF, CSP.NONCE, CSP.STRICT_DYNAMIC],
    "style-src": [CSP.SELF, CSP.UNSAFE_INLINE],
    "img-src": [CSP.SELF, "data:", "blob:"], "font-src": [CSP.SELF], "connect-src": [CSP.SELF],
    "frame-ancestors": [CSP.NONE], "base-uri": [CSP.SELF], "form-action": [CSP.SELF],
    "object-src": [CSP.NONE],
}
# and add "django.template.context_processors.csp" to TEMPLATES' context_processors
```

## Fonts and assets

- **Self-host everything.** Put `woff2` files, scripts and the consent module in `static/`, reference them with `{% static %}`, and run [`collectstatic`](https://docs.djangoproject.com/en/6.1/ref/contrib/staticfiles/#collectstatic) at deploy. `ManifestStaticFilesStorage` adds content hashes to file names, so they can be cached for a long time.
- **Bring npm packages in at build time.** If you use `@fontsource/*` or other npm packages, copy their files into `static/` during the build. Don't link a CDN from `base.html`.
- **Check it.** Keep `font-src 'self'` in the CSP, and run the 9.9 test.

## Consent

- **Nothing loads unless a template prints it.** Django renders on the server, so the only scripts are the ones in your templates. Load the 9.7 consent module from `base.html` as a static file with `{% csp_nonce_attr %}`, and load analytics and replay only through `loadWhenConsented()`.
- **The consent POST needs the CSRF token.** Django requires the token even for same-origin requests. Add the `X-CSRFToken` header to the `fetch()` in `saveConsent()`, reading it from the `csrftoken` cookie, which JavaScript can read by default ([`CSRF_COOKIE_HTTPONLY`](https://docs.djangoproject.com/en/6.1/ref/settings/#csrf-cookie-httponly) is `False`).
- **Reading the choice on the server.** Django doesn't encrypt cookies, so `request.COOKIES.get("consent_v1")` reads the browser's choice. Use it only to decide whether to show the banner. Marketing sends check `consent_records` (CR-06).
- **Cookie register (9.8).** List `sessionid`, `csrftoken` and `consent_v1` as strictly necessary.

## Logging

- **Default handlers.** The [default config](https://docs.djangoproject.com/en/6.1/ref/logging/#default-logging-conditions) sends `ERROR` records to `AdminEmailHandler` when `DEBUG` is `False`. If `ADMINS` is set, every server error is emailed. By default, [error reports](https://docs.djangoproject.com/en/6.1/howto/error-reporting/#filtering-sensitive-information) include each frame's local variables and the request's attributes. Remove the `mail_admins` handler, or filter with `@sensitive_variables` and `@sensitive_post_parameters` and a custom `SafeExceptionReporterFilter`.
- **Request and security logs.** `django.request` logs 4xx responses as warnings and 5xx as errors, with the path. `django.security.*` records suspicious requests: keep them. [SQL is logged only when `DEBUG` is `True`](https://docs.djangoproject.com/en/6.1/ref/logging/#django-db-backends).
- **Your own logs.** Configure [`LOGGING`](https://docs.djangoproject.com/en/6.1/topics/logging/) as JSON to stdout. Add a request ID through a middleware, a `contextvars` variable and a logging filter. Log user IDs, never `request.POST`, `request.body` or emails (7.5).
- **Error trackers.** Sentry is a processor (3.6). In the Python SDK, [`include_local_variables`](https://docs.sentry.io/platforms/python/configuration/options/) is on by default, so local variables, which can hold personal data, go with every event. The new `data_collection` option collects user identity and request bodies for any key you leave unset. Turn off what you don't need, explicitly.

## Testing

- **Tools.** [`manage.py test`](https://docs.djangoproject.com/en/6.1/topics/testing/overview/) runs `TestCase`, with each test in a transaction; pytest-django works too. Use `force_login()` to act as a user.
- **Isolation (5.4).** Run the section 1 test on every pull request, on the same database engine as production, so raw SQL and any RLS behave as they will live.
- **Role matrix (7.2).** Loop over the matrix with `self.subTest(role=..., action=...)`, so every cell has a test.
- **CSRF.** The test client [skips CSRF checks](https://docs.djangoproject.com/en/6.1/topics/testing/tools/#overview-and-a-quick-example) unless you build it as `Client(enforce_csrf_checks=True)`. Use one of those for each form.
- **No third-party requests (9.9).** Run the framework's Playwright spec as it is against a staging deploy, or against a local server with `DEBUG = False` and static files served. Note that [`runserver --insecure`](https://docs.djangoproject.com/en/6.1/ref/contrib/staticfiles/#cmdoption-runserver-insecure) doesn't work with `ManifestStaticFilesStorage`. For in-process browser tests, Django offers [`StaticLiveServerTestCase`](https://docs.djangoproject.com/en/6.1/topics/testing/tools/#liveservertestcase).
- **Dependencies.** Run [`pip-audit`](https://github.com/pypa/pip-audit) in CI next to `npm audit` (7.4).

## Deployment

- **Hosting.** Django runs on any WSGI (Gunicorn) or ASGI (Uvicorn, Daphne) host. Choose a UK or EU region for the app, database, backups, logs and error tracker (9.17).
- **Settings to turn on** ([deployment checklist](https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/)):
  - `SECURE_SSL_REDIRECT = True`;
  - [`SECURE_HSTS_SECONDS`](https://docs.djangoproject.com/en/6.1/ref/settings/#secure-hsts-seconds) `= 63072000`, with `SECURE_HSTS_INCLUDE_SUBDOMAINS` and `SECURE_HSTS_PRELOAD`;
  - an exact `ALLOWED_HOSTS`;
  - [`SECURE_PROXY_SSL_HEADER`](https://docs.djangoproject.com/en/6.1/ref/settings/#secure-proxy-ssl-header), only behind a proxy that sets or strips that header.
- **Headers already on.** [`SecurityMiddleware`](https://docs.djangoproject.com/en/6.1/ref/middleware/#module-django.middleware.security) sends `nosniff`, `Referrer-Policy: same-origin` and `Cross-Origin-Opener-Policy: same-origin`, and `X-Frame-Options: DENY` comes from the clickjacking middleware. Django has no `Permissions-Policy` setting: add that header at the proxy or in a small middleware.
- **Deploy from CI (12.1).** Run `collectstatic` and `migrate` from CI after approval, never from a laptop. Keep backups as 5.7 describes.

## Limits

- **Isolation rests on your discipline.** Core Django has no row-level isolation and no object permissions. One view that uses `Task.objects.get(pk=...)` leaks across tenants (T-01), so add an isolation case for every new model.
- **Versions** ([download page](https://www.djangoproject.com/download/)).
  - 6.1 gets security fixes until December 2027, 6.0 until April 2027, and 5.2 LTS until April 2028. 4.2 LTS ended on 7 April 2026.
  - Django 6.2 LTS (April 2027) is the last version numbered that way. Feature releases then become [Django 2028, 2029 and so on](https://docs.djangoproject.com/en/6.1/releases/6.1/#adopting-calendar-versioning), each January, each with three years of support.
- **2026 security releases** came almost every month ([archive](https://docs.djangoproject.com/en/6.1/releases/security/)); the latest, on 3 November, were 6.1.3, 6.0.10 and 5.2.19. Repeated themes:
  - cached responses exposing private data through `Vary` and `Set-Cookie` handling;
  - privilege abuse in the admin (`list_editable`, generic inlines);
  - password hashes shown to view-only admin users;
  - SQL injection through column aliases and `FilteredRelation`.

  Patch within the 7.6 windows.
- **Caching signed-in pages.** Don't put them behind the per-site cache. Mark them `@never_cache` or `cache_control(private=True)`.
- **Background tasks run without a request.** That includes the [tasks framework](https://docs.djangoproject.com/en/6.1/topics/tasks/), new in 6.0, as well as Celery. Pass the tenant ID in, and query through the same `visible_to()` path.

## Sources

- Django 6.1 docs: [6.1 release notes](https://docs.djangoproject.com/en/6.1/releases/6.1/), [6.0 release notes](https://docs.djangoproject.com/en/6.1/releases/6.0/), [security archive](https://docs.djangoproject.com/en/6.1/releases/security/), [authentication](https://docs.djangoproject.com/en/6.1/topics/auth/), [using authentication](https://docs.djangoproject.com/en/6.1/topics/auth/default/), [passwords](https://docs.djangoproject.com/en/6.1/topics/auth/passwords/), [sessions](https://docs.djangoproject.com/en/6.1/topics/http/sessions/), [managers](https://docs.djangoproject.com/en/6.1/topics/db/managers/), [transactions](https://docs.djangoproject.com/en/6.1/topics/db/transactions/), [middleware](https://docs.djangoproject.com/en/6.1/ref/middleware/), [settings](https://docs.djangoproject.com/en/6.1/ref/settings/), [admin](https://docs.djangoproject.com/en/6.1/ref/contrib/admin/), [CSRF](https://docs.djangoproject.com/en/6.1/ref/csrf/), [CSRF how-to](https://docs.djangoproject.com/en/6.1/howto/csrf/), [security](https://docs.djangoproject.com/en/6.1/topics/security/), [CSP](https://docs.djangoproject.com/en/6.1/ref/csp/), [CSP how-to](https://docs.djangoproject.com/en/6.1/howto/csp/), [built-in template tags and filters](https://docs.djangoproject.com/en/6.1/ref/templates/builtins/), [static files](https://docs.djangoproject.com/en/6.1/ref/contrib/staticfiles/), [logging reference](https://docs.djangoproject.com/en/6.1/ref/logging/), [logging](https://docs.djangoproject.com/en/6.1/topics/logging/), [error reporting](https://docs.djangoproject.com/en/6.1/howto/error-reporting/), [testing](https://docs.djangoproject.com/en/6.1/topics/testing/overview/), [testing tools](https://docs.djangoproject.com/en/6.1/topics/testing/tools/), [tasks](https://docs.djangoproject.com/en/6.1/topics/tasks/), [deployment checklist](https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/), [supported versions](https://www.djangoproject.com/download/)
- Packages: [Django REST framework permissions](https://www.django-rest-framework.org/api-guide/permissions/), django-allauth [MFA](https://docs.allauth.org/en/latest/mfa/introduction.html), [rate limits](https://docs.allauth.org/en/latest/account/rate_limits.html) and [configuration](https://docs.allauth.org/en/latest/account/configuration.html), [pip-audit](https://github.com/pypa/pip-audit)
- PostgreSQL: [row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html); Sentry: [Python options](https://docs.sentry.io/platforms/python/configuration/options/)
- OWASP Cheat Sheets (linked, not copied): [Django Security](https://cheatsheetseries.owasp.org/cheatsheets/Django_Security_Cheat_Sheet.html), [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
