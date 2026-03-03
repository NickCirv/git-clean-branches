#!/usr/bin/env node
/**
 * git-clean-branches — List and delete merged/stale git branches
 * Interactive TUI or one-liner. Zero dependencies. Node 18+.
 */

import { execFileSync, spawnSync } from 'child_process';
import * as readline from 'readline';
import { stdout, stdin, argv, exit } from 'process';

// ─── ANSI Colors ─────────────────────────────────────────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  cyan:    '\x1b[36m',
  gray:    '\x1b[90m',
  bgRed:   '\x1b[41m',
  white:   '\x1b[37m',
};

const color = (c, str) => `${c}${str}${C.reset}`;

// ─── Argument Parser ──────────────────────────────────────────────────────────
function parseArgs(args) {
  const opts = {
    merged:    false,
    stale:     null,
    delete:    false,
    remote:    false,
    dryRun:    false,
    protect:   ['main', 'master', 'develop'],
    format:    'tui',
    help:      false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--merged')          opts.merged  = true;
    else if (a === '--delete')     opts.delete  = true;
    else if (a === '--remote')     opts.remote  = true;
    else if (a === '--dry-run')    opts.dryRun  = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--stale') {
      const n = parseInt(args[i + 1], 10);
      if (!isNaN(n)) { opts.stale = n; i++; }
      else die('--stale requires a number of days (e.g. --stale 30)');
    } else if (a === '--protect') {
      const next = args[i + 1];
      if (next && !next.startsWith('--')) {
        opts.protect = next.split(',').map(s => s.trim()).filter(Boolean);
        i++;
      }
    } else if (a === '--format') {
      const next = args[i + 1];
      if (next === 'json' || next === 'tui') { opts.format = next; i++; }
      else die('--format must be json or tui');
    }
  }

  // No filter flags → launch interactive TUI
  if (!opts.merged && opts.stale === null) opts.tui = true;
  else opts.tui = false;

  return opts;
}

// ─── Git Helpers ──────────────────────────────────────────────────────────────
function git(...args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

function gitLines(...args) {
  const out = git(...args);
  return out ? out.split('\n').filter(Boolean) : [];
}

function requireGitRepo() {
  const result = git('rev-parse', '--git-dir');
  if (!result) die('Not inside a git repository.');
}

function currentBranch() {
  return git('rev-parse', '--abbrev-ref', 'HEAD') || 'HEAD';
}

function defaultBranch() {
  // Try to detect: main, master, develop in that order
  const branches = gitLines('branch', '--list', 'main', 'master', 'develop');
  for (const b of ['main', 'master', 'develop']) {
    if (branches.some(l => l.trim() === b)) return b;
  }
  return currentBranch();
}

function isMergedInto(branch, base) {
  const result = git('branch', '--merged', base, '--list', branch);
  return result !== null && result.trim() !== '';
}

function relativeDate(isoDate) {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60)   return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  const days = Math.floor(diff / 86400);
  if (days < 30)   return `${days} days ago`;
  if (days < 365)  return `${Math.floor(days/30)} months ago`;
  return `${Math.floor(days/365)} years ago`;
}

function getBranchInfo(branch, base, opts) {
  const format = '%aI|%ar|%an';
  const logOut = git('log', '-1', `--format=${format}`, branch) || '||';
  const [isoDate, , author] = logOut.split('|');

  const merged = isMergedInto(branch, base);

  // Stale check
  let isStale = false;
  if (opts.stale !== null && isoDate) {
    const daysSince = Math.floor((Date.now() - new Date(isoDate).getTime()) / 86400000);
    isStale = daysSince >= opts.stale;
  }

  // Ahead/behind
  let ahead = 0, behind = 0;
  const ab = git('rev-list', '--left-right', '--count', `${base}...${branch}`);
  if (ab) {
    const parts = ab.split('\t');
    behind = parseInt(parts[0], 10) || 0;
    ahead  = parseInt(parts[1], 10) || 0;
  }

  // Remote tracking
  const remoteRef = git('rev-parse', '--abbrev-ref', `${branch}@{upstream}`);
  const hasRemote = remoteRef && !remoteRef.includes('no upstream');

  return {
    name:     branch,
    date:     isoDate ? relativeDate(isoDate) : 'unknown',
    isoDate:  isoDate || '',
    author:   author || 'unknown',
    merged,
    isStale,
    ahead,
    behind,
    remoteRef: hasRemote ? remoteRef : null,
  };
}

