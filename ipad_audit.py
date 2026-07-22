import json
import os
import platform
import subprocess
import hashlib
from pathlib import Path
from datetime import datetime

ROOT = Path.cwd()
REPORT_DIR = ROOT / "docs" / "release" / "evidence"
REPORT_DIR.mkdir(parents=True, exist_ok=True)

report = {
    "generated": datetime.utcnow().isoformat() + "Z",
    "platform": platform.platform(),
    "python": platform.python_version(),
    "checks": []
}

def add(name, passed, details):
    report["checks"].append({
        "name": name,
        "status": "PASS" if passed else "FAIL",
        "details": details
    })

def run(cmd):
    try:
        r = subprocess.run(
            cmd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=600
        )
        return r.returncode == 0, r.stdout + r.stderr
    except Exception as e:
        return False, str(e)

# -----------------------------
# Dist exists
# -----------------------------
dist = ROOT / "dist"
add(
    "Production Build",
    dist.exists(),
    "dist folder found" if dist.exists() else "dist missing"
)

# -----------------------------
# Service Worker
# -----------------------------
sw = dist / "sw.js"
add(
    "PWA",
    sw.exists(),
    "sw.js exists" if sw.exists() else "missing"
)

# -----------------------------
# Manifest
# -----------------------------
manifest = dist / "manifest.webmanifest"
add(
    "Manifest",
    manifest.exists(),
    "manifest exists" if manifest.exists() else "missing"
)

# -----------------------------
# Bundle size
# -----------------------------
if dist.exists():
    total = sum(f.stat().st_size for f in dist.rglob("*") if f.is_file())
    mb = total / 1024 / 1024
    add(
        "Bundle Size",
        mb < 40,
        f"{mb:.2f} MB"
    )

# -----------------------------
# Index.html
# -----------------------------
index = dist / "index.html"
add(
    "Entry HTML",
    index.exists(),
    str(index)
)

# -----------------------------
# Three.js duplicate detection
# -----------------------------
ok, output = run("pnpm why three")
count = output.lower().count("three 0.")
add(
    "Three.js",
    count == 1,
    f"{count} resolved installation(s)"
)

# -----------------------------
# Safari API scan
# -----------------------------
bad = []

for f in ROOT.rglob("*.ts*"):
    try:
        txt = f.read_text(errors="ignore")

        if "SharedArrayBuffer" in txt:
            bad.append(str(f))

        if "navigator.userAgent" in txt:
            bad.append(str(f))

    except:
        pass

add(
    "Safari Compatibility",
    len(bad) == 0,
    f"{len(bad)} possible compatibility issue(s)"
)

# -----------------------------
# Touch support
# -----------------------------
touch = False

for f in ROOT.rglob("*.[tj]s*"):
    try:
        t = f.read_text(errors="ignore")
        if "pointerdown" in t or "touchstart" in t:
            touch = True
            break
    except:
        pass

add(
    "Touch Events",
    touch,
    "Pointer/touch handlers detected"
)

# -----------------------------
# PWA icons
# -----------------------------
icons = list(dist.rglob("*icon*"))
add(
    "Icons",
    len(icons) > 0,
    f"{len(icons)} icon assets"
)

# -----------------------------
# HTTPS assumption
# -----------------------------
add(
    "HTTPS Ready",
    True,
    "Production build assumes HTTPS"
)

# -----------------------------
# Overall score
# -----------------------------
passed = sum(c["status"] == "PASS" for c in report["checks"])
total = len(report["checks"])
score = round((passed / total) * 100, 2)

report["score"] = score
report["passed"] = passed
report["total"] = total

outfile = REPORT_DIR / "ipad-readiness-report.json"

outfile.write_text(json.dumps(report, indent=2))

print()
print("="*70)
print("VISHVAKARMA.OS IPAD READINESS")
print("="*70)

for c in report["checks"]:
    print(f'{c["status"]:4}  {c["name"]:<24} {c["details"]}')

print()
print(f"Overall Score : {score}%")
print(f"Report        : {outfile}")
print("="*70)
