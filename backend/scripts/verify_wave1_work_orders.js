/**
 * UrbanTree - Test Suite for Wave 1 (Work Order Backend Foundation & Cross-Device Persistence)
 * Usage: node backend/scripts/verify_wave1_work_orders.js
 */

const jwt = require('jsonwebtoken');
const sqlite3 = require('../node_modules/sqlite3').verbose();
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';
const dbPath = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(dbPath);

const BASE_URL = 'http://localhost:5001';

// Generate valid tokens
const adminToken = jwt.sign(
  { id: 1, username: 'admin', role: 'ADMIN', full_name: 'Đặng Thế Thuận' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const staffToken = jwt.sign(
  { id: 2, username: 'staff_lam', role: 'STAFF', full_name: 'Trần Quang Lâm', team_id: 'team-prune-1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const otherStaffToken = jwt.sign(
  { id: 3, username: 'staff_tuananh', role: 'STAFF', full_name: 'Lê Tuấn Anh', team_id: 'team-care-1' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

async function runTests() {
  console.log('================================================================');
  console.log('🧪 URBANTREE WAVE 1 VERIFICATION: WORK ORDER BACKEND FOUNDATION');
  console.log('================================================================\n');

  let passedTests = 0;
  const totalTests = 5;

  // ----------------------------------------------------------------
  // [TEST 1 - P0] Persistence: Admin creates Work Order -> Saved in SQLite
  // ----------------------------------------------------------------
  console.log('📍 [TEST 1 - P0] Work Order Persistence in SQLite');
  let createdOrderId = null;
  let firstItemId = null;

  try {
    const res = await fetch(`${BASE_URL}/api/work-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Cắt tỉa hạ tán định kỳ Đại Lộ Hòa Bình',
        type: 'PRUNING',
        priority: 'HIGH',
        zoneId: 'zone-ninh-kieu',
        routeId: 'route-hoa-binh',
        routeCorridorName: 'Đại Lộ Hòa Bình',
        assignedTeamId: 'team-prune-1',
        assignedTeamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
        treeIds: ['1', '2', '3']
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(`Tạo Work Order thất bại: ${JSON.stringify(data)}`);
    }

    createdOrderId = data.data.id;
    console.log(`✓ Bước 1: Tạo thành công lệnh [${data.data.code}] với ID: ${createdOrderId}`);

    // Verify trực tiếp trong SQLite
    const sqliteRow = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM work_orders WHERE id = ?', [createdOrderId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!sqliteRow || sqliteRow.title !== 'Cắt tỉa hạ tán định kỳ Đại Lộ Hòa Bình') {
      throw new Error('Dữ liệu không tồn tại trong bảng SQLite work_orders!');
    }

    // Verify items in SQLite
    const sqliteItems = await new Promise((resolve, reject) => {
      db.all('SELECT * FROM work_order_items WHERE work_order_id = ?', [createdOrderId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (sqliteItems.length !== 3) {
      throw new Error(`Số lượng checklist cây không khớp! Mong đợi 3, nhận ${sqliteItems.length}`);
    }

    firstItemId = sqliteItems[0].id;
    console.log(`✓ Bước 2: SQLite đã lưu đúng ${sqliteItems.length} checklist cây`);
    console.log('✅ [PASS] Test 1: Lệnh công tác được lưu thực sự vào SQLite database.');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] Test 1:', err.message);
  }

  // ----------------------------------------------------------------
  // [TEST 2 - P0] Cross-Device: Staff on Device B fetches assigned Work Order
  // ----------------------------------------------------------------
  console.log('\n📍 [TEST 2 - P0] Cross-Device Fetch (Staff Device B vs Admin Device A)');
  try {
    // Staff Lâm (team-prune-1) gọi GET /api/work-orders
    const staffRes = await fetch(`${BASE_URL}/api/work-orders`, {
      headers: {
        'Authorization': `Bearer ${staffToken}`
      }
    });

    const staffData = await staffRes.json();
    const myOrder = (staffData.data || []).find((w) => w.id === createdOrderId);

    if (!myOrder) {
      throw new Error('KTV Tổ 1 không nhìn thấy lệnh công tác được phân bổ cho tổ mình!');
    }
    console.log(`✓ Staff Lâm (Tổ 1) thấy lệnh: [${myOrder.code}] - ${myOrder.title}`);

    // Staff Tuấn Anh (team-care-1) gọi GET /api/work-orders -> KHÔNG ĐƯỢC THẤY lệnh của Tổ 1
    const otherStaffRes = await fetch(`${BASE_URL}/api/work-orders`, {
      headers: {
        'Authorization': `Bearer ${otherStaffToken}`
      }
    });

    const otherData = await otherStaffRes.json();
    const shouldNotSee = (otherData.data || []).find((w) => w.id === createdOrderId);
    if (shouldNotSee) {
      throw new Error('Vi phạm bảo mật: KTV Tổ 2 thấy lệnh của Tổ 1!');
    }
    console.log('✓ Staff Tuấn Anh (Tổ 2) không thấy lệnh của Tổ 1 (Role-aware isolation OK)');

    console.log('✅ [PASS] Test 2: Đồng bộ đa thiết bị thành công (Role-aware filtering)');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] Test 2:', err.message);
  }

  // ----------------------------------------------------------------
  // [TEST 3 - P0] Staff Checklist Progress Update & Progress Calculation
  // ----------------------------------------------------------------
  console.log('\n📍 [TEST 3 - P0] Staff Checklist Execution & Progress Recalculation');
  try {
    // 1. Staff chuyển lệnh sang IN_PROGRESS
    const startRes = await fetch(`${BASE_URL}/api/work-orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        targetStatus: 'IN_PROGRESS',
        reason: 'Tổ 1 đã tiếp cận hiện trường và bắt đầu cắt tỉa'
      })
    });
    const startData = await startRes.json();
    if (!startRes.ok || startData.data.status !== 'IN_PROGRESS') {
      throw new Error(`Chuyển sang IN_PROGRESS thất bại: ${JSON.stringify(startData)}`);
    }
    console.log('✓ KTV đã kích hoạt lệnh sang trạng thái: IN_PROGRESS');

    // 2. Staff cập nhật hoàn thành cây đầu tiên
    const itemRes = await fetch(`${BASE_URL}/api/work-orders/items/${firstItemId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({
        status: 'COMPLETED',
        notes: 'Đã cắt tỉa cành khô tán trên độ cao 12m'
      })
    });
    const itemData = await itemRes.json();
    if (!itemRes.ok || itemData.item.status !== 'COMPLETED') {
      throw new Error(`Cập nhật item thất bại: ${JSON.stringify(itemData)}`);
    }
    console.log(`✓ KTV cập nhật xong cây 1, tiến độ lệnh cha tính lại: ${itemData.parentWorkOrder.progressPercent}% (1/3 cây)`);

    // 3. Admin tải lại lệnh -> Thấy tiến độ cập nhật thực tế trong SQLite
    const adminFetchRes = await fetch(`${BASE_URL}/api/work-orders/${createdOrderId}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const adminFetchData = await adminFetchRes.json();
    if (adminFetchData.data.workOrder.completedItems !== 1) {
      throw new Error('Admin không thấy số completedItems cập nhật trong SQLite!');
    }
    console.log('✓ Admin fetch lại thấy đúng 1/3 cây đã hoàn thành');

    console.log('✅ [PASS] Test 3: KTV cập nhật tiến độ checklist và Admin thấy kết quả ngay lập tức.');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] Test 3:', err.message);
  }

  // ----------------------------------------------------------------
  // [TEST 4 - P0] State Machine Guard: Rejection of illegal transitions
  // ----------------------------------------------------------------
  console.log('\n📍 [TEST 4 - P0] Backend State Machine Guard (Chặn chuyển trạng thái trái phép)');
  try {
    // Thử chuyển từ IN_PROGRESS sang CLOSED (không hợp lệ, phải qua SUBMITTED_FOR_REVIEW -> COMPLETED -> CLOSED)
    const illegalRes = await fetch(`${BASE_URL}/api/work-orders/${createdOrderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        targetStatus: 'CLOSED',
        reason: 'Cố tình nhảy cóc trạng thái'
      })
    });

    if (illegalRes.status === 400) {
      const errData = await illegalRes.json();
      console.log(`✓ Backend đã chặn đứng HTTP 400: "${errData.message}"`);
      console.log('✅ [PASS] Test 4: State Machine bảo vệ dữ liệu thành công.');
      passedTests++;
    } else {
      throw new Error(`Backend không chặn transition trái phép! Status code: ${illegalRes.status}`);
    }
  } catch (err) {
    console.error('❌ [FAIL] Test 4:', err.message);
  }

  // ----------------------------------------------------------------
  // [TEST 5 - P0] Security: Authentication & Role Access Control
  // ----------------------------------------------------------------
  console.log('\n📍 [TEST 5 - P0] Security & Role Access Control');
  try {
    // 1. Gọi API không có Token -> Bị 401
    const unauthRes = await fetch(`${BASE_URL}/api/work-orders`);
    if (unauthRes.status !== 401) {
      throw new Error(`Gọi không có token mong đợi 401, nhận: ${unauthRes.status}`);
    }
    console.log('✓ Request không có Access Token bị từ chối 401 Unauthorized');

    // 2. Staff cố tình gọi phân bổ tổ đội (chỉ dành cho ADMIN) -> Bị 403
    const forbiddenRes = await fetch(`${BASE_URL}/api/work-orders/${createdOrderId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({ teamId: 'team-care-1' })
    });

    if (forbiddenRes.status !== 403) {
      throw new Error(`Staff gọi assign mong đợi 403, nhận: ${forbiddenRes.status}`);
    }
    console.log('✓ Staff cố tình đổi tổ phân bổ bị từ chối 403 Forbidden');

    console.log('✅ [PASS] Test 5: Xác thực và phân quyền hoạt động nghiêm ngặt.');
    passedTests++;
  } catch (err) {
    console.error('❌ [FAIL] Test 5:', err.message);
  }

  console.log('\n================================================================');
  console.log(`📋 KẾT QUẢ KIỂM THỬ ĐỢT 1: ${passedTests}/${totalTests} PASS (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('================================================================');

  db.close();
  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();

