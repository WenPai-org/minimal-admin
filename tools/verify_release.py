#!/usr/bin/env python3
"""Verify branding, provenance, syntax, and release archive invariants."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import zipfile
from pathlib import Path

ALLOWED_LEGACY = {"LICENSE", "NOTICE", "UPSTREAM.md", "upstream-lock.json"}
LEGACY_PATTERNS = (b"minn", b"Minn", b"MINN")


def run(command: list[str], cwd: Path) -> None:
    result = subprocess.run(command, cwd=cwd, text=True, capture_output=True)
    if result.returncode:
        sys.stderr.write(result.stdout + result.stderr)
        raise SystemExit(f"failed: {' '.join(command)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--zip", type=Path)
    args = parser.parse_args()
    root = args.root.resolve()
    lock = json.loads((root / "upstream-lock.json").read_text())
    manifest = json.loads((root / "manifest.json").read_text())
    version = lock["downstream_version"]
    if manifest["version"] != version or manifest["slug"] != "minimal-admin":
        raise SystemExit("manifest and lock disagree")
    main_file = (root / "minimal-admin.php").read_text()
    required = (
        "Plugin Name:       Minimal Admin",
        f"Version:           {version}",
        "Text Domain:       minimal-admin",
        "Update URI:       https://updates.wenpai.net",
        f"define( 'MINIMAL_ADMIN_VERSION', '{version}' );",
    )
    for marker in required:
        if marker not in main_file:
            raise SystemExit(f"missing plugin header marker: {marker}")

    updater = (root / "includes/class-minimal-admin-updater.php").read_text()
    if "const PACKAGE_HOSTS = array( 'feicode.com' );" not in updater:
        raise SystemExit("updater package host allowlist is not pinned to FeiCode")
    for item in manifest.get("translations", []):
        locale = item.get("language", "")
        expected = (
            "https://feicode.com/WenPai-org/minimal-admin/releases/download/"
            f"v{version}/minimal-admin-{locale}.zip"
        )
        if item.get("version") != version or item.get("package") != expected:
            raise SystemExit(f"translation manifest is not downstream-pinned: {locale}")
        if not re.fullmatch(r"[0-9a-f]{64}", str(item.get("sha256", ""))):
            raise SystemExit(f"translation manifest has no valid sha256: {locale}")

    managed = json.loads((root / ".upstream-files.json").read_text())["files"]
    violations = []
    for relative in managed:
        path = root / relative
        if any(pattern in relative.encode() for pattern in LEGACY_PATTERNS):
            violations.append(relative)
        if relative in ALLOWED_LEGACY:
            continue
        data = path.read_bytes()
        if any(pattern in data for pattern in LEGACY_PATTERNS):
            violations.append(relative)
    if violations:
        raise SystemExit("legacy plugin identity remains in: " + ", ".join(sorted(set(violations))[:20]))

    php_files = sorted(path for path in root.rglob("*.php") if ".git" not in path.parts)
    for path in php_files:
        run(["php", "-l", str(path)], root)
    js_files = sorted(path for path in (root / "assets").rglob("*.js"))
    for path in js_files:
        run(["node", "--check", str(path)], root)

    if args.zip:
        zip_path = args.zip.resolve()
        checksum = hashlib.sha256(zip_path.read_bytes()).hexdigest()
        if checksum != manifest.get("sha256"):
            raise SystemExit("ZIP checksum does not match manifest")
        with zipfile.ZipFile(zip_path) as archive:
            names = archive.namelist()
            if not names or any(not name.startswith("minimal-admin/") for name in names):
                raise SystemExit("ZIP root slug is invalid")
            if "minimal-admin/minimal-admin.php" not in names:
                raise SystemExit("ZIP is missing the main plugin file")
            if any("/.forgejo/" in name or "/tests/" in name or "/tools/" in name for name in names):
                raise SystemExit("ZIP contains maintainer or test files")
            if any("/bin/" in name or re.search(r"/languages/(?!minimal-admin-(?:zh_CN|zh_TW))", name) for name in names):
                raise SystemExit("ZIP contains upstream translation sources or release tooling")
    print(f"verified minimal-admin {version}: {len(php_files)} PHP files, {len(js_files)} JS files")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
