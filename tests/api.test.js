'use strict';
/*
 * API test suite — zero dependencies (node:test + fetch).
 * Run:   node --test tests/
 * Starts a real server on a free port with a throw-away data folder, then exercises the API.
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');

const ROOT = path.join(__dirname, '..');
let BASE, proc, dataDir, logBuf = '';

const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, '127.0.0.1', () => { const p = s.address().port; s.close(() => r(p)); }); });
const sleep = ms => new Promise(r => setTimeout(r, ms));

function client() {
  let cookie = '';
  async function call(method, url, body, headers = {}) {
    const h = Object.assign({}, headers);
    if (cookie) h.cookie = cookie;
    if (method !== 'GET') { h['x-itset'] = '1'; if (body !== undefined) h['content-type'] = 'application/json'; }
    const r = await fetch(BASE + url, { method, headers: h, body: body !== undefined ? JSON.stringify(body) : undefined });
    const sc = r.headers.get('set-cookie'); if (sc) cookie = /Max-Age=0/.test(sc) ? '' : sc.split(';')[0];
    let j = null; try { j = await r.json(); } catch (e) { /* not json */ }
    return { status: r.status, body: j, headers: r.headers };
  }
  return { get: u => call('GET', u), post: (u, b, h) => call('POST', u, b, h), put: (u, b) => call('PUT', u, b), del: u => call('DELETE', u), cookie: () => cookie };
}

async function startServer(extraEnv = {}) {
  const port = await freePort();
  BASE = `http://127.0.0.1:${port}`;
  proc = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: Object.assign({}, process.env, { PORT: String(port), DATA_DIR: dataDir, HOST: '127.0.0.1', AUTO_BACKUP_HOURS: '0',
    SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtpPort), SMTP_SECURE: 'none', SMTP_USER: 'svc', SMTP_PASS: 'x', SMTP_FROM: 'IT Set الدعم <helpdesk@test.local>',
    APP_URL: 'https://helpdesk.test/', SLA_WATCH_SECONDS: '1', MAX_UPLOAD_MB: '1', LICENSEE: 'Test Company LLC' }, extraEnv), stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stdout.on('data', d => { logBuf += d; }); proc.stderr.on('data', d => { logBuf += d; });
  for (let i = 0; i < 50; i++) { try { const r = await fetch(BASE + '/healthz'); if (r.ok) return; } catch (e) { /* not up yet */ } await sleep(100); }
  throw new Error('server did not start:\n' + logBuf);
}
async function stopServer() { if (proc) { proc.kill('SIGTERM'); await new Promise(r => proc.once('exit', r)); proc = null; } }

const admin = client(), agent = client(), anon = client();

/* ---- fake SMTP server (plain + AUTH LOGIN) that records delivered messages ---- */
const mails = []; let smtpPort;
function decodeWords(h) { return h.replace(/\r?\n /g, '').replace(/=\?UTF-8\?B\?([^?]+)\?=/g, (_, b) => Buffer.from(b, 'base64').toString('utf8')); }
function startSmtp() {
  return new Promise(res => {
    const srv = net.createServer(sock => {
      let buf = '', data = false, msg = '', step = null; const w = l => sock.write(l + '\r\n');
      const line = l => {
        if (data) { if (l === '.') { data = false; const [head, body] = msg.split('\n\n'); const subj = (/^Subject: ([\s\S]*?)\n(?=\S)/m.exec(head + '\n.') || [])[1] || '';
          mails.push({ to: (/^To: <(.+)>/m.exec(head) || [])[1], subject: decodeWords(subj.replace(/\n /g, '\r\n ')), body: Buffer.from((body || '').replace(/\n/g, ''), 'base64').toString('utf8') }); msg = ''; w('250 queued'); return; }
          msg += l + '\n'; return; }
        const c = l.toUpperCase();
        if (c.startsWith('EHLO')) { w('250-fake'); w('250-AUTH LOGIN'); w('250 OK'); }
        else if (c === 'AUTH LOGIN') { step = 'u'; w('334 VXNlcm5hbWU6'); }
        else if (step === 'u') { step = 'p'; w('334 UGFzc3dvcmQ6'); }
        else if (step === 'p') { step = null; w('235 ok'); }
        else if (c.startsWith('MAIL') || c.startsWith('RCPT')) w('250 ok');
        else if (c === 'DATA') { data = true; w('354 go'); }
        else if (c === 'QUIT') { w('221 bye'); sock.end(); } else w('500 ?');
      };
      sock.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\r\n')) >= 0) { const l = buf.slice(0, i); buf = buf.slice(i + 2); line(l); } });
      sock.on('error', () => {});
      w('220 fake ESMTP');
    });
    srv.listen(0, '127.0.0.1', () => { smtpPort = srv.address().port; srv.unref(); res(); });
  });
}
async function waitFor(fn, ms = 4000) { const end = Date.now() + ms; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) return v; await sleep(50); } }
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]), Buffer.alloc(64, 7)]);
async function upload(c, tid, name, buf) {
  const r = await fetch(`${BASE}/api/tickets/${tid}/attachments`, { method: 'POST', headers: { cookie: c.cookie(), 'x-itset': '1', 'content-type': 'application/octet-stream', 'x-filename': encodeURIComponent(name) }, body: buf });
  let j = null; try { j = await r.json(); } catch (e) { /* ignore */ } return { status: r.status, body: j };
}
const ADMIN = { email: 'admin@test.local', password: 'Admin@12345' };

test.before(async () => { dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'itset-test-')); await startSmtp(); await startServer(); });
test.after(async () => { await stopServer(); fs.rmSync(dataDir, { recursive: true, force: true }); });

