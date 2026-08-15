# Upstream provenance

Minimal Admin is maintained as a no-compatibility renamed fork of
[Minn Admin](https://github.com/austinginder/minn-admin) by Austin Ginder.

The automated sync pipeline reads release tags from the read-only FeiCode mirror
`WPFork/minn-admin-upstream`, pins the exact upstream commit in
`upstream-lock.json`, applies the deterministic transformation in
`tools/sync_upstream.py`, runs static verification, and publishes a new
Minimal Admin release. Upstream Actions workflows are never imported or run.

The mirror tag target must match the canonical GitHub tag target. The lock
records the source tree digest and a transformation digest covering the sync,
language-pack, build and verification tools plus the preserved product
screenshot. A drifting default branch is never transformed.

## Translation and release flow

Minn Admin 0.30 and later publish reviewed source catalogs and per-locale
language packs. Minimal Admin uses those catalogs as inputs, but never reuses
the upstream package URLs or hashes:

1. top-level `languages/<locale>.po` files are renamed to the downstream
   `minimal-admin-<locale>.po` text-domain convention during transformation;
2. Simplified Chinese comes from the pinned upstream catalog; Traditional
   Chinese is deterministically derived with OpenCC `s2twp` when available,
   otherwise the last committed Traditional Chinese catalog is preserved;
3. `tools/build_language_packs.py` compiles deterministic PO/MO/Jed packages,
   stamps the downstream version, recalculates every SHA-256 and rewrites the
   manifest to FeiCode release URLs;
4. the plugin ZIP bundles `zh_CN` and `zh_TW`; all available locales are also
   published as independent WordPress language-pack ZIPs;
5. release CI installs the real plugin ZIP and both Chinese language packs in
   WordPress Playground, proves a translated runtime string loads, uploads the
   plugin ZIP, every language pack and their checksum files, then downloads and
   verifies each public artifact again.

Translation and documentation synchronization is independent from publishing.
Incomplete or unavailable translations fall back to the existing catalog or
English and do not block a code release. Translation-only commits never mutate
an existing tag, release attachment or released manifest; they enter the next
downstream release.

Release attachment recovery is immutable: a missing asset is uploaded, an
existing byte-identical asset is accepted, and an existing same-name asset with
a different SHA fails closed instead of being replaced.

No migration aliases are provided for the old plugin slug, PHP symbols, REST
route, options, transients, hooks, or browser storage keys. Minimal Admin is a
new plugin and must not be activated alongside Minn Admin.
