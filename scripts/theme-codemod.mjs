/**
 * Converts a screen's stylesheet to one that follows the colour scheme.
 *
 * THE DIFF IS DELIBERATELY TINY. The factory argument is named `DS`, which
 * shadows the module-level `import { DS }` inside it, so the body of the
 * stylesheet — hundreds of `DS.colors.x` references per file — is not touched
 * at all. A codemod that rewrites nothing inside those braces cannot
 * mistranslate them. What it does touch:
 *
 *   const s = StyleSheet.create({ ... })  ->  const useStyles = makeStyles((DS) => ({ ... }))
 *
 * and, at the top of every function that reads `s` or `DS`:
 *
 *   const s = useStyles();
 *   const DS = useDS();
 *
 * The second line is what makes inline colours — an icon's `color={...}`, a
 * prop passed to a child — follow the scheme too. Without it a converted
 * screen goes dark except for its icons.
 *
 * WHAT VERIFIES IT. Nothing here is clever enough to be trusted on its own.
 * tsc catches a `s` that is used but never declared; eslint's rules-of-hooks
 * catches a hook inserted into something that is not a component. Run both
 * after every batch — that is the actual safety net, not this file.
 *
 *   node scripts/theme-codemod.mjs <file...>        # convert
 *   node scripts/theme-codemod.mjs --dry <file...>  # report only
 */
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const dry = args.includes('--dry');
const files = args.filter((a) => !a.startsWith('--'));

/**
 * Finds the `}` that closes the `{` at `open`.
 *
 * Skips strings AND comments. Three stylesheets in this project explain a
 * colour choice in a comment containing a brace, and counting those reported
 * "unbalanced braces" on files that were perfectly balanced.
 */
function matchBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) return -1;
      continue;
    }
    if (c === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c;
      i += 1;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') i += 1;
        i += 1;
      }
      continue;
    }
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * The offset just past the last complete import statement.
 *
 * Not "the line after the last `import`": an import block that ends with a
 * multi-line `import type { A, B } from '...'` had new imports spliced into
 * the middle of it, which produced a file that would not parse. This tracks
 * whether a statement is still open.
 */
function endOfImports(src) {
  const lines = src.split('\n');
  let offset = 0;
  let lastEnd = 0;
  let open = false;
  for (const line of lines) {
    const len = line.length + 1;
    if (!open && /^\s*import\b/.test(line)) open = true;
    if (open && /;\s*$/.test(line)) {
      open = false;
      lastEnd = offset + len;
    }
    offset += len;
  }
  return lastEnd;
}

const results = [];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const crlf = raw.indexOf('\r\n') >= 0;
  let s = crlf ? raw.split('\r\n').join('\n') : raw;
  const notes = [];

  if (s.includes('makeStyles(')) {
    results.push([file, 'skip', 'already converted']);
    continue;
  }

  // ── 1. the stylesheet ──
  const decl = /(?:^|\n)const (\w+) = StyleSheet\.create\(\{/.exec(s);
  if (!decl) {
    results.push([file, 'skip', 'no module-level StyleSheet.create']);
    continue;
  }
  const varName = decl[1];
  const openBrace = s.indexOf('{', decl.index + decl[0].length - 1);
  const closeBrace = matchBrace(s, openBrace);
  if (closeBrace < 0) {
    results.push([file, 'FAIL', 'unbalanced braces']);
    continue;
  }
  const after = s.slice(closeBrace);
  if (!after.startsWith('});')) {
    results.push([file, 'FAIL', 'stylesheet does not close with });']);
    continue;
  }

  const body = s.slice(openBrace, closeBrace + 1);
  const usesColour = /DS\.(colors|semantic)/.test(body);
  if (!usesColour) {
    results.push([file, 'skip', 'stylesheet has no colour tokens']);
    continue;
  }

  s =
    s.slice(0, decl.index + (decl[0].startsWith('\n') ? 1 : 0)) +
    `const useStyles = makeStyles((DS) => (` +
    body +
    `));` +
    s.slice(closeBrace + 3);
  notes.push(`sheet ${varName} -> useStyles`);

  // ── 2. the import ──
  const importLine = "import { makeStyles } from '@/hooks/useThemedStyles';\n";
  const at = endOfImports(s);
  if (at === 0) {
    results.push([file, 'FAIL', 'could not find the end of the import block']);
    continue;
  }
  s = s.slice(0, at) + importLine + s.slice(at);

  // ── 3. hook calls in every function that needs them ──
  // Component-ish declarations at top level, with their body's opening brace.
  const fnRe = /\n(?:export\s+)?(?:default\s+)?function\s+(\w+)\s*\([^)]*\)\s*(?::[^{]+)?\{/g;
  const arrowRe = /\nconst (\w+)\s*(?::[^=]+)?=\s*(?:\([^)]*\)|\w+)\s*(?::[^=]*)?=>\s*\{/g;

  const inserts = [];
  const seen = new Set();
  for (const re of [fnRe, arrowRe]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(s))) {
      const name = m[1];
      // Only components: React requires a capitalised name, and only a
      // component may call a hook.
      if (!/^[A-Z]/.test(name)) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      const bodyStart = m.index + m[0].length;
      const bodyEnd = matchBrace(s, bodyStart - 1);
      const fnBody = s.slice(bodyStart, bodyEnd < 0 ? s.length : bodyEnd);
      const needsStyles = new RegExp(`\\b${varName}\\.`).test(fnBody);
      const needsTokens = /\bDS\.(colors|semantic)/.test(fnBody);
      if (!needsStyles && !needsTokens) continue;
      inserts.push({ at: bodyStart, needsStyles, needsTokens, name });
    }
  }

  // Apply from the end so earlier offsets stay valid.
  inserts.sort((a, b) => b.at - a.at);
  for (const ins of inserts) {
    const lines = [];
    if (ins.needsTokens) lines.push('  const DS = useDS();');
    if (ins.needsStyles) lines.push(`  const ${varName} = useStyles();`);
    s = s.slice(0, ins.at) + '\n' + lines.join('\n') + s.slice(ins.at);
    notes.push(`${ins.name}${ins.needsTokens ? ' +DS' : ''}${ins.needsStyles ? ' +styles' : ''}`);
  }

  if (inserts.some((i) => i.needsTokens)) {
    s = s.replace(importLine, importLine + "import { useDS } from '@/contexts/theme';\n");
  }

  if (!dry) writeFileSync(file, crlf ? s.split('\n').join('\r\n') : s, 'utf8');
  results.push([file, dry ? 'would convert' : 'converted', notes.join('; ')]);
}

let converted = 0;
let failed = 0;
for (const [file, status, note] of results) {
  if (status === 'FAIL') failed += 1;
  if (status.includes('convert')) converted += 1;
  if (status !== 'skip' || process.env.VERBOSE) {
    console.log(`${status.padEnd(14)} ${file.replace(/\\/g, '/')}  ${note}`);
  }
}
console.log(`\n${converted} converted, ${results.length - converted - failed} skipped, ${failed} failed`);
process.exit(failed ? 1 : 0);