test('first-run setup requires the code from the log', async () => {
  assert.equal((await anon.get('/api/status')).body.needsSetup, true);
  const code = (logBuf.match(/SETUP CODE: ([A-Z0-9-]+)/) || [])[1];
  assert.ok(code, 'setup code printed in log');
  assert.equal((await anon.post('/api/setup', { name: 'A', email: ADMIN.email, password: ADMIN.password })).body.error, 'bad_setup_code');
  assert.equal((await anon.post('/api/setup', { setupCode: 'ZZZZ-ZZZZ', name: 'A', email: ADMIN.email, password: ADMIN.password })).body.error, 'bad_setup_code');
  const r = await admin.post('/api/setup', { setupCode: code.toLowerCase(), name: 'Admin', email: ADMIN.email, password: ADMIN.password, demo: true });
  assert.equal(r.status, 200);
  assert.equal((await anon.post('/api/setup', { setupCode: code, name: 'B', email: 'b@test.local', password: 'Admin@12345' })).body.error, 'already_setup');
  assert.equal((await admin.get('/api/bootstrap')).body.me.prefs.lang, 'ar', 'setup language saved as the admin preference');
  const boot = (await admin.get('/api/bootstrap')).body;
  assert.equal(boot.license.product, 'IT Set Desk'); assert.equal(boot.license.licensee, 'Test Company LLC'); assert.equal(boot.license.edition, 'team');
  assert.equal((await anon.get('/api/status')).body.licensee, 'Test Company LLC', 'licensee shown on the sign-in screen');
});

test('requests without session or CSRF header are rejected', async () => {
  assert.equal((await anon.get('/api/bootstrap')).status, 401);
  const r = await fetch(BASE + '/api/logout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  assert.equal(r.status, 403);
});

test('strict CSP and security headers', async () => {
  const r = await fetch(BASE + '/');
  const csp = r.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self';/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.equal(r.headers.get('x-frame-options'), 'DENY');
  assert.equal((await fetch(BASE + '/app.js')).status, 200);
});

test('admin grants an agent login; role permissions are enforced server-side', async () => {
  const r = await admin.put('/api/agents/a1/access', { role: 'agent', password: 'Agent@12345' });
  assert.equal(r.body.item.role, 'agent');
  assert.equal((await agent.post('/api/login', { email: 'ahmed.samir@example.com', password: 'Agent@12345' })).status, 200);
  const boot = await agent.get('/api/bootstrap');
  assert.equal(boot.body.me.role, 'agent');
  assert.equal(boot.body.state.trash, undefined, 'agents do not receive the trash');
  const tid = boot.body.state.tickets[0].id;
  assert.equal((await agent.del('/api/tickets/' + tid)).status, 403);
  assert.equal((await agent.put('/api/c/teams/t1', { name: 'x' })).status, 403);
  assert.equal((await agent.put('/api/settings', { sla: {} })).status, 403);
  assert.equal((await agent.get('/api/backups')).status, 403);
});

test('ticket lifecycle: create, auto-assign, reply, pending pause, requester reply re-opens', async () => {
  const c = await agent.post('/api/tickets', { title: 'Printer offline in finance', type: 'incident', categoryId: 'c5', impact: 2, urgency: 2, requester: { name: 'Test' } });
  assert.equal(c.status, 200);
  const t = c.body.ticket; assert.match(t.key, /^ITS-\d+$/); assert.equal(t.priority, 3); assert.ok(t.assigneeId, 'auto-assigned');
  let r = await agent.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'comment', kind: 'reply', body: 'On it' }] });
  assert.equal(r.body.tickets[0].status, 'progress'); assert.ok(r.body.tickets[0].firstResponseAt);
  r = await agent.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'set', key: 'status', value: 'pending' }, { op: 'comment', kind: 'requester', body: 'still broken' }] });
  assert.equal(r.body.tickets[0].status, 'progress');
  assert.equal((await agent.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'set', key: 'status', value: 'bogus' }] })).body.error, 'v_req2');
  assert.equal((await agent.post('/api/tickets', { title: 'x', type: 'incident', categoryId: 'c5', impact: 2, urgency: 2, requester: { name: 'T' } })).body.error, 'v_title');
});

test('trash: delete moves to trash, restore brings it back, purge removes it', async () => {
  const boot = await admin.get('/api/bootstrap');
  const t = boot.body.state.tickets.find(x => x.links.length); const linkedId = t.links[0];
  assert.equal((await admin.del('/api/tickets/' + t.id)).status, 200);
  let b = (await admin.get('/api/bootstrap')).body.state;
  assert.ok(!b.tickets.some(x => x.id === t.id));
  assert.ok(b.trash.some(x => x.id === 'tickets:' + t.id));
  const r = await admin.post(`/api/trash/${encodeURIComponent('tickets:' + t.id)}/restore`);
  assert.equal(r.status, 200); assert.equal(r.body.item.activity.at(-1).k, 'restored');
  b = (await admin.get('/api/bootstrap')).body.state;
  assert.ok(b.tickets.some(x => x.id === t.id)); assert.equal(b.trash.length, 0);
  await admin.del('/api/tickets/' + t.id);
  assert.equal((await admin.del(`/api/trash/${encodeURIComponent('tickets:' + t.id)}`)).status, 200);
  b = (await admin.get('/api/bootstrap')).body.state;
  assert.equal(b.trash.length, 0);
  assert.ok(!b.tickets.find(x => x.id === linkedId).links.includes(t.id), 'links cleaned on purge');
  // assets and KB go to trash too
  await admin.put('/api/c/assets/asx1', { tag: 'UPS-01', name: 'APC UPS', status: 'active' });
  assert.equal((await admin.del('/api/c/assets/asx1')).body.trashed, true);
  assert.equal((await admin.post(`/api/trash/${encodeURIComponent('assets:asx1')}/restore`)).body.item.tag, 'UPS-01');
});

