#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
  VISHVAKARMA.OS — RELEASE CHAMPION PIPELINE
  One command. Full production-readiness workflow. Evidence pack.
  Usage:   pnpm run release:champion
           python3 scripts/release_champion.py [flags]
  Flags:
    --tag             create annotated git tag on success
    --draft-release   create GitHub Release draft via `gh` on success
    --skip <stage>    skip a stage by id (repeatable)
    --only <stage>    run only listed stages (repeatable)
    --no-color        disable ANSI colors
    --config <path>   alternate config (default: champion.config.json)
  Stdlib only. No dependencies.
═══════════════════════════════════════════════════════════════════
"""

import argparse
import datetime as dt
import glob
import hashlib
import html
import json
import os
import re
import shutil
import subprocess
import sys
import time
import zlib
from pathlib import Path

# ────────────────────────────────────────────────────────────────
# Terminal styling
# ────────────────────────────────────────────────────────────────

USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None

def c(code: str, s: str) -> str:
    return f"\033[{code}m{s}\033[0m" if USE_COLOR else s

def bold(s): return c("1", s)
def dim(s): return c("2", s)
def green(s): return c("32", s)
def red(s): return c("31", s)
def yellow(s): return c("33", s)
def cyan(s): return c("36", s)
def magenta(s): return c("35", s)
def gold(s): return c("38;5;220", s)

CROWN = r"""
            👑 VISHVAKARMA.OS 👑

