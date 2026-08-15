#!/usr/bin/env python3
from __future__ import annotations

import gettext
import json
import shutil
import subprocess
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LanguagePackBuildTest(unittest.TestCase):
    def test_builds_downstream_pack_and_manifest_deterministically(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "languages").mkdir()
            (root / "tools").mkdir()
            shutil.copy2(ROOT / "tools/make_jed_json.py", root / "tools/make_jed_json.py")
            shutil.copy2(ROOT / "tools/build_language_packs.py", root / "tools/build_language_packs.py")
            (root / "manifest.json").write_text(json.dumps({
                "version": "0.30.0.1",
                "last_updated": "2026-08-15 00:00:00",
                "translations": [{"language": "zh_CN", "updated": "2026-08-15 02:25:51"}],
            }))
            (root / "languages/minimal-admin-zh_CN.po").write_text(
                'msgid ""\nmsgstr ""\n'
                '"Project-Id-Version: Minimal Admin\\n"\n'
                '"Language: zh_CN\\n"\n'
                '"Content-Type: text/plain; charset=UTF-8\\n"\n'
                '"Plural-Forms: nplurals=1; plural=0;\\n"\n\n'
                '#: assets/js/app.js:1\nmsgid "Minimal Admin"\nmsgstr "极简管理"\n'
            )
            command = [sys.executable, str(root / "tools/build_language_packs.py"), "--root", str(root), "--update-manifest"]
            subprocess.run(command, check=True, capture_output=True, text=True)
            pack = root / "dist/languages/minimal-admin-zh_CN.zip"
            first = pack.read_bytes()
            subprocess.run(command, check=True, capture_output=True, text=True)
            self.assertEqual(first, pack.read_bytes())
            with zipfile.ZipFile(pack) as archive:
                names = archive.namelist()
                self.assertIn("minimal-admin-zh_CN.po", names)
                self.assertIn("minimal-admin-zh_CN.mo", names)
                self.assertTrue(any(name.endswith(".json") for name in names))
                with archive.open("minimal-admin-zh_CN.mo") as stream:
                    catalog = gettext.GNUTranslations(stream)
                    self.assertEqual("极简管理", catalog.gettext("Minimal Admin"))
            manifest = json.loads((root / "manifest.json").read_text())
            item = manifest["translations"][0]
            self.assertEqual("0.30.0.1", item["version"])
            self.assertIn("/v0.30.0.1/minimal-admin-zh_CN.zip", item["package"])
            self.assertEqual(64, len(item["sha256"]))


if __name__ == "__main__":
    unittest.main()
