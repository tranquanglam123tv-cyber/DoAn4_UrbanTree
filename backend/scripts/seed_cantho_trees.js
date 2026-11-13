const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../urbantree.db');
const geojsonPath = path.resolve(__dirname, '../../tailieu/exportDuLieuCayXanh.geojson');

if (!fs.existsSync(geojsonPath)) {
  console.error('❌ Không tìm thấy file dữ liệu OSM:', geojsonPath);
  process.exit(1);
}

const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
const features = geojson.features || [];
console.log(`🌲 Tìm thấy ${features.length} đối tượng cây trong file GeoJSON Cần Thơ.`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Không thể kết nối SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Đã kết nối cơ sở dữ liệu SQLite máy chủ:', dbPath);
});

db.serialize(() => {
  db.run('BEGIN TRANSACTION;');

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO trees (
      tree_code, tree_type_id, species, location_name, address,
      latitude, longitude, planted_date, height_meter, diameter_cm,
      health_status, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  for (let i = 0; i < features.length; i++) {
    const f = features[i];
    const coords = f.geometry?.coordinates;
    if (!coords || !Array.isArray(coords) || coords.length < 2) continue;
    const lng = parseFloat(coords[0]);
    const lat = parseFloat(coords[1]);
    if (isNaN(lat) || isNaN(lng)) continue;

    const p = f.properties || {};
    const code = `CT-OSM-${String(i + 1).padStart(4, '0')}`;
    const height = parseFloat(p.height || 8) || 8;
    const address = `Tọa độ (${lat.toFixed(5)}, ${lng.toFixed(5)}), Ninh Kiều, Cần Thơ`;
    const species = 'Cây Xanh Đô Thị';

    stmt.run(
      code,
      1,
      species,
      'Cần Thơ',
      address,
      lat,
      lng,
      '2023-03-15',
      height,
      30,
      'Tốt',
      'ACTIVE'
    );
    inserted++;
  }

  stmt.finalize();

  db.run('COMMIT;', (err) => {
    if (err) {
      console.error('❌ Lỗi commit transaction:', err.message);
    } else {
      console.log(`🎉 Thành công! Đã lưu vĩnh viễn ${inserted} cây vào database máy chủ SQLite: ${dbPath}`);
    }
    db.close();
  });
});

