'use strict';
/* Unit tests for the shared business logic (public/core.js). Run: node --test tests/core.test.js */
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/core.js');

const MIN = 60000, HR = 60 * MIN;
const BIZ = C.cleanCalendar({ mode: 'business', tz: 'Africa/Cairo', days: { 0: [540, 1020], 1: [540, 1020], 2: [540, 1020], 3: [540, 1020], 4: [540, 1020], 5: null, 6: null }, holidays: [{ date: '2026-10-25', name: 'Test holiday' }] });
const cairo = (y, m, d, h, mi = 0) => C.localToUtc(y, m, d, h * 60 + mi, 'Africa/Cairo');
const fmt = ts => { const w = C.wall(ts, 'Africa/Cairo'); return `${w.y}-${String(w.m).padStart(2, '0')}-${String(w.d).padStart(2, '0')} ${String(w.h).padStart(2, '0')}:${String(w.mi).padStart(2, '0')}`; };

test('24x7 mode is plain arithmetic (backward compatible)', () => {
  const cal = C.cleanCalendar({ mode: '24x7' });
  assert.equal(C.businessAdd(cal, 1000, 5 * HR), 1000 + 5 * HR);
  assert.equal(C.businessBetween(cal, 0, 7 * HR), 7 * HR);
  assert.equal(C.businessAdd(null, 1000, 60), 1060, 'missing calendar = 24x7');
});

test('Thursday 16:00 + 2 working hours skips the Fri/Sat weekend and a Sunday holiday', () => {
  // 2026-10-22 is a Thursday
  const due = C.businessAdd(BIZ, cairo(2026, 10, 22, 16), 2 * HR);
  // Sunday 2026-10-25 is a holiday in BIZ → next working day is Monday 10:00
  assert.equal(fmt(due), '2026-10-26 10:00');
});

test('created outside working hours starts counting at the next opening', () => {
  assert.equal(fmt(C.businessAdd(BIZ, cairo(2026, 10, 20, 22), 30 * MIN)), '2026-10-21 09:30'); // Tue 22:00 → Wed 09:30
  assert.equal(fmt(C.businessAdd(BIZ, cairo(2026, 10, 21, 7), 4 * HR)), '2026-10-21 13:00');   // Wed 07:00 → 13:00
});

test('businessBetween counts only working time', () => {
  assert.equal(C.businessBetween(BIZ, cairo(2026, 10, 22, 16), cairo(2026, 10, 26, 10)), 2 * HR); // Thu 16:00 → Mon 10:00 (weekend + holiday)
  assert.equal(C.businessBetween(BIZ, cairo(2026, 10, 21, 18), cairo(2026, 10, 22, 8)), 0);         // overnight
});

test('add and between are inverse for many random starts and durations', () => {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 300; i++) {
    const start = cairo(2026, 1, 1, 0) + Math.floor(rnd() * 330 * 24 * HR);
    const ms = Math.floor(rnd() * 40 * HR / MIN) * MIN;
    const due = C.businessAdd(BIZ, start, ms);
    assert.equal(C.businessBetween(BIZ, start, due), ms, `start ${fmt(start)} + ${ms / MIN}m`);
  }
});

test('works across the Egypt DST change (last Friday of April 2026)', () => {
  // Thursday 2026-04-23 16:00 + 2h: Fri 24 (DST starts) & Sat are off → Sunday 26 10:00 local
  assert.equal(fmt(C.businessAdd(BIZ, cairo(2026, 4, 23, 16), 2 * HR)), '2026-04-26 10:00');
});

test('SLA uses the calendar: due date, risk based on remaining working time, pause counts working time only', () => {
  const S = { settings: { calendar: BIZ }, sla: { P3: { resp: 60, res: 8 * 60 } }, tickets: [] };
  const created = cairo(2026, 10, 21, 9);                    // Wed 09:00, P3 = 8 working hours → Wed 17:00
  const x = { priority: 3, status: 'progress', createdAt: created, pausedMs: 0, activity: [] };
  assert.equal(fmt(C.resDue(S, x, created)), '2026-10-21 17:00');
  assert.equal(C.sla(S, x, cairo(2026, 10, 21, 12)).st, 'ok');
  assert.equal(C.sla(S, x, cairo(2026, 10, 21, 15, 30)).st, 'risk');   // 1.5h of 8h left (< 25%)
  // pending Wed 16:00 → Mon 10:00 = Wed 16-17 (1h) + Thu 09-17 (8h) + Fri/Sat off + Sun holiday + Mon 09-10 (1h) = 10h
  C.setStatus(x, 'pending', 'a', cairo(2026, 10, 21, 16), BIZ);
  C.setStatus(x, 'progress', 'a', cairo(2026, 10, 26, 10), BIZ);
  assert.equal(x.pausedMs, 10 * HR);
  // 8h target + 10h paused = 18 working hours from Wed 09:00 → Wed 8h + Thu 8h + Mon 2h → Mon 11:00
  assert.equal(fmt(C.resDue(S, x, cairo(2026, 10, 26, 10))), '2026-10-26 11:00');
});

