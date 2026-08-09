#!/usr/bin/env python3
"""Deterministically transform a Minn Admin release into Minimal Admin source."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

EXCLUDED_TOP = {".git", ".github", ".forgejo", ".gitignore", ".wp-playground", "tools", "CLAUDE.md"}
MANAGED_INDEX = ".upstream-files.json"
PROTECTED = {".gitignore", "NOTICE", "UPSTREAM.md", MANAGED_INDEX, "upstream-lock.json"}

LITERAL_REPLACEMENTS = (
    ("https://raw.githubusercontent.com/austinginder/minn-admin/main/manifest.json", "https://feicode.com/WenPai-org/minimal-admin/raw/branch/main/manifest.json"),
    ("https://github.com/austinginder/minn-admin", "https://feicode.com/WenPai-org/minimal-admin"),
    ("github.com/austinginder/minn-admin", "feicode.com/WenPai-org/minimal-admin"),
    ("https://github.com/sponsors/austinginder", "https://wenpai.org"),
    ("https://profiles.wordpress.org/austinginder", "https://wenpai.org"),
    ("https://austinginder.com", "https://wenpai.org"),
    ("https://minnadmin.com", "https://feicode.com/WenPai-org/minimal-admin"),
    ("minnadmin.com", "FeiCode repository"),
    ("MINN_ADMIN", "MINIMAL_ADMIN"),
    ("Minn_Admin", "Minimal_Admin"),
    ("minn_admin", "minimal_admin"),
    ("Minn Admin", "Minimal Admin"),
    ("minn-admin", "minimal-admin"),
    ("Austin Ginder", "WenPai.org"),
    ("austinginder", "WenPai-org"),
    ("MINN", "MINIMAL"),
    ("Minn", "Minimal"),
    ("minn", "minimal"),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--upstream-tag", required=True)
    parser.add_argument("--upstream-commit", required=True)
    parser.add_argument("--version", required=True)
    return parser.parse_args()


def renamed_path(relative: Path) -> Path:
    parts = []
    for part in relative.parts:
        part = part.replace("MINN_ADMIN", "MINIMAL_ADMIN")
        part = part.replace("Minn_Admin", "Minimal_Admin")
        part = part.replace("minn_admin", "minimal_admin")
        part = part.replace("minn-admin", "minimal-admin")
        part = re.sub(r"\bminn\b", "minimal", part)
        parts.append(part)
    return Path(*parts)


def source_digest(source: Path, files: list[Path]) -> str:
    digest = hashlib.sha256()
    for path in files:
        relative = path.relative_to(source).as_posix()
        digest.update(relative.encode() + b"\0")
        digest.update(path.read_bytes())
        digest.update(b"\0")
    return digest.hexdigest()


def transform_text(text: str) -> str:
    for old, new in LITERAL_REPLACEMENTS:
        text = text.replace(old, new)
    return text


def customize_main_file(path: Path, version: str) -> None:
    text = path.read_text()
    text = re.sub(r"(?mi)^ \* Plugin URI:\s*.*$", " * Plugin URI:        https://feicode.com/WenPai-org/minimal-admin", text, count=1)
    text = re.sub(r"(?mi)^ \* Version:\s*.*$", f" * Version:           {version}", text, count=1)
    text = re.sub(r"(?mi)^ \* Author:\s*.*$", " * Author:            WenPai.org", text, count=1)
    text = re.sub(r"(?mi)^ \* Author URI:\s*.*$", " * Author URI:        https://wenpai.org", text, count=1)
    text = re.sub(r"(?mi)^ \* Text Domain:\s*.*$", " * Text Domain:       minimal-admin\n * Update URI:       https://updates.wenpai.net", text, count=1)
    text = re.sub(r"define\( 'MINIMAL_ADMIN_VERSION',\s*'[^']+' \);", f"define( 'MINIMAL_ADMIN_VERSION', '{version}' );", text, count=1)
    path.write_text(text)


def customize_manifest(path: Path, version: str) -> None:
    data = json.loads(path.read_text())
    data.update(
        {
            "name": "Minimal Admin",
            "slug": "minimal-admin",
            "author": '<a href="https://wenpai.org">WenPai.org</a>',
            "author_profile": "https://wenpai.org",
            "donate_link": "https://wenpai.org",
            "version": version,
            "download_url": f"https://feicode.com/WenPai-org/minimal-admin/releases/download/v{version}/minimal-admin-{version}.zip",
            "sha256": "",
            "homepage": "https://feicode.com/WenPai-org/minimal-admin",
        }
    )
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def customize_readme(path: Path) -> None:
    text = path.read_text()
    text = re.sub(
        r"\*\*Website:\*\*.*",
        "**Repository:** [FeiCode](https://feicode.com/WenPai-org/minimal-admin) · [User guide](https://feicode.com/WenPai-org/minimal-admin/src/branch/main/docs/user-guide.md) · [FAQ](#faq) · [Security](SECURITY.md) · [Roadmap](https://feicode.com/WenPai-org/minimal-admin/src/branch/main/docs/editor-roadmap.md)",
        text,
        count=1,
    )
    text = text.replace("![Minimal Admin — Overview](.github/screenshot-dark.png)", "![Minimal Admin — Overview](assets/images/screenshot-dark.png)")
    text = re.sub(r"\n<!--\n  The badge/launch link above.*?\n-->\n", "\n", text, flags=re.DOTALL)
    lines = text.splitlines()
    lines = [line for line in lines if "Launch in WordPress Playground" not in line]
    path.write_text("\n".join(lines) + "\n")


def customize_updater(path: Path) -> None:
    text = path.read_text()
    text = text.replace("Checks the manifest.json on GitHub", "Checks manifest.json on FeiCode")
    text = text.replace("update package from GitHub Releases", "update package from FeiCode Releases")
    text = text.replace("zip comes from\n\t * GitHub's release CDN", "zip comes from\n\t * FeiCode release assets")
    path.write_text(text)


def remove_previous(output: Path) -> None:
    index = output / MANAGED_INDEX
    if not index.exists():
        return
    previous = json.loads(index.read_text())
    for item in sorted(previous.get("files", []), reverse=True):
        target = output / item
        if target.is_file() or target.is_symlink():
            target.unlink()
    for directory in sorted({str(Path(item).parent) for item in previous.get("files", [])}, reverse=True):
        target = output / directory
        if target != output and target.is_dir():
            try:
                target.rmdir()
            except OSError:
                pass


def main() -> int:
    args = parse_args()
    source = args.source.resolve()
    output = args.output.resolve()
    if not (source / "minn-admin.php").is_file():
        raise SystemExit("source is not a Minn Admin checkout")
    if not re.fullmatch(r"v\d+\.\d+\.\d+", args.upstream_tag):
        raise SystemExit("upstream tag must be a stable vX.Y.Z tag")
    expected = args.upstream_tag.removeprefix("v") + ".1"
    if args.version != expected:
        raise SystemExit(f"downstream version must be {expected}")
    if not re.fullmatch(r"[0-9a-f]{40}", args.upstream_commit):
        raise SystemExit("upstream commit must be a full SHA-1")

    source_files = sorted(
        p for p in source.rglob("*")
        if p.is_file()
        and (
            p.relative_to(source).as_posix() == ".github/screenshot-dark.png"
            or p.relative_to(source).parts[0] not in EXCLUDED_TOP
        )
    )
    remove_previous(output)
    generated: list[str] = []
    for src in source_files:
        rel = src.relative_to(source)
        dst_rel = Path("assets/images/screenshot-dark.png") if rel.as_posix() == ".github/screenshot-dark.png" else renamed_path(rel)
        if dst_rel.as_posix() in PROTECTED:
            raise SystemExit(f"upstream path collides with managed file: {dst_rel}")
        dst = output / dst_rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        raw = src.read_bytes()
        if rel.as_posix() == "LICENSE":
            dst.write_bytes(raw)
        else:
            try:
                text = raw.decode("utf-8")
            except UnicodeDecodeError:
                dst.write_bytes(raw)
            else:
                dst.write_text(transform_text(text))
        shutil.copymode(src, dst)
        generated.append(dst_rel.as_posix())

    customize_main_file(output / "minimal-admin.php", args.version)
    customize_manifest(output / "manifest.json", args.version)
    customize_readme(output / "readme.md")
    customize_updater(output / "includes/class-minimal-admin-updater.php")

    transform_sha = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    lock = {
        "schema_version": 1,
        "upstream_repository": "https://feicode.com/WPFork/minn-admin-upstream",
        "canonical_upstream": "https://github.com/austinginder/minn-admin",
        "upstream_tag": args.upstream_tag,
        "upstream_commit": args.upstream_commit,
        "upstream_source_sha256": source_digest(source, source_files),
        "downstream_version": args.version,
        "transformation_sha256": transform_sha,
        "synced_at": datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
    }
    (output / "upstream-lock.json").write_text(json.dumps(lock, indent=2) + "\n")
    (output / MANAGED_INDEX).write_text(json.dumps({"files": sorted(generated)}, indent=2) + "\n")
    print(json.dumps(lock, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
