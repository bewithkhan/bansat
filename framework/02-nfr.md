<a id="p2"></a>
## Part 2 — Non-functional requirements `[CORE]`

Every NFR needs a number and a way to verify it. Defaults below are sensible starting points; change them deliberately.

| ID | Category | Requirement | Target (default) | Verified by |
|---|---|---|---|---|
| NFR-PERF-01 | Performance | Core Web Vitals at p75 on mobile | LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1 | Lighthouse CI + real-user monitoring (aggregate) |
| NFR-PERF-02 | Performance | API latency (excluding AI calls) | p95 ≤ {{300}} ms reads, ≤ {{800}} ms writes | APM / logs |
| NFR-PERF-03 | Performance | JavaScript on the initial route | ≤ {{170}} KB gzipped | Bundle analyser in CI |
| NFR-AVL-01 | Availability | Monthly uptime | {{99.5%}} (≈ 3.6 h downtime per 30 days) | Uptime monitor |
| NFR-REL-01 | Recoverability | Backup and restore | RPO ≤ {{24 h}} (≤ 5 min with point-in-time recovery) · RTO ≤ {{4 h}} | Quarterly restore drill |
| NFR-SCL-01 | Scalability | Load | {{N}} concurrent users, {{M}} records, no degradation | Load test before launch |
| NFR-SEC-01 | Security | Verification baseline | OWASP ASVS Level 1 for all; **Level 2** when processing sensitive data or payments | Security review (7.4) |
| NFR-PRIV-01 | Privacy | Privacy by default | Zero non-essential cookies or third-party requests before consent | Playwright test (9.9) |
| NFR-PRIV-02 | Privacy | Rights requests | Completed within 30 days | DSR log (9.15) |
| NFR-PRIV-03 | Privacy | Data residency | Primary data stored in {{UK/EU region}} | Infrastructure review |
| NFR-A11Y-01 | Accessibility | Standard | WCAG 2.2 AA | axe in CI + manual audit (10.6) |
| NFR-CMP-01 | Compatibility | Browsers and devices | Last 2 versions of Chrome, Edge, Firefox and Safari; iOS {{17+}}; Android {{10+}}; viewports from 320 px | Device test matrix |
| NFR-I18N-01 | Localisation | Locale handling | {{en-GB}} default; times stored in UTC and shown in local time; formatting through `Intl` | Unit tests |
| NFR-OBS-01 | Observability | Error alerting | Alert when the error rate exceeds {{2%}} over 5 min | Alert test |
| NFR-MNT-01 | Maintainability | Code quality | TypeScript strict; zero lint errors; ≥ {{80%}} coverage of domain logic | CI |
| NFR-COST-01 | Cost | Budgets | Infrastructure ≤ {{£X}}/month; AI ≤ {{£Y}}/month, with alerts at 50/80/100% | Billing alerts |
