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
  // 📜 Quản lý Vòng Đời Cây Đốn Hạ / Giải Tỏa theo Luật (UT-002)
  addColumnIfNotExists('trees', 'felling_permit_no', 'TEXT');
  addColumnIfNotExists('trees', 'felling_reason', 'TEXT');
  addColumnIfNotExists('trees', 'approved_by', 'TEXT');
  addColumnIfNotExists('trees', 'felled_at', 'DATETIME');

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
  // 📝 Chuỗi Đính Chính Bất Biến Append-only Correction Chain (UT-008)
  addColumnIfNotExists('care_records', 'supersedes_record_id', 'INTEGER');
  addColumnIfNotExists('care_records', 'correction_reason', 'TEXT');
  addColumnIfNotExists('care_records', 'is_superseded', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('care_records', 'tree_code', 'TEXT');

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
  // 📍 Lọc Trùng Không Gian & Thời Gian (Spatial-Temporal Deduplication - UT-005)
  addColumnIfNotExists('incidents', 'duplicate_count', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('incidents', 'master_incident_id', 'INTEGER');

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
  // 10. NHÓM VẬN HÀNH ĐÔ THỊ & ĐIỀU ĐỘNG CƠ GIỚI (OPERATIONS UPGRADE)
  // ==============================================================
  // 10.1. Ban Chuyên Trách (departments)
  db.run(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 10.2. Phân Cấp Khu Vực & Tuyến Đường (operational_zones & routes)
  db.run(`
    CREATE TABLE IF NOT EXISTS operational_zones (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      district TEXT,
      description TEXT,
      boundary_geometry TEXT,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY,
      zone_id TEXT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      start_point TEXT,
      end_point TEXT,
      total_trees_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (zone_id) REFERENCES operational_zones(id) ON DELETE SET NULL
    )
  `);

  // 10.3. Xe Cơ Giới & Thiết Bị Chuyên Dụng (equipment)
  db.run(`
    CREATE TABLE IF NOT EXISTS equipment (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      plate_number TEXT,
      status TEXT DEFAULT 'AVAILABLE',
      capabilities TEXT,
      assigned_team_id TEXT,
      current_work_order_id TEXT,
      maintenance_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  addColumnIfNotExists('equipment', 'assigned_team_id', 'TEXT');
  addColumnIfNotExists('equipment', 'current_work_order_id', 'TEXT');

  // 10.4. Biên Chế Tổ Đội Thực Địa (teams)
  db.run(`
    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      department_id TEXT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      leader_user_id TEXT,
      leader_name TEXT,
      leader_phone TEXT,
      member_user_ids TEXT,
      capabilities TEXT,
      assigned_equipment_ids TEXT,
      status TEXT DEFAULT 'AVAILABLE',
      current_status TEXT DEFAULT 'AVAILABLE',
      assigned_zone_id TEXT,
      active_work_orders_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
    )
  `);
  addColumnIfNotExists('teams', 'department_id', 'TEXT');
  addColumnIfNotExists('teams', 'assigned_equipment_ids', 'TEXT');

  // 10.5. Lệnh Công Tác Tuyến (work_orders)
  db.run(`
    CREATE TABLE IF NOT EXISTS work_orders (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      priority TEXT NOT NULL,
      scope_type TEXT NOT NULL,
      zone_id TEXT,
      route_id TEXT,
      route_corridor_name TEXT,
      incident_id TEXT,
      status TEXT NOT NULL,
      workflow_status TEXT NOT NULL,
      sla_status TEXT DEFAULT 'ON_TRACK',
      scheduled_start DATETIME,
      scheduled_end DATETIME,
      deadline DATETIME,
      actual_start DATETIME,
      actual_end DATETIME,
      hold_reason TEXT,
      held_by_user_id TEXT,
      held_at DATETIME,
      required_capabilities TEXT,
      required_equipment_ids TEXT,
      assigned_team_id TEXT,
      assigned_team_name TEXT,
      assigned_vehicle_name TEXT,
      assigned_vehicle_plate TEXT,
      total_items INTEGER DEFAULT 0,
      completed_items INTEGER DEFAULT 0,
      skipped_items INTEGER DEFAULT 0,
      failed_items INTEGER DEFAULT 0,
      progress_percent INTEGER DEFAULT 0,
      supervisor_user_id TEXT,
      supervisor_notes TEXT,
      sla_target_minutes INTEGER,
      is_overdue INTEGER DEFAULT 0,
      created_by_user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      payload_hash TEXT,
      anchor_status TEXT DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      last_attempt_at DATETIME,
      next_retry_at DATETIME,
      tx_hash TEXT
    )
  `);
  addColumnIfNotExists('work_orders', 'workflow_status', 'TEXT');
  addColumnIfNotExists('work_orders', 'sla_status', "TEXT DEFAULT 'ON_TRACK'");
  addColumnIfNotExists('work_orders', 'hold_reason', 'TEXT');
  addColumnIfNotExists('work_orders', 'held_by_user_id', 'TEXT');
  addColumnIfNotExists('work_orders', 'held_at', 'DATETIME');
  addColumnIfNotExists('work_orders', 'retry_count', 'INTEGER DEFAULT 0');
  addColumnIfNotExists('work_orders', 'last_error', 'TEXT');
  addColumnIfNotExists('work_orders', 'last_attempt_at', 'DATETIME');
  addColumnIfNotExists('work_orders', 'next_retry_at', 'DATETIME');

  // 10.6. Chi Tiết Thực Thi Từng Cây (work_order_items)
  db.run(`
    CREATE TABLE IF NOT EXISTS work_order_items (
      id TEXT PRIMARY KEY,
      work_order_id TEXT NOT NULL,
      tree_id TEXT NOT NULL,
      tree_street_code TEXT,
      tree_display_name TEXT,
      house_milestone TEXT,
      sequence INTEGER DEFAULT 1,
      status TEXT DEFAULT 'PENDING',
      result TEXT,
      reason TEXT,
      skip_or_failure_reason TEXT,
      completed_at DATETIME,
      completed_by TEXT,
      completed_by_user_id TEXT,
      evidence_before_image_url TEXT,
      evidence_after_image_url TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    )
  `);
  addColumnIfNotExists('work_order_items', 'reason', 'TEXT');
  addColumnIfNotExists('work_order_items', 'completed_by', 'TEXT');

  // 10.7. Nhật Ký Lịch Sử & Audit Lệnh Công Tác (work_order_history)
  db.run(`
    CREATE TABLE IF NOT EXISTS work_order_history (
      id TEXT PRIMARY KEY,
      work_order_id TEXT NOT NULL,
      actor_user_id TEXT,
      actor_name TEXT,
      previous_state TEXT,
      previous_status TEXT,
      newState TEXT,
      new_status TEXT,
      action TEXT,
      reason TEXT,
      previous_team_id TEXT,
      new_team_id TEXT,
      held_reason TEXT,
      performed_by TEXT,
      performed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
    )
  `);
  addColumnIfNotExists('work_order_history', 'action', 'TEXT');
  addColumnIfNotExists('work_order_history', 'previous_team_id', 'TEXT');
  addColumnIfNotExists('work_order_history', 'new_team_id', 'TEXT');
  addColumnIfNotExists('work_order_history', 'held_reason', 'TEXT');

  // 10.8. Hàng Đợi Neo Hash Blockchain với Retry Policy (blockchain_anchor_queue)
  db.run(`
    CREATE TABLE IF NOT EXISTS blockchain_anchor_queue (
      id TEXT PRIMARY KEY,
      payload_type TEXT NOT NULL,
      payload_id TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      canonical_json TEXT,
      status TEXT DEFAULT 'PENDING',
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 5,
      last_error TEXT,
      last_attempt_at DATETIME,
      next_retry_at DATETIME,
      tx_hash TEXT,
      block_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  db.run(`CREATE INDEX IF NOT EXISTS idx_anchor_queue_status ON blockchain_anchor_queue(status, next_retry_at);`);

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
  // ==============================================================
  // 12. BẢNG BÁO CÁO PHẢN ÁNH SỰ CỐ TRÙNG LẶP (incident_duplicate_reports)
  // Phục vụ cơ chế Deduplication: Lưu danh sách người dân cùng phản ánh sự cố
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS incident_duplicate_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      master_incident_id INTEGER NOT NULL,
      reporter_name TEXT,
      reporter_phone TEXT,
      description TEXT,
      image_url TEXT,
      distance_meters REAL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (master_incident_id) REFERENCES incidents(id) ON DELETE CASCADE
    )
  `);

  // ==============================================================
  // 13. BẢNG HÀNG ĐỢI NEO BLOCKCHAIN BỀN VỮNG (blockchain_anchor_jobs)
  // Thay thế in-memory queue, bền vững khi restart server (P0 Durability)
  // ==============================================================
  db.run(`
    CREATE TABLE IF NOT EXISTS blockchain_anchor_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      payload_hash TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'PROCESSING', 'RETRYING', 'CONFIRMED', 'FAILED_FINAL')),
      retry_count INTEGER DEFAULT 0,
      last_error TEXT,
      next_retry_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      tx_hash TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME
    )
  `);
});

module.exports = db;
