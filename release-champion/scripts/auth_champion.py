#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
  VISHVAKARMA.OS — AUTH CHAMPION
  All-in-one auth-page auditor. Static analysis of the sign-in
  surface: layout truncation risk, dev-chip leakage, SSO lock-in,
  consent-banner placement, WCAG contrast, focus states, autoplay,
  image weight, alt text. Emits terminal + JSON + Markdown reports
  and copy-paste fix snippets.

  Usage:   pnpm run audit:auth
           python3 scripts/auth_champion.py [--root .] [--json out.json]
  Exit:    0 = no FAILs, 1 = at least one FAIL (CI-safe).
  Plugs straight into release:champion as an "audit:auth" stage.
  Stdlib only.
═══════════════════════════════════════════════════════════════════
"""

import argparse
import fnmatch
import json
import os
import re
import sys
import time
from pathlib import Path

# ── styling ─────────────────────────────────────────────────────

USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
def c(code, s): return f"\033[{code}m{s}\033[0m" if USE_COLOR else s
def bold(s): return c("1", s)
def dim(s): return c("2", s)
def green(s): return c("32", s)
def red(s): return c("31", s)
def yellow(s): return c("33", s)
def cyan(s): return c("36", s)
def gold(s): return c("38;5;220", s)

BANNER = r"""
     🔐 AUTH CHAMPION — VISHVAKARMA.OS
   sign-in surface audit · layout · a11y · perf
