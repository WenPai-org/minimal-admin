#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock


ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("sync_upstream", ROOT / "tools" / "sync_upstream.py")
assert SPEC and SPEC.loader
SYNC_UPSTREAM = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = SYNC_UPSTREAM
SPEC.loader.exec_module(SYNC_UPSTREAM)


class SyncUpstreamTest(unittest.TestCase):
    def test_preserves_downstream_branded_screenshot(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            source = root / "source"
            output = root / "output"
            (source / "includes").mkdir(parents=True)
            (source / ".github").mkdir()
            (output / "assets/images").mkdir(parents=True)
            (source / "minn-admin.php").write_text(
                " * Plugin URI: x\n * Version: 0.26.0\n * Author: Austin Ginder\n"
                " * Author URI: x\n * Text Domain: minn-admin\n"
                "define( 'MINN_ADMIN_VERSION', '0.26.0' );\n"
            )
            (source / "manifest.json").write_text(json.dumps({"version": "0.26.0"}))
            (source / "readme.md").write_text("**Website:** https://minnadmin.com\n")
            (source / "includes/class-minn-admin-updater.php").write_text("updater\n")
            (source / ".github/screenshot-dark.png").write_bytes(b"upstream Minn screenshot")
            branded = b"downstream Minimal screenshot"
            (output / "assets/images/screenshot-dark.png").write_bytes(branded)

            argv = [
                "sync_upstream.py",
                "--source", str(source),
                "--output", str(output),
                "--upstream-tag", "v0.26.0",
                "--upstream-commit", "a" * 40,
                "--version", "0.26.0.1",
            ]
            with mock.patch.object(sys, "argv", argv):
                self.assertEqual(0, SYNC_UPSTREAM.main())

            self.assertEqual(branded, (output / "assets/images/screenshot-dark.png").read_bytes())
            managed = json.loads((output / ".upstream-files.json").read_text())["files"]
            self.assertIn("assets/images/screenshot-dark.png", managed)


if __name__ == "__main__":
    unittest.main()
