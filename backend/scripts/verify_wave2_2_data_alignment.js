/**
 * 🧪 BỘ KIỂM THỬ GIÁM ĐỊNH TOÀN DIỆN WAVE 2.2 — DATA ALIGNMENT & SINGLE SOURCE OF TRUTH
 * Kiểm chứng:
 * 1. Master data `routes` (5 tuyến) và `operational_zones` (3 địa bàn) có mặt trong SQLite và phục vụ qua REST API.
 * 2. Lỗ hổng PII Spoofing qua header `x-user-role` đã bị triệt tiêu hoàn toàn (chỉ chấp nhận verified JWT).
 * 3. Chuỗi Incident 2 chiều Citizen -> SQLite -> Staff -> SQLite hoạt động chuẩn xác với token xác thực.
 * 4. Không còn vết tích của mock work orders (wo-ct-2026-001, 002, 004) làm sai lệch dữ liệu tiến độ.
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('../node_modules/jsonwebtoken');
const db = require('../src/config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';
const BASE_URL = 'http://localhost:5001';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function runTestSuite() {
  console.log('========================================================================');
  console.log('🔍 BẮT ĐẦU KIỂM THỬ WAVE 2.2: DATA ALIGNMENT & SINGLE SOURCE OF TRUTH');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition, testName) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
    }
  }

  // 1. Tạo JWT Tokens cho kiểm thử
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
  const staffToken = jwt.sign({ id: 2, username: 'staff_lam', role: 'STAFF' }, JWT_SECRET, { expiresIn: '1h' });

  // TEST 1: Kiểm tra Master Data Routes trong SQLite
  console.log('\n--- TEST NHÓM 1: MASTER DATA ROUTES & OPERATIONAL ZONES TRONG SQLITE ---');
  const routesRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/routes',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  assert(routesRes.status === 200 && routesRes.body.success, 'API GET /api/routes trả về HTTP 200');
  assert(Array.isArray(routesRes.body.data) && routesRes.body.data.length === 5, 'SQLite có đủ 5 tuyến đường trọng điểm Cần Thơ');
  
  const routeCodes = routesRes.body.data.map(r => r.code);
  assert(
    routeCodes.includes('COR-HB') && routeCodes.includes('COR-304') && routeCodes.includes('COR-CMT8') &&
    routeCodes.includes('COR-VVK') && routeCodes.includes('COR-32'),
    '5 tuyến đường có mã định danh chuẩn (COR-HB, COR-304, COR-CMT8, COR-VVK, COR-32)'
  );

  const zonesRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/operational-zones',
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });

  assert(zonesRes.status === 200 && zonesRes.body.success, 'API GET /api/operational-zones trả về HTTP 200');
  assert(Array.isArray(zonesRes.body.data) && zonesRes.body.data.length === 3, 'SQLite có đủ 3 địa bàn vận hành (Ninh Kiều, Bình Thủy, Cái Răng)');

  // TEST 2: Kiểm tra Chống Giả Mạo PII Spoofing
  console.log('\n--- TEST NHÓM 2: CHỐNG GIẢ MẠO PII QUA HEADER (UT-004 SECURITY) ---');
  
  // Tạo 1 sự cố mẫu với thông tin người dân thật
  const uniquePhone = '0987654321';
  const uniqueName = 'Nguyễn Văn Kiểm Thử';
  const createIncidentRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/incidents',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    tree_id: 1,
    reporter_name: uniqueName,
    reporter_phone: uniquePhone,
    description: 'Cành cây nghiêng đe dọa người đi đường',
    severity: 'Cao',
    address: 'Đại Lộ Hòa Bình, Cần Thơ'
  });

  assert(createIncidentRes.status === 201 && createIncidentRes.body.success, 'Tạo thành công sự cố mẫu mới vào SQLite');
  const sampleIncidentId = createIncidentRes.body.data.id;

  // 2a. Gọi unauthenticated -> PII phải bị che
  const anonRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/incidents/${sampleIncidentId}`,
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  });
  assert(anonRes.body.data.reporter_phone.includes('***'), 'Người dùng ẩn danh không thấy số điện thoại thật (bị che masked)');
  assert(anonRes.body.data.reporter_phone !== uniquePhone, 'Số điện thoại người dùng ẩn danh khác số điện thoại gốc');

  // 2b. Gọi với fake header x-user-role: ADMIN (không có JWT token) -> VẪN PHẢI BỊ CHE (Anti-Spoofing)
  const spoofRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/incidents/${sampleIncidentId}`,
    method: 'GET',
    headers: { 
      'Accept': 'application/json',
      'x-user-role': 'ADMIN' // Cố tình giả mạo quyền ADMIN
    }
  });
  assert(spoofRes.body.data.reporter_phone.includes('***'), 'Kẻ tấn công gửi header x-user-role: ADMIN giả mạo VẪN BỊ CHE PII');
  assert(spoofRes.body.data.reporter_phone !== uniquePhone, 'Anti-spoofing thành công: Không tin cậy header x-user-role!');

  // 2c. Gọi với verified JWT token của ADMIN -> Được unmask PII hợp pháp
  const adminRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/incidents/${sampleIncidentId}`,
    method: 'GET',
    headers: { 
      'Accept': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });
  assert(adminRes.body.data.reporter_phone === uniquePhone, 'Admin có JWT token hợp lệ được xem đầy đủ SĐT điều phối tác chiến');
  assert(adminRes.body.data.reporter_name === uniqueName, 'Admin có JWT token hợp lệ được xem đầy đủ họ tên người dân');

  // TEST 3: Cập nhật Trạng Thái Sự Cố với JWT Xác Thực (Staff Resolution Flow)
  console.log('\n--- TEST NHÓM 3: KHÉP KÍN LUỒNG SỰ CỐ VÀ TRẠNG THÁI (STAFF RESOLUTION) ---');
  
  // 3a. Không có token -> Từ chối 401
  const unauthPatch = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/incidents/${sampleIncidentId}/status`,
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: 'Đang xử lý' });
  assert(unauthPatch.status === 401, 'Không có JWT token bị từ chối 401 Unauthorized khi cập nhật sự cố');

  // 3b. Staff cập nhật status bằng mã tiếng Anh (IN_PROGRESS) -> Backend chuẩn hóa thành Đang xử lý
  const staffPatch1 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/incidents/${sampleIncidentId}/status`,
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    }
  }, { status: 'IN_PROGRESS' });
  assert(staffPatch1.status === 200 && staffPatch1.body.status === 'Đang xử lý', 'KTV cập nhật status IN_PROGRESS được chuẩn hóa thành Đang xử lý');

  // 3c. Staff hoàn tất xử lý (RESOLVED) -> Backend lưu resolved_at vào SQLite
  const staffPatch2 = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/incidents/${sampleIncidentId}/status`,
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    }
  }, { status: 'RESOLVED' });
  assert(staffPatch2.status === 200 && staffPatch2.body.status === 'Đã hoàn thành', 'KTV hoàn tất xử lý RESOLVED được chuẩn hóa thành Đã hoàn thành');
  assert(staffPatch2.body.resolved_at != null, 'Mốc thời gian resolved_at được lưu vào SQLite phục vụ Blockchain anchor');

  // Kiểm tra trực tiếp trong SQLite DB
  const [dbIncident] = await allSql('SELECT status, resolved_at FROM incidents WHERE id = ?', [sampleIncidentId]);
  assert(dbIncident && dbIncident.status === 'Đã hoàn thành', 'Dữ liệu sự cố trong SQLite đã chuyển sang Đã hoàn thành');
  assert(dbIncident && dbIncident.resolved_at != null, 'Dữ liệu resolved_at đã ghi nhận vĩnh viễn trong SQLite');

  // TEST 4: Đảm bảo bảng Trees vẫn nguyên vẹn 5.425 cây
  console.log('\n--- TEST NHÓM 4: TOÀN VẸN DỮ LIỆU CÂY XANH ĐÔ THỊ ---');
  const [treeCountRow] = await allSql('SELECT count(*) as count FROM trees');
  assert(treeCountRow && treeCountRow.count === 5425, `Số lượng cây xanh đô thị SQLite giữ nguyên vẹn 5.425 cây (Hiện tại: ${treeCountRow?.count})`);

  // Dọn dẹp incident test
  await runSql('DELETE FROM incidents WHERE id = ?', [sampleIncidentId]);

  // TEST 5: Kiểm tra Source of Truth của Work Orders và Triệt tiêu Mock Numbers
  console.log('\n--- TEST NHÓM 5: TRIỆT TIÊU MOCK WORK ORDERS (36/48, 40/65, 0/32) ---');
  const woRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/work-orders',
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  });

  assert(woRes.status === 200 && woRes.body.success, 'API GET /api/work-orders trả về HTTP 200');
  const sqliteWorkOrders = woRes.body.data;
  
  // Kiểm tra không có bất kỳ lệnh mock nào còn tồn tại
  const mockOrder001 = sqliteWorkOrders.find(w => w.id === 'wo-ct-2026-001');
  const mockOrder002 = sqliteWorkOrders.find(w => w.id === 'wo-ct-2026-002');
  const mockOrder004 = sqliteWorkOrders.find(w => w.id === 'wo-ct-2026-004');

  assert(!mockOrder001, 'Lệnh mock wo-ct-2026-001 (36/48 cây Hòa Bình) không tồn tại trong SQLite');
  assert(!mockOrder002, 'Lệnh mock wo-ct-2026-002 (40/65 cây Võ Văn Kiệt) không tồn tại trong SQLite');
  assert(!mockOrder004, 'Lệnh mock wo-ct-2026-004 (0/32 cây Cách Mạng Tháng 8) không tồn tại trong SQLite');

  // Kiểm tra mọi lệnh trong SQLite đều có mã hợp lệ WO-* và gắn tuyến thực tế
  const invalidCodeOrders = sqliteWorkOrders.filter(w => !w.code || !w.code.startsWith('WO-'));
  assert(invalidCodeOrders.length === 0, '100% Work Orders trong SQLite tuân thủ chuẩn mã WO-* từ Backend');

  console.log('\n========================================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ WAVE 2.2: ${passedTests}/${totalTests} TESTS PASS (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('========================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Lỗi thực thi kiểm thử Wave 2.2:', err);
  process.exit(1);
});
