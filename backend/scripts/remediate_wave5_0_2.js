/**
 * WAVE 5.0.2: CONTROLLED REMEDIATION SCRIPT (GATE B)
 * 
 * Remediates the 3 Red-Team Audit Findings:
 * 1. EV-W52-001 (F-04): Cancel obsolete DRAFT work orders holding duplicate assignments on tree_id = '3'
 * 2. EV-W52-002 (F-05): Standardize historical care_records anchor_status to strict lifecycle ('CONFIRMED', 'PENDING_VERIFICATION')
 * 3. EV-W52-003 (F-06): Deduplicate 112 excess records in care_records and create UNIQUE INDEX
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

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

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ changes: this.changes, lastID: this.lastID });
    });
  });
}

async function main() {
  console.log('======================================================================');
  console.log('🛠️  WAVE 5.0.2: GATE B CONTROLLED FORENSIC REMEDIATION');
  console.log('======================================================================\n');

  try {
    // ------------------------------------------------------------------
    // REMEDIATION 1: Cancel obsolete DRAFT work orders holding tree_id = '3'
    // ------------------------------------------------------------------
    console.log('[STEP 1] Remediating EV-W52-001: Cancelling obsolete draft orders...');
    const draftOrdersWithTree3 = await query(`
      SELECT id, code, status, title 
      FROM work_orders 
      WHERE status = 'DRAFT' 
        AND id IN (SELECT work_order_id FROM work_order_items WHERE tree_id = '3')
    `);
    console.log(`Found ${draftOrdersWithTree3.length} obsolete DRAFT orders with tree_id = '3'.`);

    if (draftOrdersWithTree3.length > 0) {
      const orderIds = draftOrdersWithTree3.map(o => `'${o.id}'`).join(',');
      const cancelRes = await run(`UPDATE work_orders SET status = 'CANCELLED' WHERE id IN (${orderIds})`);
      console.log(`  -> Successfully marked ${cancelRes.changes} draft orders as CANCELLED.`);
    }

    // Verify F-04 after fix
    const dupTreesAfter = await query(`
      SELECT tree_id, COUNT(DISTINCT work_order_id) as active_assignments
      FROM work_order_items
      WHERE work_order_id IN (
        SELECT id FROM work_orders WHERE status NOT IN ('COMPLETED', 'CANCELLED')
      )
      GROUP BY tree_id
      HAVING COUNT(DISTINCT work_order_id) > 1
    `);
    console.log(`  -> Verification F-04: Remaining duplicate active tree assignments: ${dupTreesAfter.length}`);

    // ------------------------------------------------------------------
    // REMEDIATION 2: Standardize legacy anchor_status in care_records
    // ------------------------------------------------------------------
    console.log('\n[STEP 2] Remediating EV-W52-002: Standardizing care_records anchor_status...');
    const legacyVerifiedRes = await run(`UPDATE care_records SET anchor_status = 'CONFIRMED' WHERE anchor_status = 'VERIFIED'`);
    console.log(`  -> Migrated 'VERIFIED' -> 'CONFIRMED': ${legacyVerifiedRes.changes} rows updated.`);

    const legacyPendingRes = await run(`UPDATE care_records SET anchor_status = 'PENDING_VERIFICATION' WHERE anchor_status = 'PENDING'`);
    console.log(`  -> Migrated 'PENDING' -> 'PENDING_VERIFICATION': ${legacyPendingRes.changes} rows updated.`);

    // Verify F-05 breakdown
    const anchorStatusCounts = await query(`SELECT anchor_status, COUNT(*) as c FROM care_records GROUP BY anchor_status`);
    console.log('  -> Verification F-05 breakdown:', anchorStatusCounts);

    // ------------------------------------------------------------------
    // REMEDIATION 3: Deduplicate care_records & Add Unique Constraint
    // ------------------------------------------------------------------
    console.log('\n[STEP 3] Remediating EV-W52-003: Deduplicating care_records per (work_order_id, tree_id)...');
    
    // Check duplicates before
    const dupCountBefore = await query(`
      SELECT COUNT(*) as dup_groups FROM (
        SELECT work_order_id, tree_id, COUNT(*) as c
        FROM care_records
        WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
        GROUP BY work_order_id, tree_id
        HAVING COUNT(*) > 1
      )
    `);
    console.log(`  -> Duplicate groups detected: ${dupCountBefore[0].dup_groups}`);

    // Delete older duplicate records keeping MAX(id)
    const delRes = await run(`
      DELETE FROM care_records
      WHERE id NOT IN (
        SELECT MAX(id)
        FROM care_records
        WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
        GROUP BY work_order_id, tree_id
      )
      AND work_order_id IS NOT NULL
      AND tree_id IS NOT NULL
      AND work_order_id IN (
        SELECT work_order_id
        FROM care_records
        WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
        GROUP BY work_order_id, tree_id
        HAVING COUNT(*) > 1
      )
    `);
    console.log(`  -> Deleted ${delRes.changes} excess duplicate records.`);

    // Create unique index for future proofing
    await run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_care_records_wo_tree ON care_records(work_order_id, tree_id)`);
    console.log('  -> UNIQUE INDEX idx_care_records_wo_tree created successfully.');

    // Verify F-06 after
    const dupCountAfter = await query(`
      SELECT COUNT(*) as dup_groups FROM (
        SELECT work_order_id, tree_id, COUNT(*) as c
        FROM care_records
        WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
        GROUP BY work_order_id, tree_id
        HAVING COUNT(*) > 1
      )
    `);
    console.log(`  -> Verification F-06: Remaining duplicate care record groups: ${dupCountAfter[0].dup_groups}`);

    console.log('\n======================================================================');
    console.log('🎉 GATE B REMEDIATION COMPLETED SUCCESSFULLY!');
    console.log('======================================================================');
  } catch (err) {
    console.error('❌ Remediation error:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();

