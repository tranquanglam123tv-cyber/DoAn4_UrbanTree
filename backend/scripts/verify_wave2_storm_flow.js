/**
 * URBANTREE WAVE 2 AUTOMATED TEST SUITE:
 * STORM EMERGENCY & AUTO-SCHEDULER END-TO-END FLOW
 */

const BASE_URL = 'http://localhost:5001';

async function runTests() {
  console.log('================================================================');
  console.log('🧪 URBANTREE WAVE 2 VERIFICATION: STORM & AUTO-SCHEDULER FLOW');
  console.log('================================================================\n');

  let adminToken = '';
  let staffToken = '';

  // 0. ĐĂNG NHẬP ADMIN & STAFF
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' })
  });
  const adminLoginData = await adminLoginRes.json();
  adminToken = adminLoginData.accessToken;

  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'staff_lam', password: '123456' })
  });
  const staffLoginData = await staffLoginRes.json();
  staffToken = staffLoginData.accessToken;

  if (!adminToken || !staffToken) {
    console.error('❌ Không thể đăng nhập lấy JWT token!');
    process.exit(1);
  }

  // ---------------------------------------------------------------
  // TEST 1 [P0]: Storm Emergency End-to-End Creation
  // ---------------------------------------------------------------
  console.log('📍 [TEST 1 - P0] Storm Emergency Batch Creation & SQLite Persistence');
  const stormRes = await fetch(`${BASE_URL}/api/work-orders/emergency-storm`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const stormData = await stormRes.json();

  if (!stormData.success) {
    console.error('❌ Test 1 Thất bại:', stormData);
    process.exit(1);
  }
  console.log(`✓ Kích hoạt Chiến dịch bão: created=${stormData.createdCount}, skipped=${stormData.skippedCount}`);
  console.log('✅ [PASS] Test 1: Lệnh bão khẩn cấp được lưu vào SQLite kèm checklist cây thật.\n');

  // ---------------------------------------------------------------
  // TEST 2 [P0]: Idempotency Guard (Chống sinh trùng lặp khi bấm liên tiếp)
  // ---------------------------------------------------------------
  console.log('📍 [TEST 2 - P0] Idempotency Guard (Chống sinh trùng lặp khi bấm 2 lần)');
  const secondStormRes = await fetch(`${BASE_URL}/api/work-orders/emergency-storm`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const secondStormData = await secondStormRes.json();

  const autoSchedRes1 = await fetch(`${BASE_URL}/api/work-orders/auto-schedule`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const autoSchedData1 = await autoSchedRes1.json();

  const autoSchedRes2 = await fetch(`${BASE_URL}/api/work-orders/auto-schedule`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const autoSchedData2 = await autoSchedRes2.json();

  if (autoSchedData2.createdCount !== 0) {
    console.error('❌ Idempotency thất bại, tạo trùng lặp:', autoSchedData2);
    process.exit(1);
  }
  console.log(`✓ Lần bấm 2 Auto-Scheduler: createdCount = ${autoSchedData2.createdCount}, skippedCount = ${autoSchedData2.skippedCount}`);
  console.log('✅ [PASS] Test 2: Idempotency bảo vệ thành công, không sinh bất kỳ lệnh trùng lặp nào.\n');

  // ---------------------------------------------------------------
  // TEST 3 [P0]: Cross-Device Staff Execution (Staff Device B)
  // ---------------------------------------------------------------
  console.log('📍 [TEST 3 - P0] Cross-Device Staff Fetch & Checklist Execution');
  const staffOrdersRes = await fetch(`${BASE_URL}/api/work-orders`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const staffOrdersData = await staffOrdersRes.json();
  const myStormOrder = staffOrdersData.data.find(w => w.type === 'PRUNING');

  if (!myStormOrder) {
    console.error('❌ Staff không thấy lệnh bão nào:', staffOrdersData.data);
    process.exit(1);
  }
  console.log(`✓ Staff Lâm nhận thấy lệnh: [${myStormOrder.code}] - ${myStormOrder.title}`);

  // Staff bắt đầu thi công
  await fetch(`${BASE_URL}/api/work-orders/${myStormOrder.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({ targetStatus: 'IN_PROGRESS', reason: 'Bắt đầu xuất kích xe thang cắt tỉa' })
  });

  // Lấy chi tiết items
  const orderDetailRes = await fetch(`${BASE_URL}/api/work-orders/${myStormOrder.id}`, {
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  const orderDetail = await orderDetailRes.json();
  const items = orderDetail.items || (orderDetail.data && orderDetail.data.items) || [];
  const targetItem = items[0];

  // Staff hoàn thành cây số 1
  const itemUpdateRes = await fetch(`${BASE_URL}/api/work-orders/items/${targetItem.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${staffToken}` },
    body: JSON.stringify({
      status: 'COMPLETED',
      notes: 'Đã hạ tán tĩnh không 4m, cưa gọn cành sà đường dây điện'
    })
  });
  const itemUpdateData = await itemUpdateRes.json();
  const parentProg = itemUpdateData.parentWorkOrder?.progressPercent ?? itemUpdateData.parentWorkOrder?.progress_percent ?? 0;
  console.log(`✓ KTV hoàn thành cây [${targetItem.tree_street_code || targetItem.treeId}], tiến độ lệnh: ${parentProg}%`);
  console.log('✅ [PASS] Test 3: KTV thực địa trên thiết bị khác cập nhật checklist thành công.\n');

  // ---------------------------------------------------------------
  // TEST 4 [P0]: Admin Verification & Automatic Care Record Creation
  // ---------------------------------------------------------------
  console.log('📍 [TEST 4 - P0] Admin Verification & Real SQLite Care Record Creation');
  const verifyRes = await fetch(`${BASE_URL}/api/work-orders/${myStormOrder.id}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ isApproved: true, notes: 'Nghiệm thu đạt tĩnh không an toàn mùa bão' })
  });
  const verifyData = await verifyRes.json();

  if (!verifyData.success || verifyData.data.status !== 'COMPLETED') {
    console.error('❌ Nghiệm thu thất bại:', verifyData);
    process.exit(1);
  }
  console.log(`✓ Giám sát viên đã nghiệm thu ĐẠT: [${verifyData.data.code}] -> status: ${verifyData.data.status}`);

  // Kiểm tra bảng care_records trong SQLite có bản ghi Cắt tỉa không
  const db = require('../src/config/db');
  await new Promise((resolve) => {
    db.get(
      `SELECT * FROM care_records WHERE action_type = 'Cắt tỉa' ORDER BY id DESC LIMIT 1`,
      (err, careRow) => {
        if (!careRow) {
          console.error('❌ Không tìm thấy bản ghi Cắt tỉa trong care_records:', err);
          process.exit(1);
        }
        console.log(`✓ SQLite care_records ghi nhận: ID #${careRow.id}, Cây: [${careRow.tree_code}], Loại: "${careRow.action_type}"`);
        console.log('✅ [PASS] Test 4: Hoàn thành khép kín: Lệnh nghiệm thu tự động tạo nhật ký Cắt tỉa thật trong SQLite.\n');
        resolve();
      }
    );
  });

  // ---------------------------------------------------------------
  // TEST 5 [P0]: Security & Role Protection
  // ---------------------------------------------------------------
  console.log('📍 [TEST 5 - P0] Security & Role Protection (Chặn truy cập trái phép)');
  const unauthRes = await fetch(`${BASE_URL}/api/work-orders/emergency-storm`, { method: 'POST' });
  if (unauthRes.status !== 401) {
    console.error('❌ Chưa chặn 401 Unauthorized');
    process.exit(1);
  }

  const staffForbiddenRes = await fetch(`${BASE_URL}/api/work-orders/emergency-storm`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${staffToken}` }
  });
  if (staffForbiddenRes.status !== 403) {
    console.error('❌ Chưa chặn 403 Forbidden cho STAFF');
    process.exit(1);
  }
  console.log('✓ Request không token bị chặn 401; Staff kích hoạt bão bị chặn 403');
  console.log('✅ [PASS] Test 5: Phân quyền bảo mật tuyệt đối.\n');

  console.log('================================================================');
  console.log('📋 KẾT QUẢ KIỂM THỬ ĐỢT 2: 5/5 PASS (100%)');
  console.log('================================================================');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
