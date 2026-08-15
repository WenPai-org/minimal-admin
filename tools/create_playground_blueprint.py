#!/usr/bin/env python3
"""Create a focused WordPress Playground smoke-test blueprint."""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    plugin_source = parser.add_mutually_exclusive_group(required=True)
    plugin_source.add_argument("--plugin-url")
    plugin_source.add_argument("--plugin-path", type=Path)
    parser.add_argument("--version", required=True)
    parser.add_argument("--locale", choices=("zh_CN", "zh_TW"))
    parser.add_argument("--language-pack-path", type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    if not re.fullmatch(r"\d+\.\d+\.\d+\.\d+", args.version):
        raise SystemExit("version must be X.Y.Z.N")
    if args.plugin_url and not re.fullmatch(r"https?://[^\s]+\.zip", args.plugin_url):
        raise SystemExit("plugin URL must be an HTTP(S) ZIP URL")
    if args.plugin_path and (args.plugin_path.is_absolute() or args.plugin_path.name != str(args.plugin_path)):
        raise SystemExit("plugin path must name an adjacent ZIP file")
    if args.plugin_path and args.plugin_path.suffix != ".zip":
        raise SystemExit("plugin path must be a ZIP file")
    if args.language_pack_path and not args.locale:
        raise SystemExit("language pack path requires a locale")
    if args.language_pack_path and (
        args.language_pack_path.is_absolute()
        or args.language_pack_path.name != str(args.language_pack_path)
        or args.language_pack_path.suffix != ".zip"
    ):
        raise SystemExit("language pack path must name an adjacent ZIP file")

    plugin_data = (
        {"resource": "url", "url": args.plugin_url}
        if args.plugin_url
        else {"resource": "bundled", "path": str(args.plugin_path)}
    )

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
                "pluginData": plugin_data,
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
    if args.locale:
        if args.language_pack_path:
            blueprint["steps"].append(
                {
                    "step": "unzip",
                    "zipFile": {"resource": "bundled", "path": str(args.language_pack_path)},
                    "extractToPath": "/wordpress/wp-content/languages/plugins",
                }
            )
        blueprint["steps"].extend(
            [
                {
                    "step": "wp-cli",
                    "command": f"wp option update WPLANG {args.locale} --user=admin",
                },
                {
                    "step": "wp-cli",
                    "command": f"wp user meta update admin locale {args.locale} --user=admin",
                },
                {
                    "step": "wp-cli",
                    "command": (
                        "wp eval 'if ( get_user_locale() !== \""
                        f"{args.locale}"
                        "\" ) { fwrite( STDERR, \"Locale activation failed\\n\" ); "
                        "exit( 1 ); } echo get_user_locale();' --user=admin"
                    ),
                },
            ]
        )
        if args.language_pack_path:
            blueprint["steps"].extend(
                [
                {
                    "step": "wp-cli",
                    "command": (
                        "wp eval 'unload_textdomain( \"minimal-admin\" ); "
                        f"$catalog = WP_LANG_DIR . \"/plugins/minimal-admin-{args.locale}.mo\"; "
                        "if ( ! load_textdomain( \"minimal-admin\", $catalog ) ) { "
                        "fwrite( STDERR, \"Plugin translation catalog did not load\\n\" ); exit( 1 ); } "
                        "$value = __( \"Post not found.\", \"minimal-admin\" ); "
                        "if ( \"Post not found.\" === $value ) { "
                        "fwrite( STDERR, \"Plugin translation did not load\\n\" ); exit( 1 ); } "
                        "echo $value;' --user=admin"
                    ),
                },
                {
                    "step": "wp-cli",
                    "command": (
                        "wp eval '$all = wp_get_installed_translations( \"plugins\" ); "
                        f"if ( empty( $all[\"minimal-admin\"][\"{args.locale}\"] ) ) {{ "
                        "fwrite( STDERR, \"Language pack was not registered\\n\" ); exit( 1 ); } "
                        f"echo $all[\"minimal-admin\"][\"{args.locale}\"][\"Project-Id-Version\"] ?? \"\";'"
                    ),
                },
                ]
            )
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(blueprint, indent=2) + "\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
