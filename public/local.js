/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * IT Set Desk — local backend for the Offline edition.
 * Implements the same /api/* contract as server.js on top of core.js and localStorage, so the Offline
 * edition runs the exact same UI code (app.js). Loaded only by the offline build (window.ITSET_OFFLINE).
 * Server-only features (logins, live updates, attachments, email, portal, audit, backups) report
 * 'offline_unsupported' and are hidden by the UI through the features flags.
 */
(function () {
  'use strict';
  if (!window.ITSET_OFFLINE) return;
  const C = window.ITCore;
  const KEY = 'itset.sd.offline.v3', OLD_KEY = 'itset.servicedesk.v1', PREFS_KEY = 'itset.sd.prefs';
  const COLLS = ['teams', 'agents', 'categories', 'assets', 'kb', 'canned', 'tickets', 'requesters', 'plans'];
  const TRASHABLE = ['tickets', 'assets', 'kb'], EDITABLE = ['assets', 'kb', 'requesters', 'teams', 'categories', 'canned', 'agents', 'plans'];
  const TRASH_DAYS = 30;
  const now = () => Date.now();
  const clone = o => JSON.parse(JSON.stringify(o));
  const E = (code, status) => ({ code, status: status || 400 });
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } };

  function normalize(s) {
    const d = C.defaults();
    const cur = Object.assign({}, d.settings, s.settings || {});
    let settings; try { settings = C.cleanSettings(cur, {}); } catch (e) { settings = d.settings; }
    let sla; try { sla = C.cleanSla(s.sla); } catch (e) { sla = d.sla; }
    const out = { version: 3, demo: !!s.demo, settings, sla, trash: Array.isArray(s.trash) ? s.trash : [], prefs: s.prefs || {} };
    COLLS.forEach(c => { out[c] = Array.isArray(s[c]) ? s[c] : (c === 'requesters' || c === 'plans' ? [] : d[c] || []); });
    if (!out.teams.length) out.teams = d.teams;
    const maxNo = out.tickets.reduce((m, t) => Math.max(m, +(String(t.key).match(/(\d+)$/) || [0, 0])[1]), 0);
    out.settings.nextNo = Math.max(+out.settings.nextNo || 1001, maxNo + 1);
    out.tickets.forEach(t => { t.comments = t.comments || []; t.worklogs = t.worklogs || []; t.checklist = t.checklist || []; t.links = t.links || []; t.activity = t.activity || []; });
    C.migrateRequesters(out, now());
    const me = s.me || (s.settings && s.settings.me);
    out.me = out.agents.some(a => a.id === me) ? me : (out.agents[0] && out.agents[0].id) || null;
    if (!out.me) { const a = { id: C.uid(), name: 'Admin', email: 'admin@local.invalid', team: out.teams[0].id, active: true }; out.agents.push(a); out.me = a.id; }
    return out;
  }
  function load() {
    const raw = get(KEY);
    if (raw) { try { return normalize(JSON.parse(raw)); } catch (e) { console.warn('offline data unreadable, starting from demo', e); } }
    const old = get(OLD_KEY);
    if (old) {
      try {
        const o = JSON.parse(old); const s = normalize(o);
        if (!get(PREFS_KEY) && o.settings) set(PREFS_KEY, JSON.stringify({ lang: o.settings.lang === 'en' ? 'en' : 'ar', theme: o.settings.theme || 'system' }));
        console.info('Migrated', s.tickets.length, 'tickets from the previous offline version');
        return s;
      } catch (e) { console.warn('old offline data unreadable', e); }
    }
    let lang = 'ar'; try { const pf = JSON.parse(get(PREFS_KEY) || '{}'); if (pf.lang === 'en') lang = 'en'; else if (!pf.lang && /^en/i.test((typeof navigator !== 'undefined' && navigator.language) || '')) lang = 'en'; } catch (e) { /* default ar */ }
    const s = normalize(Object.assign(C.seed(now(), lang), { demo: true }));
    s.me = 'a1'; return s;
  }
  let S = load();
  let storageOk = set(KEY, JSON.stringify(S));
  function save() { storageOk = set(KEY, JSON.stringify(S)); if (!storageOk) throw E('storage', 507); }

  const publicAgents = () => S.agents.map(a => Object.assign({}, a, { role: 'admin', hasLogin: false }));
  function state(withTrash) {
    const st = { settings: S.settings, sla: S.sla, demo: S.demo, teams: S.teams, agents: publicAgents(), categories: S.categories, assets: S.assets, kb: S.kb, canned: S.canned, tickets: S.tickets, requesters: S.requesters, plans: S.plans };
    if (withTrash) { st.trash = S.trash; st.trashDays = TRASH_DAYS; }
    return st;
  }
  function housekeeping() {
    let changed = C.autoClose(S, now()).length > 0;
    if (C.runMaintenance(S, now()).plans.length) changed = true;
    const old = S.trash.filter(x => now() - x.deletedAt > TRASH_DAYS * C.DAY);
    if (old.length) { purge(old); changed = true; }
    if (changed) { try { save(); } catch (e) { /* surfaced on next write */ } }
  }
  function moveToTrash(coll, item) {
    const tr = { id: coll + ':' + item.id, coll, item, deletedAt: now(), deletedBy: S.me };
    S[coll] = S[coll].filter(o => o.id !== item.id);
    S.trash = S.trash.filter(x => x.id !== tr.id).concat([tr]);
    return tr;
  }
  function purge(list) {
    const ids = new Set(list.map(x => x.id)), gone = new Set(list.filter(x => x.coll === 'tickets').map(x => x.item.id));
    S.trash = S.trash.filter(x => !ids.has(x.id));
    if (gone.size) S.tickets.forEach(t => { t.links = t.links.filter(l => !gone.has(l)); });
  }
  function syncRequester(r) { S.tickets.forEach(t => { if (t.requesterId === r.id) t.requester = { name: r.name, email: r.email, dept: r.dept }; }); }
  const wrap = fn => { try { return fn(); } catch (e) { if (e && e.code) throw { code: e.code, status: e.status || 400 }; throw e; } };

  const routes = [
    ['GET', /^\/api\/bootstrap$/, () => {
      housekeeping();
      return { me: { id: S.me, role: 'admin', prefs: Object.assign({ email: false, lang: null }, S.prefs) }, state: state(true), serverTime: now(), version: '3.4.0', license: { product: 'IT Set Desk', licensee: '', edition: 'offline' },
        notifications: { items: [], unread: 0 }, mail: { enabled: false, links: false }, limits: { maxUploadMB: 0, maxFiles: 0 },
        features: { server: false, auth: false, live: false, attachments: false, portal: false, audit: false, backups: false, apiTokens: false }, storageOk };
    }],
    ['POST', /^\/api\/local\/me$/, b => { if (!S.agents.some(a => a.id === b.id)) throw E('not_found', 404); S.me = b.id; save(); return { ok: true }; }],
    ['PUT', /^\/api\/me\/prefs$/, b => { if ('lang' in b) S.prefs.lang = b.lang === 'en' ? 'en' : b.lang === 'ar' ? 'ar' : null; save(); return { prefs: Object.assign({ email: false }, S.prefs) }; }],
    ['GET', /^\/api\/notifications$/, () => ({ items: [], unread: 0 })],
    ['POST', /^\/api\/notifications\/read$/, () => ({ items: [], unread: 0 })],
    ['POST', /^\/api\/tickets$/, b => {
      const d = clone(b); C.linkRequester(S, d, now());
      const x = C.newTicket(S, d, S.me, now()); S.tickets.push(x); save(); return { ticket: x };
    }],
    ['POST', /^\/api\/tickets\/([^/]+)\/ops$/, (b, m) => {
      const ops = Array.isArray(b.ops) ? b.ops : []; if (!ops.length || ops.length > 20) throw E('bad_op');
      const orig = S.tickets.find(t => t.id === m[1]); if (!orig) throw E('not_found', 404);
      const ids = new Set([orig.id]); ops.forEach(o => { if (o && typeof o.other === 'string') ids.add(o.other); });
      const clones = new Map(); ids.forEach(id => { const t = S.tickets.find(z => z.id === id); if (t) clones.set(id, clone(t)); });
      const work = Object.assign({}, S, { tickets: S.tickets.map(t => clones.get(t.id) || t) });
      const x = clones.get(orig.id); const touched = new Map();
      for (const op of ops) { if (op && op.op === 'edit' && op.data) C.linkRequester(S, op.data, now()); C.applyOp(work, x, op, S.me, now(), true).forEach(t => touched.set(t.id, t)); }
      S.tickets = S.tickets.map(t => touched.get(t.id) || t); save();
      return { tickets: [...touched.values()] };
    }],
    ['DELETE', /^\/api\/tickets\/([^/]+)$/, (b, m) => { const t = S.tickets.find(x => x.id === m[1]); if (!t) throw E('not_found', 404); const tr = moveToTrash('tickets', t); save(); return { ok: true, trash: tr }; }],
    ['PUT', /^\/api\/c\/([^/]+)\/([^/]+)$/, (b, m) => {
      const coll = m[1], id = decodeURIComponent(m[2]); if (!EDITABLE.includes(coll)) throw E('bad_coll', 404);
      const before = S[coll].find(o => o.id === id);
      const item = C.cleanEntity(S, coll, Object.assign({}, b, { id }), { by: S.me, now: now() });
      if (coll === 'requesters' && before && before.createdAt) item.createdAt = before.createdAt;
      if (coll === 'agents' && id === S.me && !item.active) throw E('self');
      const i = S[coll].findIndex(o => o.id === id); if (i >= 0) S[coll][i] = item; else S[coll].push(item);
      if (coll === 'requesters' && before) syncRequester(item);
      save(); return { item: coll === 'agents' ? Object.assign({}, item, { role: 'admin', hasLogin: false }) : item };
    }],
    ['DELETE', /^\/api\/c\/([^/]+)\/([^/]+)$/, (b, m) => {
      const coll = m[1], id = decodeURIComponent(m[2]); if (!EDITABLE.includes(coll)) throw E('bad_coll', 404);
      const it = S[coll].find(o => o.id === id); if (!it) throw E('not_found', 404);
      if (coll === 'agents' && id === S.me) throw E('self');
      if (C.inUse(S, coll, id)) throw E('in_use', 409);
      if (TRASHABLE.includes(coll)) { const tr = moveToTrash(coll, it); save(); return { ok: true, trashed: true, trash: tr }; }
      S[coll] = S[coll].filter(o => o.id !== id); save(); return { ok: true };
    }],
    ['POST', /^\/api\/plans\/([^/]+)\/run$/, (b, m) => {
      const id = decodeURIComponent(m[1]); if (!S.plans.some(p => p.id === id)) throw E('not_found', 404);
      const r = C.runMaintenance(S, now(), { planId: id, force: true }); save();
      return { created: r.created.map(t => t.key), skipped: r.plans[0] ? r.plans[0].lastRun.skipped : 0, plan: r.plans[0] || null };
    }],
    ['PUT', /^\/api\/settings$/, b => {
      const settings = b.settings ? C.cleanSettings(S.settings, b.settings) : S.settings;
      const sla = b.sla ? C.cleanSla(b.sla) : S.sla;
      S.settings = settings; S.sla = sla; C.autoClose(S, now()); save(); return { settings, sla };
    }],
    ['POST', /^\/api\/trash\/([^/]+)\/restore$/, (b, m) => {
      const tid = decodeURIComponent(m[1]); const tr = S.trash.find(x => x.id === tid); if (!tr) throw E('not_found', 404);
      const coll = tr.coll; let item = clone(tr.item);
      if (S[coll].some(o => o.id === item.id)) throw E('exists', 409);
      if (coll === 'tickets') {
        let k = S.categories.find(c => c.id === item.categoryId); if (!k) { k = S.categories[0]; if (!k) throw E('v_cat'); item.categoryId = k.id; }
        item.teamId = k.team;
        if (item.assigneeId && !S.agents.some(a => a.id === item.assigneeId)) item.assigneeId = null;
        if (item.assetId && !S.assets.some(a => a.id === item.assetId)) item.assetId = '';
        item.links = (item.links || []).filter(l => S.tickets.some(t => t.id === l));
        C.logA(item, 'restored', S.me, now());
      } else item = C.cleanEntity(S, coll, item, { trusted: true });
      S.trash = S.trash.filter(x => x.id !== tr.id); S[coll].push(item); save();
      return { coll, item };
    }],
    ['DELETE', /^\/api\/trash\/([^/]+)$/, (b, m) => { const tid = decodeURIComponent(m[1]); const tr = S.trash.find(x => x.id === tid); if (!tr) throw E('not_found', 404); purge([tr]); save(); return { ok: true }; }],
    ['DELETE', /^\/api\/trash$/, () => { const n = S.trash.length; purge(S.trash.slice()); save(); return { ok: true, purged: n }; }],
    ['POST', /^\/api\/requesters\/([^/]+)\/merge$/, (b, m) => {
      const into = S.requesters.find(r => r.id === decodeURIComponent(m[1])), from = S.requesters.find(r => r.id === b.from);
      if (!into || !from || into.id === from.id) throw E('not_found', 404);
      let n = 0; S.tickets.forEach(t => { if (t.requesterId === from.id) { t.requesterId = into.id; t.requester = { name: into.name, email: into.email, dept: into.dept }; n++; } });
      S.requesters = S.requesters.filter(r => r.id !== from.id); save(); return { ok: true, moved: n };
    }],
    ['GET', /^\/api\/export$/, () => {
      const st = clone(state(false)); st.agents = st.agents.map(a => { delete a.role; delete a.hasLogin; return a; });
      return Object.assign({ version: 1, exportedAt: new Date().toISOString(), app: 'itset-servicedesk', serverVersion: 'offline' }, st);
    }],
    ['POST', /^\/api\/import$/, b => {
      const ok = b && b.version === 1 && ['tickets', 'agents', 'teams', 'categories'].every(k => Array.isArray(b[k])) && b.settings && b.sla
        && b.tickets.every(x => x && typeof x.id === 'string' && typeof x.key === 'string' && C.STATUSES.includes(x.status) && Array.isArray(x.activity));
      if (!ok) throw E('importBad');
      const keepMe = S.me; const next = normalize(Object.assign({}, b, { trash: [], prefs: S.prefs, me: keepMe }));
      (next.tickets || []).forEach(t => { t.attachments = []; }); // files are not part of a JSON export
      S = next; save(); return { ok: true, tickets: S.tickets.length };
    }]
  ];

  window.ITSET_LOCAL = {
    async handle(method, url, body) {
      const path = String(url).split('?')[0];
      for (const [m, re, fn] of routes) {
        if (m !== method) continue; const mt = path.match(re); if (!mt) continue;
        const out = wrap(() => fn(body ? clone(body) : {}, mt));
        return clone(out);
      }
      throw E('offline_unsupported', 404);
    }
  };
})();
