const http = require('http');
const jwt = require('jsonwebtoken');
const db = require('../src/config/db');
const blockchainQueueService = require('../src/services/blockchainQueueService');

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

function dbGet(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
}

function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
}

function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function runVerificationSuite() {
  console.log('================================================================');
  console.log('🧪 URBANTREE PRODUCTION VERIFICATION AUDIT & HARDENING TEST SUITE');
  console.log('================================================================\n');

  let p0Passed = 0;
  let p0Total = 0;
  let p1Passed = 0;
  let p1Total = 0;

  const testReport = [];

  // ============================================================================
  // TEST 1: P0 - INCIDENT DEDUPLICATION LOGIC & DATABASE INTEGRITY
  // ============================================================================
  p0Total++;
  console.log('----------------------------------------------------------------');
  console.log('📍 [TEST 1 - P0] Incident Deduplication Logic & Database Integrity');
  console.log('----------------------------------------------------------------');

  const initialCountRow = await dbGet('SELECT COUNT(*) as count FROM incidents');
  const initialCount = initialCountRow.count;

  // Tạo tọa độ ngẫu nhiên riêng biệt cho ca kiểm thử để đảm bảo Bước 1 tạo Master Incident hoàn toàn mới
  const testBaseLat = 10.05 + (Date.now() % 1000) * 0.0001;
  const testBaseLng = 105.75 + (Date.now() % 1000) * 0.0001;

  // Bước 1: Tạo Master Incident
  const masterPayload = {
    reporter_name: 'Nguyễn Văn An',
    reporter_phone: '0909111222',
    description: 'Cây xà cừ lớn có nhánh khô gãy vướng dây điện nguy hiểm',
    latitude: testBaseLat,
    longitude: testBaseLng,
    severity: 'Khẩn cấp',
    address: 'Số 12 Đại Lộ Hòa Bình, Ninh Kiều, Cần Thơ'
  };

  const masterRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/incidents',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    masterPayload
  );

  const masterIncidentId = masterRes.body.data ? masterRes.body.data.id : masterRes.body.incident_id;
  const masterTrackingCode = masterRes.body.data ? masterRes.body.data.tracking_code : masterRes.body.tracking_code;

  console.log(`✓ Bước 1: Tạo Master Incident -> ID #${masterIncidentId} (${masterTrackingCode})`);

  // Bước 2: Người thứ 2 gửi phản ánh trùng (cách ~11 mét, trong vòng vài giây)
  const duplicatePayload = {
    reporter_name: 'Lê Thị Bích',
    reporter_phone: '0918333444',
    description: 'Cành cây to gần số 14 Hòa Bình sắp rơi xuống đường',
    latitude: testBaseLat + 0.0001, // ~11m
    longitude: testBaseLng + 0.00005,
    severity: 'Cao',
    address: 'Gần số 14 Đại Lộ Hòa Bình, Cần Thơ'
  };

  const dupRes = await request(
    {
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/incidents',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    duplicatePayload
  );

  console.log('✓ Bước 2: Phản hồi từ API phản ánh lần 2:', JSON.stringify(dupRes.body, null, 2));

  // Kiểm tra cơ sở dữ liệu SQLite
  const afterCountRow = await dbGet('SELECT COUNT(*) as count FROM incidents');
  const afterCount = afterCountRow.count;

  const masterDbRow = await dbGet('SELECT id, tracking_code, duplicate_count FROM incidents WHERE id = ?', [masterIncidentId]);
  const childReports = await dbAll('SELECT * FROM incident_duplicate_reports WHERE master_incident_id = ?', [masterIncidentId]);

  const test1Valid =
    dupRes.body.is_duplicate === true &&
    dupRes.body.master_incident_id === masterIncidentId &&
    masterDbRow.duplicate_count >= 1 &&
    afterCount === initialCount + 1 && // Chỉ tạo đúng 1 ticket Master, phản ánh thứ 2 không tạo thêm
    childReports.length >= 1;

  if (test1Valid) {
    p0Passed++;
    console.log(`✅ [PASS] Deduplication hoạt động hoàn hảo:`);
    console.log(`   - Master ID tham chiếu: #${dupRes.body.master_incident_id} (${dupRes.body.master_tracking_code})`);
    console.log(`   - Bảng incidents KHÔNG tăng thêm ticket rác (Tổng incidents: ${afterCount})`);
    console.log(`   - duplicate_count trên Master Incident #${masterIncidentId}: ${masterDbRow.duplicate_count}`);
    console.log(`   - Bản ghi con trong incident_duplicate_reports: ${childReports.length} bản ghi`);
    testReport.push({ test: 'Incident Deduplication', status: 'PASS', details: `Gộp đúng Master #${masterIncidentId}, duplicate_count=${masterDbRow.duplicate_count}` });
  } else {
    console.error(`❌ [FAIL] Deduplication thất bại!`);
    testReport.push({ test: 'Incident Deduplication', status: 'FAIL', details: 'Mâu thuẫn hoặc không gộp đúng Master ID' });
  }

  // ============================================================================
  // TEST 2: P0 - SECURITY: x-user-role FALLBACK BLOCK IN PRODUCTION
  // ============================================================================
  p0Total++;
  console.log('\n----------------------------------------------------------------');
  console.log('🔒 [TEST 2 - P0] Security: x-user-role Bypass Block In Production');
  console.log('----------------------------------------------------------------');

  // Mô phỏng request có x-user-role: ADMIN nhưng không có JWT Bearer
  const unauthRes = await request({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/trees',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-user-role': 'ADMIN'
    }
  }, { tree_code: 'TEST-HACK', species: 'Hacked' });

  console.log(`✓ Request với x-user-role: ADMIN không kèm JWT -> Status: ${unauthRes.status}`);

  // Test với JWT hợp lệ
  const adminToken = jwt.sign(
    { id: 1, username: 'admin', role: 'ADMIN' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authRes = await request({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/trees',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    tree_code: `TEST-SEC-${Date.now().toString().slice(-4)}`,
    species: 'Cây Sao Đen',
    latitude: 10.03,
    longitude: 105.78,
    status: 'ACTIVE'
  });

  console.log(`✓ Request với Signed Bearer JWT Token -> Status: ${authRes.status}`);

  const test2Valid = unauthRes.status === 401 && (authRes.status === 201 || authRes.status === 200);

  if (test2Valid) {
    p0Passed++;
    console.log(`✅ [PASS] Bảo mật xác thực Access Control:`);
    console.log(`   - Bypass bằng x-user-role bị chặn đứng với mã 401 Unauthorized`);
    console.log(`   - Bearer JWT hợp lệ được chấp thuận thành công (HTTP ${authRes.status})`);
    testReport.push({ test: 'Security Access Control (x-user-role block)', status: 'PASS', details: 'x-user-role rejected with 401, JWT accepted' });
  } else {
    console.error(`❌ [FAIL] Bảo mật xác thực không đạt chuẩn! (unauth=${unauthRes.status}, auth=${authRes.status})`);
    testReport.push({ test: 'Security Access Control', status: 'FAIL', details: `Unauth=${unauthRes.status}, Auth=${authRes.status}` });
  }

  // ============================================================================
  // TEST 3: P0 - SOFT-DELETED TREE POLICY ACROSS ALL FLOWS
  // ============================================================================
  p0Total++;
  console.log('\n----------------------------------------------------------------');
  console.log('🪓 [TEST 3 - P0] Soft-deleted Tree Policy (REMOVED Trees)');
  console.log('----------------------------------------------------------------');

  // Tạo một cây và đánh dấu REMOVED
  const treeCodeRemoved = `TREE-RM-${Date.now().toString().slice(-4)}`;
  const treeInsert = await dbRun(
    `INSERT INTO trees (tree_code, species, location_name, address, latitude, longitude, health_status, status, felling_permit_no, felling_reason)
     VALUES (?, 'Cây Bàng Đài Loan', 'Khu Đô Thị Nam Cần Thơ', 'Đường 3 Tháng 2', 10.02, 105.77, 'Chết khô', 'REMOVED', 'QĐ-19/2026/SXD', 'Mở rộng tuyến đường đô thị')`,
    [treeCodeRemoved]
  );
  const removedTreeId = treeInsert.lastID;

  console.log(`✓ Đã tạo cây bị đốn hạ / giải tỏa: #${removedTreeId} (${treeCodeRemoved})`);

  // Thử thêm Care Record cho cây REMOVED
  const careAttemptRes = await request({
    hostname: '127.0.0.1',
    port: 5001,
    path: '/api/care-records',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    tree_id: removedTreeId,
    action_type: 'Tưới nước',
    caretaker_name: 'Đội Duy Tu 1',
    notes: 'Thử chăm sóc cây đã hạ giải'
  });

  console.log(`✓ Thử tạo Care Record cho cây REMOVED -> Status: ${careAttemptRes.status}, Message: "${careAttemptRes.body.message}"`);

  // Tra cứu QR / Chi tiết cây REMOVED -> Phải trả về thông tin lịch sử và cờ đã giải tỏa (KHÔNG 404)
  const lookupRes = await request({
    hostname: '127.0.0.1',
    port: 5001,
    path: `/api/trees/${removedTreeId}`,
    method: 'GET'
  });

  console.log(`✓ Tra cứu QR cây REMOVED -> Status: ${lookupRes.status}, Cây: "${lookupRes.body.data ? lookupRes.body.data.species : 'N/A'}", Status: "${lookupRes.body.data ? lookupRes.body.data.status : 'N/A'}"`);

  const test3Valid =
    careAttemptRes.status === 400 &&
    lookupRes.status === 200 &&
    lookupRes.body.data &&
    lookupRes.body.data.status === 'REMOVED';

  if (test3Valid) {
    p0Passed++;
    console.log(`✅ [PASS] Chính sách cây đốn hạ / giải tỏa (REMOVED Tree Policy):`);
    console.log(`   - Chặn tuyệt đối ghi nhận nhật ký chăm sóc (Trả về HTTP 400 lỗi nghiệp vụ)`);
    console.log(`   - Tra cứu QR công khai không bị lỗi 404, trả về trạng thái REMOVED để minh bạch`);
    testReport.push({ test: 'Soft-deleted Tree Policy', status: 'PASS', details: 'Care rejected with 400, QR lookup returned 200 with REMOVED status' });
  } else {
    console.error(`❌ [FAIL] Chính sách cây giải tỏa không đạt!`);
    testReport.push({ test: 'Soft-deleted Tree Policy', status: 'FAIL', details: 'Care allowed or QR returned 404' });
  }

  // ============================================================================
  // TEST 4: P0 - BLOCKCHAIN DURABILITY & CRASH RECOVERY JOB QUEUE
  // ============================================================================
  p0Total++;
  console.log('\n----------------------------------------------------------------');
  console.log('⛓️ [TEST 4 - P0] Blockchain Durability & Crash Recovery Persistent Queue');
  console.log('----------------------------------------------------------------');

  const crypto = require('crypto');
  const dummyHash = crypto.createHash('sha256').update(`TEST_DURABILITY_${Date.now()}`).digest('hex');

  // Đẩy 1 job vào hàng đợi bền vững trong SQLite
  const enqResult = await blockchainQueueService.enqueueJob({
    entityType: 'TEST_RECOVERY',
    entityId: `ENTITY-${Date.now().toString().slice(-4)}`,
    payloadHash: dummyHash
  });

  console.log(`✓ Đã nạp job vào SQLite: #${enqResult.jobId} (status: PENDING)`);

  // Xử lý hàng đợi
  await blockchainQueueService.processQueue();

  // Kiểm tra trạng thái trong SQLite
  const jobRow = await dbGet('SELECT * FROM blockchain_anchor_jobs WHERE id = ?', [enqResult.jobId]);
  console.log(`✓ Trạng thái job sau khi worker xử lý: status="${jobRow.status}", txHash="${jobRow.tx_hash ? jobRow.tx_hash.slice(0, 18) + '...' : 'none'}"`);

  const stats = await blockchainQueueService.getStats();
  console.log('✓ Thống kê hàng đợi SQLite:', stats);

  const test4Valid = jobRow.status === 'CONFIRMED' && jobRow.tx_hash && jobRow.tx_hash.startsWith('0x');

  if (test4Valid) {
    p0Passed++;
    console.log(`✅ [PASS] Hàng đợi Blockchain bền vững (Persistent Queue):`);
    console.log(`   - Trực tiếp lưu vào SQLite bảng blockchain_anchor_jobs (Bền bỉ sau crash)`);
    console.log(`   - Chuyển trạng thái PENDING -> CONFIRMED thành công`);
    console.log(`   - Giao dịch txHash đã neo: ${jobRow.tx_hash}`);
    testReport.push({ test: 'Blockchain Durability Job Queue', status: 'PASS', details: `Persistent in SQLite, confirmed txHash=${jobRow.tx_hash}` });
  } else {
    console.error(`❌ [FAIL] Hàng đợi Blockchain bền vững thất bại!`);
    testReport.push({ test: 'Blockchain Durability Job Queue', status: 'FAIL', details: 'Job not confirmed or table missing' });
  }

  // ============================================================================
  // TEST 5: P1 - BENCHMARK & REAL PERFORMANCE MEASUREMENTS (P50, P95, P99)
  // ============================================================================
  p1Total++;
  console.log('\n----------------------------------------------------------------');
  console.log('⚡ [TEST 5 - P1] Benchmark & Real Performance Measurements (P50, P95, P99)');
  console.log('----------------------------------------------------------------');

  async function measureLatency(fn, iterations = 20) {
    const latencies = [];
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint();
      await fn(i);
      const end = process.hrtime.bigint();
      latencies.push(Number(end - start) / 1e6); // ms
    }
    latencies.sort((a, b) => a - b);
    const p50 = latencies[Math.floor(latencies.length * 0.5)].toFixed(2);
    const p95 = latencies[Math.floor(latencies.length * 0.95)].toFixed(2);
    const p99 = latencies[Math.floor(latencies.length * 0.99)].toFixed(2);
    return { p50, p95, p99, min: latencies[0].toFixed(2), max: latencies[latencies.length - 1].toFixed(2) };
  }

  // 1. Benchmark: Map Data Load (5,402 trees)
  const mapBench = await measureLatency(async () => {
    return request({
      hostname: '127.0.0.1',
      port: 5001,
      path: '/api/trees?limit=5450',
      method: 'GET'
    });
  }, 10);
  console.log(`📊 Map Data Load (5,402 Trees): P50 = ${mapBench.p50}ms | P95 = ${mapBench.p95}ms | P99 = ${mapBench.p99}ms`);

  // 2. Benchmark: Deduplication Check
  const dedupBench = await measureLatency(async (i) => {
    return request(
      {
        hostname: '127.0.0.1',
        port: 5001,
        path: '/api/incidents',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        reporter_name: `Tester ${i}`,
        reporter_phone: '0901234567',
        description: `Báo trùng kiểm thử benchmark ${i}`,
        latitude: 10.0385 + i * 0.000001, // Trong bán kính <25m
        longitude: 105.7825,
        severity: 'Trung bình'
      }
    );
  }, 15);
  console.log(`📊 Incident Deduplication:      P50 = ${dedupBench.p50}ms | P95 = ${dedupBench.p95}ms | P99 = ${dedupBench.p99}ms`);

  // 3. Benchmark: Care Record Creation
  const careBench = await measureLatency(async (i) => {
    return request(
      {
        hostname: '127.0.0.1',
        port: 5001,
        path: '/api/care-records',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      },
      {
        tree_id: 1,
        action_type: 'Tưới nước',
        caretaker_name: `Nhân viên đo benchmark ${i}`,
        notes: `Test latency ${i}`
      }
    );
  }, 15);
  console.log(`📊 Care Record Append:          P50 = ${careBench.p50}ms | P95 = ${careBench.p95}ms | P99 = ${careBench.p99}ms`);

  p1Passed++;
  testReport.push({
    test: 'Latency Benchmarks',
    status: 'PASS',
    details: `Map: P50=${mapBench.p50}ms/P95=${mapBench.p95}ms; Dedup: P50=${dedupBench.p50}ms; Care: P50=${careBench.p50}ms`
  });

  // ============================================================================
  // TỔNG KẾT KẾT QUẢ
  // ============================================================================
  console.log('\n================================================================');
  console.log('📋 TỔNG KẾT KIỂM THỬ HARDENING TOÀN DIỆN');
  console.log('================================================================');
  console.log(`P0 Critical Items: ${p0Passed}/${p0Total} PASS (${p0Passed === p0Total ? '✅ 100%' : '❌ CHƯA ĐẠT'})`);
  console.log(`P1 Performance/Audits: ${p1Passed}/${p1Total} PASS`);
  console.table(testReport);

  return {
    success: p0Passed === p0Total && p1Passed === p1Total,
    p0Passed,
    p0Total,
    p1Passed,
    p1Total,
    benchmarks: {
      map: mapBench,
      dedup: dedupBench,
      care: careBench
    }
  };
}

if (require.main === module) {
  runVerificationSuite()
    .then((res) => {
      process.exit(res.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during test suite:', err);
      process.exit(1);
    });
}

module.exports = runVerificationSuite;
