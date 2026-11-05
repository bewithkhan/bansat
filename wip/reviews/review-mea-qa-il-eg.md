# Review: qa, il, eg (Bansat MEA law registry)

Short version: Egypt — none of its 13 obligations can be checked against an official source the reviewer could open
(Blocker). Israel — the regulator URL opens a "site not found" error page (Blocker); the claim that s. 30A was never
changed again is wrong. Qatar — no wrong numbers or dates; out-of-date status for the children's bill, a regulator unit
name no official text gives, and QFC gaps. Reviewer's working files:
/tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/rev-mea3/

## Qatar (qa)
1. Should fix · `laws[3]` (children's digital protection proposal) out of date. Still pending (`draft` right), but moved
   past the 2 June committee report. QNA headline 14 Oct 2026: "Qatar Cabinet … Approves Draft Child Protection Laws"
   (qna.org.qa/en/News-Area/News/2026-10/14/…; body loads by script). Hukoomi has a matching headline (403 maintenance).
   News leads: The Peninsula (17 Jun 2026) Cabinet reviewed the Shura proposal and sent it for study, would limit
   under-16s' use of digital platforms; Qatar Tribune (15 Oct 2026) Cabinet approved a draft law on digital child
   protection. The 18 May referral is confirmed at shura.qa/en/Pages/MediaCenter/News/18052026 (not cited by the entry).
   Fix: a government draft law approved by the Cabinet on 14 Oct 2026, pending legislative review; cite QNA and the
   18052026 page.
2. Should fix · `regulators[0]` "Personal Data Privacy Protection Department": no official text uses that name (NCSA
   page title is just "Personal Data Privacy Protection"; the name is in the URL slug and news). NCSA guidelines (v2.0,
   Sept 2022, "Legal mandate") say under Amiri Decision No. 1 of 2021 the "National Cyber Governance and Assurance
   Affairs" is the competent department for Law 13/2016. Fix: name the regulator "National Cyber Security Agency
   (NCSA)"; notes say its guidelines name the National Cyber Governance and Assurance Affairs as the competent
   department. Nit: `scope` calls the NCSA the "competent authority"; the law's term for the regulator is "Competent
   Department".
3. Should fix · `laws[2]` Cybercrime Law: no start date for Law 11/2025. Al Meezan (MOJ): issued 21 Jul 2025, Gazette
   No. 20 of 2025 on 4 Aug 2025; Art. 2 sets no start date, so Constitution Art. 142 gives 4 Sep 2025 (derived). Al
   Meezan's "effective date" fields are unreliable (shows 21 Jul 2025 for 11/2025; 2 Oct 2014 for 14/2014, whose correct
   derived date 2 Nov 2014 the entry has). Fix: add "Law 11/2025 in force 4 Sep 2025, derived the same way" and note the
   field disagrees. Nit: add Art. 8 bis penalty (up to 1 year and/or QAR 100,000) and Art. 47 (fine up to QAR 500,000
   for breaching Art. 21).
4. Should fix · `cookies` says more than the guideline: the NCSA direct marketing guideline (Electronic.pdf, p. 6)
   requires opt-in only for direct-marketing or targeting cookies. Limit the summary to advertising or targeting
   cookies that aren't strictly necessary.
5. Should fix · QFC side missing from `dpia`, `registration_or_fees`, `children`, `marketing` (scope correctly says who
   follows QFC rules, Art. 7 and Art. 2). QFC DPO Guidance v3.1 reproduces Art. 27 (mandatory DPIA before high-risk
   processing: significant automated decisions, large-scale sensitive data, large-scale monitoring of public areas) and
   Art. 12(2) (a DPO permit route for sensitive data). Add QFC lines. Nit: the regulations' own text is at
   qfcra-en.thomsonreuters.com (VER3), not in sources.yaml, so keep the guidance as the cited source.
6. Nit · `breach_notice`: NCSA guideline (NO.pdf) applies its 72-hour expectation to notifying individuals as well as
   the NCSA. Say so; no `value` is right (the law sets no deadline).
