const db = require('../config/db');
const sseService = require('../services/sseService');
const notificationService = require('../services/notificationService');

// State Machine ma trận chuyển trạng thái hợp lệ (đồng bộ 100% với operationsEngine.ts)
const VALID_TRANSITIONS = {
  DRAFT: ['PLANNED', 'ASSIGNED', 'CANCELLED'],
  PLANNED: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['ACCEPTED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'COMPLETED', 'CANCELLED'],
  ACCEPTED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['SUBMITTED_FOR_REVIEW', 'COMPLETED', 'ON_HOLD', 'CANCELLED'],
  ON_HOLD: ['IN_PROGRESS', 'CANCELLED'],
  SUBMITTED_FOR_REVIEW: ['VERIFIED', 'COMPLETED', 'REJECTED'],
  REJECTED: ['IN_PROGRESS', 'ASSIGNED', 'SUBMITTED_FOR_REVIEW', 'COMPLETED', 'CANCELLED'],
  VERIFIED: ['COMPLETED', 'CLOSED'],
  COMPLETED: ['CLOSED'],
  CLOSED: [],
  CANCELLED: []
};

function canTransition(currentStatus, targetStatus) {
  if (currentStatus === targetStatus) return true;
  return VALID_TRANSITIONS[currentStatus]?.includes(targetStatus) || false;
}

// Helper ánh xạ SQLite row (snake_case) sang API model (camelCase)
function mapWorkOrderFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description || '',
    type: row.type,
    priority: row.priority,
    scopeType: row.scope_type,
    zoneId: row.zone_id,
    routeId: row.route_id,
    routeCorridorName: row.route_corridor_name,
    incidentId: row.incident_id,
    status: row.status,
    workflowStatus: row.workflow_status || row.status,
    slaStatus: row.sla_status || 'ON_TRACK',
    scheduledStart: row.scheduled_start,
    scheduledEnd: row.scheduled_end,
    deadline: row.deadline,
    actualStart: row.actual_start,
    actualEnd: row.actual_end,
    holdReason: row.hold_reason,
    heldByUserId: row.held_by_user_id,
    heldAt: row.held_at,
    requiredCapabilities: row.required_capabilities ? JSON.parse(row.required_capabilities) : [],
    requiredEquipmentIds: row.required_equipment_ids ? JSON.parse(row.required_equipment_ids) : [],
    assignedTeamId: row.assigned_team_id,
    assignedTeamName: row.assigned_team_name,
    assignedVehicleName: row.assigned_vehicle_name,
    assignedVehiclePlate: row.assigned_vehicle_plate,
    totalItems: row.total_items || 0,
    completedItems: row.completed_items || 0,
    skippedItems: row.skipped_items || 0,
    failedItems: row.failed_items || 0,
    progressPercent: row.progress_percent || 0,
    supervisorUserId: row.supervisor_user_id,
    supervisorNotes: row.supervisor_notes,
    slaTargetMinutes: row.sla_target_minutes,
    isOverdue: Boolean(row.is_overdue),
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    payloadHash: row.payload_hash,
    anchorStatus: row.anchor_status || 'PENDING',
    retryCount: row.retry_count || 0,
    lastError: row.last_error,
    lastAttemptAt: row.last_attempt_at,
    nextRetryAt: row.next_retry_at,
    campaignId: row.campaign_id,
    batchIndex: row.batch_index || 1,
    totalBatches: row.total_batches || 1,
    backlogTreesCount: row.backlog_trees_count || 0,
    txHash: row.tx_hash
  };
}

function mapItemFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    treeId: row.tree_id,
    treeStreetCode: row.tree_street_code,
    treeDisplayName: row.tree_display_name || row.species || `Cây xanh #${row.tree_id}`,
    houseMilestone: row.house_milestone || row.address || row.location_name || 'Vỉa hè',
    sequence: row.sequence || 1,
    status: row.status || 'PENDING',
    result: row.result,
    reason: row.reason || row.skip_or_failure_reason,
    skipOrFailureReason: row.skip_or_failure_reason,
    completedAt: row.completed_at,
    completedBy: row.completed_by,
    completedByUserId: row.completed_by_user_id,
    evidenceBeforeImageUrl: row.evidence_before_image_url,
    evidenceAfterImageUrl: row.evidence_after_image_url,
    notes: row.notes,
    createdAt: row.created_at,
    heightMeter: row.height_meter || 8,
    diameterCm: row.diameter_cm || 25,
    healthStatus: row.health_status || 'GOOD',
    species: row.species || row.tree_display_name || 'Cây Đô Thị',
    address: row.address || row.location_name || 'Cần Thơ'
  };
}

function mapHistoryFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    workOrderId: row.work_order_id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    previousState: row.previous_state || row.previous_status,
    previousStatus: row.previous_status || row.previous_state,
    newState: row.newState || row.new_status,
    newStatus: row.new_status || row.newState,
    action: row.action,
    reason: row.reason,
    previousTeamId: row.previous_team_id,
    newTeamId: row.new_team_id,
    heldReason: row.held_reason,
    performedBy: row.performed_by,
    performedAt: row.performed_at,
    createdAt: row.created_at
  };
}

/**
 * STANDARD CITY CORRIDORS FOR STORM & SCHEDULING
 */
const CITY_CORRIDORS = [
  { id: 'route-hoa-binh', code: 'HB', name: 'Đại Lộ Hòa Bình', zoneId: 'zone-ninh-kieu', searchKeyword: 'Hòa Bình' },
  { id: 'route-30-4', code: '304', name: 'Đường 30 Tháng 4', zoneId: 'zone-ninh-kieu', searchKeyword: '30 Tháng 4' },
  { id: 'route-cmt8', code: 'CMT8', name: 'Đường Cách Mạng Tháng 8', zoneId: 'zone-binh-thuy', searchKeyword: 'Cách Mạng Tháng 8' },
  { id: 'route-vo-van-kiet', code: 'VVK', name: 'Đường Võ Văn Kiệt', zoneId: 'zone-binh-thuy', searchKeyword: 'Võ Văn Kiệt' },
  { id: 'route-3-2', code: '32', name: 'Đường 3 Tháng 2', zoneId: 'zone-ninh-kieu', searchKeyword: '3 Tháng 2' },
];

const runSql = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const allSql = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });

/**
 * Dynamic Matching Engine for Team and Equipment (No hardcoded teams[0])
 * Evaluates:
 * 1. Task required capabilities (HEAVY_PRUNING, WATERING, FERTILIZING, PEST_CONTROL, SURVEY)
 * 2. Operational Zone proximity (zone_id match)
 * 3. Workload (active_work_orders_count ASC)
 * 4. Equipment availability (status = 'AVAILABLE', capabilities match)
 */
async function findDynamicTeamAndEquipment({ taskType, requiredCapabilities = [], zoneId = null }) {
  let neededCaps = [...requiredCapabilities];
  if (neededCaps.length === 0) {
    if (taskType === 'PRUNING') neededCaps = ['HEAVY_PRUNING'];
    else if (taskType === 'WATERING') neededCaps = ['WATERING'];
    else if (taskType === 'FERTILIZATION') neededCaps = ['FERTILIZING'];
    else if (taskType === 'PEST_CONTROL') neededCaps = ['PEST_CONTROL'];
    else if (taskType === 'SURVEY') neededCaps = ['PEST_CONTROL'];
  }

  // 1. Lấy danh sách đội khả dụng
  const allTeams = await allSql(`SELECT * FROM teams WHERE status = 'AVAILABLE' OR status IS NULL`);
  let candidateTeams = allTeams.filter((t) => {
    try {
      const caps = JSON.parse(t.capabilities || '[]');
      return neededCaps.some((nc) => caps.includes(nc));
    } catch (e) {
      return false;
    }
  });

  if (candidateTeams.length === 0) {
    candidateTeams = allTeams;
  }

  // Xếp hạng: 1) Khớp khu vực (zone_id), 2) Tải công việc thấp nhất (active_work_orders_count)
  candidateTeams.sort((a, b) => {
    const aZone = zoneId && a.assigned_zone_id === zoneId ? 1 : 0;
    const bZone = zoneId && b.assigned_zone_id === zoneId ? 1 : 0;
    if (aZone !== bZone) return bZone - aZone;
    return (a.active_work_orders_count || 0) - (b.active_work_orders_count || 0);
  });

  const selectedTeam = candidateTeams[0] || null;

  // 2. Lấy phương tiện cơ giới khả dụng (status = 'AVAILABLE')
  let selectedEquipment = null;
  const availableEquipment = await allSql(`SELECT * FROM equipment WHERE status = 'AVAILABLE'`);

  if (availableEquipment.length > 0) {
    let candidateEq = availableEquipment.filter((eq) => {
      try {
        const caps = JSON.parse(eq.capabilities || '[]');
        return neededCaps.some((nc) => caps.includes(nc));
      } catch (e) {
        return false;
      }
    });

    if (candidateEq.length > 0) {
      if (selectedTeam) {
        const teamAssignedEq = candidateEq.find((eq) => eq.assigned_team_id === selectedTeam.id);
        selectedEquipment = teamAssignedEq || candidateEq[0];
      } else {
        selectedEquipment = candidateEq[0];
      }
    }
  }

  return { team: selectedTeam, equipment: selectedEquipment };
}

/**
 * 1. GET /api/work-orders
 * Lấy danh sách lệnh công tác (Role-aware filtering)
 */
exports.getAllWorkOrders = (req, res) => {
  const { status, teamId, zoneId, priority } = req.query;
  const user = req.user;

  let query = 'SELECT * FROM work_orders WHERE 1=1';
  const params = [];

  // Phân quyền theo vai trò (Role-aware)
  if (user && user.role === 'STAFF') {
    // Nếu là STAFF, chỉ xem lệnh của tổ mình (nếu có team_id trong token hoặc header) hoặc lệnh được giao
    const staffTeamId = user.team_id || teamId;
    if (staffTeamId) {
      query += ' AND (assigned_team_id = ? OR created_by_user_id = ?)';
      params.push(staffTeamId, String(user.id));
    }
  } else if (teamId) {
    query += ' AND assigned_team_id = ?';
    params.push(teamId);
  }

  if (status && status !== 'ALL') {
    query += ' AND status = ?';
    params.push(status);
  }

  if (zoneId && zoneId !== 'ALL') {
    query += ' AND zone_id = ?';
    params.push(zoneId);
  }

  if (priority && priority !== 'ALL') {
    query += ' AND priority = ?';
    params.push(priority);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Lỗi truy vấn danh sách lệnh công tác', error: err.message });
    }
    const data = (rows || []).map(mapWorkOrderFromRow);
    res.json({ success: true, count: data.length, data });
  });
};

/**
 * 2. GET /api/work-orders/:id
 * Lấy chi tiết lệnh công tác kèm checklist từng cây và lịch sử
 */
exports.getWorkOrderById = (req, res) => {
  const { id } = req.params;
  const user = req.user;

  db.get('SELECT * FROM work_orders WHERE id = ? OR code = ?', [id, id], (err, orderRow) => {
    if (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
    if (!orderRow) {
      return res.status(404).json({ success: false, message: `Không tìm thấy lệnh công tác [${id}]` });
    }

    // Kiểm tra quyền STAFF
    if (user && user.role === 'STAFF') {
      const staffTeamId = user.team_id;
      if (staffTeamId && orderRow.assigned_team_id && orderRow.assigned_team_id !== staffTeamId) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền truy cập lệnh của tổ khác' });
      }
    }

    const workOrder = mapWorkOrderFromRow(orderRow);
    const realOrderId = orderRow.id;

    // Lấy items checklist có thông tin chi tiết từ trees (chiều cao, đường kính, loài cây, địa chỉ)
    db.all(
      `SELECT woi.*, t.height_meter, t.diameter_cm, t.health_status, t.species, t.address, t.location_name
       FROM work_order_items woi
       LEFT JOIN trees t ON woi.tree_id = t.id
       WHERE woi.work_order_id = ?
       ORDER BY woi.sequence ASC`,
      [realOrderId],
      (err2, itemRows) => {
        const items = (itemRows || []).map(mapItemFromRow);

      // Lấy lịch sử audit
      db.all('SELECT * FROM work_order_history WHERE work_order_id = ? ORDER BY created_at DESC', [realOrderId], (err3, historyRows) => {
        const history = (historyRows || []).map(mapHistoryFromRow);

        res.json({
          success: true,
          data: {
            workOrder,
            items,
            history
          },
          items,
          history
        });
      });
    });
  });
};

/**
 * 3. POST /api/work-orders
 * Tạo lệnh công tác mới trong SQLite (Transaction an toàn)
 */
