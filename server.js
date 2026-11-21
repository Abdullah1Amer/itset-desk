'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * IT Set Desk — Team Server
 * Zero-dependency Node.js (>= 22.13) server: REST API + SQLite (node:sqlite) + session auth + Server-Sent Events.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { promisify } = require('node:util');
const { DatabaseSync } = require('node:sqlite');
const C = require('./public/core.js');
const B = require('./backup.js');
const { AttachmentStore, sniffImage, cleanName, isBlocked } = require('./lib/attachments.js');
const { Mailer } = require('./lib/mailer.js');
const AUD = require('./lib/audit.js');

const VERSION = '3.4.0';
const PRODUCT = 'IT Set Desk';
const LICENSEE = String(process.env.LICENSEE || '').trim().slice(0, 120);
const PORT = +(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const COOKIE_SECURE = ['true', 'false', 'auto'].includes(process.env.COOKIE_SECURE) ? process.env.COOKIE_SECURE : 'auto';
const TRUSTED_PROXIES = String(process.env.TRUSTED_PROXIES || '').split(',').map(s => s.trim()).filter(Boolean);
const REAL_IP_HEADER = String(process.env.REAL_IP_HEADER || 'x-forwarded-for').toLowerCase();
const SESSION_HOURS = Math.max(1, +(process.env.SESSION_HOURS || 12));
const KEEP_BACKUPS = Math.max(1, +(process.env.KEEP_BACKUPS || 14));
const AUTO_BACKUP_HOURS = Math.max(0, +(process.env.AUTO_BACKUP_HOURS ?? 24));   // 0 = off
const TRASH_DAYS = Math.max(0, +(process.env.TRASH_DAYS ?? 30));                  // 0 = keep forever
const TRASHABLE = ['tickets', 'assets', 'kb'];
const MAX_UPLOAD_MB = Math.max(1, Math.min(100, +(process.env.MAX_UPLOAD_MB || 15)));
const MAX_ATTACH_PER_TICKET = 50;
const APP_URL = String(process.env.APP_URL || '').trim().replace(/\/+$/, '');
const SLA_WATCH_SECONDS = Math.max(1, +(process.env.SLA_WATCH_SECONDS || 60));
const NOTIF_DAYS = 60;
const AUDIT_DAYS = Math.max(0, +(process.env.AUDIT_DAYS ?? 365)); // 0 = keep forever
const PUB = path.join(__dirname, 'public');
const COOKIE = 'itset_sid';
const scrypt = promisify(crypto.scrypt);
const now = () => Date.now();
const log = (...a) => console.log(new Date().toISOString(), ...a);

/* ======================= database ======================= */
fs.mkdirSync(DATA_DIR, { recursive: true });
/* Open the database and refuse to run on a corrupted file instead of making it worse. */
function dbFatal(reason) {
  console.error(`\nDATABASE PROBLEM: ${reason}\nThe server will not start, so the data is not damaged further.\n` +
    `Fix: restore the latest backup from ${path.join(DATA_DIR, 'backups')} (README → Restore),\n` +
    `or set ALLOW_CORRUPT_DB=true to start anyway (not recommended).\n`);
  process.exit(1);
}
let db;
try {
  db = new DatabaseSync(path.join(DATA_DIR, 'servicedesk.db'));
  db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 5000;
  CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS ent (coll TEXT NOT NULL, id TEXT NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY (coll, id));
  CREATE TABLE IF NOT EXISTS creds (agent_id TEXT PRIMARY KEY, hash TEXT NOT NULL, role TEXT NOT NULL CHECK (role IN ('admin','agent')));
  CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, agent_id TEXT NOT NULL, expires INTEGER NOT NULL);
  CREATE INDEX IF NOT EXISTS sessions_agent ON sessions(agent_id);
  CREATE TABLE IF NOT EXISTS notifs (id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, at INTEGER NOT NULL, read INTEGER NOT NULL DEFAULT 0, data TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS notifs_agent ON notifs(agent_id, at);
  CREATE TABLE IF NOT EXISTS psessions (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, expires INTEGER NOT NULL);
  CREATE TABLE IF NOT EXISTS otps (email TEXT PRIMARY KEY, code_hash TEXT NOT NULL, expires INTEGER NOT NULL, tries INTEGER NOT NULL DEFAULT 0);
  CREATE TABLE IF NOT EXISTS apitokens (id TEXT PRIMARY KEY, agent_id TEXT NOT NULL, name TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE,
    scope TEXT NOT NULL CHECK (scope IN ('read','write')), created INTEGER NOT NULL, expires INTEGER NOT NULL, last_used INTEGER, last_ip TEXT);
  CREATE INDEX IF NOT EXISTS apitokens_agent ON apitokens(agent_id);
`);
  const qc = db.prepare('PRAGMA quick_check').get(); const v = qc && Object.values(qc)[0];
  if (v !== 'ok' && process.env.ALLOW_CORRUPT_DB !== 'true') dbFatal('integrity check failed: ' + v);
} catch (e) { dbFatal(e.message); }
const q = {
  put: db.prepare('INSERT INTO ent (coll,id,data,updated) VALUES (?,?,?,?) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data, updated=excluded.updated'),
  del: db.prepare('DELETE FROM ent WHERE coll=? AND id=?'),
  delColl: db.prepare('DELETE FROM ent WHERE coll=?'),
  all: db.prepare('SELECT coll, data FROM ent'),
  kvGet: db.prepare('SELECT v FROM kv WHERE k=?'),
  kvPut: db.prepare('INSERT INTO kv (k,v) VALUES (?,?) ON CONFLICT(k) DO UPDATE SET v=excluded.v'),
  credGet: db.prepare('SELECT agent_id, hash, role FROM creds WHERE agent_id=?'),
  credAll: db.prepare('SELECT agent_id, role FROM creds'),
  credCount: db.prepare('SELECT COUNT(*) AS n FROM creds'),
  adminCount: db.prepare("SELECT COUNT(*) AS n FROM creds WHERE role='admin'"),
  credPut: db.prepare('INSERT INTO creds (agent_id,hash,role) VALUES (?,?,?) ON CONFLICT(agent_id) DO UPDATE SET hash=excluded.hash, role=excluded.role'),
  credRole: db.prepare('UPDATE creds SET role=? WHERE agent_id=?'),
  credDel: db.prepare('DELETE FROM creds WHERE agent_id=?'),
  sessPut: db.prepare('INSERT INTO sessions (token_hash,agent_id,expires) VALUES (?,?,?)'),
  sessGet: db.prepare('SELECT agent_id, expires FROM sessions WHERE token_hash=?'),
  sessDel: db.prepare('DELETE FROM sessions WHERE token_hash=?'),
  sessDelAgent: db.prepare('DELETE FROM sessions WHERE agent_id=?'),
  sessDelAgentExcept: db.prepare('DELETE FROM sessions WHERE agent_id=? AND token_hash<>?'),
  sessPurge: db.prepare('DELETE FROM sessions WHERE expires<?'),
  pSessPut: db.prepare('INSERT INTO psessions (token_hash,email,expires) VALUES (?,?,?)'),
  pSessGet: db.prepare('SELECT email, expires FROM psessions WHERE token_hash=?'),
  pSessDel: db.prepare('DELETE FROM psessions WHERE token_hash=?'),
  pSessPurge: db.prepare('DELETE FROM psessions WHERE expires<?'),
  otpPut: db.prepare('INSERT INTO otps (email,code_hash,expires,tries) VALUES (?,?,?,0) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash, expires=excluded.expires, tries=0'),
  otpGet: db.prepare('SELECT code_hash, expires, tries FROM otps WHERE email=?'),
  otpTry: db.prepare('UPDATE otps SET tries=tries+1 WHERE email=?'),
  otpDel: db.prepare('DELETE FROM otps WHERE email=?'),
  otpPurge: db.prepare('DELETE FROM otps WHERE expires<?'),
  notifPut: db.prepare('INSERT INTO notifs (id,agent_id,at,read,data) VALUES (?,?,?,0,?)'),
  notifList: db.prepare('SELECT data, read FROM notifs WHERE agent_id=? ORDER BY at DESC LIMIT 50'),
  notifUnread: db.prepare('SELECT COUNT(*) AS n FROM notifs WHERE agent_id=? AND read=0'),
  notifRead: db.prepare('UPDATE notifs SET read=1 WHERE agent_id=? AND id=?'),
  notifReadAll: db.prepare('UPDATE notifs SET read=1 WHERE agent_id=?'),
  notifPurge: db.prepare('DELETE FROM notifs WHERE at<?'),
  notifDelAgent: db.prepare('DELETE FROM notifs WHERE agent_id=?'),
  tokPut: db.prepare('INSERT INTO apitokens (id,agent_id,name,token_hash,scope,created,expires) VALUES (?,?,?,?,?,?,?)'),
  tokByHash: db.prepare('SELECT id, agent_id, scope, expires FROM apitokens WHERE token_hash=?'),
  tokList: db.prepare('SELECT id, agent_id, name, scope, created, expires, last_used, last_ip FROM apitokens WHERE agent_id=? ORDER BY created DESC'),
  tokListAll: db.prepare('SELECT id, agent_id, name, scope, created, expires, last_used, last_ip FROM apitokens ORDER BY created DESC'),
  tokGet: db.prepare('SELECT id, agent_id, name, scope FROM apitokens WHERE id=?'),
  tokCount: db.prepare('SELECT COUNT(*) AS n FROM apitokens WHERE agent_id=?'),
  tokDel: db.prepare('DELETE FROM apitokens WHERE id=?'),
  tokDelAgent: db.prepare('DELETE FROM apitokens WHERE agent_id=?'),
  tokTouch: db.prepare('UPDATE apitokens SET last_used=?, last_ip=? WHERE id=?'),
  tokPurge: db.prepare('DELETE FROM apitokens WHERE expires<?'),
};
function tx(fn) {
  db.exec('BEGIN IMMEDIATE');
  try { const r = fn(); db.exec('COMMIT'); return r; }
  catch (e) { try { db.exec('ROLLBACK'); } catch (_) { /* ignore */ } throw e; }
}
const COLLS = ['teams', 'agents', 'categories', 'assets', 'kb', 'canned', 'tickets', 'requesters', 'plans'];
const putEnt = (coll, o) => q.put.run(coll, o.id, JSON.stringify(o), now());
const kvGet = k => { const r = q.kvGet.get(k); return r ? JSON.parse(r.v) : null; };
const kvPut = (k, v) => q.kvPut.run(k, JSON.stringify(v));

let S;
function loadState() {
  const d = C.defaults();
  const s = { settings: kvGet('settings') || d.settings, sla: kvGet('sla') || d.sla, demo: !!kvGet('demo') };
  COLLS.forEach(c => { s[c] = []; }); s.trash = [];
  for (const r of q.all.all()) if (s[r.coll]) s[r.coll].push(JSON.parse(r.data));
  return s;
}
S = loadState();
const store = new AttachmentStore(DATA_DIR, { cleanTmp: true });
const mailer = new Mailer({
  host: process.env.SMTP_HOST || '', port: +(process.env.SMTP_PORT || 0), secure: ['tls', 'starttls', 'none'].includes(process.env.SMTP_SECURE) ? process.env.SMTP_SECURE : 'starttls',
  user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '', from: process.env.SMTP_FROM || '', insecure: process.env.SMTP_TLS_INSECURE === 'true'
}, (...a) => log(...a));
AUD.ensureAuditTable(db);
/** Writes an audit row. ctx gives actor + IP; never throws into the request. */
function audit(ctx, action, target, detail, actorOverride) {
  try { AUD.appendAudit(db, { actor: actorOverride || (ctx && ctx.user ? ctx.user.id : '') || 'system', action, target, detail, ip: ctx && ctx.req ? clientIp(ctx.req) : '' }); }
  catch (e) { log('AUDIT WRITE FAILED', action, e.message); }
}
function diff(a, b, skip) {
  const out = {}; const keys = new Set([...Object.keys(a || {}), ...Object.keys(b || {})]);
  for (const k of keys) { if (skip && skip.includes(k)) continue; const x = JSON.stringify(a ? a[k] : null), y = JSON.stringify(b ? b[k] : null); if (x !== y) out[k] = [a ? a[k] ?? null : null, b ? b[k] ?? null : null]; }
  return out;
}
/* one-time upgrade: link tickets to requester entities and give every ticket a portal token */
{
  const m = C.migrateRequesters(S, Date.now());
  if (m.created.length || m.touched.length) {
    tx(() => { m.created.forEach(r => putEnt('requesters', r)); m.touched.forEach(t => putEnt('tickets', t)); });
    log('requesters migration:', m.created.length, 'requester(s) created,', m.touched.length, 'ticket(s) updated');
  }
}

/* ======================= helpers ======================= */
const roleMap = () => { const m = {}; for (const r of q.credAll.all()) m[r.agent_id] = r.role; return m; };
const publicAgent = (a, roles) => Object.assign({}, a, { role: roles[a.id] || null, hasLogin: !!roles[a.id] });
function publicState(role) {
  const roles = roleMap();
  const st = { settings: S.settings, sla: S.sla, demo: S.demo, teams: S.teams, agents: S.agents.map(a => publicAgent(a, roles)),
    categories: S.categories, assets: S.assets, kb: S.kb, canned: S.canned, tickets: S.tickets, requesters: S.requesters, plans: S.plans };
  if (role === 'admin') { st.trash = S.trash; st.trashDays = TRASH_DAYS; }
  return st;
}
const sha256 = t => crypto.createHash('sha256').update(t).digest('hex');
async function hashPw(pw) { const salt = crypto.randomBytes(16); const h = await scrypt(pw, salt, 32, { N: 16384, r: 8, p: 1 }); return `scrypt$${salt.toString('hex')}$${h.toString('hex')}`; }
async function verifyPw(pw, stored) {
  try {
    const [alg, s, h] = String(stored).split('$'); if (alg !== 'scrypt') return false;
    const hb = Buffer.from(h, 'hex'); const c = await scrypt(String(pw), Buffer.from(s, 'hex'), hb.length, { N: 16384, r: 8, p: 1 });
    return crypto.timingSafeEqual(hb, c);
  } catch (e) { return false; }
}
const DUMMY_HASH = 'scrypt$00000000000000000000000000000000$' + '0'.repeat(64);
function checkPw(pw) { if (typeof pw !== 'string' || pw.length < 8 || pw.length > 200) throw C.err('v_pw'); return pw; }
function httpErr(status, code) { const e = new Error(code); e.status = status; e.code = code; return e; }

/* ======================= sessions & rate limit ======================= */
function parseCookies(req) {
  const out = {}; const h = req.headers.cookie || '';
  h.split(';').forEach(p => { const i = p.indexOf('='); if (i > 0) out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); });
  return out;
}
/* ---- client address & proxy trust ----
 * X-Forwarded-* headers are honoured ONLY when the TCP peer is listed in TRUSTED_PROXIES
 * (exact IPv4/IPv6 or IPv4 CIDR). Anyone else sending them is ignored. */
const normIp = ip => String(ip || '').replace(/^::ffff:/, '');
const ip4n = a => a.split('.').reduce((s, o) => ((s << 8) + (+o)) >>> 0, 0);
const IP4 = /^\d{1,3}(\.\d{1,3}){3}$/;
function ipMatch(ip, rule) {
  if (!rule.includes('/')) return ip === normIp(rule);
  const [base, bitsS] = rule.split('/'); const bits = +bitsS;
  if (!IP4.test(ip) || !IP4.test(base) || !(bits >= 0 && bits <= 32)) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ip4n(ip) & mask) === (ip4n(base) & mask);
}
const fromTrustedProxy = req => TRUSTED_PROXIES.length > 0 && TRUSTED_PROXIES.some(r => ipMatch(normIp(req.socket.remoteAddress), r));
function clientIp(req) {
  const peer = normIp(req.socket.remoteAddress) || '?';
  if (!fromTrustedProxy(req)) return peer;
  const parts = String(req.headers[REAL_IP_HEADER] || '').split(',').map(s => s.trim()).filter(Boolean);
  return parts.length ? normIp(parts[parts.length - 1]) : peer; // right-most = added by our proxy
}
function isSecureReq(req) {
  if (COOKIE_SECURE === 'true') return true;
  if (COOKIE_SECURE === 'false') return false;
  return fromTrustedProxy(req) && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase() === 'https';
}
function cookieStr(req, val, maxAge) {
  return `${COOKIE}=${val}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isSecureReq(req) ? '; Secure' : ''}`;
}
function createSession(req, res, agentId) {
  const token = crypto.randomBytes(32).toString('base64url');
  q.sessPut.run(sha256(token), agentId, now() + SESSION_HOURS * 3600e3);
  res.setHeader('Set-Cookie', cookieStr(req, token, SESSION_HOURS * 3600));
  return sha256(token);
}
/* ---- API tokens (for the MCP server and scripts) ----
 * "Authorization: Bearer itsd_…". Stored as SHA-256 only and shown once at creation. A token acts as its agent
 * (same role) but is limited by its scope: 'read' = GET only. Tokens can never manage tokens, change passwords,
 * import/export data or touch backups. No cookie is involved, so the CSRF header is not needed. */
const TOKEN_RE = /^itsd_[A-Za-z0-9_-]{43}$/;
const TOKEN_BLOCKED = /^\/api\/(me\/tokens|tokens|me\/password|logout|login|setup|import|export|backups)(\/|$)/;
function bearer(req) { const h = String(req.headers.authorization || ''); return h.startsWith('Bearer ') ? h.slice(7).trim() : null; }
function tokenUser(req, tok) {
  if (!TOKEN_RE.test(tok)) return null;
  const r = q.tokByHash.get(sha256(tok)); if (!r || r.expires < now()) return null;
  const cred = q.credGet.get(r.agent_id); const a = S.agents.find(x => x.id === r.agent_id);
  if (!cred || !a || !a.active) return null;
  try { q.tokTouch.run(now(), clientIp(req), r.id); } catch (_) { /* best effort */ }
  return { id: a.id, role: cred.role, tokenHash: null, viaToken: true, scope: r.scope, tokenId: r.id };
}
function getUser(req) {
  const bt = bearer(req); if (bt !== null) return tokenUser(req, bt);
  const tok = parseCookies(req)[COOKIE]; if (!tok) return null;
  const th = sha256(tok); const s = q.sessGet.get(th);
  if (!s || s.expires < now()) { if (s) q.sessDel.run(th); return null; }
  const cred = q.credGet.get(s.agent_id); const a = S.agents.find(x => x.id === s.agent_id);
  if (!cred || !a || !a.active) return null;
  return { id: a.id, role: cred.role, tokenHash: th };
}
/* ---- login throttling ----
 * Per ACCOUNT: after 5 failures a progressive lock (30s, 1m, 2m, 4m, 8m, then 15m max). Resets on success
 * or after 1h without failures. Per IP: only a high ceiling (30 failures / 15 min) against password spraying,
 * so one person's typos behind a shared office NAT never lock everybody else out. */
const ACCT_FREE = 5, ACCT_MAX_LOCK = 15 * 60e3, IP_LIMIT = 30, IP_WINDOW = 15 * 60e3;
const acctFails = new Map(), ipFails = new Map();
function lockedErr(ms) { const e = httpErr(429, 'locked'); e.retryAfter = Math.ceil(ms / 1000); return e; }
function throttleCheck(ip, key) {
  const t = now(); const i = ipFails.get(ip), a = acctFails.get(key);
  if (i && i.until > t) throw lockedErr(i.until - t);
  if (a && a.until > t) throw lockedErr(a.until - t);
}
function throttleFail(ip, key) {
  const t = now();
  let i = ipFails.get(ip); if (!i || t - i.first > IP_WINDOW) i = { n: 0, first: t, until: 0 };
  i.n++; if (i.n >= IP_LIMIT) { i.until = t + IP_WINDOW; i.n = 0; i.first = t; } ipFails.set(ip, i);
  let a = acctFails.get(key); if (!a || t - a.last > 3600e3) a = { n: 0, until: 0, last: t };
  a.n++; a.last = t; if (a.n >= ACCT_FREE) a.until = t + Math.min(ACCT_MAX_LOCK, 30e3 * 2 ** (a.n - ACCT_FREE));
  acctFails.set(key, a);
  if (acctFails.size > 5000 || ipFails.size > 5000) purgeThrottle(true);
}
function purgeThrottle(force) {
  const t = now();
  for (const [k, a] of acctFails) if (force ? a.until < t : (a.until < t && t - a.last > 3600e3)) acctFails.delete(k);
  for (const [k, i] of ipFails) if (i.until < t && t - i.first > IP_WINDOW) ipFails.delete(k);
}

/* ---- first-run setup code ----
 * While no account exists, /api/setup requires a one-time code printed in the server log
 * (or SETUP_TOKEN from the environment). Stops whoever opens the page first from becoming admin. */
let SETUP_CODE = null;
function genSetupCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; const b = crypto.randomBytes(8);
  const s = Array.from(b, x => A[x % A.length]).join('');
  return s.slice(0, 4) + '-' + s.slice(4);
}
const normCode = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
function announceSetup() {
  if (q.credCount.get().n > 0) { SETUP_CODE = null; return; }
  const fromEnv = !!process.env.SETUP_TOKEN;
  SETUP_CODE = fromEnv ? process.env.SETUP_TOKEN : genSetupCode();
  const line = '='.repeat(64);
  console.log(`${line}\n  FIRST-RUN SETUP REQUIRED\n  SETUP CODE: ${fromEnv ? '(value of SETUP_TOKEN)' : SETUP_CODE}\n  Open the app in a browser and enter this code to create the admin account.\n${line}`);
}
function setupCodeOk(given) {
  if (!SETUP_CODE) return false;
  const a = crypto.createHash('sha256').update(normCode(given)).digest(), b = crypto.createHash('sha256').update(normCode(SETUP_CODE)).digest();
  return crypto.timingSafeEqual(a, b) && normCode(given).length > 0;
}

/* ======================= live events (SSE) ======================= */
const clients = new Set();
function broadcast(evt, adminOnly) {
  const s = `data: ${JSON.stringify(evt)}\n\n`;
  for (const c of clients) {
    if (adminOnly) { const cr = q.credGet.get(c.agentId); if (!cr || cr.role !== 'admin') continue; }
    try { c.res.write(s); } catch (e) { clients.delete(c); }
  }
}
function kickAgent(agentId) { for (const c of clients) if (c.agentId === agentId) { try { c.res.end(); } catch (e) { /* ignore */ } clients.delete(c); } }

/* ======================= HTTP plumbing ======================= */
const CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'";
function baseHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', CSP);
}
function send(res, status, obj, extra) {
  const body = JSON.stringify(obj);
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }, extra || {}));
  res.end(body);
}
function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(httpErr(413, 'too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(httpErr(400, 'bad_json')); }
    });
    req.on('error', reject);
  });
}
const STATIC = { '/': ['index.html', 'text/html; charset=utf-8'], '/index.html': ['index.html', 'text/html; charset=utf-8'], '/core.js': ['core.js', 'text/javascript; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'], '/styles.css': ['styles.css', 'text/css; charset=utf-8'], '/itset-core.css': ['itset-core.css', 'text/css; charset=utf-8'],
  '/portal': ['portal.html', 'text/html; charset=utf-8'], '/portal/': ['portal.html', 'text/html; charset=utf-8'], '/portal.js': ['portal.js', 'text/javascript; charset=utf-8'] };
const staticCache = {};
function serveStatic(res, p) {
  const [file, type] = STATIC[p];
  let buf = staticCache[file];
  if (!buf) { buf = fs.readFileSync(path.join(PUB, file)); if (process.env.NODE_ENV === 'production') staticCache[file] = buf; }
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' }); res.end(buf);
}

const routes = [];
const route = (m, pattern, auth, fn, limit, opts) => routes.push({ m, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), auth, fn, limit: limit || 2e6, raw: !!(opts && opts.raw) });
const HANDLED = Symbol('handled'); // a route that streamed its own response
function readRaw(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(httpErr(413, 'too_large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* ======================= API: setup & auth ======================= */
route('GET', '/api/status', 'none', () => ({ needsSetup: q.credCount.get().n === 0, version: VERSION, product: PRODUCT, licensee: LICENSEE }));

route('POST', '/api/setup', 'none', async (ctx) => {
  if (q.credCount.get().n > 0) throw httpErr(409, 'already_setup');
  const ip = clientIp(ctx.req); throttleCheck(ip, 'setup');
  const b = ctx.body;
  if (!setupCodeOk(b.setupCode)) { throttleFail(ip, 'setup'); log('setup rejected: wrong code from', ip); throw httpErr(403, 'bad_setup_code'); }
  const pw = checkPw(b.password);
  const setupLang = b.lang === 'en' ? 'en' : 'ar';
  const base = b.demo ? C.seed(now(), setupLang) : C.defaults(setupLang);
  const admin = { id: C.uid(), name: String(b.name || '').trim().slice(0, 60), email: String(b.email || '').trim().toLowerCase().slice(0, 120), team: base.teams[0].id, active: true };
  if (!admin.name) throw C.err('v_req');
  if (!C.EMAIL_RE.test(admin.email)) throw C.err('v_email');
  if (base.agents.some(a => a.email === admin.email)) throw C.err('dup_email');
  base.agents.push(admin);
  const hash = await hashPw(pw);
  tx(() => {
    db.exec('DELETE FROM ent; DELETE FROM kv; DELETE FROM sessions;');
    COLLS.forEach(c => base[c].forEach(o => putEnt(c, o)));
    kvPut('settings', base.settings); kvPut('sla', base.sla); kvPut('demo', !!b.demo);
    q.credPut.run(admin.id, hash, 'admin');
    kvPut('prefs:' + admin.id, { email: true, lang: setupLang });
  });
  S = loadState();
  SETUP_CODE = null; acctFails.delete('setup');
  runAutoClose();
  createSession(ctx.req, ctx.res, admin.id);
  log('setup completed by', admin.email, b.demo ? '(demo data)' : '');
  audit(ctx, 'auth.setup', admin.email, { demo: !!b.demo, lang: setupLang }, admin.id);
  return { ok: true };
});

route('POST', '/api/login', 'none', async (ctx) => {
  const ip = clientIp(ctx.req);
  const email = String(ctx.body.email || '').trim().toLowerCase().slice(0, 120), pw = String(ctx.body.password || '');
  throttleCheck(ip, 'acct:' + email);
  const a = S.agents.find(x => x.email.toLowerCase() === email);
  const cred = a ? q.credGet.get(a.id) : null;
  const ok = await verifyPw(pw, cred ? cred.hash : DUMMY_HASH);
  if (!a || !cred || !ok || !a.active) { throttleFail(ip, 'acct:' + email); log('login failed', email, ip); audit(ctx, 'auth.login_failed', email, null, '-'); throw httpErr(401, 'bad_login'); }
  acctFails.delete('acct:' + email);
  createSession(ctx.req, ctx.res, a.id);
  log('login', email, ip); audit(ctx, 'auth.login', email, null, a.id);
  return { ok: true };
});

route('POST', '/api/logout', 'none', (ctx) => {
  const u = getUser(ctx.req); if (u) audit(ctx, 'auth.logout', '', null, u.id);
  const tok = parseCookies(ctx.req)[COOKIE]; if (tok) q.sessDel.run(sha256(tok));
  ctx.res.setHeader('Set-Cookie', cookieStr(ctx.req, '', 0));
  return { ok: true };
});

route('GET', '/api/bootstrap', 'user', (ctx) => ({
  me: { id: ctx.user.id, role: ctx.user.role, prefs: prefsOf(ctx.user.id) }, state: publicState(ctx.user.role), serverTime: now(), version: VERSION,
  notifications: notifPayload(ctx.user.id), mail: { enabled: mailer.enabled, links: !!APP_URL }, limits: { maxUploadMB: MAX_UPLOAD_MB, maxFiles: MAX_ATTACH_PER_TICKET },
  license: { product: PRODUCT, licensee: LICENSEE, edition: 'team' },
  features: { server: true, auth: true, live: true, attachments: true, portal: true, audit: true, backups: true, apiTokens: true }
}));

/* ---- API tokens management (browser session only; tokens cannot manage tokens) ---- */
const tokOut = r => ({ id: r.id, agentId: r.agent_id, name: r.name, scope: r.scope, created: r.created, expires: r.expires, lastUsed: r.last_used || null, lastIp: r.last_ip || '' });
route('GET', '/api/me/tokens', 'user', (ctx) => ({ tokens: q.tokList.all(ctx.user.id).map(tokOut) }));
route('POST', '/api/me/tokens', 'user', (ctx) => {
  const name = String(ctx.body.name || '').trim().slice(0, 60); if (name.length < 2) throw C.err('v_req');
  const scope = ctx.body.scope === 'write' ? 'write' : 'read';
  const days = Math.round(+ctx.body.days || 90); if (!(days >= 1 && days <= 365)) throw httpErr(400, 'bad_days');
  if (q.tokCount.get(ctx.user.id).n >= 10) throw httpErr(400, 'too_many_tokens');
  const token = 'itsd_' + crypto.randomBytes(32).toString('base64url');
  const id = C.uid(), created = now(), expires = created + days * 86400e3;
  q.tokPut.run(id, ctx.user.id, name, sha256(token), scope, created, expires);
  audit(ctx, 'token.create', name, { scope, days });
  return { token, item: tokOut({ id, agent_id: ctx.user.id, name, scope, created, expires }) };
});
route('DELETE', '/api/me/tokens/:id', 'user', (ctx) => {
  const r = q.tokGet.get(ctx.params.id); if (!r || (r.agent_id !== ctx.user.id && ctx.user.role !== 'admin')) throw httpErr(404, 'not_found');
  q.tokDel.run(r.id); audit(ctx, 'token.revoke', r.name, { owner: r.agent_id });
  return { ok: true };
});
route('GET', '/api/tokens', 'admin', () => ({ tokens: q.tokListAll.all().map(tokOut) }));

route('POST', '/api/me/password', 'user', async (ctx) => {
  const cred = q.credGet.get(ctx.user.id); const ip = clientIp(ctx.req), key = 'pwchg:' + ctx.user.id;
  throttleCheck(ip, key);
  if (!(await verifyPw(String(ctx.body.current || ''), cred.hash))) { throttleFail(ip, key); throw httpErr(400, 'bad_current'); }
  acctFails.delete(key);
  const hash = await hashPw(checkPw(ctx.body.password));
  q.credPut.run(ctx.user.id, hash, cred.role);
  q.sessDelAgentExcept.run(ctx.user.id, ctx.user.tokenHash);
  audit(ctx, 'auth.password_change', (S.agents.find(a => a.id === ctx.user.id) || {}).email);
  return { ok: true };
});

/* ======================= API: tickets ======================= */
const clone = o => JSON.parse(JSON.stringify(o));

/** Notifications after a ticket changed: assignee alerts + emails to the requester (portal). */
function afterTicketChange(orig, x, actor) {
  if (x.assigneeId && x.assigneeId !== orig.assigneeId && x.assigneeId !== actor) notify(x.assigneeId, 'assigned', x, { by: actor });
  const added = x.comments.slice(orig.comments.length);
  if (x.assigneeId && x.assigneeId !== actor) added.forEach(c => notify(x.assigneeId, c.kind === 'requester' ? 'requester' : 'comment', x, { by: actor === 'requester' ? null : actor }));
  added.filter(c => c.kind === 'reply').forEach(c => mailRequester(x, 'reply', c.body));
  if (x.status === 'resolved' && orig.status !== 'resolved') mailRequester(x, 'resolved');
}
/** Creates a ticket (agents and portal). Links/creates the requester entity in the same transaction. */
function createTicket(data, actor, extra) {
  const settings = Object.assign({}, S.settings);
  const work = Object.assign({}, S, { settings, requesters: S.requesters.slice() });
  const newReq = C.linkRequester(work, data, now());
  const x = C.newTicket(work, data, actor, now());
  if (extra) Object.assign(x, extra);
  tx(() => { if (newReq) putEnt('requesters', newReq); putEnt('tickets', x); kvPut('settings', settings); });
  S.settings = settings; S.requesters = work.requesters; S.tickets.push(x);
  if (newReq) broadcast({ t: 'ent', coll: 'requesters', d: newReq });
  broadcast({ t: 'ticket', d: x }); broadcast({ t: 'settings', settings: S.settings, sla: S.sla });
  if (x.assigneeId && x.assigneeId !== actor) {
    const auto = x.activity.some(a => a.k === 'autoassign');
    notify(x.assigneeId, 'assigned', x, { by: auto ? null : actor, auto });
  } else if (!x.assigneeId && x.priority <= 2) adminIds().filter(id => id !== actor).forEach(id => notify(id, 'urgent', x, { by: actor }));
  return x;
}
route('POST', '/api/tickets', 'user', (ctx) => ({ ticket: createTicket(ctx.body, ctx.user.id) }));

route('POST', '/api/tickets/:id/ops', 'user', (ctx) => {
  const ops = Array.isArray(ctx.body.ops) ? ctx.body.ops : [];
  if (!ops.length || ops.length > 20) throw C.err('bad_op');
  const orig = S.tickets.find(t => t.id === ctx.params.id); if (!orig) throw httpErr(404, 'not_found');
  const ids = new Set([orig.id]); ops.forEach(o => { if (o && typeof o.other === 'string') ids.add(o.other); });
  const clones = new Map(); ids.forEach(id => { const t = S.tickets.find(z => z.id === id); if (t) clones.set(id, clone(t)); });
  const work = Object.assign({}, S, { tickets: S.tickets.map(t => clones.get(t.id) || t), requesters: S.requesters.slice() });
  const x = clones.get(orig.id); const touched = new Map(); const newReqs = [];
  const isAdmin = ctx.user.role === 'admin';
  for (const op of ops) {
    if (op && op.op === 'edit' && op.data) { const r = C.linkRequester(work, op.data, now()); if (r) newReqs.push(r); }
    C.applyOp(work, x, op, ctx.user.id, now(), isAdmin).forEach(t => touched.set(t.id, t));
  }
  tx(() => { newReqs.forEach(r => putEnt('requesters', r)); touched.forEach(t => putEnt('tickets', t)); });
  S.requesters = work.requesters;
  S.tickets = S.tickets.map(t => touched.get(t.id) || t);
  newReqs.forEach(r => broadcast({ t: 'ent', coll: 'requesters', d: r }));
  touched.forEach(t => broadcast({ t: 'ticket', d: t }));
  afterTicketChange(orig, x, ctx.user.id);
  return { tickets: [...touched.values()] };
});

route('DELETE', '/api/tickets/:id', 'admin', (ctx) => {
  const t = S.tickets.find(x => x.id === ctx.params.id); if (!t) throw httpErr(404, 'not_found');
  audit(ctx, 'ticket.delete', t.key, { title: t.title });
  return { ok: true, trash: moveToTrash('tickets', t, ctx.user.id) };
});

/* ======================= trash (soft delete) ======================= */
function moveToTrash(coll, item, by) {
  const tr = { id: coll + ':' + item.id, coll, item, deletedAt: now(), deletedBy: by };
  tx(() => { q.del.run(coll, item.id); putEnt('trash', tr); });
  S[coll] = S[coll].filter(o => o.id !== item.id);
  S.trash = S.trash.filter(x => x.id !== tr.id); S.trash.push(tr);
  broadcast(coll === 'tickets' ? { t: 'ticket-del', id: item.id } : { t: 'ent-del', coll, id: item.id });
  broadcast({ t: 'trash', d: tr }, true);
  log('moved to trash:', tr.id, 'by', by);
  return tr;
}
function purgeTrash(list, reason) {
  if (!list.length) return;
  const ids = new Set(list.map(x => x.id)), gone = new Set(list.filter(x => x.coll === 'tickets').map(x => x.item.id));
  const touched = new Map();
  if (gone.size) S.tickets.forEach(t => { if (t.links.some(l => gone.has(l))) touched.set(t.id, Object.assign(clone(t), { links: t.links.filter(l => !gone.has(l)) })); });
  tx(() => { list.forEach(x => q.del.run('trash', x.id)); touched.forEach(t => putEnt('tickets', t)); });
  S.trash = S.trash.filter(x => !ids.has(x.id));
  list.filter(x => x.coll === 'tickets').forEach(x => (x.item.attachments || []).forEach(a => gcHash(a.hash)));
  S.tickets = S.tickets.map(t => touched.get(t.id) || t);
  touched.forEach(t => broadcast({ t: 'ticket', d: t }));
  list.forEach(x => broadcast({ t: 'trash-del', id: x.id }, true));
  log('purged from trash:', list.length, 'item(s)', reason || '');
}
route('POST', '/api/trash/:tid/restore', 'admin', (ctx) => {
  const tr = S.trash.find(x => x.id === ctx.params.tid); if (!tr) throw httpErr(404, 'not_found');
  const coll = tr.coll; let item = clone(tr.item);
  if (S[coll].some(o => o.id === item.id)) throw httpErr(409, 'exists');
  if (coll === 'tickets') {
    let k = S.categories.find(c => c.id === item.categoryId);
    if (!k) { k = S.categories[0]; if (!k) throw C.err('v_cat'); item.categoryId = k.id; }
    item.teamId = k.team;
    if (item.assigneeId && !S.agents.some(a => a.id === item.assigneeId)) item.assigneeId = null;
    if (item.assetId && !S.assets.some(a => a.id === item.assetId)) item.assetId = '';
    item.links = (item.links || []).filter(l => S.tickets.some(t => t.id === l));
    C.logA(item, 'restored', ctx.user.id, now());
  } else item = C.cleanEntity(S, coll, item, { trusted: true });
  tx(() => { q.del.run('trash', tr.id); putEnt(coll, item); });
  S.trash = S.trash.filter(x => x.id !== tr.id); S[coll].push(item);
  broadcast(coll === 'tickets' ? { t: 'ticket', d: item } : { t: 'ent', coll, d: item });
  broadcast({ t: 'trash-del', id: tr.id }, true);
  log('restored from trash:', tr.id, 'by', ctx.user.id); audit(ctx, 'trash.restore', tr.coll === 'tickets' ? item.key : (item.tag || item.title || item.id), { coll });
  return { coll, item };
});
route('DELETE', '/api/trash/:tid', 'admin', (ctx) => {
  const tr = S.trash.find(x => x.id === ctx.params.tid); if (!tr) throw httpErr(404, 'not_found');
  purgeTrash([tr], 'by ' + ctx.user.id); audit(ctx, 'trash.purge', tr.coll === 'tickets' ? tr.item.key : (tr.item.tag || tr.item.title || tr.item.id), { coll: tr.coll });
  return { ok: true };
});
route('DELETE', '/api/trash', 'admin', (ctx) => {
  const n = S.trash.length; purgeTrash(S.trash.slice(), '(empty trash) by ' + ctx.user.id); audit(ctx, 'trash.empty', '', { items: n });
  return { ok: true, purged: n };
});
function referencedHashes() {
  const s = new Set(); const add = t => (t.attachments || []).forEach(a => s.add(a.hash));
  S.tickets.forEach(add); S.trash.filter(x => x.coll === 'tickets').forEach(x => add(x.item));
  return s;
}
function gcHash(h) { if (!referencedHashes().has(h)) store.remove(h); }
function autoPurgeTrash() {
  const removed = store.gc(referencedHashes()); if (removed) log('attachments GC removed', removed, 'unreferenced file(s) (backup copies kept)');
  q.notifPurge.run(now() - NOTIF_DAYS * C.DAY);
  if (AUDIT_DAYS) { const n = AUD.purgeAudit(db, now() - AUDIT_DAYS * C.DAY); if (n) log('audit retention removed', n, 'row(s) older than', AUDIT_DAYS, 'days'); }
  if (!TRASH_DAYS) return;
  purgeTrash(S.trash.filter(x => now() - x.deletedAt > TRASH_DAYS * C.DAY), `(older than ${TRASH_DAYS} days)`);
}

/* ======================= attachments ======================= */
function findTicketForRead(ctx) {
  let t = S.tickets.find(x => x.id === ctx.params.id);
  if (!t && ctx.user.role === 'admin') { const tr = S.trash.find(x => x.coll === 'tickets' && x.item.id === ctx.params.id); if (tr) t = tr.item; }
  if (!t) throw httpErr(404, 'not_found');
  return t;
}
route('POST', '/api/tickets/:id/attachments', 'user', (ctx) => {
  const orig = S.tickets.find(t => t.id === ctx.params.id); if (!orig) throw httpErr(404, 'not_found');
  const { x, att } = addAttachment(ctx, orig, ctx.user.id);
  return { ticket: x, attachment: att };
}, MAX_UPLOAD_MB * 1048576, { raw: true });

function serveAttachment(ctx, a) {
  if (!store.has(a.hash)) throw httpErr(410, 'file_missing');
  const isImg = /^image\/(png|jpeg|gif|webp)$/.test(a.type);
  const inline = isImg && ctx.url.searchParams.get('inline') === '1';
  const ascii = a.name.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '');
  ctx.res.writeHead(200, {
    'Content-Type': isImg ? a.type : 'application/octet-stream',
    'Content-Length': fs.statSync(store.livePath(a.hash)).size,
    'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(a.name)}`,
    'Cache-Control': 'private, max-age=86400',
    'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    'X-Content-Type-Options': 'nosniff'
  });
  fs.createReadStream(store.livePath(a.hash)).pipe(ctx.res);
  return HANDLED;
}
route('GET', '/api/tickets/:id/attachments/:aid', 'user', (ctx) => {
  const t = findTicketForRead(ctx);
  const a = (t.attachments || []).find(z => z.id === ctx.params.aid); if (!a) throw httpErr(404, 'not_found');
  return serveAttachment(ctx, a);
});
/** Stores an uploaded attachment on a ticket. `by` is an agent id or 'requester'. */
function addAttachment(ctx, orig, by) {
  const buf = ctx.body; if (!Buffer.isBuffer(buf) || !buf.length) throw C.err('empty_file');
  let name; try { name = cleanName(decodeURIComponent(String(ctx.req.headers['x-filename'] || 'file'))); } catch (e) { name = cleanName(''); }
  if (isBlocked(name)) throw httpErr(415, 'blocked_type');
  if ((orig.attachments || []).length >= MAX_ATTACH_PER_TICKET) throw C.err('too_many_files');
  const type = sniffImage(buf) || 'application/octet-stream';
  const hash = store.put(buf);
  const x = clone(orig); x.attachments = x.attachments || [];
  const att = { id: C.uid(), hash, name, size: buf.length, type, by, at: now() };
  x.attachments.push(att); C.logA(x, 'attach', by, now(), { v: name });
  putEnt('tickets', x); S.tickets = S.tickets.map(t => t.id === x.id ? x : t);
  broadcast({ t: 'ticket', d: x });
  if (x.assigneeId && x.assigneeId !== by) notify(x.assigneeId, 'attachment', x, { by: by === 'requester' ? null : by, name, fromRequester: by === 'requester' });
  return { x, att };
}

