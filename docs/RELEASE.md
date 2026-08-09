# Release process

## Automated upstream releases

`.forgejo/workflows/upstream-sync.yml` checks the FeiCode pull mirror every six
hours and can also be run manually. A new upstream stable tag is transformed to
a downstream version by appending `.1` (for example `0.25.0` becomes
`0.25.0.1`). The workflow validates the transformed source, creates a
reproducible ZIP, updates `manifest.json`, commits the pinned provenance, tags
the commit, and creates a FeiCode release with ZIP and SHA-256 assets.

The upstream source is treated as untrusted: upstream workflows are excluded,
and no upstream scripts or tests execute in the job. Only trusted local tooling,
`php -l`, and `node --check` run before the release token is used.

## Rollback

Disable the repository's scheduled Actions workflow and archive the product
repository. Do not delete the mirror, product repository, tags, or releases.
Installed copies can be rolled back with a previously published, checksum-verified
ZIP. The mirror can be paused independently because it never publishes releases.
