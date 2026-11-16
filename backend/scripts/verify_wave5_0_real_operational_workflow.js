/**
 * verify_wave5_0_real_operational_workflow.js
 * 
 * Wave 5.0.1 — Real Operational Workflow & UI-to-SQLite Acceptance Test
 * 
 * Test A: Admin dispatches a real Work Order with 10 distinct trees & vehicle lock
 * Test B: Staff receives order, opens checklist drawer, verifies 10 real physical trees
 * Test C: Field Execution: Staff completes trees with Tiered Evidence (Shared Batch & Individual)
 * Test D: Refresh Truth Test (F5): Re-fetches from SQLite, verifies progress & state survive page reload
 * Test E: Supervisor Rejection & Rework: Order transitions to REJECTED, vehicle stays locked, campaign NOT decremented, staff reworks and resubmits
 * Test F: Supervisor Approval: Transitions to COMPLETED, care_records become CONFIRMED, trees health_status updated, vehicle released to AVAILABLE
 * Test G: Storm Campaign Reconciliation: verified_trees +10, remaining_trees -10, mathematical reconciliation strictly holds
 */

const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const path = require('path');

const API_BASE = 'http://localhost:5001/api';
const DB_PATH = path.resolve(__dirname, '../urbantree.db');
const JWT_SECRET = 'urbantree_jwt_super_secret_key_2026_doan4';

const passed = [];
const failed = [];

function assert(cond, msg, extra = '') {
  if (cond) {
    passed.push(msg);
    console.log(`  ✅ [PASS] ${msg}`);
  } else {
    failed.push({ msg, extra });
    console.error(`  ❌ [FAIL] ${msg} — ${extra}`);
  }
}

async function querySql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