route('DELETE', '/api/tickets/:id/attachments/:aid', 'user', (ctx) => {
  const orig = S.tickets.find(t => t.id === ctx.params.id); if (!orig) throw httpErr(404, 'not_found');
  const a = (orig.attachments || []).find(z => z.id === ctx.params.aid); if (!a) throw httpErr(404, 'not_found');
  if (a.by !== ctx.user.id && ctx.user.role !== 'admin') throw httpErr(403, 'forbidden');
  const x = clone(orig); x.attachments = x.attachments.filter(z => z.id !== a.id);
  C.logA(x, 'att-del', ctx.user.id, now(), { v: a.name });
  putEnt('tickets', x); S.tickets = S.tickets.map(t => t.id === x.id ? x : t);
  broadcast({ t: 'ticket', d: x });
  gcHash(a.hash);
  return { ticket: x };
});

/* ======================= notifications ======================= */
const prefsOf = id => Object.assign({ email: true, lang: null }, kvGet('prefs:' + id) || {});
const adminIds = () => { const r = roleMap(); return S.agents.filter(a => a.active && r[a.id] === 'admin').map(a => a.id); };
const EMAIL_TYPES = new Set(['assigned', 'requester', 'sla_breach', 'urgent']);
const MAIL_T = {
  assigned: ['تذكرة مسندة لك', 'Ticket assigned to you'], requester: ['رد جديد من مقدم الطلب', 'New reply from the requester'],
  sla_breach: ['التذكرة خرقت الـ SLA', 'SLA breached'], urgent: ['تذكرة عاجلة من غير مسؤول', 'Urgent ticket with no assignee']
};
function sendTo(agentId, evt) {
  const s = `data: ${JSON.stringify(evt)}\n\n`;
  for (const c of clients) if (c.agentId === agentId) { try { c.res.write(s); } catch (e) { clients.delete(c); } }
}
function notifPayload(id) {
  return { items: q.notifList.all(id).map(r => Object.assign(JSON.parse(r.data), { read: !!r.read })), unread: q.notifUnread.get(id).n };
}
/** Builds an agent notification email in the agent's language (ar | en), or both when no language is set. */
function mailFor(n, lang) {
  const [ar, en] = MAIL_T[n.type]; const by = n.by ? (S.agents.find(a => a.id === n.by) || {}).name : '';
  const link = APP_URL ? `${APP_URL}/#t-${encodeURIComponent(n.key)}` : '';
  const head = lang === 'ar' ? ar : lang === 'en' ? en : `${ar} | ${en}`;
  const L = (a, e) => lang === 'ar' ? a : lang === 'en' ? e : `${e} / ${a}`;
  const subject = `[${n.key}] ${head} — ${n.title}`;
  const text = (lang ? [head] : [ar, en]).concat(['', `${n.key} — ${n.title}`, `${L('الأولوية', 'Priority')}: P${n.priority}`])
    .concat(by ? [`${L('بواسطة', 'By')}: ${by}`] : [], link ? ['', link] : [], ['', '— ' + PRODUCT]).join('\n');
  return [subject, text];
}
/** Emails the requester about their ticket (portal must be enabled so the link works). */
const RQ_T = {
  created: { ar: ['تم استلام طلبك', 'استلمنا طلبك وهنبلغك بأي تحديث. تقدر تتابع الطلب وترد عليه من الرابط ده:'], en: ['We received your request', 'We received your request and will keep you updated. Track it and reply here:'] },
  reply: { ar: ['رد جديد على طلبك', 'فريق الدعم الفني رد على طلبك:'], en: ['New reply on your request', 'The IT support team replied to your request:'] },
  resolved: { ar: ['تم حل طلبك', 'تم حل طلبك. لو المشكلة لسه موجودة رد من الرابط وهنعيد فتحه، ويسعدنا تقيّم الخدمة:'], en: ['Your request was resolved', 'Your request was resolved. If the problem is still there, reply from the link and we will reopen it. We would also love your rating:'] }
};
function mailRequester(x, kind, body) {
  if (!mailer.enabled || !(S.settings.portal && S.settings.portal.enabled)) return;
  const email = x.requester && x.requester.email; if (!email) return;
  const link = APP_URL ? `${APP_URL}/portal?t=${x.portalToken}` : '';
  const langs = x.lang === 'ar' || x.lang === 'en' ? [x.lang] : ['ar', 'en'];
  const subject = `[${x.key}] ${langs.map(l => RQ_T[kind][l][0]).join(' | ')} — ${x.title}`;
  const parts = langs.map(l => [RQ_T[kind][l][1], body ? '\n' + body + '\n' : '', link].filter(Boolean).join('\n'));
  mailer.enqueue(email, subject, parts.join('\n\n———\n\n') + '\n\n— IT Support · ' + PRODUCT);
}
/** Records an in-app notification for an agent who can sign in, pushes it live, and emails it when relevant. */
function notify(agentId, type, t, extra) {
  if (!agentId || agentId === 'system') return;
  const a = S.agents.find(x => x.id === agentId); if (!a || !a.active || !q.credGet.get(agentId)) return;
  const n = Object.assign({ id: C.uid(), type, ticketId: t.id, key: t.key, title: String(t.title).slice(0, 140), priority: t.priority, at: now(), read: false }, extra || {});
  q.notifPut.run(n.id, agentId, n.at, JSON.stringify(n));
  sendTo(agentId, { t: 'notif', d: n });
  const pf = prefsOf(agentId);
  if (mailer.enabled && EMAIL_TYPES.has(type) && pf.email !== false) mailer.enqueue(a.email, ...mailFor(n, pf.lang));
}
route('GET', '/api/notifications', 'user', (ctx) => notifPayload(ctx.user.id));
route('POST', '/api/notifications/read', 'user', (ctx) => {
  if (ctx.body.all) q.notifReadAll.run(ctx.user.id);
  else (Array.isArray(ctx.body.ids) ? ctx.body.ids.slice(0, 200) : []).forEach(id => q.notifRead.run(ctx.user.id, String(id)));
  return notifPayload(ctx.user.id);
});
route('PUT', '/api/me/prefs', 'user', (ctx) => {
  const p = prefsOf(ctx.user.id); if ('email' in ctx.body) p.email = !!ctx.body.email;
  if ('lang' in ctx.body) p.lang = ctx.body.lang === 'en' ? 'en' : ctx.body.lang === 'ar' ? 'ar' : null;
  kvPut('prefs:' + ctx.user.id, p); return { prefs: p };
});
route('POST', '/api/mail/test', 'admin', async (ctx) => {
  if (!mailer.enabled) throw httpErr(400, 'mail_off');
  const a = S.agents.find(x => x.id === ctx.user.id);
  try {
    await mailer.send(a.email, PRODUCT + ' — test email | رسالة تجريبية',
      `This is a test message from ${PRODUCT}.\nده إيميل تجريبي — لو وصلك يبقى إعدادات SMTP سليمة.\n\nTo: ${a.email}${APP_URL ? '\nApp: ' + APP_URL : ''}`);
    log('test email sent to', a.email); audit(ctx, 'mail.test', a.email);
    return { ok: true, to: a.email };
  } catch (e) { log('test email failed:', e.message); const er = httpErr(502, 'mail_failed'); er.detail = e.message; throw er; }
});

