<a id="appa"></a>
## Appendix A — Templates

### A1 Legitimate interests assessment (LIA)

```text
LIA-NN — {{Processing activity}}  (ROPA-__)          Date: {{ }}   Reviewer: {{ }}
1. Purpose test     What is the interest? Who benefits? Would it be lawful and ethical?
2. Necessity test   Is the processing necessary for that interest? Is there a less intrusive way?
3. Balancing test   Data types · reasonable expectations · impact on people · vulnerable groups (e.g. children)
                    · safeguards (minimisation, opt-out, retention, security)
Outcome: Proceed / Proceed with safeguards / Use another basis   ·   Review date: {{ }}
(Nigeria: complete before processing starts — GAID Art. 26 and Schedule 8)
```

### A2 DPIA

```text
DPIA-NN — {{Project / feature}}                      Version: {{ }}   Owner: {{ }}   Status: {{ }}
1. Description     nature, scope, context, purposes; data flows (3.4); people affected; volumes; vendors
2. Consultation    who was consulted (users, security, DPO, processors)
3. Necessity       lawful basis; minimisation; retention; rights; transfers; processor controls
4. Risks           likelihood × severity for each risk to people (not to the business)
5. Measures        controls that reduce each risk; residual risk; who accepts it
6. Sign-off        DPO/privacy lead advice; decision; prior consultation needed? (UK/EU Art. 36; NDPA s.28(2))
7. Review          trigger events and review date
```

### A3 Rights request & complaint log

| Ref | Type | Received | Identity verified | Due (+ extension) | Systems searched | Outcome | Closed | Notes |
|---|---|---|---|---|---|---|---|---|
| DSR-001 | Access | {{ }} | {{ }} | {{ }} | DB, storage, email, help desk, logs | {{ }} | {{ }} | {{ }} |

### A4 Breach log

| Ref | Found (T0) | What happened | Data & people affected | Risk level | Regulators notified (when) | People notified (when) | Actions | Lessons |
|---|---|---|---|---|---|---|---|---|
| BR-001 | {{ }} | {{ }} | {{ }} | Low / Risk / High | ICO / DPA / NDPC — {{ }} | {{ }} | {{ }} | {{ }} |

### A5 Risk register

| RISK | Description | Likelihood (1–5) | Impact (1–5) | Score | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|---|
| RISK-01 | {{AI provider changes its terms or prices}} | 3 | 3 | 9 | {{ }} | {{Second provider evaluated; feature flag}} | Open |

### A6 Traceability matrix

| FR | Screens (SCR) | API | Data | ROPA | Tests | States verified |
|---|---|---|---|---|---|---|
| FR-003 | SCR-07 | API-003 | tasks, ai_generations | ROPA-03 | TEST-E2E-012, EVAL-01 | S1 S3 S5 S13 S14 |

### A7 Post-incident review

```text
PIR — {{Incident title}}   Severity: {{ }}   Date: {{ }}   Facilitator: {{ }}
Summary · Impact (users, data, duration) · Timeline (detected → mitigated → resolved)
Root cause (5 whys) · What went well · What went badly · Where we got lucky
Actions (owner, due date) · Docs to update (runbook, threat model, DPIA, blueprint)
```
