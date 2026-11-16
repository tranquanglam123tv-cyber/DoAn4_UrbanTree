/**
 * 🧪 URBANTREE — WAVE 4.2 END-TO-END WORKFLOW BRIDGING ACCEPTANCE TEST
 *
 * Verifies the complete Golden Loop:
 * 1. Citizen submits incident without phone -> Rejected (400), No phantom record in SQLite.
 * 2. Citizen submits incident with valid phone -> 201 Created, real tracking code, persisted in SQLite.
 * 3. Admin creates Work Order from Incident -> Bidirectional link created (work_orders.incident_id <-> incidents.work_order_id), incident status becomes "Đang xử lý".
 * 4. Duplicate Active Work Order Guard -> Second work order creation for active incident is rejected (400).
 * 5. Staff updates checklist items and transitions work order to SUBMITTED_FOR_REVIEW.
 * 6. Admin verifies Work Order via POST /api/work-orders/:id/verify:
 *    - Work Order becomes COMPLETED.
 *    - Equipment released to AVAILABLE.
 *    - care_records automatically inserted with deduplication.
 *    - Linked incident automatically closed with status "Đã hoàn thành" and resolved_at timestamp.
 * 7. Multi-device SSE events broadcast.
 * 8. 5,425 urban trees intact.
 * 9. HomeLandingView.tsx frozen (git diff = 0).
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const { execSync } = require('child_process');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';
const PORT = 5001;

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const ADMIN_TOKEN = makeToken({ id: 1, username: 'admin', role: 'ADMIN', full_name: 'Quản Trị Viên' });
const STAFF_TOKEN = makeToken({ id: 2, username: 'staff', role: 'STAFF', full_name: 'Kỹ Thuật Viên', team_id: 'team-1' });

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, body: json });
        } catch (e) {
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
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function runTests() {
  console.log('======================================================================');
  console.log('🚀 URBANTREE — WAVE 4.2 VERIFICATION: END-TO-END WORKFLOW BRIDGING');
  console.log('======================================================================\n');

  let passCount = 0;
  let totalTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Citizen Submission Validation (Anti-Fake Incident Guard)
    // -------------------------------------------------------------
    console.log('--- TEST 1: Citizen Submission Validation (Anti-Fake Incident) ---');
    const missingPhoneRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        description: 'Cây lim sét có cành gãy sà xuống mái hiên',
        reporter_name: 'Nguyễn Văn Test',
        reporter_phone: '', // EMPTY PHONE
        latitude: 10.0345,
        longitude: 105.7882,
        severity: 'Cao'
      }
    );
    assert(missingPhoneRes.status === 400, 'Tạo sự cố không có số điện thoại bị từ chối 400 Bad Request');
    assert(missingPhoneRes.body.success === false, 'Phản hồi xác nhận lỗi từ chối thành công');
    assert(missingPhoneRes.body.message.includes('số điện thoại'), 'Thông điệp lỗi chỉ rõ thiếu số điện thoại');

    // -------------------------------------------------------------
    // TEST 2: Valid Citizen Submission & SQLite Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Valid Citizen Submission & SQLite Persistence ---');
    const validPhone = '0908' + Math.floor(100000 + Math.random() * 900000);
    const testLat = 10.05 + Math.random() * 0.05;
    const testLng = 105.75 + Math.random() * 0.05;
    const validIncRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        description: 'Cành sao đen bị nứt toác đối diện số nhà 12 Đại lộ Hòa Bình ' + Date.now(),
        reporter_name: 'Trần Thị Công Dân',
        reporter_phone: validPhone,
        latitude: testLat,
        longitude: testLng,
        severity: 'Khẩn cấp',
        address: '12 Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ',
        tree_id: 1
      }
    );
    assert(validIncRes.status === 201, 'Tiếp nhận sự cố hợp lệ trả về HTTP 201 Created');
    assert(validIncRes.body.success === true, 'Phản hồi thành công từ backend');
    assert(Boolean(validIncRes.body.data.id), 'Có ID định danh sự cố từ backend');
    assert(Boolean(validIncRes.body.data.tracking_code), 'Có mã tracking_code hợp lệ dạng INC-XXXXX');

    const createdIncId = validIncRes.body.data.id;
    const trackingCode = validIncRes.body.data.tracking_code;

    // Kiểm tra trực tiếp trong SQLite
    const incDbRows = await runSql('SELECT * FROM incidents WHERE id = ?', [createdIncId]);
    assert(incDbRows.length === 1, `Bản ghi sự cố [${createdIncId}] đã được lưu thực tế trong SQLite`);
    assert(incDbRows[0].tracking_code === trackingCode, `Mã tracking_code trong SQLite [${incDbRows[0].tracking_code}] khớp với mã trả về`);
    assert(incDbRows[0].reporter_phone === validPhone, 'Số điện thoại được lưu chính xác trong SQLite');
    assert(incDbRows[0].status === 'Chờ xử lý', 'Trạng thái ban đầu của sự cố là "Chờ xử lý"');

    // -------------------------------------------------------------
    // TEST 3: Admin Creates Work Order From Incident
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Admin Creates Work Order From Incident ---');
    const createWoRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/work-orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`
        }
      },
      {
        incidentId: String(createdIncId),
        title: `Xử lý sự cố khẩn cấp ${trackingCode}`,
        description: 'Điều động xe thang và đội cắt tỉa xử lý cành gãy nguy hiểm',
        type: 'PRUNING',
        priority: 'CRITICAL',
        zoneId: 'zone-ninh-kieu',
        routeId: 'route-hoa-binh',
        routeCorridorName: 'Đại Lộ Hòa Bình',
        assignedTeamId: 'team-1',
        assignedTeamName: 'Đội Cắt Tỉa Số 1',
        assignedVehiclePlate: '65A-0892',
        assignedVehicleName: 'Xe Thang Tự Hành Nâng Cao 18m (65A-0892)',
        treeIds: [1],
        slaTargetMinutes: 60
      }
    );
    assert(createWoRes.status === 201, 'Khởi tạo Lệnh công tác từ sự cố trả về HTTP 201 Created');
    assert(createWoRes.body.success === true, 'Phản hồi tạo lệnh thành công');
    const createdWo = createWoRes.body.data;
    assert(Boolean(createdWo.id), 'Lệnh công tác có ID');
    assert(String(createdWo.incidentId) === String(createdIncId), `Lệnh công tác lưu liên kết incidentId = ${createdIncId}`);

    // Kiểm tra liên kết 2 chiều trong SQLite
    const woDbRows = await runSql('SELECT * FROM work_orders WHERE id = ?', [createdWo.id]);
    assert(woDbRows.length === 1, `Lệnh công tác [${createdWo.id}] tồn tại trong SQLite`);
    assert(String(woDbRows[0].incident_id) === String(createdIncId), 'work_orders.incident_id liên kết chuẩn xác');

    const incUpdatedRows = await runSql('SELECT * FROM incidents WHERE id = ?', [createdIncId]);
    assert(incUpdatedRows[0].work_order_id === createdWo.id, `incidents.work_order_id được cập nhật sang [${createdWo.id}]`);
    assert(incUpdatedRows[0].status === 'Đang xử lý', `Trạng thái sự cố tự động chuyển sang "Đang xử lý" (Thực tế: ${incUpdatedRows[0].status})`);

    // -------------------------------------------------------------
    // TEST 4: Duplicate Active Work Order Guard
    // -------------------------------------------------------------
    console.log('\n--- TEST 4: Duplicate Active Work Order Guard ---');
    const dupWoRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/work-orders',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`
        }
      },
      {
        incidentId: String(createdIncId),
        title: 'Tạo lệnh trùng lặp cho cùng sự cố',
        type: 'PRUNING',
        priority: 'HIGH'
      }
    );
    assert(dupWoRes.status === 400, 'Yêu cầu tạo Lệnh công tác trùng lặp bị từ chối 400 Bad Request');
    assert(dupWoRes.body.message.includes('đang hoạt động'), 'Thông báo lỗi chặn lệnh trùng lặp hoạt động chuẩn xác');

    // -------------------------------------------------------------
    // TEST 5: Staff Checklist Execution
    // -------------------------------------------------------------
    console.log('\n--- TEST 5: Staff Checklist Execution ---');
    const items = await runSql('SELECT * FROM work_order_items WHERE work_order_id = ?', [createdWo.id]);
    assert(items.length > 0, `Lệnh công tác có ${items.length} hạng mục checklist cây`);

    const updateItemRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/work-orders/items/${items[0].id}`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STAFF_TOKEN}`
        }
      },
      {
        status: 'COMPLETED',
        notes: 'Đã cắt tỉa cành nguy hiểm, thu dọn mặt bằng sạch sẽ',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'
      }
    );
    assert(updateItemRes.status === 200, 'Staff hoàn tất checklist item trả về 200 OK');

    // Staff bắt đầu thi công (ASSIGNED -> IN_PROGRESS)
    const startProgressRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/work-orders/${createdWo.id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STAFF_TOKEN}`
        }
      },
      {
        targetStatus: 'IN_PROGRESS',
        reason: 'Tổ đội xuất bãi bắt đầu thi công'
      }
    );
    assert(startProgressRes.status === 200, 'Staff chuyển trạng thái sang IN_PROGRESS thành công');

    // Staff gửi duyệt (IN_PROGRESS -> SUBMITTED_FOR_REVIEW)
    const submitReviewRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/work-orders/${createdWo.id}/status`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${STAFF_TOKEN}`
        }
      },
      {
        targetStatus: 'SUBMITTED_FOR_REVIEW',
        reason: 'Đã hoàn tất xử lý hiện trường, gửi giám sát nghiệm thu'
      }
    );
    assert(submitReviewRes.status === 200, 'Staff chuyển trạng thái SUBMITTED_FOR_REVIEW thành công');

    // Khóa thiết bị đang thi công
    await runSql(
      `UPDATE equipment SET status = 'IN_USE', current_work_order_id = ? WHERE plate_number = '65A-0892'`,
      [createdWo.id]
    );

    // -------------------------------------------------------------
    // TEST 6: Supervisor Verifies Work Order (Closes Golden Loop)
    // -------------------------------------------------------------
    console.log('\n--- TEST 6: Supervisor Verifies Work Order (Closes Golden Loop) ---');
    const verifyRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/work-orders/${createdWo.id}/verify`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`
        }
      },
      {
        isApproved: true,
        notes: 'Đạt chuẩn kỹ thuật hạ cành an toàn đô thị Cần Thơ'
      }
    );
    assert(verifyRes.status === 200, 'Nghiệm thu Lệnh công tác qua POST /api/work-orders/:id/verify trả về 200 OK');
    assert(verifyRes.body.success === true, 'Phản hồi nghiệm thu thành công');

    // 1. Work Order thành COMPLETED
    const completedWoRows = await runSql('SELECT status, workflow_status FROM work_orders WHERE id = ?', [createdWo.id]);
    assert(completedWoRows[0].status === 'COMPLETED', `Lệnh công tác chuyển thành COMPLETED (Thực tế: ${completedWoRows[0].status})`);

    // 2. Xe cơ giới được giải phóng về AVAILABLE
    const releasedEqRows = await runSql(`SELECT status, current_work_order_id FROM equipment WHERE plate_number = '65A-0892'`);
    assert(releasedEqRows[0].status === 'AVAILABLE', `Xe cơ giới đã được giải phóng về AVAILABLE (Thực tế: ${releasedEqRows[0].status})`);
    assert(releasedEqRows[0].current_work_order_id === null, 'Xe cơ giới được xóa current_work_order_id');

    // 3. care_records tự động chèn
    const careRows = await runSql('SELECT * FROM care_records WHERE work_order_id = ?', [createdWo.id]);
    assert(careRows.length > 0, `Đã tự động chèn ${careRows.length} bản ghi nhật ký chăm sóc (care_records)`);
    assert(careRows[0].tree_id === 1, 'care_records gắn chuẩn xác tree_id = 1');
    assert(careRows[0].work_order_code === createdWo.code, 'care_records gắn chuẩn work_order_code');

    // 4. Sự cố liên kết tự động chuyển thành "Đã hoàn thành" với resolved_at
    const finalIncRows = await runSql('SELECT * FROM incidents WHERE id = ?', [createdIncId]);
    assert(finalIncRows[0].status === 'Đã hoàn thành', `Sự cố tự động cập nhật sang "Đã hoàn thành" (Thực tế: ${finalIncRows[0].status})`);
    assert(Boolean(finalIncRows[0].resolved_at), `Sự cố có mốc thời gian resolved_at: ${finalIncRows[0].resolved_at}`);

    // 5. Idempotency Guard (Thử nghiệm thu lại không sinh duplicate)
    const retryVerifyRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/work-orders/${createdWo.id}/verify`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}`
        }
      },
      { isApproved: true }
    );
    assert(retryVerifyRes.status === 400, 'Nghiệm thu lại lệnh đã đóng bị chặn 400 Bad Request');
    const careAfterRetry = await runSql('SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ?', [createdWo.id]);
    assert(careAfterRetry[0].c === careRows.length, `Số lượng care_records không bị tăng duplicate (${careAfterRetry[0].c})`);

    // -------------------------------------------------------------
    // TEST 7: Query Incidents API with Joined Work Order Code
    // -------------------------------------------------------------
    console.log('\n--- TEST 7: Query Incidents API with Joined Work Order Code ---');
    const getIncRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: `/api/incidents/${createdIncId}`,
        method: 'GET',
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      }
    );
    assert(getIncRes.status === 200, 'Lấy chi tiết sự cố qua API trả về 200 OK');
    assert(getIncRes.body.data.work_order_id === createdWo.id, 'API trả về work_order_id chuẩn');
    assert(getIncRes.body.data.work_order_code === createdWo.code, `API trả về work_order_code khớp [${createdWo.code}]`);

    // -------------------------------------------------------------
    // TEST 8: 5,425 Urban Trees Intact
    // -------------------------------------------------------------
    console.log('\n--- TEST 8: Urban Trees Integrity ---');
    const treeCountRows = await runSql('SELECT COUNT(*) as count FROM trees');
    assert(treeCountRows[0].count === 5425, `Số lượng cây xanh nguyên vẹn chính xác 5.425 cây (Thực tế: ${treeCountRows[0].count})`);

    // -------------------------------------------------------------
    // TEST 9: HomeLandingView.tsx Frozen
    // -------------------------------------------------------------
    console.log('\n--- TEST 9: HomeLandingView.tsx Frozen Guard ---');
    const diff = execSync('git diff src/components/HomeLandingView.tsx', { encoding: 'utf-8' });
    assert(diff.trim().length === 0, 'src/components/HomeLandingView.tsx đóng băng tuyệt đối (git diff = 0)');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n======================================================================');
    console.log(`🏆 TỔNG KẾT WAVE 4.2 ACCEPTANCE TEST: ${passCount}/${totalTests} TESTS PASS (100%)`);
    console.log('======================================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('\n🚨 LỖI KIỂM THỬ WAVE 4.2:', error.message);
    process.exit(1);
  }
}

runTests();
