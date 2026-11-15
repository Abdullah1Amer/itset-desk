'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * Builds the Offline edition from the SAME source files as the team edition:
 *   node build-offline.js
 * Output:
 *   dist/itset-desk-offline.html   single file, open it directly from disk (file://), no server
 * The UI (app.js), business logic (core.js) and styles (styles.css) are inlined unchanged;
 * local.js replaces the server with a browser-storage backend.
 */
const fs = require('node:fs');
const path = require('node:path');

const PUB = path.join(__dirname, 'public');
const read = f => fs.readFileSync(path.join(PUB, f), 'utf8');
const js = s => s.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
const css = s => s.replace(/<\/style/gi, '<\\/style');

function build() {
  let html = read('index.html');
  const swap = (from, to) => { if (!html.includes(from)) throw new Error('build: marker not found: ' + from); html = html.replace(from, () => to); };
  swap('<link rel="stylesheet" href="itset-core.css">', `<style>\n${css(read('itset-core.css'))}\n</style>`);
  swap('<link rel="stylesheet" href="styles.css">', `<style>\n${css(read('styles.css'))}\n</style>`);
  swap('<script src="core.js"></script>', `<script>window.ITSET_OFFLINE=true;</script>\n<script>\n${js(read('core.js'))}\n</script>\n<script>\n${js(read('local.js'))}\n</script>`);
  swap('<script src="app.js"></script>', `<script>\n${js(read('app.js'))}\n</script>`);
  swap('<title>IT Set Desk</title>', '<title>IT Set Desk — Offline</title>');
  return html;
}

/** Same build without the document wrapper (for hosts that add their own <html>/<head>/<body>). */
function buildFragment() {
  const html = build();
  const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>')).replace(/<meta charset[^>]*>\s*/i, '').replace(/<meta name="viewport"[^>]*>\s*/i, '');
  const body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));
  return head.trim() + '\n' + body.trim() + '\n';
}

if (require.main === module) {
  const out = path.join(__dirname, 'dist');
  fs.mkdirSync(out, { recursive: true });
  const html = build();
  fs.writeFileSync(path.join(out, 'itset-desk-offline.html'), html);
  console.log('Built dist/itset-desk-offline.html', `(${(html.length / 1024).toFixed(0)} KB)`);
  if (process.argv.includes('--fragment')) {
    const f = buildFragment(); fs.writeFileSync(path.join(out, 'itset-desk-fragment.html'), f);
    console.log('Built dist/itset-desk-fragment.html', `(${(f.length / 1024).toFixed(0)} KB)`);
  }
}
module.exports = { build, buildFragment };
