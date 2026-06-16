# Vishvakarma.OS — Pilot Proof Plan

**Purpose:** Turn the demo screenshots, investor pack, and handoff metrics into real pilot evidence.

**Pilot target:** 3–5 residential concept review sessions with homeowners, family reviewers, builders, designers, or early pilot partners.

**Core proof question:** Does Vishvakarma.OS help someone understand, explain, and discuss a residential building idea faster before formal drafting begins?

**Truth rule:** This pilot tests concept review and decision-support value only. Do not claim certified building approval, engineering validation, guaranteed council approval, complete CAD/BIM replacement, or fixed construction quoting.

---

## 1. Why this pilot exists

Vishvakarma.OS already has a strong internal evidence chain:

```text
handoff appendices → demo screenshots → investor screenshot pack → operator annex → metrics summary
```

The next value jump requires external proof:

```text
demo evidence → reviewer feedback → pilot evidence → testimonial/usage proof → stronger valuation
```

---

## 2. Pilot audience

| Audience | Why they matter | Target count |
|---|---|---:|
| Homeowner / family reviewer | Tests whether non-technical people understand the idea faster | 1–2 |
| Builder / designer | Tests whether the workflow helps pre-consult explanation | 1–2 |
| Investor / software operator | Tests whether the product story is understandable and credible | 1 |

Keep pilot notes anonymised unless a reviewer gives clear permission to be quoted.

---

## 3. Pilot setup

Before each session:

1. Use a clean browser profile.
2. Confirm the app loads from the current production or preview URL.
3. Open the investor screenshot pack:
   ```text
   docs/demo/VISHVAKARMA_OS_INVESTOR_SCREENSHOT_PACK.md
   ```
4. Confirm the demo screenshots and verifier still pass:
   ```bash
   pnpm run test:screenshots
   node scripts/demo/verify-demo-assets.mjs
   ```
5. Prepare one ready demo path:
   - Family Home 4BR
   - Duplex Two Floor
   - Courtyard Villa / Vastu showcase
6. Keep the safety framing visible:
   - AUD estimates are early estimates only.
   - Compliance is decision-support only.
   - Professional review is still required before construction.

---

## 4. Session structure

Target time: **12–18 minutes**.

| Time | Step | What to show | What to listen for |
|---:|---|---|---|
| 0:00–1:00 | Context | Explain what Vishvakarma.OS is and is not | Does the reviewer understand the promise? |
| 1:00–3:00 | Landing + Projects | Show product story and ready blueprint cards | Does it feel like a real app? |
| 3:00–6:00 | 2D blueprint | Open a demo blueprint and inspect layout | Can they understand rooms, walls, and openings? |
| 6:00–8:00 | 3D preview | Show 3D visual review | Does 3D reduce confusion? |
| 8:00–11:00 | AI proof flow | Show brief → review → concept → estimate → compliance → export | Does AI make the idea easier to explain? |
| 11:00–13:00 | Export preview | Show package/export path | Does it feel shareable and professional? |
| 13:00–18:00 | Feedback | Fill the feedback template | What would make this worth paying for? |

---

## 5. Pilot host script

Use this wording:

> Vishvakarma.OS is an early residential concept review workstation. It helps someone open or generate a design idea, inspect it in 2D, preview it in 3D, review AI-generated reasoning, see an AUD estimate, check decision-support compliance notes, and preview export outputs. It is not certified approval software, engineering validation, or fixed construction quoting.

Then ask:

> As we go through this, I want to know what becomes clearer, what is confusing, and whether this would help before paying for formal drafting or design work.

---

## 6. What to measure

| Metric | How to capture |
|---|---|
| Time to understand the concept | Note when reviewer says they understand the layout |
| 2D clarity | 1–5 rating in feedback template |
| 3D clarity lift | Ask what became clearer after 3D |
| AI proof usefulness | 1–5 rating plus comments |
| AUD estimate usefulness | Useful / not useful / risky / needs better framing |
| Compliance-note usefulness | Useful as early warning / unclear / too risky / not needed |
| Export confidence | Would they share the export preview with someone else? |
| Willingness to pay | Record rough AUD range only if volunteered or answered in template |
| Testimonial permission | Yes / no / anonymous only |

---

## 7. Evidence package per pilot

Keep raw notes private first. Only commit anonymised summaries.

Recommended local evidence folder:

```text
pilot-evidence/YYYY-MM-DD-reviewer-type-short-label/
```

Recommended evidence items:

```text
notes.md
feedback.md
screenshots/
recording-link.txt
permission.txt
```

Do not commit raw recordings, private project details, or identifiable reviewer details unless permission is explicit and the repo/privacy setting is appropriate.

---

## 8. Pass / fail thresholds

### Strong pilot signal

A pilot is strong if at least 3 reviewers say most of the following:

- “I understood the layout faster.”
- “The 3D view helped.”
- “The AI proof flow made the design easier to explain.”
- “The AUD estimate helped as early guidance.”
- “The compliance notes were useful as early warnings.”
- “I would use this before formal drafting.”
- “I would pay, pilot, or recommend this.”

### Weak pilot signal

A pilot is weak if most reviewers say:

- They still do not understand the plan.
- 3D does not help.
- AI proof feels confusing or unsafe.
- AUD estimate creates distrust.
- Compliance notes feel like overclaiming.
- Export preview is not useful.
- They would not use this in a real design conversation.

---

## 9. Decision after first 3–5 pilots

| Result | Next move |
|---|---|
| Strong clarity, weak willingness to pay | Improve pricing, packaging, and target user |
| Strong builder/designer interest | Build pre-consult workflow and outreach page |
| Strong homeowner/family interest | Build guided homeowner-friendly language and simpler onboarding |
| Confusion around compliance/cost | Strengthen disclaimers and explain decision-support better |
| Confusion around editor controls | Improve tutorial/onboarding before adding more features |
| Strong overall signal | Create a pilot evidence summary and testimonial pack |

---

## 10. Pilot evidence summary format

After the first round, create:

```text
docs/pilots/PILOT_EVIDENCE_SUMMARY.md
```

Use this structure:

```text
# Vishvakarma.OS — Pilot Evidence Summary

## Pilot round
- Dates:
- Reviewer types:
- Number of sessions:

## What was tested
- 2D blueprint review
- 3D preview
- AI proof flow
- AUD estimate
- Compliance decision-support notes
- Export preview

## Results
- Average 2D clarity:
- Average 3D usefulness:
- Average AI proof usefulness:
- Willingness to pay signal:
- Main confusion:
- Main value quote:

## Product changes recommended
1.
2.
3.

## Commercial conclusion
- Weak / promising / strong pilot signal
```

---

## 11. Safety checklist

Before using pilot evidence in an investor deck, listing, or public product page:

- [ ] Keep reviewer identity private unless permission is explicit.
- [ ] Remove private project details.
- [ ] Confirm testimonials are approved or anonymised.
- [ ] Confirm AUD prices are framed as estimates, not quotes.
- [ ] Confirm compliance is framed as decision-support only.
- [ ] Confirm no statement says Vishvakarma.OS replaces architects, engineers, certifiers, or council approval.
- [ ] Confirm any recording link is private or permissioned.

---

## 12. Best next product move after pilot

Do not guess. Let the pilot decide.

If the pilot proves clarity, build onboarding and sales packaging.
If the pilot proves builder/designer value, build pre-consult workflows.
If the pilot proves homeowner value, build guided homeowner mode.
If the pilot proves confusion, simplify before adding features.

**Default next value move:**

```text
pilot evidence → testimonial pack → landing page proof section → first paid pilot
```
