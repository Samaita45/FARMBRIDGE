/**
 * Gives every hardcoded colour utility a `dark:` counterpart.
 *
 * Sixteen screens style with NativeWind classes rather than StyleSheet, and a
 * class like `bg-white` does not follow a palette — it is white. Those screens
 * stayed daylight-bright under a dark theme while the rest of the app changed.
 *
 * The mapping is applied per `className` rather than per token, because one
 * token's answer depends on its neighbours: `text-white` on a photograph stays
 * white, but `text-white` sitting on `bg-primary` has to invert, since the dark
 * scheme's primary is a pale green carrying dark text.
 *
 *   node scripts/nativewind-dark.mjs --check   # fail if anything is uncovered
 *   node scripts/nativewind-dark.mjs           # add the variants
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const check = process.argv.includes('--check');

/** light utility -> its dark counterpart */
const MAP = {
  'bg-white': 'dark:bg-dCard',
  'bg-card': 'dark:bg-dCard',
  'bg-surface': 'dark:bg-dSurface',
  'bg-gray-50': 'dark:bg-dSurface',
  'bg-gray-100': 'dark:bg-dCardMuted',
  'bg-gray-200': 'dark:bg-dBorder',
  'bg-slate-50': 'dark:bg-dSurface',
  'bg-slate-100': 'dark:bg-dCardMuted',
  'bg-primary': 'dark:bg-dPrimary',
  'bg-primaryBg': 'dark:bg-dPrimaryBg',
  'text-dark': 'dark:text-dText',
  'text-gray-900': 'dark:text-dText',
  'text-slate-900': 'dark:text-dText',
  'text-muted': 'dark:text-dMuted',
  'text-gray-600': 'dark:text-dMuted',
  'text-gray-700': 'dark:text-dMuted',
  'text-slate-600': 'dark:text-dMuted',
  'text-soft': 'dark:text-dSoft',
  'text-gray-500': 'dark:text-dSoft',
  'text-gray-400': 'dark:text-dSoft',
  'text-primary': 'dark:text-dPrimary',
  'border-gray-100': 'dark:border-dBorder',
  'border-gray-200': 'dark:border-dBorder',
  'border-gray-300': 'dark:border-dBorder',
  'border-border': 'dark:border-dBorder',
  'border-slate-200': 'dark:border-dBorder',
  'border-primary': 'dark:border-dPrimary',
  'bg-primaryMid': 'dark:bg-dPrimaryBg',
  'bg-primary/10': 'dark:bg-dPrimary/20',
  'bg-primary/20': 'dark:bg-dPrimary/25',
  'text-error': 'dark:text-dDanger',
  // The amber callout in the tutorial reader, as the dark warning state.
  'bg-amber-50': 'dark:bg-dWarnBg',
  'bg-amber-100': 'dark:bg-dWarnBg',
  'bg-amber-500': 'dark:bg-dWarn',
  'border-amber-100': 'dark:border-dWarnBorder',
  'border-amber-200': 'dark:border-dWarnBorder',
  'text-amber-700': 'dark:text-dWarnText',
  'text-amber-800': 'dark:text-dWarnText',
  'text-amber-900': 'dark:text-dWarnText',
  'bg-error/10': 'dark:bg-dDanger/20',
  'text-gray-300': 'dark:text-dSoft',
  'border-primary/20': 'dark:border-dPrimary/30',
  'bg-secondary': 'dark:bg-dPrimary',
  'text-error': 'dark:text-dDanger',
};

/**
 * `text-` and `border-` are not colour prefixes — they also carry size,
 * alignment, weight and width. Treating `text-center` as a colour is how a
 * first run reported sixty-three "unmapped colours" that were not colours.
 */
const NOT_A_COLOUR =
  /^(?:text-(?:xs|sm|base|lg|[2-9]?xl|left|center|right|justify|start|end|wrap|nowrap|balance|pretty|ellipsis|clip|uppercase|lowercase|capitalize|normal-case)|border(?:-[trblxy])?(?:-[0-8])?$|border-(?:solid|dashed|dotted|none))/;

/** Utilities that read correctly in both schemes and need no variant. */
const NEUTRAL =
  /^(?:text-white(?:\/\d+)?|bg-black(?:\/\d+)?|bg-white\/\d+|bg-transparent|border-transparent|text-danger|text-success|text-warning|bg-danger|bg-success|bg-warning|bg-accent|text-accent)$/;

