<a id="p6"></a>
## Part 6 — API & integration contract `[CORE]`

### 6.1 Conventions

- JSON with camelCase fields, ISO-8601 UTC timestamps and UUIDs.
- Public and partner routes are versioned (`/api/v1/…`).
- Lists use cursor pagination (`?cursor=&limit=` with a server maximum).
- Writes with side effects (payments, emails, AI jobs) accept an `Idempotency-Key`.
- Server Actions are for first-party UI mutations only. Each one validates input and re-checks authorisation (ADR-001).

### 6.2 Endpoint & action inventory

| ID | Type | Name / path | Purpose | Auth · Roles | Input (Zod) | Errors | Rate limit | FR |
|---|---|---|---|---|---|---|---|---|
| API-001 | Action | `createTask` | Create a task | Member+ | `TaskCreate` | 401 403 422 | 60/min/user | FR-002 |
| API-002 | GET | `/api/v1/tasks` | List tasks (cursor) | Member+ | `TaskQuery` | 401 403 | 120/min/user | FR-002 |
| API-003 | POST | `/api/v1/standups` | Generate an AI standup | Member+ | `StandupRequest` | 401 403 429 504 | {{20/day/workspace}} | FR-003 |
| API-004 | POST | `/api/webhooks/billing` | Billing events | Signature | Provider schema | 400 401 | — | 1.8 |
| API-005 | POST | `/api/privacy/consent` | Record a consent decision | Any | `ConsentDecision` | 422 | 30/min/IP | FR-007 |
| API-006 | POST | `/api/privacy/export` | Start a data export | Self (re-auth) | — | 401 429 | 3/day/user | FR-006 |
| API-007 | POST | `/api/account/delete` | Request account deletion | Self (re-auth) | — | 401 409 | 3/day/user | FR-006 |

### 6.3 Error contract

Use RFC 9457 *Problem Details*. The `code` field drives the UI state (10.7), and `ref` lets support find the log entry.

```json
{
  "type": "https://{{domain}}/errors/forbidden",
  "title": "You don't have permission to do that",
  "status": 403,
  "code": "FORBIDDEN",
  "detail": "Only workspace admins can invite members.",
  "ref": "7F3K-92QD"
}
```

| HTTP | `code` | UI state |
|---|---|---|
| 400 / 422 | `VALIDATION_FAILED` (with a `fields` map) | S9 Form validation |
| 401 | `UNAUTHENTICATED` | S8 Session expired |
| 403 | `FORBIDDEN` | S7 Permission denied |
| 404 / 410 | `NOT_FOUND` | S11 Not found / deleted |
| 409 | `CONFLICT` | S12 Sync conflict |
| 429 | `RATE_LIMITED` (+ `Retry-After` header) | S13 Rate limited |
| 502 / 503 | `UPSTREAM_UNAVAILABLE` | S15 Degraded, or S3 Error |
| 504, or a client timeout | `TIMEOUT` | S5 Slow network, then S3 Error |
| 500 | `INTERNAL` | S3 Error |
| No response (fetch fails, `navigator.onLine === false`) | — | S4 No internet |

### 6.4 Validation & content safety

- Zod schemas live in `lib/schemas` and run on the server, which is the authority. Client-side validation only improves the UX.
- Every string has a maximum length, every number has bounds, and unknown fields are rejected.
- Rich text and Markdown (comments, AI output) is rendered through an allowlist sanitiser. No `dangerouslySetInnerHTML` without one.
- File uploads are checked for type (magic bytes, not the file extension) and size. Files go to private buckets and are served through short-lived signed URLs.

### 6.5 Webhooks

**Inbound:**
- Verify the HMAC signature and reject timestamps older than 5 minutes.
- Deduplicate by event ID.
- Return `2xx` quickly and process asynchronously.

**Outbound:**
- Sign payloads.
- Retry with exponential backoff and send failures to a dead-letter queue.
- Never send C3 data in a payload.

### 6.6 Rate limiting & abuse protection

| Surface | Limit (default) | Response |
|---|---|---|
| Sign-in / magic link / password reset | 5 per 15 min per IP and per account | 429 + generic message (no account enumeration) |
| AI endpoints | Per user {{20/hour}}; per workspace {{quota}} | 429 + reset time (S13) |
| Public forms (waitlist, contact) | 10 per hour per IP; bot protection only on these forms | 429 |
| Exports | 3 per day per user | 429 |
