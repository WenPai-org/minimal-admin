#!/usr/bin/env python3
"""Create a focused WordPress Playground smoke-test blueprint."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--plugin-url", required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    if not re.fullmatch(r"\d+\.\d+\.\d+\.\d+", args.version):
        raise SystemExit("version must be X.Y.Z.N")
    if not re.fullmatch(r"https?://[^\s]+\.zip", args.plugin_url):
        raise SystemExit("plugin URL must be an HTTP(S) ZIP URL")

    version_check = (
        "wp eval 'if ( ! defined( \"MINIMAL_ADMIN_VERSION\" ) || "
        f"MINIMAL_ADMIN_VERSION !== \"{args.version}\" ) {{ "
        "fwrite( STDERR, \"Minimal Admin version mismatch\\n\" ); exit( 1 ); } "
        "echo MINIMAL_ADMIN_VERSION;' --user=admin"
    )
    blueprint = {
        "$schema": "https://playground.wordpress.net/blueprint-schema.json",
        "landingPage": "/minimal-admin/",
        "preferredVersions": {"php": "8.3", "wp": "latest"},
        "features": {"networking": True},
        "steps": [
            {"step": "login"},
            {
                "step": "installPlugin",
                "pluginData": {"resource": "url", "url": args.plugin_url},
                "options": {"activate": True, "targetFolderName": "minimal-admin"},
                "ifAlreadyInstalled": "overwrite",
            },
            {
                "step": "wp-cli",
                "command": "wp plugin is-active minimal-admin --user=admin",
            },
            {"step": "wp-cli", "command": version_check},
        ],
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(blueprint, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
