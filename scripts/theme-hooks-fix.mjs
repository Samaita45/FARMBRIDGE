/**
 * Inserts the theme hooks into components the main codemod's patterns missed.
 *
 * Two shapes defeated those patterns, and both are common here:
 *
 *   export const Input = forwardRef<T, P>(function Input(...)   — not at line start
 *   function Chip({ onPress }: { onPress: () => void }) {       — `()` inside the params
 *
 * A regex for a parameter list cannot survive a parameter list containing
 * parentheses, so this matches them by counting instead. It only touches files
 * the codemod has already converted, and only functions that actually read the
 * stylesheet or a colour token.
 *
 *   node scripts/theme-hooks-fix.mjs <file...>
 */
import { readFileSync, writeFileSync } from 'node:fs';

/** Offset of the delimiter closing the one at `open`, skipping strings and comments. */
function matchPair(src, open, [o, c]) {
  let depth = 0;
  for (let i = open; i < src.length; i += 1) {
    const ch = src[i];
    const next = src[i + 1];
    if (ch === '/' && next === '/') {
      i = src.indexOf('\n', i);
      if (i < 0) return -1;
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      if (end < 0) return -1;
      i = end + 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const q = ch;
      i += 1;
      while (i < src.length && src[i] !== q) {
        if (src[i] === '\\') i += 1;
        i += 1;
      }
      continue;
    }
    if (ch === o) depth += 1;
    else if (ch === c) {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

let totalInserted = 0;

for (const file of process.argv.slice(2)) {
  const raw = readFileSync(file, 'utf8');
  const crlf = raw.indexOf('\r\n') >= 0;
  let s = crlf ? raw.split('\r\n').join('\n') : raw;

  const sheet = /const useStyles = makeStyles\(/.exec(s);
  if (!sheet) {
    console.log(`skip   ${file}  not converted`);
    continue;
  }
  // Which name the file reads its styles under — tsc told us it is missing.
  const varName = /\bstyles\./.test(s) ? 'styles' : /\bs\./.test(s) ? 's' : null;

  const inserts = [];
  const re = /\bfunction\s+([A-Z]\w*)\s*\(/g;
  let m;
  while ((m = re.exec(s))) {
    const name = m[1];
    const parenOpen = m.index + m[0].length - 1;
    const parenClose = matchPair(s, parenOpen, ['(', ')']);
    if (parenClose < 0) continue;
    // Skip a return-type annotation, then require a body.
    const rest = s.slice(parenClose + 1);
    const bodyRel = /^\s*(?::[^{;]+)?\{/.exec(rest);
    if (!bodyRel) continue;
    const bodyStart = parenClose + 1 + bodyRel[0].length;
    const bodyEnd = matchPair(s, bodyStart - 1, ['{', '}']);
    const body = s.slice(bodyStart, bodyEnd < 0 ? s.length : bodyEnd);

    const needsStyles = Boolean(varName) && new RegExp(`\\b${varName}\\.`).test(body);
    const needsTokens = /\bDS\.(colors|semantic)/.test(body);
    // Already has them (the codemod reached this one).
    const hasStyles = new RegExp(`const ${varName} = useStyles\\(\\)`).test(body);
    const hasTokens = /const DS = useDS\(\)/.test(body);

    if ((!needsStyles || hasStyles) && (!needsTokens || hasTokens)) continue;
    inserts.push({
      at: bodyStart,
      name,
      styles: needsStyles && !hasStyles,
      tokens: needsTokens && !hasTokens,
    });
  }

  if (!inserts.length) {
    console.log(`ok     ${file}  nothing missing`);
    continue;
  }

  inserts.sort((a, b) => b.at - a.at);
  for (const ins of inserts) {
    const lines = [];
    if (ins.tokens) lines.push('  const DS = useDS();');
    if (ins.styles) lines.push(`  const ${varName} = useStyles();`);
    s = s.slice(0, ins.at) + '\n' + lines.join('\n') + s.slice(ins.at);
  }
  if (inserts.some((i) => i.tokens) && !s.includes("from '@/contexts/theme'")) {
    s = s.replace(
      "import { makeStyles } from '@/hooks/useThemedStyles';\n",
      "import { makeStyles } from '@/hooks/useThemedStyles';\nimport { useDS } from '@/contexts/theme';\n"
    );
  }

  writeFileSync(file, crlf ? s.split('\n').join('\r\n') : s, 'utf8');
  totalInserted += inserts.length;
  console.log(`fixed  ${file}  ${inserts.map((i) => i.name).join(', ')}`);
}

console.log(`\n${totalInserted} hook insertion(s)`);
