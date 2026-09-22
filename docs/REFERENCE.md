# git-clean-branches — command reference

[Overview](../README.md) · [Research record](RESEARCH.md)

Describes revision `b4ad05f5b05f75a3a03c2c8956d60519c283bacc`. Commands are source-inspected; no execution results are asserted.

## Workflow

Lists branch metadata and supports a terminal selector, protection patterns, stale-day filtering and JSON output. --delete enables noninteractive deletion and --remote includes remote operations.

Requires Git and a local repository with the relevant history. Commands are source-inspected, not executed in this review.

```bash
node index.js --merged --dry-run --format json
```

## Commands and controls

| Control | Behavior in the inspected implementation |
| --- | --- |
| `--merged` | Select merged branch candidates |
| `--stale DAYS` | Select branches by last-commit age |
| `--dry-run` | Preview removal |
| `--delete` | Enable noninteractive deletion |
| `--remote` | Include remote operations |

## Interpretation and side effects

The default base is chosen from local branch names, which may differ from your intended integration branch. Remote deletion removes refs from the server; review candidates and protected patterns first.

## Implementation reference

- [package.json](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/package.json)
- [index.js](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/index.js)
- [test/smoke.test.js](https://github.com/NickCirv/git-clean-branches/blob/b4ad05f5b05f75a3a03c2c8956d60519c283bacc/test/smoke.test.js)
