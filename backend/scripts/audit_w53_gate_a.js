/**
 * WAVE 5.0.3 — GATE A: READ-ONLY FORENSIC AUDIT SCRIPT
 * 
 * Performs read-only inspection of:
 * 1. W53-001: Telemetry & Chart Data Provenance in DashboardView.tsx, storage.ts, and backend APIs.
 * 2. W53-002: Blockchain Anchor Persistence, Storage, Schema, and Reset Root Cause.
 */

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(DB_PATH);

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function auditGateA() {
  console.log('======================================================================');
  console.log('🔍 WAVE 5.0.3 — GATE A: READ-ONLY FORENSIC AUDIT');
  console.log('======================================================================\n');

  // --- 1. INSPECT BLOCKCHAIN TABLES SCHEMA & DATA ---
  console.log('[SECTION 1] SQLite Blockchain Tables Schema & Row Counts:');
  const tables = ['blockchain_audits', 'blockchain_anchor_queue', 'blockchain_anchor_jobs'];
  for (const t of tables) {
    const schema = await query(`SELECT sql FROM sqlite_master WHERE name = ?`, [t]);
    const count = await query(`SELECT COUNT(*) as c FROM ${t}`);
    console.log(`\nTable: ${t} (Count: ${count[0].c})`);
    console.log(`Schema: ${schema[0]?.sql}`);
    if (count[0].c > 0) {
      const sample = await query(`SELECT * FROM ${t} LIMIT 3`);
      console.log('Sample rows:', sample);
    }
  }

  // --- 2. CHECK TREES & CARE_RECORDS DATA_HASH COLUMNS ---
  console.log('\n[SECTION 2] Data Hash Columns on Core Entities:');
  const treeHashCount = await query(`SELECT COUNT(*) as c FROM trees WHERE data_hash IS NOT NULL AND data_hash != ''`);
  console.log(`Trees with data_hash: ${treeHashCount[0].c} / 5425`);

  const careHashCount = await query(`SELECT COUNT(*) as c FROM care_records WHERE data_hash IS NOT NULL AND data_hash != ''`);
  console.log(`Care records with data_hash: ${careHashCount[0].c} / 533`);

  // --- 3. CHECK BACKEND BLOCKCHAIN CONTROLLER / ROUTES ---
  console.log('\n[SECTION 3] Check Backend Blockchain Status Endpoint:');
  try {
    const res = await fetch('http://localhost:5001/api/blockchain/status');
    const statusData = await res.json();
    console.log('API /api/blockchain/status response:', statusData);
  } catch (e) {
    console.log('API /api/blockchain/status error:', e.message);
  }

  try {
    const res = await fetch('http://localhost:5001/api/blockchain/explorer');
    const explorerData = await res.json();
    console.log('API /api/blockchain/explorer response:', {
      success: explorerData.success,
      totalRecords: explorerData.totalRecords,
      recordsLength: explorerData.records?.length
    });
  } catch (e) {
    console.log('API /api/blockchain/explorer error:', e.message);
  }

  // --- 4. CHECK PERSISTENCE IN FRONTEND STORAGE.TS ---
  console.log('\n[SECTION 4] Trace storage.ts & blockchainService.ts:');
  const storageContent = fs.readFileSync(path.resolve(__dirname, '../../src/db/storage.ts'), 'utf8');
  console.log('storage.ts has blockchain methods:', storageContent.includes('blockchain') || storageContent.includes('anchor'));

  // --- 5. CHECK DASHBOARD TELEMETRY BACKEND APIS ---
  console.log('\n[SECTION 5] Check Dashboard Analytics / Telemetry APIs:');
  const dashboardRoutes = fs.readFileSync(path.resolve(__dirname, '../src/routes/dashboardRoutes.js'), 'utf8');
  console.log('dashboardRoutes endpoints:');
  dashboardRoutes.split('\n').filter(l => l.includes('router.get')).forEach(l => console.log('  ' + l.trim()));

  db.close();
  console.log('\n======================================================================');
  console.log('✅ GATE A FORENSIC READ-ONLY AUDIT COMPLETE');
  console.log('======================================================================');
}

auditGateA().catch(console.error);

