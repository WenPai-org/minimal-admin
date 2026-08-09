#!/usr/bin/env python3
"""Build a reproducible Minimal Admin ZIP and checksum."""
from __future__ import annotations

import argparse
import hashlib
import json
import stat
import zipfile
from pathlib import Path

ROOT_SLUG = "minimal-admin"
EXCLUDED_PREFIXES = ("tests/", ".wp-playground/", ".github/", ".forgejo/", "tools/")
EXCLUDED_FILES = {".gitignore", ".upstream-files.json", "upstream-lock.json", "CLAUDE.md"}
EXTRA_FILES = ("NOTICE", "UPSTREAM.md")
TRANSLATION_SUFFIXES = (".po", ".mo", ".json")
FIXED_TIME = (1980, 1, 1, 0, 0, 0)


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--dist", type=Path)
    parser.add_argument("--update-manifest", action="store_true")
    return parser.parse_args()


def should_package(relative: str) -> bool:
    return relative not in EXCLUDED_FILES and not relative.startswith(EXCLUDED_PREFIXES)


def main() -> int:
    args = arguments()
    root = args.root.resolve()
    manifest_path = root / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    version = manifest["version"]
    if manifest.get("slug") != ROOT_SLUG:
        raise SystemExit("unexpected manifest slug")
    expected_url = f"https://feicode.com/WenPai-org/minimal-admin/releases/download/v{version}/minimal-admin-{version}.zip"
    if manifest.get("download_url") != expected_url:
        raise SystemExit("manifest download URL does not match version")

    index = json.loads((root / ".upstream-files.json").read_text())
    relative_files = [item for item in index["files"] if should_package(item)]
    relative_files.extend(item for item in EXTRA_FILES if (root / item).is_file())
    relative_files.extend(
        path.relative_to(root).as_posix()
        for path in (root / "languages").glob("minimal-admin-*")
        if path.is_file() and path.suffix in TRANSLATION_SUFFIXES
    )
    relative_files = sorted(set(relative_files))
    dist = (args.dist or root / "dist").resolve()
    dist.mkdir(parents=True, exist_ok=True)
    zip_path = dist / f"minimal-admin-{version}.zip"

    # Store entries without deflate so byte output is identical across Python/zlib builds.
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_STORED) as archive:
        for relative in relative_files:
            source = root / relative
            if not source.is_file():
                raise SystemExit(f"packaged file missing: {relative}")
            data = source.read_bytes()
            if relative == "manifest.json":
                packaged_manifest = json.loads(data)
                packaged_manifest["sha256"] = ""
                data = (json.dumps(packaged_manifest, ensure_ascii=False, indent=2) + "\n").encode()
            info = zipfile.ZipInfo(f"{ROOT_SLUG}/{relative}", FIXED_TIME)
            mode = source.stat().st_mode
            permissions = 0o755 if mode & stat.S_IXUSR else 0o644
            info.external_attr = (stat.S_IFREG | permissions) << 16
            info.compress_type = zipfile.ZIP_STORED
            archive.writestr(info, data)

    checksum = hashlib.sha256(zip_path.read_bytes()).hexdigest()
    checksum_path = zip_path.with_suffix(zip_path.suffix + ".sha256")
    checksum_path.write_text(f"{checksum}  {zip_path.name}\n")
    if args.update_manifest:
        manifest["sha256"] = checksum
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"version": version, "zip": str(zip_path), "sha256": checksum}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