test('calendar validation rejects bad input', () => {
  assert.throws(() => C.cleanCalendar({ mode: 'business', tz: 'Mars/Olympus' }), /bad_tz/);
  assert.throws(() => C.cleanCalendar({ mode: 'business', days: { 0: [600, 500] } }), /bad_hours/);
  assert.throws(() => C.cleanCalendar({ mode: 'business', days: {} }), /no_workdays/);
  const c = C.cleanCalendar({ mode: 'business', days: { 1: [540, 1020] }, holidays: [{ date: '2026-12-25', name: 'x' }, { date: '2026-12-25', name: 'dup' }, { date: 'bad' }] });
  assert.equal(c.holidays.length, 1);
});

test('requesters: migration groups by email, resolve links existing and creates new', () => {
  const S = C.seed(Date.now());
  assert.ok(S.requesters.length > 5 && S.requesters.length < S.tickets.length, 'grouped into fewer requesters than tickets');
  assert.ok(S.tickets.every(t => t.requesterId && t.portalToken), 'every ticket linked and has a portal token');
  const rashad = S.requesters.find(r => r.email === 'm.rashad@example.com');
  assert.equal(S.tickets.filter(t => t.requesterId === rashad.id).length, 3);
  const d1 = { requester: { name: 'Mahmoud', email: 'M.Rashad@example.com' } };
  assert.equal(C.linkRequester(S, d1, Date.now()), null, 'existing requester matched by email (case-insensitive)');
  assert.equal(d1.requesterId, rashad.id);
  const d2 = { requester: { name: 'New Person', email: 'new@example.com', dept: 'Ops' } };
  const created = C.linkRequester(S, d2, Date.now());
  assert.ok(created && created.dept === 'Ops' && S.requesters.includes(created));
  const again = C.migrateRequesters(S, Date.now());
  assert.equal(again.created.length + again.touched.length, 0, 'migration is idempotent');
});

test('portal tokens are long and unique', () => {
  const set = new Set(Array.from({ length: 500 }, () => C.token()));
  assert.equal(set.size, 500);
  for (const t of set) assert.match(t, /^[A-Za-z0-9_-]{32}$/);
});

test('English setup: default and demo data contain no Arabic; Arabic setup unchanged', () => {
  const AR = /[؀-ۿ]/; const found = [];
  const walk = (o, p) => { if (typeof o === 'string') { if (AR.test(o)) found.push(p); } else if (o && typeof o === 'object') for (const k in o) walk(o[k], p + '.' + k); };
  walk(C.defaults('en'), 'defaults'); walk(C.seed(Date.now(), 'en'), 'seed');
  assert.deepEqual(found, [], 'Arabic text in English data');
  const ar = C.seed(Date.now(), 'ar');
  assert.match(ar.tickets[0].title, /[؀-ۿ]/);
  assert.equal(C.seed(Date.now(), 'en').tickets.length, ar.tickets.length, 'same demo set in both languages');
});

