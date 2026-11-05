<a id="p0"></a>
## Part 0 — Project intake & risk classification `[CORE]`

### 0.1 Snapshot

| Field | Answer |
|---|---|
| One-line description | {{e.g. "TaskFlow AI turns a team's task board into a daily standup in one click."}} |
| Problem, and who has it | {{ }} |
| Platforms | {{Web · PWA · iOS · Android · Desktop · Wearable/IoT}} |
| Markets (where users are) | {{e.g. UK, Ireland, Nigeria}} |
| B2C, B2B or internal | {{ }} |
| Target launch · Budget cap | {{date}} · {{£/month infrastructure, £/month AI}} |

### 0.2 Screening questions

Answer every question. Each **Yes** switches on the linked module.

| # | Question | Y/N | If yes, complete |
|---|---|---|---|
| Q1 | Will you collect any personal data at all (emails, names, IP addresses in logs, analytics or device IDs)? | | Part 9. The answer is practically always yes. |
| Q2 | Users in the **UK**? | | UK GDPR, DPA 2018, PECR (9.1) |
| Q3 | Users in the **EU/EEA** (you offer them services or monitor their behaviour)? | | EU GDPR, ePrivacy, EU representative check, AI Act |
| Q4 | Users in **Nigeria**? | | NDPA 2023 + GAID 2025; major-importance check (9.2) |
| Q5 | Users in the **US** or elsewhere? | | COPPA, CAN-SPAM, state laws; add rows to 9.1 |
| Q6 | Could anyone **under 18** use it, even if it isn't aimed at them? | | 9.12 Children |
| Q7 | **Health** or wellbeing, biometric, genetic, sex life or orientation, religion, ethnicity, political or trade-union data? | | 9.13 Special category data; DPIA |
| Q8 | **Precise location** or continuous tracking? | | 9.14; DPIA |
| Q9 | Monitoring **workers** (employees, drivers, contractors)? | | 9.14; DPIA |
| Q10 | **Wearables, IoT** devices or sensors? | | 9.13 and 9.14; device security |
| Q11 | **AI/LLM** features, or **automated decisions** about people? | | Part 8; 9.22 |
| Q12 | Can users share **content with other users** (comments, chat, uploads, profiles)? | | 7.3 abuse threats; Online Safety Act screen (9.1) |
| Q13 | **Payments** or subscriptions? | | 1.8; 9.25 (PCI scope, consumer law) |
| Q14 | **Marketing** email, SMS or push; a waitlist or newsletter? | | 9.11 |
| Q15 | Analytics, heatmaps, **session replay**, ad pixels, A/B tests? | | 9.8–9.10 |
| Q16 | Third-party **fonts, CDNs, embeds** or widgets (maps, video, chat, CAPTCHA)? | | 9.9 |
| Q17 | Distribution through **app stores**? | | 9.25 platform rules |
| Q18 | B2B: will customers put **their own people's data** into it, so you act as their processor? | | 9.2 processor duties; customer DPA |
| Q19 | Selling to the **public sector, NHS or enterprises**? | | 7.4 assurance (Cyber Essentials, ISO 27001 or SOC 2); NHS DTAC and DSPT (9.13) |
| Q20 | Could processing be **large-scale** (thousands of people, or sensitive data in any volume)? | | DPO assessment (9.2); DPIA |

### 0.3 Risk tier

- **High** if Q7, Q8, Q9 or Q10 is yes; if children are a target or likely audience (Q6); or if Q11 involves significant decisions about people. A DPIA is then mandatory and an external review is recommended.
- **Medium** if you have accounts, analytics, marketing or a B2B processor role.
- **Low** otherwise.

**Result:** Tier {{Low / Medium / High}} · DPIA required {{Y/N}} · Modules in scope: {{list}}

### 0.4 Delivery questions

These decide how the project runs (11.7). There are no wrong answers, and you can change the method later with an ADR.

| # | Question | Answer |
|---|---|---|
| D1 | How many people will build it? | {{1 · 2–10 · 11–50 · more than 50}} |
| D2 | How many teams work on the same product? | {{1 · 2–8 · more than 8}} |
| D3 | How settled are the requirements? | {{fixed and well understood · mostly known · still being discovered}} |
| D4 | What's fixed: the date, the budget or the scope? | {{any of them, or none}} |
| D5 | Who's paying, and how? | {{your own product · a client, fixed price · a client, paid for time · an internal team}} |
| D6 | Does anyone need formal evidence of control, such as a regulator, an auditor, a public-sector buyer or a client's project office? | {{Y/N}} |
| D7 | Is the work mostly planned features, or a stream of requests and fixes? | {{planned features · a stream · both}} |
| D8 | Does the organisation already use a method you're expected to follow? | {{its name, or no}} |

**Result:** Outer method {{the organisation's method, E3, or none}} · Inner method {{…}} (11.7) · Reason {{one sentence}} · Recorded in ADR-{{NNN}}
