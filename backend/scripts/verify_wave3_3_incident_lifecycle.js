/**
 * VERIFICATION SCRIPT: WAVE 3.3 — INCIDENT LIFECYCLE, WORK ORDER INTEGRATION & DELETE REALTIME SYNC
 * UrbanTree Cần Thơ
 * 
 * Verifies 10 Acceptance Scenarios:
 * Scenario 1: SQLite Schema & Migration (work_order_id, index, 5,425 trees)
 * Scenario 2: Incident State Machine Transition Guards (allowed transitions, blocked direct jumps, blocked terminal reversals, idempotency)
 * Scenario 3: Incident -> Work Order Creation & Bidirectional Link
 * Scenario 4: Duplicate Active Work Order Guard
 * Scenario 5: Work Order Verification Auto-Closes Incident Atomically
 * Scenario 6: Transaction Boundary & Rollback Protection
 * Scenario 7: Multi-Device SSE Event Delivery for Incident Lifecycle
 * Scenario 8: P1 Notification Delete Realtime Synchronization & Security
 * Scenario 9: 5,425 Trees Data Preservation
 * Scenario 10: HomeLandingView.tsx Frozen File Verification
 */

const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { execSync } = require('child_process');
const jwt = require('../node_modules/jsonwebtoken');

const DB_PATH = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(DB_PATH);

const BASE_URL = 'http://localhost:5001';
const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';

const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN', full_name: 'Đặng Thế Thuận' }, JWT_SECRET, { expiresIn: '1h' });
const staffLamToken = jwt.sign({ id: 2, username: 'staff_lam', role: 'STAFF', full_name: 'Nguyễn Văn Lâm', teamId: 'team-1' }, JWT_SECRET, { expiresIn: '1h' });
const citizenToken = jwt.sign({ id: 4, username: 'citizen_an', role: 'CITIZEN', full_name: 'Trần Văn An' }, JWT_SECRET, { expiresIn: '1h' });

let totalScenarios = 10;
let passedScenarios = 0;
let totalAssertions = 0;
let passedAssertions = 0;