7. On almeezan.qa: acceptable (MOJ canonical portal; data from api.moj.gov.qa). The gazette scan is the better text copy
   (files.almeezan.gov.qa/…80d3dd1d….pdf, "copy of the Official Gazette", Issue 15/2016, p. 3). English copy:
   files.almeezan.gov.qa/almeezan/a495e974-1b2c-4751-9f3b-6c6269dcc41c.pdf. Warning: the data service has an "Executive
   Regulations for the Organization of Personal Data Protection" (Law No. 20 of 2026) record with no gazette and
   placeholder text — a test record; don't use it.
Confirmed: Gazette 15/2016 (29 Dec 2016; issued 3 Nov 2016); Art. 142; PDPPL Art. 32, in force 29 Jan 2017; Art. 30 and
Cabinet Decision 1/2018; no PDPPL amendments; Cybercrime Law 14/2014 in force 2 Nov 2014; Arts. 21, 8 bis, 23–26; the
listed articles; NCSA guidance claims; NCSA slugs; QFC v3 in force 6 Dec 2023, child under 18, Art. 31, USD 1,500,000;
Shura AI motion 27 Apr 2026.

## Israel (il)
1. BLOCKER · `regulators[0].url` and the `dpia` source/claim (mojforms.justice.gov.il/…/dpiaform.html): HTTP 200 but
   gov.il's error page (title "שגיאה", "the requested site was not found"); WebFetch refused (robots). So the regulator
   URL doesn't identify the regulator and "The Authority offers an online risk tool" has no support. Fix: use
   https://www.gov.il/en/departments/the_privacy_protection_authority (403 to automated access like all gov.il HTML).
   Drop the tool sentence or cite a working page.
2. Should fix · `laws[3]` notes say no later change to s. 30A: one exists. Communications Law (Amendment No. 76),
   5782-2022, Sefer HaChukim 2985, 4 Jul 2022 (fs.knesset.gov.il/24/law/24_lsr_644019.pdf), s. 61 amends s. 30A (adds
   "or terminal equipment" to the heading, the autodialler definition and subsection (12); deletes "public" from the
   "short message" definition; rewrites "advertiser"). In force 2 Oct 2022, possible deferral. Fix: list it; cite a
   consolidated text if found.
3. Should fix · `dpo`/`penalties`: the DPO fine (s. 23KF(d)(1)(c)) covers only s. 17B1(a)(1) public bodies and (a)(2)
   data brokers; monitoring and special-sensitivity entities ((3), (4)) have the duty but no direct fine; Schedule 5
   para. 2(4) gives them a 10% reduction if they appoint before a notice. The separate data security officer duty
   (s. 17B) is missing. Nit: the 14 Jul 2026 opinion allows an external service provider (paras. 16, 18) if an
   individual.
4. Should fix · `penalties`, statutory damages: NIS 50,000 cap is CPI-indexed monthly from a May 2007 base (s. 29A(d)).
   Say "NIS 50,000 (CPI-indexed)"; applies in civil claims (s. 4) and on criminal conviction (s. 5).
5. Should fix · `laws` leaves out transfer rules: the Transfer of Data to Databases Abroad Regulations 2001 and the EEA
   Regulations 5783-2023 (signed and published May 2023; apply three months after publication to new EEA data — early
   August 2023 per the PPA — and one year after publication to earlier EEA data; from 1 Jan 2025 also other data in the
   same database). Exact publication day not found: omit `in_force_from` or derive and say so.
6. Nits: `cookies` — the Feb 2026 consent opinion never mentions cookies; say the summary applies its general rules.
   `scope` — the 100,000-name exclusion applies only if the owner holds no other collection on the same people. `dpia` —
   the PIA guide is from Dec 2022, before Amendment 13.
