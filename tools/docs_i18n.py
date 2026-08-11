#!/usr/bin/env python3
"""Extract Markdown documentation into gettext and render reviewed translations."""
from __future__ import annotations

import argparse
import gettext
import html
import json
import re
from dataclasses import dataclass
from pathlib import Path


SOURCE_GLOB = "*.md"
SKIP_NAMES = {"README.md"}
FENCE_RE = re.compile(r"^\s*(```|~~~)")
STRUCTURE_RE = re.compile(r"^\s*(?:[-*_]\s*){3,}$")
TABLE_RULE_RE = re.compile(r"^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$")
PREFIX_RE = re.compile(r"^(\s*(?:(?:#{1,6}|>|[-+*]|\d+[.)])\s+)?)(.*?)(\s*)$")
PROTECTED_RE = re.compile(
    r"`[^`]+`|!?(?:\[[^]]*\]\([^)]*\))|https?://[^\s)>]+|<[^>]+>|"
    r"%(?:\d+\$)?[bcdeEfFgGosuxX%]"
)
TOKEN_RE = re.compile(r"__MA_DOC_TOKEN_(\d+)__")


@dataclass(frozen=True)
class Segment:
    context: str
    original: str
    protected: str
    tokens: tuple[str, ...]


def protect(value: str) -> tuple[str, tuple[str, ...]]:
    tokens: list[str] = []

    def replace(match: re.Match[str]) -> str:
        tokens.append(match.group(0))
        return f"__MA_DOC_TOKEN_{len(tokens)}__"

    return PROTECTED_RE.sub(replace, value), tuple(tokens)


def restore(value: str, tokens: tuple[str, ...]) -> str:
    found = {int(item) for item in TOKEN_RE.findall(value)}
    expected = set(range(1, len(tokens) + 1))
    if found != expected:
        raise ValueError("translated Markdown changed protected token set")
    for index, token in enumerate(tokens, 1):
        value = value.replace(f"__MA_DOC_TOKEN_{index}__", token)
    return value


def translatable(value: str) -> bool:
    plain = TOKEN_RE.sub("", value)
    return bool(re.search(r"[A-Za-z]", plain))


def line_segments(relative: str, line: str) -> list[Segment]:
    if not line.strip() or STRUCTURE_RE.match(line) or TABLE_RULE_RE.match(line):
        return []
    prefix, body, _suffix = PREFIX_RE.match(line).groups()  # type: ignore[union-attr]
    if not body or body.lstrip().startswith(("<!--", "</", "<?")):
        return []
    protected, tokens = protect(body)
    if not translatable(protected):
        return []
    return [Segment(relative, body, protected, tokens)]


def scan_file(path: Path, docs_root: Path) -> list[Segment]:
    relative = path.relative_to(docs_root.parent).as_posix()
    segments: list[Segment] = []
    fence: str | None = None
    for raw in path.read_text().splitlines():
        marker = FENCE_RE.match(raw)
        if marker:
            current = marker.group(1)
            fence = None if fence == current else current if fence is None else fence
            continue
        if fence is None:
            segments.extend(line_segments(relative, raw))
    return segments


def numbered_segments(path: Path, docs_root: Path) -> list[tuple[int, Segment]]:
    relative = path.relative_to(docs_root.parent).as_posix()
    segments: list[tuple[int, Segment]] = []
    fence: str | None = None
    for number, raw in enumerate(path.read_text().splitlines(), 1):
        marker = FENCE_RE.match(raw)
        if marker:
            current = marker.group(1)
            fence = None if fence == current else current if fence is None else fence
            continue
        if fence is None:
            segments.extend((number, segment) for segment in line_segments(relative, raw))
    return segments


def source_files(docs_root: Path) -> list[Path]:
    return [path for path in sorted(docs_root.glob(SOURCE_GLOB)) if path.name not in SKIP_NAMES]


def po_quote(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"').replace("\t", "\\t").replace("\n", "\\n") + '"'


def extract(docs_root: Path, output: Path, version: str) -> None:
    entries: dict[tuple[str, str], list[str]] = {}
    for path in source_files(docs_root):
        relative = path.relative_to(docs_root.parent).as_posix()
        for number, segment in numbered_segments(path, docs_root):
            entries.setdefault((segment.context, segment.protected), []).append(f"{relative}:{number}")

    lines = [
        "# Copyright (C) 2026 WenPai.org",
        "# Documentation translations for Minimal Admin.",
        'msgid ""',
        'msgstr ""',
        po_quote(f"Project-Id-Version: Minimal Admin Docs {version}\n"),
        po_quote("MIME-Version: 1.0\n"),
        po_quote("Content-Type: text/plain; charset=UTF-8\n"),
        po_quote("Content-Transfer-Encoding: 8bit\n"),
        "",
    ]
    for (context, message), references in sorted(entries.items()):
        lines.append("#: " + " ".join(references))
        lines.append("msgctxt " + po_quote(context))
        lines.append("msgid " + po_quote(message))
        lines.append('msgstr ""')
        lines.append("")
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(lines))
    print(f"Extracted {len(entries)} documentation strings to {output}")