test('backups: manual backup, list, and safety backup before import', async () => {
  const m = await admin.post('/api/backups');
  assert.equal(m.status, 200); assert.match(m.body.backup.file, /^servicedesk-manual-\d{8}-\d{9}\.db$/);
  const exp = (await admin.get('/api/export')).body;
  assert.equal(exp.trash, undefined, 'export does not include trash');
  const imp = await admin.post('/api/import', exp);
  assert.equal(imp.status, 200); assert.match(imp.body.backup, /^servicedesk-preimport-/);
  const list = (await admin.get('/api/backups')).body.backups.map(b => b.kind);
  assert.ok(list.includes('manual') && list.includes('preimport'));
  assert.equal((await admin.get('/api/bootstrap')).status, 200, 'admin keeps login after import');
});

test('login throttling is per account, not per office IP', async () => {
  const x = client(); let r;
  for (let i = 0; i < 5; i++) r = await x.post('/api/login', { email: 'ahmed.samir@example.com', password: 'wrong' });
  assert.equal(r.body.error, 'bad_login');
  r = await x.post('/api/login', { email: 'ahmed.samir@example.com', password: 'Agent@12345' });
  assert.equal(r.status, 429); assert.ok(r.body.retryAfter > 0); assert.ok(r.headers.get('retry-after'));
  assert.equal((await client().post('/api/login', ADMIN)).status, 200, 'other account from same IP unaffected');
});

test('forwarded headers are ignored unless the peer is a trusted proxy', async () => {
  const r = await client().post('/api/login', { email: 'nobody@x.local', password: 'x' }, { 'x-forwarded-proto': 'https', 'x-forwarded-for': '1.2.3.4' });
  assert.doesNotMatch(r.headers.get('set-cookie') || '', /Secure/);
  assert.match(logBuf, /login failed nobody@x\.local 127\.0\.0\.1/, 'logged the real peer, not the spoofed IP');
});

test('backup rotation keeps the newest N per kind, even when created within the same second', () => {
  const B = require('../backup.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'itset-bk-'));
  fs.copyFileSync(path.join(dataDir, 'backups', fs.readdirSync(path.join(dataDir, 'backups'))[0]), path.join(dir, 'servicedesk.db'));
  for (let i = 0; i < 16; i++) B.makeBackup(dir, 'auto', 14);
  B.makeBackup(dir, 'manual', 14);
  const l = B.listBackups(dir);
  assert.equal(l.filter(b => b.kind === 'auto').length, 14);
  assert.equal(l.filter(b => b.kind === 'manual').length, 1);
  assert.equal(fs.readdirSync(path.join(dir, 'backups')).length, 15, 'no orphan files left behind');
  fs.rmSync(dir, { recursive: true, force: true });
});

test('attachments: images detected by content, risky files served as downloads, limits enforced', async () => {
  const tid = (await agent.get('/api/bootstrap')).body.state.tickets[0].id;
  let r = await upload(agent, tid, 'screenshot.png', PNG);
  assert.equal(r.status, 200); assert.equal(r.body.attachment.type, 'image/png');
  const img = r.body.attachment;
  r = await upload(agent, tid, 'report.pdf.png', Buffer.from('<html><script>alert(1)</script></html>'));
  assert.equal(r.body.attachment.type, 'application/octet-stream', 'a fake .png is not trusted as an image');
  const fake = r.body.attachment;
  let d = await fetch(`${BASE}/api/tickets/${tid}/attachments/${fake.id}?inline=1`, { headers: { cookie: agent.cookie() } });
  assert.equal(d.headers.get('content-type'), 'application/octet-stream');
  assert.match(d.headers.get('content-disposition'), /^attachment;/);
  assert.match(d.headers.get('content-security-policy'), /sandbox/);
  d = await fetch(`${BASE}/api/tickets/${tid}/attachments/${img.id}?inline=1`, { headers: { cookie: agent.cookie() } });
  assert.equal(d.headers.get('content-type'), 'image/png'); assert.match(d.headers.get('content-disposition'), /^inline;/);
  assert.equal(Buffer.compare(Buffer.from(await d.arrayBuffer()), PNG), 0, 'downloaded bytes match');
  assert.equal((await fetch(`${BASE}/api/tickets/${tid}/attachments/${img.id}`)).status, 401, 'downloads need a session');
  r = await upload(agent, tid, 'تقرير الشبكة.pdf', Buffer.from('%PDF-1.4 test'));
  assert.equal(r.body.attachment.name, 'تقرير الشبكة.pdf', 'Arabic file names kept');
  assert.equal((await upload(agent, tid, 'setup.exe', Buffer.from('MZ'))).body.error, 'blocked_type');
  assert.equal((await upload(agent, tid, 'big.zip', Buffer.alloc(1.5 * 1048576))).status, 413);
  assert.equal((await upload(agent, tid, '..\\..\\etc/passwd', Buffer.from('x'))).body.attachment.name.includes('/'), false, 'path characters stripped');
});

test('attachments: only uploader or admin deletes; unreferenced files are removed but kept in backups', async () => {
  const t = (await admin.get('/api/bootstrap')).body.state.tickets[0];
  const att = t.attachments.find(a => a.name === 'screenshot.png');
  const other = client(); await admin.put('/api/agents/a2/access', { role: 'agent', password: 'Agent@12345' });
  await other.post('/api/login', { email: 'mona.khaled@example.com', password: 'Agent@12345' });
  assert.equal((await other.del(`/api/tickets/${t.id}/attachments/${att.id}`)).status, 403);
  await admin.post('/api/backups');
  const live = path.join(dataDir, 'attachments', att.hash.slice(0, 2), att.hash), bak = path.join(dataDir, 'backups', 'attachments', att.hash.slice(0, 2), att.hash);
  assert.ok(fs.existsSync(live) && fs.existsSync(bak));
  const r = await agent.del(`/api/tickets/${t.id}/attachments/${att.id}`);
  assert.equal(r.status, 200); assert.ok(!r.body.ticket.attachments.some(a => a.id === att.id));
  assert.ok(!fs.existsSync(live), 'live file removed'); assert.ok(fs.existsSync(bak), 'backup copy kept');
  assert.equal(r.body.ticket.activity.at(-1).k, 'att-del');
});

test('notifications: assignment and requester replies reach the assignee in-app and by email', async () => {
  const st = (await admin.get('/api/bootstrap')).body.state;
  const t = st.tickets.find(x => x.assigneeId !== 'a1' && x.status !== 'closed' && x.status !== 'resolved');
  mails.length = 0;
  await admin.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'set', key: 'assigneeId', value: 'a1' }] });
  await admin.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'comment', kind: 'requester', body: 'still broken' }] });
  const n = await waitFor(async () => { const j = (await agent.get('/api/notifications')).body; return j.items.filter(i => i.ticketId === t.id).length >= 2 && j; });
  const types = n.items.filter(i => i.ticketId === t.id).map(i => i.type);
  assert.ok(types.includes('assigned') && types.includes('requester'), 'got: ' + types);
  assert.ok(n.unread >= 2);
  await waitFor(() => mails.filter(x => x.to === 'ahmed.samir@example.com' && x.subject.includes(t.key)).length >= 2);
  const m = mails.find(x => x.to === 'ahmed.samir@example.com' && x.subject.includes(t.key) && /مسندة/.test(x.subject));
  assert.ok(m, 'assignment email delivered');
  assert.ok(mails.some(x => x.to === 'ahmed.samir@example.com' && x.subject.includes(t.key) && /مقدم الطلب/.test(x.subject)), 'requester-reply email delivered');
  assert.match(m.subject, /تذكرة مسندة لك/); assert.ok(m.body.includes('https://helpdesk.test/#t-' + encodeURIComponent(t.key)), 'email has ticket link');
  assert.equal((await agent.post('/api/notifications/read', { all: true })).body.unread, 0);
  // the actor never notifies themselves
  const self = (await admin.get('/api/notifications')).body.items.filter(i => i.ticketId === t.id && i.type !== 'sla_breach' && i.type !== 'sla_risk');
  assert.equal(self.length, 0);
});

