<div align="center">

# git-clean-branches

**Interactive TUI to find and delete merged or stale git branches — no install needed**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue?labelColor=0B0A09)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen?labelColor=0B0A09)](package.json)
[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-blue?labelColor=0B0A09)](package.json)

</div>

## Install

```bash
npx github:NickCirv/git-clean-branches
```

## Usage

```bash
# Interactive TUI — navigate, select, delete
npx github:NickCirv/git-clean-branches

# Or install globally for the short alias
npm install -g github:NickCirv/git-clean-branches
gcb
```

| Flag | Description |
|---|---|
| `--merged` | Filter to branches already merged into base |
| `--stale <days>` | Filter to branches with no commits in N days |
| `--delete` | Delete matching branches (prompts for confirmation) |
| `--remote` | Also delete remote tracking branches |
| `--dry-run` | Preview what would be deleted — no actual deletion |
| `--protect <list>` | Comma-separated protected branches (default: `main,master,develop`) |
| `--format json` | Output JSON instead of table |
| `-h, --help` | Show help |

## What it does

Launches a keyboard-driven TUI that lists all local branches with their merge status, last-commit age, author, and ahead/behind counts. Navigate with arrow keys, space to select, Enter to delete — protected branches and the current branch are never selectable. For scripting or CI, skip the TUI with `--merged` or `--stale <days>` and pipe `--format json` output to `jq`.

---
<sub>Zero dependencies · Node >=18 · MIT · by <a href="https://github.com/NickCirv">NickCirv</a></sub>