function getAllLocalBranches() {
  return gitLines('branch', '--format=%(refname:short)');
}

function getAllRemoteBranches() {
  return gitLines('branch', '-r', '--format=%(refname:short)')
    .filter(b => !b.includes('HEAD'));
}

function deleteBranch(branch, remote, dryRun) {
  if (dryRun) {
    console.log(color(C.yellow, `[dry-run] Would delete: ${branch}`));
    return true;
  }
  const result = spawnSync('git', ['branch', '-d', branch], { encoding: 'utf8', stdio: 'pipe' });
  if (result.status !== 0) {
    // Unmerged — refuse silently unless user knows
    console.log(color(C.red, `  Skipped ${branch} (unmerged — use --merged to include only safe deletes)`));
    return false;
  }
  if (remote) {
    const parts = (branch.split('/'));
    const remoteName = parts[0] || 'origin';
    const remoteBranch = parts.slice(1).join('/') || branch;
    spawnSync('git', ['push', remoteName, '--delete', remoteBranch], { encoding: 'utf8', stdio: 'pipe' });
  }
  return true;
}

function deleteRemoteBranch(remoteRef, dryRun) {
  if (dryRun) {
    console.log(color(C.yellow, `[dry-run] Would delete remote: ${remoteRef}`));
    return true;
  }
  const [remote, ...rest] = remoteRef.split('/');
  const branch = rest.join('/');
  const result = spawnSync('git', ['push', remote, '--delete', branch], { encoding: 'utf8', stdio: 'pipe' });
  return result.status === 0;
}

// ─── Filtering Logic ──────────────────────────────────────────────────────────
function filterBranches(branches, infos, opts) {
  return infos.filter(info => {
    if (opts.merged && !info.merged) return false;
    if (opts.stale !== null && !info.isStale) return false;
    return true;
  });
}

// ─── Non-Interactive Mode ─────────────────────────────────────────────────────
async function nonInteractiveMode(opts) {
  requireGitRepo();
  const cur  = currentBranch();
  const base = defaultBranch();
  const protect = new Set([...opts.protect, cur]);

  const local   = getAllLocalBranches().filter(b => !protect.has(b));
  const infos   = local.map(b => getBranchInfo(b, base, opts));
  const targets = filterBranches(local, infos, opts);

  if (opts.format === 'json') {
    console.log(JSON.stringify(targets, null, 2));
    return;
  }

  if (targets.length === 0) {
    console.log(color(C.green, 'No branches match the criteria.'));
    return;
  }

  // List them
  console.log(color(C.bold, `\nBranches to act on (${targets.length}):\n`));
  for (const info of targets) {
    const mergedTag = info.merged
      ? color(C.green,  '✓ merged')
      : color(C.yellow, '✗ unmerged');
    const staleTag  = info.isStale ? color(C.yellow, ` [stale ${opts.stale}d]`) : '';
    console.log(`  ${color(C.cyan, info.name.padEnd(40))} ${mergedTag}${staleTag}  ${color(C.dim, info.date)}  ${color(C.dim, info.author)}`);
  }

  if (!opts.delete) {
    console.log(color(C.dim, '\nRun with --delete to remove these branches.'));
    return;
  }

  // Confirm
  const label = opts.dryRun ? '[dry-run] ' : '';
  process.stdout.write(`\n${label}Delete ${targets.length} branch(es)? [y/N] `);
  const answer = await prompt();
  if (answer.toLowerCase() !== 'y') {
    console.log('Aborted.');
    return;
  }

  let deleted = 0;
  for (const info of targets) {
    const ok = deleteBranch(info.name, opts.remote, opts.dryRun);
    if (ok) {
      deleted++;
      console.log(color(C.green, `  Deleted: ${info.name}`));
    }
  }
  console.log(color(C.bold, `\nDone. ${deleted}/${targets.length} branches removed.`));
}

function prompt() {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: stdin, output: stdout });
    rl.question('', ans => { rl.close(); resolve(ans); });
  });
}

