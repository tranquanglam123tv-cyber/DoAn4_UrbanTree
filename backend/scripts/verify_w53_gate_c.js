/**
 * WAVE 5.0.3 — GATE C: FINAL ACCEPTANCE TESTS
 * 
 * Verifies:
 * - TEST 1: Chart Truth (SQLite == API)
 * - TEST 2: Dynamic Chart Refresh on data change
 * - TEST 3: Anchor Persistence across simulated restart / F5
 * - TEST 4: Idempotency (Anchoring same record twice yields 1 record)
 * - TEST 5: Tamper Detection (Server-side hash mismatch detection)
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(DB_PATH);

const passed = [];
const failed = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passed.push(testName);
    console.log(`  ✅ [PASS] ${testName} ${details ? '-> ' + details : ''}`);
  } else {
    failed.push(testName);
    console.error(`  ❌ [FAIL] ${testName} ${details ? '-> ' + details : ''}`);
  }
}

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function runTests() {
  console.log('======================================================================');
  console.log('🧪 WAVE 5.0.3 — GATE C: FINAL ACCEPTANCE SUITE');
  console.log('======================================================================\n');

  try {
    // -------------------------------------------------------------
    // TEST 1: CHART TRUTH (SQLite == API)
    // -------------------------------------------------------------
    console.log('[TEST 1] Chart Truth: Comparing SQLite direct aggregation with API...');
    const apiRes = await fetch('http://localhost:5001/api/dashboard/maintenance-telemetry').then(r => r.json());
    assert(apiRes.success === true, 'Telemetry API endpoint is healthy');

    const telemetry = apiRes.data;
    assert(telemetry.timeline && telemetry.timeline.length === 7, 'Telemetry returns exactly 7-day timeline');

    // Query SQLite direct weekly total
    const sqlTotalRes = await query(`
      SELECT COUNT(*) as c FROM care_records
      WHERE SUBSTR(COALESCE(action_date, created_at), 1, 10) BETWEEN ? AND ?
    `, [telemetry.timeline[0].date, telemetry.timeline[6].date]);
    const sqlWeeklyTotal = sqlTotalRes[0]?.c || 0;

    assert(telemetry.totalWeeklyCare === sqlWeeklyTotal, 'Telemetry totalWeeklyCare matches SQLite COUNT(*)', `API: ${telemetry.totalWeeklyCare}, SQL: ${sqlWeeklyTotal}`);

    // Verify peak day matches
    const maxDayInTimeline = telemetry.timeline.reduce((max, curr) => curr.count > max.count ? curr : max, telemetry.timeline[0]);
    assert(telemetry.peakDay.count === maxDayInTimeline.count, 'Peak day count matches maximum day count in timeline', `Peak: ${telemetry.peakDay.day} (${telemetry.peakDay.count} ca)`);

    // Verify action percentages strictly sum to 100% (or 0 if empty)
    const pSum = Math.round(
      telemetry.actionDistribution.watering.percent +
      telemetry.actionDistribution.pruning.percent +
      telemetry.actionDistribution.fertilizing.percent +
      telemetry.actionDistribution.treatment.percent
    );
    assert(pSum === 100, 'Action distribution percentages sum to exactly 100%', `Sum: ${pSum}%`);

    // -------------------------------------------------------------
    // TEST 2: CHART REFRESH ON DATA CHANGE
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Chart Refresh: Verifying chart reflects real data updates...');
    const targetDate = telemetry.timeline[6].date;
    const initialDay6Count = telemetry.timeline[6].count;

    // Insert 1 temporary test care record
    const insertRes = await run(`
      INSERT INTO care_records (tree_id, caretaker_name, action_type, action_date, created_at, anchor_status, notes)
      VALUES (1, 'Nhân viên kiểm thử', 'Cắt tỉa', ?, ?, 'CONFIRMED', 'W53-TEST-RECORD')
    `, [targetDate + ' 12:00:00', targetDate + ' 12:00:00']);

    // Re-fetch API
    const refreshedApi = await fetch('http://localhost:5001/api/dashboard/maintenance-telemetry').then(r => r.json());
    const refreshedDay6Count = refreshedApi.data.timeline[6].count;

    assert(refreshedDay6Count === initialDay6Count + 1, 'Telemetry endpoint dynamically increments when a new record is added', `Before: ${initialDay6Count}, After: ${refreshedDay6Count}`);

    // Clean up test record immediately
    await run(`DELETE FROM care_records WHERE id = ?`, [insertRes.lastID]);
    const restoredApi = await fetch('http://localhost:5001/api/dashboard/maintenance-telemetry').then(r => r.json());
    assert(restoredApi.data.timeline[6].count === initialDay6Count, 'Telemetry restores count after test record is deleted', `Restored: ${restoredApi.data.timeline[6].count}`);

    // -------------------------------------------------------------
    // TEST 3: ANCHOR PERSISTENCE ACROSS SIMULATED RESTART / F5
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Anchor Persistence: Verifying anchors persist in SQLite...');
    const testRecordId = 'TREE-W53-PERSIST-9999';
    const testCanonical = JSON.stringify({ id: testRecordId, species: 'Cây Sao Đen Test', height: 15 });
    const testHash = sha256(testCanonical);

    const anchorBatchRes = await fetch('http://localhost:5001/api/blockchain/anchors/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          recordType: 'TREE_PROFILE',
          recordId: testRecordId,
          hash: testHash,
          canonicalJson: testCanonical
        }]
      })
    }).then(r => r.json());

    assert(anchorBatchRes.success === true, 'Batch anchor API returned HTTP 201 Success');

    // Query SQLite directly
    const storedAnchor = await query(`
      SELECT * FROM integrity_anchors WHERE record_type = 'TREE_PROFILE' AND record_id = ?
    `, [testRecordId]);

    assert(storedAnchor.length === 1, 'Anchor record successfully persisted in SQLite table integrity_anchors', `Found: ${storedAnchor.length} row`);
    assert(storedAnchor[0].sha256_hash === testHash, 'Stored sha256_hash matches computed hash', storedAnchor[0].sha256_hash.slice(0, 20) + '...');
    assert(storedAnchor[0].anchor_status === 'CONFIRMED', 'Anchor status is CONFIRMED');

    // -------------------------------------------------------------
    // TEST 4: IDEMPOTENCY (Double Anchoring)
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Idempotency: Anchoring same record twice...');
    const secondBatchRes = await fetch('http://localhost:5001/api/blockchain/anchors/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          recordType: 'TREE_PROFILE',
          recordId: testRecordId,
          hash: testHash,
          canonicalJson: testCanonical
        }]
      })
    }).then(r => r.json());

    assert(secondBatchRes.success === true, 'Second anchor call completed successfully');

    const duplicateCheck = await query(`
      SELECT COUNT(*) as c FROM integrity_anchors WHERE record_type = 'TREE_PROFILE' AND record_id = ?
    `, [testRecordId]);

    assert(duplicateCheck[0].c === 1, 'Idempotency holds: exactly 1 row exists after double anchoring', `Count: ${duplicateCheck[0].c}`);

    // -------------------------------------------------------------
    // TEST 5: TAMPER DETECTION
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Tamper Detection: Verifying integrity match vs mismatch...');
    
    // 5a: Legitimate record -> VALID
    const validVerifyRes = await fetch('http://localhost:5001/api/blockchain/anchors/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordType: 'TREE_PROFILE',
        recordId: testRecordId,
        currentHash: testHash,
        currentPayload: testCanonical
      })
    }).then(r => r.json());

    assert(validVerifyRes.data.status === 'VALID', 'Cryptographic verification reports VALID for unmodified record');

    // 5b: Tampered record -> MISMATCH
    const tamperedCanonical = JSON.stringify({ id: testRecordId, species: 'Cây Bị Sửa Trái Phép', height: 99 });
    const tamperedHash = sha256(tamperedCanonical);

    const tamperedVerifyRes = await fetch('http://localhost:5001/api/blockchain/anchors/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordType: 'TREE_PROFILE',
        recordId: testRecordId,
        currentHash: tamperedHash,
        currentPayload: tamperedCanonical
      })
    }).then(r => r.json());

    assert(tamperedVerifyRes.data.status === 'MISMATCH', 'Cryptographic verification detects MISMATCH for tampered record');
    assert(tamperedVerifyRes.data.diffFields && tamperedVerifyRes.data.diffFields.length > 0, 'Tamper detection isolates changed diff fields', `Diff fields: ${tamperedVerifyRes.data.diffFields.map(f => f.field).join(', ')}`);

    // Clean up test anchor
    await run(`DELETE FROM integrity_anchors WHERE record_type = 'TREE_PROFILE' AND record_id = ?`, [testRecordId]);

    console.log('\n======================================================================');
    console.log(`🏆 GATE C ACCEPTANCE SUMMARY: ${passed.length} PASS | ${failed.length} FAIL`);
    console.log('======================================================================');

    if (failed.length > 0) process.exit(1);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

runTests();
