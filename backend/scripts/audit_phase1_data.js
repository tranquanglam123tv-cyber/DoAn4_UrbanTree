const path = require('path');
const db = require(path.resolve(__dirname, '../src/config/db'));

async function audit() {
  const allSql = (sql, params = []) => new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows));
  });

  console.log('====================================================');
  console.log('🔍 PHASE 1 — FORENSIC DATABASE AUDIT FOR URBAN TREE');
  console.log('====================================================');

  // 1. Total trees in SQLite
  const totalTrees = await allSql('SELECT COUNT(*) as c FROM trees');
  console.log('1. Total trees in SQLite:', totalTrees[0].c);

  // 2. Alert trees: (height_meter >= 7 OR diameter_cm >= 25) AND status != 'REMOVED'
  const alertTrees = await allSql("SELECT COUNT(*) as c FROM trees WHERE (height_meter >= 7 OR diameter_cm >= 25) AND status != 'REMOVED'");
  console.log('2. Alert trees matching (H>=7 OR D>=25):', alertTrees[0].c);

  // 3. Why so many? Let us inspect height and diameter distribution in trees
  const heightGe7 = await allSql("SELECT COUNT(*) as c FROM trees WHERE height_meter >= 7 AND status != 'REMOVED'");
  const diamGe25 = await allSql("SELECT COUNT(*) as c FROM trees WHERE diameter_cm >= 25 AND status != 'REMOVED'");
  const heightNull = await allSql('SELECT COUNT(*) as c FROM trees WHERE height_meter IS NULL');
  const diamNull = await allSql('SELECT COUNT(*) as c FROM trees WHERE diameter_cm IS NULL');
  console.log(`3. Height >= 7m: ${heightGe7[0].c} | Diam >= 25cm: ${diamGe25[0].c} | Height null: ${heightNull[0].c} | Diam null: ${diamNull[0].c}`);

  // 4. Sample heights and diameters from trees
  const sampleTrees = await allSql('SELECT id, height_meter, diameter_cm, species, address FROM trees LIMIT 10');
  console.log('4. Sample trees:', sampleTrees);

  // 5. Total work orders and items in SQLite
  const totalWos = await allSql('SELECT COUNT(*) as c FROM work_orders');
  const totalItems = await allSql('SELECT COUNT(*) as c FROM work_order_items');
  console.log(`5. Total work orders in SQLite: ${totalWos[0].c} | Total work_order_items: ${totalItems[0].c}`);

  // 6. How many trees from trees are in work_order_items?
  const uniqueTreesInItems = await allSql('SELECT COUNT(DISTINCT tree_id) as c FROM work_order_items');
  console.log('6. Unique trees assigned to work_order_items:', uniqueTreesInItems[0].c);

  // 7. How many alert trees are NOT assigned to any open work order?
  const unassignedAlertTrees = await allSql(`
    SELECT COUNT(*) as c
    FROM trees t
    WHERE (t.height_meter >= 7 OR t.diameter_cm >= 25)
      AND t.status != 'REMOVED'
      AND t.id NOT IN (
        SELECT DISTINCT woi.tree_id
        FROM work_order_items woi
        JOIN work_orders wo ON woi.work_order_id = wo.id
        WHERE wo.status IN ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW')
      )
  `);
  console.log('7. Alert trees UNASSIGNED to any open work order:', unassignedAlertTrees[0].c);

  // 8. Are there duplicate tree assignments in OPEN work orders?
  const dupTrees = await allSql(`
    SELECT tree_id, COUNT(*) as c
    FROM work_order_items woi
    JOIN work_orders wo ON woi.work_order_id = wo.id
    WHERE wo.status IN ('ASSIGNED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW')
    GROUP BY tree_id
    HAVING c > 1
  `);
  console.log(`8. Duplicate tree assignments in open work orders: ${dupTrees.length}`);
  if (dupTrees.length > 0) {
    console.log('   Sample duplicates:', dupTrees.slice(0, 5));
  }

  // 9. Campaign status in SQLite
  const camp = await allSql("SELECT * FROM campaigns WHERE type = 'STORM_PREPARATION' ORDER BY created_at DESC LIMIT 1");
  console.log('9. Storm campaign:', camp[0]);

  // 10. Care records count
  const careCount = await allSql('SELECT COUNT(*) as c FROM care_records');
  const carePrune = await allSql("SELECT COUNT(*) as c FROM care_records WHERE action_type = 'Cắt tỉa'");
  console.log(`10. Total care_records: ${careCount[0].c} | Pruning care records: ${carePrune[0].c}`);
}

audit().catch(console.error);

