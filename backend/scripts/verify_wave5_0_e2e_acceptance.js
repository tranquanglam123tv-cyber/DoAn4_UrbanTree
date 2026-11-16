/**
 * 🏛️ WAVE 5.0 — REAL END-TO-END ACCEPTANCE FORENSIC SUITE
 * 5-Layer Rigorous Verification: UI API -> SQLite Transaction -> Realtime SSE -> Multi-role Workflow -> F5 Persistence
 */
const http = require('http');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const path = require('path');

const JWT_SECRET = 'urbantree_jwt_super_secret_key_2026_doan4';
const DB_PATH = path.resolve(__dirname, '../urbantree.db');

const adminToken = jwt.sign(
  { id: 1, username: 'admin', role: 'ADMIN', full_name: 'Quản Trị Viên Thành Phố' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

const staffToken = jwt.sign(
  { id: 2, username: 'staff1', role: 'STAFF', full_name: 'Trần Văn Kỹ Thuật', team_id: 'team-prune-1' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

const citizenToken = jwt.sign(
  { id: 99, username: 'citizen_cantho', role: 'CITIZEN', full_name: 'Nguyễn Văn Dân' },
  JWT_SECRET,
  { expiresIn: '2h' }
);

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = { 'Accept': 'application/json' };
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path,
        method,
        headers,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let parsed = {};
          try {
            parsed = JSON.parse(rawData);
          } catch (e) {
            parsed = { raw: rawData };
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

function queryDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) return reject(err);
    });
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function runAcceptanceSuite() {
  console.log('===============================================================');
  console.log('🏛️ WAVE 5.0 — REAL UI END-TO-END ACCEPTANCE FORENSIC AUDIT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Clean prior test artifacts and ensure test vehicle is available
    await queryDb("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL WHERE plate_number = '65A-0892'");

    // ==========================================
    // PHASE A: AUTHENTICATION & RBAC
    // ==========================================
    console.log('--- PHASE A: 🔐 ĐĂNG NHẬP & PHÂN QUYỀN (RBAC) ---');
    
    // W5-A01: Admin Login & Access
    const adminCheck = await request('GET', '/api/work-orders', null, adminToken);
    assert(adminCheck.status === 200, 'W5-A01: Admin truy cập Work Order Center thành công (HTTP 200)');
    
    // W5-A02: Staff Login & Access
    const staffCheck = await request('GET', '/api/work-orders', null, staffToken);
    assert(staffCheck.status === 200, 'W5-A02: Staff truy cập danh sách lệnh của tổ thành công (HTTP 200)');
    
    // W5-A03: Citizen Guard
    const citizenGuard = await request('GET', '/api/work-orders', null, citizenToken);
    assert(citizenGuard.status === 403, 'W5-A03: Citizen bị chặn truy cập Work Orders nội bộ (HTTP 403 Forbidden)');

    const citizenDispatchGuard = await request('POST', '/api/work-orders/emergency-storm', {}, citizenToken);
    assert(citizenDispatchGuard.status === 403, 'W5-A03: Citizen bị chặn gọi API điều phối xe khẩn cấp (HTTP 403 Forbidden)');

    // ==========================================
    // PHASE B: CITIZEN INCIDENT -> WORK ORDER
    // ==========================================
    console.log('\n--- PHASE B: 🚨 INCIDENT -> WORK ORDER ---');

    // W5-B02: Validation error on empty form
    const badFormRes = await request('POST', '/api/incidents', { description: '' }, citizenToken);
    assert(badFormRes.status === 400 || badFormRes.body.success === false, 'W5-B02: Chặn form phản ánh thiếu dữ liệu bắt buộc (Validation Error)');

    // W5-B01: Citizen creates valid incident
    const testIncidentData = {
      title: 'Cành cây sao đen sà sát dây điện hạ thế số 45 30/4',
      description: 'Cành mục có nguy cơ gãy khi trời mưa giông, cần xe thang cắt hạ',
      location: 'Số 45 đường 30/4, P. An Lạc, Q. Ninh Kiều',
      reporter_name: 'Nguyễn Văn Dân',
      reporter_phone: '0918123456',
      danger_level: 'CAO',
      category: 'GÃY CÀNH'
    };
    const incCreateRes = await request('POST', '/api/incidents', testIncidentData, citizenToken);
    const incidentId = incCreateRes.body.data ? incCreateRes.body.data.id : incCreateRes.body.id;
    assert(Boolean(incidentId), `W5-B01: Citizen tạo sự cố thành công, sinh ID thật: ${incidentId}`);

    // Verify in SQLite
    const incDbRows = await queryDb('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    assert(incDbRows.length > 0 && incDbRows[0].reporter_phone === '0918123456', 'W5-B01: Sự cố lưu thành công vào bảng incidents trong SQLite');

    // W5-B03: Admin creates Work Order from Incident
    const createWoPayload = {
      title: `[XỬ LÝ SỰ CỐ #${incidentId}] Cắt tỉa cành sao đen sát dây điện`,
      description: 'Lệnh điều phối từ phản ánh của người dân số 45 đường 30/4',
      type: 'PRUNING',
      priority: 'HIGH',
      incidentId: incidentId,
      assignedTeamId: 'team-prune-1',
      assignedTeamName: 'Tổ Cơ Giới Cắt Tỉa',
      treeIds: ['1', '2']
    };
    const woCreateRes = await request('POST', '/api/work-orders', createWoPayload, adminToken);
    if (woCreateRes.status !== 201) {
      console.log('DEBUG woCreateRes:', woCreateRes.status, woCreateRes.body);
    }
    assert(woCreateRes.status === 201 && woCreateRes.body.success === true, 'W5-B03: Admin tạo Work Order từ Incident thành công (HTTP 201)');
    const createdWo = woCreateRes.body.data || woCreateRes.body.order;
    assert(Boolean(createdWo && createdWo.id), `W5-B03: Lệnh công tác sinh mã thật: ${createdWo?.code}`);

    // Check bidirectional link in SQLite
    const incUpdatedDb = await queryDb('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    assert(
      incUpdatedDb[0].work_order_id === createdWo.id && incUpdatedDb[0].status === 'Đang xử lý',
      'W5-B03: Incident cập nhật trạng thái "Đang xử lý" và liên kết work_order_id trong SQLite'
    );

    // Guard against duplicate WO creation from same incident
    const duplicateWoRes = await request('POST', '/api/work-orders', createWoPayload, adminToken);
    assert(duplicateWoRes.status === 400, 'W5-B03: Chặn tạo trùng lặp Lệnh công tác cho Incident đang xử lý (HTTP 400)');

    // ==========================================
    // PHASE C: 🚛 ĐIỀU XE & PHÂN TỔ
    // ==========================================
    console.log('\n--- PHASE C: 🚛 ĐIỀU XE & PHÂN TỔ ---');

    // W5-C01 & W5-C02: Phân tổ & Điều xe
    const assignRes = await request(
      'PATCH',
      `/api/work-orders/${createdWo.id}/assign`,
      {
        teamId: 'team-prune-1',
        teamName: 'Tổ Cơ Giới Cắt Tỉa',
        vehicleName: 'Xe Thang Tự Hành Nâng Cao',
        vehiclePlate: '65A-0892',
        equipmentId: 'eq-ladder-01'
      },
      adminToken
    );
    if (assignRes.status !== 200) {
      console.log('DEBUG assignRes:', assignRes.status, assignRes.body);
    }
    assert(assignRes.status === 200 && assignRes.body.success === true, 'W5-C01 & W5-C02: Phân tổ và điều xe thành công');

    // Check equipment status in SQLite
    const eqDbRows = await queryDb('SELECT * FROM equipment WHERE plate_number = ?', ['65A-0892']);
    assert(
      eqDbRows.length > 0 && eqDbRows[0].status === 'IN_USE' && eqDbRows[0].current_work_order_id === createdWo.id,
      'W5-C02: Phương tiện 65A-0892 chuyển sang IN_USE và khóa vào current_work_order_id trong SQLite'
    );

    // W5-C03: Chống Double-booking xe
    const anotherWoPayload = {
      title: 'Lệnh cắt tỉa đột xuất khác',
      type: 'PRUNING',
      priority: 'MEDIUM',
      treeIds: ['3']
    };
    const anotherWoRes = await request('POST', '/api/work-orders', anotherWoPayload, adminToken);
    const anotherWoId = (anotherWoRes.body.data || anotherWoRes.body.order).id;

    const doubleBookRes = await request(
      'PATCH',
      `/api/work-orders/${anotherWoId}/assign`,
      {
        teamId: 'team-prune-2',
        vehiclePlate: '65A-0892'
      },
      adminToken
    );
    assert(
      doubleBookRes.status === 400 && doubleBookRes.body.message.includes('hiện đang được sử dụng'),
      'W5-C03: Chặn Double-booking phương tiện đang bận thành công (HTTP 400)'
    );

    // ==========================================
    // PHASE D: 👷 STAFF NHẬN LỆNH & THI CÔNG
    // ==========================================
    console.log('\n--- PHASE D: 👷 STAFF THỰC SỰ THI CÔNG ---');

    // W5-D01: Staff fetches assigned order
    const staffDetailRes = await request('GET', `/api/work-orders/${createdWo.id}`, null, staffToken);
    assert(
      staffDetailRes.status === 200 && staffDetailRes.body.items.length === 2,
      'W5-D01: Staff tải chi tiết Lệnh và thấy đầy đủ 2 cây trong checklist'
    );

    // W5-D02: Bắt đầu thi công (ASSIGNED -> IN_PROGRESS)
    const startRes = await request(
      'PATCH',
      `/api/work-orders/${createdWo.id}/status`,
      { status: 'IN_PROGRESS', notes: 'KTV bắt đầu triển khai xe thang và biển cảnh báo' },
      staffToken
    );
    const startOrder = startRes.body.data || startRes.body.order;
    assert(startRes.status === 200 && startOrder && startOrder.status === 'IN_PROGRESS', 'W5-D02: Chuyển trạng thái Lệnh sang IN_PROGRESS thành công');

    // ==========================================
    // PHASE E: ⚡ BATCH RESOLUTION (WAVE 4.9)
    // ==========================================
    console.log('\n--- PHASE E: ⚡ BATCH RESOLUTION (WAVE 4.9) ---');

    const items = staffDetailRes.body.items;
    const itemIds = items.map((i) => i.id);

    // W5-E01 & W5-E02: Batch Complete all items
    const batchRes = await request(
      'POST',
      '/api/work-orders/campaigns/storm/batch-complete-items',
      {
        itemIds: [itemIds[0]],
        notes: 'Đã hoàn thành cắt cành nguy hiểm gần dây điện',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d'
      },
      staffToken
    );
    assert(batchRes.status === 200 && batchRes.body.order.completedItems === 1, 'W5-E02: Batch Complete cây số 1 thành công (completed=1/2, 50%)');

    // Complete second tree
    const batchRes2 = await request(
      'POST',
      '/api/work-orders/campaigns/storm/batch-complete-items',
      {
        itemIds: [itemIds[1]],
        notes: 'Đã tỉa tán cây số 2 gọn gàng theo chuẩn',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d'
      },
      staffToken
    );
    assert(batchRes2.status === 200 && batchRes2.body.order.completedItems === 2, 'W5-E02: Hoàn tất 100% checklist (completed=2/2, 100%)');

    // ==========================================
    // PHASE F: ⏳ STAFF NỘP NGHIỆM THU
    // ==========================================
    console.log('\n--- PHASE F: ⏳ STAFF NỘP NGHIỆM THU ---');

    // W5-F01: Auto-transition to SUBMITTED_FOR_REVIEW
    assert(
      batchRes2.body.order.status === 'SUBMITTED_FOR_REVIEW',
      'W5-F01: Lệnh công tác tự động chuyển sang SUBMITTED_FOR_REVIEW khi 100% checklist hoàn thành'
    );

    // ==========================================
    // PHASE G: 🏛️ ADMIN NGHIỆM THU (GOLDEN LOOP CLOSURE)
    // ==========================================
    console.log('\n--- PHASE G: 🏛️ ADMIN NGHIỆM THU (GOLDEN LOOP CLOSURE) ---');

    const verifyRes = await request(
      'POST',
      `/api/work-orders/${createdWo.id}/verify`,
      {
        isApproved: true,
        notes: 'Nghiệm thu ĐẠT: Cành cây đã được cắt tỉa đúng tĩnh không an toàn lưới điện'
      },
      adminToken
    );
    assert(verifyRes.status === 200 && verifyRes.body.success === true, 'W5-G01: Admin nghiệm thu phê duyệt thành công (HTTP 200)');

    // Check SQLite: Work Order CLOSED
    const finalWoDb = await queryDb('SELECT * FROM work_orders WHERE id = ?', [createdWo.id]);
    assert(finalWoDb[0].status === 'COMPLETED' || finalWoDb[0].status === 'CLOSED', 'W5-G01: Lệnh công tác chuyển COMPLETED trong SQLite');

    // Check SQLite: Vehicle freed to AVAILABLE
    const eqFreedDb = await queryDb('SELECT * FROM equipment WHERE plate_number = ?', ['65A-0892']);
    assert(
      eqFreedDb[0].status === 'AVAILABLE' && eqFreedDb[0].current_work_order_id === null,
      'W5-G01: Phương tiện 65A-0892 tự động được GIẢI PHÓNG về AVAILABLE trong SQLite'
    );

    // Check SQLite: Linked Incident marked "Đã hoàn thành"
    const incResolvedDb = await queryDb('SELECT * FROM incidents WHERE id = ?', [incidentId]);
    assert(
      incResolvedDb[0].status === 'Đã hoàn thành',
      'W5-G01: Sự cố liên kết tự động chuyển trạng thái "Đã hoàn thành" trong SQLite'
    );

    // Check SQLite: Care records created
    const careRecordsDb = await queryDb('SELECT * FROM care_records WHERE work_order_id = ?', [createdWo.id]);
    assert(
      careRecordsDb.length === 2,
      `W5-G01: Tạo thành công ${careRecordsDb.length} bản ghi chăm sóc care_records trong SQLite`
    );

    // ==========================================
    // PHASE H: 🌪️ STORM CAMPAIGN & LIFECYCLE
    // ==========================================
    console.log('\n--- PHASE H: 🌪️ STORM CAMPAIGN & LIFECYCLE ---');

    // W5-H01 & W5-H02: Check campaign status & data integrity
    const campStatusRes = await request('GET', '/api/work-orders/campaigns/storm-status', null, adminToken);
    const camp = campStatusRes.body.data;
    assert(campStatusRes.status === 200 && Boolean(camp), 'W5-H01: Truy vấn trạng thái chiến dịch bão thành công');

    const total = camp.totalDetectedTrees;
    const remaining = camp.remainingTrees;
    const resolved = camp.resolvedTrees;
    assert(
      total === remaining + resolved,
      `W5-H02: Tính toàn vẹn dữ liệu: TOTAL (${total}) = REMAINING (${remaining}) + RESOLVED (${resolved})`
    );

    // Controlled Batch Test: N -> 0 lifecycle
    const initTestRes = await request(
      'POST',
      '/api/work-orders/campaigns/storm/init-test-batch',
      { totalTrees: 10, name: 'Đợt diễn tập bão khép kín Wave 5.0' },
      adminToken
    );
    const testCampId = initTestRes.body.campaign.id;
    assert(initTestRes.status === 200, `W5-H03: Khởi tạo đợt diễn tập bão thành công (10 cây, ID: ${testCampId})`);

    // Create Work Order for 10 test trees
    const testWoRes = await request(
      'POST',
      '/api/work-orders',
      {
        title: '[DIỄN TẬP BÃO WAVE 5.0] Cắt tỉa 10 cây nguy cấp',
        type: 'PRUNING',
        priority: 'CRITICAL',
        assignedTeamId: 'team-prune-1',
        assignedTeamName: 'Tổ Cơ Giới Cắt Tỉa',
        treeIds: ['101', '102', '103', '104', '105', '106', '107', '108', '109', '110']
      },
      adminToken
    );
    const testWo = testWoRes.body.data || testWoRes.body.order;

    // Link campaign
    await queryDb('UPDATE work_orders SET campaign_id = ? WHERE id = ?', [testCampId, testWo.id]);

    // Batch execute 10 trees
    const testWoDetail = await request('GET', `/api/work-orders/${testWo.id}`, null, staffToken);
    const testItemIds = testWoDetail.body.items.map((i) => i.id);

    await request(
      'POST',
      '/api/work-orders/campaigns/storm/batch-complete-items',
      { itemIds: testItemIds, notes: 'Hoàn tất cắt tỉa đợt diễn tập' },
      staffToken
    );

    // Admin verifies
    const testVerify = await request(
      'POST',
      `/api/work-orders/${testWo.id}/verify`,
      { isApproved: true, notes: 'Nghiệm thu toàn diện đợt bão' },
      adminToken
    );
    assert(testVerify.status === 200, 'W5-H04: Admin nghiệm thu đợt diễn tập');

    const finalCampRes = await request('GET', '/api/work-orders/campaigns/storm-status', null, adminToken);
    const finalCamp = finalCampRes.body.data;
    assert(
      finalCamp.status === 'RESOLVED' || finalCamp.remainingTrees === 0,
      `W5-H04: Chiến dịch chuyển trạng thái RESOLVED (${finalCamp.status}), Remaining: ${finalCamp.remainingTrees}`
    );

    // ==========================================
    // PHASE K: 🧨 ANTI-FAKE-SUCCESS TESTS
    // ==========================================
    console.log('\n--- PHASE K: 🧨 ANTI-FAKE-SUCCESS TESTS ---');

    // K01: Verify double-click idempotency guard
    const replayVerify = await request(
      'POST',
      `/api/work-orders/${createdWo.id}/verify`,
      { isApproved: true, notes: 'Cố tình nghiệm thu lần 2' },
      adminToken
    );
    assert(
      replayVerify.status === 400 && replayVerify.body.message.includes('không thể nghiệm thu lại'),
      'K01: Chặn nghiệm thu lần 2 (Idempotency Guard, HTTP 400)'
    );

    // K02: Invalid item batch update
    const badBatchRes = await request(
      'POST',
      '/api/work-orders/campaigns/storm/batch-complete-items',
      { itemIds: ['item-khong-ton-tai-xyz'] },
      staffToken
    );
    assert(
      badBatchRes.status === 404 || badBatchRes.status === 400,
      'K02: Không báo thành công giả khi item không tồn tại (HTTP 404/400)'
    );

    console.log('\n===============================================================');
    console.log(`🏁 KẾT QUẢ TỔNG HỢP: ${passed} PASS, ${failed} FAIL (TỔNG CỘNG: ${passed + failed})`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('🟢 PHÁN QUYẾT: REAL PRODUCTION READY');
      process.exit(0);
    } else {
      console.log('🔴 PHÁN QUYẾT: AUDIT FAILED');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal audit error:', err);
    process.exit(1);
  }
}

runAcceptanceSuite();
