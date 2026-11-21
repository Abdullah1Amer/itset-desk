/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/* IT Set Desk — shared core logic (runs in the browser and in Node.js) */
(function (root) {
  'use strict';
  const MIN = 60000, HR = 60 * MIN, DAY = 24 * HR;
  const STATUSES = ['new', 'progress', 'pending', 'resolved', 'closed'];
  const TYPES = ['incident', 'request', 'problem', 'change'];
  const KINDS = ['reply', 'internal', 'requester'];
  /* IT asset lifecycle (ITIL IT Asset Management): in stock → in use → in repair → retired → disposed */
  const ASSET_STATUSES = ['stock', 'active', 'repair', 'retired', 'disposed'];
  const ASSET_CRIT = ['low', 'medium', 'high'];
  const DISPOSAL_METHODS = ['recycled', 'sold', 'donated', 'destroyed', 'returned'];
  const PM_TYPES = ['request', 'change'];
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const MATRIX = [[1, 2, 3], [2, 3, 4], [3, 4, 4]];
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ID_RE = /^[A-Za-z0-9_-]{2,40}$/;

  function uid() {
    let r = '';
    try {
      const c = (root.crypto && root.crypto.getRandomValues) ? root.crypto : null;
      if (c) { const a = new Uint8Array(8); c.getRandomValues(a); r = Array.from(a, b => b.toString(36).padStart(2, '0')).join('').slice(0, 10); }
    } catch (e) { /* fallback below */ }
    if (!r) r = Math.random().toString(36).slice(2, 12);
    return r + Date.now().toString(36).slice(-4);
  }
  /** 192-bit random URL-safe token (portal tracking links). */
  function token() {
    const a = new Uint8Array(24); root.crypto.getRandomValues(a);
    let s = ''; for (const b of a) s += String.fromCharCode(b);
    return (typeof btoa === 'function' ? btoa(s) : Buffer.from(a).toString('base64')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  const prio = (i, u) => MATRIX[i - 1][u - 1];
  const isOpen = x => x.status !== 'resolved' && x.status !== 'closed';
  const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
  /** 'YYYY-MM-DD' if valid, else ''. */
  const dateStr = v => { const x = String(v == null ? '' : v).trim(); if (!DATE_RE.test(x)) return ''; const t = Date.parse(x + 'T00:00:00Z'); return isNaN(t) || new Date(t).toISOString().slice(0, 10) !== x ? '' : x; };
  function addDays(ds, n) { const x = new Date(Date.parse(ds + 'T00:00:00Z') + n * 86400000); return x.toISOString().slice(0, 10); }
  function daysBetween(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }

  /* ---------- business calendar ----------
   * mode '24x7' (default) or 'business'. Business mode counts SLA time only inside working hours of the
   * company's time zone, skipping weekends (days with no window) and holidays. days: JS weekday 0=Sun..6=Sat
   * → [startMinute, endMinute] in local time, or null. holidays: [{date:'YYYY-MM-DD', name}] in local dates. */
  const DEFAULT_CAL = { mode: '24x7', tz: 'Africa/Cairo', days: { 0: [540, 1020], 1: [540, 1020], 2: [540, 1020], 3: [540, 1020], 4: [540, 1020], 5: null, 6: null }, holidays: [] };
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const fmtCache = new Map();
  function tzFmt(tz) {
    let f = fmtCache.get(tz);
    if (!f) { f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short' }); fmtCache.set(tz, f); }
    return f;
  }
  function wall(ts, tz) {
    const p = {}; for (const x of tzFmt(tz).formatToParts(ts)) p[x.type] = x.value;
    return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour % 24, mi: +p.minute, s: +p.second, wd: WD[p.weekday] };
  }
  function tzOffset(ts, tz) { const w = wall(ts, tz); return Date.UTC(w.y, w.m - 1, w.d, w.h, w.mi, w.s) - Math.floor(ts / 1000) * 1000; }
  /** UTC timestamp of a local wall-clock time (minute may be 1440 = next midnight). */
  function localToUtc(y, m, d, minute, tz) {
    const guess = Date.UTC(y, m - 1, d, 0, minute);
    let t = guess - tzOffset(guess, tz);
    t = guess - tzOffset(t, tz);
    return t;
  }
  const dkey = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  function dayWindow(cal, w) {
    if ((cal.holidays || []).some(h => h.date === dkey(w.y, w.m, w.d))) return null;
    const win = cal.days && cal.days[w.wd]; if (!win) return null;
    return [localToUtc(w.y, w.m, w.d, win[0], cal.tz), localToUtc(w.y, w.m, w.d, win[1], cal.tz)];
  }
  const isBiz = cal => !!(cal && cal.mode === 'business');
  /** Timestamp reached after `ms` of working time starting at `start`. */
  function businessAdd(cal, start, ms) {
    if (!isBiz(cal)) return start + ms;
    let t = start, left = ms;
    for (let i = 0; i < 1500; i++) {
      const w = wall(t, cal.tz); const win = dayWindow(cal, w);
      if (win) { const s = Math.max(t, win[0]); if (s < win[1]) { const avail = win[1] - s; if (left <= avail) return s + left; left -= avail; } }
      t = localToUtc(w.y, w.m, w.d, 1440, cal.tz);
    }
    return t + left;
  }
  /** Working time (ms) between two timestamps. */
  function businessBetween(cal, a, b) {
    if (!(b > a)) return 0;
    if (!isBiz(cal)) return b - a;
    let t = a, sum = 0;
    for (let i = 0; i < 1500 && t < b; i++) {
      const w = wall(t, cal.tz); const win = dayWindow(cal, w);
      if (win) { const s = Math.max(t, win[0]), e = Math.min(b, win[1]); if (e > s) sum += e - s; }
      t = localToUtc(w.y, w.m, w.d, 1440, cal.tz);
    }
    return sum;
  }
  const calKeys = new WeakMap(); const dueMemo = new Map();
  function memoAdd(cal, start, ms) {
    if (!isBiz(cal)) return start + ms;
    let ck = calKeys.get(cal); if (!ck) { ck = JSON.stringify(cal); calKeys.set(cal, ck); }
    const k = ck + '|' + start + '|' + ms; let v = dueMemo.get(k);
    if (v === undefined) { if (dueMemo.size > 20000) dueMemo.clear(); v = businessAdd(cal, start, ms); dueMemo.set(k, v); }
    return v;
  }
  const calOf = S => (S && S.settings && S.settings.calendar) || null;

  /* ---------- SLA ---------- */
  function pol(S, x) { return (S.sla && S.sla['P' + x.priority]) || { resp: 60, res: 1440 }; }
  function resDue(S, x, now) {
    const cal = calOf(S); let p = x.pausedMs || 0;
    if (x.status === 'pending' && x.pausedAt) p += businessBetween(cal, x.pausedAt, now);
    return memoAdd(cal, x.createdAt, pol(S, x).res * MIN + p);
  }
  function respDue(S, x) { return memoAdd(calOf(S), x.createdAt, pol(S, x).resp * MIN); }
  function sla(S, x, now) {
    const due = resDue(S, x, now);
    if (!isOpen(x)) { const end = x.resolvedAt || x.closedAt || now; return { st: end <= due ? 'met' : 'breached', due, rem: due - end, done: true }; }
    const rem = due - now;
    if (rem < 0) return { st: 'breached', due, rem };
    if (x.status === 'pending') return { st: 'paused', due, rem };
    const remWork = isBiz(calOf(S)) ? businessBetween(calOf(S), now, due) : rem;
    return { st: remWork < pol(S, x).res * MIN * 0.25 ? 'risk' : 'ok', due, rem, remWork };
  }
  function resp(S, x, now) {
    const d = respDue(S, x);
    if (x.firstResponseAt) return { st: x.firstResponseAt <= d ? 'met' : 'breached', due: d, at: x.firstResponseAt };
    if (!isOpen(x)) { const end = x.resolvedAt || x.closedAt || now; return { st: end <= d ? 'met' : 'breached', due: d, noReply: true }; } // DESK-BUG-001: closed with no public reply
    return now > d ? { st: 'breached', due: d, rem: d - now } : { st: 'ok', due: d, rem: d - now };
  }

  /* ---------- ticket mutations ---------- */
  function logA(x, k, by, now, extra) { x.activity.push(Object.assign({ at: now, by, k }, extra || {})); x.updatedAt = now; }
  /* pausedMs holds paused WORKING time (equal to wall time in 24x7 mode). */
  function setStatus(x, to, by, now, cal) {
    const from = x.status; if (from === to) return;
    if (from === 'pending' && x.pausedAt) { x.pausedMs = (x.pausedMs || 0) + businessBetween(cal, x.pausedAt, now); x.pausedAt = null; }
    if (to === 'pending') x.pausedAt = now;
    /* DESK-BUG-001: a status change is not a response. firstResponseAt is set only by an agent's public reply (applyOp 'comment'). */
    if (to === 'resolved') { x.resolvedAt = now; x.closedAt = null; }
    if (to === 'closed') { x.closedAt = now; if (!x.resolvedAt) x.resolvedAt = now; }
    if ((to === 'new' || to === 'progress' || to === 'pending') && !isOpen(x)) { x.resolvedAt = null; x.closedAt = null; x.csat = null; }
    x.status = to; x.activity.push({ at: now, by, k: 'status', f: from, v: to }); x.updatedAt = now;
  }
  function setAssignee(x, id, by, now, k) {
    if ((x.assigneeId || null) === (id || null)) return;
    x.assigneeId = id || null;
    x.activity.push({ at: now, by, k: id ? (k || 'assign') : 'unassign', v: id || null }); x.updatedAt = now;
  }
  function openLoad(S, id) { return S.tickets.filter(x => x.assigneeId === id && isOpen(x)).length; }
  function autoPick(S, teamId) {
    const pool = S.agents.filter(a => a.active && a.team === teamId);
    if (!pool.length) return null;
    return pool.map(a => [a.id, openLoad(S, a.id)]).sort((a, b) => a[1] - b[1])[0][0];
  }

  /* ---------- validation ---------- */
  function err(code, status) { const e = new Error(code); e.code = code; e.status = status || 400; return e; }
  function cleanTicketData(S, d) {
    d = d || {};
    const out = {
      title: str(d.title, 160), type: d.type, categoryId: d.categoryId,
      impact: +d.impact, urgency: +d.urgency,
      requester: { name: str(d.requester && d.requester.name, 80), email: str(d.requester && d.requester.email, 120).toLowerCase(), dept: str(d.requester && d.requester.dept, 60) },
      requesterId: null,
      assetId: d.assetId || '', desc: str(d.desc, 5000),
      tags: (Array.isArray(d.tags) ? d.tags : String(d.tags || '').split(',')).map(s => str(s, 30).toLowerCase()).filter(Boolean).slice(0, 10)
    };
    if (out.title.length < 5) throw err('v_title');
    if (!TYPES.includes(out.type)) throw err('v_req2');
    if (!S.categories.some(c => c.id === out.categoryId)) throw err('v_cat');
    if (![1, 2, 3].includes(out.impact) || ![1, 2, 3].includes(out.urgency)) throw err('v_req2');
    const rq = d.requesterId && (S.requesters || []).find(r => r.id === d.requesterId);
    if (rq) { out.requesterId = rq.id; out.requester = { name: rq.name, email: rq.email || '', dept: rq.dept || '' }; }
    if (!out.requester.name) throw err('v_req');
    if (out.requester.email && !EMAIL_RE.test(out.requester.email)) throw err('v_email');
    if (out.assetId && !S.assets.some(a => a.id === out.assetId)) throw err('v_req2');
    out.priority = prio(out.impact, out.urgency);
    return out;
  }
  function checkAssignee(S, id) { if (id && !S.agents.some(a => a.id === id)) throw err('v_req2'); return id || null; }

  function newTicket(S, d, by, now) {
    const data = cleanTicketData(S, d);
    const c = S.categories.find(k => k.id === data.categoryId);
    const x = Object.assign({
      id: uid(), key: S.settings.prefix + '-' + (S.settings.nextNo++), status: 'new', teamId: c ? c.team : '', assigneeId: null,
      createdAt: now, updatedAt: now, firstResponseAt: null, resolvedAt: null, closedAt: null, pausedMs: 0, pausedAt: null, csat: null,
      comments: [], worklogs: [], checklist: [], links: [], attachments: [], portalToken: token(), activity: [{ at: now, by, k: 'created' }]
    }, data);
    const chosen = checkAssignee(S, d.assigneeId);
    if (chosen) setAssignee(x, chosen, by, now);
    else if (S.settings.autoAssign) { const p = autoPick(S, x.teamId); if (p) setAssignee(x, p, 'system', now, 'autoassign'); }
    return x;
  }

  /* applyOp mutates ticket x (and possibly a linked ticket). Returns the list of touched tickets. */
  function applyOp(S, x, op, by, now, isAdmin) {
    if (!op || typeof op.op !== 'string') throw err('bad_op');
    const touched = [x];
    switch (op.op) {
      case 'set': {
        const k = op.key, v = op.value;
        if (k === 'status') { if (!STATUSES.includes(v)) throw err('v_req2'); setStatus(x, v, by, now, calOf(S)); }
        else if (k === 'assigneeId') setAssignee(x, checkAssignee(S, v), by, now);
        else if (k === 'impact' || k === 'urgency') {
          const n = +v; if (![1, 2, 3].includes(n)) throw err('v_req2');
          const o = x.priority; x[k] = n; x.priority = prio(x.impact, x.urgency);
          if (o !== x.priority) logA(x, 'prio', by, now, { f: o, v: x.priority }); else logA(x, 'field', by, now, { v: k });
        } else if (k === 'type') { if (!TYPES.includes(v)) throw err('v_req2'); x.type = v; logA(x, 'field', by, now, { v: 'type' }); }
        else if (k === 'categoryId') {
          const c = S.categories.find(z => z.id === v); if (!c) throw err('v_cat');
          x.categoryId = v; x.teamId = c.team; logA(x, 'field', by, now, { v: 'category' });
        } else if (k === 'assetId') {
          if (v && !S.assets.some(a => a.id === v)) throw err('v_req2');
          x.assetId = v || ''; logA(x, 'field', by, now, { v: 'asset' });
        } else throw err('bad_op');
        break;
      }
      case 'edit': {
        const data = cleanTicketData(S, op.data);
        const oldP = x.priority;
        Object.assign(x, data);
        const c = S.categories.find(z => z.id === x.categoryId); if (c) x.teamId = c.team;
        if (op.data && 'assigneeId' in op.data) setAssignee(x, checkAssignee(S, op.data.assigneeId), by, now);
        if (oldP !== x.priority) logA(x, 'prio', by, now, { f: oldP, v: x.priority });
        logA(x, 'edit', by, now);
        break;
      }
      case 'comment': {
        const kind = op.kind, body = str(op.body, 10000);
        if (!KINDS.includes(kind) || !body) throw err('v_req2');
        x.comments.push({ id: uid(), by, kind, body, at: now });
        logA(x, kind, by, now);
        if (kind === 'reply' && !x.firstResponseAt && by !== 'requester' && by !== 'system') x.firstResponseAt = now; // DESK-BUG-001
        if (kind === 'reply' && x.status === 'new') setStatus(x, 'progress', by, now, calOf(S));
        if (kind === 'requester' && x.status === 'pending') { setStatus(x, 'progress', 'system', now, calOf(S)); logA(x, 'autoreopen', 'system', now); }
        break;
      }
      case 'work-add': {
        const m = Math.round(+op.min);
        if (!(m > 0 && m <= 1440)) throw err('v_min');
        x.worklogs.push({ id: uid(), by, min: m, note: str(op.note, 300), at: now });
        logA(x, 'work', by, now, { v: m });
        break;
      }
      case 'work-del': {
        const w = x.worklogs.find(z => z.id === op.wid); if (!w) throw err('not_found', 404);
        if (w.by !== by && !isAdmin) throw err('forbidden', 403);
        x.worklogs = x.worklogs.filter(z => z.id !== op.wid); x.updatedAt = now;
        break;
      }
      case 'check-add': {
        const text = str(op.text, 200); if (!text) throw err('v_req2');
        x.checklist.push({ id: uid(), text, done: false }); logA(x, 'check', by, now);
        break;
      }
      case 'check-toggle': {
        const c = x.checklist.find(z => z.id === op.cid); if (!c) throw err('not_found', 404);
        c.done = !!op.done; logA(x, 'check', by, now);
        break;
      }
      case 'check-del': {
        if (!x.checklist.some(z => z.id === op.cid)) throw err('not_found', 404);
        x.checklist = x.checklist.filter(z => z.id !== op.cid); logA(x, 'check', by, now);
        break;
      }
      case 'link': {
        const o = S.tickets.find(z => z.id === op.other);
        if (!o || o.id === x.id) throw err('v_req2');
        if (!x.links.includes(o.id)) x.links.push(o.id);
        if (!o.links.includes(x.id)) { o.links.push(x.id); o.updatedAt = now; }
        logA(x, 'link', by, now, { v: o.key }); touched.push(o);
        break;
      }
      case 'unlink': {
        const o = S.tickets.find(z => z.id === op.other);
        x.links = x.links.filter(l => l !== op.other); x.updatedAt = now;
        if (o) { o.links = o.links.filter(l => l !== x.id); o.updatedAt = now; touched.push(o); }
        break;
      }
      case 'csat': {
        const v = +op.v; if (![1, 2, 3, 4, 5].includes(v)) throw err('v_req2');
        if (isOpen(x)) throw err('csat_open');
        if (x.csat != null) throw err('csat_done', 409); // DESK-BUG-002: first rating is final for this resolution
        x.csat = v; logA(x, 'csat', by, now, { v });
        break;
      }
      default: throw err('bad_op');
    }
    return touched;
  }

  function autoClose(S, now) {
    const days = +S.settings.autoCloseDays || 0, changed = [];
    if (days <= 0) return changed;
    S.tickets.forEach(x => {
      if (x.status === 'resolved' && x.resolvedAt && now - x.resolvedAt > days * DAY) {
        x.status = 'closed'; x.closedAt = now; x.activity.push({ at: now, by: 'system', k: 'autoclose' }); x.updatedAt = now; changed.push(x);
      }
    });
    return changed;
  }

  /* ---------- collection validation (teams, categories, canned, assets, kb, agents) ---------- */
  /* meta: { by, now } for edits by a person (history is appended server-side, never taken from the client);
   *       { trusted: true } for restore/import, where the stored history is kept. */
  function ownerLabel(S, a) { const r = a.requesterId && (S.requesters || []).find(z => z.id === a.requesterId); return r ? r.name : (a.user || ''); }
  function cleanHistory(h) {
    return (Array.isArray(h) ? h : []).filter(e => e && typeof e.k === 'string' && +e.at > 0).slice(-200)
      .map(e => ({ at: +e.at, by: str(e.by, 40), k: str(e.k, 20), f: e.f == null ? undefined : str(e.f, 120), v: e.v == null ? undefined : str(e.v, 120) }));
  }
  function cleanEntity(S, coll, d, meta) {
    d = d || {}; meta = meta || {};
    if (!ID_RE.test(String(d.id || ''))) throw err('v_req2');
    const id = d.id;
    switch (coll) {
      case 'teams': { const name = str(d.name, 60); if (!name) throw err('v_req2'); return { id, name }; }
      case 'categories': {
        const name = str(d.name, 60); if (!name) throw err('v_req2');
        if (!S.teams.some(t => t.id === d.team)) throw err('v_req2');
        return { id, name, team: d.team };
      }
      case 'canned': { const title = str(d.title, 80); if (!title) throw err('v_req2'); return { id, title, body: str(d.body, 2000) }; }
      case 'assets': {
        const tag = str(d.tag, 30).toUpperCase(), name = str(d.name, 100);
        if (!tag || !name) throw err('v_req2');
        if (S.assets.some(a => a.tag.toUpperCase() === tag && a.id !== id)) throw err('dup_tag');
        const before = S.assets.find(a => a.id === id);
        const status = ASSET_STATUSES.includes(d.status) ? d.status : 'active';
        const requesterId = d.requesterId && (S.requesters || []).some(r => r.id === d.requesterId) ? d.requesterId : '';
        const purchaseDate = dateStr(d.purchaseDate), warrantyEnd = dateStr(d.warrantyEnd);
        if (purchaseDate && warrantyEnd && warrantyEnd < purchaseDate) throw err('bad_dates');
        let disposal = null;
        if (status === 'disposed') {
          const x = d.disposal || {}; const method = DISPOSAL_METHODS.includes(x.method) ? x.method : '', date = dateStr(x.date);
          if (!method || !date) throw err('v_disposal');
          disposal = { method, date, dataWiped: !!x.dataWiped, note: str(x.note, 300) };
        }
        const out = { id, tag, name, type: str(d.type, 40), status, criticality: ASSET_CRIT.includes(d.criticality) ? d.criticality : 'medium',
          requesterId, user: str(d.user, 80), location: str(d.location, 80), serial: str(d.serial, 60), vendor: str(d.vendor, 60),
          purchaseDate, warrantyEnd, notes: str(d.notes, 1000), disposal };
        let hist = meta.trusted ? cleanHistory(d.history) : (before && Array.isArray(before.history) ? before.history.slice() : []);
        if (!meta.trusted && meta.now) {
          const at = meta.now, by = meta.by || 'system';
          if (!before) hist.push({ at, by, k: 'created', v: status });
          else {
            if (before.status !== status) hist.push({ at, by, k: 'status', f: before.status, v: status });
            if ((before.requesterId || '') !== requesterId || (before.user || '') !== out.user) hist.push({ at, by, k: 'owner', f: ownerLabel(S, before), v: ownerLabel(S, out) });
            if ((before.location || '') !== out.location) hist.push({ at, by, k: 'location', f: before.location || '', v: out.location });
          }
        }
        out.history = hist.slice(-200);
        out.createdAt = (before && before.createdAt) || (meta.trusted && +d.createdAt) || meta.now || 0;
        return out;
      }
      case 'plans': {
        const title = str(d.title, 120); if (title.length < 3) throw err('v_req2');
        const everyDays = Math.round(+d.everyDays); if (!(everyDays >= 1 && everyDays <= 730)) throw err('v_every');
        const nextDue = dateStr(d.nextDue); if (!nextDue) throw err('v_date');
        const assetIds = [...new Set(Array.isArray(d.assetIds) ? d.assetIds : [])].filter(x => S.assets.some(a => a.id === x)).slice(0, 300);
        const assetType = assetIds.length ? '' : str(d.assetType, 40);
        if (!assetIds.length && !assetType) throw err('v_target');
        if (!S.categories.some(c => c.id === d.categoryId)) throw err('v_cat');
        const before = (S.plans || []).find(p => p.id === id);
        return { id, title, desc: str(d.desc, 2000), everyDays, nextDue, leadDays: Math.max(0, Math.min(30, Math.round(+d.leadDays || 0))),
          assetIds, assetType, type: PM_TYPES.includes(d.type) ? d.type : 'request', categoryId: d.categoryId,
          assigneeId: d.assigneeId && S.agents.some(a => a.id === d.assigneeId) ? d.assigneeId : '',
          checklist: (Array.isArray(d.checklist) ? d.checklist : String(d.checklist || '').split('\n')).map(x => str(x, 200)).filter(Boolean).slice(0, 30),
          active: d.active !== false, lastRun: before ? (before.lastRun || null) : (meta.trusted && d.lastRun) || null };
      }
      case 'kb': {
        const title = str(d.title, 160), body = str(d.body, 10000);
        if (!title || !body) throw err('v_req2');
        const category = d.category && S.categories.some(c => c.id === d.category) ? d.category : '';
        // DESK-GAP-004: audience 'portal' = visible to employees in the self-service portal; anything else = internal (default, fail-closed)
        return { id, title, body, category, tags: str(d.tags, 200), audience: d.audience === 'portal' ? 'portal' : 'internal' };
      }
      case 'agents': {
        const name = str(d.name, 60), email = str(d.email, 120).toLowerCase();
        if (!name) throw err('v_req2');
        if (!EMAIL_RE.test(email)) throw err('v_email');
        if (S.agents.some(a => a.email.toLowerCase() === email && a.id !== id)) throw err('dup_email');
        if (!S.teams.some(t => t.id === d.team)) throw err('v_req2');
        return { id, name, email, team: d.team, active: d.active !== false };
      }
      case 'requesters': {
        const name = str(d.name, 80), email = str(d.email, 120).toLowerCase();
        if (!name) throw err('v_req');
        if (email && !EMAIL_RE.test(email)) throw err('v_email');
        if (email && (S.requesters || []).some(r => r.email === email && r.id !== id)) throw err('dup_email');
        return { id, name, email, dept: str(d.dept, 60), phone: str(d.phone, 30), active: d.active !== false };
      }
      default: throw err('bad_coll', 404);
    }
  }
  function inUse(S, coll, id) {
    if (coll === 'requesters') return S.tickets.some(x => x.requesterId === id) || S.assets.some(a => a.requesterId === id);
    if (coll === 'teams') return S.agents.some(a => a.team === id) || S.categories.some(c => c.team === id);
    if (coll === 'categories') return S.tickets.some(x => x.categoryId === id) || (S.plans || []).some(p => p.categoryId === id);
    if (coll === 'assets') return S.tickets.some(x => x.assetId === id) || (S.plans || []).some(p => p.assetIds.includes(id));
    if (coll === 'agents') return S.tickets.some(x => x.assigneeId === id) || (S.plans || []).some(p => p.assigneeId === id);
    return false;
  }
  function cleanSettings(cur, d) {
    d = d || {};
    const prefix = String(d.prefix != null ? d.prefix : cur.prefix).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    if (!prefix) throw err('v_req2');
    const autoCloseDays = Math.max(0, Math.min(60, Math.round(+(d.autoCloseDays != null ? d.autoCloseDays : cur.autoCloseDays) || 0)));
    return { prefix, nextNo: cur.nextNo, autoAssign: d.autoAssign != null ? !!d.autoAssign : !!cur.autoAssign, autoCloseDays,
      calendar: cleanCalendar(d.calendar != null ? d.calendar : cur.calendar), portal: cleanPortal(d.portal != null ? d.portal : cur.portal) };
  }
  function cleanCalendar(c) {
    c = c || DEFAULT_CAL;
    const mode = c.mode === 'business' ? 'business' : '24x7';
    const tz = str(c.tz || DEFAULT_CAL.tz, 60);
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch (e) { throw err('bad_tz'); }
    const days = {};
    for (let i = 0; i < 7; i++) {
      const w = c.days && c.days[i];
      if (!w) { days[i] = null; continue; }
      const a = Math.round(+w[0]), b = Math.round(+w[1]);
      if (!(a >= 0 && b <= 1440 && a < b)) throw err('bad_hours');
      days[i] = [a, b];
    }
    if (mode === 'business' && !Object.values(days).some(Boolean)) throw err('no_workdays');
    const seen = new Set();
    const holidays = (Array.isArray(c.holidays) ? c.holidays : []).filter(h => h && /^\d{4}-\d{2}-\d{2}$/.test(h.date) && !seen.has(h.date) && seen.add(h.date))
      .slice(0, 400).map(h => ({ date: h.date, name: str(h.name, 60) })).sort((a, b) => a.date < b.date ? -1 : 1);
    return { mode, tz, days, holidays };
  }
  function cleanPortal(p) {
    p = p || {};
    const allowedDomains = (Array.isArray(p.allowedDomains) ? p.allowedDomains : String(p.allowedDomains || '').split(/[\s,]+/))
      .map(x => String(x).trim().toLowerCase().replace(/^@/, '')).filter(x => /^[a-z0-9.-]+\.[a-z]{2,}$/.test(x)).slice(0, 20);
    return { enabled: !!p.enabled, allowedDomains };
  }

  /* ---------- requesters ----------
   * resolveRequester links ticket data to a saved requester: by id, then by email; otherwise creates one.
   * Returns { requester, created }. */
  function resolveRequester(S, d, now) {
    S.requesters = S.requesters || [];
    if (d && d.requesterId) { const r = S.requesters.find(z => z.id === d.requesterId); if (r) return { requester: r, created: false }; }
    const rq = (d && d.requester) || {};
    const name = str(rq.name, 80), email = str(rq.email, 120).toLowerCase();
    if (!name && !email) return { requester: null, created: false };
    if (email) { const r = S.requesters.find(z => z.email === email); if (r) return { requester: r, created: false }; }
    if (email && !EMAIL_RE.test(email)) return { requester: null, created: false };
    const r = { id: uid(), name: name || email.split('@')[0], email, dept: str(rq.dept, 60), phone: '', active: true, createdAt: now };
    return { requester: r, created: true };
  }
  /** Ensures ticket data `d` points to a requester entity (creating one when needed). Returns the new requester or null. */
  function linkRequester(S, d, now) {
    const { requester, created } = resolveRequester(S, d, now);
    if (!requester) { d.requesterId = null; return null; }
    if (created) S.requesters.push(requester);
    d.requesterId = requester.id;
    return created ? requester : null;
  }
  /** One-time upgrade for data created before requesters existed: links every ticket to a requester entity
   *  (grouped by email, or by name when there is no email) and gives every ticket a portal token. */
  function migrateRequesters(S, now) {
    S.requesters = S.requesters || [];
    const created = [], touched = [];
    const byName = new Map(S.requesters.filter(r => !r.email).map(r => [r.name.toLowerCase(), r]));
    for (const x of S.tickets) {
      let changed = false;
      if (!x.portalToken) { x.portalToken = token(); changed = true; }
      if (!x.attachments) { x.attachments = []; changed = true; }
      if (!x.requesterId && x.requester && (x.requester.name || x.requester.email)) {
        const email = str(x.requester.email, 120).toLowerCase();
        let r = email ? S.requesters.find(z => z.email === email) : byName.get(str(x.requester.name, 80).toLowerCase());
        if (!r) {
          r = { id: uid(), name: str(x.requester.name, 80) || email.split('@')[0], email: EMAIL_RE.test(email) ? email : '', dept: str(x.requester.dept, 60), phone: '', active: true, createdAt: now };
          S.requesters.push(r); created.push(r); if (!r.email) byName.set(r.name.toLowerCase(), r);
        }
        x.requesterId = r.id; changed = true;
      }
      if (changed) touched.push(x);
    }
    return { created, touched };
  }
  function cleanSla(d) {
    const out = {};
    ['P1', 'P2', 'P3', 'P4'].forEach(p => {
      const r = d && d[p]; const resp = Math.round(+(r && r.resp)), res = Math.round(+(r && r.res));
      if (!(resp > 0 && resp <= 100000 && res > 0 && res <= 100000)) throw err('v_req2');
      out[p] = { resp, res };
    });
    return out;
  }

  /* ---------- preventive maintenance ----------
   * A plan targets specific assets or every asset of a type, repeats every N days and opens one ticket per asset
   * when its due date (minus leadDays) is reached in the company's time zone. No ticket is opened for an asset that
   * still has an open ticket from the same plan; nextDue then moves forward past today (no backlog storm). */
  function todayIn(S, now) { const w = wall(now, (calOf(S) || DEFAULT_CAL).tz); return dkey(w.y, w.m, w.d); }
  const PM_ASSET_STATES = ['active', 'repair'];
  function planTargets(S, p) {
    return S.assets.filter(a => PM_ASSET_STATES.includes(a.status) && (p.assetIds && p.assetIds.length ? p.assetIds.includes(a.id) : !!p.assetType && a.type.toLowerCase() === p.assetType.toLowerCase()));
  }
  /** opts: { planId, force } — force runs that one plan now. Mutates S; returns what changed for persistence. */
  function runMaintenance(S, now, opts) {
    opts = opts || {}; S.plans = S.plans || [];
    const today = todayIn(S, now), created = [], plans = [], requesters = [];
    for (let i = 0; i < S.plans.length; i++) {
      const p = S.plans[i];
      if (opts.planId && p.id !== opts.planId) continue;
      if (!p.active && !opts.force) continue;
      const isDue = addDays(p.nextDue, -(p.leadDays || 0)) <= today;
      if (!isDue && !opts.force) continue;
      const due = opts.force && !isDue ? today : p.nextDue; let made = 0, skipped = 0;
      for (const a of planTargets(S, p)) {
        if (S.tickets.some(t => t.planId === p.id && t.assetId === a.id && isOpen(t))) { skipped++; continue; }
        const d = { title: (p.title + ' — ' + a.tag).slice(0, 160), type: p.type, categoryId: p.categoryId, impact: a.criticality === 'high' ? 2 : 3, urgency: 3,
          requester: { name: 'IT Set Desk', email: '', dept: 'IT' }, assetId: a.id, desc: p.desc || p.title,
          tags: ['preventive'], assigneeId: p.assigneeId && S.agents.some(g => g.id === p.assigneeId && g.active) ? p.assigneeId : '' };
        const nr = linkRequester(S, d, now); if (nr) requesters.push(nr);
        const x = newTicket(S, d, 'system', now);
        x.planId = p.id; x.pmDue = due;
        x.checklist = (p.checklist || []).map(text => ({ id: uid(), text, done: false }));
        S.tickets.push(x); created.push(x); made++;
      }
      let nx = opts.force && !isDue ? addDays(today, p.everyDays) : p.nextDue;
      for (let k = 0; k < 5000 && addDays(nx, -(p.leadDays || 0)) <= today; k++) nx = addDays(nx, p.everyDays);
      S.plans[i] = Object.assign({}, p, { nextDue: nx, lastRun: { at: now, due, created: made, skipped } });
      plans.push(S.plans[i]);
    }
    return { created, plans, requesters };
  }
  /** Per-asset service figures. MTBF here = mean time between the start of consecutive incidents. */
  function assetStats(S, id, now) {
    const ts = S.tickets.filter(t => t.assetId === id);
    const inc = ts.filter(t => t.type === 'incident').sort((a, b) => a.createdAt - b.createdAt);
    const fixed = inc.filter(t => t.resolvedAt);
    const pmDone = ts.filter(t => t.planId && t.resolvedAt).map(t => t.resolvedAt);
    const a = S.assets.find(z => z.id === id);
    const nextPm = a ? (S.plans || []).filter(p => p.active && planTargets(S, p).some(z => z.id === id)).map(p => p.nextDue).sort()[0] || '' : '';
    return { total: ts.length, open: ts.filter(isOpen).length, incidents: inc.length, pm: ts.filter(t => t.planId).length,
      mttr: fixed.length ? fixed.reduce((s, t) => s + (t.resolvedAt - t.createdAt), 0) / fixed.length : null,
      mtbf: inc.length >= 2 ? (inc[inc.length - 1].createdAt - inc[0].createdAt) / (inc.length - 1) : null,
      lastPm: pmDone.length ? Math.max(...pmDone) : null, nextPm };
  }
  /** 'none' | 'expired' | 'soon' (≤ 30 days) | 'ok' */
  function warranty(a, today) { if (!a.warrantyEnd) return 'none'; const d = daysBetween(today, a.warrantyEnd); return d < 0 ? 'expired' : d <= 30 ? 'soon' : 'ok'; }

  /* ---------- English versions of the default and demo data (used when the admin sets up in English) ---------- */
  const EN = {
    categories: ['Hardware', 'Software', 'Email & Microsoft 365', 'Network / VPN / Wi-Fi', 'Printers', 'Accounts & Access', 'Security Incident', 'Servers & Backup', 'CCTV & Access Control'],
    canned: [['Request received', 'Hello,\nWe received your request and are working on it. We will keep you posted.\nIT Support'],
      ['More information needed', 'Hello,\nPlease send us a screenshot of the error and roughly when it happened so we can continue.\nThanks'],
      ['Resolved', 'Hello,\nThe issue is resolved. If it happens again, reply to this ticket and we will reopen it.\nThanks for your patience'],
      ['Restart the device', 'Please restart your device, try again and let us know the result.']],
    agents: ['Ahmed Samir', 'Mona Khaled', 'Karim Adel', 'Yasmin Fouad', 'Omar Hassan'],
    assets: [['', 'Floor 2'], ['HR department', 'Floor 1'], ['Server Room', 'Server room'], ['Server Room', 'Server room'], ['IT', 'Server room'], ['Security', 'Warehouse'],
      ['Accounts', 'Floor 1'], ['IT store', 'IT store'], ['', 'IT store']],
    assetNotes: ['', '', '', '', '', '', '', 'Ready for the next hire.', 'Replaced by LAP-0012. Disk wiped with a 3-pass overwrite before recycling.'],
    disposalNote: 'Handed to a certified e-waste recycler (certificate kept in the IT file).',
    plans: [['Printer cleaning and inspection', 'Clean the paper path and rollers, check toner and print a test page.', ['Clean rollers and the paper path', 'Check toner and order a spare below 20%', 'Update firmware if available', 'Print a test page']],
      ['Firewall review and update', 'Check the FortiOS version, back up the configuration and review unused rules.', ['Back up the configuration', 'Review the release notes', 'Review unused rules', 'Update the security signatures (IPS/AV)']],
      ['Backup restore test', 'Restore a random file from last night\'s backup to a test path and verify it.', ['Pick a random file from last night\'s backup', 'Restore it to a test path', 'Compare the hash with the original', 'Record the result']],
      ['Camera and NVR recording check', 'Confirm every camera records and the retention period is met.', ['Check recording on every channel', 'Check free disk space and retention days', 'Check the NVR time is synced']]],
    kb: [['Reset an Active Directory user password', '1. Open Active Directory Users and Computers.\n2. Find the user → Reset Password.\n3. Tick "User must change password at next logon".\n4. If the account is locked: Account → Unlock.\n5. Share the temporary password over a secure channel (not email).'],
      ['FortiClient VPN disconnects repeatedly', '- Make sure the FortiClient version matches the FortiOS version.\n- Disable "Power saving" on the network adapter in Device Manager.\n- Try an MTU of 1400.\n- Check the DPD timeout in the firewall VPN settings.\n- On a home router: test with a mobile hotspot to confirm.'],
      ['Clear a stuck print queue (Print Spooler)', '1. Open CMD as Administrator.\n2. net stop spooler\n3. Delete the contents of C:\\Windows\\System32\\spool\\PRINTERS\n4. net start spooler\n5. Send the print job again.'],
      ['Handling a reported phishing email', '1. Ask the user not to click any link and not to delete the email.\n2. Get the message as an attachment (.eml) to inspect the headers.\n3. Search other mailboxes for the same message and remove it (Content Search / Threat Explorer).\n4. If credentials were entered: reset the password immediately and revoke all sessions.\n5. Update the block rules on the mail gateway.']],
    tickets: [
      { title: 'Internet down on the entire third floor', req: ['Hala Mostafa', 'Management'], desc: 'No device on the third floor has internet since 9:40. Wi-Fi connects but shows no Internet. About 25 employees affected.',
        cm: ['Received. The uplink of the 3rd floor switch is down, checking in the server room.', 'Port Gi1/0/48 on SW-CORE-01 went err-disabled because of a loop. Did shutdown/no shutdown, monitoring now.'],
        ck: ['Check the uplink on the core switch', 'Find the err-disabled cause', 'Enable BPDU Guard on floor 3 ports'], wl: ['Switch check and loop tracing'] },
      { title: 'Suspected phishing email received by Accounts', req: ['Mahmoud Rashad', 'Accounts'], desc: 'Four employees in Accounts received an email asking them to update bank details through a link. One clicked the link but did not enter any data.', cm: ['Please send me the message as an .eml attachment and do not delete it.'] },
      { title: 'HR printer not printing — repeated paper jam', req: ['Noha Sami', 'HR'], desc: 'The printer jams about every 5 pages, even after changing the paper.' },
      { title: 'Create an email account for a new Sales hire', req: ['Sara Ibrahim', 'Sales'], desc: 'Employee: Youssef Tarek — Sales Executive\nStarts next Sunday.\nNeeds: mailbox + Teams + CRM access.',
        ck: ['Create the user in AD', 'Assign a Microsoft 365 Business Standard license', 'Add to the Sales group', 'CRM access'] },
      { title: 'VPN disconnects every 10 minutes from home', req: ['Rami Fathy', 'IT Projects'], desc: 'FortiClient disconnects roughly every 10 minutes since I changed my home router.', cm: ['Please disable power saving on the network adapter, set the MTU to 1400 and let me know.'] },
      { title: 'Outlook does not sync the shared mailbox', req: ['Dina Walid', 'Customer Service'], desc: 'The support@ shared mailbox stopped updating in Outlook since yesterday. It works fine in OWA.', wl: ['Rebuilt the OST and checked permissions'] },
      { title: 'Install Microsoft Project for the projects manager', req: ['Khaled Mansour', 'Projects'], desc: 'Microsoft Project Plan 3 needed — license approved by the CFO.' },
      { title: 'Laptop LAP-0012 very slow to boot', req: ['Sara Ibrahim', 'Sales'], desc: 'The laptop takes 8 minutes to start.', cm: ['Disabled unnecessary startup apps and updated the BIOS and drivers. Boot time is now under a minute.'], wl: ['Startup cleanup + BIOS update'] },
      { title: 'Change the guest Wi-Fi password', req: ['Hala Mostafa', 'Management'], desc: 'Quarterly guest Wi-Fi password rotation.' },
      { title: 'Nightly backup of the file server failed', req: ['IT Monitoring', 'IT'], desc: 'The backup job failed with: VSS snapshot creation failed.', wl: ['Fixed the VSS writers and re-ran the job'] },
      { title: 'Warehouse entrance camera not recording', req: ['Warehouse Security', 'Security'], desc: 'Camera 7 shows live view but has not recorded for two days.' },
      { title: 'Access to the Finance folder', req: ['Mahmoud Rashad', 'Accounts'], desc: 'Read-only access needed on \\\\FS01\\Finance\\Reports' },
      { title: 'Problem: daily network outage at 9 AM', req: ['IT', 'IT'], desc: 'Root cause analysis for recurring network outages at the start of the working day. Related to the third-floor incident.' },
      { title: 'Change: upgrade FortiOS on the firewall to 7.4.x', req: ['IT', 'IT'], desc: 'Scheduled upgrade outside working hours. A configuration backup and rollback plan are required.',
        ck: ['Back up the configuration', 'Review the release notes and upgrade path', 'Notify users of the downtime window', 'Run the upgrade in the maintenance window', 'Test VPN and policies after the upgrade'] },
      { title: 'Extra monitor for the accountant', req: ['Mahmoud Rashad', 'Accounts'], desc: 'Request for an additional 24-inch monitor.' },
      { title: 'Employee cannot sign in to the ERP', req: ['Ola Gamal', 'Procurement'], desc: 'Error: Invalid session. Tried two different browsers.' }],
    extra: ['Install a printer on a new PC', 'Add a user to a Teams group', 'Wireless mouse not working', 'Activate Office on a PC', 'Forgot Windows password', 'Audio issue in Teams meetings', 'Open a firewall port for the attendance system'],
    employee: 'Employee', extraDesc: 'Completed demo ticket.'
  };

  /* ---------- default data & demo seed ---------- */
  function defaults(lang) {
    const d = {
      settings: { prefix: 'ITS', nextNo: 1001, autoAssign: true, autoCloseDays: 3, calendar: JSON.parse(JSON.stringify(DEFAULT_CAL)), portal: { enabled: false, allowedDomains: [] } },
      sla: { P1: { resp: 15, res: 240 }, P2: { resp: 60, res: 480 }, P3: { resp: 240, res: 1440 }, P4: { resp: 480, res: 4320 } },
      teams: [{ id: 't1', name: 'Service Desk' }, { id: 't2', name: 'Network & Infrastructure' }, { id: 't3', name: 'Systems & Cloud' }, { id: 't4', name: 'Security' }],
      categories: [
        { id: 'c1', name: 'Hardware — أجهزة', team: 't1' }, { id: 'c2', name: 'Software — برامج', team: 't1' }, { id: 'c3', name: 'Email & Microsoft 365', team: 't3' },
        { id: 'c4', name: 'Network / VPN / Wi-Fi', team: 't2' }, { id: 'c5', name: 'Printers — طابعات', team: 't1' }, { id: 'c6', name: 'Accounts & Access — صلاحيات', team: 't3' },
        { id: 'c7', name: 'Security Incident', team: 't4' }, { id: 'c8', name: 'Servers & Backup', team: 't3' }, { id: 'c9', name: 'CCTV & Access Control', team: 't2' }],
      canned: [
        { id: 'r1', title: 'استلام الطلب', body: 'أهلاً،\nتم استلام طلبك وجاري العمل عليه. هنبلغك بأي تحديث.\nفريق الدعم الفني' },
        { id: 'r2', title: 'طلب معلومات إضافية', body: 'أهلاً،\nمحتاجين منك صورة من رسالة الخطأ ووقت حدوث المشكلة بالتقريب علشان نقدر نكمل.\nشكراً' },
        { id: 'r3', title: 'تم الحل', body: 'أهلاً،\nتم حل المشكلة. لو ظهرت تاني رد على التذكرة دي وهنعيد فتحها.\nشكراً لتعاونك' },
        { id: 'r4', title: 'إعادة تشغيل الجهاز', body: 'من فضلك اعمل Restart للجهاز وجرب تاني، وبلغنا بالنتيجة.' }],
      agents: [], assets: [], kb: [], tickets: [], requesters: [], plans: []
    };
    if (lang === 'en') { d.categories.forEach((c, i) => { c.name = EN.categories[i]; }); d.canned.forEach((c, i) => { c.title = EN.canned[i][0]; c.body = EN.canned[i][1]; }); }
    return d;
  }

  function seed(n, lang) {
    const s = defaults(lang);
    s.agents = [
      { id: 'a1', name: 'أحمد سمير', email: 'ahmed.samir@example.com', team: 't1', active: true },
      { id: 'a2', name: 'منى خالد', email: 'mona.khaled@example.com', team: 't2', active: true },
      { id: 'a3', name: 'كريم عادل', email: 'karim.adel@example.com', team: 't3', active: true },
      { id: 'a4', name: 'ياسمين فؤاد', email: 'yasmin.fouad@example.com', team: 't1', active: true },
      { id: 'a5', name: 'عمر حسن', email: 'omar.hassan@example.com', team: 't4', active: true }];
    s.assets = [
      { id: 'as1', tag: 'LAP-0012', name: 'Dell Latitude 5440', type: 'Laptop', user: 'سارة إبراهيم — المبيعات', location: 'الدور 2', status: 'active' },
      { id: 'as2', tag: 'PRN-003', name: 'HP LaserJet Pro M428fdw', type: 'Printer', user: 'قسم HR', location: 'الدور 1', status: 'repair' },
      { id: 'as3', tag: 'SW-CORE-01', name: 'Cisco CBS350-48P', type: 'Switch', user: 'Server Room', location: 'غرفة السيرفرات', status: 'active' },
      { id: 'as4', tag: 'FW-01', name: 'FortiGate 60F', type: 'Firewall', user: 'Server Room', location: 'غرفة السيرفرات', status: 'active' },
      { id: 'as5', tag: 'SRV-FS01', name: 'File Server — Windows Server 2022', type: 'Server', user: 'IT', location: 'غرفة السيرفرات', status: 'active' },
      { id: 'as6', tag: 'NVR-01', name: 'Hikvision DS-7616NI', type: 'NVR', user: 'الأمن', location: 'المخزن', status: 'active' },
      { id: 'as7', tag: 'PRN-007', name: 'HP LaserJet Pro M404dn', type: 'Printer', user: 'الحسابات', location: 'الدور 1', status: 'active' },
      { id: 'as8', tag: 'LAP-0021', name: 'Lenovo ThinkPad E14 Gen 5', type: 'Laptop', user: 'مخزن الـ IT', location: 'مخزن الـ IT', status: 'stock' },
      { id: 'as9', tag: 'PC-0004', name: 'Dell OptiPlex 3020', type: 'Desktop', user: '', location: 'مخزن الـ IT', status: 'disposed' }];
    { // demo lifecycle details (dates relative to the seed time)
      const today = todayIn(s, n), D = k => addDays(today, k);
      const X = [['5CG3281KQ7', 'Dell', -420, 675, 'medium'], ['VNB3K12345', 'HP', -1300, -205, 'medium'], ['PSZ27101ABC', 'Cisco', -900, 195, 'high'], ['FGT60FTK2209', 'Fortinet', -700, 20, 'high'],
        ['CZ2241087X', 'HPE', -1000, 95, 'high'], ['L56123456', 'Hikvision', -800, -70, 'medium'], ['PHBBK45678', 'HP', -500, 230, 'low'], ['PF4XYZ12', 'Lenovo', -30, 1065, 'medium'], ['8QK7Y2J', 'Dell', -3200, -2100, 'low']];
      const notes = ['', '', '', '', '', '', '', 'جاهز لأول موظف جديد.', 'اتبدّل بـ LAP-0012. الهارد اتمسح بالكتابة فوقه 3 مرات قبل التسليم للتدوير.'];
      s.assets.forEach((a, i) => { const x = X[i];
        Object.assign(a, { serial: x[0], vendor: x[1], purchaseDate: D(x[2]), warrantyEnd: D(x[3]), criticality: x[4], requesterId: '', notes: notes[i], disposal: null,
          createdAt: n + x[2] * DAY, history: [{ at: n + x[2] * DAY, by: 'system', k: 'created', v: a.status === 'stock' ? 'stock' : 'active' }] }); });
      const pc = s.assets[8]; pc.disposal = { method: 'recycled', date: D(-25), dataWiped: true, note: 'اتسلّم لشركة تدوير مخلفات إلكترونية معتمدة (الشهادة في ملف الـ IT).' };
      pc.history.push({ at: n - 60 * DAY, by: 'a1', k: 'status', f: 'active', v: 'retired' }, { at: n - 25 * DAY, by: 'a1', k: 'status', f: 'retired', v: 'disposed' });
      s.assets[1].history.push({ at: n - 2 * DAY, by: 'a4', k: 'status', f: 'active', v: 'repair' });
      s.plans = [
        { id: 'pm1', title: 'تنظيف وفحص الطابعات', desc: 'تنظيف مسار الورق والبكرات، فحص الحبر، وطباعة صفحة اختبار.', everyDays: 90, nextDue: D(6), leadDays: 0, assetIds: [], assetType: 'Printer', type: 'request', categoryId: 'c5', assigneeId: 'a4',
          checklist: ['تنظيف البكرات ومسار الورق', 'فحص الحبر وطلب بديل لو أقل من 20%', 'تحديث الـ Firmware لو متاح', 'طباعة صفحة اختبار'], active: true, lastRun: null },
        { id: 'pm2', title: 'مراجعة وتحديث الـ Firewall', desc: 'مراجعة إصدار FortiOS، Backup للإعدادات، ومراجعة القواعد غير المستخدمة.', everyDays: 30, nextDue: D(12), leadDays: 2, assetIds: ['as4'], assetType: '', type: 'change', categoryId: 'c7', assigneeId: 'a5',
          checklist: ['Backup لملف الإعدادات', 'مراجعة الـ Release notes', 'مراجعة القواعد غير المستخدمة', 'تحديث التوقيعات (IPS/AV)'], active: true, lastRun: null },
        { id: 'pm3', title: 'اختبار استرجاع النسخة الاحتياطية', desc: 'استرجاع ملف عشوائي من نسخة امبارح على مسار اختبار والتأكد من سلامته.', everyDays: 30, nextDue: D(0), leadDays: 0, assetIds: ['as5'], assetType: '', type: 'request', categoryId: 'c8', assigneeId: 'a3',
          checklist: ['اختيار ملف عشوائي من نسخة امبارح', 'الاسترجاع على مسار اختبار', 'مقارنة الـ Hash مع الأصل', 'تسجيل النتيجة'], active: true, lastRun: null },
        { id: 'pm4', title: 'فحص تسجيل الكاميرات والـ NVR', desc: 'التأكد إن كل الكاميرات بتسجل وإن مدة الاحتفاظ مطابقة.', everyDays: 30, nextDue: D(20), leadDays: 0, assetIds: ['as6'], assetType: '', type: 'request', categoryId: 'c9', assigneeId: 'a2',
          checklist: ['فحص التسجيل على كل القنوات', 'فحص المساحة الفاضية وأيام الاحتفاظ', 'التأكد من ضبط وقت الـ NVR'], active: true, lastRun: null }];
    }
    s.kb = [
      { id: 'k1', title: 'إعادة تعيين كلمة مرور مستخدم Active Directory', category: 'c6', tags: 'ad,password', body: '1. افتح Active Directory Users and Computers.\n2. ابحث عن المستخدم ← Reset Password.\n3. فعّل "User must change password at next logon".\n4. لو الحساب Locked: Account ← Unlock.\n5. أبلغ المستخدم بكلمة المرور المؤقتة عبر قناة آمنة (ليس البريد).' },
      { id: 'k2', title: 'FortiClient VPN بيفصل بشكل متكرر', category: 'c4', tags: 'vpn,forticlient', body: '- تأكد من إصدار FortiClient مطابق لإصدار FortiOS.\n- عطّل "Power saving" لكارت الشبكة من Device Manager.\n- جرّب تغيير MTU إلى 1400.\n- راجع DPD timeout في إعدادات الـ VPN على الـ Firewall.\n- لو المشكلة على راوتر منزلي: جرّب Hotspot موبايل للتأكيد.' },
      { id: 'k3', title: 'مسح طابور الطباعة العالق (Print Spooler)', category: 'c5', tags: 'printer,spooler', body: '1. افتح CMD كـ Administrator.\n2. net stop spooler\n3. احذف محتوى C:\\Windows\\System32\\spool\\PRINTERS\n4. net start spooler\n5. أعد إرسال أمر الطباعة.' },
      { id: 'k4', title: 'التعامل مع بلاغ رسالة Phishing', category: 'c7', tags: 'phishing,security', body: '1. اطلب من المستخدم عدم الضغط على أي رابط وعدم حذف الرسالة.\n2. احصل على الرسالة كمرفق (.eml) لفحص الـ Headers.\n3. ابحث عن نفس الرسالة في باقي الصناديق واحذفها (Content Search / Threat Explorer).\n4. لو تم إدخال بيانات دخول: غيّر كلمة المرور فوراً وأنهِ كل الجلسات.\n5. حدّث قواعد الحظر على الـ Mail Gateway.' }];
    const R = (name, email, dept) => ({ name, email, dept });
    const T = [
      { title: 'انقطاع الإنترنت في الدور الثالث بالكامل', type: 'incident', cat: 'c4', i: 1, u: 1, st: 'progress', a: 'a2', age: 95, fr: 88, asset: 'as3', tags: ['outage', 'floor-3'], req: R('هالة مصطفى', 'hala.m@example.com', 'الإدارة'),
        desc: 'كل الأجهزة في الدور الثالث مفيش عليها إنترنت من الساعة 9:40. الـ Wi-Fi متصل لكن بدون Internet. حوالي 25 موظف متأثرين.',
        cm: [{ a: 'a2', b: 'تم استلام البلاغ. الـ Uplink بتاع Switch الدور التالت down، جاري الفحص في غرفة السيرفرات.', age: 88 }, { a: 'a2', b: 'Port Gi1/0/48 على SW-CORE-01 عامل err-disabled بسبب loop. تم عمل shutdown/no shutdown وجاري المراقبة.', age: 40, i: true }],
        ck: [['فحص الـ Uplink على Core Switch', 1], ['تحديد سبب err-disabled', 1], ['تفعيل BPDU Guard على بورتات الدور 3', 0]], wl: [[35, 'فحص Switch وتتبع الـ loop', 'a2']] },
      { title: 'اشتباه في رسالة Phishing وصلت لقسم الحسابات', type: 'incident', cat: 'c7', i: 2, u: 1, st: 'progress', a: 'a5', age: 400, fr: 380, tags: ['phishing', 'email'], req: R('محمود رشاد', 'm.rashad@example.com', 'الحسابات'),
        desc: 'وصلت رسالة لـ 4 موظفين في الحسابات تطلب تحديث بيانات حساب البنك عبر رابط. موظف واحد ضغط على الرابط ولم يدخل بيانات.', cm: [{ a: 'a5', b: 'من فضلك ابعتلي الرسالة كمرفق .eml ومتمسحهاش.', age: 380 }] },
      { title: 'طابعة HR لا تطبع — Paper jam متكرر', type: 'incident', cat: 'c5', i: 3, u: 2, st: 'new', a: null, age: 300, asset: 'as2', tags: ['printer'], req: R('نهى سامي', 'noha.s@example.com', 'HR'), desc: 'الطابعة بتعمل Paper jam كل 5 ورقات تقريباً حتى بعد تغيير الورق.' },
      { title: 'إنشاء حساب بريد لموظف جديد — قسم المبيعات', type: 'request', cat: 'c6', i: 3, u: 2, st: 'new', a: 'a3', age: 60, tags: ['onboarding', 'm365'], req: R('سارة إبراهيم', 'sara.i@example.com', 'المبيعات'), desc: 'الموظف: يوسف طارق — Sales Executive\nيبدأ الأحد القادم.\nمطلوب: بريد + Teams + صلاحية على CRM.',
        ck: [['إنشاء المستخدم في AD', 0], ['تعيين رخصة Microsoft 365 Business Standard', 0], ['إضافته لمجموعة Sales', 0], ['صلاحية CRM', 0]] },
      { title: 'الـ VPN بيفصل كل 10 دقايق من البيت', type: 'incident', cat: 'c4', i: 2, u: 2, st: 'pending', a: 'a2', age: 1300, fr: 1250, pausedAt: 200, tags: ['vpn', 'remote'], req: R('رامي فتحي', 'rami.f@example.com', 'IT Projects'), desc: 'FortiClient بيفصل كل 10 دقايق تقريباً من وقت ما غيرت الراوتر في البيت.',
        cm: [{ a: 'a2', b: 'جرب تعطل Power saving لكارت الشبكة وتغير MTU لـ 1400 وبلغني بالنتيجة.', age: 200 }] },
      { title: 'Outlook لا يقوم بعمل Sync للـ Shared Mailbox', type: 'incident', cat: 'c3', i: 2, u: 2, st: 'progress', a: 'a3', age: 1600, fr: 1500, tags: ['outlook', 'm365'], req: R('دينا وليد', 'dina.w@example.com', 'خدمة العملاء'), desc: 'صندوق support@ المشترك متوقف عن التحديث على Outlook من امبارح. على OWA شغال عادي.', wl: [[45, 'إعادة إنشاء OST وفحص الصلاحيات', 'a3']] },
      { title: 'تثبيت Microsoft Project لمدير المشروعات', type: 'request', cat: 'c2', i: 3, u: 3, st: 'progress', a: 'a4', age: 2000, fr: 1900, tags: ['software', 'license'], req: R('خالد منصور', 'khaled.m@example.com', 'المشروعات'), desc: 'مطلوب Microsoft Project Plan 3 — تم اعتماد الرخصة من المدير المالي.' },
      { title: 'لابتوب LAP-0012 بطيء جداً عند الإقلاع', type: 'incident', cat: 'c1', i: 3, u: 1, st: 'resolved', a: 'a1', age: 3000, fr: 2950, res: 2000, asset: 'as1', csat: 5, tags: ['performance'], req: R('سارة إبراهيم', 'sara.i@example.com', 'المبيعات'), desc: 'الجهاز بياخد 8 دقايق علشان يفتح.',
        cm: [{ a: 'a1', b: 'تم تعطيل برامج الـ Startup غير الضرورية وتحديث BIOS والتعريفات. وقت الإقلاع بقى أقل من دقيقة.', age: 2000 }], wl: [[50, 'Startup cleanup + BIOS update', 'a1']] },
      { title: 'تغيير كلمة سر شبكة Wi-Fi الضيوف', type: 'change', cat: 'c4', i: 3, u: 3, st: 'resolved', a: 'a2', age: 4300, fr: 4200, res: 3900, csat: 4, tags: ['wifi'], req: R('هالة مصطفى', 'hala.m@example.com', 'الإدارة'), desc: 'تغيير ربع سنوي لكلمة سر Guest Wi-Fi.' },
      { title: 'فشل الـ Backup الليلي لسيرفر الملفات', type: 'incident', cat: 'c8', i: 1, u: 2, st: 'resolved', a: 'a3', age: 5000, fr: 4970, res: 4400, asset: 'as5', tags: ['backup'], req: R('IT Monitoring', 'alerts@example.com', 'IT'), desc: 'Job الـ Backup فشل برسالة: VSS snapshot creation failed.', wl: [[90, 'إصلاح VSS writers وإعادة تشغيل الـ job', 'a3']] },
      { title: 'كاميرا مدخل المخزن لا تسجل', type: 'incident', cat: 'c9', i: 2, u: 2, st: 'new', a: null, age: 30, asset: 'as6', tags: ['cctv'], req: R('أمن المخزن', 'security@example.com', 'الأمن'), desc: 'الكاميرا رقم 7 ظاهرة Live بس مفيش تسجيل من يومين.' },
      { title: 'صلاحية دخول على فولدر المالية', type: 'request', cat: 'c6', i: 3, u: 3, st: 'closed', a: 'a3', age: 9000, fr: 8900, res: 8000, closed: 6000, csat: 5, tags: ['access'], req: R('محمود رشاد', 'm.rashad@example.com', 'الحسابات'), desc: 'مطلوب صلاحية Read فقط على \\\\FS01\\Finance\\Reports' },
      { title: 'Problem: انقطاع الشبكة يومياً الساعة 9 صباحاً', type: 'problem', cat: 'c4', i: 1, u: 3, st: 'progress', a: 'a2', age: 700, fr: 690, tags: ['rca', 'network'], req: R('IT', 'it@example.com', 'IT'), desc: 'تحليل السبب الجذري لتكرار انقطاعات الشبكة في بداية يوم العمل. مرتبط ببلاغ الدور الثالث.' },
      { title: 'Change: تحديث FortiOS على الـ Firewall إلى 7.4.x', type: 'change', cat: 'c7', i: 1, u: 3, st: 'progress', a: 'a5', age: 200, fr: 190, asset: 'as4', tags: ['firmware', 'maintenance-window'], req: R('IT', 'it@example.com', 'IT'), desc: 'تحديث مجدول خارج ساعات العمل. مطلوب Backup للإعدادات و Rollback plan.',
        ck: [['Backup لملف الإعدادات', 1], ['مراجعة Release notes و Upgrade path', 1], ['إبلاغ المستخدمين بموعد التوقف', 0], ['التنفيذ في نافذة الصيانة', 0], ['اختبار VPN و Policies بعد التحديث', 0]] },
      { title: 'شاشة إضافية للمحاسب', type: 'request', cat: 'c1', i: 3, u: 3, st: 'resolved', a: 'a4', age: 7000, fr: 6900, res: 6000, csat: 3, tags: ['hardware'], req: R('محمود رشاد', 'm.rashad@example.com', 'الحسابات'), desc: 'طلب شاشة 24 بوصة إضافية.' },
      { title: 'الموظف غير قادر على الدخول على الـ ERP', type: 'incident', cat: 'c2', i: 2, u: 1, st: 'new', a: null, age: 70, tags: ['erp', 'login'], req: R('علا جمال', 'ola.g@example.com', 'المشتريات'), desc: 'رسالة: Invalid session. حاولت من متصفحين مختلفين.' }];
    const extra = [['تعريف طابعة على جهاز جديد', 'c5', 'a4', 1300, 5], ['إضافة مستخدم لمجموعة Teams', 'c3', 'a3', 2600, 5], ['ماوس لاسلكي لا يعمل', 'c1', 'a1', 5300, 4], ['تفعيل Office على جهاز', 'c2', 'a4', 8500, 5], ['نسيان كلمة مرور الويندوز', 'c6', 'a1', 11600, 4], ['مشكلة صوت في اجتماعات Teams', 'c3', 'a3', 14400, 3], ['فتح بورت على الـ Firewall لنظام الحضور', 'c4', 'a2', 17300, null]];
    extra.forEach(e => T.push({ title: e[0], type: 'request', cat: e[1], i: 3, u: 2, st: 'closed', a: e[2], age: e[3] + 180, fr: e[3] + 150, res: e[3], closed: e[3] - 3 * 1440 > 0 ? e[3] - 3 * 1440 : e[3] - 60, csat: e[4], tags: [], req: R('موظف', 'user@example.com', '—'), desc: 'تذكرة تجريبية مكتملة.' }));
    if (lang === 'en') {
      s.agents.forEach((a, i) => { a.name = EN.agents[i]; });
      s.assets.forEach((a, i) => { a.user = EN.assets[i][0]; a.location = EN.assets[i][1]; a.notes = EN.assetNotes[i]; });
      s.assets[8].disposal.note = EN.disposalNote;
      s.plans.forEach((p, i) => { p.title = EN.plans[i][0]; p.desc = EN.plans[i][1]; p.checklist = EN.plans[i][2].slice(); });
      s.kb.forEach((k, i) => { k.title = EN.kb[i][0]; k.body = EN.kb[i][1]; });
      T.forEach((o, i) => {
        const e = EN.tickets[i];
        if (!e) { o.title = EN.extra[i - EN.tickets.length]; o.desc = EN.extraDesc; o.req = R(EN.employee, o.req.email, '—'); return; }
        o.title = e.title; o.desc = e.desc; o.req = R(e.req[0], o.req.email, e.req[1]);
        (o.cm || []).forEach((c, k) => { c.b = e.cm[k]; });
        (o.ck || []).forEach((c, k) => { c[0] = e.ck[k]; });
        (o.wl || []).forEach((w, k) => { w[1] = e.wl[k]; });
      });
    }
    T.forEach(o => {
      const created = n - o.age * MIN, cat = s.categories.find(c => c.id === o.cat);
      const tk = { id: uid(), key: s.settings.prefix + '-' + (s.settings.nextNo++), title: o.title, desc: o.desc || '', type: o.type, status: o.st, impact: o.i, urgency: o.u, priority: prio(o.i, o.u),
        categoryId: o.cat, teamId: cat.team, assigneeId: o.a, requester: o.req, tags: o.tags || [], assetId: o.asset || '', createdAt: created, updatedAt: created,
        firstResponseAt: o.fr != null ? n - o.fr * MIN : null, resolvedAt: o.res != null ? n - o.res * MIN : null, closedAt: o.closed != null ? n - o.closed * MIN : null,
        pausedMs: 0, pausedAt: o.pausedAt != null ? n - o.pausedAt * MIN : null, csat: o.csat || null, comments: [], worklogs: [], checklist: [], links: [],
        activity: [{ at: created, by: 'system', k: 'created' }] };
      if (o.a) tk.activity.push({ at: created + MIN, by: 'system', k: 'autoassign', v: o.a });
      (o.cm || []).forEach(c => tk.comments.push({ id: uid(), by: c.a, kind: c.i ? 'internal' : 'reply', body: c.b, at: n - c.age * MIN }));
      (o.ck || []).forEach(c => tk.checklist.push({ id: uid(), text: c[0], done: !!c[1] }));
      (o.wl || []).forEach(w => tk.worklogs.push({ id: uid(), by: w[2], min: w[0], note: w[1], at: created + 20 * MIN }));
      if (o.res != null) tk.activity.push({ at: tk.resolvedAt, by: o.a, k: 'status', f: 'progress', v: 'resolved' });
      if (o.closed != null) tk.activity.push({ at: tk.closedAt, by: 'system', k: 'autoclose' });
      tk.updatedAt = Math.max(created, ...tk.comments.map(c => c.at), tk.resolvedAt || 0, tk.closedAt || 0);
      s.tickets.push(tk);
    });
    const t1 = s.tickets[0], t13 = s.tickets[12]; t1.links.push(t13.id); t13.links.push(t1.id);
    migrateRequesters(s, n);
    { const sara = s.requesters.find(r => r.email === 'sara.i@example.com'); if (sara) { s.assets[0].requesterId = sara.id; s.assets[0].user = ''; } }
    runMaintenance(s, n); // the backup restore test is due today → one preventive ticket in the demo
    return s;
  }

  /* ---------- display translation of the built-in default and demo texts ----------
   * Data created at setup (categories, canned replies, demo tickets, names, assets, KB) is stored in the
   * setup language. demoMap() pairs every built-in Arabic text with its English version (both directions),
   * so each user can SEE it in their own language without the stored data changing. Only exact matches of
   * built-in texts are translated; anything a user typed is never touched. Ids/emails/keys are never mapped. */
  const TEXT_KEYS = new Set(['name', 'title', 'desc', 'body', 'text', 'note', 'notes', 'user', 'location', 'dept', 'checklist']);
  let _dm = null;
  function demoMap() {
    if (_dm) return _dm;
    const t = 0, ar = seed(t, 'ar'), en = seed(t, 'en');
    const toEn = new Map(), toAr = new Map();
    const walk = (x, y, key) => {
      if (typeof x === 'string' && typeof y === 'string') { if (TEXT_KEYS.has(key) && x !== y && x && y) { toEn.set(x, y); toAr.set(y, x); } return; }
      if (x && y && typeof x === 'object' && typeof y === 'object') for (const k in x) if (k in y) walk(x[k], y[k], Array.isArray(x) ? key : k);
    };
    walk(ar, en, '');
    _dm = { en: toEn, ar: toAr };
    return _dm;
  }
  /** Returns `v` in `lang` when it is a built-in text, otherwise `v` unchanged. */
  function demoText(v, lang) { if (typeof v !== 'string') return v; const m = demoMap()[lang === 'en' ? 'en' : 'ar']; return m.get(v) || v; }
  /** Translates built-in texts inside an object tree in place (text fields only). */
  function localize(obj, lang) {
    const m = demoMap()[lang === 'en' ? 'en' : 'ar'];
    const walk = (o, depth, pk) => {
      if (!o || typeof o !== 'object' || depth > 8) return;
      const arr = Array.isArray(o);
      for (const k in o) {
        const v = o[k], key = arr ? pk : k;
        if (typeof v === 'string') { if (TEXT_KEYS.has(key)) { const r = m.get(v); if (r) o[k] = r; } }
        else if (v && typeof v === 'object') walk(v, depth + 1, key);
      }
    };
    walk(obj, 0, ''); return obj;
  }

  const api = { MIN, HR, DAY, demoMap, demoText, localize, STATUSES, TYPES, KINDS, ASSET_STATUSES, ASSET_CRIT, DISPOSAL_METHODS, PM_TYPES, MATRIX, EMAIL_RE, ID_RE,
    dateStr, addDays, daysBetween, todayIn, planTargets, runMaintenance, assetStats, warranty, cleanHistory,
    uid, prio, isOpen, pol, resDue, respDue, sla, resp, logA, setStatus, setAssignee, openLoad, autoPick,
    cleanTicketData, newTicket, applyOp, autoClose, cleanEntity, inUse, cleanSettings, cleanSla, cleanCalendar, cleanPortal, defaults, seed, err,
    DEFAULT_CAL, businessAdd, businessBetween, wall, localToUtc, resolveRequester, linkRequester, migrateRequesters, token };
  root.ITCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
