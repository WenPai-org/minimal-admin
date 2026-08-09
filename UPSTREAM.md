# Upstream provenance

Minimal Admin is maintained as a no-compatibility renamed fork of
[Minn Admin](https://github.com/austinginder/minn-admin) by Austin Ginder.

The automated sync pipeline reads release tags from the read-only FeiCode mirror
`WPFork/minn-admin-upstream`, pins the exact upstream commit in
`upstream-lock.json`, applies the deterministic transformation in
`tools/sync_upstream.py`, runs static verification, and publishes a new
Minimal Admin release. Upstream Actions workflows are never imported or run.

No migration aliases are provided for the old plugin slug, PHP symbols, REST
route, options, transients, hooks, or browser storage keys. Minimal Admin is a
new plugin and must not be activated alongside Minn Admin.