exports.createWorkOrder = async (req, res) => {
  const user = req.user;
  const {
    title,
    description,
    type,
    priority = 'MEDIUM',
    zoneId,
    routeId,
    routeCorridorName,
    incidentId,
    assignedTeamId,
    assignedTeamName,
    assignedVehicleName,
    assignedVehiclePlate,
    requiredCapabilities = [],
    requiredEquipmentIds = [],
    scheduledStart,
    scheduledEnd,
    slaTargetMinutes = 240,
    treeIds = []
  } = req.body;

  if (!title || !type) {
    return res.status(400).json({ success: false, message: 'Tiêu đề và loại lệnh công tác là bắt buộc' });
  }

  const now = new Date().toISOString();
  const orderId = req.body.id || `wo-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  const routePrefix = routeId ? routeId.replace('route-', '').slice(0, 3).toUpperCase() : 'CT';
  const orderCode = req.body.code || `WO-${routePrefix}-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const initialStatus = assignedTeamId ? 'ASSIGNED' : 'DRAFT';
  const actorName = (user && (user.full_name || user.username)) || 'Điều phối viên';
  const actorId = (user && user.id) ? String(user.id) : 'system';

  try {
    let linkedIncident = null;
    if (incidentId) {
      const incRows = await allSql('SELECT * FROM incidents WHERE id = ?', [incidentId]);
      if (incRows.length === 0) {
        return res.status(404).json({ success: false, message: `Không tìm thấy sự cố [${incidentId}]` });
      }
      linkedIncident = incRows[0];
      if (linkedIncident.status === 'Đã hoàn thành' || linkedIncident.status === 'Từ chối') {
        return res.status(400).json({
          success: false,
          message: `Sự cố [${incidentId}] đã ở trạng thái "${linkedIncident.status}", không thể tạo thêm lệnh công tác!`
        });
      }

      // Guard: Chặn tạo trùng lặp lệnh công tác đang hoạt động cho cùng một sự cố
      const activeOrders = await allSql(
        `SELECT id, code, status FROM work_orders WHERE incident_id = ? AND status IN ('DRAFT', 'PLANNED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'SUBMITTED_FOR_REVIEW')`,
        [String(incidentId)]
      );
      if (activeOrders.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Sự cố [${incidentId}] đã có lệnh công tác đang hoạt động [${activeOrders[0].code}] (Trạng thái: ${activeOrders[0].status})`
        });
      }
    }

    // Lấy thông tin cây nếu có items hoặc treeIds
    let items = [];
    if (Array.isArray(req.body.items) && req.body.items.length > 0) {
      items = req.body.items.map((it, index) => ({
        id: it.id || `wo-item-${orderId}-${index + 1}`,
        workOrderId: orderId,
        treeId: String(it.treeId || it.tree_id || index + 1),
        treeStreetCode: it.treeStreetCode || it.tree_street_code || `CT-${it.treeId || index + 1}`,
        treeDisplayName: it.treeDisplayName || it.tree_display_name || `Cây xanh #${index + 1}`,
        houseMilestone: it.houseMilestone || it.house_milestone || 'Vỉa hè',
        sequence: index + 1,
        status: it.status || 'PENDING'
      }));
    } else if (treeIds && treeIds.length > 0) {
      const placeholders = treeIds.map(() => '?').join(',');
      const trees = await allSql(`SELECT id, tree_code, species, location_name FROM trees WHERE id IN (${placeholders})`, treeIds);
      items = (trees || []).map((t, index) => ({
        id: `wo-item-${orderId}-${index + 1}`,
        workOrderId: orderId,
        treeId: String(t.id),
        treeStreetCode: t.tree_code,
        treeDisplayName: t.species,
        houseMilestone: t.location_name,
        sequence: index + 1,
        status: 'PENDING'
      }));
    }

    await runSql('BEGIN TRANSACTION');

    const insertOrderSql = `
      INSERT INTO work_orders (
        id, code, title, description, type, priority, scope_type,
        zone_id, route_id, route_corridor_name, incident_id,
        status, workflow_status, sla_status,
        scheduled_start, scheduled_end,
        required_capabilities, required_equipment_ids,
        assigned_team_id, assigned_team_name, assigned_vehicle_name, assigned_vehicle_plate,
        total_items, completed_items, skipped_items, failed_items, progress_percent,
        sla_target_minutes, created_by_user_id, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, 'ON_TRACK',
        ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, 0, 0, 0, 0,
        ?, ?, ?, ?
      )
    `;

    await runSql(insertOrderSql, [
      orderId, orderCode, title, description || title, type, priority, 'ROUTE',
      zoneId || null, routeId || null, routeCorridorName || null, incidentId ? String(incidentId) : null,
      initialStatus, initialStatus,
      scheduledStart || now, scheduledEnd || null,
      JSON.stringify(requiredCapabilities), JSON.stringify(requiredEquipmentIds),
      assignedTeamId || null, assignedTeamName || null, assignedVehicleName || null, assignedVehiclePlate || null,
      items.length,
      slaTargetMinutes, actorId, now, now
    ]);

    for (const it of items) {
      await runSql(
        `INSERT INTO work_order_items (
          id, work_order_id, tree_id, tree_street_code, tree_display_name,
          house_milestone, sequence, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [it.id, it.workOrderId, it.treeId, it.treeStreetCode, it.treeDisplayName, it.houseMilestone, it.sequence, it.status, now]
      );
    }

    const historyId = `wo-hist-${Date.now()}`;
    await runSql(
      `INSERT INTO work_order_history (
        id, work_order_id, actor_user_id, actor_name,
        previous_status, new_status, action, reason, created_at
      ) VALUES (?, ?, ?, ?, 'DRAFT', ?, 'CREATE', 'Khởi tạo Lệnh công tác mới', ?)`,
      [historyId, orderId, actorId, actorName, initialStatus, now]
    );

    // Cập nhật phương tiện cơ giới & xe thang nếu được chỉ định
    if (assignedVehiclePlate) {
      await runSql(
        `UPDATE equipment SET status = 'IN_USE', current_work_order_id = ?, updated_at = ? WHERE plate_number = ?`,
        [orderId, now, assignedVehiclePlate]
      );
    }

    // Cập nhật sự cố liên kết nếu có
    if (linkedIncident) {
      await runSql(
        `UPDATE incidents SET work_order_id = ?, status = 'Đang xử lý' WHERE id = ?`,
        [orderId, linkedIncident.id]
      );

      await runSql(
        `INSERT INTO incident_updates (incident_id, actor_id, old_status, new_status, notes)
         VALUES (?, ?, ?, 'Đang xử lý', ?)`,
        [
          linkedIncident.id,
          (user && user.id) ? user.id : null,
          linkedIncident.status,
          `Khởi tạo lệnh công tác [${orderCode}] (${title}) để xử lý sự cố.`
        ]
      );
    }

    await runSql('COMMIT');

    // ⚡ SSE BROADCAST (Chỉ emit sau khi COMMIT thành công)
    sseService.broadcast({
      eventType: 'work_order.created',
      entityType: 'work_order',
      entityId: orderId,
      actor: { userId: actorId, role: user ? user.role : 'ADMIN', name: actorName },
      targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
      targetTeamId: assignedTeamId || undefined,
      payload: {
        id: orderId,
        code: orderCode,
        title,
        type,
        priority,
        routeCorridorName,
        totalItems: items.length,
        assignedTeamId: assignedTeamId || null,
        incidentId: incidentId ? String(incidentId) : null
      }
    });

    if (linkedIncident) {
      sseService.broadcast({
        eventType: 'incident.status_changed',
        entityType: 'incident',
        entityId: String(linkedIncident.id),
        actor: { userId: actorId, role: user ? user.role : 'ADMIN', name: actorName },
        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
        payload: {
          id: linkedIncident.id,
          status: 'Đang xử lý',
          workOrderId: orderId,
          workOrderCode: orderCode,
          updatedAt: now
        }
      });

      sseService.broadcast({
        eventType: 'incident.work_order_linked',
        entityType: 'incident',
        entityId: String(linkedIncident.id),
        actor: { userId: actorId, role: user ? user.role : 'ADMIN', name: actorName },
        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
        payload: {
          incidentId: linkedIncident.id,
          workOrderId: orderId,
          workOrderCode: orderCode,
          status: 'Đang xử lý'
        }
      });
    }

    // Trả về DTO chuẩn
    const orderRows = await allSql('SELECT * FROM work_orders WHERE id = ?', [orderId]);
    return res.status(201).json({
      success: true,
      message: `Đã khởi tạo lệnh công tác [${orderCode}] thành công`,
      data: mapWorkOrderFromRow(orderRows[0]),
      createdItemsCount: items.length
    });
  } catch (err) {
    try {
      await runSql('ROLLBACK');
    } catch (_) {}
    return res.status(500).json({ success: false, message: 'Lỗi tạo lệnh công tác', error: err.message });
  }
};

/**
 * 4. PATCH /api/work-orders/:id/assign
 * Phân bổ / điều chuyển lại tổ đội & xe cơ giới
 * (Khóa xe IN_USE thật trong SQLite & kiểm tra xe đang bận)
 */
exports.assignTeamAndEquipment = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { teamId, teamName, vehicleName, vehiclePlate, equipmentId } = req.body;

  if (!teamId) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn Tổ Đội để phân bổ' });
  }

  try {
    const orders = await allSql('SELECT * FROM work_orders WHERE id = ? OR code = ?', [id, id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: `Không tìm thấy lệnh công tác [${id}]` });
    }
    const order = orders[0];
    const realId = order.id;

    // Kiểm tra khả dụng của phương tiện cơ giới nếu được chỉ định
    let targetEquipment = null;
    if (equipmentId || vehiclePlate) {
      const eqRows = await allSql(
        `SELECT * FROM equipment WHERE id = ? OR plate_number = ?`,
        [equipmentId || '', vehiclePlate || '']
      );
      if (eqRows.length > 0) {
        targetEquipment = eqRows[0];
        if (targetEquipment.status === 'IN_USE' && targetEquipment.current_work_order_id && targetEquipment.current_work_order_id !== id) {
          return res.status(400).json({
            success: false,
            message: `Phương tiện [${targetEquipment.name} - ${targetEquipment.plate_number}] hiện đang được sử dụng cho Lệnh [${targetEquipment.current_work_order_id}]. Vui lòng chọn phương tiện khả dụng!`
          });
        }
      }
    }

    const previousTeamId = order.assigned_team_id;
    const isReassign = Boolean(previousTeamId && previousTeamId !== teamId);
    const newStatus = 'ASSIGNED';
    const now = new Date().toISOString();

    await runSql('BEGIN TRANSACTION');

    // 1. Giải phóng phương tiện cũ của lệnh này (nếu có)
    await runSql(
      `UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL, updated_at = ? WHERE current_work_order_id = ?`,
      [now, id]
    );

    // 2. Khóa phương tiện mới thành IN_USE
    if (targetEquipment) {
      await runSql(
        `UPDATE equipment SET status = 'IN_USE', current_work_order_id = ?, updated_at = ? WHERE id = ?`,
        [id, now, targetEquipment.id]
      );
    }

    // 3. Cập nhật Lệnh công tác
    await runSql(
      `UPDATE work_orders SET
        assigned_team_id = ?,
        assigned_team_name = ?,
        assigned_vehicle_name = ?,
        assigned_vehicle_plate = ?,
        status = ?,
        workflow_status = ?,
        updated_at = ?
      WHERE id = ?`,
      [
        teamId,
        teamName || order.assigned_team_name,
        targetEquipment ? targetEquipment.name : (vehicleName || order.assigned_vehicle_name),
        targetEquipment ? targetEquipment.plate_number : (vehiclePlate || order.assigned_vehicle_plate),
        newStatus,
        newStatus,
        now,
        order.id
      ]
    );

    // 4. Cập nhật workload tổ đội
    if (isReassign && previousTeamId) {
      await runSql(
        `UPDATE teams SET active_work_orders_count = MAX(0, COALESCE(active_work_orders_count, 1) - 1), updated_at = ? WHERE id = ?`,
        [now, previousTeamId]
      );
    }
    await runSql(
      `UPDATE teams SET active_work_orders_count = COALESCE(active_work_orders_count, 0) + 1, updated_at = ? WHERE id = ?`,
      [now, teamId]
    );

    // 5. Ghi nhật ký audit
    const histId = `wo-hist-${Date.now()}`;
    const actorName = (user && (user.full_name || user.username)) || 'Điều phối viên';
    const reason = isReassign
      ? `Điều chuyển từ tổ ${previousTeamId} sang tổ ${teamId}`
      : `Phân bổ cho ${teamName || teamId}`;

    await runSql(
      `INSERT INTO work_order_history (
        id, work_order_id, actor_user_id, actor_name,
        previous_status, new_status, action, reason,
        previous_team_id, new_team_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        histId, order.id, (user && user.id) ? String(user.id) : 'dispatcher', actorName,
        order.status, newStatus, isReassign ? 'REASSIGNED' : 'ASSIGNED', reason,
        previousTeamId || null, teamId, now
      ]
    );

    // 6. Tạo Persistent Notification trong cùng transaction (Wave 3.2 Atomicity)
    let assignedNotif = null;
    try {
      assignedNotif = await notificationService.createNotification({
        targetRole: 'STAFF',
        title: 'Lệnh công tác mới',
        message: `Bạn đã được phân công lệnh [${order.code}] - ${order.title}`,
        type: 'WORK_ORDER_ASSIGNED',
        severity: 'INFO',
        entityType: 'WORK_ORDER',
        entityId: order.id,
        linkTab: 'work_orders',
        linkId: order.id,
      }, runSql);
    } catch (notifErr) {
      console.warn('⚠️ Không thể lưu notification phân công:', notifErr.message);
    }

    await runSql('COMMIT');

    const updated = await allSql('SELECT * FROM work_orders WHERE id = ?', [order.id]);
    const updatedOrder = mapWorkOrderFromRow(updated[0]);

    // ⚡ SSE BROADCAST (Phát sự kiện phân công lệnh & gán xe)
    sseService.broadcast({
      eventType: 'work_order.assigned',
      entityType: 'work_order',
      entityId: order.id,
      actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
      targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
      targetTeamId: teamId,
      payload: {
        id,
        code: updatedOrder.code,
        assignedTeamId: teamId,
        assignedTeamName: teamName || teamId,
        assignedVehiclePlate: vehiclePlate || null,
        assignedVehicleName: vehicleName || null,
        status: updatedOrder.status
      }
    });

    if (assignedNotif) {
      sseService.broadcast({
        eventType: 'notification.pushed',
        entityType: 'notification',
        entityId: assignedNotif.id,
        actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
        targetRoles: ['STAFF', 'ADMIN'],
        targetTeamId: teamId,
        payload: {
          id: assignedNotif.id,
          title: assignedNotif.title,
          message: assignedNotif.message,
          type: assignedNotif.type,
          severity: assignedNotif.severity,
          entityType: assignedNotif.entityType,
          entityId: assignedNotif.entityId,
          linkTab: assignedNotif.linkTab,
          linkId: assignedNotif.linkId,
          createdAt: assignedNotif.createdAt,
        }
      });
    }

    if (vehiclePlate) {
      sseService.broadcast({
        eventType: 'equipment.assigned',
        entityType: 'equipment',
        entityId: vehiclePlate,
        actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
        targetRoles: ['ADMIN', 'DISPATCHER'],
        payload: {
          plateNumber: vehiclePlate,
          currentWorkOrderId: id,
          status: 'IN_USE'
        }
      });
    }

    res.json({
      success: true,
      message: `Đã phân bổ lệnh [${order.code}] cho ${teamName || teamId}`,
      data: updatedOrder
    });
  } catch (err) {
    await runSql('ROLLBACK').catch(() => {});
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 5. PATCH /api/work-orders/:id/status
 * Chuyển trạng thái vòng đời (Bảo vệ bởi State Machine + Khóa/Giải phóng thiết bị SQLite)
 */
exports.updateWorkOrderStatus = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const targetStatus = req.body.targetStatus || req.body.status;
  const reason = req.body.reason || req.body.notes;

  if (!targetStatus) {
    return res.status(400).json({ success: false, message: 'Trạng thái mục tiêu (targetStatus) là bắt buộc' });
  }

  try {
    const orders = await allSql('SELECT * FROM work_orders WHERE id = ? OR code = ?', [id, id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: `Không tìm thấy lệnh công tác [${id}]` });
    }
    const order = orders[0];
    const realId = order.id;
    const currentStatus = order.status;

    // 🔒 BẢO VỆ STATE MACHINE BẰNG BACKEND: Chặn đứng mọi transition trái phép
    if (!canTransition(currentStatus, targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Chuyển trạng thái không hợp lệ: Không thể chuyển từ "${currentStatus}" sang "${targetStatus}"!`,
        currentStatus,
        targetStatus,
        allowedTransitions: VALID_TRANSITIONS[currentStatus] || []
      });
    }

    // 🛡️ P0-03 GUARD: Chặn nộp báo cáo nghiệm thu nếu còn cây chưa xử lý (PENDING)
    if (targetStatus === 'SUBMITTED_FOR_REVIEW') {
      const items = await allSql('SELECT id, status, skip_or_failure_reason FROM work_order_items WHERE work_order_id = ?', [id]);
      if (items.length > 0) {
        const pendingItems = items.filter((it) => it.status === 'PENDING');
        if (pendingItems.length > 0) {
          return res.status(400).json({
            success: false,
            message: `Không thể nộp báo cáo nghiệm thu: Còn ${pendingItems.length}/${items.length} cây chưa được xử lý tại hiện trường (PENDING)!`,
            pendingCount: pendingItems.length,
            totalItems: items.length
          });
        }
      }
    }

    const now = new Date().toISOString();
    let actualStart = order.actual_start;
    let actualEnd = order.actual_end;
    let holdReason = order.hold_reason;
    let heldByUserId = order.held_by_user_id;
    let heldAt = order.held_at;

    if (targetStatus === 'IN_PROGRESS' && !actualStart) {
      actualStart = now;
    }
    if (targetStatus === 'ON_HOLD') {
      holdReason = reason || 'Tạm dừng thi công theo hiện trường';
      heldByUserId = (user && user.id) ? String(user.id) : 'system';
      heldAt = now;
    } else if (currentStatus === 'ON_HOLD' && targetStatus === 'IN_PROGRESS') {
      holdReason = null;
      heldByUserId = null;
      heldAt = null;
    }
    if (['SUBMITTED_FOR_REVIEW', 'COMPLETED', 'VERIFIED'].includes(targetStatus)) {
      if (!actualEnd) actualEnd = now;
    }

    await runSql('BEGIN TRANSACTION');

    await runSql(
      `UPDATE work_orders SET
        status = ?,
        workflow_status = ?,
        actual_start = ?,
        actual_end = ?,
        hold_reason = ?,
        held_by_user_id = ?,
        held_at = ?,
        updated_at = ?
      WHERE id = ?`,
      [targetStatus, targetStatus, actualStart, actualEnd, holdReason, heldByUserId, heldAt, now, order.id]
    );

    // 🚗 Giải phóng xe cơ giới & giảm tải tổ đội khi lệnh COMPLETED, CLOSED, hoặc CANCELLED
    if (['COMPLETED', 'CLOSED', 'CANCELLED'].includes(targetStatus)) {
      if (targetStatus === 'COMPLETED') {
        await runSql(
          `UPDATE work_order_items SET
            status = 'COMPLETED',
            completed_at = COALESCE(completed_at, ?),
            completed_by = COALESCE(completed_by, ?),
            notes = COALESCE(notes, 'Hoàn tất an toàn theo lệnh đóng nhanh')
          WHERE work_order_id = ? AND status = 'PENDING'`,
          [now, actorName, order.id]
        );
        await runSql(
          `UPDATE work_orders SET
            completed_items = (SELECT COUNT(*) FROM work_order_items WHERE work_order_id = ? AND status = 'COMPLETED'),
            progress_percent = 100
          WHERE id = ?`,
          [order.id, order.id]
        );
      }
      await runSql(
        `UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL, updated_at = ? WHERE current_work_order_id = ?`,
        [now, order.id]
      );
      if (order.assigned_team_id) {
        await runSql(
          `UPDATE teams SET active_work_orders_count = MAX(0, COALESCE(active_work_orders_count, 1) - 1), updated_at = ? WHERE id = ?`,
          [now, order.assigned_team_id]
        );
      }
    }

    const histId = `wo-hist-${Date.now()}`;
    const actorName = (user && (user.full_name || user.username)) || 'Hệ thống';
    await runSql(
      `INSERT INTO work_order_history (
        id, work_order_id, actor_user_id, actor_name,
        previous_status, new_status, action, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'STATUS_CHANGE', ?, ?)`,
      [histId, order.id, (user && user.id) ? String(user.id) : 'system', actorName, currentStatus, targetStatus, reason || 'Chuyển trạng thái quy trình', now]
    );

    await runSql('COMMIT');

    const updatedRows = await allSql('SELECT * FROM work_orders WHERE id = ?', [order.id]);
    const updatedOrder = mapWorkOrderFromRow(updatedRows[0]);

    // ⚡ SSE BROADCAST (Phát sự kiện chuyển trạng thái lệnh)
    sseService.broadcast({
      eventType: 'work_order.status_changed',
      entityType: 'work_order',
      entityId: order.id,
      actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
      targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
      targetTeamId: updatedOrder.assignedTeamId || undefined,
      payload: {
        id,
        code: updatedOrder.code,
        oldStatus: currentStatus,
        newStatus: targetStatus,
        actualStart: updatedOrder.actualStart,
        actualEnd: updatedOrder.actualEnd
      }
    });

    res.json({
      success: true,
      message: `Lệnh [${order.code}] đã chuyển sang trạng thái "${targetStatus}"`,
      data: updatedOrder
    });
  } catch (err) {
    await runSql('ROLLBACK').catch(() => {});
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 6. PATCH /api/work-orders/items/:itemId
 * KTV cập nhật tiến độ checklist từng cây trên tuyến
 */
exports.updateChecklistItem = (req, res) => {
  const { itemId } = req.params;
  const user = req.user;
  const { status = 'COMPLETED', skipReason, evidenceImageUrl, notes } = req.body;

  const validItemStatuses = ['PENDING', 'COMPLETED', 'SKIPPED', 'FAILED', 'NEEDS_FOLLOW_UP'];
  if (!validItemStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: `Trạng thái mục không hợp lệ: ${status}` });
  }

  const now = new Date().toISOString();
  const completedByUserId = (user && user.id) ? String(user.id) : 'staff-field';
  const completedByName = (user && (user.full_name || user.username)) || 'KTV Hiện trường';

  db.get(
    `SELECT woi.*, wo.assigned_team_id, wo.assigned_team_name, wo.status AS order_status
     FROM work_order_items woi
     LEFT JOIN work_orders wo ON woi.work_order_id = wo.id
     WHERE woi.id = ?`,
    [itemId],
    (err, item) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      if (!item) return res.status(404).json({ success: false, message: `Không tìm thấy mục công việc [${itemId}]` });

      // 🔒 REMEDIATION VULN-IDOR-001: Phòng thủ IDOR ngang
      // Admin và Dispatcher có toàn quyền; KTV (STAFF) chỉ được thao tác nếu thuộc tổ đội được giao
      if (user && user.role === 'STAFF') {
        const callerTeam = user.team_id || user.assigned_team_id;
        if (callerTeam && item.assigned_team_id && String(callerTeam) !== String(item.assigned_team_id)) {
          return res.status(403).json({
            success: false,
            message: `Quyền truy cập bị từ chối (IDOR Guard): KTV không thuộc tổ được giao nhiệm vụ cho lệnh này.`
          });
        }
      }

      const orderId = item.work_order_id;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      db.run(
        `UPDATE work_order_items SET
          status = ?,
          skip_or_failure_reason = ?,
          reason = ?,
          evidence_after_image_url = ?,
          notes = ?,
          completed_at = ?,
          completed_by = ?,
          completed_by_user_id = ?
        WHERE id = ?`,
        [
          status,
          skipReason || null,
          skipReason || null,
          evidenceImageUrl || item.evidence_after_image_url || null,
          notes || item.notes || null,
          now,
          completedByName,
          completedByUserId,
          itemId
        ],
        (uErr) => {
          if (uErr) {
            db.run('ROLLBACK');
            return res.status(500).json({ success: false, error: uErr.message });
          }

          // Tính toán lại tổng tiến độ từ SQLite (Không tin client)
          db.all('SELECT status FROM work_order_items WHERE work_order_id = ?', [orderId], (aggErr, siblingItems) => {
            if (aggErr) {
              db.run('ROLLBACK');
              return res.status(500).json({ success: false, error: aggErr.message });
            }

            // Ghi nhận care_record và cập nhật cây thật trong SQLite khi hoàn thành
            if (status === 'COMPLETED') {
              db.get('SELECT * FROM work_orders WHERE id = ?', [orderId], (wErr, parentOrder) => {
                if (!wErr && parentOrder) {
                  const rawTreeId = parseInt(item.tree_id, 10) || 1;
                  const actionType = parentOrder.type === 'PRUNING' ? 'Cắt tỉa' : (parentOrder.type === 'WATERING' ? 'Tưới nước' : 'Bón phân');
                  const careCode = `CARE-WO-${Date.now().toString().slice(-6)}-${item.sequence || 1}`;
                  const notesText = notes || `Hoàn tất thi công hiện trường theo lệnh [${parentOrder.code}].`;

                  db.get('SELECT id FROM care_records WHERE work_order_id = ? AND tree_id = ?', [orderId, rawTreeId], (cErr, existingCare) => {
                    if (!cErr && !existingCare) {
                      db.run(
                        `INSERT INTO care_records (
                          care_code, tree_id, tree_code, staff_id, caretaker_name,
                          action_type, health_before, health_after, notes, image_after_url,
                          action_date, created_at, anchor_status, work_order_id, work_order_code
                        ) VALUES (?, ?, ?, ?, ?, ?, 'FAIR', 'FAIR', ?, ?, ?, ?, 'PENDING_VERIFICATION', ?, ?)`,
                        [
                          careCode,
                          rawTreeId,
                          item.tree_street_code || `CT-${rawTreeId}`,
                          parseInt(completedByUserId, 10) || 1,
                          completedByName,
                          actionType,
                          notesText,
                          evidenceImageUrl || item.evidence_after_image_url || null,
                          now,
                          now,
                          orderId,
                          parentOrder.code
                        ]
                      );
                    }
                  });
                }
              });
            }

            const total = siblingItems.length;
            const completed = siblingItems.filter((i) => i.status === 'COMPLETED').length;
            const skipped = siblingItems.filter((i) => i.status === 'SKIPPED').length;
            const failed = siblingItems.filter((i) => i.status === 'FAILED' || i.status === 'NEEDS_FOLLOW_UP').length;
            const progress = total > 0 ? Math.round(((completed + skipped) / total) * 100) : 0;

            const allHandled = (completed + skipped + failed) >= total && total > 0;

            // Nếu toàn bộ cây đã được xử lý xong/bỏ qua, tự động chuyển Lệnh sang SUBMITTED_FOR_REVIEW
            let nextOrderStatusSql = '';
            const updateOrderParams = [total, completed, skipped, failed, progress, now];

            if (allHandled) {
              nextOrderStatusSql = ", status = CASE WHEN status = 'IN_PROGRESS' THEN 'SUBMITTED_FOR_REVIEW' ELSE status END, workflow_status = CASE WHEN workflow_status = 'IN_PROGRESS' THEN 'SUBMITTED_FOR_REVIEW' ELSE workflow_status END, actual_end = COALESCE(actual_end, ?)";
              updateOrderParams.push(now);
            }
            updateOrderParams.push(orderId);

            db.run(
              `UPDATE work_orders SET
                total_items = ?,
                completed_items = ?,
                skipped_items = ?,
                failed_items = ?,
                progress_percent = ?,
                updated_at = ?
                ${nextOrderStatusSql}
              WHERE id = ?`,
              updateOrderParams,
              (ordErr) => {
                if (ordErr) {
                  db.run('ROLLBACK');
                  return res.status(500).json({ success: false, error: ordErr.message });
                }

                db.run('COMMIT', () => {
                  db.get('SELECT * FROM work_order_items WHERE id = ?', [itemId], (qErr, updatedItemRow) => {
                    db.get('SELECT * FROM work_orders WHERE id = ?', [orderId], (qOrderErr, updatedOrderRow) => {
                      const itemDto = mapItemFromRow(updatedItemRow);
                      const orderDto = mapWorkOrderFromRow(updatedOrderRow);

                      // ⚡ SSE BROADCAST (Phát sự kiện cập nhật checklist cây)
                      sseService.broadcast({
                        eventType: 'work_order.item_updated',
                        entityType: 'work_order',
                        entityId: orderId,
                        actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'STAFF', name: completedByName },
                        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
                        targetTeamId: orderDto.assignedTeamId || undefined,
                        payload: {
                          orderId,
                          itemId,
                          itemStatus: itemDto.status,
                          treeId: itemDto.treeId,
                          completedItems: orderDto.completedItems,
                          totalItems: orderDto.totalItems,
                          progressPercent: orderDto.progressPercent,
                          isSubmittedForReview: allHandled
                        }
                      });

                      res.json({
                        success: true,
                        item: itemDto,
                        parentWorkOrder: orderDto,
                        isSubmittedForReview: allHandled
                      });
                    });
                  });
                });
              }
            );
          });
        }
      );
    });
  });
};

/**
 * 7. POST /api/work-orders/:id/verify
 * Giám sát viên / Admin nghiệm thu lệnh công tác
 * 🔒 P0: IDEMPOTENCY GUARD & REAL DATA PERSISTENCE
 * - Chặn đứng hoàn toàn việc nghiệm thu trùng lặp / double click / retry
 * - Tự động giải phóng xe cơ giới về AVAILABLE trong SQLite
 * - Giảm tải active_work_orders_count của Tổ đội
 * - Chèn care_records với cơ chế deduplication (không bao giờ sinh bản ghi trùng)
 */
exports.verifyWorkOrder = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  const { isApproved = true, notes } = req.body;

  try {
    const orders = await allSql('SELECT * FROM work_orders WHERE id = ? OR code = ?', [id, id]);
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: `Không tìm thấy lệnh công tác [${id}]` });
    }
    const order = orders[0];
    const realId = order.id;

    // 🔒 P0 IDEMPOTENCY: Chặn đứng retry/double-click nếu lệnh đã hoàn tất hoặc đóng
    if (order.status === 'COMPLETED' || order.status === 'CLOSED') {
      return res.status(400).json({
        success: false,
        message: `Lệnh công tác [${order.code}] đã ở trạng thái "${order.status}", không thể nghiệm thu lại!`
      });
    }

    const targetStatus = isApproved ? 'COMPLETED' : 'REJECTED';
    const now = new Date().toISOString();
    const supervisorId = (user && user.id) ? String(user.id) : 'supervisor';
    const supervisorName = (user && (user.full_name || user.username)) || 'Giám sát viên';

    await runSql('BEGIN TRANSACTION');

    // 1. Cập nhật trạng thái lệnh công tác
    await runSql(
      `UPDATE work_orders SET
        status = ?,
        workflow_status = ?,
        supervisor_user_id = ?,
        supervisor_notes = ?,
        actual_end = COALESCE(actual_end, ?),
        updated_at = ?
      WHERE id = ?`,
      [targetStatus, targetStatus, supervisorId, notes || null, now, now, order.id]
    );

    // 2. Ghi nhật ký audit
    const histId = `wo-hist-${Date.now()}`;
    const reasonText = isApproved
      ? `Nghiệm thu ĐẠT chuẩn kỹ thuật. Ghi chú: ${notes || 'Hoàn tất an toàn'}`
      : `Nghiệm thu KHÔNG ĐẠT (Yêu cầu thi công lại). Lý do: ${notes || 'Chưa đạt tĩnh không an toàn'}`;

    await runSql(
      `INSERT INTO work_order_history (
        id, work_order_id, actor_user_id, actor_name,
        previous_status, new_status, action, reason, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [histId, order.id, supervisorId, supervisorName, order.status, targetStatus, isApproved ? 'VERIFIED' : 'REJECTED', reasonText, now]
    );

    // 3. P0: Giải phóng Thiết bị & Giảm tải Tổ đội nếu nghiệm thu ĐẠT
    if (isApproved) {
      // Tự động hoàn tất tất cả các cây PENDING còn lại khi Giám sát viên duyệt nghiệm thu ĐẠT toàn tuyến
      await runSql(
        `UPDATE work_order_items SET
          status = 'COMPLETED',
          completed_at = COALESCE(completed_at, ?),
          completed_by = COALESCE(completed_by, ?),
          notes = COALESCE(notes, 'Giám sát viên đã nghiệm thu đạt chuẩn an toàn kỹ thuật toàn tuyến')
        WHERE work_order_id = ? AND status = 'PENDING'`,
        [now, supervisorName, order.id]
      );

      // Cập nhật số lượng hoàn thành và tiến độ 100% cho lệnh công tác
      await runSql(
        `UPDATE work_orders SET
          completed_items = (SELECT COUNT(*) FROM work_order_items WHERE work_order_id = ? AND status = 'COMPLETED'),
          progress_percent = 100,
          updated_at = ?
        WHERE id = ?`,
        [order.id, now, order.id]
      );

      // Giải phóng xe về AVAILABLE
      await runSql(
        `UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL, updated_at = ? WHERE current_work_order_id = ?`,
        [now, order.id]
      );

      // Giảm tải tổ đội
      if (order.assigned_team_id) {
        await runSql(
          `UPDATE teams SET active_work_orders_count = MAX(0, COALESCE(active_work_orders_count, 1) - 1), updated_at = ? WHERE id = ?`,
          [now, order.assigned_team_id]
        );
      }

      // 4. P0: Tự động ghi / xác nhận care_records kèm Deduplication Guard
      const completedItems = await allSql(
        'SELECT * FROM work_order_items WHERE work_order_id = ? AND status = "COMPLETED"',
        [order.id]
      );

      const existingCare = await allSql(`SELECT COUNT(*) AS cCount FROM care_records WHERE work_order_id = ?`, [order.id]);
      if (existingCare[0] && existingCare[0].cCount > 0) {
        // Cập nhật các bản ghi hiện trường tạm PENDING_VERIFICATION sang CONFIRMED chính thức
        await runSql(
          `UPDATE care_records SET
            anchor_status = 'CONFIRMED',
            health_after = 'GOOD',
            notes = notes || ' [Nghiệm thu đạt chuẩn bởi ' || ? || ']'
          WHERE work_order_id = ?`,
          [supervisorName, order.id]
        );
      } else {
        if (completedItems && completedItems.length > 0) {
          const actionType = order.type === 'PRUNING' ? 'Cắt tỉa' : (order.type === 'WATERING' ? 'Tưới nước' : 'Bón phân');
          for (let idx = 0; idx < completedItems.length; idx++) {
            const ci = completedItems[idx];
            const careCode = `CARE-WO-${Date.now().toString().slice(-6)}-${idx + 1}`;
            const rawTreeId = parseInt(ci.tree_id, 10) || 1;
            const notesText = `Hoàn tất theo lệnh công tác [${order.code}] (${order.title}). Nghiệm thu bởi ${supervisorName}.`;

            await runSql(
              `INSERT INTO care_records (
                care_code, tree_id, tree_code, staff_id, caretaker_name,
                action_type, health_before, health_after, notes, image_after_url,
                action_date, created_at, anchor_status, work_order_id, work_order_code
              ) VALUES (?, ?, ?, ?, ?, ?, 'FAIR', 'GOOD', ?, ?, ?, ?, 'CONFIRMED', ?, ?)`,
              [
                careCode,
                rawTreeId,
                ci.tree_street_code || `CT-${rawTreeId}`,
                parseInt(order.assigned_team_id?.replace('team-', ''), 10) || 2,
                order.assigned_team_name || 'Đội Công Ích Đô Thị',
                actionType,
                notesText,
                ci.evidence_after_image_url || null,
                now,
                now,
                order.id,
                order.code
              ]
            );
          }
        }
      }

      // Cập nhật sức khỏe thực thể cây thật sau khi nghiệm thu
      await runSql(
        `UPDATE trees SET health_status = 'Tốt', updated_at = ? WHERE id IN (SELECT tree_id FROM work_order_items WHERE work_order_id = ? AND status = 'COMPLETED')`,
        [now, order.id]
      );

      // 4.1. Wave 4.9: Cập nhật tiến độ Chiến Dịch Mùa Bão & Xác nhận Nghiệm Thu
      try {
        const campRows = await allSql(`SELECT * FROM campaigns WHERE type = 'STORM_PREPARATION' AND status != 'CLOSED' ORDER BY created_at DESC LIMIT 1`);
        if (campRows.length > 0) {
          const camp = campRows[0];
          const completedCount = completedItems ? completedItems.length : 0;
          const newResolved = Math.min(camp.total_detected_trees, (camp.resolved_trees || 0) + completedCount);
          const newRemaining = Math.max(0, camp.total_detected_trees - newResolved);
          const newStatus = newRemaining === 0 ? 'RESOLVED' : (newRemaining <= 50 ? 'NEAR_COMPLETION' : 'IN_PROGRESS');
          let campHistory = [];
          try { campHistory = JSON.parse(camp.history_json || '[]'); } catch { campHistory = []; }
          campHistory.push({
            timestamp: now,
            event: newRemaining === 0 ? 'RESOLVED' : 'VERIFIED_BATCH',
            details: `Nghiệm thu hoàn tất lệnh [${order.code}]: +${completedCount} cây được xác nhận an toàn. Còn tồn: ${newRemaining} cây.`
          });

          await runSql(
            `UPDATE campaigns SET
              resolved_trees = ?,
              verified_trees = ?,
              remaining_trees = ?,
              status = ?,
              resolved_at = CASE WHEN ? = 'RESOLVED' THEN COALESCE(resolved_at, ?) ELSE resolved_at END,
              history_json = ?,
              updated_at = ?
             WHERE id = ?`,
            [newResolved, newResolved, newRemaining, newStatus, newStatus, now, JSON.stringify(campHistory), now, camp.id]
          );
        }
      } catch (campErr) {
        console.warn('⚠️ Cập nhật tiến độ chiến dịch khi nghiệm thu:', campErr.message);
      }

      // 5. Wave 3.3: Tự động đóng sự cố liên kết nếu nghiệm thu ĐẠT
      if (order.incident_id) {
        const incRows = await allSql('SELECT * FROM incidents WHERE id = ?', [order.incident_id]);
        if (incRows.length > 0) {
          const inc = incRows[0];
          await runSql(
            `UPDATE incidents SET
              status = 'Đã hoàn thành',
              resolved_at = COALESCE(resolved_at, ?),
              work_order_id = COALESCE(work_order_id, ?)
            WHERE id = ?`,
            [now, order.id, inc.id]
          );

          await runSql(
            `INSERT INTO incident_updates (incident_id, actor_id, old_status, new_status, notes)
             VALUES (?, ?, ?, 'Đã hoàn thành', ?)`,
            [
              inc.id,
              (user && user.id) ? user.id : null,
              inc.status,
              `Sự cố đã được hoàn tất xử lý qua lệnh công tác [${order.code}]. Nghiệm thu bởi ${supervisorName}.`
            ]
          );
        }
      }
    } else {
      // Khi Giám sát từ chối nghiệm thu, chuyển toàn bộ care_records tạm sang REJECTED
      await runSql(
        `UPDATE care_records SET anchor_status = 'REJECTED', notes = notes || ' [Từ chối nghiệm thu: ' || ? || ']' WHERE work_order_id = ?`,
        [notes || 'Yêu cầu làm lại', order.id]
      );
    }

    // 6. Tạo Persistent Notification cho Lãnh đạo / Giám sát trong transaction (Wave 3.2 Atomicity)
    let verifiedNotif = null;
    if (isApproved) {
      try {
        verifiedNotif = await notificationService.createNotification({
          targetRole: 'ADMIN',
          title: 'Nghiệm thu hoàn tất lệnh công tác',
          message: `Lệnh công tác [${order.code}] đã được nghiệm thu hoàn tất và ghi nhận vào cơ sở dữ liệu.`,
          type: 'WORK_ORDER_COMPLETED',
          severity: 'SUCCESS',
          entityType: 'WORK_ORDER',
          entityId: order.id,
          linkTab: 'work_orders',
          linkId: order.id,
        }, runSql);
      } catch (notifErr) {
        console.warn('⚠️ Không thể lưu notification nghiệm thu:', notifErr.message);
      }
    }

    await runSql('COMMIT');

    const updatedRows = await allSql('SELECT * FROM work_orders WHERE id = ?', [order.id]);
    const updatedOrder = mapWorkOrderFromRow(updatedRows[0]);

    // ⚡ SSE BROADCAST (Phát sự kiện hoàn thành nghiệm thu lệnh & giải phóng xe)
    sseService.broadcast({
      eventType: 'work_order.completed',
      entityType: 'work_order',
      entityId: order.id,
      actor: { userId: supervisorId, role: user ? user.role : 'ADMIN', name: supervisorName },
      targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
      targetTeamId: updatedOrder.assignedTeamId || undefined,
      payload: {
        id,
        code: updatedOrder.code,
        status: isApproved ? 'COMPLETED' : 'REJECTED',
        verifiedBy: supervisorName,
        verifiedAt: now
      }
    });

    if (verifiedNotif) {
      sseService.broadcast({
        eventType: 'notification.pushed',
        entityType: 'notification',
        entityId: verifiedNotif.id,
        actor: { userId: supervisorId, role: user ? user.role : 'ADMIN', name: supervisorName },
        targetRoles: ['ADMIN', 'DISPATCHER'],
        payload: {
          id: verifiedNotif.id,
          title: verifiedNotif.title,
          message: verifiedNotif.message,
          type: verifiedNotif.type,
          severity: verifiedNotif.severity,
          entityType: verifiedNotif.entityType,
          entityId: verifiedNotif.entityId,
          linkTab: verifiedNotif.linkTab,
          linkId: verifiedNotif.linkId,
          createdAt: verifiedNotif.createdAt,
        }
      });
    }

    if (order.assigned_vehicle_plate && isApproved) {
      sseService.broadcast({
        eventType: 'equipment.status_changed',
        entityType: 'equipment',
        entityId: order.assigned_vehicle_plate,
        actor: { userId: supervisorId, role: user ? user.role : 'ADMIN', name: supervisorName },
        targetRoles: ['ADMIN', 'DISPATCHER'],
        payload: {
          plateNumber: order.assigned_vehicle_plate,
          currentWorkOrderId: null,
          status: 'AVAILABLE'
        }
      });
    }

    if (order.incident_id && isApproved) {
      sseService.broadcast({
        eventType: 'incident.status_changed',
        entityType: 'incident',
        entityId: String(order.incident_id),
        actor: { userId: supervisorId, role: user ? user.role : 'ADMIN', name: supervisorName },
        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
        payload: {
          id: Number(order.incident_id) || order.incident_id,
          status: 'Đã hoàn thành',
          resolvedAt: now,
          workOrderId: id,
          workOrderCode: order.code,
          updatedAt: now
        }
      });
    }

    res.json({
      success: true,
      message: isApproved ? `Đã nghiệm thu ĐẠT lệnh công tác [${order.code}]` : `Đã từ chối nghiệm thu lệnh [${order.code}], yêu cầu làm lại`,
      data: updatedOrder
    });
  } catch (err) {
    await runSql('ROLLBACK').catch(() => {});
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 8. CHIẾN DỊCH BÃO: TẠO EMERGENCY WORK ORDERS HÀNG LOẠT THEO TUYẾN
 * POST /api/work-orders/emergency-storm
 * Quyền: ADMIN
 * 🔒 Hardened:
 * - Dynamic Assignment Engine (Khớp năng lực HEAVY_PRUNING, khu vực, tải thực tế)
 * - Khóa phương tiện cơ giới IN_USE thật trong SQLite
 * - Hỗ trợ Backlog Metadata & Multi-batching nếu tuyến vượt quá 25 cây
 * - Bảo vệ Concurrency bằng BEGIN IMMEDIATE TRANSACTION
 */
exports.createEmergencyStormOrders = async (req, res) => {
  const user = req.user;
  const now = new Date().toISOString();
  const actorId = user && user.id ? String(user.id) : 'system';
  const actorName = (user && (user.full_name || user.username)) || 'Chỉ huy Điều Hành Bão Lũ';

  const openStatuses = ['DRAFT', 'PLANNED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'REJECTED'];
  const openStatusesPlaceholders = openStatuses.map(() => '?').join(',');

  try {
    let campRows = await allSql(`SELECT * FROM campaigns WHERE type = 'STORM_PREPARATION' AND status != 'CLOSED' ORDER BY created_at DESC LIMIT 1`);
    let activeCampaign = campRows[0];
    if (!activeCampaign) {
      const riskTreesCountRes = await allSql(
        `SELECT COUNT(*) as c FROM trees WHERE (height_meter >= 7 OR diameter_cm >= 25) AND status != 'REMOVED'`
      );
      const initialDetected = riskTreesCountRes[0]?.c || 5398;
      const campId = 'campaign-storm-2026';
      await runSql(
        `INSERT INTO campaigns (
          id, code, name, type, status, target_scope,
          total_detected_trees, assigned_trees, in_progress_trees,
          field_completed_trees, verified_trees, resolved_trees,
          remaining_trees, created_at, updated_at, history_json
        ) VALUES (?, 'CAMP-STORM-2026', 'Chiến Dịch Rà Soát & Cắt Tỉa Hạ Độ Cao Đón Mùa Bão 2026', 'STORM_PREPARATION', 'ACTIVE', 'ALL_CITY', ?, 0, 0, 0, 0, 0, ?, ?, ?, '[]')`,
        [campId, initialDetected, initialDetected, now, now]
      );
      const newCamp = await allSql(`SELECT * FROM campaigns WHERE id = ?`, [campId]);
      activeCampaign = newCamp[0];
    }

    const openOrders = await allSql(
      `SELECT route_id FROM work_orders WHERE type = 'PRUNING' AND status IN (${openStatusesPlaceholders})`,
      openStatuses
    );

    const openRouteIds = new Set(openOrders.map((o) => o.route_id).filter(Boolean));
    const candidateCorridors = CITY_CORRIDORS.filter((c) => !openRouteIds.has(c.id));
    const skippedRoutes = CITY_CORRIDORS.filter((c) => openRouteIds.has(c.id)).map((c) => c.name);

    if (candidateCorridors.length === 0) {
      return res.json({
        success: true,
        message: 'Tất cả các tuyến trọng điểm hiện đã có Lệnh cắt tỉa khẩn cấp đang thi công. Không sinh trùng lặp!',
        createdCount: 0,
        skippedCount: skippedRoutes.length,
        skippedRoutes,
        totalTreesScheduled: 0,
        orders: [],
      });
    }

    const targetCorridors = candidateCorridors.slice(0, 2);
    const createdOrders = [];
    let totalTreesCount = 0;

    for (const corr of targetCorridors) {
      await runSql('BEGIN IMMEDIATE TRANSACTION');
      try {
        // Concurrency Guard: Kiểm tra lại xem tiến trình song song khác đã tạo chưa
        const concurrentCheck = await allSql(
          `SELECT id FROM work_orders WHERE route_id = ? AND type = 'PRUNING' AND status IN (${openStatusesPlaceholders})`,
          [corr.id, ...openStatuses]
        );
        if (concurrentCheck.length > 0) {
          await runSql('ROLLBACK');
          skippedRoutes.push(corr.name);
          continue;
        }

        // 1. Tính tổng cây rủi ro giông lốc trên tuyến để xác định backlog
        const totalRiskResult = await allSql(
          `SELECT COUNT(*) AS totalRiskTrees FROM trees
           WHERE (address LIKE ? OR location_name LIKE ?)
             AND (height_meter >= 7 OR diameter_cm >= 25)
             AND status != 'REMOVED'`,
          [`%${corr.searchKeyword}%`, `%${corr.searchKeyword}%`]
        );
        const totalRiskTrees = totalRiskResult[0]?.totalRiskTrees || 0;

        // 2. Lấy 25 cây nguy cấp nhất cho Đợt 1
        let batchTrees = await allSql(
          `SELECT id, tree_code, species, location_name, address, height_meter, diameter_cm, health_status
           FROM trees
           WHERE (address LIKE ? OR location_name LIKE ?)
             AND (height_meter >= 7 OR diameter_cm >= 25)
             AND status != 'REMOVED'
           ORDER BY height_meter DESC, diameter_cm DESC
           LIMIT 25`,
          [`%${corr.searchKeyword}%`, `%${corr.searchKeyword}%`]
        );

        if (!batchTrees || batchTrees.length === 0) {
          batchTrees = await allSql(
            `SELECT id, tree_code, species, location_name, address, height_meter, diameter_cm, health_status
             FROM trees
             WHERE (height_meter >= 7 OR diameter_cm >= 25) AND status != 'REMOVED'
             ORDER BY height_meter DESC LIMIT 20`
          );
        }

        const backlogCount = Math.max(0, totalRiskTrees - batchTrees.length);
        const totalBatches = Math.ceil(totalRiskTrees / 25) || 1;

        // 3. Dynamic Assignment: Tìm tổ đội và xe thang phù hợp nhất
        const match = await findDynamicTeamAndEquipment({
          taskType: 'PRUNING',
          requiredCapabilities: ['HEAVY_PRUNING', 'AERIAL_PLATFORM'],
          zoneId: corr.zoneId,
        });

        const pruneTeam = match.team;
        const ladderTruck = match.equipment;

        const orderId = `wo-storm-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const orderCode = `WO-STORM-${corr.code}-${Date.now().toString().slice(-4)}`;
        const title = `[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - ${corr.name}`;
        const desc = `Chiến dịch cắt tỉa hạ độ cao giải tỏa rủi ro giông lốc theo cấp bách đô thị. Đợt 1/${totalBatches} gồm ${batchTrees.length} cây ưu tiên cao trên trục ${corr.name} (Tồn đọng tuyến: ${backlogCount} cây).`;

        await runSql(
          `INSERT INTO work_orders (
            id, code, title, description, type, priority, scope_type,
            zone_id, route_id, route_corridor_name,
            status, workflow_status, scheduled_start, scheduled_end,
            required_capabilities, required_equipment_ids,
            assigned_team_id, assigned_team_name,
            assigned_vehicle_name, assigned_vehicle_plate,
            total_items, completed_items, skipped_items, failed_items, progress_percent,
            sla_target_minutes, is_overdue, created_by_user_id, created_at, updated_at,
            batch_index, total_batches, backlog_trees_count, campaign_id
          ) VALUES (?, ?, ?, ?, 'PRUNING', 'CRITICAL', 'ROUTE', ?, ?, ?, 'ASSIGNED', 'ASSIGNED', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 120, 0, ?, ?, ?, 1, ?, ?, ?)`,
          [
            orderId,
            orderCode,
            title,
            desc,
            corr.zoneId,
            corr.id,
            corr.name,
            now,
            new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
            JSON.stringify(['HEAVY_PRUNING', 'AERIAL_PLATFORM']),
            JSON.stringify(ladderTruck ? [ladderTruck.id] : []),
            pruneTeam ? pruneTeam.id : 'team-prune-1',
            pruneTeam ? pruneTeam.name : 'Tổ Cơ Giới Cắt Tỉa',
            ladderTruck ? ladderTruck.name : 'Xe Thang Tự Hành Nâng Cao',
            ladderTruck ? ladderTruck.plate_number : '65A-0892',
            batchTrees.length,
            actorId,
            now,
            now,
            totalBatches,
            backlogCount,
            activeCampaign ? activeCampaign.id : null
          ]
        );

        // Khóa xe cơ giới & Tăng tải tổ đội trong SQLite
        if (ladderTruck) {
          await runSql(
            `UPDATE equipment SET status = 'IN_USE', current_work_order_id = ?, updated_at = ? WHERE id = ?`,
            [orderId, now, ladderTruck.id]
          );
        }
        if (pruneTeam) {
          await runSql(
            `UPDATE teams SET active_work_orders_count = COALESCE(active_work_orders_count, 0) + 1, updated_at = ? WHERE id = ?`,
            [now, pruneTeam.id]
          );
        }

        // Tạo danh sách checklist cây
        for (let i = 0; i < batchTrees.length; i++) {
          const t = batchTrees[i];
          await runSql(
            `INSERT INTO work_order_items (
              id, work_order_id, tree_id, tree_street_code, tree_display_name,
              house_milestone, sequence, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
            [
              `wo-item-${orderId}-${i + 1}`,
              orderId,
              String(t.id),
              t.tree_code || `CT-${t.id}`,
              t.species || `Cây xanh #${t.id}`,
              t.location_name || corr.name,
              i + 1,
              now,
            ]
          );
        }

        const histId = `wo-hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await runSql(
          `INSERT INTO work_order_history (
            id, work_order_id, actor_user_id, actor_name,
            previous_status, new_status, action, reason, created_at
          ) VALUES (?, ?, ?, ?, 'DRAFT', 'ASSIGNED', 'CREATE', 'Khởi tạo Chiến Dịch Cắt Tỉa Khẩn Cấp Mùa Bão (Khóa xe & Phân bổ tự động)', ?)`,
          [histId, orderId, actorId, actorName, now]
        );

        await runSql('COMMIT');

        createdOrders.push({
          id: orderId,
          code: orderCode,
          title,
          routeCorridorName: corr.name,
          totalItems: batchTrees.length,
          priority: 'CRITICAL',
          status: 'ASSIGNED',
          assignedTeamName: pruneTeam ? pruneTeam.name : 'Tổ Cắt Tỉa',
          assignedVehiclePlate: ladderTruck ? ladderTruck.plate_number : null,
          batchIndex: 1,
          totalBatches,
          backlogTreesCount: backlogCount
        });
        totalTreesCount += batchTrees.length;
      } catch (subErr) {
        await runSql('ROLLBACK').catch(() => {});
        console.error('Error creating storm order for corridor:', corr.name, subErr);
      }
    }

    if (createdOrders.length > 0) {
      let stormNotif = null;
      try {
        stormNotif = await notificationService.createNotification({
          targetRole: 'STAFF',
          title: 'Báo động bão: Đợt cắt tỉa khẩn cấp',
          message: `Đã kích hoạt đợt cắt tỉa khẩn cấp (${createdOrders.length} lệnh công tác, ${totalTreesCount} cây xanh).`,
          type: 'STORM_ALERT',
          severity: 'WARNING',
          entityType: 'STORM_CAMPAIGN',
          entityId: `storm_${Date.now()}`,
          linkTab: 'work_orders',
          linkId: 'storm-audit',
        });
      } catch (stormErr) {
        console.warn('⚠️ Lỗi tạo notification bão:', stormErr.message);
      }

      sseService.broadcast({
        eventType: 'storm.batch_dispatched',
        entityType: 'storm',
        entityId: `storm_${Date.now()}`,
        actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
        payload: {
          createdCount: createdOrders.length,
          skippedCount: skippedRoutes.length,
          totalTreesScheduled: totalTreesCount,
          orders: createdOrders.map((o) => ({ id: o.id, code: o.code, route: o.routeCorridorName }))
        }
      });

      if (stormNotif) {
        sseService.broadcast({
          eventType: 'notification.pushed',
          entityType: 'notification',
          entityId: stormNotif.id,
          actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
          targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
          payload: {
            id: stormNotif.id,
            title: stormNotif.title,
            message: stormNotif.message,
            type: stormNotif.type,
            severity: stormNotif.severity,
            entityType: stormNotif.entityType,
            entityId: stormNotif.entityId,
            linkTab: stormNotif.linkTab,
            linkId: stormNotif.linkId,
            createdAt: stormNotif.createdAt,
          }
        });
      }

      if (activeCampaign) {
        try {
          await runSql(
            `UPDATE campaigns SET
              status = CASE WHEN status = 'ACTIVE' THEN 'IN_PROGRESS' ELSE status END,
              assigned_trees = assigned_trees + ?,
              updated_at = ?
             WHERE id = ?`,
            [totalTreesCount, now, activeCampaign.id]
          );
          sseService.broadcast({
            eventType: 'campaign.updated',
            entityType: 'campaign',
            entityId: activeCampaign.id,
            actor: { userId: actorId, role: user ? user.role : 'ADMIN', name: actorName },
            targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
            payload: {
              id: activeCampaign.id,
              status: 'IN_PROGRESS',
              assignedTrees: (activeCampaign.assigned_trees || 0) + totalTreesCount
            }
          });
        } catch (campUpErr) {
          console.warn('⚠️ Lỗi cập nhật chiến dịch bão sau khi lập lệnh:', campUpErr.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: `⚡ Đã lập thành công ${createdOrders.length} Lệnh công tác Cắt tỉa Khẩn cấp Mùa bão (Bỏ qua ${skippedRoutes.length} tuyến đã có lệnh).`,
      createdCount: createdOrders.length,
      skippedCount: skippedRoutes.length,
      skippedRoutes,
      totalTreesScheduled: totalTreesCount,
      orders: createdOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 9. TỰ ĐỘNG LẬP LỊCH BẢO DƯỠNG (AUTO-SCHEDULER ENGINE)
 * POST /api/work-orders/auto-schedule
 * Quyền: ADMIN
 * 🔒 Hardened:
 * - Đọc trực tiếp từ bảng maintenance_rules trong SQLite (Không hardcode mảng rules)
 * - Dynamic Assignment Engine: Phân bổ đúng tổ có năng lực chuyên môn (WATERING, FERTILIZING, PRUNING...)
 * - Khóa xe cơ giới khả dụng tương ứng trong SQLite
 * - Tăng tải cho tổ đội được giao
 * - Bảo vệ Concurrency bằng BEGIN IMMEDIATE TRANSACTION
 */
exports.runAutoScheduleOrders = async (req, res) => {
  const user = req.user;
  const now = new Date().toISOString();
  const actorId = user && user.id ? String(user.id) : 'system-scheduler';
  const actorName = (user && (user.full_name || user.username)) || 'Hệ Thống Tự Động Lập Lịch (Auto-Scheduler)';

  const openStatuses = ['DRAFT', 'PLANNED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW', 'REJECTED'];
  const openStatusesPlaceholders = openStatuses.map(() => '?').join(',');

  try {
    // 1. Đọc danh mục quy tắc bảo dưỡng ACTIVE trực tiếp từ SQLite
    const rules = await allSql(`SELECT * FROM maintenance_rules WHERE is_active = 1`);
    if (!rules || rules.length === 0) {
      return res.json({
        success: true,
        message: 'Không có quy tắc bảo dưỡng nào đang kích hoạt (ACTIVE) trong hệ thống SQLite!',
        createdCount: 0,
        skippedCount: 0,
        skippedRules: [],
        totalTreesScheduled: 0,
        orders: []
      });
    }

    const openOrders = await allSql(
      `SELECT route_id, type FROM work_orders WHERE status IN (${openStatusesPlaceholders})`,
      openStatuses
    );

    const openKeySet = new Set(openOrders.map((o) => `${o.route_id}__${o.type}`));
    const candidateRules = rules.filter((r) => !openKeySet.has(`${r.route_id}__${r.task_type}`));
    const skippedRules = rules.filter((r) => openKeySet.has(`${r.route_id}__${r.task_type}`));

    if (candidateRules.length === 0) {
      return res.json({
        success: true,
        message: 'Tất cả các tuyến và hạng mục bảo dưỡng hiện đã có Lệnh công tác đang hoạt động. Không sinh trùng lặp!',
        createdCount: 0,
        skippedCount: skippedRules.length,
        skippedRules: skippedRules.map((r) => r.name),
        totalTreesScheduled: 0,
        orders: [],
      });
    }

    const createdOrders = [];
    let totalTrees = 0;

    for (const rule of candidateRules) {
      const corridor = CITY_CORRIDORS.find((c) => c.id === rule.route_id) || {
        id: rule.route_id,
        code: rule.code,
        name: rule.name,
        zoneId: 'zone-ninh-kieu',
        searchKeyword: 'Hòa Bình'
      };

      await runSql('BEGIN IMMEDIATE TRANSACTION');
      try {
        // Concurrency Guard
        const concurrentCheck = await allSql(
          `SELECT id FROM work_orders WHERE route_id = ? AND type = ? AND status IN (${openStatusesPlaceholders})`,
          [corridor.id, rule.task_type, ...openStatuses]
        );
        if (concurrentCheck.length > 0) {
          await runSql('ROLLBACK');
          skippedRules.push(rule);
          continue;
        }

        let rTrees = await allSql(
          `SELECT id, tree_code, species, location_name FROM trees
           WHERE (address LIKE ? OR location_name LIKE ?) AND status != 'REMOVED'
           LIMIT 20`,
          [`%${corridor.searchKeyword}%`, `%${corridor.searchKeyword}%`]
        );
        const treesList = rTrees && rTrees.length > 0 ? rTrees : [];

        // Parse capabilities yêu cầu
        let ruleCapabilities = [];
        try {
          ruleCapabilities = JSON.parse(rule.required_capabilities || '[]');
        } catch (e) {
          ruleCapabilities = [];
        }

        // Dynamic Matching theo đúng loại công việc & khu vực
        const match = await findDynamicTeamAndEquipment({
          taskType: rule.task_type,
          requiredCapabilities: ruleCapabilities,
          zoneId: corridor.zoneId
        });

        const assignedTeam = match.team;
        const assignedEquipment = match.equipment;

        const orderId = `wo-sched-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
        const orderCode = `WO-AUTO-${corridor.code}-${Date.now().toString().slice(-4)}`;
        const title = `[Tự Động Theo Lịch] ${rule.name} - ${corridor.name}`;

        await runSql(
          `INSERT INTO work_orders (
            id, code, title, description, type, priority, scope_type,
            zone_id, route_id, route_corridor_name,
            status, workflow_status, scheduled_start, scheduled_end,
            required_capabilities, required_equipment_ids,
            assigned_team_id, assigned_team_name,
            assigned_vehicle_name, assigned_vehicle_plate,
            total_items, completed_items, skipped_items, failed_items, progress_percent,
            sla_target_minutes, is_overdue, created_by_user_id, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, 'ROUTE', ?, ?, ?, 'ASSIGNED', 'ASSIGNED', ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 240, 0, ?, ?, ?)`,
          [
            orderId,
            orderCode,
            title,
            `Tự động tạo theo quy tắc bảo dưỡng định kỳ đô thị (SQLite): ${rule.name}`,
            rule.task_type,
            rule.priority,
            corridor.zoneId,
            corridor.id,
            corridor.name,
            now,
            new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
            JSON.stringify(ruleCapabilities),
            JSON.stringify(assignedEquipment ? [assignedEquipment.id] : []),
            assignedTeam ? assignedTeam.id : null,
            assignedTeam ? assignedTeam.name : 'Đội Chăm Sóc Đô Thị',
            assignedEquipment ? assignedEquipment.name : null,
            assignedEquipment ? assignedEquipment.plate_number : null,
            treesList.length,
            actorId,
            now,
            now,
          ]
        );

        // Khóa thiết bị nếu có
        if (assignedEquipment) {
          await runSql(
            `UPDATE equipment SET status = 'IN_USE', current_work_order_id = ?, updated_at = ? WHERE id = ?`,
            [orderId, now, assignedEquipment.id]
          );
        }

        // Tăng tải cho tổ đội
        if (assignedTeam) {
          await runSql(
            `UPDATE teams SET active_work_orders_count = COALESCE(active_work_orders_count, 0) + 1, updated_at = ? WHERE id = ?`,
            [now, assignedTeam.id]
          );
        }

        for (let i = 0; i < treesList.length; i++) {
          const t = treesList[i];
          await runSql(
            `INSERT INTO work_order_items (
              id, work_order_id, tree_id, tree_street_code, tree_display_name,
              house_milestone, sequence, status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING', ?)`,
            [
              `wo-item-${orderId}-${i + 1}`,
              orderId,
              String(t.id),
              t.tree_code || `CT-${t.id}`,
              t.species || `Cây xanh #${t.id}`,
              t.location_name || corridor.name,
              i + 1,
              now,
            ]
          );
        }

        const histId = `wo-hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await runSql(
          `INSERT INTO work_order_history (
            id, work_order_id, actor_user_id, actor_name,
            previous_status, new_status, action, reason, created_at
          ) VALUES (?, ?, ?, ?, 'DRAFT', 'ASSIGNED', 'CREATE', 'Lập lịch tự động bởi Auto-Scheduler Engine (Quy tắc SQLite)', ?)`,
          [histId, orderId, actorId, actorName, now]
        );

        await runSql('COMMIT');

        createdOrders.push({
          id: orderId,
          code: orderCode,
          title,
          routeCorridorName: corridor.name,
          type: rule.task_type,
          totalItems: treesList.length,
          assignedTeamName: assignedTeam ? assignedTeam.name : null,
          assignedVehiclePlate: assignedEquipment ? assignedEquipment.plate_number : null
        });
        totalTrees += treesList.length;
      } catch (rErr) {
        await runSql('ROLLBACK').catch(() => {});
        console.error('Error creating auto-schedule order for rule:', rule.name, rErr);
      }
    }

    if (createdOrders.length > 0) {
      sseService.broadcast({
        eventType: 'auto_schedule.dispatched',
        entityType: 'work_order',
        entityId: `sched_${Date.now()}`,
        actor: { userId: (user && user.id) ? String(user.id) : 'system', role: user ? user.role : 'ADMIN', name: actorName },
        targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
        payload: {
          createdCount: createdOrders.length,
          skippedCount: skippedRules.length,
          totalTreesScheduled: totalTrees,
          orders: createdOrders.map((o) => ({ id: o.id, code: o.code, route: o.routeCorridorName }))
        }
      });
    }

    res.status(201).json({
      success: true,
      message: `⚡ Auto-Scheduler đã lập thành công ${createdOrders.length} Lệnh công tác theo tuyến (Bỏ qua ${skippedRules.length} tuyến đã có lệnh).`,
      createdCount: createdOrders.length,
      skippedCount: skippedRules.length,
      skippedRules: skippedRules.map((r) => r.name),
      totalTreesScheduled: totalTrees,
      orders: createdOrders,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ⛈️ WAVE 4.9: TIẾN ĐỘ THỜI GIAN THỰC CHIẾN DỊCH MÙA BÃO (SQLite Single Source of Truth)
 * Endpoint: GET /api/work-orders/campaigns/storm-status
 */
exports.getStormCampaignStatus = async (req, res) => {
  try {
    const now = new Date().toISOString();
    let campaigns = await allSql(`SELECT * FROM campaigns WHERE type = 'STORM_PREPARATION' ORDER BY created_at DESC LIMIT 1`);
    let campaign = campaigns[0];

    if (!campaign) {
      const riskTreesCountRes = await allSql(
        `SELECT COUNT(*) as c FROM trees WHERE (height_meter >= 7 OR diameter_cm >= 25) AND status != 'REMOVED'`
      );
      const initialDetected = riskTreesCountRes[0]?.c || 5398;

      const campId = 'campaign-storm-2026';
      const campCode = 'CAMP-STORM-2026';
      const campName = 'Chiến Dịch Rà Soát & Cắt Tỉa Hạ Độ Cao Đón Mùa Bão 2026';
      const history = JSON.stringify([
        {
          timestamp: now,
          event: 'DETECTED',
          details: `Hệ thống phân tích rủi ro phát hiện ${initialDetected} cây cao/tán rộng chưa cắt tỉa (>180 ngày).`
        }
      ]);

      await runSql(
        `INSERT INTO campaigns (
          id, code, name, type, status, target_scope,
          total_detected_trees, assigned_trees, in_progress_trees,
          field_completed_trees, verified_trees, resolved_trees,
          remaining_trees, created_at, updated_at, history_json
        ) VALUES (?, ?, ?, 'STORM_PREPARATION', 'ACTIVE', 'ALL_CITY', ?, 0, 0, 0, 0, 0, ?, ?, ?, ?)`,
        [campId, campCode, campName, initialDetected, initialDetected, now, now, history]
      );

      const created = await allSql(`SELECT * FROM campaigns WHERE id = ?`, [campId]);
      campaign = created[0];
    }

    // 1. Cây đã phân công trong các lệnh mở
    const assignedRes = await allSql(
      `SELECT COUNT(*) as c FROM work_order_items woi
       JOIN work_orders wo ON woi.work_order_id = wo.id
       WHERE (wo.campaign_id = ? ${campaign.target_scope === 'CONTROLLED_TEST' ? '' : "OR wo.type = 'PRUNING'"})
         AND wo.status IN ('ASSIGNED', 'ACCEPTED')`,
      [campaign.id]
    );
    const assignedTrees = assignedRes[0]?.c || 0;

    // 2. Cây đang thi công trong lệnh IN_PROGRESS
    const inProgressRes = await allSql(
      `SELECT COUNT(*) as c FROM work_order_items woi
       JOIN work_orders wo ON woi.work_order_id = wo.id
       WHERE (wo.campaign_id = ? ${campaign.target_scope === 'CONTROLLED_TEST' ? '' : "OR wo.type = 'PRUNING'"})
         AND wo.status = 'IN_PROGRESS'`,
      [campaign.id]
    );
    const inProgressTrees = inProgressRes[0]?.c || 0;

    // 3. Cây đã hoàn thành hiện trường (FIELD_COMPLETED)
    const fieldCompletedRes = await allSql(
      `SELECT COUNT(*) as c FROM work_order_items woi
       JOIN work_orders wo ON woi.work_order_id = wo.id
       WHERE (wo.campaign_id = ? ${campaign.target_scope === 'CONTROLLED_TEST' ? '' : "OR wo.type = 'PRUNING'"})
         AND woi.status = 'COMPLETED'
         AND wo.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW')`,
      [campaign.id]
    );
    const fieldCompletedTrees = fieldCompletedRes[0]?.c || 0;

    // 3.1. Cây bị chặn / không thể xử lý (BLOCKED)
    const blockedRes = await allSql(
      `SELECT COUNT(*) as c FROM work_order_items woi
       JOIN work_orders wo ON woi.work_order_id = wo.id
       WHERE (wo.campaign_id = ? ${campaign.target_scope === 'CONTROLLED_TEST' ? '' : "OR wo.type = 'PRUNING'"})
         AND woi.status IN ('SKIPPED', 'FAILED', 'NEEDS_FOLLOW_UP')
         AND wo.status IN ('ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'SUBMITTED_FOR_REVIEW')`,
      [campaign.id]
    );
    const blockedTrees = blockedRes[0]?.c || 0;

    // 4. Cây đã nghiệm thu chính thức bởi Giám sát và lệnh công tác đã hoàn thành
    let resolvedTrees = campaign.resolved_trees || 0;
    if (campaign.target_scope !== 'CONTROLLED_TEST') {
      const verifiedRes = await allSql(
        `SELECT COUNT(DISTINCT cr.tree_id) as c FROM care_records cr
         JOIN work_orders wo ON cr.work_order_id = wo.id
         WHERE cr.action_type = 'Cắt tỉa'
           AND cr.anchor_status = 'CONFIRMED'
           AND wo.status IN ('COMPLETED', 'VERIFIED', 'CLOSED')`
      );
      if (verifiedRes[0]?.c) {
        resolvedTrees = Math.max(resolvedTrees, verifiedRes[0].c);
      }
    }
    resolvedTrees = Math.min(campaign.total_detected_trees, resolvedTrees);
    const verifiedTrees = resolvedTrees;

    // 5. Đối soát dữ liệu bắt buộc (Wave 5.0 Reconciliation Guard):
    // TOTAL = VERIFIED + IN_PROGRESS + ASSIGNED + UNASSIGNED + BLOCKED
    const accountedTrees = verifiedTrees + inProgressTrees + assignedTrees + blockedTrees;
    const unassignedTrees = Math.max(0, campaign.total_detected_trees - accountedTrees);
    const remainingTrees = Math.max(0, campaign.total_detected_trees - verifiedTrees);

    // Xác định trạng thái vòng đời chiến dịch
    let status = 'ACTIVE';
    let resolvedAt = campaign.resolved_at;
    let historyArr = [];
    try {
      historyArr = JSON.parse(campaign.history_json || '[]');
    } catch {
      historyArr = [];
    }

    if (remainingTrees === 0 && campaign.total_detected_trees > 0) {
      status = 'RESOLVED';
      if (!resolvedAt) {
        resolvedAt = now;
        historyArr.push({
          timestamp: now,
          event: 'RESOLVED',
          details: `Chiến dịch đã hoàn thành! 100% (${campaign.total_detected_trees}/${campaign.total_detected_trees}) cây nguy cơ đã được rà soát và xử lý an toàn.`
        });
      }
    } else if (remainingTrees <= 50) {
      status = 'NEAR_COMPLETION';
    } else if (inProgressTrees > 0 || assignedTrees > 0 || fieldCompletedTrees > 0 || resolvedTrees > 0) {
      status = 'IN_PROGRESS';
    } else {
      status = 'ACTIVE';
    }

    await runSql(
      `UPDATE campaigns SET
        status = ?,
        assigned_trees = ?,
        in_progress_trees = ?,
        field_completed_trees = ?,
        verified_trees = ?,
        resolved_trees = ?,
        remaining_trees = ?,
        resolved_at = ?,
        history_json = ?,
        updated_at = ?
       WHERE id = ?`,
      [
        status,
        assignedTrees,
        inProgressTrees,
        fieldCompletedTrees,
        resolvedTrees,
        resolvedTrees,
        remainingTrees,
        resolvedAt,
        JSON.stringify(historyArr),
        now,
        campaign.id
      ]
    );

    return res.json({
      success: true,
      data: {
        id: campaign.id,
        code: campaign.code,
        name: campaign.name,
        type: campaign.type,
        status,
        totalDetectedTrees: campaign.total_detected_trees,
        assignedTrees,
        inProgressTrees,
        fieldCompletedTrees,
        verifiedTrees: resolvedTrees,
        resolvedTrees,
        remainingTrees,
        unassignedTrees,
        blockedTrees,
        reconciliationFormula: `${campaign.total_detected_trees} = ${resolvedTrees} (VERIFIED) + ${inProgressTrees} (IN_PROGRESS) + ${assignedTrees} (ASSIGNED) + ${unassignedTrees} (UNASSIGNED) + ${blockedTrees} (BLOCKED)`,
        isReconciled: campaign.total_detected_trees === (resolvedTrees + inProgressTrees + assignedTrees + unassignedTrees + blockedTrees),
        resolvedAt,
        history: historyArr
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 🧪 KHỞI TẠO ĐỢT KIỂM CHỨNG CHIẾN DỊCH BÃO CÓ KIỂM SOÁT (N CÂY)
 * Phục vụ Acceptance Audit: Ticker = N -> Dispatch -> Staff Execute -> Verify -> Ticker = 0 (RESOLVED)
 */
exports.initTestStormBatch = async (req, res) => {
  const user = req.user;
  const { totalTrees = 10, name = 'Chiến Dịch Thử Nghiệm Kiểm Chứng Mùa Bão' } = req.body;
  const now = new Date().toISOString();
  const campId = 'campaign-storm-2026';

  try {
    // Dọn sạch các lệnh kiểm thử cũ để đảm bảo tính độc lập và môi trường sạch cho đợt test
    await runSql(`DELETE FROM work_order_items WHERE work_order_id IN (SELECT id FROM work_orders WHERE code LIKE 'WO-STORM-TEST-%')`);
    await runSql(`DELETE FROM work_orders WHERE code LIKE 'WO-STORM-TEST-%'`);

    const history = [
      {
        timestamp: now,
        event: 'TEST_INIT',
        details: `Khởi tạo đợt kiểm chứng nghiệp vụ với số lượng kiểm soát ${totalTrees} cây cảnh báo bão.`
      }
    ];

    await runSql(
      `INSERT OR REPLACE INTO campaigns (
        id, code, name, type, status, target_scope,
        total_detected_trees, assigned_trees, in_progress_trees,
        field_completed_trees, verified_trees, resolved_trees,
        remaining_trees, created_at, updated_at, resolved_at, history_json
      ) VALUES (?, 'CAMP-STORM-TEST', ?, 'STORM_PREPARATION', 'ACTIVE', 'CONTROLLED_TEST', ?, 0, 0, 0, 0, 0, ?, ?, ?, NULL, ?)`,
      [campId, name, totalTrees, totalTrees, now, now, JSON.stringify(history)]
    );

    sseService.broadcast({
      eventType: 'campaign.updated',
      entityType: 'campaign',
      entityId: campId,
      actor: { userId: user?.id || 'admin', role: user?.role || 'ADMIN', name: user?.full_name || 'Admin' },
      targetRoles: ['ADMIN', 'STAFF', 'DISPATCHER'],
      payload: {
        id: campId,
        status: 'ACTIVE',
        totalDetectedTrees: totalTrees,
        remainingTrees: totalTrees,
        resolvedTrees: 0
      }
    });

    return res.json({
      success: true,
      message: `Đã khởi tạo đợt kiểm thử chiến dịch bão thành công với ${totalTrees} cây.`,
      campaign: {
        id: campId,
        totalDetectedTrees: totalTrees,
        remainingTrees: totalTrees,
        status: 'ACTIVE'
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ⚡ BATCH RESOLUTION: KTV GHI NHẬN HOÀN TẤT CHECKLIST NHIỀU CÂY CÙNG LÚC
 * Endpoint: POST /api/work-orders/campaigns/storm/batch-complete-items
 */
exports.batchCompleteItems = async (req, res) => {
  const user = req.user;
  const { itemIds = [], notes, evidenceImageUrl, status = 'COMPLETED' } = req.body;
  const now = new Date().toISOString();
  const completedByUserId = (user && user.id) ? String(user.id) : 'staff-field';
  const completedByName = (user && (user.full_name || user.username)) || 'KTV Hiện trường';

  if (!Array.isArray(itemIds) || itemIds.length === 0) {
    return res.status(400).json({ success: false, message: 'Danh sách itemIds không được rỗng.' });
  }

  try {
    await runSql('BEGIN TRANSACTION');

    const placeholders = itemIds.map(() => '?').join(',');
    const items = await allSql(`SELECT * FROM work_order_items WHERE id IN (${placeholders})`, itemIds);

    if (items.length === 0) {
      await runSql('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Không tìm thấy các mục công việc yêu cầu.' });
    }

    const orderId = items[0].work_order_id;
    const parentOrders = await allSql(`SELECT * FROM work_orders WHERE id = ?`, [orderId]);
    const parentOrder = parentOrders[0];
    const actionType = parentOrder?.type === 'PRUNING' ? 'Cắt tỉa' : (parentOrder?.type === 'WATERING' ? 'Tưới nước' : 'Bón phân');

    for (const item of items) {
      await runSql(
        `UPDATE work_order_items SET
          status = ?,
          notes = COALESCE(?, notes),
          evidence_after_image_url = COALESCE(?, evidence_after_image_url),
          completed_at = ?,
          completed_by = ?,
          completed_by_user_id = ?
        WHERE id = ?`,
        [status, notes || null, evidenceImageUrl || null, now, completedByName, completedByUserId, item.id]
      );

      if (status === 'COMPLETED') {
        const rawTreeId = parseInt(item.tree_id, 10) || 1;
        const existingCare = await allSql(`SELECT id FROM care_records WHERE work_order_id = ? AND tree_id = ?`, [orderId, rawTreeId]);
        if (existingCare.length === 0) {
          const careCode = `CARE-WO-${Date.now().toString().slice(-6)}-${item.sequence || Math.floor(Math.random() * 1000)}`;
          const notesText = notes || `Hoàn tất thi công hiện trường theo lệnh [${parentOrder?.code || orderId}].`;
          await runSql(
            `INSERT INTO care_records (
              care_code, tree_id, tree_code, staff_id, caretaker_name,
              action_type, health_before, health_after, notes, image_after_url,
              action_date, created_at, anchor_status, work_order_id, work_order_code
            ) VALUES (?, ?, ?, ?, ?, ?, 'FAIR', 'FAIR', ?, ?, ?, ?, 'PENDING_VERIFICATION', ?, ?)`,
            [
              careCode,
              rawTreeId,
              item.tree_street_code || `CT-${rawTreeId}`,
              parseInt(completedByUserId, 10) || 1,
              completedByName,
              actionType,
              notesText,
              evidenceImageUrl || item.evidence_after_image_url || null,
              now,
              now,
              orderId,
              parentOrder?.code || 'WO-STORM'
            ]
          );
        }
      }
    }

    const siblingItems = await allSql(`SELECT status FROM work_order_items WHERE work_order_id = ?`, [orderId]);
    const total = siblingItems.length;
    const completed = siblingItems.filter((i) => i.status === 'COMPLETED').length;
    const skipped = siblingItems.filter((i) => i.status === 'SKIPPED').length;
    const failed = siblingItems.filter((i) => i.status === 'FAILED' || i.status === 'NEEDS_FOLLOW_UP').length;
    const progress = total > 0 ? Math.round(((completed + skipped) / total) * 100) : 0;
    const allHandled = (completed + skipped + failed) >= total && total > 0;

    let nextOrderStatusSql = '';
    const updateParams = [total, completed, skipped, failed, progress, now];

    if (allHandled) {
      nextOrderStatusSql = ", status = CASE WHEN status = 'IN_PROGRESS' THEN 'SUBMITTED_FOR_REVIEW' ELSE status END, workflow_status = CASE WHEN workflow_status = 'IN_PROGRESS' THEN 'SUBMITTED_FOR_REVIEW' ELSE workflow_status END, actual_end = COALESCE(actual_end, ?)";
      updateParams.push(now);
    }
    updateParams.push(orderId);

    await runSql(
      `UPDATE work_orders SET
        total_items = ?,
        completed_items = ?,
        skipped_items = ?,
        failed_items = ?,
        progress_percent = ?,
        updated_at = ?
        ${nextOrderStatusSql}
      WHERE id = ?`,
      updateParams
    );

    await runSql('COMMIT');

    const updatedOrderRows = await allSql(`SELECT * FROM work_orders WHERE id = ?`, [orderId]);
    const updatedOrder = mapWorkOrderFromRow(updatedOrderRows[0]);

    sseService.broadcast({
      eventType: 'work_order.checklist_updated',
      entityType: 'work_order',
      entityId: orderId,
      actor: { userId: completedByUserId, role: user?.role || 'STAFF', name: completedByName },
      targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
      payload: {
        orderId,
        updatedCount: items.length,
        totalItems: total,
        completedItems: completed,
        progressPercent: progress,
        orderStatus: updatedOrder.status
      }
    });

    sseService.broadcast({
      eventType: 'care_record.created',
      entityType: 'care_record',
      entityId: `care-batch-${orderId}`,
      actor: { userId: completedByUserId, role: user?.role || 'STAFF', name: completedByName },
      targetRoles: ['ADMIN', 'DISPATCHER', 'STAFF'],
      payload: {
        orderId,
        completedCount: items.length
      }
    });

    return res.json({
      success: true,
      message: `Đã cập nhật hoàn tất hàng loạt ${items.length} cây trên tuyến.`,
      order: updatedOrder
    });
  } catch (err) {
    try { await runSql('ROLLBACK'); } catch {}
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * 8. POST /api/work-orders/purge-all
 * Dọn sạch toàn bộ 155 lệnh công tác rác/test và tái tạo 3 lệnh chuẩn mẫu
 */
exports.purgeAllWorkOrders = async (req, res) => {
  try {
    await runSql('BEGIN TRANSACTION');

    await runSql('DELETE FROM work_order_history');
    await runSql('DELETE FROM work_order_items');
    await runSql('DELETE FROM work_orders');

    const now = new Date().toISOString();
    await runSql("UPDATE equipment SET status = 'AVAILABLE', current_work_order_id = NULL, updated_at = ?", [now]);
    await runSql("UPDATE teams SET active_work_orders_count = 0, current_status = 'AVAILABLE', updated_at = ?", [now]);
    await runSql("UPDATE incidents SET work_order_id = NULL, work_order_code = NULL, updated_at = ?", [now]);

    const seedOrders = [
      {
        id: 'wo-clean-01',
        code: 'WO-STORM-HB-01',
        title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đại Lộ Hòa Bình',
        type: 'PRUNING',
        priority: 'CRITICAL',
        status: 'IN_PROGRESS',
        workflow_status: 'IN_PROGRESS',
        scope_type: 'ROUTE',
        zone_id: 'ninh-kieu',
        route_id: 'corridor-hoa-binh',
        route_corridor_name: 'Đại Lộ Hòa Bình',
        assigned_team_id: 'team-1',
        assigned_team_name: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
        assigned_vehicle_name: 'Xe Thang Nâng Người Chuyên Dụng 18m',
        assigned_vehicle_plate: '65A-0892',
        total_items: 20,
        completed_items: 12,
        progress_percent: 60,
      },
      {
        id: 'wo-clean-02',
        code: 'WO-STORM-304-02',
        title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đường 30 Tháng 4',
        type: 'PRUNING',
        priority: 'HIGH',
        status: 'ASSIGNED',
        workflow_status: 'ASSIGNED',
        scope_type: 'ROUTE',
        zone_id: 'ninh-kieu',
        route_id: 'corridor-30-4',
        route_corridor_name: 'Đường 30 Tháng 4',
        assigned_team_id: 'team-2',
        assigned_team_name: 'Tổ Bảo Dưỡng & Cắt Cành Số 2 (Cái Răng)',
        assigned_vehicle_name: 'Xe Cẩu Thùng Chuyên Dụng 5 Tấn',
        assigned_vehicle_plate: '65A-1104',
        total_items: 20,
        completed_items: 0,
        progress_percent: 0,
      },
      {
        id: 'wo-clean-03',
        code: 'WO-STORM-CMT8-03',
        title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đường Cách Mạng Tháng 8',
        type: 'PRUNING',
        priority: 'CRITICAL',
        status: 'SUBMITTED_FOR_REVIEW',
        workflow_status: 'SUBMITTED_FOR_REVIEW',
        scope_type: 'ROUTE',
        zone_id: 'binh-thuy',
        route_id: 'corridor-cmt8',
        route_corridor_name: 'Đường Cách Mạng Tháng 8',
        assigned_team_id: 'team-3',
        assigned_team_name: 'Đội Cơ Động Ứng Cứu Khẩn Cấp Bão Lũ',
        assigned_vehicle_name: 'Xe Thang Nâng Người 24m',
        assigned_vehicle_plate: '65A-012.34',
        total_items: 20,
        completed_items: 20,
        progress_percent: 100,
      }
    ];

    for (let oIdx = 0; oIdx < seedOrders.length; oIdx++) {
      const wo = seedOrders[oIdx];
      await runSql(
        `INSERT INTO work_orders (
          id, code, title, type, priority, status, workflow_status, scope_type,
          zone_id, route_id, route_corridor_name, assigned_team_id, assigned_team_name,
          assigned_vehicle_name, assigned_vehicle_plate, total_items, completed_items,
          progress_percent, scheduled_start, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          wo.id, wo.code, wo.title, wo.type, wo.priority, wo.status, wo.workflow_status, wo.scope_type,
          wo.zone_id, wo.route_id, wo.route_corridor_name, wo.assigned_team_id, wo.assigned_team_name,
          wo.assigned_vehicle_name, wo.assigned_vehicle_plate, wo.total_items, wo.completed_items,
          wo.progress_percent, now, now, now
        ]
      );

      const trees = await allSql('SELECT id, tree_code FROM trees LIMIT 20 OFFSET ?', [oIdx * 20]);
      for (let i = 0; i < trees.length; i++) {
        const t = trees[i];
        const isItemDone = (wo.status === 'SUBMITTED_FOR_REVIEW') || (wo.status === 'IN_PROGRESS' && i < 12);
        await runSql(
          `INSERT INTO work_order_items (
            id, work_order_id, tree_id, tree_code, sequence_order,
            status, completed_at, completed_by, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `item-${wo.id}-${i + 1}`,
            wo.id,
            t.id,
            t.tree_code || `CT-${t.id}`,
            i + 1,
            isItemDone ? 'COMPLETED' : 'PENDING',
            isItemDone ? now : null,
            isItemDone ? 'Kỹ thuật viên' : null,
            isItemDone ? 'Đã cắt tỉa hạ tán an toàn theo quy chuẩn kỹ thuật' : null,
            now,
            now
          ]
        );
      }
    }

    await runSql("UPDATE equipment SET status = 'IN_USE', current_work_order_id = 'wo-clean-01' WHERE license_plate = '65A-0892'");
    await runSql("UPDATE equipment SET status = 'IN_USE', current_work_order_id = 'wo-clean-02' WHERE license_plate = '65A-1104'");
    await runSql("UPDATE equipment SET status = 'IN_USE', current_work_order_id = 'wo-clean-03' WHERE license_plate = '65A-012.34'");

    await runSql("UPDATE teams SET active_work_orders_count = 1, current_status = 'DISPATCHED' WHERE id IN ('team-1', 'team-2', 'team-3')");

    await runSql('COMMIT');

    sseService.broadcast({
      eventType: 'work_orders.purged',
      entityType: 'work_order',
      entityId: 'all',
      payload: { message: 'Đã dọn dẹp và reset danh sách lệnh công tác' }
    });

    return res.json({
      success: true,
      message: '🧹 Đã dọn sạch các lệnh cũ và tái lập 3 lệnh công tác chuẩn mẫu sạch đẹp!'
    });
  } catch (err) {
    try { await runSql('ROLLBACK'); } catch {}
    console.error('Lỗi dọn sạch work orders:', err);
    return res.status(500).json({ success: false, message: 'Lỗi dọn dẹp lệnh công tác: ' + err.message });
  }
};
