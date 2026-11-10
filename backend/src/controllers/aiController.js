const geminiAiService = require('../services/geminiAiService');
const Tree = require('../models/Tree');
const CareRecord = require('../models/CareRecord');
const Incident = require('../models/Incident');
const db = require('../config/db');

/**
 * Helper tìm cây theo ID hoặc mã tree_code (VD: 1 hoặc TREE-001)
 */
function findTree(idOrCode, callback) {
  if (typeof idOrCode === 'string' && isNaN(idOrCode)) {
    Tree.getByCode(idOrCode, callback);
  } else {
    Tree.getById(idOrCode, callback);
  }
}

// 1. ENGINE 1: TreeHealth AI (Chấm điểm sức khỏe cây từ 0-100, Grade A+ đến F)
// GET /api/v1/ai/trees/:id/health
exports.getTreeHealthAssessment = async (req, res) => {
  try {
    const treeIdOrCode = req.params.id;
    findTree(treeIdOrCode, async (err, tree) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi truy vấn cơ sở dữ liệu', error: err.message });
      }
      if (!tree) {
        return res.status(404).json({ success: false, message: `Không tìm thấy cây xanh với ID/Mã: ${treeIdOrCode}` });
      }

      // Lấy thêm lịch sử chăm sóc và sự cố gần đây của cây
      CareRecord.getAll({ tree_id: tree.id }, async (errCare, careRecords = []) => {
        Incident.getAll({ tree_id: tree.id }, async (errInc, incidents = []) => {
          try {
            const healthReport = await geminiAiService.analyzeTreeHealth(tree, careRecords, incidents);

            // Lưu kết quả đánh giá vào ai_assessments
            db.run(
              `INSERT INTO ai_assessments (tree_id, assessment_type, score, grade, summary, details)
               VALUES (?, 'HEALTH', ?, ?, ?, ?)`,
              [
                tree.id,
                healthReport.score,
                healthReport.grade,
                healthReport.summary,
                JSON.stringify(healthReport)
              ]
            );

            return res.json({
              success: true,
              engine: 'TreeHealth AI (Gemini 3.5/3.8 Flash)',
              tree: {
                id: tree.id,
                tree_code: tree.tree_code,
                species: tree.species,
                location: tree.location_name
              },
              assessment: healthReport
            });
          } catch (aiErr) {
            return res.status(500).json({
              success: false,
              message: 'Lỗi thực thi Gemini AI Engine 1',
              error: aiErr.message
            });
          }
        });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// 2. ENGINE 2: ClimateMatch AI (Phân tích tọa độ/khí hậu gợi ý Top 5 loài cây)
// POST /api/v1/ai/climate-match
exports.getClimateMatchRecommendations = async (req, res) => {
  try {
    const { latitude, longitude, zone, soilType, streetWidth } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Tọa độ latitude và longitude là bắt buộc để phân tích khí hậu thổ nhưỡng'
      });
    }

    const recommendations = await geminiAiService.recommendSpeciesForClimate({
      latitude: Number(latitude),
      longitude: Number(longitude),
      zone,
      soilType,
      streetWidth
    });

    // Lưu vào bảng ai_assessments
    db.run(
      `INSERT INTO ai_assessments (assessment_type, summary, details)
       VALUES ('CLIMATE_MATCH', ?, ?)`,
      [
        `Khuyến nghị 5 loài cây cho tọa độ (${latitude}, ${longitude})`,
        JSON.stringify(recommendations)
      ]
    );

    res.json({
      success: true,
      engine: 'ClimateMatch AI (Gemini 3.5/3.8 Flash)',
      input: { latitude, longitude, zone, soilType, streetWidth },
      result: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi thực thi Gemini AI Engine 2',
      error: error.message
    });
  }
};

// 3. ENGINE 3: RiskPredict AI & Blockchain Anchor Guard
// GET /api/v1/ai/trees/:id/risk
exports.getTreeRiskPrediction = async (req, res) => {
  try {
    const treeIdOrCode = req.params.id;
    findTree(treeIdOrCode, async (err, tree) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi cơ sở dữ liệu', error: err.message });
      }
      if (!tree) {
        return res.status(404).json({ success: false, message: `Không tìm thấy cây: ${treeIdOrCode}` });
      }

      Incident.getAll({ tree_id: tree.id }, async (errInc, incidents = []) => {
        try {
          const weatherCondition = req.query.weather || 'Mùa mưa bão nhiệt đới gió cấp 8-9';
          const riskAssessment = await geminiAiService.predictStormRisk(tree, incidents, weatherCondition);

          return res.json({
            success: true,
            engine: 'RiskPredict AI & Blockchain Anchor Guard',
            tree: {
              id: tree.id,
              tree_code: tree.tree_code,
              species: tree.species,
              location: tree.location_name
            },
            assessment: riskAssessment
          });
        } catch (aiErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi phân tích rủi ro cây ngã đổ',
            error: aiErr.message
          });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// 4. ENGINE 4: CareAdvisor AI (Phác đồ chăm sóc 3 giai đoạn & ước tính chi phí)
// GET /api/v1/ai/trees/:id/care-plan
exports.getTreeCarePlan = async (req, res) => {
  try {
    const treeIdOrCode = req.params.id;
    findTree(treeIdOrCode, async (err, tree) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi cơ sở dữ liệu', error: err.message });
      }
      if (!tree) {
        return res.status(404).json({ success: false, message: `Không tìm thấy cây: ${treeIdOrCode}` });
      }

      Incident.getAll({ tree_id: tree.id }, async (errInc, incidents = []) => {
        try {
          const carePlan = await geminiAiService.generateCarePlan(tree, incidents);

          db.run(
            `INSERT INTO ai_assessments (tree_id, assessment_type, summary, details)
             VALUES (?, 'CARE_PLAN', ?, ?)`,
            [
              tree.id,
              carePlan.prescription_title,
              JSON.stringify(carePlan)
            ]
          );

          return res.json({
            success: true,
            engine: 'CareAdvisor AI (Gemini 3.5/3.8 Flash)',
            tree: {
              id: tree.id,
              tree_code: tree.tree_code,
              species: tree.species,
              health_status: tree.health_status
            },
            care_plan: carePlan
          });
        } catch (aiErr) {
          return res.status(500).json({
            success: false,
            message: 'Lỗi sinh phác đồ điều trị',
            error: aiErr.message
          });
        }
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// 5. Lấy lịch sử đánh giá AI của một cây
// GET /api/v1/ai/trees/:id/history
exports.getTreeAiHistory = (req, res) => {
  const treeIdOrCode = req.params.id;
  findTree(treeIdOrCode, (err, tree) => {
    if (err || !tree) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy cây' });
    }
    db.all(
      `SELECT * FROM ai_assessments WHERE tree_id = ? ORDER BY created_at DESC`,
      [tree.id],
      (errHist, rows) => {
        if (errHist) {
          return res.status(500).json({ success: false, error: errHist.message });
        }
        res.json({
          success: true,
          tree_code: tree.tree_code,
          total: rows.length,
          data: rows.map(r => ({
            ...r,
            details: r.details ? JSON.parse(r.details) : null
          }))
        });
      }
    );
  });
};
