/**
 * UrbanTree - WAVE 2.1 FORENSIC HARDENING & DATA INTEGRITY VERIFICATION SUITE
 * Tests:
 * 1. [P0] Idempotency Guard on verifyWorkOrder() (double-click/retry rejection + 0 duplicate care_records)
 * 2. [P0] Real Equipment State Locking & Releasing in SQLite (status = IN_USE / AVAILABLE, current_work_order_id)
 * 3. [P0] Prevention of double-booking IN_USE equipment
 * 4. [P0] Dynamic Assignment Engine matching capabilities & zones (no more teams[0])
 * 5. [P0] SQLite maintenance_rules table dynamic loading for Auto-Scheduler
 * 6. [P1] Multi-batching & Storm backlog metadata
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const sqlite3 = require('../node_modules/sqlite3').verbose();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';
const dbPath = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(dbPath);

const BASE_URL = 'http://localhost:5001';

const adminToken = jwt.sign(
  { id: 1, username: 'admin', role: 'ADMIN', full_name: 'Đặng Thế Thuận (Admin)' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const staffToken = jwt.sign(
  { id: 2, username: 'staff_lam', role: 'STAFF', full_name: 'Trần Quang Lâm', team_id: 'team-prune-1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function queryDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ HARDENING & DATA INTEGRITY FIX WAVE 2.1');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      if (details) console.log(`     ↳ ${details}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     ↳ ${details}`);
      failed++;
    }
  }

  // 1. JWT Tokens
  console.log('🔑 [BƯỚC 0] Khởi tạo Token Admin & Staff...');
  assert(Boolean(adminToken), 'Khởi tạo Admin JWT Token hợp lệ');
  assert(Boolean(staffToken), 'Khởi tạo Staff JWT Token hợp lệ');

  // ================================================================
  // TEST 1: [P0] Idempotency Guard cho verifyWorkOrder()
  // ================================================================
  console.log('\n🔒 [TEST 1] Idempotency Guard cho verifyWorkOrder()...');
  
  // Tạo 1 lệnh công tác test đưa về SUBMITTED_FOR_REVIEW
  const createTestOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/work-orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    {
      title: 'Lệnh Test Nghiệm Thu Idempotency Guard UT-21',
      type: 'PRUNING',
      priority: 'HIGH',
      treeIds: [1, 2],
      assignedTeamId: 'team-prune-1',
      assignedTeamName: 'Tổ Cắt Tỉa Số 1'
    }
  );
  const testOrderId = createTestOrderRes.data?.data?.id;
  assert(Boolean(testOrderId), 'Tạo lệnh công tác kiểm thử Idempotency', `ID: ${testOrderId}`);

  // Chuyển sang ACCEPTED -> IN_PROGRESS
  await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${testOrderId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    },
    { targetStatus: 'ACCEPTED' }
  );
  await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${testOrderId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
    },
    { targetStatus: 'IN_PROGRESS' }
  );

  // Lấy checklist items và đánh dấu COMPLETED
  const orderDetail = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/work-orders/${testOrderId}`,
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const items = orderDetail.data?.data?.items || orderDetail.data?.items || [];
  for (const it of items) {
    await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/work-orders/items/${it.id}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffToken}` },
      },
      { status: 'COMPLETED', notes: 'Thi công hoàn tất thử nghiệm' }
    );
  }

  // Lần 1: Nghiệm thu ĐẠT (Lệnh chuyển sang COMPLETED)
  const verify1 = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${testOrderId}/verify`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    { isApproved: true, notes: 'Nghiệm thu lần 1 hợp lệ' }
  );
  assert(verify1.status === 200 && verify1.data?.data?.status === 'COMPLETED', 'Lần 1: Nghiệm thu thành công (HTTP 200, status COMPLETED)');

  // Kiểm tra số lượng care_records sinh ra cho lệnh này
  const care1 = await queryDb('SELECT id, care_code, action_type FROM care_records WHERE work_order_id = ?', [testOrderId]);
  assert(care1.length === items.length && care1.length > 0, `Đã ghi nhận ${care1.length} bản ghi care_records trong SQLite`);

  // Lần 2: Double-click / retry nghiệm thu lại lệnh đã COMPLETED
  const verify2 = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${testOrderId}/verify`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    { isApproved: true, notes: 'Nghiệm thu lần 2 (giả lập click đúp)' }
  );
  assert(
    verify2.status === 400 && verify2.data?.success === false,
    'Lần 2: Hệ thống chặn đứng retry nghiệm thu (HTTP 400 Idempotency Guard)',
    verify2.data?.message
  );

  // Kiểm tra lại care_records: Tuyệt đối không được tăng thêm
  const care2 = await queryDb('SELECT id FROM care_records WHERE work_order_id = ?', [testOrderId]);
  assert(care2.length === care1.length, `Bảo vệ toàn vẹn: 0 bản ghi care_records bị trùng (Trước: ${care1.length}, Sau: ${care2.length})`);

  // ================================================================
  // TEST 2: [P0] Khóa và Giải phóng Thiết bị & Tránh Double-booking
  // ================================================================
  console.log('\n🚗 [TEST 2] Khóa và Giải phóng Thiết bị (Equipment State Machine in SQLite)...');

  // Đảm bảo ban đầu eq-truck-18m-01 AVAILABLE
  await queryDb("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL WHERE id = 'eq-truck-18m-01'");

  // Gán phương tiện eq-truck-18m-01 vào 1 lệnh
  const assignOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/work-orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    {
      title: 'Lệnh Test Khóa Thiết Bị eq-truck-18m-01',
      type: 'PRUNING',
      priority: 'HIGH',
      treeIds: [3],
    }
  );
  const lockOrderId = assignOrderRes.data?.data?.id;

  const assignRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${lockOrderId}/assign`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    {
      teamId: 'team-prune-1',
      teamName: 'Tổ Cơ Giới Cắt Tỉa Số 1',
      equipmentId: 'eq-truck-18m-01',
      vehiclePlate: '65A-0892',
    }
  );
  assert(assignRes.status === 200, 'Phân bổ lệnh công tác kèm phương tiện 65A-0892');

  // Kiểm tra bảng equipment trong SQLite: Phải là IN_USE và current_work_order_id = lockOrderId
  const eqLocked = await queryDb("SELECT id, status, current_work_order_id FROM equipment WHERE id = 'eq-truck-18m-01'");
  assert(
    eqLocked[0]?.status === 'IN_USE' && eqLocked[0]?.current_work_order_id === lockOrderId,
    'Trạng thái xe trong SQLite chuyển thành IN_USE và liên kết current_work_order_id',
    `Status: ${eqLocked[0]?.status}, Order: ${eqLocked[0]?.current_work_order_id}`
  );

  // Thử gán xe này cho lệnh khác -> Phải bị HTTP 400 chặn lại
  const conflictOrderRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: '/api/work-orders',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    {
      title: 'Lệnh Test Gây Xung Đột Xe Cơ Giới',
      type: 'PRUNING',
      priority: 'HIGH',
      treeIds: [4],
    }
  );
  const conflictOrderId = conflictOrderRes.data?.data?.id;

  const conflictAssignRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${conflictOrderId}/assign`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    {
      teamId: 'team-prune-2',
      equipmentId: 'eq-truck-18m-01',
      vehiclePlate: '65A-0892',
    }
  );
  assert(
    conflictAssignRes.status === 400 && conflictAssignRes.data?.success === false,
    'Chặn đứng việc double-booking xe đang IN_USE cho lệnh khác (HTTP 400)',
    conflictAssignRes.data?.message
  );

  // Hủy hoặc hoàn tất lệnh lockOrderId -> Xe phải tự động được giải phóng về AVAILABLE
  const cancelRes = await request(
    {
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${lockOrderId}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    },
    { targetStatus: 'CANCELLED', reason: 'Hoàn tất kịch bản kiểm thử xe' }
  );
  assert(cancelRes.status === 200, 'Hủy lệnh kiểm thử lockOrderId');

  const eqReleased = await queryDb("SELECT id, status, current_work_order_id FROM equipment WHERE id = 'eq-truck-18m-01'");
  assert(
    eqReleased[0]?.status === 'AVAILABLE' && eqReleased[0]?.current_work_order_id === null,
    'Xe trong SQLite tự động giải phóng về AVAILABLE, current_work_order_id = null',
    `Status: ${eqReleased[0]?.status}, Order: ${eqReleased[0]?.current_work_order_id}`
  );

  // ================================================================
  // TEST 3: [P0] Đọc quy tắc bảo dưỡng SQLite & Auto-Scheduler
  // ================================================================
  console.log('\n📋 [TEST 3] Auto-Scheduler đọc quy tắc từ bảng SQLite maintenance_rules...');

  // Hủy các lệnh auto-schedule cũ nếu có để kiểm tra việc tạo mới toàn bộ quy tắc
  await queryDb("UPDATE work_orders SET status = 'CANCELLED' WHERE code LIKE 'WO-AUTO-%' AND status != 'CANCELLED' AND status != 'COMPLETED'");

  const activeRules = await queryDb('SELECT * FROM maintenance_rules WHERE is_active = 1');
  assert(activeRules.length >= 5, `Bảng maintenance_rules trong SQLite có ${activeRules.length} quy tắc ACTIVE`);

  // Chạy auto-schedule
  const schedRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/work-orders/auto-schedule',
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(schedRes.status === 201 || schedRes.status === 200, 'Auto-Scheduler API trả về thành công', schedRes.data?.message);

  // ================================================================
  // TEST 4: [P0] Dynamic Assignment Engine
  // ================================================================
  console.log('\n⚙️ [TEST 4] Dynamic Assignment Engine (Khớp năng lực & khu vực)...');

  // Lấy các lệnh vừa sinh từ Auto-Scheduler và kiểm tra assignedTeam
  const allWOs = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/work-orders?status=ASSIGNED',
    method: 'GET',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  const list = allWOs.data?.data || [];
  const waterOrders = list.filter((o) => o.type === 'WATERING');
  const pruneBinhThuyOrders = list.filter((o) => o.type === 'PRUNING' && o.routeId === 'route-vo-van-kiet');

  if (waterOrders.length > 0) {
    const assigned = waterOrders[0].assignedTeamId;
    assert(
      assigned === 'team-care-1',
      `Lệnh Tưới nước được điều phối đúng Tổ Chăm sóc & Dưỡng hộ (team-care-1)`,
      `Team: ${assigned}`
    );
  } else {
    assert(false, 'Phải có lệnh Tưới nước được tạo mới');
  }

  if (pruneBinhThuyOrders.length > 0) {
    const assigned = pruneBinhThuyOrders[0].assignedTeamId;
    assert(
      assigned === 'team-prune-2',
      `Lệnh Cắt tỉa đường Võ Văn Kiệt (Bình Thủy) được điều phối đúng Tổ Bình Thủy (team-prune-2)`,
      `Team: ${assigned}`
    );
  }

  // ================================================================
  // TEST 5: [P1] Multi-Batching & Backlog Metadata
  // ================================================================
  console.log('\n📦 [TEST 5] Multi-Batching & Storm Backlog Metadata...');

  // Reset các lệnh PRUNING cũ để có thể test emergency-storm
  await queryDb("UPDATE work_orders SET status = 'CANCELLED' WHERE type = 'PRUNING' AND status != 'CANCELLED' AND status != 'COMPLETED'");
  await queryDb("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL");

  const stormRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/work-orders/emergency-storm',
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(stormRes.status === 201 && stormRes.data?.createdCount > 0, 'Kích hoạt chiến dịch bão thành công', stormRes.data?.message);

  const stormOrderSample = stormRes.data?.orders?.[0];
  if (stormOrderSample) {
    const dbOrderRow = await queryDb('SELECT batch_index, total_batches, backlog_trees_count FROM work_orders WHERE id = ?', [stormOrderSample.id]);
    assert(
      dbOrderRow[0]?.batch_index === 1 && dbOrderRow[0]?.total_batches >= 1,
      `Metadata đợt cắt tỉa được lưu đúng trong SQLite: Đợt ${dbOrderRow[0]?.batch_index}/${dbOrderRow[0]?.total_batches}, Tồn đọng: ${dbOrderRow[0]?.backlog_trees_count} cây`,
      JSON.stringify(dbOrderRow[0])
    );
  }

  // Cleanup test data created
  console.log('\n🧹 Thu dọn dữ liệu thử nghiệm...');
  await queryDb("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL WHERE current_work_order_id = ?", [testOrderId]);

  console.log('\n================================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('================================================================');

  db.close();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  db.close();
  process.exit(1);
});