Confirmed: Act SH 1011 (11 Mar 1981); Amendment 13 SH 3287 (14 Aug 2024), in force 14 Aug 2025; s. 8A; 30-day notice;
s. 17B1; s. 11; consent definition; 23KF amounts; indexing; caps; 5% turnover; Data Security Regulations (KT 7809, in
force 8 May 2018), reg. 11, reg. 2, reg. 5, fines; Amendment 40 (in force 1 Dec 2008; NIS 1,000 per message); PPA
documents and dates. gov.il HTML 403, BlobFolder PDFs load.

## Egypt (eg)
1. BLOCKER · no official source the reviewer could open supports any obligation. All 13 cite only pdpc.gov.eg/guidelines
   and /faq, plus cc.gov.eg twice. pdpc.gov.eg returns the same 7.5 KB page for every path (content via a sign-in token
   service). Court of Cassation records hold only metadata. Fix: deep-link the gazette scans and specific PDPC guideline
   or FAQ files, or another official copy, for each claim. As a lead only, Andersen Egypt's translation
   (eg.andersen.com/…/2026/02/Law-No.-151-of-2020.pdf) matches the entry's numbers (issuing Arts. 6–7; fines Arts.
   36–45, doubling Art. 48, settlement Art. 49; Art. 26 caps EGP 2,000,000 / 500,000; Regulations Art. 5 72 hours,
   immediately for national security, three business days to individuals; Regulations Art. 15 under 15 guardian's
   written consent, 15–18 guardian's consent submitted by child or guardian; Regulations Art. 18 marketing licence,
   explicit consent, deletion on withdrawal; Decision Art. 2). Leaving `consent_age` without a value is right. Nit:
   translated law Art. 18 refers to "consent or non-objection".
   If no official copy can be opened for a claim, the brief applies: take it out, or say plainly "reported by …; the
   official text couldn't be opened" with the lead under `secondary`.
2. Should fix · `registration_or_fees`: top fee (over 5 million records) is EGP 666,666 a year, or EGP 2,000,000 over a
   three-year licence; controller-only or processor-only licences pay 50% (lead translation of the fee schedule). State
   the yearly figure.
3. Should fix · `laws[1]` notes say no amendment found in the Court of Cassation records; that record's own title says
   "(محدثا حتي عام 2026)" ("updated until 2026"). cc.gov.eg/legislation/3269947493 also confirms No. 816/2025,
   publication 2025-11-01, issue 244. Check whether a 2026 amending decision exists before saying none.
4. Should fix · `laws[3]`/`automated_decisions_ai`: the March 2026 AI guide (ai.gov.eg; EG-NCAI-GOV-FW-2026-02, v2.0,
   15 Mar 2026) says it sets "binding requirements for high-risk systems": before market, an AI Ethical Impact
   Assessment and a TEVV audit ("Dual-Check"); sector regulators enforce with the NCAI. Keep `status: none`, but tell
   builders about these and that their legal force is unclear.
5. Should fix · `laws[0]` notes, grace period: leads disagree (31 Oct 2026: Baker McKenzie 7 Oct 2026, Clyde & Co Jan
   2026; 1 Nov 2026: Mondaq May 2026, Digital Policy Alert). Depends on the decision's issue date. Say sources differ,
   it has now passed, no extension found. Baker McKenzie reports the PDPC licensing portal opened in October 2026.
6. Nits: Law 151's start date 16 Oct 2020 follows the rule as translated (Cassation confirms publication 15 Jul 2020);
   leads give 15 and 17 Oct — note it. Gazette suffixes "28 bis (h)" and "244 cont. (A)" aren't in the Cassation
   records (only 28 and 244). Art. 36 aggravated penalty: at least six months and a fine of EGP 200,000 to 2,000,000, or
   either one. Representative-in-Egypt duty is in the law itself (Arts. 4 and 5), not only the regulations. Cybercrime
   Art. 2 also covers content data under the provider's control and technical help for national security bodies.
Confirmed: Cassation metadata for Law 151 (15 Jul 2020, issue 28) and Decision 816/2025 (1 Nov 2025, issue 244);
Cybercrime Law 175/2018 (gazette 32 bis (c), 14 Aug 2018; Art. 45, in force 15 Aug 2018; Art. 2; Art. 33); AI guide.
