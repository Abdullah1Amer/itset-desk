'use strict';
/* Offline edition: runs public/local.js (the browser backend) against an in-memory localStorage.
   Run: node --test tests/offline.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');

const PUB = path.join(__dirname, '..', 'public');
function boot(storage) {
  const store = new Map(Object.entries(storage || {}));
  const localStorage = { getItem: k => store.has(k) ? store.get(k) : null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) };
  const window = { ITSET_OFFLINE: true, localStorage, crypto: globalThis.crypto, console: { info() {}, warn() {}, log() {} } };
  const ctx = vm.createContext({ window, globalThis: window, localStorage, crypto: globalThis.crypto, console: window.console, Intl, Date, Math, JSON, Map, Set, WeakMap, Uint8Array, btoa, Buffer });
  vm.runInContext(fs.readFileSync(path.join(PUB, 'core.js'), 'utf8'), ctx);
  ctx.window.ITCore = ctx.ITCore || ctx.window.ITCore;
  vm.runInContext(fs.readFileSync(path.join(PUB, 'local.js'), 'utf8'), ctx);
  const api = (m, u, b) => window.ITSET_LOCAL.handle(m, u, b);
  return { api, store };
}

test('fresh offline edition starts with demo data and hides server-only features', async () => {
  const { api } = boot();
  const b = await api('GET', '/api/bootstrap');
  assert.ok(b.state.tickets.length > 10 && b.state.requesters.length > 5);
  assert.deepEqual(Object.values(b.features).filter(Boolean), [], 'no server features offline');
  await assert.rejects(api('POST', '/api/backups'), e => e.code === 'offline_unsupported');
});

test('tickets, requesters, trash and settings work and persist across reloads', async () => {
  const a = boot(); let r = await a.api('POST', '/api/tickets', { title: 'Offline printer issue', type: 'incident', categoryId: 'c5', impact: 2, urgency: 2, requester: { name: 'Mona', email: 'mona@x.com' } });
  const t = r.ticket; assert.match(t.key, /^ITS-\d+/); assert.ok(t.requesterId);
  await a.api('POST', `/api/tickets/${t.id}/ops`, { ops: [{ op: 'comment', kind: 'reply', body: 'On it' }] });
  await a.api('PUT', '/api/settings', { settings: { calendar: { mode: 'business', tz: 'Africa/Cairo', days: { 0: [540, 1020] } } } });
  await a.api('DELETE', '/api/tickets/' + t.id);
  r = await a.api('GET', '/api/bootstrap'); assert.ok(r.state.trash.some(x => x.item.id === t.id));
  await a.api('POST', `/api/trash/${encodeURIComponent('tickets:' + t.id)}/restore`);
  const b = boot(Object.fromEntries(a.store));
  const s = (await b.api('GET', '/api/bootstrap')).state;
  const back = s.tickets.find(x => x.id === t.id);
  assert.ok(back && back.status === 'progress' && back.activity.at(-1).k === 'restored');
  assert.equal(s.settings.calendar.mode, 'business');
});

test('migrates data saved by the previous offline version (v1) on first open', async () => {
  const C = require('../public/core.js');
  const v1 = C.seed(Date.now()); delete v1.requesters; v1.version = 1; v1.settings.lang = 'en'; v1.settings.me = 'a3';
  v1.tickets.forEach(t => { delete t.requesterId; delete t.portalToken; delete t.attachments; });
  v1.tickets.push(Object.assign({}, v1.tickets[0], { id: 'legacy01', key: 'ITS-5000', title: 'Legacy v1 ticket' }));
  const { api, store } = boot({ 'itset.servicedesk.v1': JSON.stringify(v1) });
  const b = await api('GET', '/api/bootstrap');
  assert.equal(b.state.tickets.length, v1.tickets.length);
  assert.ok(b.state.tickets.every(t => t.requesterId), 'requesters created during migration');
  assert.equal(b.me.id, 'a3', '"working as" kept');
  assert.equal(JSON.parse(store.get('itset.sd.prefs')).lang, 'en', 'language preference carried over');
  const n = (await api('POST', '/api/tickets', { title: 'After migration', type: 'request', categoryId: 'c1', impact: 3, urgency: 3, requester: { name: 'X' } })).ticket.key;
  assert.equal(n, 'ITS-5001', 'numbering continues after the highest migrated key');
});

test('export from offline imports into the same shape (round trip)', async () => {
  const a = boot(); const exp = await a.api('GET', '/api/export');
  assert.equal(exp.version, 1); assert.equal(exp.trash, undefined);
  const b = boot(); await b.api('POST', '/api/import', exp);
  assert.equal((await b.api('GET', '/api/bootstrap')).state.tickets.length, exp.tickets.length);
  await assert.rejects(b.api('POST', '/api/import', { nope: 1 }), e => e.code === 'importBad');
});

test('the offline build inlines the same app, core and styles (single codebase)', () => {
  const { build } = require('../build-offline.js');
  const html = build();
  for (const f of ['app.js', 'core.js', 'local.js']) {
    const src = fs.readFileSync(path.join(PUB, f), 'utf8').replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
    assert.ok(html.includes(src), f + ' inlined unchanged');
  }
  assert.ok(!/<script src=|<link rel="stylesheet" href="styles/.test(html), 'no external local files');
  assert.ok(html.includes('window.ITSET_OFFLINE=true'));
});

test('offline first run uses the saved language for the demo data', async () => {
  const { api } = boot({ 'itset.sd.prefs': JSON.stringify({ lang: 'en' }) });
  const s = (await api('GET', '/api/bootstrap')).state;
  assert.equal(s.categories[0].name, 'Hardware'); assert.doesNotMatch(s.tickets[0].title, /[؀-ۿ]/);
});