function assert(condition, message) {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`    ✅ [ASSERT] ${message}`);
  } else {
    console.error(`    ❌ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (_) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function openSseConnection(token) {
  return new Promise((resolve, reject) => {
    const pathUrl = token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events';
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path: pathUrl,
        method: 'GET',
        headers: { Accept: 'text/event-stream' },
      },
      (res) => {
        const client = {
          res,
          req,
          status: res.statusCode,
          events: [],
          close: () => req.destroy(),
        };

        res.on('data', (chunk) => {
          const text = chunk.toString();
          const lines = text.split('\n');
          let currentEvent = {};
          for (const line of lines) {
            if (line.startsWith('id: ')) {
              currentEvent.id = line.substring(4).trim();
            } else if (line.startsWith('event: ')) {
              currentEvent.event = line.substring(7).trim();
            } else if (line.startsWith('data: ')) {
              try {
                currentEvent.data = JSON.parse(line.substring(6).trim());
              } catch {
                currentEvent.data = line.substring(6).trim();
              }
            } else if (line === '' && currentEvent.event) {
              client.events.push(currentEvent);
              currentEvent = {};
            }
          }
        });

        setTimeout(() => resolve(client), 300);
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function queryDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows || []);
    });
  });
}

function runDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

async function runScenario(number, name, fn) {
  console.log(`\n===============================================================`);
  console.log(`🔹 [SCENARIO ${number}/${totalScenarios}] ${name}`);
  console.log(`===============================================================`);
  try {
    await fn();
    passedScenarios++;
    console.log(`🎯 SCENARIO ${number} PASSED!\n`);
  } catch (err) {
    console.error(`💥 SCENARIO ${number} FAILED:`, err.message);
  }
}

async function main() {
  console.log('🚀 BẮT ĐẦU FORENSIC VERIFICATION SUITE — WAVE 3.3');
  console.log(`Target: ${BASE_URL} | SQLite: ${DB_PATH}\n`);

  // =========================================================================
  // SCENARIO 1: SQLite Schema & Migration
  // =========================================================================
  await runScenario(1, 'SQLite Schema & Migration Verification', async () => {
    const columns = await queryDb('PRAGMA table_info(incidents)');
    const workOrderCol = columns.find(c => c.name === 'work_order_id');
    assert(!!workOrderCol, 'Bảng incidents có cột work_order_id');
    assert(workOrderCol.type.toUpperCase() === 'TEXT', 'Cột work_order_id có kiểu TEXT');

    const indexes = await queryDb('PRAGMA index_list(incidents)');
    const hasIdx = indexes.some(idx => idx.name === 'idx_incidents_work_order');
    assert(hasIdx, 'Chỉ mục idx_incidents_work_order tồn tại');

    const treeRows = await queryDb('SELECT COUNT(*) as cnt FROM trees');
    assert(treeRows[0].cnt === 5425, `Số lượng cây trong DB là 5,425 (thực tế: ${treeRows[0].cnt})`);
  });

  // =========================================================================
  // SCENARIO 2: Incident State Machine Transition Guards
  // =========================================================================
  let testIncidentId = null;
  await runScenario(2, 'Incident State Machine Transition Guards', async () => {
    // Tạo incident mới ở trạng thái 'Chờ xử lý'
    const resInsert = await runDb(
      `INSERT INTO incidents (description, reporter_name, severity, status, address)
       VALUES ('Cây nghiêng nguy hiểm kiểm thử state machine', 'Nguyễn Văn Test', 'Cao', 'Chờ xử lý', 'Đại Lộ Hòa Bình')`
    );
    testIncidentId = resInsert.lastID;
    assert(!!testIncidentId, `Đã tạo incident test ID=${testIncidentId}`);

    // Test 2.1: Chặn nhảy trực tiếp 'Chờ xử lý' -> 'Đã hoàn thành' (INVALID)
    const invalidDirect = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${testIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đã hoàn thành' });
    assert(invalidDirect.status === 400, 'Chặn nhảy trực tiếp từ "Chờ xử lý" sang "Đã hoàn thành" (HTTP 400)');

    // Test 2.2: Cho phép 'Chờ xử lý' -> 'Đang xử lý' (VALID)
    const validInProgress = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${testIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đang xử lý' });
    assert(validInProgress.status === 200, 'Chuyển "Chờ xử lý" -> "Đang xử lý" thành công (HTTP 200)');

    // Test 2.3: Idempotency khi cập nhật cùng trạng thái 'Đang xử lý'
    const idempRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${testIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đang xử lý' });
    assert(idempRes.status === 200, 'Idempotency: cập nhật lại "Đang xử lý" trả về 200 an toàn');

    // Test 2.4: Cho phép 'Đang xử lý' -> 'Đã hoàn thành' (VALID)
    const validComplete = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${testIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đã hoàn thành' });
    assert(validComplete.status === 200, 'Chuyển "Đang xử lý" -> "Đã hoàn thành" thành công (HTTP 200)');

    // Test 2.5: Chặn đảo chiều từ terminal 'Đã hoàn thành' -> 'Đang xử lý' (INVALID)
    const invalidReverse = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${testIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đang xử lý' });
    assert(invalidReverse.status === 400, 'Chặn đảo ngược trạng thái từ terminal "Đã hoàn thành" sang "Đang xử lý" (HTTP 400)');

    // Test 2.6: Test incident bị từ chối
    const resReject = await runDb(
      `INSERT INTO incidents (description, reporter_name, severity, status)
       VALUES ('Sự cố test từ chối', 'Test Reject', 'Thấp', 'Chờ xử lý')`
    );
    const rejectIncidentId = resReject.lastID;
    const rejectRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${rejectIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Từ chối' });
    assert(rejectRes.status === 200, 'Chuyển "Chờ xử lý" -> "Từ chối" thành công (HTTP 200)');

    // Chặn từ chối đảo lại
    const rejectRev = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${rejectIncidentId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đang xử lý' });
    assert(rejectRev.status === 400, 'Chặn đảo ngược trạng thái từ "Từ chối" sang "Đang xử lý" (HTTP 400)');
  });

  // =========================================================================
  // SCENARIO 3: Incident -> Work Order Creation & Bidirectional Link
  // =========================================================================
  let linkedIncidentId = null;
  let linkedWorkOrderId = null;
  let linkedWorkOrderCode = null;

  await runScenario(3, 'Incident -> Work Order Creation & Bidirectional Link', async () => {
    const resInc = await runDb(
      `INSERT INTO incidents (description, reporter_name, severity, status, address)
       VALUES ('Cây gãy cành chắn ngang đường VVK', 'Lê Thị Test', 'Khẩn cấp', 'Chờ xử lý', 'Đường Võ Văn Kiệt')`
    );
    linkedIncidentId = resInc.lastID;
    assert(!!linkedIncidentId, `Tạo sự cố kiểm thử liên kết ID=${linkedIncidentId}`);

    // Tạo lệnh công tác liên kết với incidentId
    const createWoRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/work-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      title: 'Xử lý khẩn cấp cây gãy cành VVK',
      type: 'PRUNING',
      priority: 'HIGH',
      incidentId: linkedIncidentId,
      routeCorridorName: 'Đường Võ Văn Kiệt',
      treeIds: [1, 2]
    });

    assert(createWoRes.status === 201, `Tạo lệnh công tác thành công (HTTP 201)`);
    assert(createWoRes.body.success === true, 'Response body success === true');
    linkedWorkOrderId = createWoRes.body.data.id;
    linkedWorkOrderCode = createWoRes.body.data.code;
    assert(!!linkedWorkOrderId, `Nhận được workOrderId: ${linkedWorkOrderId}`);

    // Kiểm tra liên kết 2 chiều trong SQLite
    const woRows = await queryDb('SELECT * FROM work_orders WHERE id = ?', [linkedWorkOrderId]);
    assert(String(woRows[0].incident_id) === String(linkedIncidentId), 'work_orders.incident_id trỏ đúng đến incident');

    const incRows = await queryDb('SELECT * FROM incidents WHERE id = ?', [linkedIncidentId]);
    assert(incRows[0].work_order_id === linkedWorkOrderId, 'incidents.work_order_id trỏ ngược lại work_order');
    assert(incRows[0].status === 'Đang xử lý', 'incidents.status tự động chuyển sang "Đang xử lý"');

    const updates = await queryDb('SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY id DESC', [linkedIncidentId]);
    assert(updates.length > 0, 'incident_updates ghi nhận lịch sử khởi tạo lệnh công tác');
    assert(updates[0].new_status === 'Đang xử lý', 'Lịch sử ghi đúng new_status="Đang xử lý"');
  });

  // =========================================================================
  // SCENARIO 4: Duplicate Active Work Order Guard
  // =========================================================================
  await runScenario(4, 'Duplicate Active Work Order Guard', async () => {
    // Thử tạo thêm một work order nữa cho cùng incidentId khi lệnh trước đang DRAFT/ASSIGNED
    const dupRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/work-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      title: 'Tạo trùng lệnh cho sự cố đang xử lý',
      type: 'PRUNING',
      incidentId: linkedIncidentId,
      treeIds: [1]
    });

    assert(dupRes.status === 400, 'Chặn tạo thêm lệnh công tác khi sự cố đã có lệnh đang hoạt động (HTTP 400)');
    assert(dupRes.body.message.includes('đã có lệnh công tác đang hoạt động'), 'Thông báo lỗi chỉ rõ sự cố đã có lệnh hoạt động');
  });

  // =========================================================================
  // SCENARIO 5: Work Order Verification Auto-Closes Incident Atomically
  // =========================================================================
  await runScenario(5, 'Work Order Verification Auto-Closes Incident Atomically', async () => {
    // Đánh dấu hoàn thành checklist items của work order
    const items = await queryDb('SELECT * FROM work_order_items WHERE work_order_id = ?', [linkedWorkOrderId]);
    for (const item of items) {
      await runDb('UPDATE work_order_items SET status = "COMPLETED" WHERE id = ?', [item.id]);
    }

    // Nghiệm thu lệnh công tác
    const verifyRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/work-orders/${linkedWorkOrderId}/verify`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      isApproved: true,
      notes: 'Nghiệm thu hoàn tất xử lý cây gãy cành Wave 3.3'
    });

    assert(verifyRes.status === 200, 'Nghiệm thu lệnh công tác thành công (HTTP 200)');

    // Kiểm tra trạng thái work order trong DB
    const woRows = await queryDb('SELECT * FROM work_orders WHERE id = ?', [linkedWorkOrderId]);
    assert(woRows[0].status === 'COMPLETED', 'Lệnh công tác chuyển thành COMPLETED');

    // Kiểm tra sự cố đã tự động đóng
    const incRows = await queryDb('SELECT * FROM incidents WHERE id = ?', [linkedIncidentId]);
    assert(incRows[0].status === 'Đã hoàn thành', 'Sự cố liên kết tự động chuyển thành "Đã hoàn thành"');
    assert(!!incRows[0].resolved_at, `Sự cố có resolved_at timestamp: ${incRows[0].resolved_at}`);

    // Kiểm tra incident_updates
    const latestUpdate = await queryDb('SELECT * FROM incident_updates WHERE incident_id = ? ORDER BY id DESC LIMIT 1', [linkedIncidentId]);
    assert(latestUpdate[0].new_status === 'Đã hoàn thành', 'incident_updates ghi nhận trạng thái "Đã hoàn thành"');
    assert(latestUpdate[0].notes.includes(linkedWorkOrderCode), 'Ghi chú audit trỏ mã lệnh công tác nghiệm thu');
  });

  // =========================================================================
  // SCENARIO 6: Transaction Boundary & Rollback Protection
  // =========================================================================
  await runScenario(6, 'Transaction Boundary & Rollback Protection', async () => {
    // Tạo incident mới
    const resRb = await runDb(
      `INSERT INTO incidents (description, reporter_name, severity, status)
       VALUES ('Sự cố test rollback', 'Rollback User', 'Trung bình', 'Chờ xử lý')`
    );
    const rollbackIncId = resRb.lastID;

    // Cố ý gửi payload không hợp lệ (thiếu type bắt buộc)
    const failRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/work-orders',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, {
      title: 'Lệnh lỗi',
      incidentId: rollbackIncId
    });

    assert(failRes.status === 400, 'Yêu cầu không hợp lệ bị từ chối (HTTP 400)');

    // Kiểm tra incident không bị đổi trạng thái
    const incCheck = await queryDb('SELECT * FROM incidents WHERE id = ?', [rollbackIncId]);
    assert(incCheck[0].status === 'Chờ xử lý', 'Sự cố giữ nguyên trạng thái "Chờ xử lý" khi lệnh tạo thất bại');
    assert(incCheck[0].work_order_id === null, 'incidents.work_order_id vẫn là NULL');
  });

  // =========================================================================
  // SCENARIO 7: Multi-Device SSE Event Delivery for Incident Lifecycle
  // =========================================================================
  await runScenario(7, 'Multi-Device SSE Event Delivery for Incident Lifecycle', async () => {
    // Bắt đầu lắng nghe SSE trên thiết bị B (Staff)
    const sseClient = await openSseConnection(staffLamToken);
    assert(sseClient.status === 200, 'Thiết bị B kết nối SSE stream thành công (HTTP 200)');

    // Thiết bị A (Admin) tạo incident và cập nhật
    const resSseInc = await runDb(
      `INSERT INTO incidents (description, reporter_name, severity, status)
       VALUES ('Sự cố test SSE multi-device', 'SSE Tester', 'Cao', 'Chờ xử lý')`
    );
    const sseIncId = resSseInc.lastID;

    const patchRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/incidents/${sseIncId}/status`,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { status: 'Đang xử lý' });

    assert(patchRes.status === 200, 'Thiết bị A cập nhật trạng thái sự cố thành công');

    // Đợi nhận SSE event
    await new Promise(r => setTimeout(r, 600));
    sseClient.close();

    const statusChangedEvent = sseClient.events.find(
      e => e.event === 'incident.status_changed' && (String(e.data?.payload?.id) === String(sseIncId) || String(e.data?.entityId) === String(sseIncId))
    );

    assert(!!statusChangedEvent, 'Thiết bị B nhận được SSE event "incident.status_changed"');
    assert(statusChangedEvent.data.payload.status === 'Đang xử lý', 'Payload SSE chứa đúng status="Đang xử lý"');
  });

  // =========================================================================
  // SCENARIO 8: P1 Notification Delete Realtime Sync & Security
  // =========================================================================
  await runScenario(8, 'P1 Notification Delete Realtime Sync & Security', async () => {
    // Tạo 1 notification cho admin (id kiểu TEXT)
    const notifId = `notif-test-${Date.now()}`;
    await runDb(
      `INSERT INTO notifications (id, title, message, type, severity, target_role, user_id)
       VALUES (?, 'Thông báo test delete sync', 'Nội dung test xóa realtime', 'SYSTEM', 'INFO', 'ADMIN', 1)`,
      [notifId]
    );
    assert(!!notifId, `Đã tạo notification ID=${notifId}`);

    // Bắt đầu lắng nghe SSE trên thiết bị B (Admin)
    const sseClient = await openSseConnection(adminToken);
    assert(sseClient.status === 200, 'Thiết bị B kết nối SSE stream thành công');

    // Thực hiện DELETE notification
    const deleteRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/notifications/${notifId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    assert(deleteRes.status === 200, 'Xóa notification thành công (HTTP 200)');

    // Đợi nhận SSE event notification.deleted
    await new Promise(r => setTimeout(r, 600));
    sseClient.close();

    const deletedEvent = sseClient.events.find(
      e => e.event === 'notification.deleted' && (e.data?.payload?.id === notifId || e.data?.entityId === notifId)
    );

    assert(!!deletedEvent, 'Thiết bị B nhận được sự kiện realtime "notification.deleted"');
    assert(deletedEvent.data.payload.id === notifId, 'Payload sự kiện notification.deleted mang đúng notification id');

    // Test Security: Thử xóa lại (hoặc id không tồn tại) trả về 404
    const notFoundDelete = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/notifications/${notifId}`,
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert(notFoundDelete.status === 404, 'Xóa lại thông báo đã xóa trả về 404 Not Found');
  });

  // =========================================================================
  // SCENARIO 9: 5,425 Trees Data Preservation
  // =========================================================================
  await runScenario(9, '5,425 Trees Data Preservation', async () => {
    const finalTreeRows = await queryDb('SELECT COUNT(*) as cnt FROM trees');
    assert(finalTreeRows[0].cnt === 5425, `Tổng số cây toàn hệ thống vẫn giữ nguyên 5,425 (thực tế: ${finalTreeRows[0].cnt})`);
  });

  // =========================================================================
  // SCENARIO 10: HomeLandingView.tsx Frozen File Verification
  // =========================================================================
  await runScenario(10, 'HomeLandingView.tsx Frozen File Verification', async () => {
    const diff = execSync('git diff --name-only src/components/HomeLandingView.tsx').toString().trim();
    assert(diff === '', 'File src/components/HomeLandingView.tsx hoàn toàn không bị chỉnh sửa (git diff = 0)');
  });

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log(`\n===============================================================`);
  console.log(`📊 BÁO CÁO TỔNG HỢP KIỂM CHỨNG WAVE 3.3`);
  console.log(`===============================================================`);
  console.log(`  Acceptance Scenarios Passed : ${passedScenarios} / ${totalScenarios} (${Math.round(passedScenarios/totalScenarios*100)}%)`);
  console.log(`  Total Assertions Passed    : ${passedAssertions} / ${totalAssertions} (${Math.round(passedAssertions/totalAssertions*100)}%)`);
  console.log(`  Total Assertions Failed    : ${totalAssertions - passedAssertions}`);
  console.log(`===============================================================\n`);

  db.close();

  if (passedScenarios === totalScenarios && passedAssertions === totalAssertions) {
    console.log('🏆 KẾT LUẬN: WAVE 3.3 FORENSIC VERIFICATION 100% PASS!');
    process.exit(0);
  } else {
    console.error('❌ KẾT LUẬN: CÓ TEST CASE THẤT BẠI!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
