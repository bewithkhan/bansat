# Review of ng, za and ke (Middle East and Africa batch), checked 5 November 2026

One Blocker (South Africa: a claim whose cited sources don't contain it, though the fact is right). Nigeria and Kenya
have no wrong facts, but several Should-fix gaps. The validator passes. The reviewer's OCR of the Kenyan bundle is at
/tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/rev-mea/dl/ke_bundle/all.txt

## Nigeria (ng)

### Should fix
1. `lawful_bases`, `transfers`, `automated_decisions_ai`: the GAID Art. 18 consent list is stated as if absolute.
   GAID (https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf): Art. 18(1) opens "Without
   prejudice to the provisions of the NDP Act"; Art. 3(2) says the Act prevails in a conflict; Art. 18(2) only requires
   the audit return to state whether you rely on consent; Art. 45(1) makes the Act's Part VIII the governing rule on
   transfers, and Schedule 5 recognises NDPC-approved transfer instruments and the Act's other bases. `lawful_bases`
   says consent is needed for any transfer to a country without adequacy while `transfers` says ss.41–43 mechanisms
   suffice: contradiction. Fix: the GAID lists consent cases "without prejudice to the Act"; where the Act gives
   another basis (s.30 sensitive data, s.31(4) children, s.37(2) automated decisions, ss.41–43 transfers) the Act
   prevails in a conflict; how the NDPC reconciles them is untested, so get consent where practical and record the
   basis.
2. `registration_or_fees`: designation test incomplete. GAID Schedule 7 para 1(1): a filing system (analogue or
   digital) plus one trigger: (a) more than 200 people's data in six months; (b) commercial ICT services on another
   person's device that can store personal data; (c) a listed sector. Also missing: Ultra-High controllers pay ₦5,000
   per processor engaged per 12 months (para 7); audit return due by 31 March (Art. 7(c), 10(7)), or 15 months after
   establishment for firms set up after 12 June 2023 (Art. 10(8)); late filing adds a 50% penalty (Art. 10(9)).
3. `consent_age` and `children`: entry says parental consent is needed only "to rely on consent" (NDPA s.31(1)). GAID
   Art. 18(1)(d) requires consent for processing a child's data generally. State both, noting the Act's s.31(4)
   exceptions still apply (vital interests; education, medical or social care under confidentiality; court
   proceedings).
4. `dpia`: GAID Art. 31 missing, a direct app-builder duty. Software that tracks or communicates with people needs a
   DPIA before deployment and privacy by design; compliance with app-store security guidance; a privacy policy inside
   the app; a privacy statement before installation listing data types, purpose, security measures (e.g. encryption),
   the DPIA outcome, a support link, self-service disable or uninstall, and complaint links.
5. Optional scope: FCCPC Digital, Electronic, Online or Non-Traditional Consumer Lending Regulations 2025
   (https://fccpc.gov.ng/wp-content/uploads/2025/08/DIGITAL-CONSUMER-LENDING-2025-LATEST.pdf): lenders must comply with
   the NDPA (reg. 21); the registration form declares apps won't access call logs, contacts or photos. The copy shows a
   commencement line of 21 July 2025, but reg. 32 says it starts on Gazette publication and the gazette fields are
   blank placeholders. If added, leave `in_force_from` out until the gazette is confirmed, and add fccpc.gov.ng to
   sources.yaml.

### Nits
- `automated_decisions_ai`: "The GAID asks for consent first" applies to decisions with legal or similarly
  significant effects, without prejudice to s.37(2).
- `breach_notice`: Cybercrimes Act s.21(1) says report "immediately"; the 72 hours (as amended) is the offence deadline
  in s.21(3), which also carries a ₦2,000,000 fine and possible denial of internet service. GAID Art. 33(3) reads
  "notify affected people immediately" with no high-risk limit; Art. 7(q) and NDPA s.40(3) do have that limit.
- `dpo`: staff or contracted DPO is NDPA s.32(2) and GAID Art. 11(1), not Art. 12–13.
- `dpia`: Art. 28(4) says the DPIA is "vetted" by an accredited DPO, not "signed".
- `scope`: the NDPC Annual Report source doesn't support the scope text.
- Schedule 10: don't publish the EHL band edges (printed typo: Extra-High ₦200,000 for "5,000-2,500" leaves
  5,000–9,999 unassigned). The ₦100,000–₦1,000,000 range in the entry is safe.

### Confirmed (keep)
GAID issued 20 March 2025; in force 19 September 2025 (NDPC Annual Report 2025,
https://ndpc.gov.ng/wp-content/uploads/2026/06/NDPC-Annual-Report-2025-1.pdf: six-month gestation, "formally came into
force on 19th of September, 2025"; the GAID itself has no commencement article). NCC Consumer Code 2024 commencement 29
July 2024 (Gazette No. 129, Vol. 111, 30 July 2024, S.I. 24; reg. 11 revokes the 2007 Code). Cybercrimes (Amendment) Act
2024 assent 28 Feb 2024 (s.21 amended to "72 hours of its detection" via sectoral CERTs; s.38 two years "in accordance
with" the NDPA). Tiers and fees (Schedule 7 para 3). NDPA dates, sections and penalties; Child's Rights Act s.277; GAID
articles; NDPC documents; DND code 2442; digital economy bill still pending.

## South Africa (za)

### Blocker
1. `dpia`: "reg. 4(1)(b) makes the information officer ensure a personal information impact assessment is done" isn't
   in the field's sources. The cited Regulations PDF is only the 2025 amending schedule (deletes reg. 4(1)(c) and 4(2),
   adds "continually improved" to 4(1)(a)). The duty is in GN R1383 (14 December 2018), reg. 4(1)(b):
   https://inforegulator.org.za/wp-content/uploads/2020/07/20181214-gg42110-rg10897-gon1383-POPIA-Regulations-1.pdf
   Fix: cite that file here and in `dpo`.

### Should fix
2. `laws`, POPIA Regulations: the `official_url` file is the amending schedule as tabled (signed 21 January 2025),
   whose clause 11 says it starts on a date the Regulator proclaims. The start date rests on GN 6126 (GG 52523, 17 April
   2025): https://www.gov.za/sites/default/files/gcis_document/202504/52523gon6126.pdf, publishing the amended
   Regulations "for implementation with immediate effect" under s.113(4)(b). Fix: point to GN 6126 and name GN R1383 as
   the base text; reword the note to say GN 6126 is the Regulator's Gazette notice fixing the start.
3. `laws`, CPA Amendment Regulations 2026: no Gazette or GN number; `in_force_from` is the gazetting date (15 April
   2026, confirmed by the NCC's 17 April 2026 statement and the Information Regulator's 21 April 2026 statement:
   https://inforegulator.org.za/wp-content/uploads/2026/04/MEDIA-STATEMENT-REGULATOR-NOTES-PUBLISHED-GAZETTE-OF-THE-CONSUMER-PROTECT-ACT-AMENDMENT-REGULATIONS-2026.pdf).
   Commencement clause unverified (gazette not found). Keep the note saying the date is derived; add gazette numbers
   if found.
4. `registration_or_fees` and `marketing`: the opt-out registry's registration, renewal and cleansing fees (NCC, 17
   April 2026; amounts only in secondary sources, e.g. R0.12 per record cleansed in 2026); cleansing is free December
   2026 to April 2027; add the Information Regulator's view (21 April 2026) that POPIA s.69 consent still applies to
   people not on the registry.
5. `marketing`: CPA prohibited contact times missing. CPA s.12 and the 2011 Regulations
   (https://thencc.org.za/wp-content/uploads/2020/11/CPA-REGS.pdf) bar direct marketing to consumers at home on Sundays
   and public holidays; Saturdays before 09h00 or after 13h00; other days between 20h00 and 08h00; unless the consumer
   agreed otherwise.
6. `breach_notice`: POPIA s.21(2) operator duty missing (an operator must tell the responsible party immediately when
   it has reasonable grounds to believe data was accessed or acquired without authority).
7. `scope` and `dpia`: WhatsApp enforcement notice (10 September 2024, ordering a revised SA privacy policy and a PIIA)
   was challenged in court; news (TechCentral, 13 November 2025) says it settled, with transparency changes to be made
   a court order; no Regulator statement found. Fix: add the outcome with news under `secondary`, or drop the example.

### Nits
- `penalties`: FNB received an infringement notice of R1,000,000 (signed 21 October 2026); FNB can still pay, pay in
  instalments or elect trial within 30 days, so "issued an infringement notice", not "fined". CPA fines are imposed by
  the National Consumer Tribunal (s.112).
- `dpo`: deputies must be employees comes from the information officer guidance note (para 7.2), not s.56.
- `automated_decisions_ai`: drop the wansom.ai secondary source (branded newsletter, no primary sources).

### Confirmed (keep)
POPIA Regulations amendment of 17 April 2025 (apply fix 2); eServices portal mandatory from 1 April 2025; health
information regulations 6 March 2026 (GN 7198, GG 54268); CPA opt-out timeline (registration 15 September to December
2026; free cleansing December 2026 to April 2027; consumer blocks from May 2027; comments on draft guidelines due 6
November 2026); Cybercrimes Act s.54 not in force (Proclamation R42 of 2021). POPIA commencement (Proclamation R21 of
2020: 1 July 2020; 30 June 2021 for s.110); POPIA sections; Regulator guidance; SAnews AI policy withdrawal; CPA ss.11
and 112.

## Kenya (ke)

### Should fix
1. Health apps: add the Digital Health Act 2023 (No. 15 of 2023) and the Digital Health (Health Information Management
   Procedures) Regulations 2025 (LN 76 of 2025; Kenya Gazette Supplement No. 56 of 11 April 2025, made 9 April 2025).
   Item page https://libraryir.parliament.go.ke/items/e459ef51-6fce-45e2-9266-d4cb376d8e45; file
   https://libraryir.parliament.go.ke/bitstreams/6aa4f05c-662b-4ea2-96fc-a8d2ae40f4df/download. Requires: notify the
   Digital Health Agency within 7 days of registering with the ODPC (reg. 4); report a health data breach to the Agency
   within 48 hours, then corrective measures within 72 hours; failing is an offence (reg. 11); digital health
   solutions incl. e-health and telemedicine need Agency certification, providers may not use uncertified ones (regs
   36–38); providers already operating had six months from commencement to apply (reg. 45); fees KES 20,000 to apply,
   KES 50,000 to test an mHealth app, KES 250,000 to test telemedicine. Both Houses' delegated-legislation committees
   recommended amendments, adopted; neither annulled. No commencement clause, so any date is derived. The Act itself
   couldn't be opened on Kenya Law.
2. `laws`: list the marketing rules the entry relies on (`marketing` and `children` cite them): the Kenya Information
   and Communications (Consumer Protection) Regulations 2010 (14 April 2010; reg. 17 applies to any person; reg. 17(3)
   soft opt-in for existing customers; offences up to KES 300,000 or three years, reg. 23(3)); and the Communications
   Authority's Consumer Protection Guidelines ("First Issued July 2022, Re-Issued February 2025"), applying to its
   licensees.
3. `automated_decisions_ai`: pending AI bill missing: Senate Order Paper of 11 June 2026 lists "The Artificial
   Intelligence Bill (Senate Bills No. 4 of 2026)" at Second Reading:
   https://parliament.go.ke/sites/default/files/2026-06/Order%20Paper%20-%20Thursday%2011.06.2026_0.pdf (news in
   October 2026 says the Senate ICT committee recommended rejecting it). Describe as pending.
4. No cybercrime law listed: the Computer Misuse and Cybercrimes Act 2018, amended October 2025; per news, the High
   Court suspended parts of the amendment in October 2025 and in July 2026 struck down s.6(1) and s.27(1). Leads say s.40
   requires reporting cyber attacks within 24 hours, but no official text could be opened (interior.go.ke PDF
   redirects; Kenya Law renders empty): not confirmed.
5. Sources: add page pointers for the Parliament bundle (121 MB, 272-page scan) in notes: Act from p.95 (assent 8
   November 2019, commencement 25 November 2019 on p.99); LN 263 pp.21–65; LN 264 pp.65–80; LN 265 pp.81–93.

### Nits
- `laws` notes: all of LN 265, not just registration, takes effect six months after publication (reg. 1(2)).
- `transfers`: Malabo Convention ratification, a reciprocal agreement and BCRs are deemed safeguards under reg. 42, not
  reg. 41.
- `marketing`: reg. 15(1)'s list ends "; or (e)", so whether its conditions are cumulative is unclear; s.37's express
  consent rule carries the bottom line. Reg. 15(4) makes commercial use without consent an offence (KES 20,000 or six
  months).
- "No amendment to the Act was found": none enacted, but Kenya Law shows a 31 December 2022 version that couldn't be
  opened; a stakeholder Draft Data Protection (Amendment) Bill 2025 reported in May 2025 has no official source.
- Drop the wansom.ai secondary source.

### Confirmed (keep)
2021 regulations (Kenya Gazette Supplement No. 236 of 31 December 2021, LNs 263–265, made 7 December 2021; "February
2022" is the tabling receipt, not a gazette date). Registration start not confirmed (LN 265 reg. 1(2): about 30 June
2022; leave unconfirmed). CA guidelines February 2025 (paras 6.2.2.1, 6.2.2.5, 6.6.11, 6.6.12). Act sections, General
Regulations, Complaints and Registration Regulations, fees, Constitution Art. 260.

## Domains (all official)
nigeriarights.gov.ng (National Human Rights Commission); fmcide.gov.ng (Federal Ministry of Communications, Innovation
and Digital Economy); thencc.org.za (National Consumer Commission); klrc.go.ke (Kenya Law Reform Commission).

## The four Nigeria framework claims (for the framework text, not the entries)
1. Ultra-High tier regardless of volume for listed types: confirmed (Schedule 7 para 3(1)(a): commercial banks,
   telecoms, insurers, multinationals; electricity distribution, oil and gas; public social media and e-mail app
   developers and proprietors; communication device makers, payment gateway providers and fintechs; para 3(1)(b)
   anyone else over 5,000 people in six months). Caveat: designation still needs a filing system plus a para 1(1)
   trigger; a multinational outside listed sectors needs trigger (a) or (b); the list is longer than four kinds; para 6
   exempts some bodies.
2. Art. 18(1)(d) children: confirmed on wording, but "without prejudice to the NDP Act", so s.31(4) exceptions survive;
   "any processing" overstates it.
3. Art. 18(1)(f) ADM: consent before a decision "based solely on automated processing which produces legal effects
   concerning or significantly affecting the data subject" — keep that qualifier. NDPA s.37(2) also allows contract
   necessity or written law with safeguards; s.37(3) human intervention, view, contest; Art. 3(2) the Act prevails.
4. Art. 3(3): "Upon the issuance of the GAID, the Commission shall cease to apply" the NDPR 2019 — confirmed; issued 20
   March 2025, in force 19 September 2025 per the Annual Report.
