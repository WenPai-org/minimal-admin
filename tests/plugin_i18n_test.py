#!/usr/bin/env python3
"""Regression tests for the bundled Simplified and Traditional Chinese catalogs."""
from __future__ import annotations

from collections import Counter
import gettext
import json
from pathlib import Path
import re
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
from make_jed_json import parse_po  # noqa: E402

LOCALES = ("zh_CN", "zh_TW")
FORMAT_TOKEN = re.compile(r"%(?:\d+\$)?[a-zA-Z]")
JS_REFERENCE = re.compile(r"\.(?:js|jsx|ts|tsx)(?::\d+)?$")


def key(entry: dict[str, object]) -> tuple[str, str, str]:
    return (
        str(entry.get("msgctxt", "")),
        str(entry.get("msgid", "")),
        str(entry.get("msgid_plural", "")),
    )


class PluginI18nTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.template = parse_po(ROOT / "languages/minimal-admin.pot")[1:]

    def catalog(self, locale: str) -> list[dict[str, object]]:
        return parse_po(ROOT / f"languages/minimal-admin-{locale}.po")[1:]

    def test_catalogs_cover_the_current_template(self) -> None:
        expected = {key(entry) for entry in self.template}
        self.assertEqual(340, len(expected))
        for locale in LOCALES:
            entries = self.catalog(locale)
            self.assertEqual(expected, {key(entry) for entry in entries}, locale)
            self.assertTrue(
                all(str(entry.get("msgstr", {}).get(0, "")).strip() for entry in entries),
                locale,
            )

    def test_format_placeholders_are_preserved(self) -> None:
        for locale in LOCALES:
            for entry in self.catalog(locale):
                source = str(entry["msgid"])
                translated = str(entry["msgstr"][0])
                self.assertEqual(
                    Counter(FORMAT_TOKEN.findall(source)),
                    Counter(FORMAT_TOKEN.findall(translated)),
                    f"{locale}: {source}",
                )

    def test_mo_catalogs_match_po_translations(self) -> None:
        for locale in LOCALES:
            with (ROOT / f"languages/minimal-admin-{locale}.mo").open("rb") as stream:
                catalog = gettext.GNUTranslations(stream)
            for entry in self.catalog(locale):
                source = str(entry["msgid"])
                translated = str(entry["msgstr"][0])
                context = str(entry.get("msgctxt", ""))
                actual = catalog.pgettext(context, source) if context else catalog.gettext(source)
                self.assertEqual(translated, actual, f"{locale}: {source}")

    def test_jed_catalogs_cover_every_javascript_message(self) -> None:
        for locale in LOCALES:
            expected: dict[str, set[str]] = {}
            for entry in self.catalog(locale):
                source = str(entry["msgid"])
                if entry.get("msgctxt"):
                    source = f"{entry['msgctxt']}\x04{source}"
                for reference in entry.get("references", []):
                    path = str(reference).rsplit(":", 1)[0].removeprefix("./")
                    if JS_REFERENCE.search(str(reference)):
                        expected.setdefault(path, set()).add(source)

            found: dict[str, set[str]] = {}
            pattern = f"minimal-admin-{locale}-*.json"
            for path in (ROOT / "languages").glob(pattern):
                payload = json.loads(path.read_text(encoding="utf-8"))
                source = str(payload["source"])
                messages = payload["locale_data"]["messages"]
                found[source] = set(messages) - {""}
                self.assertTrue(all(any(forms) for name, forms in messages.items() if name))
            self.assertEqual(expected, found, locale)


if __name__ == "__main__":
    unittest.main()