"""

# ── config ──────────────────────────────────────────────────────

DEFAULT_CONFIG = {
    "authGlobs": ["src/**/auth*", "src/**/Auth*", "src/**/signin*", "src/**/SignIn*",
                  "src/**/login*", "src/**/Login*", "src/pages/auth/**", "src/routes/auth/**"],
    "styleGlobs": ["src/**/*.css", "src/**/*.scss", "tailwind.config.*"],
    "assetGlobs": ["public/**/*.png", "public/**/*.jpg", "public/**/*.jpeg",
                   "src/assets/**/*.png", "src/assets/**/*.jpg", "src/assets/**/*.jpeg"],
    "imageBudgetKB": 300,
    "backgroundHex": "#0b1020",
    "reportDir": "docs/release/auth-audit",
    "ignoreDirs": ["node_modules", "dist", ".git", "coverage", "build", ".next"],
}

SEV_ORDER = {"FAIL": 0, "WARN": 1, "PASS": 2, "INFO": 3}

class Finding:
    def __init__(self, check, severity, message, file=None, line=None, fix=None):
        self.check, self.severity, self.message = check, severity, message
        self.file, self.line, self.fix = file, line, fix
    def to_dict(self):
        return {k: v for k, v in vars(self).items() if v is not None}

# ── file collection ─────────────────────────────────────────────

def collect(root: Path, globs, ignore):
    out, seen = [], set()
    for g in globs:
        for p in root.glob(g):
            if p.is_dir():
                for sub in p.rglob("*"):
                    if sub.is_file() and not any(i in sub.parts for i in ignore) and sub not in seen:
                        seen.add(sub); out.append(sub)
            elif p.is_file() and not any(i in p.parts for i in ignore) and p not in seen:
                seen.add(p); out.append(p)
    return out

def read(p: Path) -> str:
    try:
        return p.read_text(errors="ignore")
    except Exception:
        return ""

def grep(files, pattern, flags=re.IGNORECASE):
    rx = re.compile(pattern, flags)
    hits = []
    for f in files:
        for i, line in enumerate(read(f).splitlines(), 1):
            if rx.search(line):
                hits.append((f, i, line.strip()[:160]))
    return hits

# ── WCAG contrast ───────────────────────────────────────────────

def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    try:
        return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
    except ValueError:
        return None

def rel_lum(rgb):
    def lin(v):
        v /= 255
        return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(x) for x in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def contrast(hex1, hex2):
    a, b = hex_to_rgb(hex1), hex_to_rgb(hex2)
    if not a or not b:
        return None
    l1, l2 = sorted((rel_lum(a), rel_lum(b)), reverse=True)
    return (l1 + 0.05) / (l2 + 0.05)

# ── checks ──────────────────────────────────────────────────────

def check_truncation(auth_files, styles):
    f = []
    hits = grep(auth_files + styles, r"text-overflow\s*:\s*ellipsis|textOverflow\s*:\s*[\"']ellipsis|truncate|whitespace-nowrap|white-space\s*:\s*nowrap|whiteSpace\s*:\s*[\"']nowrap")
    for file, line, txt in hits:
        f.append(Finding("layout.truncation", "WARN",
            "nowrap/ellipsis on auth surface — verify tagline/header at 768–1024px widths (observed clipping: 'ENGINEERING • CONS…')",
            str(file), line, "fix-snippets/header-responsive.css"))
    if not hits:
        f.append(Finding("layout.truncation", "INFO",
            "No nowrap/ellipsis patterns found in auth files — clipping may come from a fixed-width container; test at iPad widths anyway."))
    return f

def check_dev_chip(auth_files):
    f = []
    for file in auth_files:
        src = read(file)
        for m in re.finditer(r"QA[\s_-]?EVIDENCE", src, re.IGNORECASE):
            line = src[:m.start()].count("\n") + 1
            window = src[max(0, m.start()-400):m.start()]
            gated = re.search(r"import\.meta\.env\.DEV|process\.env\.NODE_ENV\s*[!=]==?\s*['\"]production['\"]", window)
            f.append(Finding("shipsafe.qa-chip", "PASS" if gated else "FAIL",
                "QA EVIDENCE chip is dev-gated" if gated else
                "QA EVIDENCE chip renders unconditionally — will ship to production sign-in page",
                str(file), line, None if gated else "fix-snippets/dev-gate.tsx"))
    return f

def check_sso_lockin(auth_files):
    f = []
    joined = "\n".join(read(x) for x in auth_files)
    has_google = re.search(r"google", joined, re.IGNORECASE)
    has_fallback = re.search(r"magic[\s_-]?link|sign\s?in with email|email.*(otp|code|link)|password", joined, re.IGNORECASE)
    if has_google and not has_fallback:
        f.append(Finding("auth.sso-lockin", "FAIL",
            "Google SSO is the only sign-in path — Microsoft 365 / plain-email users are locked out",
            fix="fix-snippets/EmailMagicLink.tsx"))
    elif has_google and has_fallback:
        f.append(Finding("auth.sso-lockin", "PASS", "SSO plus an email fallback path detected"))
    else:
        f.append(Finding("auth.sso-lockin", "INFO", "Could not identify provider buttons in auth files"))
    return f

def check_consent_banner(auth_files, styles):
    f = []
    hits = grep(auth_files + styles, r"(consent|analytics|cookie).{0,200}")
    banner_files = {h[0] for h in hits}
    if not banner_files:
        return [Finding("ux.consent", "INFO", "No consent banner code found in auth scope")]
    fullwidth = grep(list(banner_files), r"(width\s*:\s*100%|w-full|inset-x-0|left-0.*right-0)")
    if fullwidth:
        file, line, _ = fullwidth[0]
        f.append(Finding("ux.consent", "WARN",
            "Consent banner appears full-width — it covers the Atharva Veda quote; convert to bottom-right toast",
            str(file), line, "fix-snippets/consent-toast.css"))
    else:
        f.append(Finding("ux.consent", "PASS", "Consent banner is not full-width"))
    return f

def check_contrast(styles, bg):
    f = []
    pairs = set()
    for file in styles:
        for m in re.finditer(r"#(?:[0-9a-fA-F]{3}){1,2}\b", read(file)):
            pairs.add((m.group(0).lower(), str(file)))
    weak = []
    for hexv, file in sorted(pairs):
        ratio = contrast(hexv, bg)
        if ratio and ratio < 4.5 and hexv != bg.lower():
            weak.append((hexv, ratio, file))
    for hexv, ratio, file in weak[:12]:
        f.append(Finding("a11y.contrast", "WARN",
            f"{hexv} on {bg} = {ratio:.2f}:1 (< 4.5:1 AA) — fails if used for body/small text ('Need access?' style greys)",
            file, fix="raise lightness or reserve for decorative/large text"))
    if not weak:
        f.append(Finding("a11y.contrast", "PASS", f"No sub-AA colors found against {bg}"))
    return f

def check_focus(auth_files, styles):
    f = []
    stripped = grep(auth_files + styles, r"outline\s*:\s*(none|0)|focus:outline-none")
    restored = grep(auth_files + styles, r"focus-visible|focus:ring|:focus\s*\{")
    if stripped and not restored:
        file, line, _ = stripped[0]
        f.append(Finding("a11y.focus", "FAIL",
            "Focus outline removed with no replacement — SSO button invisible to keyboard users",
            str(file), line, "fix-snippets/focus-ring.css"))
    elif stripped:
        f.append(Finding("a11y.focus", "WARN",
            f"outline:none used in {len(stripped)} place(s) — verify every one has a focus-visible replacement",
            str(stripped[0][0]), stripped[0][1]))
    else:
        f.append(Finding("a11y.focus", "PASS", "No stripped focus outlines detected"))
    # loading state on submit
    if not grep(auth_files, r"isLoading|loading|pending|spinner|disabled=\{"):
        f.append(Finding("ux.loading", "WARN",
            "No loading/disabled state found on auth actions — OAuth redirect will feel broken",
            fix="fix-snippets/sso-button-states.tsx"))
    return f

def check_autoplay(auth_files):
    f = []
    hits = grep(auth_files, r"\bautoplay\b|autoPlay|\.play\(\)")
    for file, line, txt in hits:
        f.append(Finding("media.autoplay", "WARN",
            f"Audio/video play call on auth surface — Safari/iPad blocks pre-gesture playback: `{txt}`",
            str(file), line, "gate behind a user click (Voice Tour / music button)"))
    if not hits:
        f.append(Finding("media.autoplay", "PASS", "No autoplay calls in auth scope"))
    return f

def check_images(root, asset_files, auth_files, budget_kb):
    f = []
    heavy = []
    for p in asset_files:
        kb = p.stat().st_size / 1024
        if kb > budget_kb:
            heavy.append((p, kb))
    for p, kb in sorted(heavy, key=lambda x: -x[1])[:10]:
        modern = p.with_suffix(".avif").exists() or p.with_suffix(".webp").exists()
        f.append(Finding("perf.image-weight", "PASS" if modern else "FAIL",
            f"{p.relative_to(root)} = {kb:.0f} KB" + ("" if modern else f" (> {budget_kb} KB budget, no AVIF/WebP sibling) — hero art gates first paint"),
            str(p), fix=None if modern else "fix-snippets/picture-hero.html"))
    if not heavy:
        f.append(Finding("perf.image-weight", "PASS", f"All images under {budget_kb} KB"))
    # alt text
    bare = grep(auth_files, r"<img(?![^>]*\balt=)[^>]*>")
    for file, line, txt in bare[:8]:
        f.append(Finding("a11y.alt", "FAIL", "img without alt attribute (decorative art needs alt=\"\")",
                         str(file), line, 'add alt="" for decorative, descriptive alt otherwise'))
    if not bare:
        f.append(Finding("a11y.alt", "PASS", "All <img> tags in auth scope carry alt attributes"))
    return f

# ── reporting ───────────────────────────────────────────────────

def print_report(findings, elapsed):
    print(gold(BANNER))
    counts = {"FAIL": 0, "WARN": 0, "PASS": 0, "INFO": 0}
    findings.sort(key=lambda x: (SEV_ORDER[x.severity], x.check))
    for fd in findings:
        counts[fd.severity] += 1
        mark = {"FAIL": red("✘ FAIL"), "WARN": yellow("⚠ WARN"),
                "PASS": green("✔ PASS"), "INFO": dim("· INFO")}[fd.severity]
        loc = dim(f"  {Path(fd.file).name}:{fd.line}" if fd.file and fd.line else (f"  {Path(fd.file).name}" if fd.file else ""))
        print(f" {mark} {cyan(fd.check):<28} {fd.message}{loc}")
        if fd.fix:
            print(f"        {dim('fix →')} {gold(fd.fix)}")
    print()
    score = 100 if counts["FAIL"] == 0 else max(0, 100 - counts["FAIL"] * 15 - counts["WARN"] * 3)
    bar = "█" * (score * 29 // 100) + "░" * (29 - score * 29 // 100)
    print(f" {bold('AUTH READINESS')}\n {(gold if counts['FAIL']==0 else red)(bar)} {score}%")
    print(f" {green(str(counts['PASS'])+' pass')} · {yellow(str(counts['WARN'])+' warn')} · {red(str(counts['FAIL'])+' fail')} · {dim(f'{elapsed:.1f}s')}\n")
    return counts, score

def write_reports(report_dir: Path, findings, counts, score):
    report_dir.mkdir(parents=True, exist_ok=True)
    payload = {"tool": "auth_champion", "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
               "score": score, "counts": counts,
               "findings": [f.to_dict() for f in findings]}
    (report_dir / "auth-report.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    md = [f"# 🔐 Auth Audit — score {score}%\n"]
    for sev in ("FAIL", "WARN", "PASS", "INFO"):
        group = [f for f in findings if f.severity == sev]
        if not group:
            continue
        md.append(f"\n## {sev}\n")
        for fd in group:
            loc = f" — `{fd.file}:{fd.line}`" if fd.file and fd.line else (f" — `{fd.file}`" if fd.file else "")
            fix = f"\n  - fix: `{fd.fix}`" if fd.fix else ""
            md.append(f"- **{fd.check}**: {fd.message}{loc}{fix}")
    (report_dir / "auth-report.md").write_text("\n".join(md) + "\n", encoding="utf-8")
    return report_dir

# ── main ────────────────────────────────────────────────────────

def main():
    global USE_COLOR
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default=".")
    ap.add_argument("--config", default="auth-champion.config.json")
    ap.add_argument("--no-color", action="store_true")
    args = ap.parse_args()
    if args.no_color:
        USE_COLOR = False

    root = Path(args.root).resolve()
    cfg = dict(DEFAULT_CONFIG)
    cfg_path = root / args.config
    if cfg_path.exists():
        cfg.update(json.loads(cfg_path.read_text()))

    ig = cfg["ignoreDirs"]
    auth_files = collect(root, cfg["authGlobs"], ig)
    styles = collect(root, cfg["styleGlobs"], ig)
    assets = collect(root, cfg["assetGlobs"], ig)

    t0 = time.time()
    findings = []
    if not auth_files:
        findings.append(Finding("scope", "WARN",
            f"No auth files matched {cfg['authGlobs']} — set authGlobs in {args.config}"))
    findings += check_truncation(auth_files, styles)
    findings += check_dev_chip(auth_files)
    findings += check_sso_lockin(auth_files)
    findings += check_consent_banner(auth_files, styles)
    findings += check_contrast(styles, cfg["backgroundHex"])
    findings += check_focus(auth_files, styles)
    findings += check_autoplay(auth_files)
    findings += check_images(root, assets, auth_files, cfg["imageBudgetKB"])
    elapsed = time.time() - t0

    counts, score = print_report(findings, elapsed)
    out = write_reports(root / cfg["reportDir"], findings, counts, score)
    print(f" Reports: {cyan(str(out))}\n")
    sys.exit(1 if counts["FAIL"] else 0)

if __name__ == "__main__":
    main()


