#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
import gettext
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("docs_i18n", ROOT / "tools" / "docs_i18n.py")
assert SPEC and SPEC.loader
DOCS_I18N = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = DOCS_I18N
SPEC.loader.exec_module(DOCS_I18N)


class DocsI18nTest(unittest.TestCase):
    def test_protected_markdown_round_trip(self) -> None:
        source = "Read `wp option get` at [the guide](https://example.com/a) and keep %s."
        protected, tokens = DOCS_I18N.protect(source)
        self.assertNotIn("https://", protected)
        self.assertEqual(source, DOCS_I18N.restore(protected, tokens))

    def test_changed_tokens_are_rejected(self) -> None:
        protected, tokens = DOCS_I18N.protect("Use `code` here")
        with self.assertRaises(ValueError):
            DOCS_I18N.restore(protected.replace("_1__", "_2__"), tokens)

    def test_code_fences_are_not_extracted(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            docs = root / "docs"
            docs.mkdir()
            source = docs / "guide.md"
            source.write_text("# Visible heading\n\n```bash\nnever translate this command\n```\n")
            segments = DOCS_I18N.numbered_segments(source, docs)
            self.assertEqual(["Visible heading"], [segment.original for _, segment in segments])

    def test_pending_catalog_does_not_publish_english_copy(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            docs = root / "docs"
            output = root / "zh_CN"
            docs.mkdir()
            (docs / "guide.md").write_text("# Visible heading\n")
            catalog = root / "catalog.mo"
            catalog.write_bytes(b"\xde\x12\x04\x95" + b"\x00" * 24)
            original = gettext.GNUTranslations
            try:
                gettext.GNUTranslations = lambda _stream: gettext.NullTranslations()  # type: ignore[assignment]
                DOCS_I18N.render(docs, catalog, output)
            finally:
                gettext.GNUTranslations = original
            self.assertFalse((output / "guide.md").exists())
            self.assertTrue((output / "translation-status.json").exists())

    def test_invalid_translation_tokens_fall_back_without_failing(self) -> None:
        class InvalidTokenTranslations:
            def pgettext(self, _context: str, _message: str) -> str:
                return "使用 __MA_DOC_TOKEN_2__"

        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            docs = root / "docs"
            output = root / "zh_CN"
            docs.mkdir()
            (docs / "guide.md").write_text("Use `code` here\n")
            catalog = root / "catalog.mo"
            catalog.write_bytes(b"placeholder")
            original = gettext.GNUTranslations
            try:
                gettext.GNUTranslations = lambda _stream: InvalidTokenTranslations()  # type: ignore[assignment]
                DOCS_I18N.render(docs, catalog, output)
            finally:
                gettext.GNUTranslations = original
            self.assertFalse((output / "guide.md").exists())
            status = json.loads((output / "translation-status.json").read_text())
            self.assertEqual(0, status["translated"])
            self.assertEqual(1, status["total"])

    def test_glotpress_export_normalization_restores_source_punctuation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            pot = root / "docs.pot"
            po = root / "docs.po"
            pot.write_text(
                '#: docs/guide.md:1\nmsgctxt "docs/guide.md"\n'
                'msgid "Same \\u201cLabel\\u201d and plugin\\u2019s."\nmsgstr ""\n'
            )
            po.write_text(
                '#: docs/guide.md:1\nmsgctxt "docs/guide.md"\n'
                'msgid "Same &#12300;Label&#12301; and plugin&#12303;s."\n'
                'msgstr "相同的&#12300;标签&#12301;。"\n'
            )
            DOCS_I18N.normalize_exported_po(pot, po)
            result = po.read_text()
            self.assertIn('msgid "Same “Label” and plugin’s."', result)
            self.assertIn('msgstr "相同的「标签」。"', result)

    def test_glotpress_export_normalization_drops_obsolete_references(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            pot = root / "docs.pot"
            po = root / "docs.po"
            pot.write_text(
                '#: docs/guide.md:2\nmsgctxt "docs/guide.md"\n'
                'msgid "Current text"\nmsgstr ""\n'
            )
            po.write_text(
                'msgid ""\nmsgstr "Project-Id-Version: Minimal Admin\\n"\n\n'
                '#: docs/guide.md:1\nmsgctxt "docs/guide.md"\n'
                'msgid "Removed text"\nmsgstr "旧翻译"\n\n'
                '#: docs/guide.md:2\nmsgctxt "docs/guide.md"\n'
                'msgid "Current text"\nmsgstr "当前翻译"\n'
            )
            DOCS_I18N.normalize_exported_po(pot, po)
            result = po.read_text()
            self.assertIn('Project-Id-Version: Minimal Admin', result)
            self.assertNotIn('Removed text', result)
            self.assertNotIn('旧翻译', result)
            self.assertIn('Current text', result)
            self.assertIn('当前翻译', result)

    def test_glotpress_export_normalization_drops_invalid_token_translation(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            pot = root / "docs.pot"
            po = root / "docs.po"
            pot.write_text(
                '#: docs/guide.md:1\nmsgctxt "docs/guide.md"\n'
                'msgid "Use __MA_DOC_TOKEN_1__"\nmsgstr ""\n'
            )
            po.write_text(
                'msgid ""\nmsgstr "Project-Id-Version: Minimal Admin\\n"\n\n'
                '#: docs/guide.md:1\nmsgctxt "docs/guide.md"\n'
                'msgid "Old source"\nmsgstr "使用 __MA_DOC_TOKEN_2__"\n'
            )
            DOCS_I18N.normalize_exported_po(pot, po)
            result = po.read_text()
            self.assertIn('Project-Id-Version: Minimal Admin', result)
            self.assertNotIn('使用 __MA_DOC_TOKEN_2__', result)


if __name__ == "__main__":
    unittest.main()