test('notifications: email preference is respected; admin test email works', async () => {
  await agent.put('/api/me/prefs', { email: false });
  const t = (await admin.get('/api/bootstrap')).body.state.tickets.find(x => x.assigneeId !== 'a1' && x.status === 'progress');
  mails.length = 0;
  await admin.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'set', key: 'assigneeId', value: 'a1' }] });
  await sleep(400);
  const leaked = mails.filter(x => x.to === 'ahmed.samir@example.com');
  assert.equal(leaked.length, 0, 'no email when the user turned it off: ' + leaked.map(x => x.subject).join(' / ') + ' | ticket ' + t.key);
  assert.ok((await agent.get('/api/notifications')).body.items.some(i => i.ticketId === t.id), 'in-app still delivered');
  await agent.put('/api/me/prefs', { email: true });
  const r = await admin.post('/api/mail/test');
  assert.equal(r.status, 200); assert.equal(r.body.to, ADMIN.email);
  assert.ok(await waitFor(() => mails.find(x => x.to === ADMIN.email && /test email/.test(x.subject))));
});

test('notifications: SLA breaches escalate to admins once; urgent unassigned tickets alert admins', async () => {
  const items = await waitFor(async () => { const j = (await admin.get('/api/notifications')).body; return j.items.some(i => i.type === 'sla_breach') && j.items; });
  assert.ok(items, 'admin got SLA breach notifications for overdue demo tickets');
  const count = items.filter(i => i.type === 'sla_breach').length;
  await sleep(1500);
  assert.equal((await admin.get('/api/notifications')).body.items.filter(i => i.type === 'sla_breach').length, count, 'no duplicate SLA notifications');
  await admin.put('/api/settings', { settings: { autoAssign: false } });
  const c = await agent.post('/api/tickets', { title: 'Core switch down — whole building', type: 'incident', categoryId: 'c4', impact: 1, urgency: 1, requester: { name: 'Ops' } });
  assert.equal(c.body.ticket.assigneeId, null);
  assert.ok(await waitFor(async () => (await admin.get('/api/notifications')).body.items.some(i => i.type === 'urgent' && i.ticketId === c.body.ticket.id)));
  await admin.put('/api/settings', { settings: { autoAssign: true } });
});

test('language preference is stored per user on the server and used for their emails', async () => {
  assert.equal((await agent.put('/api/me/prefs', { lang: 'en' })).body.prefs.lang, 'en');
  assert.equal((await agent.get('/api/bootstrap')).body.me.prefs.lang, 'en');
  const t = (await admin.get('/api/bootstrap')).body.state.tickets.find(x => x.assigneeId !== 'a1' && (x.status === 'progress' || x.status === 'new'));
  mails.length = 0;
  await admin.post(`/api/tickets/${t.id}/ops`, { ops: [{ op: 'set', key: 'assigneeId', value: 'a1' }] });
  const m = await waitFor(() => mails.find(x => x.to === 'ahmed.samir@example.com' && x.subject.includes(t.key)));
  assert.match(m.subject, /Ticket assigned to you/); assert.doesNotMatch(m.subject, /مسندة/, 'English only for an English user');
  assert.match(m.body, /^Ticket assigned to you/);
  assert.equal((await agent.put('/api/me/prefs', { lang: null })).body.prefs.lang, null);
});

