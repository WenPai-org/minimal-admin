#!/usr/bin/env python3
"""Translate the documentation gettext catalog with the Luna model.

The script is deliberately separate from the scheduled GlotPress sync. It creates
reviewable PO files locally, validates every protected Markdown token, and keeps a
checkpoint so an interrupted bulk translation can be resumed safely.
"""
from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import json
import os
import re
import subprocess
import tempfile
import threading
from pathlib import Path

import docs_i18n


MODEL = "gpt-5.6-luna"
LOCALES = {
    "zh_CN": "Simplified Chinese (zh-CN)",
    "zh_TW": "Traditional Chinese (zh-TW)",
}
TOKEN_RE = re.compile(r"__MA_DOC_TOKEN_\d+__")
WRITE_LOCK = threading.Lock()
SCHEMA = {
    "type": "object",
    "properties": {
        "translations": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "id": {"type": "string"},
                    "text": {"type": "string"},
                },
                "required": ["id", "text"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["translations"],
    "additionalProperties": False,
}


def catalog_entries(docs_root: Path) -> list[dict[str, object]]:
    entries: dict[tuple[str, str], list[str]] = {}
    for path in docs_i18n.source_files(docs_root):
        relative = path.relative_to(docs_root.parent).as_posix()
        for number, segment in docs_i18n.numbered_segments(path, docs_root):
            entries.setdefault((segment.context, segment.protected), []).append(
                f"{relative}:{number}"
            )
    result = []
    for number, ((context, message), references) in enumerate(sorted(entries.items()), 1):
        result.append(
            {
                "id": f"e{number:05d}",
                "context": context,
                "message": message,
                "references": references,
            }
        )
    return result


def source_digest(entries: list[dict[str, object]]) -> str:
    raw = json.dumps(entries, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(raw.encode()).hexdigest()


def make_batches(
    entries: list[dict[str, object]], max_chars: int, max_entries: int
) -> list[list[dict[str, object]]]:
    batches: list[list[dict[str, object]]] = []
    current: list[dict[str, object]] = []
    chars = 0
    for entry in entries:
        size = len(str(entry["message"]))
        if current and (len(current) >= max_entries or chars + size > max_chars):
            batches.append(current)
            current = []
            chars = 0
        current.append(entry)
        chars += size
    if current:
        batches.append(current)
    return batches


def token_list(value: str) -> list[str]:
    return sorted(TOKEN_RE.findall(value))


def translate_batch(
    locale: str,
    batch_number: int,
    batch: list[dict[str, object]],
    schema_path: Path,
    work_root: Path,
    retries: int,
) -> dict[str, str]:
    payload = [{"id": item["id"], "text": item["message"]} for item in batch]
    expected = {str(item["id"]): str(item["message"]) for item in batch}
    prompt = f"""Translate the supplied Minimal Admin technical documentation strings into {LOCALES[locale]}.

Rules:
- Return every input id exactly once using the required JSON schema.
- Translate prose naturally and consistently for WordPress administrators and plugin developers.
- Preserve every __MA_DOC_TOKEN_N__ placeholder exactly, including its number and occurrence count.
- Preserve Markdown punctuation, table pipes, heading meaning, product names, command names, API identifiers, option keys, file paths, and version numbers.
- Do not add explanations, comments, transliterations, or missing details.
- Use Chinese punctuation where it does not alter Markdown syntax.

Input JSON:
{json.dumps(payload, ensure_ascii=False, separators=(",", ":"))}
"""
    stem = f"{locale}-batch-{batch_number:04d}"
    output_path = work_root / f"{stem}.json"
    events_path = work_root / f"{stem}.events.jsonl"
    for attempt in range(1, retries + 1):
        with events_path.open("w") as events:
            completed = subprocess.run(
                [
                    "codex",
                    "exec",
                    "--ignore-user-config",
                    "--ephemeral",
                    "--skip-git-repo-check",
                    "--ignore-rules",
                    "-C",
                    str(work_root),
                    "-m",
                    MODEL,
                    "-c",
                    'model_reasoning_effort="low"',
                    "-s",
                    "read-only",
                    "--output-schema",
                    str(schema_path),
                    "-o",
                    str(output_path),
                    "--json",
                    "-",
                ],
                input=prompt,
                text=True,
                stdout=events,
                stderr=subprocess.STDOUT,
                check=False,
            )
        try:
            if completed.returncode:
                raise RuntimeError(f"codex exited {completed.returncode}")
            response = json.loads(output_path.read_text())
            translated = {
                str(item["id"]): str(item["text"])
                for item in response["translations"]
            }
            if set(translated) != set(expected):
                raise ValueError("response ids do not match input ids")
            for item_id, value in translated.items():
                if not value.strip():
                    raise ValueError(f"empty translation for {item_id}")
                if token_list(value) != token_list(expected[item_id]):
                    raise ValueError(f"protected tokens changed for {item_id}")
            return translated
        except (KeyError, TypeError, ValueError, json.JSONDecodeError, RuntimeError) as error:
            if attempt == retries:
                raise RuntimeError(f"{stem} failed after {retries} attempts: {error}") from error
    raise AssertionError("unreachable")


def save_checkpoint(path: Path, digest: str, locale: str, translations: dict[str, str]) -> None:
    temporary = path.with_suffix(".tmp")
    temporary.write_text(
        json.dumps(
            {
                "model": MODEL,
                "locale": locale,
                "source_sha256": digest,
                "translations": translations,
            },
            ensure_ascii=False,
            indent=2,
            sort_keys=True,
        )
        + "\n"
    )
    os.replace(temporary, path)


def load_checkpoint(path: Path, digest: str, locale: str) -> dict[str, str]:
    if not path.exists():
        return {}
    data = json.loads(path.read_text())
    if data.get("model") != MODEL or data.get("locale") != locale:
        raise RuntimeError(f"checkpoint metadata does not match: {path}")
    if data.get("source_sha256") != digest:
        # Source docs can advance between a resumable run and the next release.
        # IDs are assigned from the complete sorted catalog, so reusing a stale
        # ID map could translate the wrong source string.  Ignore it; callers
        # may still seed safely by exact context/msgid from the generated PO.
        print(f"{locale}: ignoring stale checkpoint {path}", flush=True)
        return {}
    return {str(key): str(value) for key, value in data["translations"].items()}


def seed_from_generated_po(path: Path, entries: list[dict[str, object]]) -> dict[str, str]:
    """Reuse translations from a PO previously written by this script."""
    if not path.exists():
        return {}
    catalog: dict[tuple[str, str], str] = {}
    context: str | None = None
    message: str | None = None
    for line in path.read_text().splitlines():
        if line.startswith("msgctxt "):
            context = json.loads(line.removeprefix("msgctxt "))
        elif line.startswith("msgid "):
            message = json.loads(line.removeprefix("msgid "))
        elif line.startswith("msgstr ") and context is not None and message is not None:
            translation = json.loads(line.removeprefix("msgstr "))
            if translation:
                catalog[(context, message)] = translation
            context = None
            message = None
    return {
        str(entry["id"]): catalog[(str(entry["context"]), str(entry["message"]))]
        for entry in entries
        if (str(entry["context"]), str(entry["message"])) in catalog
    }


def write_po(
    path: Path,
    locale: str,
    version: str,
    entries: list[dict[str, object]],
    translations: dict[str, str],
) -> None:
    lines = [
        "# Copyright (C) 2026 WenPai.org",
        f"# Minimal Admin documentation translation generated with {MODEL}.",
        'msgid ""',
        'msgstr ""',
        docs_i18n.po_quote(f"Project-Id-Version: Minimal Admin Docs {version}\n"),
        docs_i18n.po_quote(f"Language: {locale}\n"),
        docs_i18n.po_quote("PO-Revision-Date: 2026-08-11 00:00+0000\n"),
        docs_i18n.po_quote(f"Last-Translator: Minimal Admin Luna ({locale})\n"),
        docs_i18n.po_quote(f"Language-Team: Minimal Admin {locale}\n"),
        docs_i18n.po_quote("MIME-Version: 1.0\n"),
        docs_i18n.po_quote("Content-Type: text/plain; charset=UTF-8\n"),
        docs_i18n.po_quote("Content-Transfer-Encoding: 8bit\n"),
        docs_i18n.po_quote(f"X-Generator: {MODEL}\n"),
        "",
    ]
    for entry in entries:
        item_id = str(entry["id"])
        lines.append("#: " + " ".join(str(value) for value in entry["references"]))
        lines.append("msgctxt " + docs_i18n.po_quote(str(entry["context"])))
        lines.append("msgid " + docs_i18n.po_quote(str(entry["message"])))
        lines.append("msgstr " + docs_i18n.po_quote(translations[item_id]))
        lines.append("")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--docs", type=Path, default=Path("docs"))
    parser.add_argument("--output", type=Path, default=Path("docs/languages"))
    parser.add_argument("--work", type=Path, default=Path(".work/luna-docs"))
    parser.add_argument("--locale", choices=[*LOCALES, "all"], default="all")
    parser.add_argument("--version", default="0.0.0")
    parser.add_argument("--workers", type=int, default=3)
    parser.add_argument("--max-chars", type=int, default=8000)
    parser.add_argument("--max-entries", type=int, default=80)
    parser.add_argument("--retries", type=int, default=5)
    parser.add_argument(
        "--seed-existing-output",
        action="store_true",
        help="reuse matching context/msgid translations from the existing output PO",
    )
    args = parser.parse_args()

    docs_root = args.docs.resolve()
    output_root = args.output.resolve()
    work_root = args.work.resolve()
    work_root.mkdir(parents=True, exist_ok=True)
    schema_path = work_root / "response-schema.json"
    schema_path.write_text(json.dumps(SCHEMA, indent=2) + "\n")

    entries = catalog_entries(docs_root)
    digest = source_digest(entries)
    locales = list(LOCALES) if args.locale == "all" else [args.locale]
    for locale in locales:
        checkpoint_path = work_root / f"checkpoint-{locale}.json"
        translations = load_checkpoint(checkpoint_path, digest, locale)
        if not translations and args.seed_existing_output:
            translations = seed_from_generated_po(
                output_root / f"minimal-admin-docs-{locale}.po", entries
            )
            if translations:
                save_checkpoint(checkpoint_path, digest, locale, translations)
                print(
                    f"{locale}: seeded {len(translations)} matching translations from existing PO",
                    flush=True,
                )
        missing = [item for item in entries if str(item["id"]) not in translations]
        batches = make_batches(missing, args.max_chars, args.max_entries)
        print(
            f"{locale}: {len(translations)}/{len(entries)} checkpointed; "
            f"translating {len(missing)} strings in {len(batches)} batches with {MODEL}",
            flush=True,
        )
        round_number = 1
        batch_serial = 0
        while batches:
            failed: list[dict[str, object]] = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as executor:
                futures = {}
                for batch in batches:
                    batch_serial += 1
                    future = executor.submit(
                        translate_batch,
                        locale,
                        batch_serial,
                        batch,
                        schema_path,
                        work_root,
                        args.retries,
                    )
                    futures[future] = (batch_serial, batch)
                for future in concurrent.futures.as_completed(futures):
                    number, batch = futures[future]
                    try:
                        additions = future.result()
                    except RuntimeError as error:
                        failed.extend(batch)
                        print(
                            f"{locale}: batch {number} will be split after validation failure: {error}",
                            flush=True,
                        )
                        continue
                    with WRITE_LOCK:
                        translations.update(additions)
                        save_checkpoint(checkpoint_path, digest, locale, translations)
                        print(
                            f"{locale}: completed batch {number}; "
                            f"{len(translations)}/{len(entries)} strings",
                            flush=True,
                        )
            if not failed:
                break
            if round_number >= 4:
                raise RuntimeError(
                    f"{locale}: {len(failed)} individual strings still failed validation"
                )
            round_number += 1
            divisor = 4 ** (round_number - 1)
            retry_chars = max(500, args.max_chars // divisor)
            retry_entries = max(1, args.max_entries // divisor)
            batches = make_batches(failed, retry_chars, retry_entries)
            if retry_entries == 1 and all(len(batch) == 1 for batch in batches):
                print(
                    f"{locale}: retrying {len(failed)} individual strings after validation failures",
                    flush=True,
                )
            else:
                print(
                    f"{locale}: retry round {round_number} uses {len(batches)} smaller batches",
                    flush=True,
                )
        if len(translations) != len(entries):
            raise RuntimeError(f"{locale}: incomplete translation checkpoint")
        write_po(
            output_root / f"minimal-admin-docs-{locale}.po",
            locale,
            args.version,
            entries,
            translations,
        )
        print(f"{locale}: wrote {len(entries)} translations", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
