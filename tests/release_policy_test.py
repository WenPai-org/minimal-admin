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
        self.assertIn("tools/build_release.py", workflow)
        self.assertIn("git add -A\n", workflow)
        self.assertNotIn("git add -A ':!dist'", workflow)
        self.assertIn("git push --atomic", workflow)

    def test_incomplete_translations_do_not_block_release(self) -> None:
        workflow = (ROOT / ".forgejo/workflows/release.yml").read_text()
        self.assertNotIn("Localized documentation is incomplete", workflow)
        self.assertIn("publishing available translations", workflow)
        self.assertIn("tools/verify_release.py", workflow)
        self.assertIn("run-blueprint", workflow)
        self.assertIn("Create FeiCode release and upload assets", workflow)


if __name__ == "__main__":
    unittest.main()