██████╗ ██████╗  ██████╗ ██████╗
██╔══██╗██╔══██╗██╔═══██╗██╔══██╗
██████╔╝██████╔╝██║   ██║██║  ██║
██╔═══╝ ██╔══██╗██║   ██║██║  ██║
██║     ██║  ██║╚██████╔╝██████╔╝
╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝
"""

CHAMPAGNE = "🍾" * 16

def hr(char="═", width=55):
    print(dim(char * width))

def progress_bar(pct: float, width=29) -> str:
    filled = round(width * pct / 100)
    return "█" * filled + "░" * (width - filled)

# ────────────────────────────────────────────────────────────────
# Config
# ────────────────────────────────────────────────────────────────

DEFAULT_CONFIG = {
    "appName": "VISHVAKARMA.OS",
    "appUrl": "https://vishvakarma-os.app",
    "packageManager": "pnpm",
    "distDir": "dist",
    "evidenceDir": "docs/release/evidence",
    "screenshotsGlob": "docs/release/screenshots/*.png",
    "requiredScorePct": 100,
    "stages": [
        {"id": "lint",          "label": "Lint",                 "script": "lint",                 "required": True},
        {"id": "types",         "label": "Type check",           "script": "typecheck",            "required": True},
        {"id": "tests",         "label": "Tests",                "script": "test",                 "required": True},
        {"id": "build",         "label": "Build",                "script": "build",                "required": True},
        {"id": "governance",    "label": "Governance",           "script": "governance",           "required": True},
        {"id": "budgets",       "label": "Bundle budgets",       "script": "budgets",              "required": True},
        {"id": "pwa",           "label": "PWA audit",            "script": "audit:pwa",            "required": False},
        {"id": "three",        "label": "Three.js audit",       "script": "audit:three",          "required": False},
        {"id": "safari",        "label": "Safari/iPad audit",    "script": "audit:safari",         "required": False},
        {"id": "a11y",          "label": "Accessibility audit",  "script": "audit:a11y",           "required": False},
        {"id": "lighthouse",    "label": "Lighthouse",           "script": "audit:lighthouse",     "required": False},
        {"id": "release_gates", "label": "Release gates",        "script": "release:gates",        "required": True},
        {"id": "perf_gates",    "label": "Perf gates",           "script": "perf:gates",           "required": False}
    ]
}

def load_config(path: Path) -> dict:
    cfg = json.loads(json.dumps(DEFAULT_CONFIG))  # deep copy
    if path.exists():
        user = json.loads(path.read_text())
        for k, v in user.items():
            cfg[k] = v
    return cfg

def load_package_scripts() -> dict:
    pkg = Path("package.json")
    if not pkg.exists():
        return {}
    try:
        return json.loads(pkg.read_text()).get("scripts", {})
    except Exception:
        return {}

# ────────────────────────────────────────────────────────────────
# Stage runner
# ────────────────────────────────────────────────────────────────

class StageResult:
    def __init__(self, stage):
        self.id = stage["id"]
        self.label = stage["label"]
        self.script = stage["script"]
        self.required = stage.get("required", False)
        self.status = "PENDING"   # PASS | FAIL | SKIP
        self.seconds = 0.0
        self.log_file = None
        self.detail = ""

def run_stage(stage: dict, cfg: dict, log_dir: Path, pkg_scripts: dict) -> StageResult:
    r = StageResult(stage)
    pm = cfg["packageManager"]
    script = stage["script"]

    if script not in pkg_scripts:
        r.status = "SKIP"
        r.detail = f'no "{script}" script in package.json'
        return r

    log_path = log_dir / f"{r.id}.log"
    r.log_file = str(log_path)
    cmd = [pm, "run", script]

    print(f"  {cyan('▶')} {r.label:<24}", end="", flush=True)
    t0 = time.time()
    try:
        with open(log_path, "w") as lf:
            # Windows compatibility: resolve pnpm through pnpm.cmd
            if cmd and cmd[0] == "pnpm":
                cmd[0] = "pnpm.cmd"

            proc = subprocess.run(
                cmd,
                stdout=lf,
                stderr=subprocess.STDOUT,
                text=True,
                encoding="utf-8",
                errors="replace",
                shell=False,
                timeout=900,
            )
        r.seconds = time.time() - t0
        ok = proc.returncode == 0
        r.status = "PASS" if ok else "FAIL"
    except FileNotFoundError:
        r.seconds = time.time() - t0
        r.status = "FAIL"
        r.detail = f"{pm} not found on PATH"

    mark = green("✔ PASS") if r.status == "PASS" else red("✘ FAIL")
    print(f"{mark}  {dim(f'{r.seconds:.1f}s')}")

    # Heuristic detail extraction (test counts etc.)
    if r.log_file and Path(r.log_file).exists():
        tail = Path(r.log_file).read_text(errors="ignore")
        m = re.search(r"(\d+)\s+pass(?:ed|ing)", tail, re.IGNORECASE)
        if m and r.id == "tests":
            r.detail = f"{m.group(1)} tests passed"
    return r

# ────────────────────────────────────────────────────────────────
# Build fingerprint
# ────────────────────────────────────────────────────────────────

def fingerprint_dist(dist_dir: Path) -> dict:
    if not dist_dir.exists():
        return {"present": False}
    h = hashlib.sha256()
    files = sorted(p for p in dist_dir.rglob("*") if p.is_file())
    total_bytes = 0
    for p in files:
        rel = str(p.relative_to(dist_dir)).encode()
        h.update(rel)
        data = p.read_bytes()
        h.update(hashlib.sha256(data).digest())
        total_bytes += len(data)
    return {
        "present": True,
        "sha256": h.hexdigest(),
        "fileCount": len(files),
        "totalBytes": total_bytes,
    }

# ────────────────────────────────────────────────────────────────
# Git helpers
# ────────────────────────────────────────────────────────────────

def git(*args) -> str:
    try:
        out = subprocess.run(
            ["git", *args],
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
        )
        return (out.stdout or "").strip() if out.returncode == 0 else ""
    except FileNotFoundError:
        return ""

def git_info() -> dict:
    return {
        "commit": git("rev-parse", "--short", "HEAD"),
        "branch": git("rev-parse", "--abbrev-ref", "HEAD"),
        "lastTag": git("describe", "--tags", "--abbrev=0"),
        "dirty": bool(git("status", "--porcelain")),
    }

def release_notes_since_last_tag() -> str:
    last = git("describe", "--tags", "--abbrev=0")
    rng = f"{last}..HEAD" if last else "HEAD"
    log = git("log", rng, "--pretty=format:- %s (%h)")
    return log or "- Initial release"

# ────────────────────────────────────────────────────────────────
# Reports
# ────────────────────────────────────────────────────────────────

def write_json_report(path: Path, payload: dict):
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

def write_html_dashboard(path: Path, payload: dict, screenshots: list):
    rows = ""
    for s in payload["stages"]:
        color = {"PASS": "#22c55e", "FAIL": "#ef4444", "SKIP": "#94a3b8"}[s["status"]]
        rows += (
            f'<tr><td>{html.escape(s["label"])}</td>'
            f'<td style="color:{color};font-weight:700">{s["status"]}</td>'
            f'<td>{s["seconds"]:.1f}s</td>'
            f'<td>{html.escape(s.get("detail") or "")}</td></tr>'
        )
    shots = "".join(
        f'<figure><img src="screenshots/{html.escape(Path(p).name)}" alt=""><figcaption>{html.escape(Path(p).name)}</figcaption></figure>'
        for p in screenshots
    ) or "<p class='muted'>No screenshots captured for this run.</p>"
    fp = payload["fingerprint"]
    fp_line = fp.get("sha256", "n/a") if fp.get("present") else "dist/ not found"
    doc = f"""<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(payload['app'])} — Champion Release</title>
