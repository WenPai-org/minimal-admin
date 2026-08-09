#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BASE_URL=${GLOTPRESS_BASE_URL:-https://translate.wenpai.org}
PROJECT=${GLOTPRESS_PROJECT:-hosting/minimal-admin/body}
LANG_DIR="$ROOT/languages"

for command in curl msgfmt python3; do
	command -v "$command" >/dev/null 2>&1 || {
		echo "Required command is missing: $command" >&2
		exit 1
	}
done

mkdir -p "$LANG_DIR"

pull_locale() {
	local gp_locale=$1
	local wp_locale=$2
	local po="$LANG_DIR/minimal-admin-$wp_locale.po"
	local tmp
	tmp=$(mktemp)
	trap 'rm -f "$tmp"' RETURN

	curl --fail --silent --show-error --location \
		--connect-timeout 15 --max-time 90 --retry 2 --retry-delay 5 --retry-all-errors \
		"$BASE_URL/projects/$PROJECT/$gp_locale/default/export-translations/?format=po" \
		-o "$tmp"
	grep -q '^msgid ""' "$tmp" || {
		echo "GlotPress returned an invalid PO file for $gp_locale" >&2
		exit 1
	}
	mv "$tmp" "$po"
	chmod 0644 "$po"

	msgfmt --check --output-file "$LANG_DIR/minimal-admin-$wp_locale.mo" "$po"
	python3 "$ROOT/tools/make_jed_json.py" "$po" "$LANG_DIR" >/dev/null
	printf 'Synchronized %s -> %s\n' "$gp_locale" "$wp_locale"
}

pull_locale zh-cn zh_CN
pull_locale zh-tw zh_TW
