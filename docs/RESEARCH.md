# git-clean-branches — research record

## Revision and scope

- Repository: [NickCirv/git-clean-branches](https://github.com/NickCirv/git-clean-branches)
- Commit: `b4ad05f5b05f75a3a03c2c8956d60519c283bacc`
- Tree: `f0671dfb4f298416e36db6ab5d5a1162f5c19ddc`
- Captured: 6 of 6 eligible text files (all eligible text files).
- Recursive tree truncated: `False`.
- Runtime verification: **unverified**; no repository code, installation or test command was executed.

The captured file inventory is broader than the semantic review. Authoring inspected package metadata, entrypoint/argument handling and implementation paths relevant to the claims below, plus test declarations. This is documentation research, not a line-by-line security audit. Generated/binary artifacts, lockfiles and file types outside the acquisition filter were not inspected.

## Claim and evidence

| Claim | Pinned evidence | Status |
| --- | --- | --- |
| Runtime requirement and executable mapping | [package.json](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/package.json) | verified in manifest; installation unverified |
| Inspect merged or stale branches and optionally delete selected branches. | [implementation](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/index.js) | partially verified by static implementation review |
| Operational limits and side effects | [implementation](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/index.js) and source map in [reference](REFERENCE.md) | partially verified; runtime unverified |
| Test command definition | [package.json](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/package.json) | verified as a declaration only |

## Findings carried into the rewrite

The default base is chosen from local branch names, which may differ from your intended integration branch. Remote deletion removes refs from the server; review candidates and protected patterns first.

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

## Documentation inventory and disposition

| Existing document | Disposition |
| --- | --- |
| [README.md](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/README.md) | Rewritten overview; historical copy remains at this pinned URL. |

New supporting documents: `docs/REFERENCE.md` and `docs/RESEARCH.md`. No original source or protected legal/security file was changed.

## Protected-file evidence

- `LICENSE` SHA-256 `68729cab364d82364078b08d8580ccfa51dc69c81a7d64e8d8d47a1da6c9349d`.

## Remaining verification

Clean installation, useful-command execution, malformed input, side-effect boundaries, platform compatibility and end-to-end tests remain unverified. Package-registry availability and live API destinations were not checked. No performance, customer-adoption, compliance or production-readiness claim is made.

## Captured evidence index

- [LICENSE](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/LICENSE) · blob `05b804beeec7d1a6c933d087387ba4adf6463d93`.
- [README.md](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/README.md) · blob `a93de3faeea7ca76404851fa940d1575d9db102b`.
- [package.json](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/package.json) · blob `d7a906757d46d3f36513a7d3a1a8b07d2633a9e7`.
- [.github/workflows/ci.yml](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/.github/workflows/ci.yml) · blob `44515034a394670de44454a7a1bd2c7ef0c9836e`.
- [index.js](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/index.js) · blob `e3d8af3571278f6b2fd9bb8a0b07c1002ecab792`.
- [test/smoke.test.js](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/test/smoke.test.js) · blob `ebbccaaf2583b4850575f835313e4b0afd21bff7`.

## Tree files outside the captured text set

These paths were mapped but their contents were not acquired in this research pass:

- `banner.svg`
