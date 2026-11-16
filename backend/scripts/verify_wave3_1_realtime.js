/**
 * 🧪 BỘ KIỂM THỬ GIÁM ĐỊNH TOÀN DIỆN WAVE 3.1 — REALTIME EVENT FOUNDATION
 * Kiểm chứng:
 * 1. SSE Endpoint Authentication (Không token -> 401, token sai -> 403, query token -> 200).
 * 2. Cross-Device Realtime Simulation: Admin mutation qua REST API -> Staff nhận SSE event thời gian thực.
 * 3. Role Isolation: Citizen không nhận các sự kiện điều hành nội bộ của Admin/Staff.
 * 4. Post-COMMIT Integrity: Chỉ phát SSE khi SQLite mutation đã COMMIT thành công.
 * 5. Replay Buffer & Reconnect: Last-Event-ID replay đúng hoặc kích hoạt FULL_DELTA_REFETCH.
 * 6. Disconnect Cleanup: Giải phóng bộ nhớ khi client ngắt kết nối, không memory leak.
 * 7. Toàn vẹn dữ liệu: 5.425 cây xanh được bảo toàn 100%.
 */

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const jwt = require('../node_modules/jsonwebtoken');
const db = require('../src/config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';

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

function openSseConnection(token, headers = {}) {
  return new Promise((resolve, reject) => {
    const sseHeaders = {
      'Accept': 'text/event-stream',
      ...headers
    };
    if (token && !headers['Authorization']) {
      // Dùng query token nếu không truyền qua Authorization header
    }

    const pathUrl = token ? `/api/events?token=${encodeURIComponent(token)}` : '/api/events';

    const req = http.request({
      hostname: 'localhost',
      port: 5001,
      path: pathUrl,
      method: 'GET',
      headers: sseHeaders
    }, (res) => {
      const client = {
        res,
        req,
        status: res.statusCode,
        headers: res.headers,
        events: [],
        rawChunks: [],
        close: () => {
          req.destroy();
        }
      };

      res.on('data', (chunk) => {
        const text = chunk.toString();
        client.rawChunks.push(text);

        // Parse SSE messages
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
          } else if (line.trim() === '' && currentEvent.event) {
            client.events.push(currentEvent);
            currentEvent = {};
          }
        }
      });

      resolve(client);
    });

    req.on('error', reject);
    req.end();
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

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTestSuite() {
  console.log('========================================================================');
  console.log('⚡ BẮT ĐẦU KIỂM THỬ WAVE 3.1: REALTIME EVENT FOUNDATION (SSE)');
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

  // Khởi tạo các tokens
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN' }, JWT_SECRET, { expiresIn: '1h' });
  const staffToken = jwt.sign({ id: 2, username: 'staff_lam', role: 'STAFF', teamId: 'team-prune-1' }, JWT_SECRET, { expiresIn: '1h' });
  const citizenToken = jwt.sign({ id: 99, username: 'citizen_user', role: 'CITIZEN' }, JWT_SECRET, { expiresIn: '1h' });

  // TEST NHÓM 1: SSE ENDPOINT AUTHENTICATION
  console.log('--- TEST NHÓM 1: XÁC THỰC KẾT NỐI SSE ---');
  
  // 1a. Không có token -> Bị từ chối 401
  const unauthClient = await openSseConnection(null);
  assert(unauthClient.status === 401, 'Không có token bị từ chối HTTP 401 Unauthorized');
  unauthClient.close();

  // 1b. Token sai chữ ký -> Bị từ chối 403
  const badClient = await openSseConnection('invalid_token_xyz_123');
  assert(badClient.status === 403, 'Token không hợp lệ bị từ chối HTTP 403 Forbidden');
  badClient.close();

  // 1c. Token ADMIN hợp lệ qua query param ?token= -> Kết nối 200 text/event-stream
  const adminClient = await openSseConnection(adminToken);
  assert(adminClient.status === 200, 'Admin kết nối SSE thành công với HTTP 200');
  assert(
    adminClient.headers['content-type'] && adminClient.headers['content-type'].includes('text/event-stream'),
    'Header trả về đúng chuẩn Content-Type: text/event-stream'
  );
  await sleep(100);
  const adminAck = adminClient.events.find(e => e.event === 'sse.connected');
  assert(adminAck && adminAck.data.role === 'ADMIN', 'Nhận sự kiện sse.connected xác nhận vai trò ADMIN');

  // TEST NHÓM 2: MÔ PHỎNG ĐỒNG BỘ ĐA THIẾT BỊ (CROSS-DEVICE SIMULATION)
  console.log('\n--- TEST NHÓM 2: MÔ PHỎNG ĐA THIẾT BỊ (ADMIN REST MUTATION -> STAFF SSE PUSH) ---');
  
  // KTV (Staff) kết nối SSE trên Thiết bị B
  const staffClient = await openSseConnection(staffToken);
  assert(staffClient.status === 200, 'Staff kết nối SSE thành công trên Thiết bị B');
  await sleep(100);

  // Admin thực hiện mutation tạo lệnh qua REST API trên Thiết bị A
  const orderUniqueCode = `WO-RT-${Date.now().toString().slice(-4)}`;
  const createOrderRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/work-orders',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    code: orderUniqueCode,
    title: 'Cắt tỉa cành đại lộ giông lốc Realtime Test',
    type: 'PRUNING',
    priority: 'HIGH',
    routeCorridorName: 'Đại Lộ Hòa Bình',
    assignedTeamId: 'team-prune-1',
    treeIds: [1, 2]
  });

  assert(createOrderRes.status === 201 && createOrderRes.body.success, 'Admin tạo thành công Lệnh công tác qua REST API');
  const createdOrderId = createOrderRes.body.data.id;

  // Chờ SSE stream gửi đến Staff
  await sleep(250);

  const staffReceivedEvent = staffClient.events.find(
    e => e.event === 'work_order.created' && e.data?.payload?.code === orderUniqueCode
  );
  assert(staffReceivedEvent != null, 'Staff trên Thiết bị B nhận ngay sự kiện work_order.created thời gian thực');
  assert(staffReceivedEvent?.data?.entityId === createdOrderId, 'Sự kiện mang entityId trùng khớp với SQLite order ID');
  assert(staffReceivedEvent?.data?.payload?.assignedTeamId === 'team-prune-1', 'Payload mang đúng thông tin phân công tổ đội');

  // TEST NHÓM 3: ROLE ISOLATION & BẢO VỆ PHÂN QUYỀN
  console.log('\n--- TEST NHÓM 3: BẢO VỆ PHÂN QUYỀN & CHỐNG RÒ RỈ THÔNG TIN (ROLE ISOLATION) ---');
  
  // Người dân (Citizen) kết nối SSE
  const citizenClient = await openSseConnection(citizenToken);
  assert(citizenClient.status === 200, 'Citizen kết nối SSE thành công');
  await sleep(100);

  // Admin chuyển trạng thái lệnh công tác
  await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/work-orders/${createdOrderId}/status`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    targetStatus: 'IN_PROGRESS',
    reason: 'KTV bắt đầu ra hiện trường'
  });

  await sleep(250);

  // Staff nhận được sự kiện
  const staffStatusEvent = staffClient.events.find(
    e => e.event === 'work_order.status_changed' && e.data?.entityId === createdOrderId
  );
  assert(staffStatusEvent != null, 'Staff nhận sự kiện work_order.status_changed (IN_PROGRESS)');

  // Citizen KHÔNG nhận được sự kiện nội bộ này
  const citizenLeakedEvent = citizenClient.events.find(
    e => e.event === 'work_order.status_changed' && e.data?.entityId === createdOrderId
  );
  assert(citizenLeakedEvent == null, 'Citizen KHÔNG nhận sự kiện Work Order nội bộ (Role Isolation bảo vệ thành công)');

  // TEST NHÓM 4: POST-COMMIT INTEGRITY (KHÔNG EMIT KHI ROLLBACK)
  console.log('\n--- TEST NHÓM 4: BẢO TOÀN RANH GIỚI TRANSACTION (POST-COMMIT INTEGRITY) ---');
  
  const currentEventCount = staffClient.events.length;
  // Gửi request sai phạm trạng thái State Machine (IN_PROGRESS -> CLOSED không được phép)
  const invalidStatusRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/work-orders/${createdOrderId}/status`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    targetStatus: 'CLOSED', // Sai luật State Machine -> Bị rollback
    reason: 'Cố tình bypass'
  });

  assert(invalidStatusRes.status === 400, 'State Machine chặn đứng chuyển đổi trạng thái trái phép (HTTP 400)');
  await sleep(200);

  assert(staffClient.events.length === currentEventCount, 'Tuyệt đối KHÔNG có sự kiện SSE nào được phát ra khi transaction bị từ chối/rollback');

  // TEST NHÓM 5: RECONNECT & REPLAY BUFFER ENGINE
  console.log('\n--- TEST NHÓM 5: RECONNECT & REPLAY BUFFER QUA LAST-EVENT-ID ---');
  
  // 5a. Lấy eventId gần nhất đã phát
  const lastEmittedEvent = staffStatusEvent;
  assert(lastEmittedEvent && lastEmittedEvent.id, 'Sự kiện có Event ID định danh duy nhất phục vụ Replay');

  // Phát thêm 1 sự kiện nữa
  await request({
    hostname: 'localhost',
    port: 5001,
    path: `/api/work-orders/items/wo-item-${createdOrderId}-1`,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    }
  }, {
    status: 'COMPLETED',
    evidenceAfterImageUrl: 'https://example.com/tree-1-done.jpg'
  });
  await sleep(200);

  // 5b. Mở kết nối mới gửi kèm Last-Event-ID cũ -> Server tự động Replay sự kiện đã bỏ lỡ
  const replayClient = await openSseConnection(staffToken, {
    'Last-Event-ID': lastEmittedEvent.id
  });
  assert(replayClient.status === 200, 'Client kết nối lại với Last-Event-ID thành công');
  await sleep(200);

  const replayedEvent = replayClient.events.find(e => e.event === 'work_order.item_updated');
  assert(replayedEvent != null, 'Server Replay thành công sự kiện bị lỡ cho client reconnect');
  replayClient.close();

  // 5c. Thử reconnect với Last-Event-ID không tồn tại -> Nhận tín hiệu FULL_DELTA_REFETCH
  const overflowClient = await openSseConnection(staffToken, {
    'Last-Event-ID': 'evt_non_existent_fake_99999'
  });
  await sleep(200);
  const refetchSignal = overflowClient.events.find(e => e.event === 'sse.full_delta_refetch');
  assert(refetchSignal != null, 'Khi Last-Event-ID không còn trong buffer, Server gửi sse.full_delta_refetch');
  overflowClient.close();

  // TEST NHÓM 6: DISCONNECT CLEANUP & MEMORY LEAK GUARD
  console.log('\n--- TEST NHÓM 6: GIẢI PHÓNG KẾT NỐI (DISCONNECT CLEANUP) ---');
  
  // Lấy stats trước khi đóng
  const statsBefore = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/events/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const clientCountBefore = statsBefore.body.data.activeClients;

  // Đóng client staff và citizen
  staffClient.close();
  citizenClient.close();
  await sleep(150);

  const statsAfter = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/events/stats',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const clientCountAfter = statsAfter.body.data.activeClients;

  assert(clientCountAfter < clientCountBefore, `Connection Registry dọn dẹp thành công sau disconnect (Trước: ${clientCountBefore}, Sau: ${clientCountAfter})`);

  // TEST NHÓM 7: TOÀN VẸN CÂY XANH ĐÔ THỊ
  console.log('\n--- TEST NHÓM 7: TOÀN VẸN CƠ SỞ DỮ LIỆU CÂY XANH (5.425 CÂY) ---');
  const [treeRow] = await allSql('SELECT count(*) as count FROM trees');
  assert(treeRow && treeRow.count === 5425, `Số lượng cây xanh SQLite bảo toàn 100% (Hiện tại: ${treeRow?.count} cây)`);

  // Dọn dẹp lệnh test
  await runSql('DELETE FROM work_order_items WHERE work_order_id = ?', [createdOrderId]);
  await runSql('DELETE FROM work_order_history WHERE work_order_id = ?', [createdOrderId]);
  await runSql('DELETE FROM work_orders WHERE id = ?', [createdOrderId]);
  adminClient.close();

  console.log('\n========================================================================');
  console.log(`🏁 KẾT QUẢ KIỂM THỬ WAVE 3.1: ${passedTests}/${totalTests} TESTS PASS (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log('========================================================================\n');

  if (passedTests === totalTests) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Lỗi thực thi kiểm thử Wave 3.1:', err);
  process.exit(1);
});

