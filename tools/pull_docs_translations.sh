#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
BASE_URL=${GLOTPRESS_BASE_URL:-https://translate.wenpai.org}
PROJECT=${GLOTPRESS_DOCS_PROJECT:-hosting/minimal-admin/readme}
CATALOG_DIR="$ROOT/docs/languages"

for command in curl msgfmt python3; do
	command -v "$command" >/dev/null 2>&1 || {
		echo "Required command is missing: $command" >&2
		exit 1
	}
done

mkdir -p "$CATALOG_DIR"

pull_locale() {
	local gp_locale=$1
	local wp_locale=$2
	local po="$CATALOG_DIR/minimal-admin-docs-$wp_locale.po"
	local mo
	local tmp
	tmp=$(mktemp)
	mo=$(mktemp)
	trap 'rm -f "$tmp" "$mo"' RETURN

	curl --fail --silent --show-error --location \
		--connect-timeout 15 --max-time 90 --retry 2 --retry-delay 5 --retry-all-errors \
		"$BASE_URL/projects/$PROJECT/$gp_locale/default/export-translations/?format=po" \
		-o "$tmp"
	grep -q '^msgid ""' "$tmp" || {
		echo "GlotPress returned an invalid documentation PO file for $gp_locale" >&2
		exit 1
	}
	mv "$tmp" "$po"
	chmod 0644 "$po"
	python3 "$ROOT/tools/docs_i18n.py" normalize-po \
		--pot "$ROOT/languages/minimal-admin-docs.pot" --po "$po"
	msgfmt --check --output-file "$mo" "$po"
	python3 "$ROOT/tools/docs_i18n.py" render \
		--docs "$ROOT/docs" --mo "$mo" --output "$ROOT/docs/$wp_locale"
	printf 'Synchronized documentation %s -> %s\n' "$gp_locale" "$wp_locale"
}

pull_locale zh-cn zh_CN
pull_locale zh-tw zh_TW