// ─── Interactive TUI ──────────────────────────────────────────────────────────
async function interactiveTUI(opts) {
  requireGitRepo();
  const cur    = currentBranch();
  const base   = defaultBranch();
  const protect = new Set([...opts.protect, cur]);

  const local = getAllLocalBranches().filter(b => !protect.has(b));

  if (local.length === 0) {
    console.log(color(C.green, 'No branches to clean up.'));
    return;
  }

  console.log(color(C.dim, 'Loading branch info...'));

  const infos = local.map(b => getBranchInfo(b, base, opts));
  const protected_ = getAllLocalBranches().filter(b => protect.has(b));

  // TUI state
  let cursor    = 0;
  const selected = new Set();

  function render() {
    // Clear screen (move to top)
    stdout.write('\x1b[2J\x1b[H');

    // Header
    stdout.write(color(C.bold, '  git-clean-branches\n'));
    stdout.write(color(C.dim,  `  Base: ${base}  |  Current: ${cur}\n`));
    stdout.write(color(C.dim,  '  ↑/↓ Navigate  ·  Space Select  ·  Enter Delete selected  ·  q Quit\n'));
    stdout.write('\n');

    // Column headers
    stdout.write(color(C.bold,
      '  ' +
      '  ' +
      'Branch'.padEnd(35) +
      'Last commit'.padEnd(16) +
      'Author'.padEnd(20) +
      'Status'.padEnd(14) +
      'Ahead/Behind' +
      '\n'
    ));
    stdout.write(color(C.dim, '  ' + '─'.repeat(110) + '\n'));

    // Protected branches (gray, non-selectable)
    for (const b of protected_) {
      stdout.write(color(C.gray, `  [ ] ${b.padEnd(35)}(protected)\n`));
    }

    // Actionable branches
    for (let i = 0; i < infos.length; i++) {
      const info = infos[i];
      const isCursor = i === cursor;
      const isSel    = selected.has(i);

      const checkbox = isSel ? color(C.red,  '[✗]') : '[ ]';
      const prefix   = isCursor ? color(C.cyan, '> ') : '  ';

      const nameColor = isSel
        ? color(C.red,    info.name.padEnd(35))
        : info.merged
          ? color(C.green,  info.name.padEnd(35))
          : color(C.yellow, info.name.padEnd(35));

      const status = info.merged
        ? color(C.green,  '✓ merged  ')
        : color(C.yellow, '✗ unmerged');

      const ab = `+${info.ahead} / -${info.behind}`;
      const remote = info.remoteRef ? color(C.dim, ` [${info.remoteRef}]`) : '';

      stdout.write(
        `${prefix}${checkbox} ${nameColor}` +
        `${color(C.dim, info.date.padEnd(16))}` +
        `${color(C.dim, info.author.slice(0, 19).padEnd(20))}` +
        `${status.padEnd(14)}` +
        `${color(C.dim, ab)}${remote}\n`
      );
    }

    stdout.write('\n');
    if (selected.size > 0) {
      stdout.write(color(C.red, `  ${selected.size} branch(es) selected for deletion  [Enter to delete]\n`));
    } else {
      stdout.write(color(C.dim, '  No branches selected\n'));
    }
  }

  async function confirmAndDelete() {
    if (selected.size === 0) return;
    const toDelete = [...selected].map(i => infos[i]);

    // Exit raw mode temporarily for confirmation
    stdin.setRawMode(false);
    stdout.write('\x1b[2J\x1b[H');
    stdout.write(color(C.bold, `Delete ${toDelete.length} branch(es)?\n\n`));
    for (const info of toDelete) {
      stdout.write(color(C.red, `  • ${info.name}\n`));
    }
    stdout.write('\n');

    if (opts.dryRun) {
      stdout.write(color(C.yellow, '[dry-run] No branches will actually be deleted.\n\n'));
    }

    process.stdout.write('[y/N] ');
    const answer = await prompt();

    if (answer.toLowerCase() === 'y') {
      let deleted = 0;
      for (const info of toDelete) {
        const ok = deleteBranch(info.name, opts.remote, opts.dryRun);
        if (ok) {
          deleted++;
          stdout.write(color(C.green, `  Deleted: ${info.name}\n`));
        }
      }
      stdout.write(color(C.bold, `\nDone. ${deleted}/${toDelete.length} branches removed.\n`));
    } else {
      stdout.write('Aborted.\n');
    }

    // Small pause then restore TUI or exit
    await new Promise(r => setTimeout(r, 1200));

    // Remove deleted from infos
    const deletedIndices = new Set([...selected]);
    let removed = 0;
    for (const idx of [...deletedIndices].sort((a,b) => b - a)) {
      infos.splice(idx, 1);
      removed++;
    }
    selected.clear();
    if (cursor >= infos.length) cursor = Math.max(0, infos.length - 1);

    if (infos.length === 0) {
      stdout.write(color(C.green, '\nAll done! No more branches to clean.\n'));
      cleanExit();
      return;
    }

    // Re-enter raw mode
    stdin.setRawMode(true);
    render();
  }

  // Setup raw mode
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  render();

  return new Promise((resolve) => {
    function cleanExit() {
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write('\n');
      resolve();
    }

    stdin.on('data', async (key) => {
      // Ctrl+C or q
      if (key === '\u0003' || key === 'q' || key === 'Q') {
        stdout.write('\x1b[2J\x1b[H');
        cleanExit();
        return;
      }

      // Enter
      if (key === '\r' || key === '\n') {
        if (selected.size > 0) {
          stdin.pause();
          stdin.setRawMode(false);
          await confirmAndDelete();
          if (infos.length > 0) {
            stdin.setRawMode(true);
            stdin.resume();
            render();
          } else {
            cleanExit();
          }
        }
        return;
      }

      // Space — toggle selection
      if (key === ' ') {
        if (selected.has(cursor)) selected.delete(cursor);
        else selected.add(cursor);
        render();
        return;
      }

      // Arrow keys
      if (key === '\x1b[A' || key === 'k') { // Up
        cursor = Math.max(0, cursor - 1);
        render();
        return;
      }
      if (key === '\x1b[B' || key === 'j') { // Down
        cursor = Math.min(infos.length - 1, cursor + 1);
        render();
        return;
      }
    });
  });
}