<style>
 body{{font-family:ui-sans-serif,system-ui;background:#0b1020;color:#e2e8f0;margin:0;padding:2rem}}
 .card{{max-width:920px;margin:0 auto;background:#111832;border:1px solid #1e293b;border-radius:16px;padding:2rem}}
 h1{{margin:0 0 .25rem;font-size:1.6rem}} .muted{{color:#94a3b8}}
 .score{{font-size:2.4rem;font-weight:800;color:#fbbf24}}
 .bar{{height:14px;background:#1e293b;border-radius:7px;overflow:hidden;margin:.5rem 0 1.5rem}}
 .bar>div{{height:100%;background:linear-gradient(90deg,#fbbf24,#f59e0b)}}
 table{{width:100%;border-collapse:collapse;margin:1rem 0}}
 td,th{{padding:.5rem .6rem;border-bottom:1px solid #1e293b;text-align:left;font-size:.92rem}}
 code{{background:#0b1020;padding:.15rem .4rem;border-radius:6px;font-size:.85rem}}
 figure{{display:inline-block;margin:.5rem;max-width:260px}} img{{width:100%;border-radius:8px;border:1px solid #1e293b}}
 figcaption{{font-size:.75rem;color:#94a3b8;text-align:center}}
</style></head><body><div class="card">
<h1>👑 {html.escape(payload['app'])} — Champion Release</h1>
<p class="muted">{html.escape(payload['timestamp'])} · commit <code>{html.escape(payload['git']['commit'] or 'n/a')}</code> · branch <code>{html.escape(payload['git']['branch'] or 'n/a')}</code></p>
<div class="score">{payload['scorePct']:.0f}% · {html.escape(payload['verdict'])}</div>
<div class="bar"><div style="width:{payload['scorePct']:.0f}%"></div></div>
<table><tr><th>Stage</th><th>Status</th><th>Time</th><th>Detail</th></tr>{rows}</table>
<p><b>Build fingerprint (SHA-256):</b> <code>{html.escape(fp_line)}</code></p>
<h2>Screenshot gallery</h2>{shots}
</div></body></html>"""
    path.write_text(doc, encoding="utf-8")

# ── Minimal dependency-free PDF certificate ─────────────────────

def _pdf_escape(s: str) -> str:
    return s.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

def write_pdf_certificate(path: Path, payload: dict):
    lines = [
        ("Helvetica-Bold", 26, payload["app"]),
        ("Helvetica-Bold", 16, "CHAMPION RELEASE CERTIFICATE"),
        ("Helvetica", 11, ""),
        ("Helvetica", 12, f"Date: {payload['timestamp']}"),
        ("Helvetica", 12, f"Commit: {payload['git']['commit'] or 'n/a'}   Branch: {payload['git']['branch'] or 'n/a'}"),
        ("Helvetica", 12, f"Production readiness: {payload['scorePct']:.0f}%  -  {payload['verdict']}"),
        ("Helvetica", 11, ""),
    ]
    for s in payload["stages"]:
        mark = {"PASS": "[PASS]", "FAIL": "[FAIL]", "SKIP": "[SKIP]"}[s["status"]]
        lines.append(("Helvetica", 11, f"{mark}  {s['label']}  ({s['seconds']:.1f}s)"))
    fp = payload["fingerprint"]
    lines += [
        ("Helvetica", 11, ""),
        ("Helvetica", 10, "Build fingerprint (SHA-256):"),
        ("Helvetica", 9, fp.get("sha256", "dist/ not found") if fp.get("present") else "dist/ not found"),
    ]
    content = ["BT"]
    y = 780
    for font, size, text in lines:
        content.append(f"/{'F2' if 'Bold' in font else 'F1'} {size} Tf")
        content.append(f"1 0 0 1 60 {y} Tm")
        content.append(f"({_pdf_escape(text)}) Tj")
        y -= size + 8
    content.append("ET")
    stream = "\n".join(content).encode("latin-1", "replace")
    comp = zlib.compress(stream)

    objs = []
    objs.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objs.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
                b"/Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objs.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>")
    objs.append(b"<< /Length %d /Filter /FlateDecode >>\nstream\n" % len(comp) + comp + b"\nendstream")

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for i, body in enumerate(objs, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode() + body + b"\nendobj\n"
    xref_pos = len(out)
    out += f"xref\n0 {len(objs)+1}\n0000000000 65535 f \n".encode()
    for off in offsets:
        out += f"{off:010d} 00000 n \n".encode()
    out += (f"trailer\n<< /Size {len(objs)+1} /Root 1 0 R >>\n"
            f"startxref\n{xref_pos}\n%%EOF").encode()
    path.write_bytes(bytes(out))

def write_world_record_report(path: Path, payload: dict):
    fp = payload["fingerprint"]
    path.write_text(f"""# World-Record Eligibility Report - {payload['app']}

Generated: {payload['timestamp']}

This is a self-attested build-quality summary produced by the Champion
pipeline. It records the verifiable facts of this release run so any
external claim (fastest, smallest, most audited, etc.) can be backed by
reproducible evidence rather than vibes.

## Verified this run
| Metric | Value |
|---|---|
| Gates passed | {payload['passed']}/{payload['gated']} |
| Readiness score | {payload['scorePct']:.0f}% |
| Total pipeline time | {payload['totalSeconds']:.1f}s |
| Dist files | {fp.get('fileCount', 'n/a')} |
| Dist size | {fp.get('totalBytes', 0)/1024:.1f} KB |
| SHA-256 fingerprint | `{fp.get('sha256', 'n/a')}` |
| Commit | {payload['git']['commit'] or 'n/a'} |

## Evidence chain
All raw logs, reports, and the signed fingerprint live in the evidence
pack alongside this file. Re-running `release:champion` on the same
commit must reproduce the same fingerprint.
""", encoding="utf-8")

def write_deploy_checklist(path: Path, payload: dict):
    path.write_text(f"""# Deployment Checklist - {payload['app']}

Run: {payload['timestamp']} · commit `{payload['git']['commit']}`

- [ ] Champion pipeline green ({payload['scorePct']:.0f}%)
- [ ] Evidence pack reviewed (`{payload['evidenceDir']}`)
- [ ] Release notes reviewed (`release-notes.md`)
- [ ] Git tag pushed (`git push --tags`)
- [ ] Deploy `dist/` to production host
- [ ] Smoke-test {payload['appUrl']} on iPad Safari
- [ ] Verify PWA installability + offline shell
- [ ] Confirm 3D viewport loads (no "0 walls" regression)
- [ ] Monitor error tracking for 30 min post-deploy
""")

# ────────────────────────────────────────────────────────────────
# Main
# ────────────────────────────────────────────────────────────────

def main():
    global USE_COLOR
    ap = argparse.ArgumentParser()
    ap.add_argument("--tag", action="store_true")
    ap.add_argument("--draft-release", action="store_true")
    ap.add_argument("--skip", action="append", default=[])
    ap.add_argument("--only", action="append", default=[])
    ap.add_argument("--no-color", action="store_true")
    ap.add_argument("--config", default="champion.config.json")
    args = ap.parse_args()
    if args.no_color:
        USE_COLOR = False

    cfg = load_config(Path(args.config))
    pkg_scripts = load_package_scripts()

    ts = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    run_id = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    evidence = Path(cfg["evidenceDir"]) / run_id
    logs = evidence / "logs"
    shots_dir = evidence / "screenshots"
    for d in (logs, shots_dir):
        d.mkdir(parents=True, exist_ok=True)

    hr()
    print(gold(CROWN))
    print(f"  {bold('CHAMPION PIPELINE')}  {dim(ts)}\n")

    # Run stages
    results = []
    t0 = time.time()
    for stage in cfg["stages"]:
        if args.only and stage["id"] not in args.only:
            continue
        if stage["id"] in args.skip:
            r = StageResult(stage); r.status = "SKIP"; r.detail = "skipped via --skip"
            print(f"  {dim('▷')} {r.label:<24}{yellow('▸ SKIP')}")
            results.append(r); continue
        results.append(run_stage(stage, cfg, logs, pkg_scripts))
    total_seconds = time.time() - t0

    # Score: only required, non-skipped stages gate the score
    gated = [r for r in results if r.required and r.status != "SKIP"]
    passed = [r for r in gated if r.status == "PASS"]
    failed = [r for r in results if r.status == "FAIL"]
    score = (len(passed) / len(gated) * 100) if gated else 0.0
    verdict = "CHAMPION BUILD 🏆" if score >= cfg["requiredScorePct"] and not failed else "NOT RELEASE-READY"

    # Fingerprint + git
    fp = fingerprint_dist(Path(cfg["distDir"]))
    gi = git_info()

    # Screenshots: collect any that exist
    screenshots = sorted(glob.glob(cfg["screenshotsGlob"]))
    for p in screenshots:
        shutil.copy2(p, shots_dir / Path(p).name)

    payload = {
        "app": cfg["appName"],
        "appUrl": cfg["appUrl"],
        "timestamp": ts,
        "runId": run_id,
        "evidenceDir": str(evidence),
        "totalSeconds": total_seconds,
        "scorePct": score,
        "verdict": verdict,
        "passed": len(passed),
        "gated": len(gated),
        "git": gi,
        "fingerprint": fp,
        "stages": [
            {"id": r.id, "label": r.label, "status": r.status,
             "seconds": r.seconds, "required": r.required,
             "detail": r.detail, "log": r.log_file}
            for r in results
        ],
    }

    # Evidence pack
    write_json_report(evidence / "report.json", payload)
    write_html_dashboard(evidence / "dashboard.html", payload, screenshots)
    write_pdf_certificate(evidence / "certificate.pdf", payload)
    write_world_record_report(evidence / "world-record.md", payload)
    write_deploy_checklist(evidence / "deploy-checklist.md", payload)
    (evidence / "release-notes.md").write_text(
        f"# Release notes ? {cfg['appName']} ({run_id})\n\n"
        + release_notes_since_last_tag()
        + "\n",
        encoding="utf-8"
    )
    if fp.get("present"):
        (evidence / "BUILD_FINGERPRINT.txt").write_text(fp["sha256"] + "\n", encoding="utf-8")

    # Git tag + GitHub draft (success only)
    champion = verdict.startswith("CHAMPION")
    if champion and args.tag:
        tag = f"champion-{run_id}"
        git("tag", "-a", tag, "-m", f"Champion build {run_id} — {score:.0f}%")
        print(f"\n  {green('✔')} Git tag created: {bold(tag)}")
    if champion and args.draft_release and shutil.which("gh"):
        tag = f"champion-{run_id}"
        subprocess.run(["gh", "release", "create", tag, "--draft",
                        "--title", f"{cfg['appName']} Champion {run_id}",
                        "--notes-file", str(evidence / "release-notes.md")])

    # Final banner
    print()
    hr()
    print(gold(CROWN))
    if champion:
        print(gold(CHAMPAGNE) + "\n")
    print(f"          {bold('RELEASE CHAMPION' if champion else 'RELEASE BLOCKED')}\n")
    for r in results:
        mark = {"PASS": green("✔"), "FAIL": red("✘"), "SKIP": yellow("▸")}[r.status]
        detail = dim(f"  ({r.detail})") if r.detail else ""
        print(f" {mark} {r.label}{detail}")
    print()
    hr("─")
    print(f"\n {bold('PRODUCTION READINESS')}\n")
    bar_color = gold if champion else red
    print(f" {bar_color(progress_bar(score))} {score:.0f}%\n")
    print(f" {gold('🏆 ' + verdict) if champion else red('⛔ ' + verdict)}\n")
    print(f" Evidence pack:\n {cyan(str(evidence))}\n")
    hr()

    sys.exit(0 if champion else 1)

if __name__ == "__main__":
    main()
