#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "tools"))
import luna_docs_translate  # noqa: E402


class LunaDocsTranslateTest(unittest.TestCase):
    def test_stale_checkpoint_is_ignored_without_reusing_ids(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "checkpoint.json"
            path.write_text(
                json.dumps(
                    {
                        "model": luna_docs_translate.MODEL,
                        "locale": "zh_CN",
                        "source_sha256": "old-source",
                        "translations": {"e00001": "可能对应旧字符串"},
                    }
                )
            )
            self.assertEqual(
                {}, luna_docs_translate.load_checkpoint(path, "new-source", "zh_CN")
            )


if __name__ == "__main__":
    unittest.main()
