#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class DeriveZhTwTest(unittest.TestCase):
    def test_converts_only_translations_and_changes_locale_header(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "zh_CN.po"
            output = root / "zh_TW.po"
            source.write_text(
                'msgid ""\nmsgstr ""\n"Language: zh_CN\\n"\n\n'
                'msgid "后台"\nmsgstr "汉字后台"\n'
            )
            subprocess.run(
                [
                    sys.executable,
                    str(ROOT / "tools/derive_zh_tw.py"),
                    "--source", str(source),
                    "--output", str(output),
                ],
                check=True,
                capture_output=True,
                text=True,
            )
            result = output.read_text()
            self.assertIn('"Language: zh_TW\\n"', result)
            self.assertIn('msgid "后台"', result)
            self.assertIn('msgstr "漢字後臺"', result)


if __name__ == "__main__":
    unittest.main()