test('business hours: validated, saved and audited', async () => {
  assert.equal((await admin.put('/api/settings', { settings: { calendar: { mode: 'business', tz: 'Mars/Base' } } })).body.error, 'bad_tz');
  assert.equal((await admin.put('/api/settings', { settings: { calendar: { mode: 'business', tz: 'Africa/Cairo', days: {} } } })).body.error, 'no_workdays');
  const cal = { mode: 'business', tz: 'Asia/Riyadh', days: { 0: [480, 960], 1: [480, 960], 2: [480, 960], 3: [480, 960], 4: [480, 960] }, holidays: [{ date: '2026-12-01', name: 'Test' }] };
  const r = await admin.put('/api/settings', { settings: { calendar: cal } });
  assert.equal(r.status, 200); assert.equal(r.body.settings.calendar.tz, 'Asia/Riyadh'); assert.equal(r.body.settings.calendar.days[5], null);
  assert.equal((await agent.get('/api/bootstrap')).body.state.settings.calendar.mode, 'business');
  const a = (await admin.get('/api/audit?action=settings.')).body.rows[0];
  assert.equal(a.action, 'settings.update'); assert.ok(a.detail.calendar, 'calendar change in the audit diff');
  await admin.put('/api/settings', { settings: { calendar: { mode: '24x7', tz: 'Africa/Cairo' } } });
});

test('requesters: tickets link to saved requesters, edits sync, duplicates can be merged', async () => {
  const mk = (title, email, name) => agent.post('/api/tickets', { title, type: 'request', categoryId: 'c1', impact: 3, urgency: 3, requester: { name: name || 'Sara Test', email } });
  const t1 = (await mk('Need a new keyboard', 'sara.test@company.com')).body.ticket;
  const t2 = (await mk('Monitor flickers', 'SARA.TEST@company.com', 'Sara T')).body.ticket;
  assert.ok(t1.requesterId); assert.equal(t2.requesterId, t1.requesterId, 'matched by email, case-insensitive');
  let r = await agent.put('/api/c/requesters/' + t1.requesterId, { name: 'Sara Ibrahim', email: 'sara.test@company.com', dept: 'Finance' });
  assert.equal(r.status, 200);
  let st = (await agent.get('/api/bootstrap')).body.state;
  assert.equal(st.tickets.find(x => x.id === t2.id).requester.name, 'Sara Ibrahim', 'ticket copy synced');
  const dup = (await mk('Mouse not working', 'sara.personal@gmail.com', 'Sara I.')).body.ticket;
  assert.notEqual(dup.requesterId, t1.requesterId);
  assert.equal((await agent.post(`/api/requesters/${t1.requesterId}/merge`, { from: dup.requesterId })).status, 403, 'merge is admin-only');
  r = await admin.post(`/api/requesters/${t1.requesterId}/merge`, { from: dup.requesterId });
  assert.equal(r.body.moved, 1);
  st = (await agent.get('/api/bootstrap')).body.state;
  assert.ok(!st.requesters.some(x => x.id === dup.requesterId));
  assert.equal(st.tickets.filter(x => x.requesterId === t1.requesterId).length, 3);
  assert.equal((await admin.del('/api/c/requesters/' + t1.requesterId)).body.error, 'in_use');
  assert.ok((await admin.get('/api/audit?action=requester.')).body.rows.some(x => x.action === 'requester.merge'));
});

test('audit log: records admin and security actions, is admin-only, hash-chained and tamper-evident', async () => {
  const rows = (await admin.get('/api/audit?limit=500')).body.rows; const acts = new Set(rows.map(r => r.action));
  for (const a of ['auth.setup', 'auth.login', 'auth.login_failed', 'agent.access', 'settings.update', 'ticket.delete', 'trash.restore', 'trash.purge', 'backup.manual', 'data.export', 'data.import', 'mail.test'])
    assert.ok(acts.has(a), 'missing audit action ' + a);
  assert.ok(rows.find(r => r.action === 'auth.login_failed').ip, 'IP recorded');
  assert.equal((await agent.get('/api/audit')).status, 403);
  assert.equal((await admin.get('/api/audit/verify')).body.ok, true);
  const { DatabaseSync } = require('node:sqlite');
  const d = new DatabaseSync(path.join(dataDir, 'servicedesk.db'));
  const row = d.prepare('SELECT seq, target FROM audit ORDER BY seq LIMIT 1 OFFSET 2').get();
  d.prepare('UPDATE audit SET target=? WHERE seq=?').run('tampered', row.seq);
  const v = (await admin.get('/api/audit/verify')).body;
  assert.equal(v.ok, false); assert.equal(v.brokenAt, row.seq);
  d.prepare('UPDATE audit SET target=? WHERE seq=?').run(row.target, row.seq); d.close();
  assert.equal((await admin.get('/api/audit/verify')).body.ok, true, 'restored row verifies again');
  const csv = await fetch(BASE + '/api/audit/export', { headers: { cookie: admin.cookie() } });
  assert.equal(csv.status, 200); assert.match(csv.headers.get('content-type'), /text\/csv/);
  assert.match(await csv.text(), /auth\.setup/);
});

