const { GoogleGenAI } = require('@google/genai');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const hashService = require('./hashService');
const blockchainClient = require('./blockchainClient');
const db = require('../config/db');

/**
 * 🤖 Gemini AI Engines Service
 * UrbanTree Smart Forestry System - Đồ án 4
 * Author: Tran Quang Lam (MSSV: 2311074)
 */

const API_KEY = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey: API_KEY });

// Models list in order of preference
const PRIMARY_MODELS = ['gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

/**
 * Helper gọi Gemini API với cơ chế dự phòng nhiều model
 */
async function callGemini(prompt, systemInstruction = '') {
  let lastError = null;
  for (const modelName of PRIMARY_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: systemInstruction ? { systemInstruction } : undefined
      });
      if (response && response.text) {
        return response.text;
      }
    } catch (err) {
      lastError = err;
      console.warn(`[GeminiAI] Thử nghiệm model ${modelName} thất bại:`, err.message);
    }
  }
  throw lastError || new Error('Không thể kết nối đến Google Gemini AI Service');
}

/**
 * Trích xuất JSON sạch từ phản hồi của LLM (loại bỏ markdown fence nếu có)
 */
function extractJson(rawText) {
  try {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (err) {
    // Thử regex tìm object {...}
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error(`Lỗi parse JSON từ Gemini response: ${rawText}`);
  }
}

/**
 * ==============================================================
 * ENGINE 1: TreeHealth AI (Chấm điểm sức khỏe 0-100, Grade A+ đến F)
 * ==============================================================
 */
async function analyzeTreeHealth(tree, careHistory = [], incidents = []) {
  const prompt = `
Bạn là Chuyên gia Lâm nghiệp Đô thị thông minh UrbanTree AI.
Hãy phân tích dữ liệu cây xanh sau và chấm điểm sức khỏe toàn diện:
- Mã cây: ${tree.tree_code}
- Loài cây: ${tree.species}
- Vị trí: ${tree.location_name} (${tree.address || ''})
- Ngày trồng: ${tree.planted_date}
- Chiều cao: ${tree.height_meter || 'Chưa rõ'} m
- Đường kính thân: ${tree.diameter_cm || 'Chưa rõ'} cm
- Trạng thái ghi nhận hiện tại: ${tree.health_status}
- Số lần chăm sóc gần nhất: ${careHistory.length} đợt (Gần nhất: ${careHistory[0]?.action_type || 'Chưa có'})
- Sự cố liên quan: ${incidents.length} vụ (Mức độ: ${incidents[0]?.severity || 'Không có'})

Hãy trả về DUY NHẤT một chuỗi JSON chuẩn (không giải thích thêm) theo định dạng:
{
  "score": <number từ 0 đến 100>,
  "grade": "<Xếp loại: A+ (90-100), A (80-89), B (70-79), C (50-69), D (35-49), F (0-34)>",
  "vitality_index": "<Cao | Trung bình | Yếu | Nguy kịch>",
  "canopy_assessment": "<Đánh giá tán lá>",
  "trunk_root_assessment": "<Đánh giá thân và bộ rễ>",
  "pest_disease_risk": "<Nguy cơ sâu bệnh: Thấp | Trung bình | Cao>",
  "summary": "<Tóm tắt chẩn đoán tổng quan>",
  "recommendations": [
    "<Gợi ý hành động 1>",
    "<Gợi ý hành động 2>",
    "<Gợi ý hành động 3>"
  ]
}
`;

  try {
    const rawResult = await callGemini(prompt, 'Bạn là Chuyên gia Nông nghiệp và Lâm nghiệp Đô thị AI. Luôn trả về định dạng JSON hợp lệ.');
    const parsed = extractJson(rawResult);
    return parsed;
  } catch (error) {
    console.warn('[TreeHealth AI] Dùng fallback heuristic do lỗi API:', error.message);
    // Heuristic fallback tính điểm sức khỏe
    let baseScore = 85;
    if (tree.health_status === 'Sâu bệnh') baseScore = 45;
    if (tree.health_status === 'Cần chăm sóc') baseScore = 65;
    if (tree.health_status === 'Nguy hiểm') baseScore = 25;
    if (incidents.length > 0) baseScore -= incidents.length * 10;
    baseScore = Math.max(10, Math.min(98, baseScore));

    const grade = baseScore >= 90 ? 'A+' : baseScore >= 80 ? 'A' : baseScore >= 70 ? 'B' : baseScore >= 50 ? 'C' : baseScore >= 35 ? 'D' : 'F';
    return {
      score: baseScore,
      grade,
      vitality_index: baseScore >= 80 ? 'Cao' : baseScore >= 60 ? 'Trung bình' : 'Yếu',
      canopy_assessment: 'Tán lá duy trì độ phủ tốt, cần theo dõi mùa thay lá.',
      trunk_root_assessment: 'Thân cây thẳng, bộ rễ ổn định so với kích thước vỉa hè.',
      pest_disease_risk: baseScore < 60 ? 'Cao' : 'Thấp',
      summary: `Đánh giá sơ bộ: Cây đạt mức điểm ${baseScore}/100 (Hạng ${grade}).`,
      recommendations: [
        'Tưới nước bù ẩm định kỳ 2 lần/tuần',
        'Kiểm tra định kỳ dấu hiệu nấm rễ và mối mọt',
        'Cắt tỉa nhánh cành gãy hoặc cành la sát đường'
      ]
    };
  }
}

/**
 * ==============================================================
 * ENGINE 2: ClimateMatch AI (Gợi ý Top 5 loài cây tối ưu theo khí hậu / thổ nhưỡng)
 * ==============================================================
 */
async function recommendSpeciesForClimate(context) {
  const { latitude, longitude, zone = 'TP.HCM - Đô thị nhiệt đới', soilType = 'Đất phù sa đô thị / đầm lầy san lấp', streetWidth = 'Vỉa hè 3-5m' } = context;

  const prompt = `
Bạn là Chuyên gia Quy hoạch Cảnh quan Đô thị UrbanTree AI.
Dựa vào thông số địa lý và hạ tầng sau:
- Tọa độ GPS: Vĩ độ ${latitude}, Kinh độ ${longitude}
- Vùng khí hậu: ${zone}
- Đặc tính thổ nhưỡng: ${soilType}
- Hạ tầng vỉa hè / tuyến phố: ${streetWidth}

Hãy phân tích và gợi ý Top 5 loài cây bóng mát đô thị phù hợp nhất.
Trả về DUY NHẤT một chuỗi JSON chuẩn:
{
  "location_context": "${zone} (${latitude}, ${longitude})",
  "climate_profile": "<Mô tả đặc trưng khí hậu>",
  "recommendations": [
    {
      "rank": 1,
      "species_name": "<Tên cây thông dụng>",
      "scientific_name": "<Tên khoa học>",
      "suitability_score": <Điểm từ 80-100>,
      "root_type": "<Rễ cọc sâu | Rễ chùm lan tỏa...>",
      "canopy_spread": "<Tán rộng 6-10m...>",
      "storm_resilience": "<Cao | Rất cao>",
      "urban_benefits": "<Lợi ích đô thị: bóng mát, hoa đẹp, giữ đất, lọc bụi>",
      "maintenance_cost": "<Thấp | Vừa phải | Cao>"
    }
  ],
  "planning_notes": "<Lời khuyên quy hoạch khoảng cách trồng và hệ thống thoát nước>"
}
`;

  try {
    const rawResult = await callGemini(prompt, 'Bạn là Chuyên gia Quy hoạch Cảnh quan Đô thị AI. Trả về đúng JSON.');
    const parsed = extractJson(rawResult);
    return parsed;
  } catch (error) {
    console.warn('[ClimateMatch AI] Fallback heuristic:', error.message);
    return {
      location_context: `${zone} (${latitude}, ${longitude})`,
      climate_profile: 'Khí hậu nhiệt đới gió mùa ẩm, nhiệt độ trung bình cao, mùa mưa tập trung kèm triều cường.',
      recommendations: [
        {
          rank: 1,
          species_name: 'Cây Bàng Đài Loan',
          scientific_name: 'Terminalia mantaly',
          suitability_score: 95,
          root_type: 'Rễ cọc ăn sâu, ít phá hỏng kết cấu vỉa hè lát gạch',
          canopy_spread: 'Tán phân tầng đối xứng 5-8m, tạo bóng mát thanh nhã',
          storm_resilience: 'Rất cao',
          urban_benefits: 'Lá nhỏ không gây tắc nghẽn cống thoát nước mùa mưa',
          maintenance_cost: 'Thấp'
        },
        {
          rank: 2,
          species_name: 'Cây Giáng Hương',
          scientific_name: 'Pterocarpus macrocarpus',
          suitability_score: 92,
          root_type: 'Rễ cọc vững chắc, bám sâu chống đổ ngã',
          canopy_spread: 'Tán rộng râm mát 8-12m',
          storm_resilience: 'Cao',
          urban_benefits: 'Hoa vàng thơm dịu, gỗ bền, lọc bụi mịn hiệu quả',
          maintenance_cost: 'Vừa phải'
        },
        {
          rank: 3,
          species_name: 'Cây Lim Xẹt',
          scientific_name: 'Peltophorum pterocarpum',
          suitability_score: 88,
          root_type: 'Rễ khỏe, thích nghi đất sét pha cát pha sỏi',
          canopy_spread: 'Tán mở rộng che phủ công viên',
          storm_resilience: 'Cao',
          urban_benefits: 'Hoa chùm vàng rực rỡ, khả năng chịu hạn đỉnh cao',
          maintenance_cost: 'Thấp'
        },
        {
          rank: 4,
          species_name: 'Cây Sao Đen',
          scientific_name: 'Hopea odorata',
          suitability_score: 86,
          root_type: 'Đại mộc rễ trụ cực kỳ kiên cố',
          canopy_spread: 'Tán vươn cao 15-20m',
          storm_resilience: 'Rất cao',
          urban_benefits: 'Tuổi thọ trăm năm, biểu tượng xanh của đô thị',
          maintenance_cost: 'Vừa phải'
        },
        {
          rank: 5,
          species_name: 'Cây Kèn Hồng',
          scientific_name: 'Tabebuia rosea',
          suitability_score: 84,
          root_type: 'Rễ trung bình thích hợp dải phân cách rộng',
          canopy_spread: 'Tán tròn 6-10m',
          storm_resilience: 'Khá',
          urban_benefits: 'Cảnh quan hoa hồng pastel thu hút du lịch mùa xuân',
          maintenance_cost: 'Vừa phải'
        }
      ],
      planning_notes: 'Khoảng cách khuyến nghị giữa 2 cây là 6-8m. Cần trang bị bó vỉa bê tông thông khí cho bộ rễ thở.'
    };
  }
}

/**
 * ==============================================================
 * ENGINE 3: RiskPredict AI & Blockchain Anchor Guard
 * Dự đoán nguy cơ ngã đổ mùa mưa bão & Tự động Neo chuỗi nếu Khẩn cấp
 * ==============================================================
 */
async function predictStormRisk(tree, incidents = [], weatherForecast = 'Bão gió cấp 8-10, mưa lớn kéo dài') {
  const prompt = `
Bạn là Trợ lý An toàn Công cộng Đô thị UrbanTree AI.
Hãy phân tích nguy cơ ngã đổ, gãy nhánh của cây xanh này trong điều kiện thời tiết xấu:
- Mã cây: ${tree.tree_code} | Loài: ${tree.species}
- Tọa độ: ${tree.latitude}, ${tree.longitude} | Vị trí: ${tree.location_name}
- Chiều cao: ${tree.height_meter || 5} m | Đường kính: ${tree.diameter_cm || 25} cm
- Ngày trồng: ${tree.planted_date}
- Trạng thái sức khỏe: ${tree.health_status}
- Lịch sử sự cố: ${incidents.length} vụ (Chi tiết: ${JSON.stringify(incidents.slice(0, 2))})
- Dự báo thời tiết đô thị: ${weatherForecast}

Đánh giá nguy cơ ngã đổ từ 0-100% và xếp vào 1 trong 4 cấp độ:
- "Thấp" (0-30%)
- "Trung bình" (31-60%)
- "Cao" (61-74%)
- "Khẩn cấp" (75-100%)

Trả về DUY NHẤT một chuỗi JSON chuẩn:
{
  "risk_score": <number từ 0 đến 100>,
  "risk_level": "<Thấp | Trung bình | Cao | Khẩn cấp>",
  "fall_probability": "<string phần trăm, vd: 45%>",
  "structural_weakness": "<Điểm yếu cơ học chính: Rễ nông, cành giòn, thân nghiêng, mục lõi>",
  "impact_hazard": "<Nguy cơ va chạm: Vướng đường dây điện, đè nhà dân, cản trở giao thông huyết mạch>",
  "mitigation_actions": [
    "<Biện pháp 1: Cắt tỉa hạ ngọn bớt tải trọng gió>",
    "<Biện pháp 2: Chống cọc giằng thép 4 hướng>"
  ],
  "requires_blockchain_audit": <boolean: true nếu Khẩn cấp hoặc Cao, false nếu khác>
}
`;

  let assessmentResult;
  try {
    const rawResult = await callGemini(prompt, 'Bạn là Chuyên gia Cứu hộ Đô thị và Đánh giá Rủi ro Thiên tai AI.');
    assessmentResult = extractJson(rawResult);
  } catch (error) {
    console.warn('[RiskPredict AI] Fallback heuristic:', error.message);
    let riskScore = 25;
    if (tree.health_status === 'Nguy hiểm') riskScore = 85;
    else if (tree.health_status === 'Sâu bệnh') riskScore = 65;
    else if (tree.health_status === 'Cần chăm sóc') riskScore = 45;
    if (incidents.length > 0) riskScore += 15;
    riskScore = Math.min(99, riskScore);

    const riskLevel = riskScore >= 75 ? 'Khẩn cấp' : riskScore >= 60 ? 'Cao' : riskScore >= 35 ? 'Trung bình' : 'Thấp';
    assessmentResult = {
      risk_score: riskScore,
      risk_level: riskLevel,
      fall_probability: `${riskScore}%`,
      structural_weakness: riskScore >= 70 ? 'Thân có dấu hiệu nghiêng và mục rỗng gốc do ngập úng' : 'Tán lá rậm rạp cản gió lớn',
      impact_hazard: 'Khu vực mật độ người đi lại cao, gần lưới điện trung thế 22kV',
      mitigation_actions: [
        'Cắt tỉa hạ ngọn giảm diện tích chắn gió trước bão 24h',
        'Lắp đặt gông thép chữ Y cố định thân cây',
        'Cắm biển cảnh báo người dân hạn chế đỗ xe dưới tán cây'
      ],
      requires_blockchain_audit: riskLevel === 'Khẩn cấp' || riskLevel === 'Cao'
    };
  }

  // ==============================================================
  // ⛓️ MODULE 4: BẢO CHỨNG BLOCKCHAIN TỰ ĐỘNG KHI CẢNH BÁO "KHẨN CẤP"
  // ==============================================================
  const now = new Date().toISOString();
  let anchorResult = {
    anchored: false,
    status: 'NOT_ANCHORED',
    tx_hash: null,
    data_hash: null
  };

  const isEmergency = assessmentResult.risk_level === 'Khẩn cấp' || assessmentResult.risk_score >= 75;

  if (isEmergency) {
    try {
      const auditPayload = {
        tree_id: tree.id || tree.tree_code,
        assessment_type: 'RISK',
        risk_level: assessmentResult.risk_level,
        score: assessmentResult.risk_score,
        created_at: now
      };

      const dataHash = hashService.hashAiAssessment(auditPayload);
      anchorResult.data_hash = dataHash;

      console.log(`🚨 [Gemini AI Engine 3] Phát hiện rủi ro Khẩn cấp cho cây ${tree.tree_code}! Tiến hành băm SHA-256: ${dataHash}`);

      // Thực hiện ghi lên Smart Contract
      const recordId = `AI-RISK-${tree.tree_code}-${Date.now()}`;
      const tx = await blockchainClient.anchorRecord(recordId, 'AI_ASSESSMENT', dataHash);

      anchorResult = {
        anchored: true,
        status: 'CONFIRMED',
        record_id: recordId,
        tx_hash: tx.txHash,
        data_hash: dataHash,
        block_number: tx.blockNumber
      };

      // Ghi nhận vào bảng blockchain_audits
      db.run(
        `INSERT INTO blockchain_audits (record_type, record_id, data_hash, tx_hash, block_number, contract_address, status, confirmed_at)
         VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED', CURRENT_TIMESTAMP)`,
        ['AI_ASSESSMENT', recordId, dataHash, tx.txHash, tx.blockNumber, tx.contractAddress || '']
      );
    } catch (bcError) {
      console.warn('⚠️ [Blockchain Anchor] Không thể neo on-chain (EVM node có thể chưa chạy):', bcError.message);
      anchorResult.status = 'PENDING';
      anchorResult.error = bcError.message;
    }
  }

  // Lưu lịch sử đánh giá vào SQLite
  db.run(
    `INSERT INTO ai_assessments (tree_id, assessment_type, score, grade, risk_level, summary, details, data_hash, tx_hash, anchor_status)
     VALUES (?, 'RISK', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      tree.id,
      assessmentResult.risk_score,
      null,
      assessmentResult.risk_level,
      `Dự báo nguy cơ ngã đổ: ${assessmentResult.fall_probability} (${assessmentResult.risk_level})`,
      JSON.stringify(assessmentResult),
      anchorResult.data_hash,
      anchorResult.tx_hash,
      anchorResult.status
    ]
  );

  return {
    ...assessmentResult,
    blockchain_audit: anchorResult
  };
}

/**
 * ==============================================================
 * ENGINE 4: CareAdvisor AI (Phác đồ chăm sóc 3 giai đoạn & ước tính chi phí)
 * ==============================================================
 */
async function generateCarePlan(tree, currentIssues = []) {
  const prompt = `
Bạn là Cố vấn Kỹ thuật Bảo dưỡng Cây xanh Đô thị UrbanTree AI.
Hãy lập phác đồ điều trị và chăm sóc chuyên sâu 3 giai đoạn cho cây xanh:
- Cây: ${tree.species} (Mã: ${tree.tree_code})
- Tình trạng hiện tại: ${tree.health_status}
- Chiều cao: ${tree.height_meter || 6}m | Đường kính: ${tree.diameter_cm || 30}cm
- Vấn đề gặp phải: ${currentIssues.length > 0 ? JSON.stringify(currentIssues) : 'Cần bảo dưỡng phục hồi định kỳ'}

Hãy lên kế hoạch 3 giai đoạn chi tiết và ước tính chi phí vật tư/nhân công (VND):
- Giai đoạn 1: Cấp cứu / Can thiệp tức thời (Ngày 1 - Ngày 7)
- Giai đoạn 2: Phục hồi sinh trưởng & Nuôi dưỡng bộ rễ (Tuần 2 - Tháng 3)
- Giai đoạn 3: Duy trì bền vững & Quản lý dáng tán (Tháng 4 - Tháng 12)

Trả về DUY NHẤT chuỗi JSON chuẩn:
{
  "tree_code": "${tree.tree_code}",
  "prescription_title": "<Tiêu đề phác đồ>",
  "estimated_total_cost_vnd": <Tổng chi phí số nguyên, vd: 1850000>,
  "phases": [
    {
      "phase_number": 1,
      "name": "Can thiệp cấp tốc",
      "duration": "7 ngày đầu",
      "priority": "Khẩn cấp",
      "tasks": ["Tác vụ 1", "Tác vụ 2"],
      "materials": ["Vật tư/thuốc sinh học"],
      "estimated_cost_vnd": 650000
    },
    {
      "phase_number": 2,
      "name": "Phục hồi sinh thái rễ & thân",
      "duration": "Tháng 1 - Tháng 3",
      "priority": "Cao",
      "tasks": ["Tác vụ 1", "Tác vụ 2"],
      "materials": ["Phân hữu cơ vi sinh, chế phẩm Trichoderma"],
      "estimated_cost_vnd": 800000
    },
    {
      "phase_number": 3,
      "name": "Duy trì ổn định & Cắt tỉa định kỳ",
      "duration": "Tháng 4 - Tháng 12",
      "priority": "Tiêu chuẩn",
      "tasks": ["Tác vụ 1", "Tác vụ 2"],
      "materials": ["Phân bón NPK tan chậm, sơn bảo vệ vết cắt"],
      "estimated_cost_vnd": 400000
    }
  ],
  "monitoring_guideline": "<Hướng dẫn nhân viên thực địa cách theo dõi tiến độ qua app di động>"
}
`;

  try {
    const rawResult = await callGemini(prompt, 'Bạn là Cố vấn Nông nghiệp Đô thị AI.');
    const parsed = extractJson(rawResult);
    return parsed;
  } catch (error) {
    console.warn('[CareAdvisor AI] Fallback heuristic:', error.message);
    return {
      tree_code: tree.tree_code,
      prescription_title: `Phác đồ phục hồi toàn diện cho ${tree.species}`,
      estimated_total_cost_vnd: 1550000,
      phases: [
        {
          phase_number: 1,
          name: 'Can thiệp cấp tốc & Cắt bỏ cành sâu mục',
          duration: 'Ngày 1 - Ngày 7',
          priority: 'Khẩn cấp',
          tasks: [
            'Dùng kéo cơ giới tỉa sạch nhánh khô mục, bôi vôi sát khuẩn vết cắt',
            'Sục khí quanh gốc bán kính 1m giải phóng đất nén chặt'
          ],
          materials: ['Chế phẩm sinh học kháng nấm', 'Dung dịch bôi liền sẹo cây'],
          estimated_cost_vnd: 550000
        },
        {
          phase_number: 2,
          name: 'Kích rễ phục hồi sinh khối lá',
          duration: 'Tuần 2 - Tháng 3',
          priority: 'Cao',
          tasks: [
            'Bón lót 15kg phân hữu cơ vi sinh trùn quế quanh hình chiếu tán',
            'Tưới kích rễ chuyên sâu Bio-Root 2 tuần/lần'
          ],
          materials: ['Phân trùn quế hữu cơ', 'Thuốc kích rễ sinh học Bio-Root'],
          estimated_cost_vnd: 650000
        },
        {
          phase_number: 3,
          name: 'Duy trì bền vững và bảo vệ rễ trước mùa mưa',
          duration: 'Tháng 4 - Tháng 12',
          priority: 'Tiêu chuẩn',
          tasks: [
            'Kiểm tra định kỳ độ ẩm đất và dấu hiệu mối đất',
            'Cắt tỉa tạo tán thông thoáng trước tháng 9 hàng năm'
          ],
          materials: ['Phân bón tan chậm NPK 20-20-15', 'Cọc tre/thép định vị'],
          estimated_cost_vnd: 350000
        }
      ],
      monitoring_guideline: 'Nhân viên chụp ảnh đối chiếu trước/sau qua app UrbanTree Mobile tại mỗi lần bón phân hoặc cắt tỉa.'
    };
  }
}

module.exports = {
  analyzeTreeHealth,
  recommendSpeciesForClimate,
  predictStormRisk,
  generateCarePlan
};