// ─── Help ─────────────────────────────────────────────────────────────────────
function printHelp() {
  console.log(`
${color(C.bold, 'git-clean-branches')} — List and delete merged/stale git branches

${color(C.bold, 'USAGE')}
  gcb                              Interactive TUI
  gcb --merged                     List branches merged into current
  gcb --stale <days>               List branches with no commits in N days
  gcb --merged --delete            Delete merged branches (with confirmation)
  gcb --stale 60 --delete          Delete stale branches
  gcb --stale 30 --delete --remote Also delete remote tracking branches
  gcb --dry-run                    Show what would be deleted, don't delete
  gcb --format json                Machine-readable branch list

${color(C.bold, 'OPTIONS')}
  --merged                         Filter: only merged branches
  --stale <days>                   Filter: no commits in N days
  --delete                         Delete matching branches (asks confirmation)
  --remote                         Also delete remote tracking branches
  --dry-run                        Preview deletions only
  --protect <branches>             Comma-separated list of protected branches
                                   Default: main,master,develop
  --format json|tui                Output format (default: tui)
  -h, --help                       Show this help

${color(C.bold, 'TUI CONTROLS')}
  ↑ / ↓ or j / k                  Navigate
  Space                            Toggle selection
  Enter                            Delete selected branches
  q or Ctrl+C                      Quit

${color(C.bold, 'COLORS')}
  ${color(C.green,  'Green')}  = merged into base branch
  ${color(C.yellow, 'Yellow')} = stale or unmerged
  ${color(C.red,    'Red')}    = selected for deletion
  ${color(C.gray,   'Gray')}   = protected (cannot be deleted)
`);
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function die(msg) {
  console.error(color(C.red, `Error: ${msg}`));
  exit(1);
}

// ─── Entry Point ──────────────────────────────────────────────────────────────
const args = argv.slice(2);
const opts = parseArgs(args);

if (opts.help) {
  printHelp();
  exit(0);
}

if (opts.tui) {
  interactiveTUI(opts).catch(e => { die(e.message); });
} else {
  nonInteractiveMode(opts).catch(e => { die(e.message); });
}
