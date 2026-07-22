#!/usr/bin/env python3
"""
Auth diagnostic — finds out WHERE the session token lives.

Run:  python visual-pack\\scripts\\diagnose_auth.py

Opens a browser, waits for you to log in, then reports which origin
holds the Supabase token and whether the app renders authenticated
content there. Tells you exactly which fix to apply.
"""

import sys

ORIGINS = [
    "http://127.0.0.1:4173",
    "http://localhost:4173",
]

AUTH_MARKERS = ("continue with google sso", "request access", "need access?")

def main():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed:  python -m pip install playwright")
        sys.exit(2)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)
        ctx = browser.new_context()
        page = ctx.new_page()

        start = ORIGINS[0] + "/auth"
        print(f"\nOpening {start}")
        try:
            page.goto(start, timeout=20000)
        except Exception as e:
            print(f"\n  Cannot reach {ORIGINS[0]} — {type(e).__name__}")
            print("  Is 'pnpm run preview' running in another window?\n")
            browser.close()
            sys.exit(2)

        print("\n" + "=" * 62)
        print("  Log in COMPLETELY in the browser window.")
        print("  Wait until you can SEE the projects list.")
        print("=" * 62)
        input("\nThen press Enter here... ")

        print(f"\nBrowser ended up at: {page.url}\n")

        found_token_on = []
        for origin in ORIGINS:
            print("-" * 62)
            print(origin)
            try:
                page.goto(origin + "/projects", timeout=20000)
                page.wait_for_timeout(2000)
            except Exception as e:
                print(f"  unreachable — {type(e).__name__}")
                continue

            try:
                keys = page.evaluate("Object.keys(localStorage)")
            except Exception:
                keys = []
            sb_keys = [k for k in keys if k.startswith("sb-") or "auth" in k.lower()]

            print(f"  localStorage keys : {keys if keys else '(none)'}")
            print(f"  auth-ish keys     : {sb_keys if sb_keys else '(none)'}")

            cookies = [c["name"] for c in ctx.cookies() if origin.split("//")[1].split(":")[0] in c.get("domain", "")]
            print(f"  cookies           : {cookies if cookies else '(none)'}")

            body = (page.inner_text("body") or "").strip()
            walled = any(m in body.lower() for m in AUTH_MARKERS)
            state = "AUTH WALL" if walled else ("EMPTY" if len(body) < 120 else "AUTHENTICATED CONTENT")
            print(f"  /projects renders : {state}")
            print(f"  first 70 chars    : {body[:70]!r}")

            if sb_keys and not walled:
                found_token_on.append(origin)

        browser.close()

    print("\n" + "=" * 62)
    print("  VERDICT")
    print("=" * 62)
    if not found_token_on:
        print("""
  No working session found on either origin.

  Most likely: Google blocked OAuth in the automated browser, or the
  login didn't complete. Next step is the persistent-profile approach
  (reuses your everyday Chrome, where you're already signed in), or an
  email/password test account which avoids Google OAuth entirely.
""")
    else:
        good = found_token_on[0]
        print(f"""
  Working session found on: {good}

  FIX: set  "baseUrl": "{good}"  in visual-pack\\pack.config.json
  Then re-run:
      python visual-pack\\scripts\\build_visual_pack.py --login
      python visual-pack\\scripts\\build_visual_pack.py --verify-auth
""")

if __name__ == "__main__":
    main()
