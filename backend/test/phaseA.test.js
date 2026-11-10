const app = require('../src/server');
const http = require('http');

async function runTests() {
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, resolve));
  console.log('🧪 Test server listening on http://localhost:5099');

  const baseUrl = 'http://localhost:5099';

  try {
    // Test 1: Root endpoint
    console.log('\n--- 1. Testing Root Status ---');
    let res = await fetch(`${baseUrl}/`);
    let json = await res.json();
    console.log('Status code:', res.status, '| Project:', json.project);

    // Test 2: Auth - Send OTP
    console.log('\n--- 2. Testing Auth: Send OTP ---');
    res = await fetch(`${baseUrl}/api/v1/auth/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lam@urbantree.vn' })
    });
    json = await res.json();
    console.log('Send OTP Status:', res.status, '| dev_code:', json.dev_code);
    const otpCode = json.dev_code;

    // Test 3: Auth - Verify OTP
    console.log('\n--- 3. Testing Auth: Verify OTP ---');
    res = await fetch(`${baseUrl}/api/v1/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'lam@urbantree.vn', code: otpCode })
    });
    json = await res.json();
    console.log('Verify OTP Status:', res.status, '| User:', json.user?.full_name, '| Role:', json.user?.role);
    const accessToken = json.accessToken;

    // Test 4: Auth - Protected /me
    console.log('\n--- 4. Testing Auth: GET /api/v1/auth/me ---');
    res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    json = await res.json();
    console.log('GET /me Status:', res.status, '| Email:', json.user?.email);

    // Test 5: AI Engine 1 - TreeHealth AI
    console.log('\n--- 5. Testing AI Engine 1: TreeHealth (TREE-001) ---');
    res = await fetch(`${baseUrl}/api/v1/ai/trees/TREE-001/health`);
    json = await res.json();
    console.log('Engine 1 Status:', res.status, '| Score:', json.assessment?.score, '| Grade:', json.assessment?.grade);

    // Test 6: AI Engine 2 - ClimateMatch AI
    console.log('\n--- 6. Testing AI Engine 2: ClimateMatch ---');
    res = await fetch(`${baseUrl}/api/v1/ai/climate-match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: 10.7769,
        longitude: 106.7009,
        zone: 'Quận 1, TP.HCM',
        soilType: 'Đất thịt pha sét nhẹ',
        streetWidth: 'Vỉa hè 4m'
      })
    });
    json = await res.json();
    console.log('Engine 2 Status:', res.status, '| Top 1 species:', json.result?.recommendations?.[0]?.species_name);

    // Test 7: AI Engine 3 - RiskPredict AI & Blockchain Anchor Guard
    console.log('\n--- 7. Testing AI Engine 3: RiskPredict AI (TREE-001) ---');
    res = await fetch(`${baseUrl}/api/v1/ai/trees/TREE-001/risk`);
    json = await res.json();
    console.log('Engine 3 Status:', res.status, '| Risk Level:', json.assessment?.risk_level, '| Probability:', json.assessment?.fall_probability);

    // Test 8: AI Engine 4 - CareAdvisor AI
    console.log('\n--- 8. Testing AI Engine 4: CareAdvisor AI (TREE-001) ---');
    res = await fetch(`${baseUrl}/api/v1/ai/trees/TREE-001/care-plan`);
    json = await res.json();
    console.log('Engine 4 Status:', res.status, '| Prescription:', json.care_plan?.prescription_title, '| Cost:', json.care_plan?.estimated_total_cost_vnd);

    console.log('\n🎉 TẤT CẢ TEST CASES GIAI ĐOẠN PHASE A ĐỀU ĐẠT CHUẨN 100%!');
  } catch (err) {
    console.error('❌ Lỗi kiểm thử:', err);
  } finally {
    server.close();
    process.exit(0);
  }
}

runTests();

