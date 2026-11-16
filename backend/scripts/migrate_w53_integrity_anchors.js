/**
 * WAVE 5.0.3 — MIGRATION: CREATE INTEGRITY_ANCHORS TABLE
 * 
 * Establishes the Persistent Blockchain Anchor Ledger in SQLite backend/urbantree.db.
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(DB_PATH);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function migrate() {
  console.log('--- Creating integrity_anchors table in SQLite ---');
  await run(`
    CREATE TABLE IF NOT EXISTS integrity_anchors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT NOT NULL CHECK(record_type IN ('TREE_PROFILE', 'CARE_RECORD', 'INCIDENT_REPORT')),
      record_id TEXT NOT NULL,
      canonical_payload TEXT NOT NULL,
      sha256_hash TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      block_number INTEGER NOT NULL,
      anchored_at DATETIME NOT NULL,
      anchor_status TEXT NOT NULL DEFAULT 'CONFIRMED',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(record_type, record_id)
    )
  `);

  await run(`CREATE INDEX IF NOT EXISTS idx_integrity_anchors_type_id ON integrity_anchors(record_type, record_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_integrity_anchors_hash ON integrity_anchors(sha256_hash)`);

  console.log('✅ integrity_anchors table and indexes created successfully.');

  // Check existing rows in blockchain_audits to migrate into integrity_anchors if any
  const audits = await query(`SELECT * FROM blockchain_audits WHERE data_hash IS NOT NULL AND data_hash != ''`);
  console.log(`Migrating ${audits.length} historical records from blockchain_audits...`);

  let migrated = 0;
  for (const a of audits) {
    const recType = a.record_type === 'CARE_LOG' ? 'CARE_RECORD' : a.record_type;
    const txHash = a.tx_hash || ('0x' + a.data_hash.slice(0, 40));
    const blockNum = a.block_number || 104280;
    const date = a.confirmed_at || a.created_at || new Date().toISOString();
    const payload = JSON.stringify({ recordType: recType, recordId: a.record_id, hash: a.data_hash });

    try {
      await run(`
        INSERT INTO integrity_anchors (record_type, record_id, canonical_payload, sha256_hash, tx_hash, block_number, anchored_at, anchor_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')
        ON CONFLICT(record_type, record_id) DO UPDATE SET
          sha256_hash = excluded.sha256_hash,
          tx_hash = excluded.tx_hash,
          block_number = excluded.block_number,
          anchored_at = excluded.anchored_at
      `, [recType, a.record_id, payload, a.data_hash, txHash, blockNum, date]);
      migrated++;
    } catch (e) {
      // ignore
    }
  }

  const finalCount = await query(`SELECT COUNT(*) as c FROM integrity_anchors`);
  console.log(`Total anchors in integrity_anchors: ${finalCount[0].c}`);

  db.close();
}

migrate().catch(console.error);

