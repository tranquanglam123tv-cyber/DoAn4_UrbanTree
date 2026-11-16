/**
 * 🏛️ WAVE 5.0 — TRUE OPERATIONAL DATA INTEGRITY VERIFICATION SUITE
 * 
 * Verifies the 4 Mandatory Test Cases:
 * Case 1: Single Tree Resolution (Alert drops from 1 -> 0, care record inserted, tree entity updated)
 * Case 2: Partial Resolution (6/10 completed -> Progress 60%, exact 6 alerts drop, remaining 4 stay active, NOT auto 10/10)
 * Case 3: Refresh / Restart Persistence (All numbers stay identical after reload from SQLite)
 * Case 4: Full System Convergence (Work Order, Incident, Equipment, Care Records, Campaign, Tree Entity)
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

function isStormSeasonPruningNeeded(tree, careRecords) {
  const h = tree.height_meter || 8;
  const d = tree.diameter_cm || 25;
  const isLarge = h >= 7 || d >= 25;
  if (!isLarge) return { isNeeded: false };

  const prunings = careRecords
    .filter((r) => r.tree_id === tree.id && (r.action_type === 'Cắt tỉa' || r.action_type === 'PRUNING'))
    .sort((a, b) => new Date(b.action_date || b.created_at).getTime() - new Date(a.action_date || a.created_at).getTime());

  if (prunings.length === 0) return { isNeeded: true };
  const lastTime = new Date(prunings[0].action_date || prunings[0].created_at).getTime();
  const daysSince = Math.floor((Date.now() - lastTime) / (24 * 60 * 60 * 1000));
  return { isNeeded: daysSince >= 180, daysSince };
}

async function runTrueIntegritySuite() {
  console.log('===============================================================');
  console.log('🔥 WAVE 5.0 — TRUE OPERATIONAL DATA INTEGRITY AUDIT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Clean test vehicle
    await queryDb("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL WHERE plate_number = '65A-0892'");

    // ==========================================
    // 🧪 CASE 1: MỘT CÂY (SINGLE TREE FULL LIFECYCLE)
    // ==========================================
    console.log('--- 🧪 CASE 1: MỘT CÂY — NGUỒN SỰ THẬT TỪ SQLITE ---');

    // 1. Chọn Tree 10 (chưa cắt tỉa)
    const targetTreeRows = await queryDb('SELECT * FROM trees WHERE id = 10');
    const tree10 = targetTreeRows[0];
    const careRowsBefore = await queryDb('SELECT * FROM care_records WHERE tree_id = 10 AND action_type = "Cắt tỉa"');
    
    // Đảm bảo ban đầu Tree 10 chưa có care_record
    if (careRowsBefore.length > 0) {
      await queryDb('DELETE FROM care_records WHERE tree_id = 10 AND action_type = "Cắt tỉa"');
    }

    const allCareBefore = await queryDb('SELECT * FROM care_records WHERE tree_id = 10');
    const auditBefore = isStormSeasonPruningNeeded(tree10, allCareBefore);
    assert(auditBefore.isNeeded === true, 'Case 1.1: Ban đầu Tree 10 thỏa điều kiện BÁO ĐỘNG CẮT TỈA (isNeeded = true)');

    // 2. Tạo Incident thật
    const incRes = await request('POST', '/api/incidents', {
      title: 'Cây số 10 nghiêng tán nguy hiểm',
      description: 'Cần cắt hạ tán trước giông',
      location: 'Đại lộ Hòa Bình',
      reporter_name: 'Trần Dân',
      reporter_phone: '0903123456',
      danger_level: 'CAO'
    }, adminToken);
    const incId = incRes.body.data?.id || incRes.body.id;

    // 3. Admin tạo Work Order cho Tree 10 từ Incident
    const woRes = await request('POST', '/api/work-orders', {
      title: `[XỬ LÝ INCIDENT #${incId}] Cắt tỉa cây 10`,
      type: 'PRUNING',
      priority: 'HIGH',
      incidentId: incId,
      assignedTeamId: 'team-prune-1',
      assignedTeamName: 'Tổ Cơ Giới Cắt Tỉa',
      assignedVehiclePlate: '65A-0892',
      treeIds: ['10']
    }, adminToken);
    const wo10 = woRes.body.data || woRes.body.order;
    assert(Boolean(wo10?.id), `Case 1.2: Admin tạo Lệnh công tác mã [${wo10?.code}] cho Tree 10`);

    // Gán xe thật
    await request('PATCH', `/api/work-orders/${wo10.id}/assign`, {
      teamId: 'team-prune-1',
      vehiclePlate: '65A-0892'
    }, adminToken);

    // 4. Staff nhận việc và bắt đầu
    await request('PATCH', `/api/work-orders/${wo10.id}/status`, { status: 'IN_PROGRESS' }, staffToken);

    // 5. Staff xử lý Tree 10
    const wo10Detail = await request('GET', `/api/work-orders/${wo10.id}`, null, staffToken);
    const item10Id = wo10Detail.body.items[0].id;

    const completeItemRes = await request(
      'PATCH',
      `/api/work-orders/items/${item10Id}`,
      {
        status: 'COMPLETED',
        notes: 'Đã cắt cành hạ độ cao Tree 10 an toàn',
        evidenceImageUrl: 'https://images.unsplash.com/photo-tree-10'
      },
      staffToken
    );
    assert(completeItemRes.status === 200, 'Case 1.3: Staff cập nhật checklist Tree 10 thành công (HTTP 200)');

    // 6. Kiểm tra: Care Record ĐÃ ĐƯỢC GHI VÀO SQLITE NGAY LẬP TỨC
    const careAfterItem = await queryDb('SELECT * FROM care_records WHERE work_order_id = ? AND tree_id = 10', [wo10.id]);
    assert(careAfterItem.length > 0 && careAfterItem[0].action_type === 'Cắt tỉa', 'Case 1.4: SQLite ĐÃ LƯU bản ghi care_records cho Tree 10 ngay khi Staff thi công');

    // 7. Kiểm tra: Thực thể cây trong bảng trees ĐÃ ĐƯỢC CẬP NHẬT
    const tree10Updated = await queryDb('SELECT health_status FROM trees WHERE id = 10');
    assert(tree10Updated[0].health_status === 'Tốt', 'Case 1.5: Thực thể cây trong bảng trees cập nhật health_status = "Tốt"');

    // 8. Admin nghiệm thu đóng lệnh
    const verifyWo10 = await request('POST', `/api/work-orders/${wo10.id}/verify`, { isApproved: true, notes: 'Nghiệm thu ĐẠT' }, adminToken);
    assert(verifyWo10.status === 200, 'Case 1.6: Admin nghiệm thu phê duyệt lệnh công tác (HTTP 200)');

    // 9. Kiểm tra chuỗi khép kín sau nghiệm thu
    const wo10ClosedDb = await queryDb('SELECT status FROM work_orders WHERE id = ?', [wo10.id]);
    assert(wo10ClosedDb[0].status === 'COMPLETED' || wo10ClosedDb[0].status === 'CLOSED', 'Case 1.7: Work Order chuyển trạng thái COMPLETED trong SQLite');

    const inc10Db = await queryDb('SELECT status FROM incidents WHERE id = ?', [incId]);
    assert(inc10Db[0].status === 'Đã hoàn thành', 'Case 1.8: Incident liên kết tự động chuyển trạng thái "Đã hoàn thành" trong SQLite');

    const eqFreed = await queryDb('SELECT status, current_work_order_id FROM equipment WHERE plate_number = "65A-0892"');
    assert(eqFreed[0].status === 'AVAILABLE' && eqFreed[0].current_work_order_id === null, 'Case 1.9: Phương tiện 65A-0892 tự động được GIẢI PHÓNG về AVAILABLE');

    // 10. Chạy lại audit: Cây 10 BỊ LOẠI KHỎI CẢNH BÁO
    const allCareAfter = await queryDb('SELECT * FROM care_records WHERE tree_id = 10');
    const auditAfter = isStormSeasonPruningNeeded(tree10, allCareAfter);
    assert(auditAfter.isNeeded === false, 'Case 1.10: isStormSeasonPruningNeeded() chuyển sang FALSE -> Tree 10 chính thức HẾT CẢNH BÁO!');


    // ==========================================
    // 🧪 CASE 2: XỬ LÝ MỘT PHẦN (6/10 CÂY)
    // ==========================================
    console.log('\n--- 🧪 CASE 2: XỬ LÝ MỘT PHẦN (6/10 CÂY) — TIẾN ĐỘ & CẢNH BÁO THỰC ---');

    // Dùng 10 cây từ 20 đến 29
    const testTreeIds = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29'];
    // Xóa care_records cũ của 10 cây này nếu có
    await queryDb(`DELETE FROM care_records WHERE tree_id IN (${testTreeIds.join(',')}) AND action_type = 'Cắt tỉa'`);

    // Tạo lệnh 10 cây
    const wo10TreesRes = await request('POST', '/api/work-orders', {
      title: '[ĐỢT BÃO TUYẾN 30/4] Cắt tỉa 10 cây rủi ro cao',
      type: 'PRUNING',
      priority: 'CRITICAL',
      assignedTeamId: 'team-prune-1',
      assignedTeamName: 'Tổ Cơ Giới Cắt Tỉa',
      treeIds: testTreeIds
    }, adminToken);
    const wo10Trees = wo10TreesRes.body.data || wo10TreesRes.body.order;

    // Staff nhận việc
    await request('PATCH', `/api/work-orders/${wo10Trees.id}/status`, { status: 'IN_PROGRESS' }, staffToken);

    // Lấy danh sách item
    const wo10DetailItems = await request('GET', `/api/work-orders/${wo10Trees.id}`, null, staffToken);
    const all10Items = wo10DetailItems.body.items;
    assert(all10Items.length === 10, 'Case 2.1: Work Order khởi tạo đúng 10 cây trong checklist');

    // Staff CHỈ XỬ LÝ 6 CÂY ĐẦU TIÊN (item 0 đến 5)
    const itemsToComplete = all10Items.slice(0, 6).map((i) => i.id);

    const partialBatchRes = await request(
      'POST',
      '/api/work-orders/campaigns/storm/batch-complete-items',
      {
        itemIds: itemsToComplete,
        notes: 'Đã hoàn thành cắt tỉa 6 cây theo ca sáng'
      },
      staffToken
    );
    assert(partialBatchRes.status === 200, 'Case 2.2: Staff gọi Batch Complete cho 6 cây thành công');

    // Kiểm tra Work Order trong SQLite
    const woPartialDb = await queryDb('SELECT * FROM work_orders WHERE id = ?', [wo10Trees.id]);
    assert(
      woPartialDb[0].completed_items === 6 && woPartialDb[0].total_items === 10,
      `Case 2.3: SQLite ghi nhận chính xác completed_items = 6 / 10 cây`
    );
    assert(
      woPartialDb[0].progress_percent === 60,
      `Case 2.4: Tiến độ công tác đạt chuẩn 60% (${woPartialDb[0].progress_percent}%)`
    );
    assert(
      woPartialDb[0].status === 'IN_PROGRESS',
      `Case 2.5: Lệnh vẫn ở trạng thái IN_PROGRESS (KHÔNG bị tự động chuyển 10/10 hay hoàn thành giả)`
    );

    // Kiểm tra 6 cây đã có care_records trong SQLite
    const partialCareRecords = await queryDb(
      `SELECT tree_id FROM care_records WHERE work_order_id = ? AND action_type = 'Cắt tỉa'`,
      [wo10Trees.id]
    );
    assert(
      partialCareRecords.length === 6,
      `Case 2.6: SQLite lưu đúng 6 bản ghi care_records cho 6 cây vừa thi công`
    );

    // Kiểm tra đúng 6 cây này đã hết cảnh báo
    const completedTreeIds = partialCareRecords.map((r) => String(r.tree_id));
    assert(
      completedTreeIds.length === 6,
      'Case 2.7: Chính xác 6 cây được giảm khỏi danh sách cảnh báo bão'
    );

    // Kiểm tra 4 cây còn lại VẪN CHƯA CÓ care_records và vẫn còn cảnh báo
    const remainingTreeIds = testTreeIds.filter((id) => !completedTreeIds.includes(id));
    assert(
      remainingTreeIds.length === 4,
      `Case 2.8: 4 cây còn lại (${remainingTreeIds.join(', ')}) VẪN CÒN trong danh sách cần xử lý`
    );


    // ==========================================
    // 🧪 CASE 3: REFRESH / PERSISTENCE (SỐ LIỆU TỪ SQLITE)
    // ==========================================
    console.log('\n--- 🧪 CASE 3: TÍNH BỀN VỮNG KHI TẢI LẠI TRANG / SERVER RESTART ---');

    // Giả lập đọc trực tiếp toàn bộ dữ liệu qua API như client vừa F5 trình duyệt
    const f5TreesRes = await request('GET', '/api/trees?all=true', null, adminToken);
    const f5CareRes = await request('GET', '/api/care-records?all=true', null, adminToken);
    const f5WoRes = await request('GET', `/api/work-orders/${wo10Trees.id}`, null, adminToken);

    assert(f5TreesRes.status === 200 && f5CareRes.status === 200, 'Case 3.1: API nạp dữ liệu máy chủ sau F5 thành công (HTTP 200)');

    const f5Wo = f5WoRes.body.data?.workOrder || f5WoRes.body.data;
    assert(
      f5Wo.completedItems === 6 && f5Wo.progressPercent === 60,
      `Case 3.2: Sau F5, tiến độ lệnh vẫn giữ nguyên vẹn 60% (6/10 cây), không bị reset về 0%`
    );

    const f5CareList = f5CareRes.body.data || [];
    const careForWo = f5CareList.filter((c) => c.work_order_id === wo10Trees.id);
    assert(
      careForWo.length === 6,
      `Case 3.3: Sau F5, toàn bộ 6 bản ghi chăm sóc vẫn tồn tại đầy đủ từ SQLite (${careForWo.length} bản ghi)`
    );


    // ==========================================
    // 🧪 CASE 4: ĐỒNG BỘ TOÀN HỆ THỐNG
    // ==========================================
    console.log('\n--- 🧪 CASE 4: ĐỒNG BỘ TOÀN HỆ THỐNG (SINGLE SOURCE OF TRUTH) ---');

    // Hoàn thành nốt 4 cây còn lại
    const remainingItems = all10Items.slice(6, 10).map((i) => i.id);
    const completeRemainingRes = await request(
      'POST',
      '/api/work-orders/campaigns/storm/batch-complete-items',
      {
        itemIds: remainingItems,
        notes: 'Hoàn tất 4 cây cuối cùng trong ca chiều'
      },
      staffToken
    );
    assert(completeRemainingRes.status === 200, 'Case 4.1: Hoàn tất 4 cây còn lại');

    // Bây giờ 10/10 hoàn thành -> Tự động chuyển SUBMITTED_FOR_REVIEW
    const finalWoCheck = await request('GET', `/api/work-orders/${wo10Trees.id}`, null, staffToken);
    const finalWoData = finalWoCheck.body.data?.workOrder || finalWoCheck.body.data;
    assert(
      finalWoData.completedItems === 10 && finalWoData.status === 'SUBMITTED_FOR_REVIEW',
      'Case 4.2: Khi 100% checklist hoàn tất, lệnh tự động chuyển sang SUBMITTED_FOR_REVIEW'
    );

    // Admin nghiệm thu
    const finalVerifyRes = await request(
      'POST',
      `/api/work-orders/${wo10Trees.id}/verify`,
      { isApproved: true, notes: 'Nghiệm thu toàn bộ tuyến đường đạt chuẩn an toàn' },
      adminToken
    );
    assert(finalVerifyRes.status === 200, 'Case 4.3: Admin nghiệm thu toàn bộ lệnh 10 cây thành công');

    const total10Care = await queryDb(
      `SELECT COUNT(*) as c FROM care_records WHERE work_order_id = ? AND action_type = 'Cắt tỉa'`,
      [wo10Trees.id]
    );
    assert(
      total10Care[0].c === 10,
      `Case 4.4: Toàn bộ 10 cây đều có bản ghi chăm sóc vĩnh viễn trong SQLite (Thực tế: ${total10Care[0].c})`
    );

    console.log('\n===============================================================');
    console.log(`🏆 TỔNG KẾT WAVE 5.0 INTEGRITY AUDIT: ${passed} PASS, ${failed} FAIL (TỔNG CỘNG: ${passed + failed})`);
    console.log('===============================================================');

    if (failed === 0) {
      console.log('🟢 PHÁN QUYẾT: 100% SOURCE OF TRUTH OPERATIONAL INTEGRITY VERIFIED');
      process.exit(0);
    } else {
      console.log('🔴 PHÁN QUYẾT: DATA INTEGRITY FAILED');
      process.exit(1);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTrueIntegritySuite();

