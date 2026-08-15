#!/usr/bin/env python3
"""Derive a Traditional Chinese PO from the pinned upstream zh_CN catalog."""
from __future__ import annotations

import argparse
import ast
import json
import shutil
import subprocess
import tempfile
from pathlib import Path


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--opencc", default="opencc")
    return parser.parse_args()


def po_string(line: str) -> str:
    start = line.find('"')
    if start < 0:
        raise ValueError(f"invalid PO string: {line}")
    value = ast.literal_eval(line[start:])
    if not isinstance(value, str):
        raise ValueError(f"invalid PO value: {line}")
    return value


def encoded(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def translatable_line_indexes(lines: list[str]) -> list[int]:
    indexes = []
    in_header = any(line == 'msgid ""' for line in lines) and not any(
        line.startswith("msgctxt ") for line in lines
    )
    active = False
    for index, line in enumerate(lines):
        if line.startswith("msgstr"):
            active = not in_header
            if active:
                indexes.append(index)
            continue
        if active and line.startswith('"'):
            indexes.append(index)
        elif line and not line.startswith('"'):
            active = False
    return indexes


def convert(values: list[str], command: str) -> list[str]:
    executable = shutil.which(command) if "/" not in command else command
    if not executable:
        raise SystemExit("opencc is unavailable; preserving the existing zh_TW catalog")
    with tempfile.TemporaryDirectory() as temporary:
        root = Path(temporary)
        source = root / "source.jsonl"
        target = root / "target.jsonl"
        source.write_text("".join(json.dumps(value, ensure_ascii=False) + "\n" for value in values))
        subprocess.run(
            [executable, "-c", "s2twp", "-i", str(source), "-o", str(target)],
            check=True,
        )
        result = [json.loads(line) for line in target.read_text().splitlines()]
    if len(result) != len(values):
        raise SystemExit("opencc changed the number of catalog strings")
    return result


def main() -> int:
    args = arguments()
    blocks = args.source.read_text(encoding="utf-8").split("\n\n")
    locations = []
    values = []
    parsed = [block.splitlines() for block in blocks]
    for block_index, lines in enumerate(parsed):
        for line_index in translatable_line_indexes(lines):
            locations.append((block_index, line_index))
            values.append(po_string(lines[line_index]))
        for line_index, line in enumerate(lines):
            if line.startswith('"Language: '):
                lines[line_index] = '"Language: zh_TW\\n"'
            elif line.startswith('"Project-Id-Version: '):
                lines[line_index] = line.replace("Simplified Chinese", "Traditional Chinese")
    converted = convert(values, args.opencc)
    for (block_index, line_index), value in zip(locations, converted, strict=True):
        prefix = parsed[block_index][line_index].split('"', 1)[0]
        parsed[block_index][line_index] = prefix + encoded(value)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text("\n\n".join("\n".join(lines) for lines in parsed), encoding="utf-8")
    print(f"derived {len(values)} Traditional Chinese translation fragments")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
