#!/usr/bin/env python3
import json
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "tools" / "create_playground_blueprint.py"


class PlaygroundBlueprintTest(unittest.TestCase):
    def test_bundled_plugin_archive(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "blueprint.json"
            subprocess.run(
                [
                    "python3",
                    str(SCRIPT),
                    "--plugin-path",
                    "minimal-admin.zip",
                    "--version",
                    "0.25.0.5",
                    "--locale",
                    "zh_CN",
                    "--language-pack-path",
                    "minimal-admin-zh_CN.zip",
                    "--output",
                    str(output),
                ],
                check=True,
            )
            blueprint = json.loads(output.read_text())
            self.assertEqual(
                blueprint["steps"][1]["pluginData"],
                {"resource": "bundled", "path": "minimal-admin.zip"},
            )
            unzip = next(step for step in blueprint["steps"] if step["step"] == "unzip")
            self.assertEqual(
                unzip["zipFile"],
                {"resource": "bundled", "path": "minimal-admin-zh_CN.zip"},
            )
            commands = [step.get("command", "") for step in blueprint["steps"]]
            self.assertTrue(any("Plugin translation did not load" in command for command in commands))
            self.assertTrue(any("Language pack was not registered" in command for command in commands))


if __name__ == "__main__":
    unittest.main()