def render(docs_root: Path, mo_path: Path, output_root: Path) -> None:
    with mo_path.open("rb") as stream:
        catalog = gettext.GNUTranslations(stream)
    translated = 0
    rejected = 0
    total = 0
    status: dict[str, dict[str, int | str]] = {}
    output_root.mkdir(parents=True, exist_ok=True)
    for path in source_files(docs_root):
        relative = path.relative_to(docs_root.parent).as_posix()
        output_lines: list[str] = []
        fence: str | None = None
        file_translated = 0
        file_total = 0
        for raw in path.read_text().splitlines(keepends=True):
            newline = "\n" if raw.endswith("\n") else ""
            line = raw[:-1] if newline else raw
            marker = FENCE_RE.match(line)
            if marker:
                current = marker.group(1)
                fence = None if fence == current else current if fence is None else fence
                output_lines.append(raw)
                continue
            if fence is not None:
                output_lines.append(raw)
                continue
            segments = line_segments(relative, line)
            if not segments:
                output_lines.append(raw)
                continue
            segment = segments[0]
            prefix, _body, suffix = PREFIX_RE.match(line).groups()  # type: ignore[union-attr]
            value = catalog.pgettext(segment.context, segment.protected)
            total += 1
            file_total += 1
            if value != segment.protected:
                try:
                    value = restore(value, segment.tokens)
                except ValueError:
                    value = segment.original
                    rejected += 1
                else:
                    translated += 1
                    file_translated += 1
            else:
                value = segment.original
            output_lines.append(prefix + value + suffix + newline)
        destination = output_root / path.name
        if file_translated:
            destination.write_text("".join(output_lines))
        else:
            destination.unlink(missing_ok=True)
        status[path.name] = {
            "translated": file_translated,
            "total": file_total,
            "state": "partial" if file_translated else "pending",
        }
    (output_root / "translation-status.json").write_text(
        json.dumps({"translated": translated, "total": total, "files": status}, indent=2) + "\n"
    )
    print(
        f"Rendered {translated}/{total} reviewed documentation strings to {output_root}; "
        f"rejected {rejected} translations with invalid protected tokens"
    )


def po_value(line: str, directive: str) -> str:
    if not line.startswith(directive + " "):
        raise ValueError(f"expected {directive} directive")
    return json.loads(line[len(directive) + 1 :])


def normalize_exported_po(pot_path: Path, po_path: Path) -> None:
    """Restore source msgids after locale punctuation filters alter GP exports."""
    by_reference: dict[str, tuple[str, str]] = {}
    for block in pot_path.read_text().split("\n\n"):
        lines = block.splitlines()
        reference_line = next((line for line in lines if line.startswith("#: ")), None)
        context_line = next((line for line in lines if line.startswith("msgctxt ")), None)
        message_line = next((line for line in lines if line.startswith("msgid ")), None)
        if not reference_line or not context_line or not message_line:
            continue
        context = po_value(context_line, "msgctxt")
        message = po_value(message_line, "msgid")
        for reference in reference_line.removeprefix("#: ").split():
            by_reference[reference] = (context, message)

    normalized: list[str] = []
    changed = 0
    dropped = 0
    for block in po_path.read_text().split("\n\n"):
        lines = block.splitlines()
        reference_line = next((line for line in lines if line.startswith("#: ")), None)
        context_index = next((i for i, line in enumerate(lines) if line.startswith("msgctxt ")), None)
        message_index = next((i for i, line in enumerate(lines) if line.startswith("msgid ")), None)
        translation_index = next((i for i, line in enumerate(lines) if line.startswith("msgstr ")), None)
        if reference_line and context_index is not None and message_index is not None:
            references = reference_line.removeprefix("#: ").split()
            sources = {by_reference[reference] for reference in references if reference in by_reference}
            if not sources:
                dropped += 1
                continue
            if len(sources) > 1:
                raise ValueError(f"exported PO references do not identify one source: {references}")
            context, message = sources.pop()
            if translation_index is not None:
                translation = html.unescape(po_value(lines[translation_index], "msgstr"))
                if translation and set(TOKEN_RE.findall(translation)) != set(TOKEN_RE.findall(message)):
                    dropped += 1
                    continue
            replacement_context = "msgctxt " + po_quote(context)
            replacement_message = "msgid " + po_quote(message)
            if lines[context_index] != replacement_context or lines[message_index] != replacement_message:
                changed += 1
            lines[context_index] = replacement_context
            lines[message_index] = replacement_message
        if translation_index is not None:
            translation = po_value(lines[translation_index], "msgstr")
            decoded = html.unescape(translation)
            if decoded != translation:
                changed += 1
                lines[translation_index] = "msgstr " + po_quote(decoded)
        normalized.append("\n".join(lines))
    po_path.write_text("\n\n".join(normalized))
    print(
        f"Normalized {changed} GlotPress punctuation changes and "
        f"dropped {dropped} obsolete or incompatible entries in {po_path}"
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    subparsers = parser.add_subparsers(dest="command", required=True)
    extract_parser = subparsers.add_parser("extract")
    extract_parser.add_argument("--docs", type=Path, default=Path("docs"))
    extract_parser.add_argument("--output", type=Path, default=Path("languages/minimal-admin-docs.pot"))
    extract_parser.add_argument("--version", default="0.0.0")
    render_parser = subparsers.add_parser("render")
    render_parser.add_argument("--docs", type=Path, default=Path("docs"))
    render_parser.add_argument("--mo", type=Path, required=True)
    render_parser.add_argument("--output", type=Path, required=True)
    normalize_parser = subparsers.add_parser("normalize-po")
    normalize_parser.add_argument("--pot", type=Path, required=True)
    normalize_parser.add_argument("--po", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "extract":
        extract(args.docs.resolve(), args.output.resolve(), args.version)
    elif args.command == "render":
        render(args.docs.resolve(), args.mo.resolve(), args.output.resolve())
    else:
        normalize_exported_po(args.pot.resolve(), args.po.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
