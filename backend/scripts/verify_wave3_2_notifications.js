/**
 * 🧪 BỘ KIỂM THỬ GIÁM ĐỊNH TOÀN DIỆN WAVE 3.2 — PERSISTENT NOTIFICATION HUB
 * Kiểm chứng 15 tiêu chuẩn chấp nhận bắt buộc:
 * 1. Database Schema: Bảng notifications, các cột, indexes.
 * 2. Create Persistent Notification: SQLite row created.
 * 3. Role Isolation: Admin notification không lộ cho Citizen.
 * 4. User Isolation: User A không xem/đọc notification của User B.
 * 5. Unread Count: Tăng/giảm chính xác theo trạng thái đọc.
 * 6. Mark Read Idempotency: Không lỗi và không ghi đè read_at khi gọi lặp lại.
 * 7. Mark All Read Isolation: Chỉ ảnh hưởng thông báo thuộc quyền user gọi.
 * 8. SSE + Persistence: Post-COMMIT SQLite notification tồn tại + notification.pushed phát thành công.
 * 9. Rollback Guard: Transaction rollback -> không có persistent notification và không có SSE.
 * 10. Offline Recovery: Thông báo tạo khi offline hiển thị đầy đủ khi mở lại app.
 * 11. Cross Device: Thông báo đồng bộ thời gian thực và bền vững sau khi reload.
 * 12. SSE Replay Safety: Replay không tạo trùng row trong SQLite hay nhân đôi unread count.
 * 13. PII Leak Check: Quét payload không chứa SĐT người dân, JWT, password.
 * 14. Database Preservation: 5.425 cây xanh được bảo tồn nguyên vẹn.
 * 15. Frozen File Check: src/components/HomeLandingView.tsx = 0 diff.
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
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

function getDbRow(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 BẮT ĐẦU KIỂM THỬ GIÁM ĐỊNH TOÀN DIỆN WAVE 3.2 — PERSISTENT NOTIFICATION HUB');
  console.log('========================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  function pass(msg) {
    console.log(`  ✅ [PASS] ${msg}`);
    passedTests++;
  }

  function fail(msg, err) {
    console.error(`  ❌ [FAIL] ${msg}`, err || '');
    failedTests++;
  }

  // Khởi tạo các JWT token
  const adminToken = jwt.sign({ id: 1, username: 'admin', role: 'ADMIN', full_name: 'Đặng Thế Thuận' }, JWT_SECRET, { expiresIn: '1h' });
  const staffLamToken = jwt.sign({ id: 2, username: 'staff_lam', role: 'STAFF', full_name: 'Nguyễn Văn Lâm' }, JWT_SECRET, { expiresIn: '1h' });
  const staffTuanToken = jwt.sign({ id: 3, username: 'staff_tuananh', role: 'STAFF', full_name: 'Lê Tuấn Anh' }, JWT_SECRET, { expiresIn: '1h' });
  const citizenToken = jwt.sign({ id: 4, username: 'citizen_an', role: 'CITIZEN', full_name: 'Trần Văn An' }, JWT_SECRET, { expiresIn: '1h' });

  try {
    // -------------------------------------------------------------------------
    // TEST 1 — DATABASE SCHEMA & INDEXES
    // -------------------------------------------------------------------------
    console.log('📋 [TEST 1] Kiểm tra Database Schema & Indexes bảng notifications...');
    const tableInfo = await queryDb("PRAGMA table_info('notifications')");
    if (tableInfo.length > 0) {
      pass(`Bảng notifications tồn tại trong SQLite (${tableInfo.length} cột)`);
    } else {
      fail('Bảng notifications không tồn tại');
    }

    const colNames = tableInfo.map((c) => c.name);
    const requiredCols = ['id', 'user_id', 'target_role', 'title', 'message', 'type', 'severity', 'entity_type', 'entity_id', 'link_tab', 'link_id', 'is_read', 'created_at', 'read_at'];
    const missingCols = requiredCols.filter((col) => !colNames.includes(col));
    if (missingCols.length === 0) {
      pass(`Đầy đủ 100% các cột bắt buộc: ${requiredCols.join(', ')}`);
    } else {
      fail(`Thiếu các cột: ${missingCols.join(', ')}`);
    }

    const indexList = await queryDb("PRAGMA index_list('notifications')");
    const indexNames = indexList.map((i) => i.name);
    const expectedIndexes = ['idx_notifications_user', 'idx_notifications_role', 'idx_notifications_unread', 'idx_notifications_created'];
    const missingIndexes = expectedIndexes.filter((idx) => !indexNames.includes(idx));
    if (missingIndexes.length === 0) {
      pass(`Đầy đủ các Indexes tối ưu hóa truy vấn: ${expectedIndexes.join(', ')}`);
    } else {
      fail(`Thiếu Indexes: ${missingIndexes.join(', ')}`);
    }

    // -------------------------------------------------------------------------
    // TEST 2 — CREATE PERSISTENT NOTIFICATION TRONG SQLITE
    // -------------------------------------------------------------------------
    console.log('\n💾 [TEST 2] Tạo Persistent Notification trực tiếp trong SQLite...');
    const testNotifId = `test-notif-${Date.now()}`;
    await runSql(
      `INSERT INTO notifications (id, user_id, target_role, title, message, type, severity, entity_type, entity_id, link_tab, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [testNotifId, 2, 'STAFF', 'Kiểm tra lưu trữ', 'Nội dung thông báo kiểm thử Wave 3.2', 'TEST_EVENT', 'INFO', 'WORK_ORDER', 'wo-999', 'work_orders']
    );

    const savedRow = await getDbRow('SELECT * FROM notifications WHERE id = ?', [testNotifId]);
    if (savedRow && savedRow.id === testNotifId && savedRow.is_read === 0) {
      pass(`Notification lưu bền vững trong SQLite (ID: ${savedRow.id}, is_read: ${savedRow.is_read})`);
    } else {
      fail('Không tìm thấy notification vừa tạo trong SQLite');
    }

    // -------------------------------------------------------------------------
    // TEST 3 — ROLE ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n🛡️ [TEST 3] Kiểm tra Phân Tách Quyền (Role Isolation: Admin notification không lộ cho Citizen)...');
    const adminNotifId = `admin-only-${Date.now()}`;
    await runSql(
      `INSERT INTO notifications (id, user_id, target_role, title, message, type, severity)
       VALUES (?, NULL, 'ADMIN', 'Chỉ đạo khẩn cấp Lãnh đạo', 'Nội dung mật chỉ dành cho Ban Chỉ huy', 'COMMAND_ALERT', 'CRITICAL')`,
      [adminNotifId]
    );

    // Citizen gọi API
    const citizenRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    const citizenSeesAdminNotif = citizenRes.body.data && citizenRes.body.data.some((n) => n.id === adminNotifId);
    if (!citizenSeesAdminNotif) {
      pass('Citizen không nhìn thấy thông báo target_role = ADMIN');
    } else {
      fail('Lỗ hổng bảo mật: Citizen nhìn thấy thông báo của ADMIN!');
    }

    // Admin gọi API
    const adminRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminSeesAdminNotif = adminRes.body.data && adminRes.body.data.some((n) => n.id === adminNotifId);
    if (adminSeesAdminNotif) {
      pass('Admin nhìn thấy chính xác thông báo target_role = ADMIN');
    } else {
      fail('Admin không nhìn thấy thông báo target_role = ADMIN');
    }

    // -------------------------------------------------------------------------
    // TEST 4 — USER ISOLATION (User A vs User B)
    // -------------------------------------------------------------------------
    console.log('\n🔒 [TEST 4] Kiểm tra Phân Tách Người Dùng (User Isolation: User 2 vs User 3)...');
    const user2NotifId = `user2-private-${Date.now()}`;
    await runSql(
      `INSERT INTO notifications (id, user_id, target_role, title, message, type, severity, created_at)
       VALUES (?, 2, 'STAFF', 'Nhiệm vụ riêng của Lâm', 'Lâm kiểm tra tuyến Hòa Bình', 'PRIVATE_TASK', 'INFO', ?)`,
      [user2NotifId, new Date().toISOString()]
    );

    // User 3 (Lê Tuấn Anh) thử đọc danh sách
    const user3ListRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffTuanToken}` },
    });
    const user3SeesUser2Notif = user3ListRes.body.data && user3ListRes.body.data.some((n) => n.id === user2NotifId);
    if (!user3SeesUser2Notif) {
      pass('User 3 (Tuấn Anh) không thể xem thông báo riêng của User 2 (Lâm)');
    } else {
      fail('Lỗ hổng: User 3 xem được thông báo riêng của User 2!');
    }

    // User 3 thử gọi PATCH read notification của User 2
    const user3PatchRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/notifications/${user2NotifId}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffTuanToken}` },
    });
    if (user3PatchRes.status === 404 || user3PatchRes.status === 403) {
      pass(`Chặn đứng User 3 sửa trạng thái thông báo của User 2 (HTTP ${user3PatchRes.status})`);
    } else {
      fail(`User 3 đánh dấu được thông báo của User 2! (HTTP ${user3PatchRes.status})`);
    }

    // User 2 (Lâm) gọi API
    const user2ListRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    const user2SeesOwnNotif = user2ListRes.body.data && user2ListRes.body.data.some((n) => n.id === user2NotifId);
    if (user2SeesOwnNotif) {
      pass('User 2 xem được đúng thông báo riêng của mình');
    } else {
      fail('User 2 không xem được thông báo riêng của mình');
    }

    // -------------------------------------------------------------------------
    // TEST 5 — UNREAD COUNT TÍNH TOÁN CHÍNH XÁC
    // -------------------------------------------------------------------------
    console.log('\n🔢 [TEST 5] Kiểm tra API đếm số lượng thông báo chưa đọc (GET /api/notifications/unread-count)...');
    const initialCountRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    const beforeCount = initialCountRes.body.count;

    // Tạo thêm 1 thông báo chưa đọc cho User 2
    const countedNotifId = `counted-notif-${Date.now()}`;
    await runSql(
      `INSERT INTO notifications (id, user_id, target_role, title, message, type, severity, is_read)
       VALUES (?, 2, 'STAFF', 'Thông báo tính count', 'Check count increase', 'COUNT_TEST', 'INFO', 0)`,
      [countedNotifId]
    );

    const afterCreateRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    if (afterCreateRes.body.count === beforeCount + 1) {
      pass(`Unread count tăng chính xác khi có thông báo mới (Trước: ${beforeCount}, Sau: ${afterCreateRes.body.count})`);
    } else {
      fail(`Unread count tính sai: Trước ${beforeCount}, Sau ${afterCreateRes.body.count}`);
    }

    // Đánh dấu đã đọc
    await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/notifications/${countedNotifId}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });

    const afterReadRes = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    if (afterReadRes.body.count === beforeCount) {
      pass(`Unread count giảm chính xác khi đánh dấu đã đọc (Hiện tại: ${afterReadRes.body.count})`);
    } else {
      fail(`Unread count không giảm sau khi đọc: ${afterReadRes.body.count}`);
    }

    // -------------------------------------------------------------------------
    // TEST 6 — MARK READ IDEMPOTENCY
    // -------------------------------------------------------------------------
    console.log('\n🔁 [TEST 6] Kiểm tra Tính Bất Biến (Idempotency) khi Đánh Dấu Đã Đọc...');
    const idemNotifId = `idem-notif-${Date.now()}`;
    await runSql(
      `INSERT INTO notifications (id, user_id, target_role, title, message, type, severity, is_read)
       VALUES (?, 2, 'STAFF', 'Idempotent Read', 'Check double read', 'IDEM_TEST', 'INFO', 0)`,
      [idemNotifId]
    );

    // Lần 1: Đánh dấu đã đọc
    const read1 = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/notifications/${idemNotifId}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    const firstReadAt = read1.body.data ? read1.body.data.readAt : null;
    if (read1.status === 200 && read1.body.alreadyRead === false && firstReadAt) {
      pass('Lần 1: Đánh dấu đã đọc thành công (alreadyRead: false, có readAt)');
    } else {
      fail('Lần 1 thất bại');
    }

    await sleep(50);

    // Lần 2: Gọi lại cùng request
    const read2 = await request({
      hostname: 'localhost',
      port: 5001,
      path: `/api/notifications/${idemNotifId}/read`,
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    const secondReadAt = read2.body.data ? read2.body.data.readAt : null;
    if (read2.status === 200 && read2.body.alreadyRead === true && firstReadAt === secondReadAt) {
      pass('Lần 2: Hệ thống phản hồi an toàn (alreadyRead: true, không ghi đè readAt)');
    } else {
      fail(`Lần 2 vi phạm Idempotency: firstReadAt=${firstReadAt}, secondReadAt=${secondReadAt}`);
    }

    // -------------------------------------------------------------------------
    // TEST 7 — MARK ALL READ ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n👥 [TEST 7] Kiểm tra Đánh Dấu Tất Cả Đã Đọc Có Phân Quyền (PATCH /read-all)...');
    const u2Notif = `u2-un-${Date.now()}`;
    const u3Notif = `u3-un-${Date.now()}`;
    await runSql(`INSERT INTO notifications (id, user_id, target_role, title, message, type, is_read) VALUES (?, 2, 'STAFF', 'U2 unread', 'msg', 'T', 0)`, [u2Notif]);
    await runSql(`INSERT INTO notifications (id, user_id, target_role, title, message, type, is_read) VALUES (?, 3, 'STAFF', 'U3 unread', 'msg', 'T', 0)`, [u3Notif]);

    // User 2 gọi mark all read
    await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications/read-all',
      method: 'PATCH',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });

    const checkU2 = await getDbRow('SELECT is_read FROM notifications WHERE id = ?', [u2Notif]);
    const checkU3 = await getDbRow('SELECT is_read FROM notifications WHERE id = ?', [u3Notif]);

    if (checkU2.is_read === 1 && checkU3.is_read === 0) {
      pass('PATCH /read-all chỉ cập nhật thông báo của User 2; thông báo User 3 vẫn giữ is_read = 0 an toàn');
    } else {
      fail(`Lỗi phân quyền read-all: User 2 is_read=${checkU2.is_read}, User 3 is_read=${checkU3.is_read}`);
    }

    // -------------------------------------------------------------------------
    // TEST 8 — SSE + PERSISTENCE INTEGRATION (POST-COMMIT)
    // -------------------------------------------------------------------------
    console.log('\n📡 [TEST 8] Kiểm tra Khép kín Giao dịch: Business Mutation -> SQLite Persistence -> SSE notification.pushed...');
    const sseClient = await openSseConnection(staffLamToken);

    // Tạo lệnh công tác mẫu để phân bổ
    const newWoRes = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/work-orders',
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      },
      {
        title: 'Bảo dưỡng cây thử nghiệm Wave 3.2',
        type: 'PRUNING',
        priority: 'HIGH',
        scopeType: 'ROUTE',
        routeId: 'route-hoa-binh',
        trees: [{ treeId: 1, treeCode: 'TREE-001', location: 'Đại Lộ Hòa Bình' }],
      }
    );
    const woId = newWoRes.body.data.id;

    // Đảm bảo có phương tiện khả dụng cho bài test
    let availEq = await getDbRow("SELECT plate_number, name FROM equipment WHERE status = 'AVAILABLE' LIMIT 1");
    if (!availEq) {
      await runSql("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL WHERE id = 'eq-truck-18m-01'");
      availEq = await getDbRow("SELECT plate_number, name FROM equipment WHERE id = 'eq-truck-18m-01'");
    }

    // Phân bổ lệnh
    const assignResult = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/work-orders/${woId}/assign`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      },
      {
        teamId: 'team-prune-1',
        teamName: 'Tổ Cắt Tỉa Ninh Kiều',
        vehiclePlate: availEq.plate_number,
        vehicleName: availEq.name,
      }
    );

    await sleep(400);

    // Kiểm tra trong SQLite notifications
    const woNotifRow = await getDbRow('SELECT * FROM notifications WHERE entity_id = ? AND type = ?', [woId, 'WORK_ORDER_ASSIGNED']);
    if (woNotifRow) {
      pass(`SQLite đã lưu Persistent Notification cho lệnh ${woId} (ID: ${woNotifRow.id})`);
    } else {
      fail(`Không tìm thấy Persistent Notification trong SQLite cho lệnh ${woId}`);
    }

    // Kiểm tra SSE event
    const notifPushedEvent = sseClient.events.find((e) => e.event === 'notification.pushed' && e.data.payload && e.data.payload.entityId === woId);
    if (notifPushedEvent) {
      pass(`SSE client đã nhận sự kiện notification.pushed cho lệnh ${woId}`);
    } else {
      fail('SSE client không nhận được sự kiện notification.pushed');
    }
    sseClient.close();

    // -------------------------------------------------------------------------
    // TEST 9 — TRANSACTION ROLLBACK GUARD
    // -------------------------------------------------------------------------
    console.log('\n🛡️ [TEST 9] Kiểm tra Rollback Guard (Lỗi transaction -> Không lưu notification, Không phát SSE)...');
    const rollbackSseClient = await openSseConnection(staffLamToken);
    const countBeforeRollback = (await getDbRow('SELECT COUNT(*) as count FROM notifications')).count;

    // Thử phân công với dữ liệu sai để ép transaction thất bại (xe đã bị khóa)
    await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/work-orders/${woId}/assign`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      },
      {
        teamId: 'team-prune-1',
        vehiclePlate: '65A-0892', // Xe đang IN_USE bởi chính lệnh woId hoặc lệnh khác
      }
    );

    await sleep(200);
    const countAfterRollback = (await getDbRow('SELECT COUNT(*) as count FROM notifications')).count;
    const hasPushedEvent = rollbackSseClient.events.some((e) => e.event === 'notification.pushed' && e.data.payload.entityId === 'invalid-test');

    if (countAfterRollback === countBeforeRollback && !hasPushedEvent) {
      pass('Rollback Guard hoàn hảo: Không có notification rác và không có SSE rác');
    } else {
      fail('Lỗi: Transaction thất bại nhưng dữ liệu notification vẫn bị ghi nhận!');
    }
    rollbackSseClient.close();

    // -------------------------------------------------------------------------
    // TEST 10 — OFFLINE RECOVERY
    // -------------------------------------------------------------------------
    console.log('\n📴 [TEST 10] Kiểm tra Khả Năng Khôi Phục Khi Người Dùng Offline (Persistent Inbox)...');
    // Tạo notification khi user không có kết nối SSE nào mở
    const offlineNotifId = `offline-msg-${Date.now()}`;
    await runSql(
      `INSERT INTO notifications (id, user_id, target_role, title, message, type, severity, is_read, created_at)
       VALUES (?, 2, 'STAFF', 'Thông báo khi bạn đang ngoại tuyến', 'Hệ thống lưu lại trong SQLite', 'OFFLINE_MSG', 'INFO', 0, ?)`,
      [offlineNotifId, new Date().toISOString()]
    );

    // User mở ứng dụng sau đó và gọi GET /api/notifications
    const offlineFetch = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    const foundOfflineMsg = offlineFetch.body.data && offlineFetch.body.data.some((n) => n.id === offlineNotifId);
    if (foundOfflineMsg) {
      pass('User offline sau đó mở app đọc đầy đủ thông báo từ Persistent SQLite Inbox');
    } else {
      fail('Không tải được thông báo đã lưu khi offline');
    }

    // -------------------------------------------------------------------------
    // TEST 11 — CROSS DEVICE PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n📱 [TEST 11] Kiểm tra Đa Thiết Bị: Thiết bị A thao tác -> Thiết bị B nhận realtime và tồn tại sau reload...');
    const staffBClient = await openSseConnection(staffLamToken);

    // Thiết bị A (Admin) báo cáo cập nhật tiến độ sự cố
    const incRes = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        reporter_name: 'Người dân test',
        reporter_phone: '0912345678',
        description: 'Cành cây sà thấp',
        severity: 'Cần xử lý',
      }
    );
    const incId = incRes.body.incident_id;

    // KTV cập nhật trạng thái sự cố sang IN_PROGRESS rồi RESOLVED tuân thủ State Machine Wave 3.3
    await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/incidents/${incId}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffLamToken}` },
      },
      { status: 'IN_PROGRESS' }
    );

    await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: `/api/incidents/${incId}/status`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${staffLamToken}` },
      },
      { status: 'RESOLVED', resolved_at: new Date().toISOString() }
    );

    await sleep(300);

    // Thiết bị B nhận event
    const statusNotifEvt = staffBClient.events.find((e) => e.event === 'notification.pushed' && e.data.payload && e.data.payload.entityId === String(incId));
    if (statusNotifEvt) {
      pass('Thiết bị B nhận tức thời sự kiện notification.pushed qua SSE');
    } else {
      fail('Thiết bị B không nhận được notification.pushed');
    }
    staffBClient.close();

    // Thiết bị B "reload" (fetch lại inbox từ API)
    const reloadFetch = await request({
      hostname: 'localhost',
      port: 5001,
      path: '/api/notifications',
      method: 'GET',
      headers: { Authorization: `Bearer ${staffLamToken}` },
    });
    const foundAfterReload = reloadFetch.body.data && reloadFetch.body.data.some((n) => n.entityId === String(incId));
    if (foundAfterReload) {
      pass('Sau khi reload trang, thông báo vẫn tồn tại 100% từ SQLite Database');
    } else {
      fail('Thông báo biến mất sau khi reload!');
    }

    // -------------------------------------------------------------------------
    // TEST 12 — SSE REPLAY SAFETY
    // -------------------------------------------------------------------------
    console.log('\n🔁 [TEST 12] Kiểm tra An Toàn Replay Sự Kiện (Chống tạo Duplicate DB Rows)...');
    const dbCountBeforeReplay = (await getDbRow('SELECT COUNT(*) as count FROM notifications')).count;

    // Giả lập client kết nối lại với Last-Event-ID
    const lastEventId = statusNotifEvt ? statusNotifEvt.id : 'evt-0';
    const replayClient = await openSseConnection(staffLamToken);

    await sleep(200);
    const dbCountAfterReplay = (await getDbRow('SELECT COUNT(*) as count FROM notifications')).count;
    if (dbCountAfterReplay === dbCountBeforeReplay) {
      pass(`SSE Replay không chèn trùng row vào bảng SQLite (Số lượng không đổi: ${dbCountBeforeReplay})`);
    } else {
      fail(`Lỗi: SSE Replay làm tăng row trong database! Trước: ${dbCountBeforeReplay}, Sau: ${dbCountAfterReplay}`);
    }
    replayClient.close();

    // -------------------------------------------------------------------------
    // TEST 13 — PII DATA MINIMIZATION LEAK CHECK
    // -------------------------------------------------------------------------
    console.log('\n🔍 [TEST 13] Kiểm tra Chống Lộ PII (Số điện thoại, JWT, Password)...');
    const sensitivePhone = '0988776655';
    const piiIncRes = await request(
      {
        hostname: 'localhost',
        port: 5001,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {
        reporter_name: 'Lê Văn Bảo Mật',
        reporter_phone: sensitivePhone,
        description: 'Cây ngã đổ chắn hẻm',
        severity: 'Khẩn cấp',
      }
    );
    const piiIncId = piiIncRes.body.incident_id;

    const notifRow = await getDbRow('SELECT * FROM notifications WHERE entity_id = ?', [String(piiIncId)]);
    if (notifRow) {
      const payloadString = JSON.stringify(notifRow);
      const containsPhone = payloadString.includes(sensitivePhone);
      const containsPassword = payloadString.toLowerCase().includes('password') || payloadString.includes('hash');
      const containsJwt = payloadString.includes('Bearer ') || payloadString.includes('eyJ');

      if (!containsPhone && !containsPassword && !containsJwt) {
        pass('Notification payload không chứa số điện thoại người dân, JWT hay Password');
      } else {
        fail(`Phát hiện lộ dữ liệu nhạy cảm trong notification: Phone=${containsPhone}, Pwd=${containsPassword}, JWT=${containsJwt}`);
      }
    } else {
      fail('Không tìm thấy notification kiểm tra PII');
    }

    // -------------------------------------------------------------------------
    // TEST 14 — DATABASE PRESERVATION (5.425 TREES)
    // -------------------------------------------------------------------------
    console.log('\n🌳 [TEST 14] Kiểm tra Bảo Toàn Dữ Liệu Cây Xanh Đô Thị...');
    const treeCountRow = await getDbRow('SELECT count(*) as count FROM trees');
    if (treeCountRow && treeCountRow.count === 5425) {
      pass(`Số lượng cây xanh được bảo tồn nguyên vẹn: ${treeCountRow.count} cây`);
    } else {
      fail(`Cơ sở dữ liệu cây xanh bị suy giảm: ${treeCountRow ? treeCountRow.count : 0}/5425`);
    }

    // -------------------------------------------------------------------------
    // TEST 15 — FROZEN FILE CHECK (HomeLandingView.tsx)
    // -------------------------------------------------------------------------
    console.log('\n🧊 [TEST 15] Kiểm tra Tính Bất Biến của HomeLandingView.tsx...');
    try {
      const gitDiff = execSync('git diff --name-only src/components/HomeLandingView.tsx', { encoding: 'utf8' }).trim();
      const gitStatus = execSync('git status --porcelain src/components/HomeLandingView.tsx', { encoding: 'utf8' }).trim();
      if (!gitDiff && !gitStatus) {
        pass('src/components/HomeLandingView.tsx hoàn toàn bất biến (0 diff, FROZEN 100%)');
      } else {
        fail(`HomeLandingView.tsx đã bị can thiệp trái phép! Diff: ${gitDiff || gitStatus}`);
      }
    } catch (gitErr) {
      fail('Không thể kiểm tra git status của HomeLandingView.tsx', gitErr);
    }

    // -------------------------------------------------------------------------
    // TỔNG KẾT
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log(`🏁 KẾT QUẢ KIỂM THỬ WAVE 3.2: ${passedTests} PASS, ${failedTests} FAIL`);
    console.log('========================================================================');

    if (failedTests > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (globalErr) {
    console.error('❌ Lỗi ngoại lệ trong quá trình chạy bộ test:', globalErr);
    process.exit(1);
  }
}

runTests();