test('portal: off by default; domain allow-list; submit, track, reply, attach, rate; internal notes stay hidden', async () => {
  const pc = client();
  assert.equal((await pc.get('/api/portal/config')).body.enabled, false);
  assert.equal((await pc.post('/api/portal/tickets', { name: 'X', email: 'x@company.com', title: 'Printer jam again', categoryId: 'c5' })).body.error, 'portal_off');
  await admin.put('/api/settings', { settings: { portal: { enabled: true, allowedDomains: 'company.com' } } });
  const cfg = (await pc.get('/api/portal/config')).body;
  assert.equal(cfg.enabled, true); assert.deepEqual(cfg.domains, ['company.com']); assert.ok(cfg.categories.length);
  const base = { name: 'Hany Fawzy', email: 'hany@company.com', dept: 'Sales', title: 'Outlook keeps asking for password', categoryId: 'c3', type: 'incident', impact: 3, urgency: 2, desc: 'Since this morning' };
  assert.equal((await pc.post('/api/portal/tickets', Object.assign({}, base, { email: 'hany@gmail.com' }))).body.error, 'domain_not_allowed');
  assert.equal((await pc.post('/api/portal/tickets', Object.assign({}, base, { website: 'spam' }))).status, 400, 'honeypot');
  mails.length = 0;
  const sub = await pc.post('/api/portal/tickets', base);
  assert.equal(sub.status, 200); assert.ok(sub.body.token.length >= 32); assert.match(sub.body.url, /^https:\/\/helpdesk\.test\/portal\?t=/);
  const conf = await waitFor(() => mails.find(m => m.to === 'hany@company.com'));
  assert.match(conf.subject, /تم استلام طلبك/); assert.ok(conf.body.includes(sub.body.token), 'confirmation has tracking link');
  const tok = sub.body.token; let v = (await pc.get('/api/portal/t/' + tok)).body.ticket;
  assert.equal(v.status, 'new'); assert.equal(v.requester.email, 'hany@company.com');
  assert.equal((await pc.get('/api/portal/t/not-a-real-token-1234567890')).status, 404);
  const st = (await admin.get('/api/bootstrap')).body.state; const x = st.tickets.find(t => t.key === sub.body.key);
  assert.equal(x.source, 'portal'); assert.ok(x.requesterId); assert.ok(x.tags.includes('portal'));
  assert.equal(x.activity[0].by, 'requester');
  mails.length = 0;
  await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'comment', kind: 'internal', body: 'SECRET internal note' }, { op: 'comment', kind: 'reply', body: 'Please restart Outlook' }, { op: 'set', key: 'status', value: 'pending' }] });
  v = (await pc.get('/api/portal/t/' + tok)).body.ticket;
  assert.ok(v.comments.some(c => c.body === 'Please restart Outlook' && !c.mine));
  assert.ok(!JSON.stringify(v).includes('SECRET'), 'internal notes never reach the portal');
  assert.equal(v.status, 'pending');
  assert.ok(await waitFor(() => mails.find(m => m.to === 'hany@company.com' && /رد جديد على طلبك/.test(m.subject) && m.body.includes('Please restart Outlook'))));
  v = (await pc.post(`/api/portal/t/${tok}/reply`, { body: 'Restarted, still asking' })).body.ticket;
  assert.equal(v.status, 'progress', 'requester reply resumes a pending ticket');
  const up = await fetch(`${BASE}/api/portal/t/${tok}/attachments`, { method: 'POST', headers: { 'x-itset': '1', 'content-type': 'application/octet-stream', 'x-filename': encodeURIComponent('error.png') }, body: PNG });
  assert.equal(up.status, 200); const pv = (await up.json()).ticket; assert.equal(pv.attachments.length, 1);
  await upload(admin, x.id, 'internal-diagram.png', PNG);
  v = (await pc.get('/api/portal/t/' + tok)).body.ticket;
  assert.deepEqual(v.attachments.map(a => a.name), ['error.png'], 'agent attachments are not shown on the portal');
  const dl = await fetch(`${BASE}/api/portal/t/${tok}/attachments/${v.attachments[0].id}`); assert.equal(dl.status, 200);
  assert.equal((await pc.post(`/api/portal/t/${tok}/csat`, { v: 5 })).body.error, 'csat_open');
  mails.length = 0;
  await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'set', key: 'status', value: 'resolved' }] });
  assert.ok(await waitFor(() => mails.find(m => m.to === 'hany@company.com' && /تم حل طلبك/.test(m.subject))));
  v = (await pc.post(`/api/portal/t/${tok}/csat`, { v: 5 })).body.ticket; assert.equal(v.csat, 5);
  await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'set', key: 'status', value: 'closed' }] });
  assert.equal((await pc.post(`/api/portal/t/${tok}/reply`, { body: 'one more thing' })).body.error, 'ticket_closed');
  // English submission → English emails
  mails.length = 0;
  await pc.post('/api/portal/tickets', Object.assign({}, base, { title: 'VPN drops every hour', lang: 'en' }));
  const en = await waitFor(() => mails.find(m => m.to === 'hany@company.com'));
  assert.match(en.subject, /We received your request/); assert.doesNotMatch(en.subject, /استلام/);
});

test('portal: email-code sign-in shows only the signed-in person\'s requests; codes are rate limited', async () => {
  const pc = client();
  await pc.post('/api/portal/tickets', { name: 'Other Person', email: 'other@company.com', title: 'Other person request', categoryId: 'c1' });
  mails.length = 0;
  assert.equal((await pc.post('/api/portal/otp', { email: 'hany@company.com', lang: 'en' })).status, 200);
  const m = await waitFor(() => mails.find(x => x.to === 'hany@company.com' && /code/.test(x.subject)));
  const code = (/(\d{6})/.exec(m.subject) || [])[1]; assert.ok(code);
  assert.equal((await pc.post('/api/portal/login', { email: 'hany@company.com', code: code === '000000' ? '111111' : '000000' })).body.error, 'bad_code');
  assert.equal((await pc.get('/api/portal/mine')).status, 401);
  const r = await pc.post('/api/portal/login', { email: 'hany@company.com', code });
  assert.equal(r.status, 200); assert.match(r.headers.get('set-cookie'), /itset_psid=.*HttpOnly/);
  const mine = (await pc.get('/api/portal/mine')).body;
  assert.ok(mine.tickets.length >= 2); assert.ok(mine.tickets.every(t => t.title !== 'Other person request'), 'never shows other people\'s tickets');
  assert.equal((await pc.post('/api/portal/login', { email: 'hany@company.com', code })).body.error, 'bad_code', 'codes are single-use');
  const x = client();
  await x.post('/api/portal/otp', { email: 'spam@company.com' }); await x.post('/api/portal/otp', { email: 'spam@company.com' });
  assert.equal((await x.post('/api/portal/otp', { email: 'spam@company.com' })).status, 200);
  assert.equal((await x.post('/api/portal/otp', { email: 'spam@company.com' })).status, 429, 'max 3 codes per email per 15 minutes');
  assert.ok((await admin.get('/api/audit?action=portal.')).body.rows.some(r => r.action === 'portal.login'));
});

