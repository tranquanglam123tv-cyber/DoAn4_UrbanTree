const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/urbantree.db');

db.serialize(() => {
  console.log('--- FINDING 1: Duplicate Active Tree Assignments ---');
  db.all(
    `SELECT tree_id, COUNT(DISTINCT work_order_id) as c, GROUP_CONCAT(work_order_id) as orders
     FROM work_order_items
     WHERE work_order_id IN (SELECT id FROM work_orders WHERE status NOT IN ('COMPLETED', 'CANCELLED'))
     GROUP BY tree_id HAVING COUNT(DISTINCT work_order_id) > 1`,
    (err, rows) => {
      console.log('Duplicate trees:', rows);
      if (rows && rows.length > 0) {
        db.all(`SELECT id, code, title, status FROM work_orders WHERE id IN ('${rows[0].orders.split(',').join("','")}')`, (e, wos) => {
          console.log('Work orders involving duplicate tree:', wos);
        });
      }
    }
  );

  console.log('\n--- FINDING 2: Care Records Anchor Status Breakdown ---');
  db.all(
    `SELECT anchor_status, COUNT(*) as count FROM care_records GROUP BY anchor_status`,
    (err, rows) => {
      console.log('Anchor statuses:', rows);
    }
  );

  console.log('\n--- FINDING 3: Care Records Duplicates per (work_order_id, tree_id) ---');
  db.all(
    `SELECT work_order_id, tree_id, COUNT(*) as c
     FROM care_records
     WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
     GROUP BY work_order_id, tree_id HAVING COUNT(*) > 1
     LIMIT 5`,
    (err, rows) => {
      console.log('Sample duplicates:', rows);
      db.get(
        `SELECT COUNT(*) as totalDupGroups, SUM(c - 1) as excessRecords FROM (
           SELECT work_order_id, tree_id, COUNT(*) as c
           FROM care_records
           WHERE work_order_id IS NOT NULL AND tree_id IS NOT NULL
           GROUP BY work_order_id, tree_id HAVING COUNT(*) > 1
         )`,
        (e, sumRow) => {
          console.log('Summary of duplicates:', sumRow);
          db.close();
        }
      );
    }
  );
});

