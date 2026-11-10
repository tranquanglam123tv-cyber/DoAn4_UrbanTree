const crypto = require('crypto');

/**
 * Dịch vụ Băm Dữ liệu Chuẩn hóa (SHA-256 Hashing Service)
 * Dành cho Dự án UrbanTree - Đảm bảo tính toán đồng nhất giữa DB và Smart Contract (Zero Mismatch)
 * @author Tran Quang Lam (MSSV: 2311074)
 */

/**
 * 1. Băm Hồ sơ Cây xanh (TREE_PROFILE)
 * Cú pháp: `${tree_code}|${species}|${location_name}|${latitude}|${longitude}|${planted_date}`
 * @param {Object} tree { tree_code, species, location_name, latitude, longitude, planted_date }
 * @returns {string} Chuỗi 64 ký tự Hex chữ thường
 */
function hashTreeProfile(tree) {
    if (!tree) {
        throw new Error('hashService: Thông tin cây xanh không được để trống');
    }
    const treeCode = (tree.tree_code || '').trim();
    const species = (tree.species || '').trim();
    const locationName = (tree.location_name || '').trim();
    const latitude = Number(tree.latitude !== undefined ? tree.latitude : 0);
    const longitude = Number(tree.longitude !== undefined ? tree.longitude : 0);
    const plantedDate = (tree.planted_date || '').trim();

    if (!treeCode || !species) {
        throw new Error('hashService: Cây xanh phải có tree_code và species để tính mã băm');
    }

    const rawString = `${treeCode}|${species}|${locationName}|${latitude}|${longitude}|${plantedDate}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * 2. Băm Nhật ký Chăm sóc Thực địa (CARE_LOG)
 * Cú pháp: `${tree_id}|${caretaker_name}|${action_type}|${action_date}`
 * @param {Object} care { tree_id, caretaker_name, action_type, action_date }
 * @returns {string} Chuỗi 64 ký tự Hex chữ thường
 */
function hashCareLog(care) {
    if (!care) {
        throw new Error('hashService: Thông tin chăm sóc không được để trống');
    }
    const treeId = care.tree_id || '';
    const caretakerName = (care.caretaker_name || '').trim();
    const actionType = (care.action_type || '').trim();
    const actionDate = (care.action_date || '').trim();

    const rawString = `${treeId}|${caretakerName}|${actionType}|${actionDate}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * 3. Băm Báo cáo & Nghiệm thu Sự cố (INCIDENT_REPORT)
 * Cú pháp: `${incident_id}|${tree_id}|${severity}|${status}|${resolved_at}`
 * @param {Object} incident { id or incident_id, tree_id, severity, status, resolved_at }
 * @returns {string} Chuỗi 64 ký tự Hex chữ thường
 */
function hashIncidentReport(incident) {
    if (!incident) {
        throw new Error('hashService: Thông tin sự cố không được để trống');
    }
    const incidentId = incident.id || incident.incident_id || '';
    const treeId = incident.tree_id || '';
    const severity = (incident.severity || '').trim();
    const status = (incident.status || '').trim();
    const resolvedAt = (incident.resolved_at || '').trim();

    const rawString = `${incidentId}|${treeId}|${severity}|${status}|${resolvedAt}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * 4. Băm Đánh giá Cảnh báo Rủi ro Nguy hiểm Gemini AI (AI_ASSESSMENT)
 * Cú pháp: `${tree_id}|${assessment_type}|${risk_level}|${score}|${created_at}`
 * @param {Object} assessment { tree_id, assessment_type, risk_level, score, created_at }
 * @returns {string} Chuỗi 64 ký tự Hex chữ thường
 */
function hashAiAssessment(assessment) {
    if (!assessment) {
        throw new Error('hashService: Thông tin đánh giá AI không được để trống');
    }
    const treeId = assessment.tree_id || '';
    const assessmentType = (assessment.assessment_type || 'RISK').trim();
    const riskLevel = (assessment.risk_level || '').trim();
    const score = Number(assessment.score || 0).toFixed(1);
    const createdAt = (assessment.created_at || '').trim();

    const rawString = `${treeId}|${assessmentType}|${riskLevel}|${score}|${createdAt}`;
    return crypto.createHash('sha256').update(rawString).digest('hex');
}

/**
 * Hàm băm chuỗi văn bản tự do SHA-256
 * @param {string} text
 * @returns {string} 64 ký tự Hex
 */
function hashGenericString(text) {
    return crypto.createHash('sha256').update(String(text)).digest('hex');
}

module.exports = {
    hashTreeProfile,
    hashCareLog,
    hashIncidentReport,
    hashAiAssessment,
    hashGenericString
};
