/**
 * Removes import specifiers that eslint reports as unused.
 *
 * The theme codemod leaves two behind in most files: `StyleSheet`, because the
 * sheet is built by `makeStyles` now, and the module-level `DS`, because the
 * factory's parameter shadows it. Which of the two is actually dead varies per
 * file — plenty still call `StyleSheet.absoluteFill`, and some read `DS` at
 * module scope — so this asks eslint rather than guessing.
 *
 *   node scripts/prune-unused-imports.mjs [path...]
 *
 * With no arguments it prunes everything eslint reports across the project.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const targets = process.argv.slice(2);

function lint() {
  const args = [
    'eslint',
    '--format',
    'json',
    ...(targets.length ? targets : ['app', 'components', 'hooks', 'contexts']),
  ];
  try {
    // shell:true because on Windows npx is npx.cmd and spawnSync will not find it.
    return JSON.parse(
      execFileSync('npx', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, shell: true })
    );
  } catch (err) {
    // eslint exits non-zero whenever it reports anything; the JSON is still on stdout.
    if (err.stdout) return JSON.parse(err.stdout);
    throw err;
  }
}

const UNUSED = /^'(.+?)' is defined but never used/;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

let removed = 0;
const touched = new Set();

for (const result of lint()) {
  const dead = result.messages
    .filter((m) => m.ruleId === '@typescript-eslint/no-unused-vars' && UNUSED.test(m.message))
    .map((m) => ({ name: UNUSED.exec(m.message)[1], line: m.line }));
  if (!dead.length) continue;

  const raw = readFileSync(result.filePath, 'utf8');
  const crlf = raw.indexOf('\r\n') >= 0;
  const lines = crlf ? raw.split('\r\n') : raw.split('\n');
  let changed = false;

  for (const { name, line } of dead) {
    const i = line - 1;
    const text = lines[i];
    if (text == null) continue;
    const safe = escape(name);

    /*
      A multi-line import reports the specifier on its own line — a lone
      `  StyleSheet,`. There is no statement there to rewrite, so the line goes.
    */
    if (!/^\s*import\b/.test(text)) {
      const bare = new RegExp('^\\s*(?:type\\s+)?' + safe + ',?\\s*$');
      if (bare.test(text)) {
        lines[i] = null;
        changed = true;
        removed += 1;
      }
      continue;
    }

    // Single-line import: drop this specifier, keep any others.
    const next = text
      .replace(new RegExp('(\\{[^}]*?)\\b(?:type\\s+)?' + safe + '\\s*,\\s*'), '$1')
      .replace(new RegExp(',\\s*(?:type\\s+)?' + safe + '\\b(?=[^}]*\\})'), '')
      .replace(new RegExp('\\{\\s*(?:type\\s+)?' + safe + '\\s*\\}'), '{}');

    if (next === text) continue;
    changed = true;
    removed += 1;
    // An import left holding nothing goes entirely.
    lines[i] = /^\s*import\s*\{\s*\}\s*from/.test(next) ? null : next;
  }

  if (!changed) continue;
  writeFileSync(result.filePath, lines.filter((l) => l !== null).join(crlf ? '\r\n' : '\n'), 'utf8');
  touched.add(result.filePath);
}

console.log(`removed ${removed} unused specifier(s) across ${touched.size} file(s)`);
