# Spring Boot

> **Group:** Backend · **Covers:** Spring Boot 4.1 (4.1.2) with Spring Security 7.1, Spring Framework 7 and Hibernate 7.4 on Java 17+ · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

Spring Security decides who may call what. Your data layer must still decide which rows they see. Enforce access in three places:

- **Requests.** In [`authorizeHttpRequests`](https://docs.spring.io/spring-security/reference/7.1/servlet/authorization/authorize-http-requests.html), make every rule explicit and end with `anyRequest().denyAll()` (or `.authenticated()`), so a new endpoint is closed by default.
- **Methods.** Add [`@EnableMethodSecurity`](https://docs.spring.io/spring-security/reference/7.1/servlet/authorization/method-security.html#activate-method-security), and use `@PreAuthorize("@access.can(authentication, 'task.update')")` on service methods: a bean that is your `assertCan()` (7.2). Two limits:
  - Spring AOP [doesn't intercept self-invocation](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html#aop-understanding-aop-proxies), so a call from inside the same class skips the check.
  - Until the [September 2025 fixes](https://spring.io/security/cve-2025-41248), annotations on methods of generic supertypes could be missed.
- **Rows.** Look every record up with the caller's organisation (`findByIdAndOrganizationId`). Or let Hibernate add the tenant to every query with [`@TenantId`](https://docs.hibernate.org/orm/7.4/userguide/html_single/#multitenacy-discriminator) and a `CurrentTenantIdentifierResolver` fed from the `SecurityContext`. Native queries and `JdbcTemplate` skip both, so review them.
- **Spring Data REST publishes repositories.** With `spring-boot-starter-data-rest` on the classpath, `spring.data.rest.detection-strategy` is `default`, which [exports every public repository](https://docs.spring.io/spring-data/rest/reference/introduction/getting-started.html), with CRUD endpoints and its query methods [under `/search`](https://docs.spring.io/spring-data/rest/reference/customizing/configuring-the-rest-url-path.html), past your controllers. A public `TaskRepository` would publish `findByIdAndOrganizationId` as an endpoint where the caller picks the organisation. Set `detection-strategy=annotated` so only repositories annotated `@RepositoryRestResource` are published (and `exported = false` hides one), hide query methods with `@RestResource(exported = false)`, and put whatever you do publish behind `authorizeHttpRequests` and method security.

```java
// TaskController.java — tenancy from the authenticated principal, never from the request body
interface TaskRepository extends JpaRepository<Task, Long> {
  Optional<Task> findByIdAndOrganizationId(Long id, Long organizationId);
}

@PatchMapping("/tasks/{id}")
@PreAuthorize("@access.can(authentication, 'task.update')")
TaskView rename(@PathVariable Long id, @RequestBody RenameTask body, @AuthenticationPrincipal Member me) {
  Task task = tasks.findByIdAndOrganizationId(id, me.organizationId())
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));   // other tenants: 404
  task.setTitle(body.title());                         // RenameTask has no organizationId field
  return TaskView.of(tasks.save(task));
}
```

**Postgres RLS as a second layer (optional).** Spring doesn't set it up. In each `@Transactional` unit of work, run `select set_config('app.org_id', ?, true)` first. Connect as a role that doesn't own the tables and lacks `BYPASSRLS` ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).

**The 5.4 isolation test**, with [`spring-security-test`](https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/authentication.html) and MockMvc, against Postgres from Testcontainers:

```java
@SpringBootTest @AutoConfigureMockMvc @Transactional class TenantIsolationTest {
  @Autowired MockMvc mvc; @Autowired JdbcTemplate jdbc; @Autowired Fixtures fx;   // two organisations
  @Test void memberOfACannotReachB() throws Exception {
    long taskB = fx.taskInOrgB(), orgB = fx.orgB(); var userA = user(fx.memberOfA());   // a Member, see below
    mvc.perform(get("/tasks/{id}", taskB)).andExpect(status().isUnauthorized());   // or a redirect to /login
    mvc.perform(get("/tasks/{id}", fx.taskInOrgA()).with(userA)).andExpect(status().isOk());   // the control
    mvc.perform(get("/tasks/{id}", taskB).with(userA)).andExpect(status().isNotFound());
    mvc.perform(patch("/tasks/{id}", taskB).with(userA).with(csrf())
        .contentType(APPLICATION_JSON).content("{\"title\":\"x\"}")).andExpect(status().isNotFound());
    mvc.perform(post("/tasks").with(userA).with(csrf())                          // write into org B
        .contentType(APPLICATION_JSON).content("{\"title\":\"x\",\"organizationId\":" + orgB + "}"));
    assertThat(jdbc.queryForList("select title from task where organization_id = ?", String.class, orgB))
        .containsExactly("B's task");                                      // unchanged, nothing added
  }
}
```

Pass `user(...)` your `Member` object, which must implement `UserDetails` ([test support](https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/authentication.html)). Given a username instead, it builds a plain `User`, so `@AuthenticationPrincipal Member me` [resolves to `null`](https://docs.spring.io/spring-security/reference/7.1/servlet/integrations/mvc.html) and the request fails on `me.organizationId()`, not on the check you're testing.

## Authentication

- **The default user.** With Spring Security on the classpath and no configuration of your own, Boot secures everything with [one in-memory `user` and a random password printed in the log at WARN level](https://docs.spring.io/spring-boot/reference/web/spring-security.html). That's for development only: define your own `UserDetailsService` or OAuth2/OIDC login, and make sure no generated password reaches production logs.
- **Sessions.** Spring Security [changes the session ID at sign-in](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/session-management.html#ns-session-fixation) to stop fixation. Boot's [cookie properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html) leave `server.servlet.session.cookie.secure` and `same-site` unset: set them to `true` and `lax`. The session lasts 30 minutes by default (`server.servlet.session.timeout`).
- **Passwords.** The [`DelegatingPasswordEncoder`](https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-password-storage-dpe) encodes new passwords with bcrypt (`{bcrypt}`), and Argon2 is available. Add [`HaveIBeenPwnedRestApiPasswordChecker`](https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html#authentication-compromised-password-check) for the breached-password check (7.1). It sends only a hash prefix, but it's still a server-side call to a third party, so list it in 3.6.
- **MFA (new in 7.0).** [`@EnableMultiFactorAuthentication`](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/mfa.html) requires a second factor, such as a one-time token or WebAuthn, before an authorisation passes. Its [valid-duration rules](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/mfa.html#valid-duration) ("password within the last 30 minutes") cover 7.1's re-authentication before sensitive actions.
- **Passkeys.** [`.webAuthn()`](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passkeys.html) needs `rpId` and `allowedOrigins`. It [stores credentials in memory by default](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passkeys.html#passkeys-configuration-persistence), so they're lost at restart: configure the JDBC repositories.
  - [CVE-2026-47841](https://spring.io/security/cve-2026-47841) (fixed in 7.1.1) let user verification be skipped with distributed session stores when `userVerification` is `REQUIRED`.
- **Not built in: rate limiting and lockout.** Add per-account and per-IP limits in a filter, or at the gateway (7.1). Log `AuthenticationFailure*` events through the `AuthenticationEventPublisher`.

## Secrets

- **Configuration.** Boot reads `application.properties` or YAML, environment variables, and imported config trees (`spring.config.import=configtree:/run/secrets/`) for mounted secrets ([externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html)). Commit no secrets to `application*.properties`.
- **Actuator.** Only `health` is [exposed over HTTP by default](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.exposing), and `/actuator/env` [masks values](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html#actuator.endpoints.sanitization) unless `show-values` changes. Never expose `env`, `configprops` or `heapdump` publicly: a heap dump holds every secret in memory.
- **Error responses.** Spring Boot 4 renamed the error properties to `spring.web.error.*`. `include-stacktrace` and `include-message` default to `never`: keep them that way.
- **Where secrets live.** Keep them in the platform's secret store or a vault, with a separate set for each environment (7.4). Nothing reaches the browser unless a template or API prints it.

## CSRF and XSS

- **CSRF.** [CSRF protection is on by default](https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html) for unsafe methods, with a BREACH-masked token.
  - Server-rendered forms get it automatically through Thymeleaf.
  - A single-page app uses [`csrf((csrf) -> csrf.spa())`](https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html#csrf-integration-javascript-spa), which keeps the token in an `XSRF-TOKEN` cookie that JavaScript can read.
  - Logout is a POST that needs the token.
- **Escape hatches.** `csrf.disable()`, and [`ignoringRequestMatchers(...)`](https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html#disable-csrf). Use them only for token-authenticated APIs that browsers never reach with cookies.
- **XSS.** Thymeleaf's `th:text` escapes output; [`th:utext`](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html#unescaped-text) doesn't. Jackson writes JSON, so the front end must not inject it as HTML (T-04).
- **Headers.** The [default headers](https://docs.spring.io/spring-security/reference/7.1/features/exploits/headers.html#headers-default) are `nosniff`, `X-Frame-Options: DENY`, cache control, and HSTS (one year, `includeSubDomains`). HSTS is [sent only on HTTPS requests](https://docs.spring.io/spring-security/reference/7.1/features/exploits/headers.html#headers-hsts), so behind a TLS-terminating proxy it needs the forwarded-header setting under Deployment.
- **CSP.** There's no CSP, `Referrer-Policy` or `Permissions-Policy` until you add them, and Spring Security has no nonce generator. Add a filter that makes a nonce per request, stores it as a request attribute (Thymeleaf reads [request attributes as variables](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html)), and writes the 7.4 policy, report-only first. Add `upgrade-insecure-requests` when you enforce (report-only ignores it). Set the other two headers in the filter chain with `.headers(h -> h.referrerPolicy(...).permissionsPolicyHeader(...))`.

```java
// CspNonceFilter.java — the 7.4 policy, report-only until the reports are clean
@Component class CspNonceFilter extends OncePerRequestFilter {
  private final SecureRandom random = new SecureRandom();
  @Override protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
      throws ServletException, IOException {
    byte[] bytes = new byte[16]; random.nextBytes(bytes);
    String nonce = Base64.getEncoder().encodeToString(bytes);
    req.setAttribute("cspNonce", nonce);                          // in Thymeleaf: th:nonce="${cspNonce}"
    res.setHeader("Content-Security-Policy-Report-Only", "default-src 'self'; script-src 'self' 'nonce-"
        + nonce + "' 'strict-dynamic'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
        + "font-src 'self'; connect-src 'self'; frame-src 'none'; frame-ancestors 'none'; base-uri 'self'; "
        + "form-action 'self'; object-src 'none'");
    chain.doFilter(req, res);
  }
}
```

## Fonts and assets

- **Static resources.** Boot serves `src/main/resources/static` from your own domain ([static content](https://docs.spring.io/spring-boot/reference/web/servlet.html#web.servlet.spring-mvc.static-content)). Put `woff2` files there, or use WebJars, which are also served by your app.
- **Templates.** No CDN `<link>` or `<script>` tags in Thymeleaf layouts. A separate front end follows its own stack profile.
- **Check it.** Run the 9.9 test, and keep `font-src 'self'` in the CSP.

## Consent

- **Nothing loads unless a template prints it.** Thymeleaf pages render on the server. Load the 9.7 consent module as a static file with the request's nonce, and load analytics only through `loadWhenConsented()`.
- **The consent POST needs the CSRF token.** Send it from `${_csrf.token}` in a meta tag, or from the `XSRF-TOKEN` cookie when you use `csrf.spa()`. A `@PostMapping("/privacy/consent")` validates the body and appends to `consent_records` (CR-05). The 9.7 `saveConsent()` posts to `/api/privacy/consent`, so change one URL to match the other. Marketing sends check that table, not the cookie (CR-06).
- **Cookie register (9.8).** List `JSESSIONID`, `XSRF-TOKEN` (if used) and `consent_v1` as strictly necessary.

## Logging

- **Structured logs.** Logback is the default. Boot can write [structured logs](https://docs.spring.io/spring-boot/reference/features/logging.html#features.logging.structured) (`logging.structured.format.console=ecs` or `logstash`). With Micrometer Tracing, the [trace and span IDs](https://docs.spring.io/spring-boot/reference/actuator/tracing.html#actuator.micrometer-tracing.logging) go into each line: your correlation ID.
- **What not to log.** Don't log request bodies, headers or `Authentication` objects. Log the user ID from the principal, not the username or email (7.5).
- **Audit events.** Spring Security publishes authentication success and failure events. Record them in `audit_logs` with IDs only.
- **Error trackers.** Sentry is a processor (3.6). In the Java SDK, [`sendDefaultPii` is deprecated](https://docs.sentry.io/platforms/java/guides/spring-boot/configuration/options/) in favour of `dataCollection`. Setting any one `dataCollection` field switches Data Collection on: `sendDefaultPii` is then ignored, and every field you left unset takes its permissive default (user identity and IP, cookies and headers minus a deny list, all request and response bodies, query parameters, GraphQL documents and variables). Set every field, or set none and keep `sendDefaultPii` false.

## Testing

- **Tools.** JUnit (Boot 4.1 manages JUnit 6), `@SpringBootTest` with [`@AutoConfigureMockMvc` or `MockMvcTester`](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html), and [Testcontainers with `@ServiceConnection`](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html) for a real Postgres.
- **Isolation (5.4).** Run the section 1 test on every pull request. Cover each repository method and each Spring Data REST endpoint. Spring Data REST could let a JSON Patch overwrite `@Id` and save over another user's record until [5.1.1](https://spring.io/security/cve-2026-47849) (August 2026).
- **Role matrix (7.2).** Use `@ParameterizedTest` with `with(user(...).roles(...))` for every cell. Use [`csrf()`](https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/csrf.html) on writes, and assert a write without it fails.
- **No third-party requests (9.9).** Run the framework's Playwright spec as it is against the running app, or port it to [Playwright for Java](https://playwright.dev/java/docs/network) with `page.onRequest`.
- **Dependencies.** Use Dependabot or Renovate for Maven or Gradle, plus a dependency scanner in CI (7.4).

## Deployment

- **Hosting.** Run an executable jar or an OCI image (`bootBuildImage` / `spring-boot:build-image`) on any host with a UK or EU region (9.17).
- **Behind a proxy.** Set [`server.forward-headers-strategy=native`](https://docs.spring.io/spring-boot/how-to/webserver.html#howto.webserver.use-behind-a-proxy-server). It defaults to `NONE` except on detected cloud platforms. Without it, the app sees plain HTTP: no HSTS, and no automatic `Secure` cookies.
- **Migrations.** Flyway [runs at start-up](https://docs.spring.io/spring-boot/how-to/data-initialization.html#howto.data-initialization.migration-tool.flyway), with the app's own database user, unless you configure otherwise. Set `spring.flyway.user` and `password`, which give Flyway its own `DataSource`, for a separate migration role (7.4). Or run migrations as a CI step after approval (12.1).
- **Headers.** Spring's HSTS lasts one year; 7.4 wants two years and `preload`, so set `.httpStrictTransportSecurity(h -> h.maxAgeInSeconds(63072000).preload(true))` in the filter chain (or at the proxy), with the rest of 7.4. Keep backups as 5.7 describes.

## Limits

- **Rows are your job.** Method security checks calls, not rows, and `@PostFilter` filters in memory after the query. One unscoped repository method or native query leaks across tenants (T-01).
- **Support** ([timeline](https://spring.io/projects/spring-boot#support)).
  - Boot 4.1 has open-source support until 31 July 2027, and 4.0 until 31 December 2026. 4.2 is at release candidate (4.2.0-RC2).
  - Open-source support for 3.5 ended on 30 June 2026.
  - Boot 4 brought Spring Security 7, which [removed `and()` and `authorizeRequests`](https://docs.spring.io/spring-security/reference/7.0/whats-new.html) (lambda DSL only), and made [Jackson 3 the default](https://docs.spring.io/spring-boot/reference/features/json.html). Treat 3.x to 4.x as a migration.
- **The August 2026 advisories** ([list](https://spring.io/security)) included:
  - the WebAuthn bypass in Authentication above;
  - an [XSS in the Authorization Server's default consent page](https://spring.io/security/cve-2026-47877);
  - a [DPoP proof replay](https://spring.io/security/cve-2026-41707);
  - `AesBytesEncryptor` using a [zero IV in CBC mode](https://spring.io/security/cve-2026-47842). The fix deprecates `AesBytesEncryptor` and `Encryptors.standard()`, `stronger()`, `text()` and `delux()` in favour of `AesGcmBytesEncryptor` (or `AesCbcBytesEncryptor`); read the advisory's migration notes, because data encrypted the old way may need re-encrypting.

  Run Spring Security 7.1.2, which Boot 4.1.2 manages.

## Sources

- Spring Security 7.1 reference: [authorize HTTP requests](https://docs.spring.io/spring-security/reference/7.1/servlet/authorization/authorize-http-requests.html), [method security](https://docs.spring.io/spring-security/reference/7.1/servlet/authorization/method-security.html), [session management](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/session-management.html), [password storage](https://docs.spring.io/spring-security/reference/7.1/features/authentication/password-storage.html), [MFA](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/mfa.html), [passkeys](https://docs.spring.io/spring-security/reference/7.1/servlet/authentication/passkeys.html), [CSRF](https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/csrf.html), [default headers](https://docs.spring.io/spring-security/reference/7.1/features/exploits/headers.html), [servlet headers](https://docs.spring.io/spring-security/reference/7.1/servlet/exploits/headers.html), [MockMvc authentication](https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/authentication.html), [MockMvc CSRF](https://docs.spring.io/spring-security/reference/7.1/servlet/test/mockmvc/csrf.html)
- Spring Boot 4.1 reference: [Spring Security](https://docs.spring.io/spring-boot/reference/web/spring-security.html), [servlet web applications](https://docs.spring.io/spring-boot/reference/web/servlet.html), [application properties](https://docs.spring.io/spring-boot/appendix/application-properties/index.html), [externalized configuration](https://docs.spring.io/spring-boot/reference/features/external-config.html), [Actuator endpoints](https://docs.spring.io/spring-boot/reference/actuator/endpoints.html), [logging](https://docs.spring.io/spring-boot/reference/features/logging.html), [tracing](https://docs.spring.io/spring-boot/reference/actuator/tracing.html), [testing](https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html), [Testcontainers](https://docs.spring.io/spring-boot/reference/testing/testcontainers.html), [web server how-to](https://docs.spring.io/spring-boot/how-to/webserver.html), [data initialisation how-to](https://docs.spring.io/spring-boot/how-to/data-initialization.html), [dependency versions](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)
- Spring project: [security advisories](https://spring.io/security), [Spring Boot support timeline](https://spring.io/projects/spring-boot#support), [Spring Framework AOP proxies](https://docs.spring.io/spring-framework/reference/core/aop/proxying.html)
- Spring Data REST: [getting started](https://docs.spring.io/spring-data/rest/reference/introduction/getting-started.html), [configuring the REST URL path](https://docs.spring.io/spring-data/rest/reference/customizing/configuring-the-rest-url-path.html), [repository resources](https://docs.spring.io/spring-data/rest/reference/repository-resources.html); Spring Security [Spring MVC integration](https://docs.spring.io/spring-security/reference/7.1/servlet/integrations/mvc.html)
- Other: [Hibernate 7.4 user guide](https://docs.hibernate.org/orm/7.4/userguide/html_single/), [Thymeleaf 3.1](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html), [Playwright for Java](https://playwright.dev/java/docs/network), [Sentry Spring Boot options](https://docs.sentry.io/platforms/java/guides/spring-boot/configuration/options/), [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- OWASP Cheat Sheets (linked, not copied): [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html), [CSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
