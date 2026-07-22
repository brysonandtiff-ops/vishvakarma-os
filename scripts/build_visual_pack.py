#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════════
  VISHVAKARMA.OS — VISUAL HARDENING PACK BUILDER v2
  v2 adds VALIDATION: a capture only counts if the page actually
  rendered the intended route. 404s, auth-wall bounces, splash
  screens, and blank frames are recorded as FAILURES, not evidence.

  Usage:
    python build_visual_pack.py --discover   # crawl & list real routes, write nothing
    python build_visual_pack.py --login      # headed login, verifies session before saving
    python build_visual_pack.py --verify-auth# check saved session still works
    python build_visual_pack.py              # capture + validate + assemble pack
    python build_visual_pack.py --dry-run    # structure only, no browser

  Requires: pip install playwright && playwright install chromium webkit
  Exit: 0 all captures valid · 1 one or more invalid · 2 auth/config failure
═══════════════════════════════════════════════════════════════════
"""

import argparse
import datetime as dt
import hashlib
import json
import os
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "pack.config.json"
AUTH_STATE = ROOT / ".auth-state.json"

USE_COLOR = sys.stdout.isatty() and os.environ.get("NO_COLOR") is None
def c(code, s): return f"\033[{code}m{s}\033[0m" if USE_COLOR else s
def green(s): return c("32", s)
def red(s): return c("31", s)
def yellow(s): return c("33", s)
def cyan(s): return c("36", s)
def dim(s): return c("2", s)
def gold(s): return c("38;5;220", s)

# ── validation ──────────────────────────────────────────────────
# Text that proves a capture is NOT the route we asked for.

DEFAULT_REJECT = {
    "404": ["404", "not part of the", "workspace manifest", "मार्ग न लभते"],
    "AUTH WALL": ["continue with google sso", "request access", "sign in", "need access?"],
    "SPLASH": [],   # detected structurally (near-empty DOM), see validate()
}

def validate(page, shot, cfg):
    """Return (ok, reason). Confirms the rendered page IS the intended route."""
    try:
        body = (page.inner_text("body") or "").strip()
    except Exception as e:
        return False, f"NO BODY ({type(e).__name__})"

    low = body.lower()

    # 1. Landed somewhere else entirely?
    final = page.url.replace(cfg["baseUrl"], "") or "/"
    want = shot["path"]
    if final.split("?")[0].rstrip("/") != want.rstrip("/") and not shot.get("allowRedirect"):
        # redirect is itself the finding (auth bounce)
        return False, f"REDIRECTED to {final}"

    # 2. Reject markers (404 page, auth wall) — unless this shot IS the auth/404 route.
    #    Runs BEFORE the sparse check: "it's a 404" is a more actionable finding
    #    than "the page is short".
    matched_kind = None
    for label, markers in DEFAULT_REJECT.items():
        if not markers:
            continue
        for m in markers:
            if m.lower() in low:
                matched_kind = label
                break
        if matched_kind:
            break
    if matched_kind and shot.get("expectKind") != matched_kind:
        return False, f"{matched_kind} rendered instead of {want}"

    # 3. Splash / not-yet-booted: almost no text content. Skipped when the shot
    #    legitimately IS a sparse page (auth wall, 404) that we asked for.
    if (len(body) < cfg.get("minBodyChars", 120)
            and not shot.get("allowSparse")
            and not shot.get("expectKind")):
        return False, f"SPLASH/EMPTY ({len(body)} chars of text)"

    # 4. Positive assertion, when the shot declares one
    expect = shot.get("expectText")
    if expect and expect.lower() not in low:
        return False, f"missing expected text: {expect!r}"
    sel = shot.get("expectSelector")
    if sel:
        try:
            page.wait_for_selector(sel, timeout=shot.get("expectTimeout", 5000))
        except Exception:
            return False, f"missing expected selector: {sel}"

    return True, "ok"

# ── config / helpers ────────────────────────────────────────────

def load_config():
    if not CONFIG_PATH.exists():
        print(red(f"Missing {CONFIG_PATH}")); sys.exit(2)
    return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

def sha256(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()

# ── route discovery ─────────────────────────────────────────────

def discover(cfg, repo_root: Path):
    """Scrape route paths out of source, then probe each one live."""
    from playwright.sync_api import sync_playwright
    pats = [re.compile(r"""path:\s*['"]([^'"]+)['"]"""),
            re.compile(r"""<Route\s+[^>]*path=['"]([^'"]+)['"]""")]
    found = set()
    for p in list(repo_root.glob("src/**/*.tsx")) + list(repo_root.glob("src/**/*.ts")):
        try:
            t = p.read_text(errors="ignore")
        except Exception:
            continue
        for rx in pats:
            for m in rx.finditer(t):
                r = m.group(1)
                if r.startswith("/") and "*" not in r and ":" not in r:
                    found.add(r)
    routes = sorted(found)
    print(gold(f"\n  Found {len(routes)} static route(s) in source\n"))
    if not routes:
        print(yellow("  No routes matched. Check your router file naming.\n")); return

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        kw = {"viewport": cfg["devices"]["desktop"]["viewport"]}
        if AUTH_STATE.exists():
            kw["storage_state"] = str(AUTH_STATE)
        ctx = b.new_context(**kw)
        page = ctx.new_page()
        live = []
        for r in routes:
            try:
                page.goto(cfg["baseUrl"] + r, wait_until="networkidle", timeout=20000)
                page.wait_for_timeout(1200)
                body = (page.inner_text("body") or "").lower()
                final = page.url.replace(cfg["baseUrl"], "") or "/"
                if "404" in body or "workspace manifest" in body:
                    status = red("404")
                elif "continue with google sso" in body or "request access" in body:
                    status = yellow("AUTH WALL")
                elif len(body.strip()) < 120:
                    status = yellow("SPLASH/EMPTY")
                else:
                    status = green("OK"); live.append(r)
                extra = dim(f"→ {final}") if final.rstrip("/") != r.rstrip("/") else ""
                print(f"  {r:<34} {status} {extra}")
            except Exception as e:
                print(f"  {r:<34} {red(type(e).__name__)}")
        b.close()
    print(gold(f"\n  {len(live)} route(s) rendered real content.\n"))
    (ROOT / "discovered-routes.json").write_text(json.dumps(
        {"all": routes, "renderedOk": live}, indent=2))
    print(f"  Written → {cyan('discovered-routes.json')}\n")

# ── auth ────────────────────────────────────────────────────────

def do_login(cfg):
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        b = pw.chromium.launch(headless=False)
        ctx = b.new_context(viewport=cfg["devices"]["desktop"]["viewport"])
        page = ctx.new_page()
        page.goto(cfg["baseUrl"] + cfg.get("loginPath", "/auth"))
        print(gold("\n  Log in in the opened browser (Google SSO is fine)."))
        input("  When you're INSIDE the app, press Enter here… ")

        probe = cfg.get("authProbePath", "/")
        page.goto(cfg["baseUrl"] + probe, wait_until="networkidle")
        page.wait_for_timeout(1500)
        body = (page.inner_text("body") or "").lower()
        if "continue with google sso" in body or "request access" in body:
            print(red("\n  ✘ Still seeing the auth wall — session NOT saved."))
            print(yellow("    Log in fully, then re-run --login.\n"))
            b.close(); sys.exit(2)

        ctx.storage_state(path=str(AUTH_STATE))
        keys = 0
        try:
            st = json.loads(AUTH_STATE.read_text())
            keys = sum(len(o.get("localStorage", [])) for o in st.get("origins", [])) + len(st.get("cookies", []))
        except Exception:
            pass
        b.close()
    if keys == 0:
        print(red(f"\n  ✘ {AUTH_STATE.name} captured 0 cookies/localStorage entries."))
        print(yellow("    Your session likely lives in memory only. See README → 'Auth that won't persist'.\n"))
        sys.exit(2)
    print(green(f"\n  ✔ Auth state saved ({keys} cookie/storage entries) → {AUTH_STATE.name}"))
    print(dim("    Add .auth-state.json to .gitignore.\n"))

def verify_auth(cfg):
    from playwright.sync_api import sync_playwright
    if not AUTH_STATE.exists():
        print(red("  No .auth-state.json — run --login first.\n")); sys.exit(2)
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        ctx = b.new_context(viewport=cfg["devices"]["desktop"]["viewport"],
                            storage_state=str(AUTH_STATE))
        page = ctx.new_page()
        probe = cfg.get("authProbePath", "/")
        page.goto(cfg["baseUrl"] + probe, wait_until="networkidle", timeout=25000)
        page.wait_for_timeout(1500)
        body = (page.inner_text("body") or "").lower()
        walled = "continue with google sso" in body or "request access" in body
        b.close()
    if walled:
        print(red(f"\n  ✘ Session INVALID — {probe} still shows the auth wall.\n")); sys.exit(2)
    print(green(f"\n  ✔ Session valid — {probe} renders authenticated content.\n"))

# ── capture ─────────────────────────────────────────────────────

def run_actions(page, actions, log):
    for act in actions or []:
        k = act.get("do")
        try:
            if k == "click":
                page.click(act["selector"], timeout=act.get("timeout", 5000))
            elif k == "fill":
                page.fill(act["selector"], act.get("value", ""), timeout=act.get("timeout", 5000))
            elif k == "press":
                page.keyboard.press(act["key"])
            elif k == "wait":
                page.wait_for_timeout(act.get("ms", 1000))
            elif k == "waitFor":
                page.wait_for_selector(act["selector"], timeout=act.get("timeout", 8000))
        except Exception as e:
            log.append(f"      action skipped ({k} {act.get('selector','')}): {type(e).__name__}")

def capture(cfg):
    from playwright.sync_api import sync_playwright
    shots_dir = ROOT / "pack" / "screenshots"
    rejects_dir = ROOT / "pack" / "_rejected"
    shots_dir.mkdir(parents=True, exist_ok=True)
    rejects_dir.mkdir(parents=True, exist_ok=True)
    manifest, failures, log = [], [], []

    with sync_playwright() as pw:
        engines = {"chromium": pw.chromium.launch(), "webkit": pw.webkit.launch()}
        contexts = {}
        for name, dev in cfg["devices"].items():
            eng = engines[dev.get("engine", "chromium")]
            kw = {"viewport": dev["viewport"]}
            if dev.get("isMobile"):
                kw.update(is_mobile=True, has_touch=True)
            if dev.get("deviceScaleFactor"):
                kw["device_scale_factor"] = dev["deviceScaleFactor"]
            if AUTH_STATE.exists():
                kw["storage_state"] = str(AUTH_STATE)
            contexts[name] = eng.new_context(**kw)

        jobs = list(cfg["shots"]) + list(cfg.get("viewportStates", []))
        for idx, shot in enumerate(jobs, 1):
            devn = shot.get("device", "desktop")
            page = contexts[devn].new_page()
            name = f"{idx:03d}-{shot['id']}.png"
            print(f"  {cyan('▶')} {name:<34}", end="", flush=True)
            try:
                page.goto(cfg["baseUrl"] + shot["path"], wait_until="networkidle",
                          timeout=cfg.get("navTimeoutMs", 30000))
                page.wait_for_timeout(shot.get("settleMs", cfg.get("settleMs", 1200)))
                run_actions(page, shot.get("actions"), log)
                page.wait_for_timeout(300)

                ok, reason = validate(page, shot, cfg)
                target = (shots_dir if ok else rejects_dir) / name
                page.screenshot(path=str(target), full_page=shot.get("fullPage", False))

                if ok:
                    print(green("✔") + f"  {dim(f'{devn} · {shot['path']}')}")
                    manifest.append({
                        "file": name, "route": shot["path"], "device": devn,
                        "state": shot.get("state", "default"),
                        "viewport": cfg["devices"][devn]["viewport"],
                        "sha256": sha256(target), "purpose": shot.get("purpose", ""),
                    })
                else:
                    print(red(f"✘ {reason}"))
                    failures.append({"file": name, "route": shot["path"],
                                     "device": devn, "reason": reason})
            except Exception as e:
                print(red(f"✘ {type(e).__name__}"))
                failures.append({"file": name, "route": shot["path"],
                                 "device": devn, "reason": f"{type(e).__name__}: {str(e)[:140]}"})
            finally:
                page.close()

        for ctx in contexts.values(): ctx.close()
        for b in engines.values(): b.close()

    if log:
        print(dim("\n".join(log)))
    return manifest, failures

# ── pack assembly ───────────────────────────────────────────────

def write_manifest(pack, manifest, failures, cfg):
    ts = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    total = len(manifest) + len(failures)
    lines = [f"# SCREENSHOT MANIFEST — {cfg['appName']}",
             f"Generated: {ts} · Base URL: {cfg['baseUrl']}",
             f"**Valid captures: {len(manifest)} / {total}**", ""]
    if manifest:
        lines += ["| # | File | Route | Device | State | Viewport | SHA-256 (12) |",
                  "|---|---|---|---|---|---|---|"]
        for i, m in enumerate(manifest, 1):
            vp = f"{m['viewport']['width']}×{m['viewport']['height']}"
            lines.append(f"| {i:03d} | {m['file']} | `{m['route']}` | {m['device']} | "
                         f"{m['state']} | {vp} | `{m['sha256'][:12]}` |")
    else:
        lines.append("_No valid captures. Do not run an audit against this pack._")
    if failures:
        lines += ["", "## ✘ INVALID CAPTURES — these are FINDINGS, not evidence", "",
                  "| File | Route | Device | Reason |", "|---|---|---|---|"]
        for f in failures:
            lines.append(f"| {f['file']} | `{f['route']}` | {f['device']} | {f['reason']} |")
        lines += ["", "Rejected PNGs are in `_rejected/` for debugging. They are NOT",
                  "audit evidence and must not be treated as product UI."]
    lines += ["", "Screenshots are the visual source of truth. The auditor must not",
              "invent UI that does not appear here. UNVERIFIED — requires test."]
    (pack / "SCREENSHOT_MANIFEST.md").write_text("\n".join(lines) + "\n", encoding="utf-8")

def write_route_map(pack, manifest, cfg):
    routes = {}
    for m in manifest:
        r = routes.setdefault(m["route"], {"devices": [], "states": [], "files": []})
        if m["device"] not in r["devices"]: r["devices"].append(m["device"])
        if m["state"] not in r["states"]: r["states"].append(m["state"])
        r["files"].append(m["file"])
    (pack / "ROUTE_MAP.json").write_text(json.dumps(
        {"app": cfg["appName"], "baseUrl": cfg["baseUrl"], "routes": routes}, indent=2))

def copy_evidence(pack, cfg):
    ev = pack / "evidence"; ev.mkdir(exist_ok=True)
    copied = []
    for g in cfg.get("evidenceFiles", []):
        for p in Path(".").glob(g):
            if p.is_file():
                shutil.copy2(p, ev / p.name); copied.append(p.name)
    (ev / "_INDEX.md").write_text("# Evidence\n" + ("\n".join(f"- {n}" for n in copied)
                                  or "- (none found)") + "\n")
    return copied

def copy_static(pack):
    for n in ("MASTER_PROMPT.md", "VISUAL_AUDIT_RULES.md"):
        if (ROOT / n).exists():
            shutil.copy2(ROOT / n, pack / n)

def copy_source(pack, cfg):
    src_root = Path(cfg.get("sourceRoot", "."))
    dest = pack / "source"; ex = set(cfg.get("sourceExcludes", [])); n = 0
    for g in cfg.get("sourceIncludes", []):
        for p in src_root.glob(g):
            if p.is_file() and not any(x in p.parts for x in ex):
                d = dest / p.relative_to(src_root)
                d.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(p, d); n += 1
    return n

# ── main ────────────────────────────────────────────────────────

def main():
    global USE_COLOR
    ap = argparse.ArgumentParser()
    ap.add_argument("--login", action="store_true")
    ap.add_argument("--verify-auth", action="store_true")
    ap.add_argument("--discover", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-source", action="store_true")
    ap.add_argument("--no-color", action="store_true")
    ap.add_argument("--allow-invalid", action="store_true",
                    help="build the pack even if captures failed validation")
    args = ap.parse_args()
    if args.no_color: USE_COLOR = False

    cfg = load_config()
    print(gold(f"\n  📸 VISUAL HARDENING PACK v2 — {cfg['appName']}\n"))

    if args.login:   do_login(cfg); return
    if args.verify_auth: verify_auth(cfg); return
    if args.discover: discover(cfg, Path(".").resolve()); return

    pack = ROOT / "pack"
    if pack.exists(): shutil.rmtree(pack)
    (pack / "screenshots").mkdir(parents=True)

    manifest, failures = [], []
    if args.dry_run:
        print(yellow("  dry-run: no browser capture\n"))
    else:
        if not AUTH_STATE.exists():
            print(yellow("  ⚠ No auth state — authenticated routes will fail. Run --login.\n"))
        manifest, failures = capture(cfg)

    write_manifest(pack, manifest, failures, cfg)
    write_route_map(pack, manifest, cfg)
    copied = copy_evidence(pack, cfg)
    copy_static(pack)
    nsrc = 0 if args.no_source else copy_source(pack, cfg)

    total = len(manifest) + len(failures)
    print(f"\n  {green(str(len(manifest)) + ' valid')} · "
          f"{red(str(len(failures)) + ' invalid') if failures else dim('0 invalid')} "
          f"of {total} · {len(copied)} evidence · {nsrc} source files")

    if failures and not args.allow_invalid:
        print(red("\n  ✘ Pack NOT written — invalid captures would poison the audit."))
        print(yellow("    See pack/SCREENSHOT_MANIFEST.md for reasons, pack/_rejected/ for PNGs."))
        print(dim("    Fix routes/auth and re-run, or --allow-invalid to build anyway.\n"))
        sys.exit(1)

    out = ROOT / cfg.get("outputZip", "VishvakarmaOS-Visual-Hardening-Pack.zip")
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(pack.rglob("*")):
            if p.is_file() and "_rejected" not in p.parts:
                z.write(p, p.relative_to(pack.parent))
    print(f"  {green('✔')} Pack → {cyan(str(out))}\n")
    sys.exit(0)

if __name__ == "__main__":
    main()
