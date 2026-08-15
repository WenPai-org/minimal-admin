#!/usr/bin/env python3
from __future__ import annotations

import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ReleasePolicyTest(unittest.TestCase):
    def test_upstream_release_does_not_synchronize_translations(self) -> None:
        workflow = (ROOT / ".forgejo/workflows/upstream-sync.yml").read_text()
        self.assertNotIn("pull_translations.sh", workflow)
        self.assertIn("tools/sync_upstream.py", workflow)
        self.assertIn("tools/build_language_packs.py", workflow)
        self.assertIn("tools/derive_zh_tw.py", workflow)
        self.assertIn("tools/build_release.py", workflow)
        self.assertIn("git add -A\n", workflow)
        self.assertNotIn("git add -A ':!dist'", workflow)
        self.assertIn("git push --atomic", workflow)
        self.assertIn("mode=tag", workflow)
        self.assertIn("Validate and tag an approved release commit", workflow)
        self.assertIn('git diff --exit-code -- manifest.json languages', workflow)
        self.assertIn("CANONICAL=$(git ls-remote", workflow)
        self.assertNotIn("actions/checkout@v4", workflow)

    def test_incomplete_translations_do_not_block_release(self) -> None:
        workflow = (ROOT / ".forgejo/workflows/release.yml").read_text()
        self.assertNotIn("Localized documentation is incomplete", workflow)
        self.assertIn("publishing available translations", workflow)
        self.assertIn("tools/verify_release.py", workflow)
        self.assertIn("run-blueprint", workflow)
        self.assertIn("Create FeiCode release and upload assets", workflow)
        self.assertIn("dist/languages", workflow)
        self.assertIn("Existing immutable release asset differs", workflow)

    def test_translation_sync_does_not_mutate_released_package_metadata(self) -> None:
        workflow = (ROOT / ".forgejo/workflows/translations.yml").read_text()
        self.assertNotIn("tools/build_release.py", workflow)
        self.assertNotIn("--update-manifest", workflow)
        self.assertIn("tests/plugin_i18n_test.py", workflow)
        self.assertIn("tools/pull_docs_translations.sh", workflow)
        self.assertNotIn("tools/pull_translations.sh", workflow)


if __name__ == "__main__":
    unittest.main()
