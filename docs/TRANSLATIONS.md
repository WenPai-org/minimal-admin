# Translation workflow

Minimal Admin uses WenPai's GlotPress instance as the review source for Chinese
translations. The source strings remain in the product repository; only
translations with GlotPress status `current` are shipped.

## Projects and locales

- Project: `hosting/minimal-admin`
- Plugin strings: `hosting/minimal-admin/body`
- Readme strings: `hosting/minimal-admin/readme`
- Simplified Chinese: `zh-cn/default`, packaged as WordPress locale `zh_CN`
- Traditional Chinese: `zh-tw/default`, packaged as WordPress locale `zh_TW`

Minimal Admin is hosted under the independent `hosting` tree rather than the
WordPress plugin-directory tree. The project uses `body` and `readme` children.
Release versions are tracked by the POT header, Git tags, and
`upstream-lock.json`; separate Stable and Development project branches are not
used.

## Data flow

1. The production importer fetches `languages/minimal-admin.pot` from FeiCode,
   checks its SHA-256 digest, and imports changed originals into the `body`
   project. It runs every six hours under a lock.
2. A production project-scoped pretranslation job processes bounded batches
   for zh-cn and zh-tw and submits them only as `waiting`. It skips strings
   containing runtime placeholders, markup, shortcodes, braces, or URLs. A
   reviewer promotes accepted strings to `current`.
3. `.forgejo/workflows/translations.yml` downloads only `current` translations
   every six hours, validates the PO catalogs, compiles MO and JavaScript JSON
   catalogs, verifies the release package, and commits changed catalogs.
4. Upstream release synchronization repeats the download before building and
   tagging a release, so a new upstream version includes the latest approved
   catalogs. Missing translations fall back to the source English strings.

The `readme` child contains the Markdown documentation extracted from
`docs/*.md`. Inline code, links, URLs, HTML tags, printf placeholders, and code
fences are protected from translation. Approved entries are rendered to
`docs/zh_CN/` and `docs/zh_TW/`; untranslated entries remain in English rather
than being guessed during the build. A localized Markdown file is created only
after that file has at least one reviewed translation; each locale directory's
`translation-status.json` reports reviewed and total string counts so an
English-only copy cannot be mistaken for a translated document.

Run the download locally with:

```bash
tools/pull_translations.sh
```

The command requires `curl`, GNU gettext `msgfmt`, and Python 3. Its output is
written to `languages/minimal-admin-zh_CN.*` and
`languages/minimal-admin-zh_TW.*`. Reviewed documentation catalogs are written
to `docs/languages/`, and localized Markdown is rendered below `docs/zh_CN/`
and `docs/zh_TW/`.

Regenerate the documentation POT after changing source Markdown:

```bash
python3 tools/docs_i18n.py extract \
  --version "$(jq -r .version manifest.json)" \
  --output languages/minimal-admin-docs.pot
```

## Machine translation boundary

Do not run the existing `wp platform machine_translate translate --slug=body`
command for this project. The installed implementation searches all projects
whose slug is `body`, selects a translation set without a locale constraint,
and targets only Simplified Chinese. That can write to unrelated projects and
cannot safely maintain both locales.

The Minimal Admin replacement job is pinned to project ID 450462 and the two
known translation-set IDs. It requires an exact locale/target mapping, ignores
any original that already has a translation in that set, and writes only
`waiting`. Human approval remains required before a translation reaches a
release. See the operations runbook for deployment paths and diagnostics.

## Release and rollback

The release ZIP must contain the PO/MO catalogs and any generated Jed JSON
catalogs. The WordPress Playground release smoke test installs that exact ZIP
twice and verifies plugin activation under `zh_CN` and `zh_TW`. This is a
runtime and locale-loading gate, not a linguistic review. A reviewer must
separately check an approved marker string in each locale before declaring
translation coverage complete.

To stop synchronization, disable the translation workflow and the production
cron independently. Previously committed catalogs and release ZIPs remain
available; do not delete GlotPress history.