test('assets & preventive maintenance: admin-only plans, run now, audit trail, no duplicates', async () => {
  const st = (await admin.get('/api/bootstrap')).body.state;
  const catId = st.categories[0].id;
  let r = await agent.put('/api/c/assets/pmA1', { tag: 'UPS-PM-TEST', name: 'APC Smart-UPS 1500', type: 'UPS', status: 'active', serial: 'AS1234', warrantyEnd: '2027-01-01', history: [{ at: 1, by: 'evil', k: 'fake' }] });
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.deepEqual(r.body.item.history.map(h => h.k), ['created'], 'client cannot write history');
  r = await agent.put('/api/c/assets/pmA1', Object.assign({}, r.body.item, { status: 'repair' }));
  assert.deepEqual(r.body.item.history.map(h => h.k), ['created', 'status']);
  const plan = { title: 'UPS battery test', everyDays: 180, nextDue: '2099-01-01', assetIds: ['pmA1'], categoryId: catId, checklist: ['Run self-test', 'Check battery date'] };
  assert.equal((await agent.put('/api/c/plans/pmP1', plan)).status, 403, 'agents cannot edit plans');
  r = await admin.put('/api/c/plans/pmP1', plan); assert.equal(r.status, 200);
  assert.equal((await agent.post('/api/plans/pmP1/run')).status, 403);
  r = await admin.post('/api/plans/pmP1/run'); assert.equal(r.status, 200); assert.equal(r.body.created.length, 1);
  const again = await admin.post('/api/plans/pmP1/run'); assert.equal(again.body.created.length, 0); assert.equal(again.body.skipped, 1);
  const st2 = (await admin.get('/api/bootstrap')).body.state;
  const t = st2.tickets.find(x => x.planId === 'pmP1'); assert.ok(t); assert.equal(t.assetId, 'pmA1'); assert.equal(t.checklist.length, 2);
  assert.ok(st2.plans.find(p => p.id === 'pmP1').nextDue < '2099-01-01', 'running early restarts the cycle from today');
  assert.equal((await admin.del('/api/c/assets/pmA1')).status, 409, 'assets with tickets or plans cannot be deleted');
  const rows = (await admin.get('/api/audit')).body.rows;
  assert.ok(rows.some(x => x.action === 'asset.update' && x.target === 'UPS-PM-TEST'));
  assert.ok(rows.some(x => x.action === 'plan.create'));
  assert.ok(rows.filter(x => x.action === 'maintenance.run').length >= 2);
});

test('API tokens: scoped, shown once, hashed, blocked from sensitive routes, revocable', async () => {
  const tk = async (method, url, token, body) => { const r = await fetch(BASE + url, { method, headers: Object.assign({ authorization: 'Bearer ' + token }, body ? { 'content-type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined }); let j = null; try { j = await r.json(); } catch (_) {} return { status: r.status, body: j }; };
  let r = await agent.post('/api/me/tokens', { name: 'MCP read', scope: 'read', days: 30 });
  assert.equal(r.status, 200); const ro = r.body.token; assert.match(ro, /^itsd_[A-Za-z0-9_-]{43}$/);
  assert.ok(!JSON.stringify((await agent.get('/api/me/tokens')).body).includes(ro), 'the token is never shown again');
  const boot = await tk('GET', '/api/bootstrap', ro); assert.equal(boot.status, 200); assert.equal(boot.body.me.id, (await agent.get('/api/bootstrap')).body.me.id);
  const cat = boot.body.state.categories[0].id;
  assert.equal((await tk('POST', '/api/tickets', ro, { title: 'From a read token', type: 'request', categoryId: cat, impact: 3, urgency: 3, requester: { name: 'Bot' } })).body.error, 'token_read_only');
  r = await agent.post('/api/me/tokens', { name: 'MCP write', scope: 'write', days: 7 }); const rw = r.body.token;
  const made = await tk('POST', '/api/tickets', rw, { title: 'Created through a token', type: 'request', categoryId: cat, impact: 3, urgency: 3, requester: { name: 'Bot' } });
  assert.equal(made.status, 200, 'bearer requests need no CSRF header'); assert.ok(made.body.ticket.key);
  for (const u of ['/api/export', '/api/me/tokens', '/api/backups']) assert.equal((await tk('GET', u, rw)).body.error, 'token_forbidden', u);
  assert.equal((await tk('POST', '/api/me/password', rw, { current: 'x', password: 'yyyyyyyyy' })).body.error, 'token_forbidden');
  assert.equal((await tk('GET', '/api/bootstrap', 'itsd_' + 'A'.repeat(43))).body.error, 'bad_token');
  assert.equal((await tk('GET', '/api/bootstrap', 'not-a-token')).status, 401);
  const list = (await agent.get('/api/me/tokens')).body.tokens; assert.equal(list.length, 2); assert.ok(list.find(x => x.name === 'MCP read').lastUsed);
  assert.equal((await agent.del('/api/me/tokens/' + list.find(x => x.name === 'MCP read').id)).status, 200);
  assert.equal((await tk('GET', '/api/bootstrap', ro)).status, 401, 'revoked tokens stop working');
  assert.equal((await agent.post('/api/me/tokens', { name: 'x', scope: 'read' })).status, 400, 'names need 2+ characters');
  assert.ok((await admin.get('/api/tokens')).body.tokens.some(x => x.name === 'MCP write'), 'admins see every token');
  assert.equal((await agent.get('/api/tokens')).status, 403);
  const rows = (await admin.get('/api/audit')).body.rows;
  assert.ok(rows.some(x => x.action === 'token.create')); assert.ok(rows.some(x => x.action === 'token.revoke'));
});

test('data survives a restart, and the startup integrity check passes', async () => {
  const st = (await admin.get('/api/bootstrap')).body.state; const before = st.tickets.length;
  // remove a live attachment file: the server must heal it from the backup store on start
  const att = st.tickets.flatMap(t => t.attachments || [])[0];
  await admin.post('/api/backups');
  fs.unlinkSync(path.join(dataDir, 'attachments', att.hash.slice(0, 2), att.hash));
  await stopServer(); logBuf = ''; await startServer();
  assert.match(logBuf, /attachments restored from backup store: 1/);
  assert.ok(fs.existsSync(path.join(dataDir, 'attachments', att.hash.slice(0, 2), att.hash)));
  assert.doesNotMatch(logBuf, /INTEGRITY CHECK FAILED/);
  const c = client(); await c.post('/api/login', ADMIN);
  assert.equal((await c.get('/api/bootstrap')).body.state.tickets.length, before);
});

/* ---- regression tests for DESK-BUG-001, DESK-BUG-002, DESK-GAP-001 (branch claude/desk-fixes-sla-csat-custody) ---- */
test('DESK-BUG-001: first response is set only by an agent public reply', async () => {
  const st = (await admin.get('/api/bootstrap')).body.state; const catId = st.categories[0].id;
  const x = (await admin.post('/api/tickets', { title: 'First response rule check', type: 'incident', categoryId: catId, impact: 3, urgency: 3, requester: { name: 'Rule Check' } })).body.ticket;
  let t = (await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'set', key: 'status', value: 'progress' }] })).body.tickets[0];
  assert.equal(t.firstResponseAt, null, 'status change is not a response');
  t = (await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'comment', kind: 'internal', body: 'internal only' }] })).body.tickets[0];
  assert.equal(t.firstResponseAt, null, 'internal note is not a response');
  t = (await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'comment', kind: 'requester', body: 'logged on behalf of requester' }] })).body.tickets[0];
  assert.equal(t.firstResponseAt, null, 'requester message is not a response');
  t = (await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'comment', kind: 'reply', body: 'public reply' }] })).body.tickets[0];
  assert.ok(t.firstResponseAt, 'public reply by an agent sets first response');
});

