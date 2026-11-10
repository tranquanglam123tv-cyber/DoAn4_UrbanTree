const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../urbantree.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Không thể kết nối SQLite database:', err.message);
  } else {
    console.log('✅ Đã kết nối SQLite database:', dbPath);
  }
});

// Helper thêm cột nếu chưa tồn tại (tránh lỗi khi bảng đã có sẵn dữ liệu)
function addColumnIfNotExists(tableName, columnName, columnDef) {
  db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`, () => {
    // Bỏ qua lỗi duplicate column name nếu cột đã tồn tại
  });
}

// Khởi tạo các bảng cho cơ sở dữ liệu tuân thủ 100% sơ đồ UrbanTree_ERD.puml
db.serialize(() => {
  // Kích hoạt chế độ Foreign Keys trong SQLite
  db.run("PRAGMA foreign_keys = ON;");

  // ==============================================================
  // 1. NHÓM QUẢN TRỊ NGƯỜI DÙNG & PHÂN QUYỀN (users)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      full_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'STAFF', 'CITIZEN')),
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      google_id TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  addColumnIfNotExists('users', 'google_id', 'TEXT');
  addColumnIfNotExists('users', 'avatar_url', 'TEXT');

  // ==============================================================
  // 2. NHÓM QUẢN LÝ LOÀI CÂY (tree_types)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS tree_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      scientific_name TEXT,
      description TEXT,
      care_guide TEXT,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==============================================================
  // 3. NHÓM QUẢN LÝ CÂY XANH (trees)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS trees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_code TEXT UNIQUE NOT NULL,
      tree_type_id INTEGER,
      species TEXT NOT NULL,
      location_name TEXT NOT NULL,
      address TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      planted_date TEXT NOT NULL,
      height_meter REAL,
      diameter_cm REAL,
      health_status TEXT DEFAULT 'Tốt' CHECK(health_status IN ('Tốt', 'Bình thường', 'Cần chăm sóc', 'Sâu bệnh', 'Nguy hiểm')),
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'INACTIVE', 'REMOVED')),
      qr_code_url TEXT,
      image_url TEXT,
      data_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tree_type_id) REFERENCES tree_types(id) ON DELETE SET NULL
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_tree_code ON trees(tree_code);`);

  // Bổ sung các cột mới theo ERD nếu bảng trees cũ chưa có
  addColumnIfNotExists('trees', 'tree_type_id', 'INTEGER');
  addColumnIfNotExists('trees', 'address', 'TEXT');
  addColumnIfNotExists('trees', 'height_meter', 'REAL');
  addColumnIfNotExists('trees', 'diameter_cm', 'REAL');
  addColumnIfNotExists('trees', 'status', "TEXT DEFAULT 'ACTIVE'");
  addColumnIfNotExists('trees', 'image_url', 'TEXT');

  // ==============================================================
  // 4. NHÓM NHẬT KÝ CHĂM SÓC THỰC ĐỊA (care_records)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS care_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      care_code TEXT UNIQUE,
      tree_id INTEGER NOT NULL,
      staff_id INTEGER,
      caretaker_name TEXT NOT NULL,
      action_type TEXT NOT NULL CHECK(action_type IN ('Tưới nước', 'Bón phân', 'Cắt tỉa', 'Trị sâu bệnh', 'Gia cố cọc')),
      health_before TEXT,
      health_after TEXT,
      notes TEXT,
      image_before_url TEXT,
      image_after_url TEXT,
      data_hash TEXT,
      anchor_status TEXT DEFAULT 'PENDING' CHECK(anchor_status IN ('PENDING', 'CONFIRMED', 'FAILED')),
      action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE,
      FOREIGN KEY (staff_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Bổ sung các cột mới theo ERD nếu bảng care_records cũ chưa có
  addColumnIfNotExists('care_records', 'care_code', 'TEXT');
  addColumnIfNotExists('care_records', 'staff_id', 'INTEGER');
  addColumnIfNotExists('care_records', 'health_before', 'TEXT');
  addColumnIfNotExists('care_records', 'health_after', 'TEXT');
  addColumnIfNotExists('care_records', 'image_before_url', 'TEXT');
  addColumnIfNotExists('care_records', 'image_after_url', 'TEXT');
  addColumnIfNotExists('care_records', 'data_hash', 'TEXT');
  addColumnIfNotExists('care_records', 'anchor_status', "TEXT DEFAULT 'PENDING'");
  addColumnIfNotExists('care_records', 'created_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  // ==============================================================
  // 5. NHÓM TIẾP NHẬN SỰ CỐ (incidents)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_code TEXT UNIQUE,
      tree_id INTEGER,
      reporter_name TEXT NOT NULL,
      reporter_phone TEXT NOT NULL,
      reporter_email TEXT,
      description TEXT NOT NULL,
      address TEXT,
      latitude REAL,
      longitude REAL,
      image_url TEXT,
      severity TEXT DEFAULT 'Trung bình' CHECK(severity IN ('Thấp', 'Trung bình', 'Cao', 'Khẩn cấp')),
      status TEXT DEFAULT 'Chờ xử lý' CHECK(status IN ('Chờ xử lý', 'Đã tiếp nhận', 'Đang xử lý', 'Đã giải quyết', 'Đã hoàn thành', 'Từ chối')),
      assigned_staff_id INTEGER,
      reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE SET NULL,
      FOREIGN KEY (assigned_staff_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // Bổ sung các cột mới theo ERD nếu bảng incidents cũ chưa có
  addColumnIfNotExists('incidents', 'tracking_code', 'TEXT');
  addColumnIfNotExists('incidents', 'reporter_email', 'TEXT');
  addColumnIfNotExists('incidents', 'address', 'TEXT');
  addColumnIfNotExists('incidents', 'latitude', 'REAL');
  addColumnIfNotExists('incidents', 'longitude', 'REAL');
  addColumnIfNotExists('incidents', 'assigned_staff_id', 'INTEGER');
  addColumnIfNotExists('incidents', 'resolved_at', 'DATETIME');
  addColumnIfNotExists('incidents', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

  // ==============================================================
  // 6. NHÓM LỊCH SỬ TIẾN ĐỘ SỰ CỐ (incident_updates)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS incident_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id INTEGER NOT NULL,
      actor_id INTEGER,
      old_status TEXT,
      new_status TEXT NOT NULL,
      notes TEXT,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
      FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  // ==============================================================
  // 7. NHÓM KIỂM TOÁN VÀ NEO HASH BLOCKCHAIN (blockchain_audits)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS blockchain_audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_type TEXT NOT NULL CHECK(record_type IN ('TREE_PROFILE', 'CARE_LOG', 'INCIDENT_REPORT', 'AI_ASSESSMENT')),
      record_id TEXT NOT NULL,
      data_hash TEXT NOT NULL,
      tx_hash TEXT,
      block_number INTEGER,
      chain_id INTEGER DEFAULT 31337,
      contract_address TEXT,
      recorder_address TEXT,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'FAILED')),
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      confirmed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_audit_record ON blockchain_audits(record_type, record_id);`);

  // ==============================================================
  // 8. NHÓM XÁC THỰC MÃ OTP (otp_codes)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT DEFAULT 'LOGIN' CHECK(type IN ('LOGIN', 'REGISTER', 'RESET_PASSWORD')),
      expires_at DATETIME NOT NULL,
      is_used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes(email);`);

  // ==============================================================
  // 9. NHÓM ĐÁNH GIÁ TRÍ TUỆ NHÂN TẠO GEMINI (ai_assessments)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS ai_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tree_id INTEGER,
      assessment_type TEXT NOT NULL CHECK(assessment_type IN ('HEALTH', 'CLIMATE_MATCH', 'RISK', 'CARE_PLAN')),
      score REAL,
      grade TEXT,
      risk_level TEXT CHECK(risk_level IN ('Thấp', 'Trung bình', 'Cao', 'Khẩn cấp', NULL)),
      summary TEXT,
      details TEXT,
      data_hash TEXT,
      tx_hash TEXT,
      anchor_status TEXT DEFAULT 'NOT_ANCHORED' CHECK(anchor_status IN ('NOT_ANCHORED', 'PENDING', 'CONFIRMED', 'FAILED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_ai_tree ON ai_assessments(tree_id, assessment_type);`);

  // ==============================================================
  // CHÈN DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
  // ==============================================================
  // 1. Seed Users
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('👤 Đang khởi tạo danh mục Người dùng mẫu...');
      const sampleUsers = [
        ['admin', 'admin@urbantree.vn', '$2b$10$hashedAdminPassword', 'Đặng Thế Thuận (Admin)', '0901234567', 'ADMIN', 'ACTIVE'],
        ['staff_lam', 'lam@urbantree.vn', '$2b$10$hashedLamPassword', 'Trần Quang Lâm (Kỹ sư Blockchain)', '0907654321', 'STAFF', 'ACTIVE'],
        ['staff_thuan', 'thuan@urbantree.vn', '$2b$10$hashedThuanPassword', 'Đặng Thế Thuận (Kỹ sư Backend)', '0901112233', 'STAFF', 'ACTIVE']
      ];
      const stmt = db.prepare("INSERT INTO users (username, email, password_hash, full_name, phone, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)");
      sampleUsers.forEach(u => stmt.run(u));
      stmt.finalize();
    }
  });

  // 2. Seed Tree Types
  db.get("SELECT COUNT(*) AS count FROM tree_types", (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('🌿 Đang khởi tạo danh mục Loài cây đô thị...');
      const sampleTypes = [
        ['Cây Bàng Đài Loan', 'Terminalia mantaly', 'Cây thân gỗ nhỏ, tán tầng đẹp, rễ ăn sâu ít phá vỉa hè', 'Tưới nước định kỳ 2 lần/tuần, cắt tỉa cành la đầu mùa mưa', 'ACTIVE'],
        ['Cây Giáng Hương', 'Pterocarpus macrocarpus', 'Cây gỗ quý, hoa vàng thơm, tạo bóng mát công viên và vỉa hè rộng', 'Bón phân NPK đầu mùa mưa, phòng sâu đục thân hàng năm', 'ACTIVE'],
        ['Cây Lim Xẹt', 'Peltophorum pterocarpum', 'Cây hoa vàng rực rỡ, tán lá xanh quanh năm, chịu hạn tốt', 'Chăm sóc thường xuyên 3 năm đầu, sau đó tỉa cành định kỳ', 'ACTIVE'],
        ['Cây Sao Đen', 'Hopea odorata', 'Cây bóng mát đại mộc, thân thẳng tắp, tuổi thọ cao', 'Quản lý chiều cao, cắt tỉa cành mục trước mùa bão lũ', 'ACTIVE']
      ];
      const stmt = db.prepare("INSERT INTO tree_types (name, scientific_name, description, care_guide, status) VALUES (?, ?, ?, ?, ?)");
      sampleTypes.forEach(t => stmt.run(t));
      stmt.finalize();
    }
  });

  // 3. Seed Trees
  db.get("SELECT COUNT(*) AS count FROM trees", (err, row) => {
    if (!err && row && row.count === 0) {
      console.log('🌱 Đang chèn dữ liệu mẫu cây xanh...');
      const sampleTrees = [
        ['TREE-001', 1, 'Cây Bàng Đài Loan', 'Công viên 23/9, Q.1, TP.HCM', 'Công viên 23/9, Đường Phạm Ngũ Lão, P. Phạm Ngũ Lão, Q.1', 10.7684, 106.6934, '2023-01-15', 5.2, 22.0, 'Tốt', 'ACTIVE'],
        ['TREE-002', 2, 'Cây Giáng Hương', 'Đường Nguyễn Huệ, Q.1, TP.HCM', 'Phố đi bộ Nguyễn Huệ, P. Bến Nghé, Q.1', 10.7745, 106.7032, '2022-08-20', 6.5, 30.5, 'Tốt', 'ACTIVE'],
        ['TREE-003', 3, 'Cây Lim Xẹt', 'Công viên Tao Đàn, Q.3, TP.HCM', 'Công viên Tao Đàn, Đường Trương Định, P. Bến Thành, Q.1', 10.7758, 106.6912, '2021-05-10', 8.0, 38.0, 'Cần chăm sóc', 'ACTIVE']
      ];
      const stmt = db.prepare("INSERT INTO trees (tree_code, tree_type_id, species, location_name, address, latitude, longitude, planted_date, height_meter, diameter_cm, health_status, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      sampleTrees.forEach(tree => stmt.run(tree));
      stmt.finalize();
    }
  });
});

module.exports = db;