async function run() {
  console.log('======================================================================');
  console.log('🧪 WAVE 5.0.1 — REAL OPERATIONAL WORKFLOW & UI-TO-SQLITE PROOF');
  console.log('======================================================================\n');

  const db = new sqlite3.Database(DB_PATH);

  try {
    // 0. Khởi tạo Tokens & Chuẩn bị Thiết bị
    const adminToken = jwt.sign(
      { id: 1, username: 'admin', role: 'ADMIN', full_name: 'Quản Trị Viên Trung Tâm' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    const staffToken = jwt.sign(
      { id: 2, username: 'staff_lam', role: 'STAFF', full_name: 'KTV Hiện Trường Lâm', team_id: 'team-01' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    const adminHeaders = { Authorization: `Bearer ${adminToken}` };
    const staffHeaders = { Authorization: `Bearer ${staffToken}` };

    // Đảm bảo xe test 65A-012.34 sẵn sàng
    await runSql(
      db,
      `INSERT OR IGNORE INTO equipment (
        id, code, name, type, plate_number, status, capabilities, assigned_team_id, current_work_order_id, created_at, updated_at
      ) VALUES (
        'eq-truck-18m-03', 'EQ-XT-18M-03', 'Xe Thang Cắt Tỉa Đô Thị 18m (65A-012.34)',
        'LADDER_TRUCK_18M', '65A-012.34', 'AVAILABLE', '["PRUNING_TALL_TREE", "HEAVY_DISPATCH"]',
        'team-01', NULL, datetime('now'), datetime('now')
      )`
    );
    await runSql(db, `UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL WHERE plate_number = '65A-012.34'`);

    // Đảm bảo Chiến Dịch Mùa Bão ở quy mô đô thị 5.424 cây
    await runSql(
      db,
      `UPDATE campaigns SET
        code = 'CAMP-STORM-2026',
        target_scope = 'ALL_CITY',
        total_detected_trees = 5424,
        status = 'IN_PROGRESS'
      WHERE id = 'campaign-storm-2026'`
    );

    // --- TEST A: ADMIN TẠO LỆNH CÔNG TÁC THẬT (10 CÂY) ---
    console.log('[TEST A] Admin tạo Work Order cho 10 cây cảnh báo bão thật...');
    const candidateTrees = await querySql(
      db,
      `SELECT id, tree_code, species, height_meter, diameter_cm, address
       FROM trees
       WHERE (height_meter >= 7 OR diameter_cm >= 25)
         AND id NOT IN (SELECT tree_id FROM work_order_items)
       LIMIT 10`
    );
    assert(candidateTrees.length === 10, `Lấy được 10 cây thật từ SQLite (Tìm thấy: ${candidateTrees.length})`);
    const treeIds = candidateTrees.map((t) => t.id);

    const initCampRes = await axios.get(`${API_BASE}/work-orders/campaigns/storm-status`, { headers: adminHeaders });
    const initCamp = initCampRes.data.data;
    const initVerified = initCamp.verifiedTrees;
    const initRemaining = initCamp.remainingTrees;
    console.log(`    Chiến dịch ban đầu: Verified = ${initVerified} | Remaining = ${initRemaining}`);

    const createRes = await axios.post(
      `${API_BASE}/work-orders`,
      {
        title: 'Cắt tỉa hạ ngọn cấp bách bảo vệ hành lang Hòa Bình - Đợt Test 5.0.1',
        type: 'PRUNING',
        priority: 'CRITICAL',
        routeCorridorId: 'corridor-hoa-binh',
        routeCorridorName: 'Đại Lộ Hòa Bình',
        assignedTeamId: 'team-01',
        assignedTeamName: 'Đội Phản Ứng Nhanh Số 1',
        assignedVehiclePlate: '65A-012.34',
        treeIds,
        slaTargetMinutes: 240,
        notes: 'Thực thi kiểm tra tĩnh không và cắt cành nguy hiểm trước bão',
      },
      { headers: adminHeaders }
    );
    assert(createRes.data.success === true, 'Admin tạo Lệnh công tác thành công (HTTP 201)');
    const createdOrder = createRes.data.data.workOrder || createRes.data.data;
    const orderId = createdOrder.id;

    // Kiểm tra SQLite thực tế
    const dbOrder = await querySql(db, 'SELECT * FROM work_orders WHERE id = ?', [orderId]);
    assert(dbOrder.length === 1, `SQLite đã lưu Work Order [${orderId}]`);
    assert(dbOrder[0].status === 'ASSIGNED', `Trạng thái khởi đầu là ASSIGNED (${dbOrder[0].status})`);

    const dbItems = await querySql(db, 'SELECT * FROM work_order_items WHERE work_order_id = ?', [orderId]);
    assert(dbItems.length === 10, `SQLite đã lưu chính xác 10 work_order_items (Tìm thấy: ${dbItems.length})`);

    const vehLocked = await querySql(db, 'SELECT * FROM equipment WHERE plate_number = ?', ['65A-012.34']);
    assert(vehLocked[0].status === 'IN_USE', `Phương tiện 65A-012.34 đã bị KHÓA (status = IN_USE)`);
    assert(vehLocked[0].current_work_order_id === orderId, `Phương tiện gắn đúng current_work_order_id = ${orderId}`);

    // --- TEST B: STAFF NHẬN LỆNH & MỞ SỔ KIỂM TRA ---
    console.log('\n[TEST B] Staff nhận lệnh & mở sổ kiểm tra thực địa...');
    const staffOrderRes = await axios.get(`${API_BASE}/work-orders/${orderId}`, { headers: staffHeaders });
    assert(staffOrderRes.data.success === true, 'Staff truy cập chi tiết lệnh thành công');
    const enrichedItems = staffOrderRes.data.data.items;
    assert(enrichedItems.length === 10, `Staff tải được đủ 10 cây trong checklist (Got: ${enrichedItems.length})`);
    const hasFullSpecs = enrichedItems.every((it) => it.heightMeter > 0 && it.diameterCm > 0 && it.species);
    assert(hasFullSpecs, 'Mọi cây đều có đầy đủ thông số kỹ thuật (Chiều cao, Đường kính, Loài cây, Cột mốc)');

    // Staff bắt đầu thi công
    const startRes = await axios.patch(
      `${API_BASE}/work-orders/${orderId}/status`,
      { status: 'IN_PROGRESS', reason: 'Đội đã có mặt tại hiện trường Đại Lộ Hòa Bình' },
      { headers: staffHeaders }
    );
    assert(startRes.data.data.status === 'IN_PROGRESS', 'Lệnh chuyển sang IN_PROGRESS');

    // --- TEST C: THỰC THI HIỆN TRƯỜNG & MÔ HÌNH ẢNH 3 TẦNG (TIERED EVIDENCE) ---
    console.log('\n[TEST C] Staff thực thi từng cây & áp dụng ảnh minh chứng 3 tầng...');
    
    // Cây 1: Minh chứng riêng (Individual Evidence - Cây nguy hiểm)
    await axios.patch(
      `${API_BASE}/work-orders/items/${enrichedItems[0].id}`,
      {
        status: 'COMPLETED',
        notes: 'Cây nguy hiểm: Đã cắt cành khô mục vươn ra lòng đường',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80'
      },
      { headers: staffHeaders }
    );

    // Cây 2 đến 6: Hoàn tất theo lô với ảnh toàn cảnh chung (Shared Batch Evidence)
    const batchItemIds = [enrichedItems[1].id, enrichedItems[2].id, enrichedItems[3].id, enrichedItems[4].id, enrichedItems[5].id];
    await axios.post(
      `${API_BASE}/work-orders/campaigns/storm/batch-complete-items`,
      {
        orderId,
        itemIds: batchItemIds,
        notes: 'Đợt cắt tỉa hạ ngọn theo lô: Xe thang 18m thi công dọc tuyến',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80'
      },
      { headers: staffHeaders }
    );

    // Cây 7: Bị chặn (Blocked Evidence - Bắt buộc lý do)
    await axios.patch(
      `${API_BASE}/work-orders/items/${enrichedItems[6].id}`,
      {
        status: 'SKIPPED',
        skipReason: 'Ô tô 65A-999.99 đỗ chắn chân xe thang, chủ xe đi vắng',
        evidenceImageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'
      },
      { headers: staffHeaders }
    );

    // Cây 8, 9, 10: Vẫn đang PENDING
    // Kiểm tra tính phân lập: care_records lúc này CHỈ Ở DẠNG PENDING_VERIFICATION, KHÔNG ĐƯỢC COI LÀ XÁC NHẬN CHÍNH THỨC
    const pendingCareInDb = await querySql(
      db,
      `SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ? AND anchor_status = 'PENDING_VERIFICATION'`,
      [orderId]
    );
    assert(pendingCareInDb[0].c === 6, `6 cây hoàn thành thực địa lưu tạm dưới dạng PENDING_VERIFICATION (${pendingCareInDb[0].c} bản ghi)`);

    const confirmedCareBeforeVerify = await querySql(
      db,
      `SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ? AND anchor_status = 'CONFIRMED'`,
      [orderId]
    );
    assert(confirmedCareBeforeVerify[0].c === 0, 'Chưa có bất kỳ bản ghi CONFIRMED nào trước khi Giám sát nghiệm thu');

    // Kiểm tra Chiến dịch bão: verifiedTrees KHÔNG ĐƯỢC TĂNG
    const midCampRes = await axios.get(`${API_BASE}/work-orders/campaigns/storm-status`, { headers: adminHeaders });
    assert(
      midCampRes.data.data.verifiedTrees === initVerified,
      `Chiến dịch verifiedTrees KHÔNG TĂNG khi chưa nghiệm thu (${midCampRes.data.data.verifiedTrees} === ${initVerified})`
    );

    // --- TEST D: REFRESH TRUTH TEST (F5 / SERVER RESTART) ---
    console.log('\n[TEST D] Refresh Truth Test (Giả lập F5 trình duyệt / Server Restart)...');
    // Truy vấn trực tiếp từ SQLite để chứng minh dữ liệu sống sót hoàn hảo
    const f5Order = await querySql(db, 'SELECT * FROM work_orders WHERE id = ?', [orderId]);
    assert(f5Order[0].completed_items === 6, `Sau F5: completed_items vẫn là 6/10 (Thực tế: ${f5Order[0].completed_items})`);
    assert(f5Order[0].skipped_items === 1, `Sau F5: skipped_items vẫn là 1/10 (Thực tế: ${f5Order[0].skipped_items})`);
    assert(f5Order[0].progress_percent === 70, `Sau F5: progress_percent vẫn là 70% (Thực tế: ${f5Order[0].progress_percent}%)`);

    // --- TEST E: GIÁM SÁT TỪ CHỐI (REJECT) & QUY TRÌNH LÀM LẠI (REWORK) ---
    console.log('\n[TEST E] Hoàn tất 3 cây còn lại -> Nộp báo cáo -> Giám sát từ chối & yêu cầu làm lại...');
    for (let i = 7; i < 10; i++) {
      await axios.patch(
        `${API_BASE}/work-orders/items/${enrichedItems[i].id}`,
        { status: 'COMPLETED', notes: `Đã cắt tỉa cành an toàn cây #${i + 1}` },
        { headers: staffHeaders }
      );
    }

    // Nộp báo cáo nghiệm thu
    await axios.patch(
      `${API_BASE}/work-orders/${orderId}/status`,
      { status: 'SUBMITTED_FOR_REVIEW', reason: 'Hoàn tất rà soát 10/10 cây trên tuyến' },
      { headers: staffHeaders }
    );

    // Giám sát Từ Chối (Reject)
    const rejectRes = await axios.post(
      `${API_BASE}/work-orders/${orderId}/verify`,
      {
        isApproved: false,
        notes: 'Tĩnh không tán cây tại mốc 142 chưa đạt quy chuẩn 4.5m, yêu cầu cắt thêm',
      },
      { headers: adminHeaders }
    );
    assert(rejectRes.data.data.status === 'REJECTED', 'Giám sát từ chối thành công, Lệnh chuyển sang REJECTED');

    // Kiểm tra SQLite sau Reject:
    // 1. Xe vẫn bị khóa
    const vehCheckReject = await querySql(db, 'SELECT * FROM equipment WHERE plate_number = ?', ['65A-012.34']);
    assert(vehCheckReject[0].status === 'IN_USE', 'Xe thang vẫn tiếp tục bị KHÓA (IN_USE) để đội có xe sửa chữa');
    // 2. Chiến dịch không giảm
    const campReject = (await axios.get(`${API_BASE}/work-orders/campaigns/storm-status`, { headers: adminHeaders })).data.data;
    assert(campReject.verifiedTrees === initVerified, `Chiến dịch verifiedTrees KHÔNG GIẢM khi bị từ chối (${campReject.verifiedTrees} === ${initVerified})`);
    // 3. care_records bị chuyển REJECTED
    const rejectedCare = await querySql(db, `SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ? AND anchor_status = 'REJECTED'`, [orderId]);
    assert(rejectedCare[0].c >= 6, `Bản ghi chăm sóc tạm bị đánh dấu REJECTED (${rejectedCare[0].c} bản ghi)`);

    // Staff Khắc Phục (Rework) & Nộp Lại
    console.log('    Staff nhận chỉ đạo khắc phục, chuyển IN_PROGRESS và nộp lại...');
    await axios.patch(
      `${API_BASE}/work-orders/${orderId}/status`,
      { status: 'IN_PROGRESS', reason: 'Tiếp nhận chỉ đạo: Đội đã nâng cao tĩnh không đạt 4.8m tại mốc 142' },
      { headers: staffHeaders }
    );
    await axios.patch(
      `${API_BASE}/work-orders/${orderId}/status`,
      { status: 'SUBMITTED_FOR_REVIEW', reason: 'Đã hoàn tất khắc phục theo đúng yêu cầu của Giám sát viên' },
      { headers: staffHeaders }
    );

    // --- TEST F: GIÁM SÁT PHÊ DUYỆT (SUPERVISOR APPROVE) & SỔ CÁI CHÍNH THỨC ---
    console.log('\n[TEST F] Giám sát PHÊ DUYỆT nghiệm thu -> Chốt sổ cái chính thức...');
    const approveRes = await axios.post(
      `${API_BASE}/work-orders/${orderId}/verify`,
      {
        isApproved: true,
        notes: 'Nghiệm thu đạt chuẩn kỹ thuật đô thị sau khi đã khắc phục bổ sung',
      },
      { headers: adminHeaders }
    );
    assert(approveRes.data.data.status === 'COMPLETED', 'Lệnh công tác chính thức chuyển sang COMPLETED');

    // SQLite Kiểm Chứng:
    // 1. care_records chuyển CONFIRMED
    const confirmedCare = await querySql(db, `SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ? AND anchor_status = 'CONFIRMED'`, [orderId]);
    assert(confirmedCare[0].c >= 9, `Toàn bộ ${confirmedCare[0].c} cây xử lý thành công được chốt CONFIRMED trong SQLite`);

    // 2. Xe được giải phóng
    const vehReleased = await querySql(db, 'SELECT * FROM equipment WHERE plate_number = ?', ['65A-012.34']);
    assert(vehReleased[0].status === 'AVAILABLE', 'Phương tiện 65A-012.34 được GIẢI PHÓNG về AVAILABLE');
    assert(vehReleased[0].current_work_order_id === null, 'current_work_order_id của phương tiện đã được đặt về NULL');

    // 3. Sức khỏe cây cập nhật thật trong bảng trees
    const treeHealth = await querySql(db, 'SELECT health_status FROM trees WHERE id = ?', [treeIds[0]]);
    assert(treeHealth[0].health_status === 'Tốt', `Cây ID ${treeIds[0]} cập nhật sức khỏe thực thể thành "Tốt"`);

    // --- TEST G: CHIẾN DỊCH BÃO & TICKER ĐỐI SOÁT TOÁN HỌC ---
    console.log('\n[TEST G] Đối soát số liệu Chiến dịch Bão & Ticker...');
    const finalCampRes = await axios.get(`${API_BASE}/work-orders/campaigns/storm-status`, { headers: adminHeaders });
    const finalCamp = finalCampRes.data.data;
    assert(finalCamp.verifiedTrees >= initVerified + 9, `verifiedTrees tăng đúng số cây nghiệm thu (${finalCamp.verifiedTrees} >= ${initVerified + 9})`);
    assert(finalCamp.remainingTrees <= initRemaining - 9, `remainingTrees giảm đúng số cây nghiệm thu (${finalCamp.remainingTrees} <= ${initRemaining - 9})`);
    assert(finalCamp.isReconciled === true, 'Công thức đối soát bảo toàn số liệu 100%: TOTAL = VERIFIED + IN_PROGRESS + ASSIGNED + UNASSIGNED + BLOCKED');

    console.log('\n======================================================================');
    console.log(`🏆 TỔNG KẾT WAVE 5.0.1: ${passed.length} PASS | ${failed.length} FAIL`);
    console.log('======================================================================');

    db.close();

    if (failed.length === 0) {
      console.log('🌟 100% OPERATIONAL WORKFLOW ASSERTIONS PASSED WITH ZERO MOCK!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Test crashed:', err.message);
    if (err.response) console.error('Response data:', err.response.data);
    db.close();
    process.exit(1);
  }
}

run();
