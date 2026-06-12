#!/usr/bin/env python3
"""
Repair the parent workspace package.json for Vishvakarma.OS local operator commands.

This is a safe bootstrap/repair script, not a shell-command injection tool. It rewrites
only the package.json one level above this repo by default, replacing malformed JSON
such as a trailing comma after the final script entry.

Usage from vishvakarma-os-live:
  python scripts/repair-workspace-root-package.py
  python scripts/repair-workspace-root-package.py --dry-run
  python scripts/repair-workspace-root-package.py --target ../package.json
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

PACKAGE_PAYLOAD = {
    "name": "vishvakarma-os-workspace",
    "private": True,
    "packageManager": "pnpm@9.15.0",
    "scripts": {
        "setup:stripe-live": "pnpm --dir vishvakarma-os-live run setup:stripe-live",
        "setup:stripe-live:cli": "pnpm --dir vishvakarma-os-live run setup:stripe-live:cli",
        "setup:stripe": "pnpm --dir vishvakarma-os-live run setup:stripe",
        "verify:stripe-billing": "pnpm --dir vishvakarma-os-live run verify:stripe-billing",
        "fetch:stripe-live-key": "pnpm --dir vishvakarma-os-live exec node scripts/fetch-stripe-live-key.mjs",
        "import:stripe-live-key": "pnpm --dir vishvakarma-os-live exec node scripts/import-stripe-live-key-from-clipboard.mjs",
    },
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Rewrite the parent Vishvakarma.OS workspace package.json as valid JSON."
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=None,
        help="Package file to repair. Defaults to one level above the repo root.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the package.json that would be written without changing files.",
    )
    parser.add_argument(
        "--no-backup",
        action="store_true",
        help="Do not create package.json.bak before overwriting an existing file.",
    )
    return parser.parse_args()


def resolve_repo_root() -> Path:
    # scripts/repair-workspace-root-package.py -> repo root is parent of scripts/
    return Path(__file__).resolve().parents[1]


def resolve_target(explicit_target: Path | None) -> Path:
    if explicit_target is not None:
        return explicit_target.expanduser().resolve()

    live_root = resolve_repo_root()
    workspace_root = live_root.parent
    return workspace_root / "package.json"


def serialize_payload() -> str:
    return json.dumps(PACKAGE_PAYLOAD, indent=2) + "\n"


def read_existing(path: Path) -> dict[str, object] | None:
    if not path.exists():
        return None

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        print(f"[repair] Existing package.json is invalid JSON: {error}")
        return None


def write_package(path: Path, content: str, *, backup: bool) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)

    if path.exists() and backup:
        backup_path = path.with_name(f"{path.name}.bak")
        shutil.copy2(path, backup_path)
        print(f"[repair] Backup written: {backup_path}")

    path.write_text(content, encoding="utf-8")
    print(f"[repair] Repaired package.json: {path}")


def main() -> int:
    args = parse_args()
    target = resolve_target(args.target)
    content = serialize_payload()

    print(f"[repair] Target: {target}")
    existing = read_existing(target)

    if existing == PACKAGE_PAYLOAD:
        print("[repair] Existing package.json is already correct.")
        return 0

    if args.dry_run:
        print("[repair] Dry run — package.json content follows:\n")
        print(content, end="")
        return 0

    write_package(target, content, backup=not args.no_backup)

    # Validate what was written using strict JSON parsing.
    json.loads(target.read_text(encoding="utf-8"))
    print("[repair] Validation passed: strict JSON parse OK.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