test('DESK-BUG-002: portal CSAT is accepted once; a second rating is rejected and the first is kept', async () => {
  await admin.put('/api/settings', { settings: { portal: { enabled: true, allowedDomains: [] } } });
  const pc = client();
  const r = await pc.post('/api/portal/tickets', { name: 'Rating Person', email: 'rating@company.com', title: 'Rate me once please', categoryId: (await admin.get('/api/bootstrap')).body.state.categories[0].id });
  const tok = r.body.token; const st = (await admin.get('/api/bootstrap')).body.state; const x = st.tickets.find(t => t.portalToken === tok);
  await admin.post(`/api/tickets/${x.id}/ops`, { ops: [{ op: 'set', key: 'status', value: 'resolved' }] });
  assert.equal((await pc.post(`/api/portal/t/${tok}/csat`, { v: 4 })).body.ticket.csat, 4);
  const again = await pc.post(`/api/portal/t/${tok}/csat`, { v: 1 });
  assert.equal(again.status, 409); assert.equal(again.body.error, 'csat_done');
  assert.equal((await pc.get('/api/portal/t/' + tok)).body.ticket.csat, 4, 'original rating unchanged');
});

test('DESK-GAP-001: portal "my devices" shows only assets in the signed-in employee\'s custody', async () => {
  await admin.put('/api/settings', { settings: { portal: { enabled: true, allowedDomains: [] } } });
  const mk = async (id, name, email) => (await admin.put('/api/c/requesters/' + id, { name, email, dept: 'Test' })).body.item;
  const a = await mk('rqowner1', 'Owner One', 'owner1@company.com'), b = await mk('rqowner2', 'Owner Two', 'owner2@company.com');
  const asset = async (id, tag, requesterId, status) => (await admin.put('/api/c/assets/' + id, { tag, name: 'Test ' + tag, type: 'Laptop', status, requesterId, criticality: 'medium' })).body.item;
  await asset('ast-own-1', 'TST-001', a.id, 'active'); await asset('ast-own-2', 'TST-002', b.id, 'active'); await asset('ast-own-3', 'TST-003', a.id, 'retired');
  const anonP = client(); assert.equal((await anonP.get('/api/portal/assets')).status, 401, 'needs a portal session');
  const pc = client(); mails.length = 0;
  await pc.post('/api/portal/otp', { email: 'owner1@company.com', lang: 'en' });
  const m = await waitFor(() => mails.find(x => x.to === 'owner1@company.com' && /code/.test(x.subject)));
  const code = (/(\d{6})/.exec(m.subject) || [])[1];
  assert.equal((await pc.post('/api/portal/login', { email: 'owner1@company.com', code })).status, 200);
  const r = await pc.get('/api/portal/assets');
  assert.equal(r.status, 200); assert.deepEqual(r.body.assets.map(x => x.tag), ['TST-001'], 'own active asset only (not other owner, not retired)');
  assert.deepEqual(Object.keys(r.body.assets[0]).sort(), ['location', 'name', 'serial', 'since', 'status', 'tag', 'type'], 'no internal fields');
  assert.equal((await pc.get('/api/portal/assets?requesterId=' + b.id)).body.assets.length, 1, 'client-supplied ids are ignored');
  await admin.put('/api/settings', { settings: { portal: { enabled: false, allowedDomains: [] } } });
  assert.equal((await pc.get('/api/portal/assets')).status, 404, 'off when the portal is off');
});
