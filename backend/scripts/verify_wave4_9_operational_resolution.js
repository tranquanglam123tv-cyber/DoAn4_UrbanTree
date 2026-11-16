const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const jwt = require('../node_modules/jsonwebtoken');
const http = require('http');
const { execSync } = require('child_process');

const DB_PATH = path.join(__dirname, '../urbantree.db');
const JWT_SECRET = 'urbantree_jwt_super_secret_key_2026_doan4';
const PORT = 5001;

function makeToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

const adminToken = makeToken({ id: 1, username: 'admin', role: 'ADMIN', full_name: 'Đặng Thế Thuận' });
const staffToken = makeToken({ id: 2, username: 'staff_lam', role: 'STAFF', full_name: 'Nguyễn Văn Lâm' });

function apiRequest(method, pathUrl, data, token) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const req = http.request(
      `http://localhost:${PORT}${pathUrl}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(body);
          } catch {
            parsed = body;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function runDb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function allDb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
}

async function runAcceptanceTest() {
  console.log('======================================================================');
  console.log('🚀 URBANTREE — WAVE 4.9 ACCEPTANCE TEST: OPERATIONAL RESOLUTION ENGINE');
  console.log('   ALERT → DISPATCH → FIELD EXECUTION → VERIFICATION → RESOLUTION');
  console.log('======================================================================\n');

  const db = new sqlite3.Database(DB_PATH);
  let passedAssertions = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`  ❌ [FAIL] ${message}`);
      process.exit(1);
    }
    console.log(`  ✅ [PASS] ${message}`);
    passedAssertions++;
  }

  try {
    // -----------------------------------------------------------------
    // STEP 1: Khởi tạo đợt kiểm chứng có kiểm soát N = 5 cây cảnh báo
    // -----------------------------------------------------------------
    console.log('--- STEP 1: Khởi tạo Chiến Dịch Thử Nghiệm Kiểm Soát (N = 5 cây) ---');
    const initRes = await apiRequest('POST', '/api/work-orders/campaigns/storm/init-test-batch', { totalTrees: 5 }, adminToken);
    assert(initRes.status === 200, `Init test batch trả về 200 OK (Status: ${initRes.status})`);
    assert(initRes.body.success === true, 'Phản hồi init test batch thành công');
    assert(initRes.body.campaign.totalDetectedTrees === 5, 'Chiến dịch ghi nhận chính xác 5 cây cảnh báo ban đầu');

    const status1Res = await apiRequest('GET', '/api/work-orders/campaigns/storm-status', null, adminToken);
    assert(status1Res.status === 200, `Lấy trạng thái chiến dịch trả về 200 OK (Status: ${status1Res.status})`);
    assert(status1Res.body.data.totalDetectedTrees === 5, 'Tổng số cây phát hiện: 5');
    assert(status1Res.body.data.remainingTrees === 5, 'Số cây còn cần xử lý (remainingTrees) ban đầu: 5');
    assert(status1Res.body.data.resolvedTrees === 0, 'Số cây đã giải quyết ban đầu: 0');

    // -----------------------------------------------------------------
    // STEP 2: Điều phối Lệnh Công Tác Cắt Tỉa cho 5 cây này
    // -----------------------------------------------------------------
    console.log('\n--- STEP 2: Dispatch Lệnh Công Tác Cắt Tỉa & Gán Xe Cho 5 Cây ---');
    // Lấy 5 cây thực tế từ SQLite
    const testTrees = await allDb(db, 'SELECT id, tree_code, species, location_name FROM trees WHERE status != "REMOVED" LIMIT 5');
    assert(testTrees.length === 5, `Lấy thành công 5 cây từ SQLite (Tìm thấy: ${testTrees.length})`);

    const orderPayload = {
      code: `WO-STORM-TEST-${Date.now().toString().slice(-4)}`,
      title: 'Cắt tỉa hạ ngọn khẩn cấp đợt kiểm chứng bão',
      description: 'Thi công cưa tỉa hạ cành nguy hiểm cho 5 cây mục tiêu kiểm thử',
      type: 'PRUNING',
      priority: 'CRITICAL',
      scopeType: 'ROUTE',
      routeId: 'corridor-hoa-binh',
      routeCorridorName: 'Đại Lộ Hòa Bình',
      assignedTeamId: 'team-1',
      assignedTeamName: 'Đội 1 Ninh Kiều',
      assignedVehiclePlate: '65A-0892',
      treeIds: testTrees.map((t) => t.id),
      items: testTrees.map((t, idx) => ({
        treeId: String(t.id),
        treeStreetCode: t.tree_code || `CT-${t.id}`,
        treeDisplayName: t.species || `Cây xanh #${t.id}`,
        houseMilestone: t.location_name || 'Vỉa hè',
        sequence: idx + 1,
      })),
    };

    const createOrderRes = await apiRequest('POST', '/api/work-orders', orderPayload, adminToken);
    assert(createOrderRes.status === 201, `Tạo lệnh công tác thành công 201 Created (Status: ${createOrderRes.status})`);
    const createdOrderId = createOrderRes.body.data.id;
    assert(!!createdOrderId, `Lệnh công tác có ID: ${createdOrderId}`);

    // Gán campaign_id cho lệnh để liên kết chính xác
    await runDb(db, 'UPDATE work_orders SET campaign_id = "campaign-storm-2026" WHERE id = ?', [createdOrderId]);

    // -----------------------------------------------------------------
    // STEP 3: Staff Nhận Việc & Bắt Đầu Thi Công (IN_PROGRESS)
    // -----------------------------------------------------------------
    console.log('\n--- STEP 3: Staff Nhận Việc & Xuất Phát Thi Công (ASSIGNED -> IN_PROGRESS) ---');
    const orderDetailRes = await apiRequest('GET', `/api/work-orders/${createdOrderId}`, null, staffToken);
    assert(orderDetailRes.status === 200, 'Staff xem chi tiết lệnh công tác 200 OK');
    assert(orderDetailRes.body.items.length === 5, `Staff thấy đủ 5 cây trong checklist (Thực tế: ${orderDetailRes.body.items.length})`);

    const startWorkRes = await apiRequest('PATCH', `/api/work-orders/${createdOrderId}/status`, {
      status: 'IN_PROGRESS',
      notes: 'Đội 1 đã tiếp nhận và xuất phát thi công cưa tỉa',
    }, staffToken);
    assert(startWorkRes.status === 200, `Chuyển lệnh sang IN_PROGRESS thành công (Status: ${startWorkRes.status})`);

    const status2Res = await apiRequest('GET', '/api/work-orders/campaigns/storm-status', null, adminToken);
    assert(status2Res.body.data.inProgressTrees === 5, `Chiến dịch ghi nhận 5 cây đang thi công (inProgressTrees: ${status2Res.body.data.inProgressTrees})`);

    // -----------------------------------------------------------------
    // STEP 4: Staff Hoàn Tất 1 Cây Ngoài Hiện Trường (Field Execution)
    // -----------------------------------------------------------------
    console.log('\n--- STEP 4: Staff Hoàn Tất 1 Cây — Kiểm Chứng Không Giảm Ảo (Single Source of Truth) ---');
    const firstItemId = orderDetailRes.body.items[0].id;
    const completeItemRes = await apiRequest('PATCH', `/api/work-orders/items/${firstItemId}`, {
      status: 'COMPLETED',
      notes: 'Đã hạ tán cành ngọn cây thứ nhất',
      evidenceImageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d',
    }, staffToken);
    assert(completeItemRes.status === 200, `Cập nhật checklist 1 cây trả về 200 OK (Status: ${completeItemRes.status})`);

    // Kiểm tra tiến độ Lệnh công tác
    const orderCheckRes = await apiRequest('GET', `/api/work-orders/${createdOrderId}`, null, staffToken);
    const woData = orderCheckRes.body.data.workOrder || orderCheckRes.body.data;
    assert(woData.completedItems === 1, 'Lệnh công tác ghi nhận 1 cây hoàn tất');
    assert(woData.progressPercent === 20, `Tiến độ lệnh tăng lên 20% (Thực tế: ${woData.progressPercent}%)`);

    // Kiểm tra tiến độ Chiến Dịch: CHƯA GIẢM TỒN VÌ CHƯA NGHIỆM THU
    const status3Res = await apiRequest('GET', '/api/work-orders/campaigns/storm-status', null, adminToken);
    assert(status3Res.body.data.fieldCompletedTrees === 1, 'Chiến dịch ghi nhận 1 cây đã xong hiện trường (fieldCompletedTrees: 1)');
    assert(status3Res.body.data.resolvedTrees === 0, 'Cây chưa nghiệm thu nên resolvedTrees vẫn là 0');
    assert(status3Res.body.data.remainingTrees === 5, 'Số cây còn cần xử lý vẫn là 5 (Chống giảm ảo khi chưa nghiệm thu)');

    // -----------------------------------------------------------------
    // STEP 5: Staff Hoàn Tất Hàng Loạt 4 Cây Còn Lại (Batch Complete)
    // -----------------------------------------------------------------
    console.log('\n--- STEP 5: Staff Hoàn Tất Hàng Loạt 4 Cây Còn Lại (Batch Complete) ---');
    const remainingItemIds = orderDetailRes.body.items.slice(1).map((i) => i.id);
    const batchRes = await apiRequest('POST', '/api/work-orders/campaigns/storm/batch-complete-items', {
      itemIds: remainingItemIds,
      notes: 'Đã cắt tỉa hạ độ cao an toàn đợt kiểm chứng',
      status: 'COMPLETED',
    }, staffToken);
    assert(batchRes.status === 200, `Batch complete trả về 200 OK (Status: ${batchRes.status})`);
    assert(batchRes.body.order.completedItems === 5, 'Toàn bộ 5/5 cây trong lệnh đã hoàn thành');
    assert(batchRes.body.order.status === 'SUBMITTED_FOR_REVIEW', 'Lệnh tự động chuyển sang SUBMITTED_FOR_REVIEW');

    // -----------------------------------------------------------------
    // STEP 6: Supervisor Nghiệm Thu ĐẠT Lệnh Công Tác
    // -----------------------------------------------------------------
    console.log('\n--- STEP 6: Giám Sát Viên Nghiệm Thu ĐẠT (Verify & Close Loop) ---');
    const verifyRes = await apiRequest('POST', `/api/work-orders/${createdOrderId}/verify`, {
      isApproved: true,
      notes: 'Nghiệm thu đạt chuẩn kỹ thuật an toàn đô thị',
    }, adminToken);
    assert(verifyRes.status === 200, `Nghiệm thu thành công 200 OK (Status: ${verifyRes.status})`);
    assert(verifyRes.body.data.status === 'COMPLETED', 'Lệnh công tác chuyển thành COMPLETED');

    // Kiểm tra xe cơ giới đã được giải phóng
    const eqRows = await allDb(db, 'SELECT status FROM equipment WHERE plate_number = "65A-0892"');
    assert(eqRows[0].status === 'AVAILABLE', 'Xe cơ giới 65A-0892 đã được giải phóng về AVAILABLE');

    // Kiểm tra care_records đã được chèn vào SQLite
    const careRows = await allDb(db, 'SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ?', [createdOrderId]);
    assert(careRows[0].c === 5, `Đã ghi nhận đủ 5 bản ghi nhật ký chăm sóc trong care_records (Thực tế: ${careRows[0].c})`);

    // -----------------------------------------------------------------
    // STEP 7: Kiểm Chứng Chiến Dịch Bão Chuyển Thành RESOLVED (remainingTrees = 0)
    // -----------------------------------------------------------------
    console.log('\n--- STEP 7: Kiểm Chứng Chiến Dịch Hoàn Thành (remainingTrees = 0 -> RESOLVED) ---');
    const finalStatusRes = await apiRequest('GET', '/api/work-orders/campaigns/storm-status', null, adminToken);
    assert(finalStatusRes.status === 200, 'Lấy trạng thái chiến dịch thành công');
    assert(finalStatusRes.body.data.resolvedTrees === 5, `Đã giải quyết 5/5 cây (resolvedTrees: ${finalStatusRes.body.data.resolvedTrees})`);
    assert(finalStatusRes.body.data.remainingTrees === 0, `Số cây còn lại chính xác bằng 0 (remainingTrees: ${finalStatusRes.body.data.remainingTrees})`);
    assert(finalStatusRes.body.data.status === 'RESOLVED', `Trạng thái chiến dịch chuyển sang RESOLVED (Thực tế: ${finalStatusRes.body.data.status})`);
    assert(!!finalStatusRes.body.data.resolvedAt, `Có mốc thời gian hoàn thành resolvedAt: ${finalStatusRes.body.data.resolvedAt}`);

    // Kiểm tra lịch sử chiến dịch
    const hist = finalStatusRes.body.data.history || [];
    const hasResolvedEvent = hist.some((h) => h.event === 'RESOLVED');
    assert(hasResolvedEvent, 'Lịch sử chiến dịch có ghi nhận sự kiện đóng chiến dịch (RESOLVED)');

    // -----------------------------------------------------------------
    // STEP 8: Khôi Phục Chiến Dịch Thành Phố & Kiểm Tra Tính Toàn Vẹn
    // -----------------------------------------------------------------
    console.log('\n--- STEP 8: Khôi Phục Chiến Dịch Thành Phố & Kiểm Tra Tính Toàn Vẹn CSDL ---');
    // Khôi phục lại chiến dịch bão toàn thành phố
    await apiRequest('POST', '/api/work-orders/campaigns/storm/init-test-batch', {
      totalTrees: 5424,
      name: 'Chiến Dịch Rà Soát & Cắt Tỉa Hạ Độ Cao Đón Mùa Bão 2026',
    }, adminToken);

    // Kiểm tra số lượng cây xanh nguyên vẹn 5.425 cây
    const treeCountRes = await allDb(db, 'SELECT COUNT(*) as count FROM trees');
    assert(treeCountRes[0].count === 5425, `Số lượng cây xanh nguyên vẹn 5.425 cây (Thực tế: ${treeCountRes[0].count})`);

    // Kiểm tra đóng băng tuyệt đối HomeLandingView.tsx
    const gitDiff = execSync('git diff src/components/HomeLandingView.tsx', { encoding: 'utf8' }).trim();
    assert(gitDiff === '', 'src/components/HomeLandingView.tsx đóng băng tuyệt đối (git diff = 0)');

    console.log('\n======================================================================');
    console.log(`🏆 TỔNG KẾT WAVE 4.9 ACCEPTANCE TEST: ${passedAssertions}/${passedAssertions} ASSERTIONS PASS (100%)`);
    console.log('   CHIẾN DỊCH BÃO ĐÃ CHỨNG MINH THỰC TẾ: 5 CÂY -> DISPATCH -> STAFF -> VERIFY -> 0 CÂY (RESOLVED)');
    console.log('======================================================================');
  } catch (err) {
    console.error('Lỗi kiểm thử Wave 4.9:', err);
    process.exit(1);
  } finally {
    db.close();
  }
}

runAcceptanceTest();
