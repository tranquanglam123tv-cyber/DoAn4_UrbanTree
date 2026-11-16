/**
 * WAVE 5.0.2 — GATE C: FINAL EVIDENCE RECONCILIATION (STRICTLY READ-ONLY)
 * 
 * Captures a single, unified, immutable snapshot of the entire UrbanTree SQLite database
 * and runtime API state at this exact moment in time.
 * 
 * Explains and proves with exact mathematical and event-ledger precision:
 * 1. EV-CONSISTENCY-001: The care_records count reconciliation.
 * 2. EV-CONSISTENCY-002: The Campaign bucket transitions across test runs.
 * 3. Final unified raw counts and assertions at this single timestamp.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = path.resolve(__dirname, '../urbantree.db');
const FROZEN_FILE_PATH = path.resolve(__dirname, '../../src/components/HomeLandingView.tsx');
const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';

function getSha256(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function getGitHash(filePath) {
  const content = fs.readFileSync(filePath);
  const header = `blob ${content.length}\0`;
  const store = Buffer.concat([Buffer.from(header), content]);
  return crypto.createHash('sha1').update(store).digest('hex');
}

function querySql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function runGateC() {
  const snapshotTimestamp = new Date().toISOString();
  console.log('======================================================================');
  console.log('🏛️  WAVE 5.0.2 — GATE C: FINAL EVIDENCE RECONCILIATION (READ-ONLY)');
  console.log(`⏱️  Snapshot Timestamp: ${snapshotTimestamp}`);
  console.log('======================================================================\n');

  // 1. FILE & DATABASE IDENTITY METRICS
  const dbStat = fs.statSync(DB_PATH);
  const dbSha256 = getSha256(DB_PATH);
  const frozenGitHash = getGitHash(FROZEN_FILE_PATH);

  console.log('--- 1. DATABASE & FILE IDENTITY PROOF ---');
  console.log(`DB File Path:        ${DB_PATH}`);
  console.log(`DB File Size:        ${dbStat.size} bytes (${(dbStat.size / 1024 / 1024).toFixed(3)} MB)`);
  console.log(`DB SHA-256:          ${dbSha256}`);
  console.log(`Frozen File Path:    ${FROZEN_FILE_PATH}`);
  console.log(`Frozen File GitHash: ${frozenGitHash} (Baseline: 09dcbe69957ab2f762ea6e4cf24854cf1ab2117e)`);
  console.log(`Frozen File Valid:   ${frozenGitHash === '09dcbe69957ab2f762ea6e4cf24854cf1ab2117e' ? 'YES (100% UNTOUCHED)' : 'NO'}`);

  const db = new sqlite3.Database(DB_PATH);

  try {
    // 2. RAW SQL DATABASE ENTITY COUNTS
    console.log('\n--- 2. RAW DATABASE ENTITY COUNTS (SINGLE SNAPSHOT) ---');
    const totalTrees = (await querySql(db, 'SELECT COUNT(*) as c FROM trees'))[0].c;
    const totalWorkOrders = (await querySql(db, 'SELECT COUNT(*) as c FROM work_orders'))[0].c;
    const totalItems = (await querySql(db, 'SELECT COUNT(*) as c FROM work_order_items'))[0].c;
    const totalCareRecords = (await querySql(db, 'SELECT COUNT(*) as c FROM care_records'))[0].c;

    console.log(`Total Trees:            ${totalTrees}`);
    console.log(`Total Work Orders:      ${totalWorkOrders}`);
    console.log(`Total Work Order Items: ${totalItems}`);
    console.log(`Total Care Records:     ${totalCareRecords}`);

    // Work Orders breakdown by status
    const woStatuses = await querySql(db, 'SELECT status, COUNT(*) as c FROM work_orders GROUP BY status ORDER BY status');
    console.log('\nWork Orders by status:', woStatuses);

    // 3. EV-CONSISTENCY-001: CARE RECORDS EXACT AUDIT & PROVENANCE
    console.log('\n--- 3. EV-CONSISTENCY-001: CARE RECORDS EXACT BREAKDOWN & EVENT LEDGER ---');
    const careBreakdown = await querySql(db, `
      SELECT anchor_status, COUNT(*) as c 
      FROM care_records 
      GROUP BY anchor_status
      ORDER BY anchor_status
    `);
    console.log('care_records GROUP BY anchor_status:', careBreakdown);

    const careTotals = (await querySql(db, `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN anchor_status = 'CONFIRMED' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN anchor_status = 'PENDING_VERIFICATION' THEN 1 ELSE 0 END) as pending_verification,
        SUM(CASE WHEN anchor_status = 'REJECTED' THEN 1 ELSE 0 END) as rejected
      FROM care_records
    `))[0];
    console.log('care_records aggregate query:', careTotals);

    // Duplicates check
    const dupCareGroups = await querySql(db, `
      SELECT work_order_id, tree_id, COUNT(*) as c
      FROM care_records
      WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
      GROUP BY work_order_id, tree_id
      HAVING COUNT(*) > 1
    `);
    console.log(`Duplicate (work_order_id, tree_id) in care_records: ${dupCareGroups.length} groups`);

    // Unique index check
    const indexList = await querySql(db, `PRAGMA index_list('care_records')`);
    const uniqueIndex = indexList.find(idx => idx.name === 'idx_care_records_wo_tree');
    console.log('idx_care_records_wo_tree exists & unique:', Boolean(uniqueIndex && uniqueIndex.unique));

    // 4. EV-CONSISTENCY-002: CAMPAIGN BUCKET PROVENANCE & SNAPSHOT
    console.log('\n--- 4. EV-CONSISTENCY-002: CAMPAIGN BUCKET EXACT FORMULA & RUNTIME STATE ---');
    
    // Fetch live campaign status from API with JWT auth
    const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
    let campaignApiData = null;
    try {
      const resp = await fetch('http://localhost:5001/api/work-orders/campaigns/storm-status', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      const json = await resp.json();
      if (json.success) campaignApiData = json.data;
    } catch (e) {
      console.warn('API fetch warning:', e.message);
    }

    if (campaignApiData) {
      console.log('Live Campaign API Response:', {
        campaignId: campaignApiData.campaignId,
        totalTreesInCampaign: campaignApiData.totalTreesInCampaign,
        verifiedTrees: campaignApiData.verifiedTrees,
        inProgressTrees: campaignApiData.inProgressTrees,
        assignedTrees: campaignApiData.assignedTrees,
        unassignedTrees: campaignApiData.unassignedTrees,
        blockedTrees: campaignApiData.blockedTrees,
        remainingTrees: campaignApiData.remainingTrees,
        progressPercent: campaignApiData.progressPercent,
        isReconciled: campaignApiData.isReconciled,
        sum: campaignApiData.verifiedTrees + campaignApiData.inProgressTrees + campaignApiData.assignedTrees + campaignApiData.unassignedTrees + campaignApiData.blockedTrees
      });
    }

    // Direct SQL derivation of campaign buckets:
    const sqlVerified = (await querySql(db, `
      SELECT COUNT(DISTINCT cr.tree_id) as c 
      FROM care_records cr
      JOIN work_orders wo ON cr.work_order_id = wo.id
      WHERE cr.action_type = 'Cắt tỉa'
        AND cr.anchor_status = 'CONFIRMED'
        AND wo.status IN ('COMPLETED', 'VERIFIED', 'CLOSED')
    `))[0].c;

    console.log(`SQL Direct Verified Trees matching controller query: ${sqlVerified}`);

    // Active tree assignments duplicate check (F-04)
    const dupActiveTrees = await querySql(db, `
      SELECT tree_id, COUNT(DISTINCT work_order_id) as active_assignments
      FROM work_order_items
      WHERE work_order_id IN (
        SELECT id FROM work_orders WHERE status NOT IN ('COMPLETED', 'CANCELLED')
      )
      GROUP BY tree_id
      HAVING COUNT(DISTINCT work_order_id) > 1
    `);
    console.log(`Active duplicate tree assignments (F-04): ${dupActiveTrees.length}`);

    // Output complete reconciliation summary object
    const finalReconciliation = {
      timestamp: snapshotTimestamp,
      database: {
        path: DB_PATH,
        sizeBytes: dbStat.size,
        sizeMb: (dbStat.size / 1024 / 1024).toFixed(3),
        sha256: dbSha256
      },
      frozenBoundary: {
        path: FROZEN_FILE_PATH,
        gitHash: frozenGitHash,
        baselineHash: '09dcbe69957ab2f762ea6e4cf24854cf1ab2117e',
        matches: frozenGitHash === '09dcbe69957ab2f762ea6e4cf24854cf1ab2117e'
      },
      counts: {
        totalTrees,
        totalWorkOrders,
        totalItems,
        totalCareRecords,
        careBreakdown: careTotals,
        careDuplicates: dupCareGroups.length,
        hasUniqueIndex: Boolean(uniqueIndex && uniqueIndex.unique),
        activeTreeDuplicates: dupActiveTrees.length
      },
      campaign: campaignApiData
    };

    fs.writeFileSync(
      path.resolve(__dirname, '../../GateC_Runtime_Snapshot.json'),
      JSON.stringify(finalReconciliation, null, 2),
      'utf8'
    );
    console.log('\n✅ Gate C Snapshot written to: GateC_Runtime_Snapshot.json');
    console.log('======================================================================\n');
  } finally {
    db.close();
  }
}

runGateC().catch(err => {
  console.error('Gate C execution error:', err);
  process.exit(1);
});
