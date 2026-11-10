# FastAPI

> **Group:** Backend · **Covers:** FastAPI 0.162 on Starlette 1.x, Pydantic 2 and Python 3.10+, usually with SQLAlchemy 2 or SQLModel · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

FastAPI gives you routing, validation and [dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/). It has no users, sessions, ORM or roles. You enforce access yourself, in two places:

- **Dependencies at the edge.**
  - A `get_current_user` dependency resolves the caller.
  - Attach it to every router with [`APIRouter(dependencies=[...])`](https://fastapi.tiangolo.com/tutorial/bigger-applications/#add-some-custom-tags-responses-and-dependencies), or to the whole app with [global dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/global-dependencies/), so a new route is closed by default.
  - Route-specific rules (`require_role("ADMIN")`, or [OAuth2 scopes](https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/) through `Security()`) are your `assertCan()` (7.2).
- **Scoping in the data layer.** Build every query from the signed-in user's memberships, in one module, and never take `organization_id` from the request body (T-03). SQLAlchemy can add a tenant filter to every ORM query through [`do_orm_execute` and `with_loader_criteria`](https://docs.sqlalchemy.org/en/21/orm/session_events.html#adding-global-where-on-criteria). It doesn't touch `text()` or Core statements you write by hand, so review those. The docs' recipe filters only SELECTs (`is_select`), but the same hook receives ORM `update()` and `delete()` statements, which [accept `with_loader_criteria` too](https://docs.sqlalchemy.org/en/21/orm/queryguide/dml.html): cover `is_update` and `is_delete` as well, or scope those statements by hand.

```python
# app/tasks.py — tenancy comes from the signed-in user, never from the request
def visible_tasks(user: User):
    return (select(Task).join(Membership, Membership.organization_id == Task.organization_id)
            .where(Membership.user_id == user.id))

@router.get("/tasks/{task_id}")
def read_task(task_id: int, user: CurrentUser, session: SessionDep) -> TaskOut:
    task = session.scalars(visible_tasks(user).where(Task.id == task_id)).one_or_none()
    if task is None:
        raise HTTPException(status_code=404)      # another tenant's row looks like no row
    return task
```

**Postgres RLS as a second layer (optional).** Open the session in a [dependency with `yield`](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/), start a transaction, and run `select set_config('app.org_id', :org, true)` first. The setting [lasts only for the current transaction](https://www.postgresql.org/docs/current/functions-admin.html), so set it again after any `commit()`. Connect as a role that doesn't own the tables and lacks `BYPASSRLS` ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).

**The 5.4 isolation test** with pytest and [`TestClient`](https://fastapi.tiangolo.com/tutorial/testing/#using-testclient):

```python
# tests/test_isolation.py — fixtures seed two organisations (5.5)
def test_member_of_a_cannot_reach_b(db, user_a, task_a, task_b):
    client = TestClient(app)
    assert client.get(f"/tasks/{task_b.id}").status_code == 401                 # anonymous
    app.dependency_overrides[get_current_user] = lambda: user_a
    try:
        assert client.get(f"/tasks/{task_a.id}").status_code == 200             # own task: the control
        assert client.get(f"/tasks/{task_b.id}").status_code == 404
        assert client.patch(f"/tasks/{task_b.id}", json={"title": "x"}).status_code == 404
        client.post("/tasks", json={"organization_id": task_b.organization_id, "title": "x"})  # write into B
        org_b_tasks = select(func.count(Task.id)).where(Task.organization_id == task_b.organization_id)
        assert db.scalar(org_b_tasks) == 1
    finally:
        app.dependency_overrides.clear()
```

[`dependency_overrides`](https://fastapi.tiangolo.com/advanced/testing-dependencies/#use-the-app-dependency-overrides-attribute) replaces authentication, so also run one test through the real sign-in.

## Authentication

- **What FastAPI provides.** [Security utilities](https://fastapi.tiangolo.com/tutorial/security/) such as `OAuth2PasswordBearer`, `HTTPBearer` and `APIKeyHeader`, and a [JWT tutorial](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/). The tutorial now uses PyJWT, and pwdlib with Argon2 for password hashes. There's no user store, sign-up flow, MFA, passkeys, account lockout or rate limiting.
- **For a product, prefer an OIDC identity provider.** Keycloak, Entra ID, Auth0 or Cognito, for example, give you MFA, passkeys, lockout and recovery (7.1). Validate their tokens in `get_current_user`, and add the provider to the processor register (3.6). Building your own means [pyotp](https://pypi.org/project/pyotp/) for TOTP, [py_webauthn](https://pypi.org/project/webauthn/) for passkeys, and your own rate limits.
- **Tokens in the browser.** A bearer token kept in `localStorage` can be stolen by any XSS. For a browser front end, prefer an HttpOnly, `Secure`, `SameSite=Lax` session cookie set by your API, and then add the CSRF check in the next section. The JWT tutorial's tokens last 30 minutes and can't be revoked before they expire, so for sign-out (7.1) keep a server-side session or a deny list.
- **Starlette's `SessionMiddleware`** is a [signed cookie](https://starlette.dev/middleware/#sessionmiddleware).
  - The browser can read its contents, so never put personal data in it.
  - It lasts two weeks by default.
  - `https_only` defaults to `False`, so set it to `True`.
  - Nothing is stored on the server, so you can't revoke a single session.
- **Status codes (changed in 0.122.0).** Since November 2025 the built-in security classes return [401 with `WWW-Authenticate`](https://fastapi.tiangolo.com/how-to/authentication-error-status-code/), not 403. Your front end should treat 401 as S8 and 403 as S7.
- **Rate limits.** Add them in a dependency backed by Redis, or at the gateway, keyed per account and per IP (7.1).

## Secrets

- **Settings.** Use [Pydantic Settings](https://fastapi.tiangolo.com/advanced/settings/#pydantic-settings) (`BaseSettings`) to read environment variables or a `.env` file. Don't commit `.env`, and use [`SecretStr`](https://pydantic.dev/docs/validation/latest/api/pydantic/types/) so a secret doesn't appear when settings are printed.
- **The tutorial's key.** The JWT tutorial puts a literal `SECRET_KEY` in the code and [warns you not to reuse it](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/#handle-jwt-tokens). Agents copy it: search the code for it. Generate your own per environment and keep it in the host's secret store (7.4).
- **What reaches the client.** An API sends only what you return. Declare a [return type or `response_model`](https://fastapi.tiangolo.com/tutorial/response-model/#return-type-and-data-filtering) so fields like `hashed_password` are filtered out of responses.
- **[`debug=True`](https://fastapi.tiangolo.com/reference/fastapi/)** returns tracebacks to the client on server errors. Keep it off outside development.

## CSRF and XSS

- **No CSRF protection is built in.** A bearer token in the `Authorization` header isn't sent cross-site by browsers, so CSRF doesn't apply to it. Cookie authentication does need protection. Since 0.132.0, FastAPI parses a JSON body [only with a JSON `Content-Type`](https://fastapi.tiangolo.com/advanced/strict-content-type/), which blocks one cross-site trick. `strict_content_type=False` switches that off, and HTML form posts (`Form()`) are never covered. With cookies, add a check like the one below, which follows OWASP's [Fetch Metadata guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html):

```python
# app/main.py — block cross-site writes when sessions live in cookies
ALLOWED_ORIGINS = {"https://api.example.co.uk", "https://app.example.co.uk"}   # exact origins only
def write_allowed(site: str | None, origin: str | None) -> bool:
    if site not in (None, "same-origin", "same-site"):
        return False                                    # cross-site, or a value we don't expect
    if site == "same-site" or origin:
        return origin in ALLOWED_ORIGINS                # a sibling subdomain must be on the list
    return True                                         # a client that sends neither header

@app.middleware("http")
async def block_cross_site_writes(request: Request, call_next):
    if request.method not in {"GET", "HEAD", "OPTIONS"} and not write_allowed(
            request.headers.get("sec-fetch-site"), request.headers.get("origin")):
        return JSONResponse({"detail": "Cross-site request blocked"}, status_code=403)
    return await call_next(request)
```

A front end on its own subdomain (`app.` calling `api.`) sends `Sec-Fetch-Site: same-site`, so the check accepts `same-site` only from an origin on the list. List the API's own origin too, and never a whole domain.

- **CORS.** List exact origins in [`CORSMiddleware`](https://fastapi.tiangolo.com/tutorial/cors/). With `allow_credentials=True`, none of origins, methods or headers may be `["*"]`.
- **XSS.** JSON responses are safe to render as text, but anything returned through `HTMLResponse` is sent as you wrote it. Starlette's `Jinja2Templates` uses [`select_autoescape()`](https://jinja.palletsprojects.com/en/stable/api/#autoescaping), which escapes only `.html`, `.htm` and `.xml` templates, so a template named `page.jinja` isn't escaped. Jinja's `|safe` and `Markup()` switch escaping off (T-04).
- **CSP.** FastAPI sends none. For JSON-only APIs, send `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`. For pages, generate a nonce per request in a middleware, put it on `request.state`, and pass it to templates. Use the 7.4 policy, report-only first.

## Fonts and assets

- **The docs pages call third parties.** FastAPI's built-in [`/docs`](https://fastapi.tiangolo.com/how-to/custom-docs-ui-assets/) loads Swagger UI from `cdn.jsdelivr.net` and a favicon from `fastapi.tiangolo.com`, and `/redoc` also loads Google Fonts: `with_google_fonts` defaults to `True` ([source](https://github.com/fastapi/fastapi/blob/master/fastapi/openapi/docs.py)).
  - Either turn them off in production (`docs_url=None, redoc_url=None`, or [`openapi_url=None`](https://fastapi.tiangolo.com/how-to/conditional-openapi/) to drop the schema too),
  - or [self-host the files](https://fastapi.tiangolo.com/how-to/custom-docs-ui-assets/#self-hosting-javascript-and-css-for-docs) with `StaticFiles` and call `get_redoc_html(..., with_google_fonts=False)`.
- **Pages you serve.** Put `woff2` files and scripts under a [`StaticFiles`](https://fastapi.tiangolo.com/tutorial/static-files/) mount, with no CDN links. A separate front end follows its own stack profile.
- **Check it.** Run the 9.9 test against every HTML page the API serves, `/docs` included, and send `font-src 'self'`.

## Consent

- **Usually the front end's job.** Most FastAPI apps serve a separate front end, and the 9.7 consent module and loader live there: see that front end's profile.
- **FastAPI's part.**
  - A `POST /privacy/consent` route, validated by a Pydantic model, that appends to `consent_records` (CR-05). The 9.7 `saveConsent()` posts to `/api/privacy/consent`, so change one URL to match the other.
  - The server-side check before any marketing send (CR-06).
  - Behind cookie authentication, the CSRF check above.
- **If FastAPI renders pages** with Jinja2, the rules for server-rendered stacks apply. Ship no vendor tags in the base template, load the consent module as a static file with the request's nonce, and list `consent_v1` and your session cookie as strictly necessary (9.8).

## Logging

- **Access logs.** [Uvicorn's access log](https://uvicorn.dev/settings/#logging) records the client IP and the full request line, query string included ([format](https://github.com/Kludex/uvicorn/blob/master/uvicorn/config.py)). Keep tokens, emails and search terms out of URLs, or switch the access log off (`--no-access-log`) and log a cleaned line from a middleware.
- **Validation errors.** [`RequestValidationError` carries the body it rejected](https://fastapi.tiangolo.com/tutorial/handling-errors/#use-the-requestvalidationerror-body), and the docs suggest logging it while you develop. Don't log `exc.body` or `exc.errors()` inputs in production: they hold whatever the user typed.
- **Structured logs.** Use the standard `logging` module with a JSON formatter. Put a request ID into a `contextvars` variable in middleware and add it with a logging filter. Log user IDs only (7.5).
- **Error trackers.** Sentry is a processor (3.6). The Python SDK sends [local variables by default](https://docs.sentry.io/platforms/python/configuration/options/) (`include_local_variables`). Passing the new `data_collection` dict opts you into its permissive defaults: every key you leave out collects (user identity and request bodies among them), `send_default_pii` is ignored and your `event_scrubber` no longer runs. Either set every key, or leave `data_collection` out and keep `send_default_pii` off.

## Testing

- **Tools.** Use pytest with `TestClient` (built on HTTPX). For async tests, use `httpx.AsyncClient` with `ASGITransport` ([async tests](https://fastapi.tiangolo.com/advanced/async-tests/)). Override the database dependency to point at a test database ([testing a database](https://fastapi.tiangolo.com/how-to/testing-database/)).
- **Isolation (5.4).** Run the section 1 test on every pull request, against Postgres (or whatever production runs), with real migrations applied.
- **Role matrix (7.2).** Use `pytest.mark.parametrize` over role, action and expected status.
- **Cookies.** If you use cookie sessions, test that a POST with `Origin: https://evil.example` gets a 403.
- **No third-party requests (9.9).** Run the framework's Playwright spec as it is against the front end, and against `/docs` and `/redoc` if they're public.
- **Dependencies.** Run [`pip-audit`](https://github.com/pypa/pip-audit) in CI.

## Deployment

- **Run it.** Use [`fastapi run`](https://fastapi.tiangolo.com/deployment/manually/) (Uvicorn) or the [Docker guide](https://fastapi.tiangolo.com/deployment/docker/). Host the API, database, logs and backups in a UK or EU region (9.17).
- **Behind a proxy.** Set [`--forwarded-allow-ips`](https://fastapi.tiangolo.com/advanced/behind-a-proxy/) to the proxy's address. `"*"` trusts every client's `X-Forwarded-*` headers, which breaks per-IP limits and HTTPS detection.
- **Middleware.** Add [`TrustedHostMiddleware`](https://fastapi.tiangolo.com/advanced/middleware/#trustedhostmiddleware) with your exact hosts and, if TLS isn't redirected upstream, `HTTPSRedirectMiddleware`. A Host check also blunts the 2026 Starlette `Host`-header advisory in Limits.
- **Headers.** FastAPI sets no security headers: add HSTS, `nosniff`, `Referrer-Policy`, `Permissions-Policy` and the CSP (7.4) in a middleware or at the proxy.
- **Migrations and backups.** Run Alembic migrations from CI after approval (12.1), never at app start-up from every worker. Keep backups as 5.7 describes.

## Limits

- **No safety net.** FastAPI has no authentication, sessions, CSRF protection, admin or row-level isolation built in. Every rule in 7.1 and 7.2 is code you write and test.
- **Pin exact versions.** FastAPI is still 0.x, and [each version may break things](https://fastapi.tiangolo.com/deployment/versions/#pin-your-fastapi-version): October 2026 alone brought several minor releases marked "Breaking Changes" ([release notes](https://fastapi.tiangolo.com/release-notes/)). Pin exact versions and read the notes before upgrading. Recent drops: `pydantic.v1` (0.128.0, December 2025) and Python 3.9 (0.129.0, February 2026).
- **Pin Starlette too.** FastAPI accepts `starlette>=0.46.0`, so an old lockfile can keep an unpatched Starlette. Five advisories published in June 2026 were fixed in releases from 1.0.1 (21 May) to 1.3.1 (12 June): use 1.3.1 or later (1.10.0 when checked). Among them:
  - a malformed `Host` header could make `request.url.path` differ from the routed path and bypass path-based checks in middleware ([GHSA-86qp-5c8j-p5mr](https://github.com/Kludex/starlette/security/advisories/GHSA-86qp-5c8j-p5mr));
  - `request.url.hostname` could be poisoned ([GHSA-jp82-jpqv-5vv3](https://github.com/Kludex/starlette/security/advisories/GHSA-jp82-jpqv-5vv3));
  - `request.form()` ignored `max_fields` and `max_part_size` for URL-encoded bodies, so one unauthenticated request could exhaust memory (CVE-2026-54283, [GHSA-82w8-qh3p-5jfq](https://github.com/Kludex/starlette/security/advisories/GHSA-82w8-qh3p-5jfq), High, fixed only in 1.3.1);
  - `HTTPEndpoint` dispatched arbitrary HTTP methods to its attributes ([GHSA-x746-7m8f-x49c](https://github.com/Kludex/starlette/security/advisories/GHSA-x746-7m8f-x49c)), and `StaticFiles` on Windows followed UNC paths ([GHSA-wqp7-x3pw-xc5r](https://github.com/Kludex/starlette/security/advisories/GHSA-wqp7-x3pw-xc5r)), both fixed in 1.1.0.

  Authorise on the route and its dependencies, not on `request.url` in middleware.
- **Multipart parsing.** python-multipart, which parses forms and uploads, had several 2026 denial-of-service and parameter-smuggling fixes, and in January an arbitrary file write in a non-default configuration ([GHSA-wp53-j4wj-2cfg](https://github.com/Kludex/python-multipart/security/advisories/GHSA-wp53-j4wj-2cfg)). Use 0.0.31 or later (0.0.33 when checked): 0.0.30 still reads a whole body into memory when `Content-Length` is negative (CVE-2026-53540, [GHSA-v9pg-7xvm-68hf](https://github.com/Kludex/python-multipart/security/advisories/GHSA-v9pg-7xvm-68hf)) ([advisories](https://github.com/Kludex/python-multipart/security/advisories)).

## Sources

- FastAPI docs: [dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/), [global dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/global-dependencies/), [dependencies with yield](https://fastapi.tiangolo.com/tutorial/dependencies/dependencies-with-yield/), [bigger applications](https://fastapi.tiangolo.com/tutorial/bigger-applications/), [security](https://fastapi.tiangolo.com/tutorial/security/), [OAuth2 with JWT](https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/), [OAuth2 scopes](https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/), [authentication error status codes](https://fastapi.tiangolo.com/how-to/authentication-error-status-code/), [settings](https://fastapi.tiangolo.com/advanced/settings/), [strict Content-Type](https://fastapi.tiangolo.com/advanced/strict-content-type/), [CORS](https://fastapi.tiangolo.com/tutorial/cors/), [handling errors](https://fastapi.tiangolo.com/tutorial/handling-errors/), [static files](https://fastapi.tiangolo.com/tutorial/static-files/), [custom docs UI assets](https://fastapi.tiangolo.com/how-to/custom-docs-ui-assets/), [conditional OpenAPI](https://fastapi.tiangolo.com/how-to/conditional-openapi/), [testing](https://fastapi.tiangolo.com/tutorial/testing/), [testing dependencies](https://fastapi.tiangolo.com/advanced/testing-dependencies/), [async tests](https://fastapi.tiangolo.com/advanced/async-tests/), [testing a database](https://fastapi.tiangolo.com/how-to/testing-database/), [behind a proxy](https://fastapi.tiangolo.com/advanced/behind-a-proxy/), [advanced middleware](https://fastapi.tiangolo.com/advanced/middleware/), [running manually](https://fastapi.tiangolo.com/deployment/manually/), [Docker](https://fastapi.tiangolo.com/deployment/docker/), [versions](https://fastapi.tiangolo.com/deployment/versions/), [release notes](https://fastapi.tiangolo.com/release-notes/); source: [`fastapi/openapi/docs.py`](https://github.com/fastapi/fastapi/blob/master/fastapi/openapi/docs.py)
- Starlette: [middleware](https://starlette.dev/middleware/), [security advisories](https://github.com/Kludex/starlette/security/advisories); Uvicorn: [settings](https://uvicorn.dev/settings/), [`config.py`](https://github.com/Kludex/uvicorn/blob/master/uvicorn/config.py); python-multipart: [advisories](https://github.com/Kludex/python-multipart/security/advisories)
- Libraries: [SQLAlchemy 2.1 session events](https://docs.sqlalchemy.org/en/21/orm/session_events.html) and [ORM UPDATE and DELETE](https://docs.sqlalchemy.org/en/21/orm/queryguide/dml.html), [Jinja API](https://jinja.palletsprojects.com/en/stable/api/), [pyotp](https://pypi.org/project/pyotp/), [py_webauthn](https://pypi.org/project/webauthn/), [pip-audit](https://github.com/pypa/pip-audit)
- PostgreSQL: [row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [`set_config`](https://www.postgresql.org/docs/current/functions-admin.html); Sentry: [Python options](https://docs.sentry.io/platforms/python/configuration/options/)
- OWASP Cheat Sheets (linked, not copied): [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html), [REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
