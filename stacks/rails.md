# Ruby on Rails

> **Group:** Backend · **Covers:** Rails 8.1 (8.1.4.1) on Ruby 3.2+, with Pundit or Action Policy · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

Rails has authentication but no authorisation layer. Its default database, SQLite, and MySQL have no row-level security. Enforce access in two places:

- **Scope every lookup through the user.** Use `current_organization.tasks.find(params[:id])`, where `current_organization` is looked up through `Current.user`'s memberships. Then another tenant's ID raises `RecordNotFound`, which shows as a 404.
  - Never take `organization_id` from params, and leave it out of [`params.expect`](https://guides.rubyonrails.org/action_controller_overview.html#expect) (T-03).
  - [`unscoped`](https://guides.rubyonrails.org/active_record_querying.html#unscoped) and `find_by_sql` skip scopes, and SQL strings built by interpolation [invite injection](https://guides.rubyonrails.org/security.html#sql-injection).
- **A policy for every action.** Use [Pundit](https://github.com/varvet/pundit) (`authorize`, `policy_scope`) or [Action Policy](https://actionpolicy.evilmartians.io/guide/scoping) (`authorize!`, `authorized_scope`). They are your `assertCan()` (7.2).
  - Add `after_action :verify_authorized` (Pundit, Action Policy) and `verify_policy_scoped` (Pundit) to `ApplicationController`, so an action that forgets to authorise fails in tests.
  - The Rails generator provides `Current.user`, not `current_user`, so [define `pundit_user`](https://github.com/varvet/pundit#customize-pundit-user).

```ruby
# app/controllers/tasks_controller.rb
class TasksController < ApplicationController
  after_action :verify_authorized

  def update
    @task = authorize current_organization.tasks.find(params[:id])   # 404 for other tenants
    @task.update!(params.expect(task: [:title, :status]))            # never :organization_id
    redirect_to @task
  end

  private
    def current_organization = Current.user.organizations.find(session[:organization_id])
    def pundit_user = Current.user
end
```

Jobs don't run inside the request, so they have no `Current.user`. Pass the tenant ID in, and look records up through it again.

**Active Storage files are public by default.** Its controllers [don't check sign-in](https://guides.rubyonrails.org/active_storage_overview.html#authenticated-controllers): a file's URL carries a permanent signed ID, and anyone who has the URL gets the file, even when `ApplicationController` requires authentication. Serve tenant files through your own authenticated controller that looks the record up through `current_organization`, and set [`config.active_storage.draw_routes = false`](https://guides.rubyonrails.org/configuring.html#config-active-storage-draw-routes) so the public routes are gone.

**Postgres RLS as a second layer (optional).** Rails doesn't set it up, and it doesn't wrap requests in a transaction. Add an `around_action` that opens one (`ActiveRecord::Base.transaction { ... }`) and calls `select set_config('app.org_id', ?, true)` first, so the setting lasts exactly that transaction. Connect as a role that doesn't own the tables and lacks `BYPASSRLS` ([PostgreSQL](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)).

**The 5.4 isolation test** as an [integration test](https://guides.rubyonrails.org/testing.html#implementing-an-integration-test). `sign_in_as` is the [`SessionTestHelper`](https://guides.rubyonrails.org/sign_up_and_settings.html) from the Rails guide; create it if the generator didn't:

```ruby
# test/integration/tenant_isolation_test.rb — fixtures hold two organisations (5.5)
class TenantIsolationTest < ActionDispatch::IntegrationTest
  test "a member of org A cannot reach org B" do
    task_b = tasks(:org_b_task)
    get task_path(task_b); assert_redirected_to new_session_path               # anonymous
    sign_in_as users(:org_a_member)
    get task_path(tasks(:org_a_task)); assert_response :success                # own task: the control
    get task_path(task_b); assert_response :not_found
    patch task_path(task_b), params: { task: { title: "x" } }; assert_response :not_found
    assert_no_difference -> { task_b.organization.tasks.count } do             # write into org B
      post tasks_path, params: { task: { title: "x", organization_id: task_b.organization_id } }
    end
    assert_equal "B's task", task_b.reload.title
  end
end
```

## Authentication

- **The generator.** [`bin/rails generate authentication`](https://guides.rubyonrails.org/security.html#authentication) (8.0+) adds:
  - a `User` model with `has_secure_password`, hashed with bcrypt;
  - sessions stored in the database;
  - password reset;
  - [`rate_limit to: 10, within: 3.minutes`](https://github.com/rails/rails/blob/8-1-stable/railties/lib/rails/generators/rails/authentication/templates/app/controllers/sessions_controller.rb.tt) on sign-in and reset.
- **What's missing.** There's no sign-up, MFA, passkeys or account lockout: build them, or use Devise and its extensions. The failed sign-in and reset messages are the same whether or not the account exists ([templates](https://github.com/rails/rails/tree/8-1-stable/railties/lib/rails/generators/rails/authentication/templates/app/controllers)), and [`authenticate_by`](https://api.rubyonrails.org/v8.1/classes/ActiveRecord/SecurePassword/ClassMethods.html) digests the password even when no user matches, which blunts timing-based enumeration (7.1).
- **The session cookie.** The generated concern writes `cookies.signed.permanent[:session_id]` with `httponly: true, same_site: :lax` ([source](https://github.com/rails/rails/blob/8-1-stable/railties/lib/rails/generators/rails/authentication/templates/app/controllers/concerns/authentication.rb.tt)).
  - [`permanent` means 20 years](https://api.rubyonrails.org/v8.1/classes/ActionDispatch/Cookies/ChainedCookieJars.html), and the `sessions` rows never expire. Add an expiry check on `Current.session` and a job that deletes old rows, to meet 7.1.
  - The cookie is `Secure` only when [`force_ssl`](https://api.rubyonrails.org/v8.1/classes/ActionDispatch/SSL.html) is on (Deployment).
- **Rate limits.** [`rate_limit`](https://api.rubyonrails.org/v8.1/classes/ActionController/RateLimiting/ClassMethods.html) counts by `request.remote_ip`, in the cache store. Before 8.1.4.1, a client could spoof `remote_ip` through the `Forwarded` header ([GHSA-2gff-2mmg-m73p](https://github.com/rails/rails/security/advisories/GHSA-2gff-2mmg-m73p), High, 8.1 only), and so dodge the limit; see also the CDN bullet under Deployment. 7.1 also wants a limit per account, so add a second `rate_limit` with `by: -> { params[:email_address].to_s.downcase }` and a `name:`. Make sure production has a real cache store (Solid Cache by default).
- **Re-authentication and sign-out.** For deleting the account, changing email or exporting, ask for the password again and check it with `authenticate_by`. Sign-out destroys the `Session` row, which is a real server-side revocation.
- **Session fixes in 8.1.4.1.** Released on 4 November 2026, it fixed a [missing `SameSite` attribute on session cookies from the session stores, and destroyed sessions coming back through `CacheStore`](https://discuss.rubyonrails.org/t/rails-security-releases-8-0-5-2-and-8-1-4-1/91802).

## Secrets

- **Credentials.** Secrets live in [`config/credentials.yml.enc`](https://guides.rubyonrails.org/security.html#custom-credentials), encrypted with `config/master.key` or `RAILS_MASTER_KEY`. The key is never committed. Use [per-environment files](https://guides.rubyonrails.org/configuring.html#config-credentials-content-path) (`config/credentials/production.yml.enc`), so development keys can't open production secrets (12.1).
- **`secret_key_base`** signs and encrypts cookies. Development and test derive it from the app name, but other environments [must use a random key from credentials](https://guides.rubyonrails.org/security.html#session-storage).
- **Deploying with Kamal.** Kamal reads `.kamal/secrets`. In 8.1 that file can pull values with [`rails credentials:fetch`](https://guides.rubyonrails.org/8_1_release_notes.html#command-line-credentials-fetching), so the master key is the only secret the deploy machine needs. Keep it in the CI secret store, not on a laptop the agent can reach (12.1).
- **What reaches the browser.** Nothing from credentials unless a view prints it. Import-mapped JavaScript is public, so it never holds keys. `render json: @task` sends [every attribute](https://api.rubyonrails.org/v8.1/classes/ActiveModel/Serializers/JSON.html) of the record: pass `only:` or build the hash yourself.

## CSRF and XSS

- **CSRF.** [`default_protect_from_forgery`](https://guides.rubyonrails.org/security.html#required-security-token) is on in new apps. Forms carry the token, and `csrf_meta_tags` feeds Turbo, which sends `X-CSRF-Token` on its requests. A plain `fetch()` doesn't, so add the header yourself.
- **Escape hatches.**
  - `skip_forgery_protection`;
  - `protect_from_forgery with: :null_session`, common in API controllers;
  - controllers that inherit from `ActionController::API`, which [leaves forgery protection out](https://github.com/rails/rails/blob/8-1-stable/actionpack/lib/action_controller/api.rb) entirely: add it back if an API controller uses cookies.

  Use these only for token-authenticated or signature-verified endpoints.
- **XSS.** ERB escapes output. These skip it:
  - [`html_safe`](https://guides.rubyonrails.org/active_support_core_extensions.html#output-safety), which escapes nothing (it only marks the string as safe);
  - `raw` and `<%==`.

  For user HTML, use `sanitize` with an allowlist of tags (T-04). The November 2026 release fixed several XSS bugs in Action View helpers (`strip_tags`, `highlight`, the text and tag helpers), so stay patched.
- **CSP: none by default.** The generated `config/initializers/content_security_policy.rb` is [entirely commented out](https://github.com/rails/rails/blob/8-1-stable/railties/lib/rails/generators/rails/app/templates/config/initializers/content_security_policy.rb.tt). Its example allows any `https:` source and uses the session ID as the nonce. Don't uncomment it as it is: write the 7.4 policy with a random per-request nonce, which the [guide recommends](https://guides.rubyonrails.org/security.html#adding-a-nonce), and start report-only. [`content_security_policy_nonce_auto`](https://guides.rubyonrails.org/security.html#adding-a-nonce) adds the nonce to `javascript_include_tag` and `javascript_tag`, so the consent module's tag gets it. When you enforce, add `policy.upgrade_insecure_requests true` (report-only ignores it):

```ruby
# config/initializers/content_security_policy.rb — the 7.4 policy
Rails.application.configure do
  config.content_security_policy do |policy|
    policy.default_src :self
    policy.script_src  :self, :strict_dynamic
    policy.style_src   :self, :unsafe_inline
    policy.img_src     :self, :data, :blob
    policy.font_src :self; policy.connect_src :self; policy.base_uri :self; policy.form_action :self
    policy.frame_src :none; policy.frame_ancestors :none; policy.object_src :none
  end
  config.content_security_policy_nonce_generator = ->(_request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w[script-src]
  config.content_security_policy_nonce_auto = true     # script tags from the helpers get the nonce
  config.content_security_policy_report_only = true
end
```

## Fonts and assets

- **Asset pipeline.** [Propshaft](https://guides.rubyonrails.org/asset_pipeline.html) serves `app/assets` from your own domain, with fingerprinted names. Put `woff2` files there and reference them with `font_url` / `asset_path`.
- **Importmap.** [`bin/importmap pin`](https://github.com/rails/importmap-rails#using-npm-packages-via-javascript-cdns) downloads packages into `vendor/javascript`, so the browser loads them from you. A pin written by hand as `to: "https://ga.jspm.io/..."` loads from the CDN at runtime: a third-party request (9.9).
- **Layouts.** No CDN `<link>` or `<script>` tags in `app/views/layouts`. An [`asset_host`](https://guides.rubyonrails.org/asset_pipeline.html#cdns) must be your own domain or a CDN you've registered as a processor (3.6).
- **Check it.** Run the 9.9 test, and keep `font-src 'self'`.

## Consent

- **Nothing loads unless a layout prints it.** Views render on the server. Load the 9.7 consent module from the layout with `javascript_include_tag` or importmap, with the nonce, and load analytics only through `loadWhenConsented()`.
- **Turbo Drive changes pages without reloading.** It [adds new `<head>` scripts](https://turbo.hotwired.dev/handbook/building#working-with-script-elements) and keeps existing ones. So:
  - a vendor script injected after consent stays loaded across visits;
  - page-view tracking has to hook `turbo:load`;
  - withdrawal needs a full `window.location.reload()`, as 9.8 asks.
- **The consent POST.** Rails doesn't encrypt plain cookies, so `cookies[:consent_v1]` reads the browser's choice. Use it only to decide whether to show the banner. The 9.7 `saveConsent()` POST needs the `X-CSRF-Token` header from `csrf_meta_tags`. Marketing sends check `consent_records` (CR-06).
- **Cookie register (9.8).** List `session_id` (the generator's signed cookie), `_<app>_session` (the cookie store) and `consent_v1` as strictly necessary.

## Logging

- **Parameter filtering.** The generated [`filter_parameter_logging.rb`](https://guides.rubyonrails.org/configuring.html#config-filter-parameters) filters `:passw, :email, :secret, :token, :_key, :crypt, :salt, :certificate, :otp, :ssn, :cvv, :cvc` from request logs and `#inspect`. Add your own C3 fields to it.
- **Production defaults** (from the [`production.rb` template](https://github.com/rails/rails/blob/8-1-stable/railties/lib/rails/generators/rails/app/templates/config/environments/production.rb.tt)):
  - logs go to STDOUT at `info`, tagged with `request_id`, which is your correlation ID;
  - `attributes_for_inspect = [:id]`;
  - the template warns that `debug` level can log personal data.
- **Structured events (new in 8.1).** [`Rails.event.notify`](https://api.rubyonrails.org/v8.1/classes/ActiveSupport/EventReporter.html) filters hash payloads with `filter_parameters`, but not event objects, so filter those yourself. The release notes' example puts an email in an event: send a user ID instead (7.5).
- **Error trackers.** [`Rails.error`](https://guides.rubyonrails.org/error_reporting.html) passes exceptions to subscribers such as Sentry, a processor (3.6). In the Ruby SDK, `send_default_pii` is deprecated in favour of [`data_collection`](https://docs.sentry.io/platforms/ruby/configuration/options/), and its more permissive defaults (user, cookies, request bodies) switch on automatically in the next major version. Set every category explicitly now.

## Testing

- **Tools.** Minitest, with fixtures, integration tests and [system tests](https://guides.rubyonrails.org/testing.html#system-testing) (Capybara with Selenium). The guide keeps system tests for critical paths.
- **CI (new in 8.1).** New apps get [`config/ci.rb`](https://guides.rubyonrails.org/8_1_release_notes.html#local-ci), run by `bin/ci`. It runs RuboCop, `bin/bundler-audit`, `bin/importmap audit` and Brakeman (`--exit-on-warn`), then `bin/rails test` ([template](https://github.com/rails/rails/blob/8-1-stable/railties/lib/rails/generators/rails/app/templates/config/ci.rb.tt)).
- **What to add.**
  - The isolation test from section 1, and a fixture-driven role-matrix test (7.2), on the same database engine as production.
  - The framework's Playwright spec for 9.9, as it is, against `bin/rails server` in production mode or a staging deploy.

## Deployment

- **Kamal 2 is the default.** It deploys containers to your own servers, so choose UK or EU hosts for the app, database and backups. Its proxy can [terminate TLS with Let's Encrypt](https://kamal-deploy.org/docs/configuration/proxy/) (`ssl: true`, single server).
- **Turn SSL on in Rails.** With Kamal, the generated `production.rb` leaves `config.assume_ssl` and `config.force_ssl` commented out. Turn both on behind the proxy. That gives you `Secure` cookies and [HSTS for two years](https://api.rubyonrails.org/v8.1/classes/ActionDispatch/SSL.html) (add `preload` yourself).
- **Host checks.** Uncomment `config.hosts` so DNS-rebinding and `Host`-header protection is on.
- **Behind a CDN.** Set Kamal's `forward_headers: true` and list the proxies in [`trusted_proxies`](https://guides.rubyonrails.org/configuring.html#actiondispatch-remoteip), so `request.remote_ip`, which `rate_limit` keys on, is the visitor's address.
- **Headers.** The [defaults](https://guides.rubyonrails.org/security.html#default-security-headers) are `X-Frame-Options: SAMEORIGIN`, `nosniff` and `Referrer-Policy: strict-origin-when-cross-origin`.
  - Rails' "permissions policy" DSL [still sends the old `Feature-Policy` header](https://guides.rubyonrails.org/security.html#feature-policy-header), so set `Permissions-Policy` through `config.action_dispatch.default_headers` or at the proxy (7.4).
- **SQLite in production.** Rails 8 defaults to SQLite (`storage/production.sqlite3`, plus Solid Cache, Queue and Cable databases), according to the [`database.yml` template](https://github.com/rails/rails/blob/8-1-stable/railties/lib/rails/generators/rails/app/templates/config/databases/sqlite3.yml.tt). Copy those files off the server on a schedule (5.7): a volume on the same host isn't a backup. Run migrations through the deploy pipeline after approval (12.1).

## Limits

- **No authorisation in core.** One controller action without a scoped lookup or `authorize` is an IDOR (T-03). `verify_authorized` and the isolation test are the safety net.
- **Support.** [Rails 8.1 gets security fixes until 10 October 2027. 8.0's end on 7 November 2026, and 7.2 is already unsupported](https://rubyonrails.org/maintenance).
- **2026 advisories** ([announcements](https://discuss.rubyonrails.org/c/security-announcements/9)):
  - 8.1.4.1 (4 November) fixed 21 issues, among them a critical arbitrary file write and read in Active Storage image analysis, and a Strong Parameters bypass through `Parameters#each_key`;
  - July's [CVE-2026-66066](https://discuss.rubyonrails.org/t/cve-2026-66066-possible-arbitrary-file-read-and-remote-code-execution-in-active-storage-variant-processing/91432) let an unauthenticated attacker read files, including the environment that holds `secret_key_base`, through Active Storage variants in the default configuration (fixed in 8.1.3.1). Since that fix, Active Storage refuses to boot with libvips older than 8.13;
  - in October, the Trilogy MySQL adapter's `escape` [allowed SQL injection](https://discuss.rubyonrails.org/t/ghsa-744p-w4gc-m3gh-sql-injection-through-trilogy-escape-with-multibyte-encodings/91797) with multibyte encodings. It's fixed in the trilogy gem 2.13.2 (2.13.3 when checked), which also stops transcoding queries and drops several connection encodings (`sjis`, `cp932`, `big5`, `gbk` and `gb18030` among them), which now raise `ArgumentError` ([changelog](https://github.com/trilogy-libraries/trilogy/blob/main/CHANGELOG.md)). It had no CVE when announced and wasn't in OSV when checked, so scanners may not flag it: check `Gemfile.lock` yourself.

  Upgrade within the 7.6 windows, and rotate `secret_key_base` and credentials if you ran an affected Active Storage version.
- **Mass assignment.** `params.expect` permits only what you list. A permitted `:organization_id` or `:role` field is privilege escalation (7.2).

## Sources

- Rails 8.1 guides: [security](https://guides.rubyonrails.org/security.html), [8.1 release notes](https://guides.rubyonrails.org/8_1_release_notes.html), [Action Controller overview](https://guides.rubyonrails.org/action_controller_overview.html), [Active Record querying](https://guides.rubyonrails.org/active_record_querying.html), [Active Storage](https://guides.rubyonrails.org/active_storage_overview.html), [configuring](https://guides.rubyonrails.org/configuring.html), [asset pipeline](https://guides.rubyonrails.org/asset_pipeline.html), [testing](https://guides.rubyonrails.org/testing.html), [sign up and settings](https://guides.rubyonrails.org/sign_up_and_settings.html), [error reporting](https://guides.rubyonrails.org/error_reporting.html), [Active Support core extensions](https://guides.rubyonrails.org/active_support_core_extensions.html)
- Rails API 8.1: [`rate_limit`](https://api.rubyonrails.org/v8.1/classes/ActionController/RateLimiting/ClassMethods.html), [`ActionDispatch::SSL`](https://api.rubyonrails.org/v8.1/classes/ActionDispatch/SSL.html), [cookie jars](https://api.rubyonrails.org/v8.1/classes/ActionDispatch/Cookies/ChainedCookieJars.html), [Event Reporter](https://api.rubyonrails.org/v8.1/classes/ActiveSupport/EventReporter.html), [JSON serialisation](https://api.rubyonrails.org/v8.1/classes/ActiveModel/Serializers/JSON.html)
- Rails source (8-1-stable): [authentication generator templates](https://github.com/rails/rails/tree/8-1-stable/railties/lib/rails/generators/rails/authentication/templates), [app templates](https://github.com/rails/rails/tree/8-1-stable/railties/lib/rails/generators/rails/app/templates) (`production.rb`, `ci.rb`, `content_security_policy.rb`, `database.yml`)
- Rails project: [maintenance policy](https://rubyonrails.org/maintenance), [security announcements](https://discuss.rubyonrails.org/c/security-announcements/9), [8.0.5.2 and 8.1.4.1 release](https://discuss.rubyonrails.org/t/rails-security-releases-8-0-5-2-and-8-1-4-1/91802), [GHSA-2gff-2mmg-m73p](https://github.com/rails/rails/security/advisories/GHSA-2gff-2mmg-m73p); [Trilogy changelog](https://github.com/trilogy-libraries/trilogy/blob/main/CHANGELOG.md)
- Libraries and tools: [Pundit](https://github.com/varvet/pundit), [Action Policy scoping](https://actionpolicy.evilmartians.io/guide/scoping) and [Rails integration](https://actionpolicy.evilmartians.io/guide/rails), [importmap-rails](https://github.com/rails/importmap-rails), [Turbo handbook](https://turbo.hotwired.dev/handbook/building), [Kamal proxy](https://kamal-deploy.org/docs/configuration/proxy/), [Sentry Ruby options](https://docs.sentry.io/platforms/ruby/configuration/options/), [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- OWASP Cheat Sheets (linked, not copied): [Ruby on Rails](https://cheatsheetseries.owasp.org/cheatsheets/Ruby_on_Rails_Cheat_Sheet.html), [Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
