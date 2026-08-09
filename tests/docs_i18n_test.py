#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
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


if __name__ == "__main__":
    unittest.main()
