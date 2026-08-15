#!/usr/bin/env python3
"""Build deterministic WordPress language packs for the downstream text domain."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile
from pathlib import Path

from make_jed_json import headers, parse_po


SLUG = "minimal-admin"
FIXED_TIME = (1980, 1, 1, 0, 0, 0)
BUNDLED_LOCALES = {"zh_CN", "zh_TW"}
ALIASES = {
    "en_AU": "en_GB",
    "en_CA": "en_GB",
    "en_NZ": "en_GB",
    "en_ZA": "en_GB",
}


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path.cwd())
    parser.add_argument("--dist", type=Path)
    parser.add_argument("--update-manifest", action="store_true")
    return parser.parse_args()


def stamp_catalog(text: str, locale: str, version: str) -> str:
    lines = []
    saw_project = False
    saw_language = False
    for line in text.splitlines():
        if line.startswith('"Project-Id-Version: '):
            line = f'"Project-Id-Version: Minimal Admin {version}\\n"'
            saw_project = True
        elif line.startswith('"Language: '):
            line = f'"Language: {locale}\\n"'
            saw_language = True
        lines.append(line)
    if not saw_project or not saw_language:
        raise ValueError("catalog is missing Project-Id-Version or Language header")
    return "\n".join(lines) + "\n"


def message_key(entry: dict[str, object]) -> str:
    value = str(entry.get("msgid", ""))
    plural = str(entry.get("msgid_plural", ""))
    if plural:
        value += "\0" + plural
    context = str(entry.get("msgctxt", ""))
    if context:
        value = context + "\x04" + value
    return value


def message_value(entry: dict[str, object]) -> str:
    forms = entry.get("msgstr", {})
    if not isinstance(forms, dict):
        return ""
    return "\0".join(str(forms[index]) for index in sorted(forms))


def compile_mo(po_path: Path, output: Path) -> None:
    entries = parse_po(po_path)
    messages = sorted(
        (
            (message_key(entry), message_value(entry))
            for entry in entries
            if entry.get("msgid") == "" or message_value(entry).strip("\0")
        ),
        key=lambda pair: pair[0],
    )
    encoded = [(key.encode("utf-8"), value.encode("utf-8")) for key, value in messages]
    count = len(encoded)
    originals_offset = 28
    translations_offset = originals_offset + count * 8
    strings_offset = translations_offset + count * 8

    original_blob = b""
    original_table = []
    for key, _ in encoded:
        original_table.append((len(key), strings_offset + len(original_blob)))
        original_blob += key + b"\0"

    translation_start = strings_offset + len(original_blob)
    translation_blob = b""
    translation_table = []
    for _, value in encoded:
        translation_table.append((len(value), translation_start + len(translation_blob)))
        translation_blob += value + b"\0"

    payload = struct.pack(
        "<7I", 0x950412DE, 0, count, originals_offset, translations_offset, 0, 0
    )
    payload += b"".join(struct.pack("<2I", *item) for item in original_table)
    payload += b"".join(struct.pack("<2I", *item) for item in translation_table)
    output.write_bytes(payload + original_blob + translation_blob)


def build_jed(po_path: Path, output: Path, tools: Path) -> list[Path]:
    subprocess.run(
        [sys.executable, str(tools / "make_jed_json.py"), str(po_path), str(output), "--domain", SLUG],
        check=True,
        text=True,
        capture_output=True,
    )
    return sorted(output.glob(f"{po_path.stem}-*.json"))


def write_zip(path: Path, files: list[Path]) -> str:
    with zipfile.ZipFile(path, "w", compression=zipfile.ZIP_STORED) as archive:
        for source in sorted(files, key=lambda item: item.name):
            info = zipfile.ZipInfo(source.name, FIXED_TIME)
            info.external_attr = (0o100644 << 16)
            info.compress_type = zipfile.ZIP_STORED
            archive.writestr(info, source.read_bytes())
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    path.with_suffix(path.suffix + ".sha256").write_text(f"{digest}  {path.name}\n")
    return digest


def catalog_sources(languages: Path) -> dict[str, Path]:
    result = {}
    for path in languages.glob(f"{SLUG}-*.po"):
        locale = path.stem.removeprefix(f"{SLUG}-")
        if locale != "docs":
            result[locale] = path
    return result


def main() -> int:
    args = arguments()
    root = args.root.resolve()
    manifest_path = root / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    version = str(manifest["version"])
    languages = root / "languages"
    sources = catalog_sources(languages)
    requested = {
        str(item.get("language"))
        for item in manifest.get("translations", [])
        if isinstance(item, dict) and item.get("language")
    }
    requested.update(sources)
    previous = {
        str(item.get("language")): item
        for item in manifest.get("translations", [])
        if isinstance(item, dict) and item.get("language")
    }

    dist = (args.dist or root / "dist" / "languages").resolve()
    dist.mkdir(parents=True, exist_ok=True)
    for stale in dist.glob(f"{SLUG}-*.zip*"):
        stale.unlink()

    entries = []
    warnings = []
    for locale in sorted(requested):
        source_locale = locale if locale in sources else ALIASES.get(locale, "")
        source = sources.get(source_locale)
        if not source:
            warnings.append(f"{locale}: no downstream catalog source")
            continue
        try:
            stamped = stamp_catalog(source.read_text(encoding="utf-8"), locale, version)
            with tempfile.TemporaryDirectory() as temporary:
                work = Path(temporary)
                po = work / f"{SLUG}-{locale}.po"
                po.write_text(stamped, encoding="utf-8")
                parsed = parse_po(po)
                if not parsed or parsed[0].get("msgid") != "":
                    raise ValueError("catalog has no valid header")
                metadata = headers(parsed[0])
                if metadata.get("language") != locale:
                    raise ValueError("catalog language header does not match target")
                mo = work / f"{SLUG}-{locale}.mo"
                compile_mo(po, mo)
                jed = build_jed(po, work, root / "tools")
                if not jed:
                    raise ValueError("catalog produced no JavaScript translation file")
                pack = dist / f"{SLUG}-{locale}.zip"
                digest = write_zip(pack, [po, mo, *jed])
                if locale in BUNDLED_LOCALES:
                    for stale in languages.glob(f"{SLUG}-{locale}-*.json"):
                        stale.unlink()
                    shutil.copy2(mo, languages / mo.name)
                    for item in jed:
                        shutil.copy2(item, languages / item.name)
                old = previous.get(locale, {})
                entries.append(
                    {
                        "language": locale,
                        "version": version,
                        "updated": old.get("updated", manifest.get("last_updated", "")),
                        "package": (
                            "https://feicode.com/WenPai-org/minimal-admin/releases/download/"
                            f"v{version}/{pack.name}"
                        ),
                        "sha256": digest,
                        "catalog": hashlib.sha256(stamped.encode()).hexdigest(),
                    }
                )
        except (OSError, ValueError, subprocess.CalledProcessError) as error:
            warnings.append(f"{locale}: {error}")

    for warning in warnings:
        print(f"warning: skipped language pack {warning}", file=sys.stderr)
    candidate = sorted(entries, key=lambda item: item["language"])
    if args.update_manifest:
        manifest["translations"] = candidate
        manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    elif manifest.get("translations", []) != candidate:
        raise SystemExit("language-pack manifest does not match deterministic build")

    print(json.dumps({"version": version, "packs": len(candidate), "skipped": len(warnings)}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
