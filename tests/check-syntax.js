// Fails if any JavaScript file in the portal has a syntax error.
// One bad quote anywhere stops the whole portal from loading, so run this on every change.
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const files = ['js', 'modules'].flatMap(d => fs.readdirSync(path.join(root, d)).filter(f => f.endsWith('.js')).map(f => path.join(d, f)));
let bad = 0;
for (const f of files) {
  try { new Function(fs.readFileSync(path.join(root, f), 'utf8')); }
  catch (e) { bad++; console.error(`✗ ${f}: ${e.message}`); }
}
// Every <script src> in index.html must exist.
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const [, src] of html.matchAll(/<script src="(?!https?:)([^"]+)"/g)) {
  if (!fs.existsSync(path.join(root, src))) { bad++; console.error(`✗ index.html loads missing file ${src}`); }
}
console.log(bad ? `${bad} problem(s)` : `✓ ${files.length} files parse, all script tags resolve`);
process.exit(bad ? 1 : 0);