test('every UI string in app.js and portal.js has both an Arabic and an English text', () => {
  const fs = require('node:fs'), path = require('node:path');
  for (const f of ['app.js', 'portal.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'public', f), 'utf8');
    const pairs = [...src.matchAll(/\b([a-zA-Z_0-9]+):\s*\[(['"])((?:\\.|(?!\2).)*)\2,\s*(['"])((?:\\.|(?!\4).)*)\4\]/g)];
    assert.ok(pairs.length > 50, f + ': dictionary found');
    const bad = pairs.filter(m => !m[3].trim() || !m[5].trim()).map(m => m[1]);
    assert.deepEqual(bad, [], f + ': empty translations');
    const enHasArabic = pairs.filter(m => /[؀-ۿ]/.test(m[5]) && !['langToggle'].includes(m[1])).map(m => m[1]);
    assert.deepEqual(enHasArabic, [], f + ': Arabic inside the English text');
  }
});

test('built-in texts of an Arabic install display in English (and back) without touching ids or user text', () => {
  const s = C.seed(Date.now(), 'ar');
  const ids = s.tickets.map(t => t.id + t.key + t.requesterId + t.portalToken).join();
  s.tickets[0].comments.push({ id: 'u1', by: 'a1', kind: 'reply', body: 'نص كتبه المستخدم بنفسه', at: 1 });
  C.localize(s, 'en');
  const AR = /[؀-ۿ]/; const left = [];
  const walk = (o, p) => { if (typeof o === 'string') { if (AR.test(o)) left.push(p); } else if (o && typeof o === 'object') for (const k in o) walk(o[k], p + '.' + k); };
  walk(s, '');
  assert.deepEqual(left, ['.tickets.0.comments.2.body'], 'only the text the user typed stays Arabic');
  assert.equal(s.tickets.map(t => t.id + t.key + t.requesterId + t.portalToken).join(), ids, 'ids, keys and tokens untouched');
  assert.equal(s.agents[0].name, 'Ahmed Samir'); assert.equal(s.categories[1].name, 'Software');
  C.localize(s, 'ar');
  assert.equal(s.categories[1].name, 'Software — برامج'); assert.equal(s.agents[0].name, 'أحمد سمير');
  assert.equal(C.demoText('Something a user wrote', 'en'), 'Something a user wrote');
});

/* ---------- v3.2: IT asset lifecycle & preventive maintenance ---------- */
const NOW = Date.parse('2026-10-24T10:00:00Z');
function pmState() {
  const s = C.defaults('en'); s.settings.autoAssign = false; s.requesters = [];
  s.agents = [{ id: 'g1', name: 'Agent', email: 'g1@x.io', team: 't1', active: true }];
  const mk = (id, tag, type, status) => C.cleanEntity(s, 'assets', { id, tag, name: tag + ' model', type, status }, { by: 'g1', now: NOW });
  s.assets = [mk('pa1', 'PRN-1', 'Printer', 'active')]; s.assets.push(mk('pa2', 'PRN-2', 'Printer', 'repair'), mk('pa3', 'PRN-3', 'Printer', 'retired'), mk('pa4', 'FW-1', 'Firewall', 'active'));
  return s;
}
test('assets: lifecycle history is written by the server side, never taken from the client', () => {
  const s = pmState();
  assert.deepEqual(s.assets[0].history.map(h => h.k), ['created']);
  const forged = C.cleanEntity(s, 'assets', Object.assign({}, s.assets[0], { status: 'repair', location: 'Floor 3', history: [{ at: 1, by: 'x', k: 'created' }, { at: 2, by: 'x', k: 'fake' }] }), { by: 'g1', now: NOW + 1000 });
  assert.deepEqual(forged.history.map(h => h.k), ['created', 'status', 'location']);
  assert.equal(forged.history[1].f, 'active'); assert.equal(forged.history[1].v, 'repair');
  assert.equal(forged.createdAt, NOW, 'createdAt is kept from the stored record');
  const restored = C.cleanEntity(s, 'assets', forged, { trusted: true });
  assert.equal(restored.history.length, 3, 'restore/import keeps the stored history');
});
test('assets: disposal needs a method and a date; warranty dates must be in order', () => {
  const s = pmState();
  assert.throws(() => C.cleanEntity(s, 'assets', { id: 'pa1', tag: 'PRN-1', name: 'x', status: 'disposed' }, { now: NOW }), { code: 'v_disposal' });
  const d = C.cleanEntity(s, 'assets', { id: 'pa1', tag: 'PRN-1', name: 'x', status: 'disposed', disposal: { method: 'recycled', date: '2026-10-20', dataWiped: 'yes' } }, { now: NOW });
  assert.deepEqual(d.disposal, { method: 'recycled', date: '2026-10-20', dataWiped: true, note: '' });
  assert.equal(C.cleanEntity(s, 'assets', { id: 'pa1', tag: 'PRN-1', name: 'x', status: 'active', disposal: { method: 'sold', date: '2026-10-20' } }, { now: NOW }).disposal, null, 'no disposal record unless disposed');
  assert.throws(() => C.cleanEntity(s, 'assets', { id: 'pa1', tag: 'PRN-1', name: 'x', purchaseDate: '2026-05-01', warrantyEnd: '2026-01-01' }, { now: NOW }), { code: 'bad_dates' });
  assert.equal(C.cleanEntity(s, 'assets', { id: 'pa1', tag: 'PRN-1', name: 'x', purchaseDate: '2026-02-30' }, { now: NOW }).purchaseDate, '', 'impossible dates are dropped');
  assert.equal(C.warranty({ warrantyEnd: '2026-11-10' }, '2026-10-24'), 'soon');
  assert.equal(C.warranty({ warrantyEnd: '2026-10-23' }, '2026-10-24'), 'expired');
  assert.equal(C.warranty({}, '2026-10-24'), 'none');
});
test('preventive maintenance: one ticket per live asset when due, no duplicates while open, schedule moves forward', () => {
  const s = pmState();
  const plan = C.cleanEntity(s, 'plans', { id: 'pl1', title: 'Clean printers', everyDays: 90, nextDue: '2026-10-24', assetType: 'printer', categoryId: 'c5', checklist: 'Clean rollers\nTest page', assigneeId: 'g1' });
  assert.deepEqual(plan.checklist, ['Clean rollers', 'Test page']);
  s.plans = [plan];
  let r = C.runMaintenance(s, NOW);
  assert.equal(r.created.length, 2, 'active + in-repair printers; the retired one is skipped');
  assert.deepEqual(r.created.map(t => t.assetId).sort(), ['pa1', 'pa2']);
  const t0 = r.created[0];
  assert.equal(t0.planId, 'pl1'); assert.equal(t0.pmDue, '2026-10-24'); assert.equal(t0.assigneeId, 'g1'); assert.equal(t0.checklist.length, 2); assert.ok(t0.tags.includes('preventive'));
  assert.equal(s.plans[0].nextDue, '2027-01-22');
  assert.equal(C.runMaintenance(s, NOW).created.length, 0, 'not due again');
  // forced run while the first tickets are still open → skipped, not duplicated
  r = C.runMaintenance(s, NOW, { planId: 'pl1', force: true });
  assert.equal(r.created.length, 0); assert.equal(r.plans[0].lastRun.skipped, 2);
  // a plan that was missed for months catches up with ONE ticket, not one per missed cycle
  s.tickets.forEach(t => { t.status = 'closed'; });
  s.plans[0] = Object.assign({}, s.plans[0], { nextDue: '2026-01-01', everyDays: 30 });
  r = C.runMaintenance(s, NOW);
  assert.equal(r.created.length, 2); assert.ok(s.plans[0].nextDue > '2026-10-24');
});
test('preventive maintenance: lead days, paused plans and in-use protection', () => {
  const s = pmState();
  s.plans = [C.cleanEntity(s, 'plans', { id: 'pl2', title: 'Firewall review', everyDays: 30, nextDue: '2026-10-27', leadDays: 3, assetIds: ['pa4', 'nope'], type: 'change', categoryId: 'c7' }),
    C.cleanEntity(s, 'plans', { id: 'pl3', title: 'Paused plan', everyDays: 30, nextDue: '2026-10-01', assetIds: ['pa1'], categoryId: 'c1', active: false })];
  assert.deepEqual(s.plans[0].assetIds, ['pa4'], 'unknown assets are dropped');
  const r = C.runMaintenance(s, NOW);
  assert.equal(r.created.length, 1); assert.equal(r.created[0].type, 'change'); assert.equal(r.created[0].pmDue, '2026-10-27');
  assert.ok(!s.tickets.some(t => t.planId === 'pl3'), 'paused plans never run on schedule');
  assert.equal(C.inUse(s, 'assets', 'pa1'), true, 'an asset named in a plan cannot be deleted');
  assert.throws(() => C.cleanEntity(s, 'plans', { id: 'pl4', title: 'No target', everyDays: 30, nextDue: '2026-10-27', categoryId: 'c1' }), { code: 'v_target' });
  assert.throws(() => C.cleanEntity(s, 'plans', { id: 'pl4', title: 'Bad', everyDays: 0, nextDue: '2026-10-27', assetIds: ['pa1'], categoryId: 'c1' }), { code: 'v_every' });
});
test('asset service figures: MTTR and MTBF from incidents only', () => {
  const s = pmState(); const H = 3600000;
  const mk = (type, created, resolved) => ({ id: C.uid(), assetId: 'pa1', type, status: resolved ? 'resolved' : 'progress', createdAt: created, resolvedAt: resolved || null });
  s.tickets = [mk('incident', NOW - 100 * H, NOW - 96 * H), mk('incident', NOW - 50 * H, NOW - 48 * H), mk('request', NOW - 10 * H, NOW - 9 * H)];
  const st = C.assetStats(s, 'pa1', NOW);
  assert.equal(st.incidents, 2); assert.equal(st.total, 3); assert.equal(st.mttr, 3 * H); assert.equal(st.mtbf, 50 * H);
});
