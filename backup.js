'use strict';
/*! IT Set Desk — © 2026 Abdullah Amer. All rights reserved. Proprietary software, licensed per agreement. See LICENSE. */
/*
 * Online backups of the Service Desk database (safe while the server is running).
 *
 * CLI (inside the container):   node backup.js
 * Module (used by server.js):   const { makeBackup, listBackups } = require('./backup.js')
 *
 * Files: <DATA_DIR>/backups/servicedesk-<kind>-YYYYMMDD-HHMMSSmmm.db
 *   kind = manual | auto | preimport — each kind keeps its own newest KEEP_BACKUPS files.
 */
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');

const KINDS = ['manual', 'auto', 'preimport'];
const NAME_RE = /^servicedesk-(manual|auto|preimport)-(\d{8})-(\d{9})\.db$/;
const LEGACY_RE = /^servicedesk-(\d{8})-(\d{6})\.db$/; // v2.0 file names

function backupDir(dataDir) { return path.join(dataDir, 'backups'); }

function makeBackup(dataDir, kind, keep) {
  if (!KINDS.includes(kind)) throw new Error('bad backup kind: ' + kind);
  const src = path.join(dataDir, 'servicedesk.db');
  if (!fs.existsSync(src)) throw new Error('Database not found: ' + src);
  const dir = backupDir(dataDir);
  fs.mkdirSync(dir, { recursive: true });
  // YYYYMMDD-HHMMSSmmm — fixed width so names sort chronologically; bump the ms on a clash
  let t = Date.now(), out;
  do {
    const stamp = new Date(t).toISOString().replace(/[-:.]/g, '').replace('T', '-').slice(0, 18);
    out = path.join(dir, `servicedesk-${kind}-${stamp}.db`); t++;
  } while (fs.existsSync(out));
  const db = new DatabaseSync(src, { readOnly: true });
  try {
    db.exec('PRAGMA busy_timeout = 5000');
    db.exec(`VACUUM INTO '${out.replace(/'/g, "''")}'`);
  } finally { db.close(); }
  // verify the copy opens and is consistent before rotating old ones away
  const chk = new DatabaseSync(out, { readOnly: true });
  let ok;
  try { ok = chk.prepare('PRAGMA quick_check').get(); } finally { chk.close(); }
  const okVal = ok && Object.values(ok)[0];
  if (okVal !== 'ok') { try { fs.unlinkSync(out); } catch (e) { /* ignore */ } throw new Error('Backup failed integrity check: ' + okVal); }
  const removed = rotate(dataDir, kind, keep);
  // attachments are immutable and content-addressed: mirror new ones into backups/attachments (hard links)
  const { AttachmentStore } = require('./lib/attachments.js');
  const files = new AttachmentStore(dataDir).backupSync();
  return { file: path.basename(out), path: out, size: fs.statSync(out).size, removed, files };
}

function rotate(dataDir, kind, keep) {
  keep = Math.max(1, +keep || 14);
  const dir = backupDir(dataDir);
  const files = fs.readdirSync(dir).filter(f => { const m = f.match(NAME_RE); return m && m[1] === kind; }).sort();
  const old = files.slice(0, Math.max(0, files.length - keep));
  old.forEach(f => fs.unlinkSync(path.join(dir, f)));
  return old;
}

function listBackups(dataDir) {
  const dir = backupDir(dataDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).map(f => {
    const m = f.match(NAME_RE) || f.match(LEGACY_RE); if (!m) return null;
    const st = fs.statSync(path.join(dir, f));
    return { file: f, kind: NAME_RE.test(f) ? m[1] : 'manual', size: st.size, at: st.mtimeMs };
  }).filter(Boolean).sort((a, b) => b.at - a.at);
}

module.exports = { makeBackup, listBackups, rotate, KINDS };

if (require.main === module) {
  const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
  const KEEP = +(process.env.KEEP_BACKUPS || 14);
  try {
    const r = makeBackup(DATA_DIR, 'manual', KEEP);
    console.log('Backup written:', r.path, `(${(r.size / 1024).toFixed(1)} KB) — integrity OK — ${r.files} new attachment file(s) mirrored`);
    r.removed.forEach(f => console.log('Removed old backup:', f));
  } catch (e) { console.error(e.message); process.exit(1); }
}
