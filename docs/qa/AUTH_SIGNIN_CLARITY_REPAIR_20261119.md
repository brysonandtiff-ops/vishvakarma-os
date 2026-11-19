# Vishvakarma.OS — Owner-approved Sign-in UI Repair

Date: 19 November 2026, Australia/Perth.
Source: existing private Git branch for Vishvakarma.OS PR #210.

## Owner goal
Make the real sign-in page beautiful, legible, and simple for a first-time iPad user. Preserve original approved artwork, historical architecture and invitation-only account security.

## Baseline public QA
Genuine TinyFish read-only browser run: https://agent.tinyfish.ai/runs/31d49872-dac3-4a8b-94a2-eead8a7067b7.
At 968×939 (desktop browser), found (a) top-right brand tagline clipped mid-word, (b) email validation help not visibly associated with the input, and (c) original logo not apparent in left brand zone. Signed-in login, signup, real iPad, save/reopen and physical-device media were not verified.

## Repair — source truth
- Reuses the owner-approved swan/V logo from the existing OFFICIAL_LOGO_SRC for both left and right panels. Deity painting, Om, approved background, gold/navy layout, and artwork are preserved.
- Wrapping two-line header rather than clipping an absolute text block at narrow desktop/tablet widths.
- Makes short owner-facing sign-in help visible, not CSS-clipped; explicitly describes private invitation instead of implying open sign-up.
- Email errors appear beside the email field using role=alert, aria-invalid and aria-describedby, while Google errors and successful messages use one non-duplicated feedback area.
- Existing OAuth/email handlers, submission, login data-testids and protected route behaviour are preserved, with Google SSO label unchanged to avoid breaking source-backed contracts.
- Adds public Privacy, Terms and Home links and touch-friendly focus/keyboard controls.
- Email edits clear stale warnings; input remains 16px to avoid iOS autozoom; restricted mode still disables actions when backend config is missing.
- One brand CSS layer loaded last to avoid rewrites to nine historical locked files; targeted React tests are wired into the Cloudflare focused build.

## Mandatory release truth
This is a draft PR only, with no live login/role mutation, new account, billing, DNS or production deploy. Browser screenshot, responsive physical-iPad, actual SSO/email sending and private tenant data validation require independently collected proof. Issues #153 (security) and #188 (recoverable encrypted backup) remain stop-ship. Never call a generated concept or merely present control functional proof.
