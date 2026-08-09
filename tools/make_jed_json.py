#!/usr/bin/env python3
"""Build WordPress-compatible Jed JSON files from a PO catalog."""
from __future__ import annotations

import argparse
import ast
import hashlib
import json
import re
from pathlib import Path


def quoted(value: str) -> str:
    parsed = ast.literal_eval(value.strip())
    if not isinstance(parsed, str):
        raise ValueError("PO value is not a string")
    return parsed


def parse_po(path: Path) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    entry: dict[str, object] = {"references": [], "msgstr": {}}
    active: tuple[str, int | None] | None = None

    def finish() -> None:
        nonlocal entry, active
        if "msgid" in entry:
            entries.append(entry)
        entry = {"references": [], "msgstr": {}}
        active = None

    for raw in path.read_text(encoding="utf-8").splitlines() + [""]:
        line = raw.strip()
        if not line:
            finish()
            continue
        if line.startswith("#: "):
            entry["references"] = list(entry["references"]) + line[3:].split()
            continue
        match = re.match(r"^(msgctxt|msgid_plural|msgid|msgstr)(?:\[(\d+)])?\s+(\".*\")$", line)
        if match:
            field, index, value = match.groups()
            if field == "msgstr":
                idx = int(index or 0)
                entry["msgstr"][idx] = quoted(value)
                active = (field, idx)
            else:
                entry[field] = quoted(value)
                active = (field, None)
            continue
        if line.startswith('"') and active:
            value = quoted(line)
            field, index = active
            if field == "msgstr":
                entry["msgstr"][index] = str(entry["msgstr"].get(index, "")) + value
            else:
                entry[field] = str(entry.get(field, "")) + value
    return entries


def headers(entry: dict[str, object]) -> dict[str, str]:
    result: dict[str, str] = {}
    header = str(entry.get("msgstr", {}).get(0, ""))
    for line in header.splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            result[key.strip().lower()] = value.strip()
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("po", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--domain", default="messages")
    args = parser.parse_args()

    entries = parse_po(args.po)
    if not entries or entries[0].get("msgid") != "":
        raise SystemExit("PO catalog has no valid header")
    metadata = headers(entries[0])
    locale = metadata.get("language")
    if not locale:
        raise SystemExit("PO catalog has no Language header")

    by_source: dict[str, dict[str, list[str]]] = {}
    for entry in entries[1:]:
        references = entry.get("references", [])
        sources = {
            ref.rsplit(":", 1)[0].removeprefix("./")
            for ref in references
            if re.search(r"\.(?:js|jsx|ts|tsx)(?::\d+)?$", ref)
        }
        if not sources:
            continue
        forms = entry.get("msgstr", {})
        translations = [str(forms[index]) for index in sorted(forms)]
        if not translations or not any(translations):
            continue
        key = str(entry.get("msgid", ""))
        if entry.get("msgctxt"):
            key = f"{entry['msgctxt']}\u0004{key}"
        for source in sources:
            by_source.setdefault(source, {})[key] = translations

    all_sources = {
        ref.rsplit(":", 1)[0].removeprefix("./")
        for entry in entries[1:]
        for ref in entry.get("references", [])
        if re.search(r"\.(?:js|jsx|ts|tsx)(?::\d+)?$", ref)
    }
    args.output.mkdir(parents=True, exist_ok=True)
    prefix = args.po.stem
    for stale in args.output.glob(f"{prefix}-*.json"):
        stale.unlink()
    for source in sorted(all_sources):
        messages: dict[str, object] = {
            "": {
                "domain": args.domain,
                "lang": locale,
                "plural-forms": metadata.get("plural-forms", "nplurals=1; plural=0;"),
            }
        }
        messages.update(by_source.get(source, {}))
        payload = {
            "translation-revision-date": metadata.get("po-revision-date", ""),
            "generator": "Minimal Admin make_jed_json.py",
            "source": source,
            "domain": args.domain,
            "locale_data": {args.domain: messages},
        }
        digest = hashlib.md5(source.encode(), usedforsecurity=False).hexdigest()
        target = args.output / f"{prefix}-{digest}.json"
        target.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + "\n")
        print(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
