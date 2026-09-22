![git-clean-branches — Nicholas Ashkar repository collection](assets/nicholas-ashkar/banner.png)

# git-clean-branches

Inspect merged or stale branches and optionally delete selected branches.


<a id="usage"></a>

## What it does

Lists branch metadata and supports a terminal selector, protection patterns, stale-day filtering and JSON output. --delete enables noninteractive deletion and --remote includes remote operations. See the pinned [implementation](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/index.js).


<a id="install"></a>

## Quickstart

Node requirement from the inspected manifest: **`>=20`**. Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

The following example is **source-inspected, not executed**. It uses a pinned checkout; npm package publication is not assumed. Replace project paths or provide the stated input fixtures before running it.

```bash
git clone https://github.com/NickCirv/git-clean-branches.git
cd git-clean-branches
git checkout b4ad05f5b05f75a3a03c2c8956d60519c283bacc
npm install --ignore-scripts
node index.js --merged --dry-run --format json
```

Dependencies are installed with lifecycle scripts disabled in this recipe. Read the package scripts before enabling any lifecycle step required by your environment.

## Usage and reference

`git-clean-branches` | `gcb` are the executable names declared by the package. [Command reference](docs/REFERENCE.md) covers source-backed options and entry points.

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--merged` | Select merged branch candidates |
| `--stale DAYS` | Select branches by last-commit age |
| `--dry-run` | Preview removal |
| `--delete` | Enable noninteractive deletion |
| `--remote` | Include remote operations |

## Limits and operational notes

The default base is chosen from local branch names, which may differ from your intended integration branch. Remote deletion removes refs from the server; review candidates and protected patterns first.

## Development

No runtime checks were executed for this documentation review. The committed smoke test checks entrypoint JavaScript syntax; it does not exercise the command behavior.

| Script | Declared command |
| --- | --- |
| `start` | `node index.js` |
| `test` | `node --test` |

Work from the pinned source, keep changes focused, and reproduce the affected behavior with a small fixture before proposing a change. Existing contribution and security policies remain authoritative where present.

## Research and status

[Research record](docs/RESEARCH.md) identifies the inspected revision, source evidence, documentation disposition and verification gaps. Static inspection supports the descriptions here; runtime behavior, dependency installation and current hosted services remain unverified.

## License and author

[License](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/LICENSE)

[Nicholas Ashkar](https://nicholashkar.com) · Applied AI, systems and consulting.