/* SLA watcher: tells the assignee when a ticket is at risk or breached (breaches escalate to admins too).
   Each (ticket, state, due) is notified once; the sent set survives restarts. */
const slaSent = new Set(kvGet('slaSent') || []);
function slaWatch() {
  const t = now(); let changed = false;
  for (const x of S.tickets) {
    if (!C.isOpen(x)) continue;
    const s = C.sla(S, x, t); if (s.st !== 'risk' && s.st !== 'breached') continue;
    const key = `${x.id}:${s.st}:${Math.round(s.due / 60000)}`; if (slaSent.has(key)) continue;
    slaSent.add(key); changed = true;
    const targets = new Set(x.assigneeId ? [x.assigneeId] : adminIds());
    if (s.st === 'breached') adminIds().forEach(id => targets.add(id));
    targets.forEach(id => notify(id, s.st === 'risk' ? 'sla_risk' : 'sla_breach', x, { by: null }));
  }
  const open = new Set(S.tickets.filter(C.isOpen).map(x => x.id));
  for (const k of slaSent) if (!open.has(k.split(':')[0])) { slaSent.delete(k); changed = true; }
  if (changed) kvPut('slaSent', [...slaSent]);
}

/* ======================= self-service portal ======================= */
const PCOOKIE = 'itset_psid', PORTAL_SESSION_DAYS = 7;
const rates = new Map();
/** Fixed-window counter: returns false once `limit` hits happened for `key` within `windowMs`. */
function rateHit(key, limit, windowMs) {
  const t = now(); let r = rates.get(key);
  if (!r || t - r.start > windowMs) { r = { start: t, n: 0, windowMs }; rates.set(key, r); }
  r.n++; return r.n <= limit;
}
function rateGuard(key, limit, windowMs) { if (!rateHit(key, limit, windowMs)) { const e = httpErr(429, 'rate_limited'); e.retryAfter = Math.ceil(windowMs / 1000); throw e; } }
function purgeRate() { const t = now(); for (const [k, r] of rates) if (t - r.start > r.windowMs) rates.delete(k); }
const portalOn = () => !!(S.settings.portal && S.settings.portal.enabled);
function portalGuard() { if (!portalOn()) throw httpErr(404, 'portal_off'); }
function domainOk(email) {
  const d = (S.settings.portal && S.settings.portal.allowedDomains) || []; if (!d.length) return true;
  const dom = String(email).split('@')[1] || ''; return d.some(x => dom === x || dom.endsWith('.' + x));
}
function pCookie(req, val, maxAge) { return `${PCOOKIE}=${val}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${isSecureReq(req) ? '; Secure' : ''}`; }
function portalUser(req) {
  const tok = parseCookies(req)[PCOOKIE]; if (!tok) return null;
  const r = q.pSessGet.get(sha256(tok)); if (!r || r.expires < now()) return null;
  return r.email;
}
const byToken = tok => typeof tok === 'string' && tok.length >= 20 ? S.tickets.find(t => t.portalToken === tok) : null;
function ticketByToken(ctx) { const x = byToken(ctx.params.token); if (!x) throw httpErr(404, 'not_found'); return x; }
const firstName = id => { const a = S.agents.find(z => z.id === id); return a ? String(a.name).split(/\s+/)[0] : ''; };
/** What a requester may see: no internal notes, no agent attachments, no SLA or assignment details. */
function portalView(x) {
  const cat = S.categories.find(c => c.id === x.categoryId);
  return {
    key: x.key, title: x.title, desc: x.desc, status: x.status, type: x.type, createdAt: x.createdAt, updatedAt: x.updatedAt, resolvedAt: x.resolvedAt,
    category: cat ? cat.name : '', categoryL: cat ? { ar: C.demoText(cat.name, 'ar'), en: C.demoText(cat.name, 'en') } : null, requester: { name: x.requester.name, email: x.requester.email }, csat: x.csat || null, lang: x.lang || null,
    canReply: x.status !== 'closed', canRate: !C.isOpen(x),
    comments: x.comments.filter(c => c.kind !== 'internal').sort((a, b) => a.at - b.at).map(c => ({ id: c.id, mine: c.kind === 'requester', by: c.kind === 'requester' ? '' : firstName(c.by), body: c.body, at: c.at })),
    attachments: (x.attachments || []).filter(a => a.by === 'requester').map(a => ({ id: a.id, name: a.name, size: a.size, type: a.type, at: a.at }))
  };
}
function saveTicket(orig, x) {
  putEnt('tickets', x); S.tickets = S.tickets.map(t => t.id === x.id ? x : t);
  broadcast({ t: 'ticket', d: x });
}
route('GET', '/api/portal/config', 'none', (ctx) => ({
  enabled: portalOn(), mail: mailer.enabled, links: !!APP_URL,
  categories: portalOn() ? S.categories.map(c => ({ id: c.id, name: c.name, ar: C.demoText(c.name, 'ar'), en: C.demoText(c.name, 'en') })) : [],
  domains: portalOn() ? (S.settings.portal.allowedDomains || []) : [], signedIn: portalOn() ? portalUser(ctx.req) : null,
  limits: { maxUploadMB: MAX_UPLOAD_MB }
}));
route('POST', '/api/portal/tickets', 'none', (ctx) => {
  portalGuard(); const b = ctx.body, ip = clientIp(ctx.req);
  if (b.website) throw C.err('v_req2'); // honeypot: real users never fill it
  const email = String(b.email || '').trim().toLowerCase().slice(0, 120);
  if (!C.EMAIL_RE.test(email)) throw C.err('v_email');
  if (!domainOk(email)) throw httpErr(403, 'domain_not_allowed');
  rateGuard('pt-ip:' + ip, 10, 3600e3); rateGuard('pt-em:' + email, 5, 3600e3);
  const type = b.type === 'request' ? 'request' : 'incident';
  const impact = [1, 2, 3].includes(+b.impact) ? +b.impact : 3, urgency = [1, 2, 3].includes(+b.urgency) ? +b.urgency : 2;
  const data = { title: b.title, type, categoryId: b.categoryId, impact, urgency, desc: b.desc, tags: ['portal'], requester: { name: b.name, email, dept: b.dept } };
  const lang = b.lang === 'en' ? 'en' : 'ar';
  const x = createTicket(data, 'requester', { lang, source: 'portal' });
  audit(ctx, 'portal.ticket_create', x.key, { email }, 'requester');
  mailRequester(x, 'created');
  return { key: x.key, token: x.portalToken, url: (APP_URL || '') + '/portal?t=' + x.portalToken };
});
route('GET', '/api/portal/t/:token', 'none', (ctx) => { portalGuard(); return { ticket: portalView(ticketByToken(ctx)) }; });
route('POST', '/api/portal/t/:token/reply', 'none', (ctx) => {
  portalGuard(); const orig = ticketByToken(ctx);
  rateGuard('pr:' + orig.id, 30, 3600e3); rateGuard('pr-ip:' + clientIp(ctx.req), 60, 3600e3);
  if (orig.status === 'closed') throw httpErr(409, 'ticket_closed');
  const x = clone(orig); const work = Object.assign({}, S, { tickets: S.tickets.map(t => t.id === x.id ? x : t) });
  if (x.status === 'resolved') { C.setStatus(x, 'progress', 'system', now(), S.settings.calendar); C.logA(x, 'autoreopen', 'system', now()); }
  C.applyOp(work, x, { op: 'comment', kind: 'requester', body: ctx.body.body }, 'requester', now(), false);
  saveTicket(orig, x); afterTicketChange(orig, x, 'requester');
  return { ticket: portalView(x) };
});
route('POST', '/api/portal/t/:token/attachments', 'none', (ctx) => {
  portalGuard(); const orig = ticketByToken(ctx);
  rateGuard('pa:' + orig.id, 20, 3600e3);
  if (orig.status === 'closed') throw httpErr(409, 'ticket_closed');
  const { x } = addAttachment(ctx, orig, 'requester');
  return { ticket: portalView(x) };
}, MAX_UPLOAD_MB * 1048576, { raw: true });
route('GET', '/api/portal/t/:token/attachments/:aid', 'none', (ctx) => {
  portalGuard(); const x = ticketByToken(ctx);
  const a = (x.attachments || []).find(z => z.id === ctx.params.aid && z.by === 'requester'); if (!a) throw httpErr(404, 'not_found');
  return serveAttachment(ctx, a);
});
route('POST', '/api/portal/t/:token/csat', 'none', (ctx) => {
  portalGuard(); const orig = ticketByToken(ctx);
  const x = clone(orig); C.applyOp(S, x, { op: 'csat', v: ctx.body.v }, 'requester', now(), false);
  saveTicket(orig, x); return { ticket: portalView(x) };
});
/* "My requests": sign in with a one-time code sent by email (needs SMTP) */
route('POST', '/api/portal/otp', 'none', (ctx) => {
  portalGuard(); if (!mailer.enabled) throw httpErr(400, 'mail_off');
  const email = String(ctx.body.email || '').trim().toLowerCase().slice(0, 120), ip = clientIp(ctx.req);
  if (!C.EMAIL_RE.test(email)) throw C.err('v_email');
  if (!domainOk(email)) throw httpErr(403, 'domain_not_allowed');
  rateGuard('otp-ip:' + ip, 10, 900e3); rateGuard('otp-em:' + email, 3, 900e3);
  const code = String(crypto.randomInt(0, 1e6)).padStart(6, '0');
  q.otpPut.run(email, sha256(email + ':' + code), now() + 10 * 60e3);
  const lang = ctx.body.lang === 'en' ? 'en' : 'ar';
  const subject = lang === 'en' ? `Your sign-in code: ${code}` : `كود الدخول: ${code}`;
  const text = lang === 'en' ? `Your IT support portal sign-in code is ${code}\nIt expires in 10 minutes. If you did not ask for it, ignore this email.`
    : `كود الدخول على بوابة الدعم الفني: ${code}\nالكود صالح لمدة 10 دقايق. لو مش انت اللي طلبته تجاهل الإيميل ده.`;
  mailer.enqueue(email, subject, text);
  audit(ctx, 'portal.otp_sent', email, null, 'requester');
  return { ok: true };
});
route('POST', '/api/portal/login', 'none', (ctx) => {
  portalGuard();
  const email = String(ctx.body.email || '').trim().toLowerCase().slice(0, 120), code = String(ctx.body.code || '').replace(/\D/g, '');
  const row = q.otpGet.get(email);
  if (!row || row.expires < now() || row.tries >= 5) { if (row && row.tries >= 5) q.otpDel.run(email); throw httpErr(400, 'bad_code'); }
  const ok = crypto.timingSafeEqual(Buffer.from(row.code_hash), Buffer.from(sha256(email + ':' + code)));
  if (!ok) { q.otpTry.run(email); throw httpErr(400, 'bad_code'); }
  q.otpDel.run(email);
  const token = crypto.randomBytes(32).toString('base64url');
  q.pSessPut.run(sha256(token), email, now() + PORTAL_SESSION_DAYS * C.DAY);
  ctx.res.setHeader('Set-Cookie', pCookie(ctx.req, token, PORTAL_SESSION_DAYS * 86400));
  audit(ctx, 'portal.login', email, null, 'requester');
  return { ok: true, email };
});
route('POST', '/api/portal/logout', 'none', (ctx) => {
  const tok = parseCookies(ctx.req)[PCOOKIE]; if (tok) q.pSessDel.run(sha256(tok));
  ctx.res.setHeader('Set-Cookie', pCookie(ctx.req, '', 0)); return { ok: true };
});
route('GET', '/api/portal/mine', 'none', (ctx) => {
  portalGuard(); const email = portalUser(ctx.req); if (!email) throw httpErr(401, 'auth');
  const ids = new Set(S.requesters.filter(r => r.email === email).map(r => r.id));
  const list = S.tickets.filter(t => ids.has(t.requesterId) || (t.requester && t.requester.email === email)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
    .map(t => ({ key: t.key, title: t.title, status: t.status, createdAt: t.createdAt, updatedAt: t.updatedAt, token: t.portalToken }));
  return { email, tickets: list };
});

/* DESK-GAP-001 — "My devices": assets in the signed-in employee's custody (ISO/IEC 27001 A.5.9 / A.5.11).
   Ownership check: only assets whose requesterId belongs to a requester record with the SAME e-mail as the
   portal session (verified by one-time code). No ids from the client are trusted. Only safe fields leave the server. */
const CUSTODY_HIDDEN = new Set(['disposed', 'retired']);
function custodySince(a) {
  const h = (a.history || []).filter(e => e.k === 'owner'); return h.length ? h[h.length - 1].at : (a.createdAt || null);
}
route('GET', '/api/portal/assets', 'none', (ctx) => {
  portalGuard(); const email = portalUser(ctx.req); if (!email) throw httpErr(401, 'auth');
  rateGuard('pas:' + email, 60, 3600e3);
  const ids = new Set(S.requesters.filter(r => r.email && r.email === email).map(r => r.id));
  const assets = S.assets.filter(a => a.requesterId && ids.has(a.requesterId) && !CUSTODY_HIDDEN.has(a.status))
    .sort((a, b) => String(a.tag).localeCompare(String(b.tag))).slice(0, 200)
    .map(a => ({ tag: a.tag, name: a.name, type: a.type, serial: a.serial || '', status: a.status, location: a.location || '', since: custodySince(a) }));
  return { email, assets };
});

/* DESK-GAP-004 — self-service knowledge base: only articles an agent marked audience='portal'.
   Internal articles (the default, and anything without the field, e.g. older data or imports) never leave the server.
   No sign-in needed (same as opening a request); only safe fields are returned. */
const portalCat = id => { const c = S.categories.find(z => z.id === id); return c ? { name: c.name, ar: C.demoText(c.name, 'ar'), en: C.demoText(c.name, 'en') } : null; };
route('GET', '/api/portal/kb', 'none', (ctx) => {
  portalGuard(); rateGuard('pkb-ip:' + clientIp(ctx.req), 300, 3600e3);
  const articles = S.kb.filter(k => k && k.audience === 'portal').sort((a, b) => String(a.title).localeCompare(String(b.title))).slice(0, 200)
    .map(k => ({ id: k.id, title: k.title, body: k.body, category: portalCat(k.category) }));
  return { articles };
});

/* ======================= audit log (admin) ======================= */
route('GET', '/api/audit', 'admin', (ctx) => {
  const sp = ctx.url.searchParams; const lim = Math.min(500, Math.max(1, +(sp.get('limit') || 200)));
  const where = [], args = [];
  if (sp.get('before')) { where.push('seq < ?'); args.push(+sp.get('before')); }
  if (sp.get('action')) { where.push('action LIKE ?'); args.push(String(sp.get('action')).replace(/[%_]/g, '') + '%'); }
  if (sp.get('actor')) { where.push('actor = ?'); args.push(String(sp.get('actor'))); }
  const rows = db.prepare(`SELECT seq, at, actor, action, target, detail, ip FROM audit ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY seq DESC LIMIT ?`).all(...args, lim);
  return { rows: rows.map(r => Object.assign(r, { detail: r.detail ? JSON.parse(r.detail) : null })), retentionDays: AUDIT_DAYS };
});
route('GET', '/api/audit/verify', 'admin', (ctx) => { const v = AUD.verifyAudit(db); audit(ctx, 'audit.verify', '', { ok: v.ok, count: v.count }); return v; });
route('GET', '/api/audit/export', 'admin', (ctx) => {
  audit(ctx, 'audit.export', '');
  const esc = v => { let x = String(v ?? ''); if (/^[=+\-@\t\r]/.test(x)) x = "'" + x; return `"${x.replace(/"/g, '""')}"`; };
  const names = new Map(S.agents.map(a => [a.id, a.email]));
  const lines = [['seq', 'time_utc', 'actor', 'actor_email', 'action', 'target', 'detail', 'ip', 'hash'].join(',')];
  for (const r of db.prepare('SELECT seq, at, actor, action, target, detail, ip, hash FROM audit ORDER BY seq').iterate())
    lines.push([r.seq, new Date(r.at).toISOString(), r.actor, names.get(r.actor) || '', r.action, r.target, r.detail, r.ip, r.hash].map(esc).join(','));
  const body = '﻿' + lines.join('\r\n');
  ctx.res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="itset-audit-${new Date().toISOString().slice(0, 10)}.csv"`, 'Cache-Control': 'no-store' });
  ctx.res.end(body);
  return HANDLED;
});

/* ======================= requesters ======================= */
/** Keeps the name/email/dept copy on tickets in sync after a requester is edited. */
function syncRequesterSnapshots(r) {
  const touched = S.tickets.filter(t => t.requesterId === r.id && (t.requester.name !== r.name || t.requester.email !== r.email || t.requester.dept !== r.dept))
    .map(t => Object.assign(clone(t), { requester: { name: r.name, email: r.email, dept: r.dept } }));
  if (!touched.length) return;
  tx(() => touched.forEach(t => putEnt('tickets', t)));
  S.tickets = S.tickets.map(t => touched.find(z => z.id === t.id) || t);
  touched.forEach(t => broadcast({ t: 'ticket', d: t }));
}
route('POST', '/api/requesters/:id/merge', 'admin', (ctx) => {
  const into = S.requesters.find(r => r.id === ctx.params.id), from = S.requesters.find(r => r.id === ctx.body.from);
  if (!into || !from || into.id === from.id) throw httpErr(404, 'not_found');
  const touched = S.tickets.filter(t => t.requesterId === from.id).map(t => Object.assign(clone(t), { requesterId: into.id, requester: { name: into.name, email: into.email, dept: into.dept } }));
  tx(() => { touched.forEach(t => putEnt('tickets', t)); q.del.run('requesters', from.id); });
  S.tickets = S.tickets.map(t => touched.find(z => z.id === t.id) || t); S.requesters = S.requesters.filter(r => r.id !== from.id);
  touched.forEach(t => broadcast({ t: 'ticket', d: t })); broadcast({ t: 'ent-del', coll: 'requesters', id: from.id });
  audit(ctx, 'requester.merge', into.email || into.name, { from: from.email || from.name, tickets: touched.length });
  return { ok: true, moved: touched.length };
});

/* ======================= API: collections ======================= */
const EDIT_ROLE = { assets: 'user', kb: 'user', requesters: 'user', teams: 'admin', categories: 'admin', canned: 'admin', agents: 'admin', plans: 'admin' };
const AUDITED = ['teams', 'categories', 'canned', 'agents', 'requesters', 'assets', 'plans'];
route('PUT', '/api/c/:coll/:id', 'user', (ctx) => {
  const { coll, id } = ctx.params; const need = EDIT_ROLE[coll];
  if (!need) throw httpErr(404, 'bad_coll');
  if (need === 'admin' && ctx.user.role !== 'admin') throw httpErr(403, 'forbidden');
  const before = S[coll].find(o => o.id === id);
  const item = C.cleanEntity(S, coll, Object.assign({}, ctx.body, { id }), { by: ctx.user.id, now: now() });
  if (coll === 'requesters' && before && before.createdAt) item.createdAt = before.createdAt;
  if (coll === 'agents' && id === ctx.user.id && !item.active) throw C.err('self');
  putEnt(coll, item);
  const i = S[coll].findIndex(o => o.id === id);
  if (i >= 0) S[coll][i] = item; else S[coll].push(item);
  if (coll === 'agents' && !item.active) { q.sessDelAgent.run(id); kickAgent(id); }
  const out = coll === 'agents' ? publicAgent(item, roleMap()) : item;
  broadcast({ t: 'ent', coll, d: out });
  if (AUDITED.includes(coll)) audit(ctx, coll.replace(/s$/, '') + (before ? '.update' : '.create'), item.email || item.tag || item.name || item.title || id, before ? diff(before, item, ['history']) : item);
  if (coll === 'requesters' && before) syncRequesterSnapshots(item);
  return { item: out };
});

route('DELETE', '/api/c/:coll/:id', 'admin', (ctx) => {
  const { coll, id } = ctx.params;
  if (!EDIT_ROLE[coll]) throw httpErr(404, 'bad_coll');
  if (!S[coll].some(o => o.id === id)) throw httpErr(404, 'not_found');
  if (coll === 'agents' && id === ctx.user.id) throw C.err('self');
  if (C.inUse(S, coll, id)) throw httpErr(409, 'in_use');
  const gone = S[coll].find(o => o.id === id);
  audit(ctx, coll.replace(/s$/, '') + '.delete', gone.email || gone.tag || gone.name || gone.title || id, TRASHABLE.includes(coll) ? { trash: true } : null);
  if (TRASHABLE.includes(coll)) return { ok: true, trashed: true, trash: moveToTrash(coll, gone, ctx.user.id) };
  tx(() => { q.del.run(coll, id); if (coll === 'agents') { q.credDel.run(id); q.sessDelAgent.run(id); q.notifDelAgent.run(id); q.tokDelAgent.run(id); } });
  S[coll] = S[coll].filter(o => o.id !== id);
  if (coll === 'agents') kickAgent(id);
  broadcast({ t: 'ent-del', coll, id });
  return { ok: true };
});

route('PUT', '/api/settings', 'admin', (ctx) => {
  const before = { settings: S.settings, sla: S.sla };
  const settings = ctx.body.settings ? C.cleanSettings(S.settings, ctx.body.settings) : S.settings;
  const sla = ctx.body.sla ? C.cleanSla(ctx.body.sla) : S.sla;
  tx(() => { kvPut('settings', settings); kvPut('sla', sla); });
  S.settings = settings; S.sla = sla;
  runAutoClose();
  broadcast({ t: 'settings', settings, sla });
  const d = Object.assign(diff(before.settings, settings, ['nextNo']), diff(before.sla, sla));
  if (Object.keys(d).length) audit(ctx, 'settings.update', '', d);
  return { settings, sla };
});

/* ======================= API: user access (admin) ======================= */
route('PUT', '/api/agents/:id/access', 'admin', async (ctx) => {
  const id = ctx.params.id; const a = S.agents.find(x => x.id === id); if (!a) throw httpErr(404, 'not_found');
  const role = ctx.body.role; if (role !== 'admin' && role !== 'agent') throw C.err('v_req2');
  const cred = q.credGet.get(id);
  if (cred && cred.role === 'admin' && role !== 'admin' && q.adminCount.get().n <= 1) throw C.err('last_admin');
  audit(ctx, 'agent.access', a.email, { role: [cred ? cred.role : null, role], password: !!ctx.body.password });
  if (ctx.body.password) {
    const hash = await hashPw(checkPw(ctx.body.password));
    q.credPut.run(id, hash, role);
    if (id === ctx.user.id) q.sessDelAgentExcept.run(id, ctx.user.tokenHash); else { q.sessDelAgent.run(id); kickAgent(id); }
  } else {
    if (!cred) throw C.err('v_pw');
    q.credRole.run(role, id);
  }
  const out = publicAgent(a, roleMap()); broadcast({ t: 'ent', coll: 'agents', d: out });
  return { item: out };
});

route('DELETE', '/api/agents/:id/access', 'admin', (ctx) => {
  const id = ctx.params.id; if (id === ctx.user.id) throw C.err('self');
  const a = S.agents.find(x => x.id === id); if (!a) throw httpErr(404, 'not_found');
  tx(() => { q.credDel.run(id); q.sessDelAgent.run(id); q.tokDelAgent.run(id); }); kickAgent(id);
  audit(ctx, 'agent.revoke', a.email);
  const out = publicAgent(a, roleMap()); broadcast({ t: 'ent', coll: 'agents', d: out });
  return { item: out };
});

/* ======================= API: backup ======================= */
function doBackup(kind) {
  try { const r = B.makeBackup(DATA_DIR, kind, KEEP_BACKUPS); log('backup', kind, r.file, `${(r.size / 1024).toFixed(1)} KB`); return r; }
  catch (e) { log('BACKUP FAILED', kind, e.message); throw httpErr(500, 'backup_failed'); }
}
function autoBackupTick() {
  if (!AUTO_BACKUP_HOURS || q.credCount.get().n === 0) return;
  const last = B.listBackups(DATA_DIR).find(b => b.kind === 'auto');
  if (!last || now() - last.at >= AUTO_BACKUP_HOURS * 3600e3) { try { doBackup('auto'); } catch (e) { /* logged */ } }
}
route('GET', '/api/backups', 'admin', () => ({
  backups: B.listBackups(DATA_DIR).map(b => ({ file: b.file, kind: b.kind, size: b.size, at: b.at })),
  autoHours: AUTO_BACKUP_HOURS, keep: KEEP_BACKUPS, trashDays: TRASH_DAYS
}));
route('POST', '/api/backups', 'admin', (ctx) => { const r = doBackup('manual'); audit(ctx, 'backup.manual', r.file); return { backup: { file: r.file, kind: 'manual', size: r.size, at: now() } }; });

route('GET', '/api/export', 'admin', (ctx) => {
  audit(ctx, 'data.export', '');
  const st = publicState();
  st.agents = st.agents.map(a => { const o = Object.assign({}, a); delete o.role; delete o.hasLogin; return o; });
  return Object.assign({ version: 1, exportedAt: new Date().toISOString(), app: 'itset-servicedesk', serverVersion: VERSION }, st);
});

route('POST', '/api/import', 'admin', (ctx) => {
  const o = ctx.body;
  const ok = o && o.version === 1 && ['tickets', 'agents', 'teams', 'categories'].every(k => Array.isArray(o[k])) && o.settings && o.sla
    && o.tickets.every(x => x && typeof x.id === 'string' && typeof x.key === 'string' && C.STATUSES.includes(x.status) && Array.isArray(x.activity));
  if (!ok) throw C.err('importBad');
  const sla = C.cleanSla(o.sla);
  const teams = o.teams.filter(t => t && C.ID_RE.test(String(t.id))).map(t => ({ id: t.id, name: String(t.name || 'Team').slice(0, 60) }));
  if (!teams.length) throw C.err('importBad');
  const teamIds = new Set(teams.map(t => t.id)), fixTeam = id => teamIds.has(id) ? id : teams[0].id;
  const categories = o.categories.filter(c => c && C.ID_RE.test(String(c.id))).map(c => ({ id: c.id, name: String(c.name || 'Category').slice(0, 60), team: fixTeam(c.team) }));
  const roles = roleMap();
  const agentsById = new Map();
  S.agents.filter(a => roles[a.id]).forEach(a => agentsById.set(a.id, Object.assign({}, a, { team: fixTeam(a.team) })));
  o.agents.forEach(a => {
    if (!a || !C.ID_RE.test(String(a.id)) || agentsById.has(a.id) && roles[a.id]) return;
    const email = String(a.email || '').toLowerCase().slice(0, 120);
    if ([...agentsById.values()].some(z => z.email === email)) return;
    agentsById.set(a.id, { id: a.id, name: String(a.name || '—').slice(0, 60), email: C.EMAIL_RE.test(email) ? email : `${a.id}@invalid.local`, team: fixTeam(a.team), active: a.active !== false });
  });
  const agents = [...agentsById.values()];
  const tickets = o.tickets;
  const maxNo = tickets.reduce((m, t) => Math.max(m, +(String(t.key).match(/(\d+)$/) || [0, 0])[1]), 0);
  const settings = C.cleanSettings(C.defaults().settings, o.settings);
  settings.nextNo = Math.max(+o.settings.nextNo || 1001, maxNo + 1);
  const arr = k => Array.isArray(o[k]) ? o[k].filter(z => z && C.ID_RE.test(String(z.id))) : [];
  const next = { teams, categories, agents, tickets, assets: arr('assets'), kb: arr('kb'), canned: arr('canned'), requesters: arr('requesters'), plans: arr('plans') };
  const pre = doBackup('preimport'); // aborts the import if the safety backup cannot be written
  tx(() => {
    COLLS.forEach(c => q.delColl.run(c)); q.delColl.run('trash');
    COLLS.forEach(c => next[c].forEach(x => putEnt(c, x)));
    kvPut('settings', settings); kvPut('sla', sla); kvPut('demo', !!o.demo);
  });
  S = loadState();
  { const h = store.heal(referencedHashes()); store.gc(referencedHashes()); if (h.missing.length) log('import: attachments without files:', h.missing.length); }
  { const m = C.migrateRequesters(S, now()); if (m.created.length || m.touched.length) tx(() => { m.created.forEach(r => putEnt('requesters', r)); m.touched.forEach(t => putEnt('tickets', t)); }); }
  log('import by', ctx.user.id, 'tickets:', tickets.length, '| safety backup:', pre.file);
  audit(ctx, 'data.import', pre.file, { tickets: tickets.length });
  broadcast({ t: 'reload' });
  return { ok: true, tickets: tickets.length, backup: pre.file };
}, 25e6);

/* ======================= automations ======================= */
/** Preventive maintenance: opens the tickets of every due plan (or one plan now, when forced). */
function runMaintenanceTick(opts, actor) {
  const settings = Object.assign({}, S.settings);
  const work = Object.assign({}, S, { settings, tickets: S.tickets.slice(), requesters: S.requesters.slice(), plans: S.plans.slice() });
  const r = C.runMaintenance(work, now(), opts);
  if (!r.plans.length) return r;
  tx(() => { r.requesters.forEach(q2 => putEnt('requesters', q2)); r.created.forEach(t => putEnt('tickets', t)); r.plans.forEach(p => putEnt('plans', p)); if (r.created.length) kvPut('settings', settings); });
  S.settings = settings; S.tickets = work.tickets; S.requesters = work.requesters; S.plans = work.plans;
  r.requesters.forEach(q2 => broadcast({ t: 'ent', coll: 'requesters', d: q2 }));
  r.plans.forEach(p => broadcast({ t: 'ent', coll: 'plans', d: p }));
  r.created.forEach(t => { broadcast({ t: 'ticket', d: t }); if (t.assigneeId) notify(t.assigneeId, 'assigned', t, { by: null, auto: true }); });
  if (r.created.length) broadcast({ t: 'settings', settings: S.settings, sla: S.sla });
  r.plans.forEach(p => audit(null, 'maintenance.run', p.title, { plan: p.id, due: p.lastRun.due, created: p.lastRun.created, skipped: p.lastRun.skipped, forced: !!(opts && opts.force) }, actor || 'system'));
  if (r.created.length) log('preventive maintenance:', r.created.length, 'ticket(s) opened from', r.plans.length, 'plan(s)');
  return r;
}
route('POST', '/api/plans/:id/run', 'admin', (ctx) => {
  if (!S.plans.some(p => p.id === ctx.params.id)) throw httpErr(404, 'not_found');
  const r = runMaintenanceTick({ planId: ctx.params.id, force: true }, ctx.user.id);
  return { created: r.created.map(t => t.key), skipped: r.plans[0] ? r.plans[0].lastRun.skipped : 0, plan: r.plans[0] || null };
});
function runAutoClose() {
  const changed = C.autoClose(S, now()); if (!changed.length) return;
  tx(() => changed.forEach(t => putEnt('tickets', t)));
  changed.forEach(t => broadcast({ t: 'ticket', d: t }));
  log('auto-closed', changed.length, 'ticket(s)');
}

/* ======================= server ======================= */
const server = http.createServer(async (req, res) => {
  baseHeaders(res);
  const url = new URL(req.url, 'http://local');
  const p = url.pathname;
  try {
    if (req.method === 'GET' && p === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok\n'); }
    if ((req.method === 'GET' || req.method === 'HEAD') && STATIC[p]) return serveStatic(res, p);

    if (req.method === 'GET' && p === '/api/events') {
      const user = getUser(req); if (!user) return send(res, 401, { error: 'auth' });
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 3000\n\n');
      const c = { res, agentId: user.id, tokenHash: user.tokenHash }; clients.add(c);
      req.on('close', () => clients.delete(c));
      return;
    }
    if (!p.startsWith('/api/')) return send(res, 404, { error: 'not_found' });

    const r = routes.find(x => x.m === req.method && x.re.test(p));
    if (!r) return send(res, 404, { error: 'not_found' });
    const isBearer = bearer(req) !== null;
    if (isBearer && TOKEN_BLOCKED.test(p)) return send(res, 403, { error: 'token_forbidden' });
    if (req.method !== 'GET') {
      if (!isBearer && req.headers['x-itset'] !== '1') return send(res, 403, { error: 'csrf' });
      const hasBody = +(req.headers['content-length'] || 0) > 0 || !!req.headers['transfer-encoding'];
      if (hasBody && !r.raw && !(req.headers['content-type'] || '').includes('application/json')) return send(res, 415, { error: 'json_only' });
    }
    const ctx = { req, res, url, params: (p.match(r.re) || {}).groups || {}, body: {} };
    for (const k in ctx.params) ctx.params[k] = decodeURIComponent(ctx.params[k]);
    if (r.auth !== 'none') {
      if (isBearer) { const ip = clientIp(req); throttleCheck(ip, 'token:' + ip); ctx.user = getUser(req); if (!ctx.user) { throttleFail(ip, 'token:' + ip); return send(res, 401, { error: 'bad_token' }); } }
      else ctx.user = getUser(req);
      if (!ctx.user) return send(res, 401, { error: 'auth' });
      if (ctx.user.viaToken && ctx.user.scope === 'read' && req.method !== 'GET') return send(res, 403, { error: 'token_read_only' });
      if (r.auth === 'admin' && ctx.user.role !== 'admin') return send(res, 403, { error: 'forbidden' });
    }
    if (req.method !== 'GET') {
      if (r.raw) { if (+(req.headers['content-length'] || 0) > r.limit) throw httpErr(413, 'too_large'); ctx.body = await readRaw(req, r.limit); }
      else ctx.body = await readBody(req, r.limit);
    }
    if (!ctx.body || typeof ctx.body !== 'object') ctx.body = {};
    const out = await r.fn(ctx);
    if (out === HANDLED) return;
    if (p === '/api/export') return send(res, 200, out, { 'Content-Disposition': `attachment; filename="itset-servicedesk-backup-${new Date().toISOString().slice(0, 10)}.json"` });
    return send(res, 200, out);
  } catch (e) {
    const status = e.status || (e.code ? 400 : 500);
    if (status >= 500) log('ERROR', req.method, p, e.stack || e);
    if (!res.headersSent) send(res, status, Object.assign({ error: e.code || 'server_error' }, e.retryAfter ? { retryAfter: e.retryAfter } : {}, e.detail ? { detail: e.detail } : {}), e.retryAfter ? { 'Retry-After': String(e.retryAfter) } : undefined);
    else res.end();
  }
});

setInterval(() => { for (const c of clients) { try { c.res.write(': ping\n\n'); } catch (e) { clients.delete(c); } } }, 25e3).unref();
setInterval(() => {
  q.sessPurge.run(now()); q.pSessPurge.run(now()); q.otpPurge.run(now()); q.tokPurge.run(now()); purgeRate();
  purgeThrottle(false);
  for (const c of clients) { const s = q.sessGet.get(c.tokenHash); if (!s || s.expires < now()) { try { c.res.end(); } catch (e) { /* ignore */ } clients.delete(c); } }
}, 60e3).unref();
setInterval(runAutoClose, 5 * 60e3).unref();
setInterval(() => { try { runMaintenanceTick(); } catch (e) { log('maintenance run failed:', e.message); } }, 10 * 60e3).unref();
setTimeout(() => { try { runMaintenanceTick(); } catch (e) { log('maintenance run failed:', e.message); } }, 3000).unref();
setInterval(autoPurgeTrash, 60 * 60e3).unref();
setInterval(autoBackupTick, 10 * 60e3).unref();
setTimeout(autoBackupTick, 60e3).unref();
autoPurgeTrash();
runAutoClose();
announceSetup();
{ const h = store.heal(referencedHashes()); if (h.healed) log('attachments restored from backup store:', h.healed); if (h.missing.length) log('WARNING: attachment files missing (no backup copy):', h.missing.length); }
setInterval(slaWatch, SLA_WATCH_SECONDS * 1000).unref();
setTimeout(slaWatch, Math.min(5000, SLA_WATCH_SECONDS * 1000)).unref();
log(mailer.enabled ? `Email notifications: ON via ${mailer.cfg.host}:${mailer.cfg.port || (mailer.cfg.secure === 'tls' ? 465 : 587)} (${mailer.cfg.secure})${APP_URL ? '' : ' — set APP_URL to include ticket links'}` : 'Email notifications: off (set SMTP_HOST and SMTP_FROM to enable)');
if (process.env.TRUST_PROXY) log('WARNING: TRUST_PROXY is no longer used. Set TRUSTED_PROXIES to the proxy IP/CIDR instead.');
if (TRUSTED_PROXIES.length) log('Trusting forwarded headers only from:', TRUSTED_PROXIES.join(', '), '| client IP header:', REAL_IP_HEADER);

server.listen(PORT, HOST, () => {
  log(`${PRODUCT} v${VERSION}${LICENSEE ? ' — licensed to ' + LICENSEE : ''} listening on http://${HOST}:${PORT} — data: ${DATA_DIR}`);
  log(`Node ${process.version} — node:sqlite is experimental in Node 22; the Docker image pins this exact Node version.`);
  log(`Auto-backup: ${AUTO_BACKUP_HOURS ? 'every ' + AUTO_BACKUP_HOURS + 'h' : 'off'} (keep ${KEEP_BACKUPS} per kind) | Trash retention: ${TRASH_DAYS ? TRASH_DAYS + ' days' : 'forever'}`);
});

function shutdown(sig) {
  log('received', sig, '— shutting down');
  for (const c of clients) { try { c.res.end(); } catch (e) { /* ignore */ } }
  server.close(() => { try { db.close(); } catch (e) { /* ignore */ } process.exit(0); });
  setTimeout(() => process.exit(0), 5000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