const roots = ['app', 'components'];
const files = [];
for (const r of roots) {
  (function walk(d) {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else if (/\.tsx$/.test(p)) files.push(p);
    }
  })(r);
}

const COLOUR = /^(?:bg|text|border)-(?!\[)/;
let changed = 0;
let uncovered = [];
const manual = [];

for (const file of files) {
  const raw = readFileSync(file, 'utf8');
  const crlf = raw.indexOf('\r\n') >= 0;
  let s = crlf ? raw.split('\r\n').join('\n') : raw;
  let touched = false;

  /**
   * Adds the variants a run of plain class names needs.
   *
   * `siblings` is every class that ends up on the element, across both branches
   * of any ternary, because that is what decides whether `text-white` is white
   * on a photograph or white on a fill that inverts.
   */
  function cover(run, siblings) {
    const tokens = run.split(/\s+/).filter(Boolean);
    const additions = [];
    for (const t of tokens) {
      if (t.startsWith('dark:')) continue;
      if (!COLOUR.test(t) || NOT_A_COLOUR.test(t)) continue;
      if (NEUTRAL.test(t)) {
        if (t === 'text-white' && (siblings.has('bg-primary') || siblings.has('bg-primaryDark') || siblings.has('bg-secondary'))) {
          if (!run.includes('dark:text-dOnPrimary')) additions.push('dark:text-dOnPrimary');
        }
        continue;
      }
      const dark = MAP[t];
      if (!dark) {
        uncovered.push(`${file}: ${t}`);
        continue;
      }
      if (!run.includes(dark) && !additions.includes(dark)) additions.push(dark);
    }
    if (!additions.length) return run;
    changed += additions.length;
    return `${run} ${additions.join(' ')}`;
  }

  // Both `className="..."` and the template form inside `className={`...`}`.
  s = s.replace(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g, (whole, dq, tpl) => {
    const body = dq ?? tpl;

    if (!body.includes('${')) {
      const next = cover(body, new Set(body.split(/\s+/))).replace(/\s+/g, ' ').trim();
      if (next === body) return whole;
      touched = true;
      return dq != null ? `className="${next}"` : `className={\`${next}\`}`;
    }

    /*
      A template with a ternary in it cannot be tokenised by splitting on
      spaces: `${on ? 'bg-primary' : 'bg-card'}` comes apart into quoted
      fragments, and a variant appended after the closing brace would apply
      unconditionally — the selected chip and the unselected one would get the
      same dark background. So the static runs and each quoted branch are
      covered separately, in place.
    */
    const siblings = new Set(body.replace(/[`'"${}?:]/g, ' ').split(/\s+/).filter(Boolean));
    let touchedHere = false;

    // Split into static text and `${...}` expressions.
    const parts = body.split(/(\$\{[^}]*\})/);
    const rebuilt = parts
      .map((part) => {
        if (!part.startsWith('${')) {
          const next = cover(part, siblings);
          if (next !== part) touchedHere = true;
          return next;
        }
        // Inside the expression, only the quoted class strings are ours.
        return part.replace(/'([^']*)'/g, (q, inner) => {
          if (!inner.trim()) return q;
          const next = cover(inner, siblings);
          if (next === inner) return q;
          touchedHere = true;
          return `'${next}'`;
        });
      })
      .join('');

    if (!touchedHere) {
      manual.push(file);
      return whole;
    }
    touched = true;
    return `className={\`${rebuilt}\`}`;
  });

  if (touched && !check) writeFileSync(file, crlf ? s.split('\n').join('\r\n') : s, 'utf8');
}

uncovered = [...new Set(uncovered)];
const manualFiles = [...new Set(manual)];
if (manualFiles.length) {
  console.log('Interpolated classNames — a ternary decides the colour, so these need a person:');
  for (const m of manualFiles) console.log('  ' + m);
}
if (uncovered.length) {
  console.log('Colour utilities with no dark counterpart:');
  for (const u of uncovered) console.log('  ' + u);
}

if (check) {
  const clean = changed === 0 && uncovered.length === 0;
  console.log(
    clean
      ? 'ALL COLOUR UTILITIES HAVE A DARK COUNTERPART'
      : `${changed} missing variant(s), ${uncovered.length} unmapped utility kind(s)`
  );
  process.exit(clean ? 0 : 1);
}

console.log(`added ${changed} dark variant(s)${uncovered.length ? `; ${uncovered.length} unmapped` : ''}`);
