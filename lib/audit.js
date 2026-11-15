'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * Tamper-evident audit log (append-only, hash-chained).
 *
 * Every row stores the SHA-256 of (previous row's hash + its own content). Changing, inserting or deleting
 * a row in the middle breaks the chain, and verifyAudit() reports where. Old rows may be purged by
 * retention; verification then starts from the oldest remaining row.
 * The previous hash is read inside the same IMMEDIATE transaction, so the server and CLI scripts
 * (e.g. reset-password.js) can both append without breaking the chain.
 */
const crypto = require('node:crypto');
const GENESIS = '0'.repeat(64);

function ensureAuditTable(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS audit (seq INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL, actor TEXT NOT NULL, action TEXT NOT NULL,
    target TEXT NOT NULL, detail TEXT NOT NULL, ip TEXT NOT NULL, prev TEXT NOT NULL, hash TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS audit_at ON audit(at);`);
}
const rowHash = (prev, r) => crypto.createHash('sha256')
  .update(prev + '|' + JSON.stringify([r.at, r.actor, r.action, r.target, r.detail, r.ip])).digest('hex');

function appendAudit(db, e) {
  const r = {
    at: e.at || Date.now(), actor: String(e.actor || ''), action: String(e.action), target: String(e.target || '').slice(0, 300),
    detail: e.detail == null ? '' : JSON.stringify(e.detail).slice(0, 8000), ip: String(e.ip || '')
  };
  db.exec('BEGIN IMMEDIATE');
  try {
    const last = db.prepare('SELECT hash FROM audit ORDER BY seq DESC LIMIT 1').get();
    const prev = last ? last.hash : GENESIS;
    const hash = rowHash(prev, r);
    db.prepare('INSERT INTO audit (at,actor,action,target,detail,ip,prev,hash) VALUES (?,?,?,?,?,?,?,?)').run(r.at, r.actor, r.action, r.target, r.detail, r.ip, prev, hash);
    db.exec('COMMIT');
    return hash;
  } catch (err) { try { db.exec('ROLLBACK'); } catch (_) { /* ignore */ } throw err; }
}

function verifyAudit(db) {
  let prevHash = null, count = 0, first = null;
  for (const row of db.prepare('SELECT seq, at, actor, action, target, detail, ip, prev, hash FROM audit ORDER BY seq ASC').iterate()) {
    if (first === null) first = row.seq;
    if (prevHash !== null && row.prev !== prevHash) return { ok: false, count, brokenAt: row.seq, reason: 'chain' };
    if (rowHash(row.prev, row) !== row.hash) return { ok: false, count, brokenAt: row.seq, reason: 'content' };
    prevHash = row.hash; count++;
  }
  return { ok: true, count, first };
}

function purgeAudit(db, before) { return db.prepare('DELETE FROM audit WHERE at < ?').run(before).changes; }

module.exports = { ensureAuditTable, appendAudit, verifyAudit, purgeAudit, GENESIS };
