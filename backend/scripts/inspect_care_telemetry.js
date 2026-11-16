const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('backend/urbantree.db');

db.serialize(() => {
  db.all('SELECT action_type, COUNT(*) as c FROM care_records GROUP BY action_type', (err, rows) => {
    console.log('Action types:', rows);
  });

  db.all('SELECT action_date, created_at FROM care_records LIMIT 5', (err, rows) => {
    console.log('Sample dates:', rows);
  });

  db.all('SELECT SUBSTR(action_date, 1, 10) as d, COUNT(*) as c FROM care_records GROUP BY d ORDER BY d DESC LIMIT 15', (err, rows) => {
    console.log('Dates by action_date:', rows);
  });

  db.all('SELECT SUBSTR(created_at, 1, 10) as cd, COUNT(*) as c FROM care_records GROUP BY cd ORDER BY cd DESC LIMIT 15', (err, rows) => {
    console.log('Dates by created_at:', rows);
    db.close();
  });
});

