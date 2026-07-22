# 🔐 Auth Audit — score 0%


## FAIL

- **perf.image-weight**: public\deity-hero.png = 4038 KB (> 300 KB budget, no AVIF/WebP sibling) — hero art gates first paint — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\deity-hero.png`
  - fix: `fix-snippets/picture-hero.html`

## WARN

- **a11y.contrast**: #000000 on #0b1020 = 1.11:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\index.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #000000 on #0b1020 = 1.11:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-gate.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #010102 on #0b1020 = 1.10:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-vibhuti-obsidian.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #01040b on #0b1020 = 1.08:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-screen.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #01040b on #0b1020 = 1.08:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-divine-architect-theme.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #01050f on #0b1020 = 1.08:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-exact-reference.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #02040c on #0b1020 = 1.08:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-divine-architect-theme.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #020712 on #0b1020 = 1.06:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-screen.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #020712 on #0b1020 = 1.06:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-divine-architect-theme.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #020715 on #0b1020 = 1.06:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-exact-reference.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #020817 on #0b1020 = 1.06:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-exact-reference.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.contrast**: #020817 on #0b1020 = 1.06:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys) — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-match.css`
  - fix: `raise lightness or reserve for decorative/large text`
- **a11y.focus**: outline:none used in 13 place(s) — verify every one has a focus-visible replacement — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-mockup-page.css:440`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\index.css:337`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-exact-reference.css:54`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-match.css:363`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-match.css:376`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-screen.css:75`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-auth-reference-screen.css:527`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-device-unity.css:224`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-3d-polish.css:15`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-3d-polish.css:17`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-chrome.css:306`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-polish.css:48`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-polish.css:55`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-polish.css:56`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-editor-polish.css:262`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ipad-editor-usability.css:246`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ipad-editor-usability.css:257`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ipad-editor-usability.css:270`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ipad-king-polish.css:220`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-landing-showcase-fix.css:113`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-mantra-widget.css:71`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-mantra-widget.css:131`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-marketing.css:147`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ui-display-fixes.css:62`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ui-display-fixes.css:97`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-ui-polish.css:906`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-workspace-polish.css:511`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-workspace-polish.css:599`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-workspace-polish.css:671`
  - fix: `fix-snippets/header-responsive.css`
- **layout.truncation**: nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…') — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\src\styles\vish-workspace-polish.css:705`
  - fix: `fix-snippets/header-responsive.css`

## PASS

- **a11y.alt**: All <img> tags in auth scope carry alt attributes
- **auth.sso-lockin**: SSO plus an email fallback path detected
- **media.autoplay**: No autoplay calls in auth scope
- **perf.image-weight**: public\textures\stone\normal.jpg = 2463 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\stone\normal.jpg`
- **perf.image-weight**: public\textures\grass\normal.jpg = 2283 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\grass\normal.jpg`
- **perf.image-weight**: public\textures\bark\normal.jpg = 2252 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\bark\normal.jpg`
- **perf.image-weight**: public\textures\plaster\normal.jpg = 2098 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\plaster\normal.jpg`
- **perf.image-weight**: public\textures\paint\normal.jpg = 2042 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\paint\normal.jpg`
- **perf.image-weight**: public\textures\fabric\normal.jpg = 2017 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\fabric\normal.jpg`
- **perf.image-weight**: public\textures\concrete\normal.jpg = 1904 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\concrete\normal.jpg`
- **perf.image-weight**: public\textures\bark\color.jpg = 1823 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\bark\color.jpg`
- **perf.image-weight**: public\textures\grass\color.jpg = 1723 KB — `C:\Users\bryso\dev\FUTURE PROJECTS\Vishvakarma-os\vishvakarma-os-live\public\textures\grass\color.jpg`

## INFO

- **ux.consent**: No consent banner code found in auth scope
