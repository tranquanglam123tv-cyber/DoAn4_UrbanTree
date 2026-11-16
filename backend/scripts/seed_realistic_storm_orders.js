/**
 * UrbanTree - Realistic Storm Orders & Tree Items Seeder (Wave 5.0)
 * Usage: node backend/scripts/seed_realistic_storm_orders.js
 * 
 * Partitions the 5,424 risk trees into realistic, multi-tree Work Orders
 * (48 trees on Hòa Bình, 50 trees on 30/4, 45 trees on CMT8, 42 trees on 3/2, 40 trees on VVK)
 * with real work_order_items linked to trees.id and assigned to team-prune-1 and team-prune-2.
 */

const path = require('path');
const sqlite3 = require(path.resolve(__dirname, '../src/config/db')).db ? null : require('sqlite3').verbose();
const db = require(path.resolve(__dirname, '../src/config/db'));

function runSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allSql(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function main() {
  console.log('🌪️ [Wave 5.0] Seeding Realistic Storm Work Orders & Multi-Tree Items...');

  // 1. Fetch risk trees
  const riskTrees = await allSql(
    `SELECT id, tree_code, species, height_meter, diameter_cm, address, location_name
     FROM trees
     WHERE (height_meter >= 7 OR diameter_cm >= 25) AND status != 'REMOVED'
     ORDER BY id ASC`
  );

  console.log(`📊 Tổng số cây nguy cơ bão phát hiện trong SQLite: ${riskTrees.length} cây.`);
  if (riskTrees.length < 225) {
    console.warn('⚠️ Cảnh báo: Số lượng cây ít hơn 225 cây, sẽ dùng modulo để gán.');
  }

  const now = new Date().toISOString();
  const campId = 'campaign-storm-2026';

  // 2. Định nghĩa các tuyến hành lang trọng điểm và khối lượng thực tế
  const corridors = [
    {
      id: 'wo-storm-hb-48',
      code: 'WO-STORM-HB-48',
      title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đại Lộ Hòa Bình',
      routeId: 'route-hoa-binh',
      corridorName: 'Đại Lộ Hòa Bình',
      prefix: 'HB',
      count: 48,
      completedCount: 26,
      status: 'IN_PROGRESS',
      teamId: 'team-prune-1',
      teamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
      vehicleName: 'Xe Thang Tự Hành Nâng Cao 18m (65A-0892)',
      vehiclePlate: '65A-0892',
      priority: 'CRITICAL'
    },
    {
      id: 'wo-storm-304-50',
      code: 'WO-STORM-304-50',
      title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đường 30 Tháng 4',
      routeId: 'route-304',
      corridorName: 'Đường 30 Tháng 4',
      prefix: '30T4',
      count: 50,
      completedCount: 0,
      status: 'ASSIGNED',
      teamId: 'team-prune-1',
      teamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
      vehicleName: 'Xe Thang Tự Hành Nâng Cao 14m (65A-1104)',
      vehiclePlate: '65A-1104',
      priority: 'CRITICAL'
    },
    {
      id: 'wo-storm-cmt8-45',
      code: 'WO-STORM-CMT8-45',
      title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đường Cách Mạng Tháng 8',
      routeId: 'route-cmt8',
      corridorName: 'Đường Cách Mạng Tháng 8',
      prefix: 'CMT8',
      count: 45,
      completedCount: 15,
      status: 'IN_PROGRESS',
      teamId: 'team-prune-2',
      teamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 2 (Bình Thủy)',
      vehicleName: 'Xe Thang Tự Hành Nâng Cao 18m (65A-0892)',
      vehiclePlate: '65A-0892',
      priority: 'CRITICAL'
    },
    {
      id: 'wo-storm-32-42',
      code: 'WO-STORM-32-42',
      title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đường 3 Tháng 2',
      routeId: 'route-32',
      corridorName: 'Đường 3 Tháng 2',
      prefix: '3T2',
      count: 42,
      completedCount: 42,
      status: 'SUBMITTED_FOR_REVIEW',
      teamId: 'team-prune-2',
      teamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 2 (Bình Thủy)',
      vehicleName: 'Xe Thang Tự Hành Nâng Cao 14m (65A-1104)',
      vehiclePlate: '65A-1104',
      priority: 'CRITICAL'
    },
    {
      id: 'wo-storm-vvk-40',
      code: 'WO-STORM-VVK-40',
      title: '[KHẨN CẤP MÙA BÃO] Cắt tỉa hạ tán giải tỏa hiểm họa - Đại Lộ Võ Văn Kiệt',
      routeId: 'route-vvk',
      corridorName: 'Đại Lộ Võ Văn Kiệt',
      prefix: 'VVK',
      count: 40,
      completedCount: 40,
      status: 'COMPLETED',
      teamId: 'team-prune-1',
      teamName: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
      vehicleName: 'Xe Bồn Phun Áp Lực Tưới Rễ 8m³ (65C-3321)',
      vehiclePlate: '65C-3321',
      priority: 'HIGH'
    }
  ];

  // 3. Xóa các lệnh công tác mẫu thử nghiệm cũ có tiền tố wo-storm-
  await runSql(`DELETE FROM work_order_items WHERE work_order_id LIKE 'wo-storm-%'`);
  await runSql(`DELETE FROM work_orders WHERE id LIKE 'wo-storm-%'`);

  let treePointer = 0;
  let totalSeededItems = 0;

  for (const corr of corridors) {
    const progressPercent = Math.round((corr.completedCount / corr.count) * 100);

    try {
      await runSql(
        `INSERT INTO work_orders (
          id, code, title, description, type, priority, scope_type,
          route_id, route_corridor_name, status, workflow_status, sla_status,
          scheduled_start, scheduled_end, required_capabilities,
          assigned_team_id, assigned_team_name, assigned_vehicle_name, assigned_vehicle_plate,
          total_items, completed_items, skipped_items, failed_items, progress_percent,
          created_by_user_id, created_at, updated_at, campaign_id
        ) VALUES (
          ?, ?, ?, ?, 'PRUNING', ?, 'ROUTE_CORRIDOR',
          ?, ?, ?, ?, 'WITHIN_SLA',
          ?, ?, '["AERIAL_PLATFORM","HEAVY_PRUNING"]',
          ?, ?, ?, ?,
          ?, ?, 0, 0, ?,
          '1', ?, ?, ?
        )`,
        [
          corr.id,
          corr.code,
          corr.title,
          `Chiến dịch rà soát cắt tỉa cành nguy hiểm mùa bão tại ${corr.corridorName}. Khối lượng: ${corr.count} cây.`,
          corr.priority,
          corr.routeId,
          corr.corridorName,
          corr.status,
          corr.status,
          now,
          new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
          corr.teamId,
          corr.teamName,
          corr.vehicleName,
          corr.vehiclePlate,
          corr.count,
          corr.completedCount,
          progressPercent,
          now,
          now,
          campId
        ]
      );
    } catch (woErr) {
      console.error('Lỗi chèn work_order:', corr.id, woErr);
      throw woErr;
    }

    // Chèn items cho work order này
    for (let seq = 1; seq <= corr.count; seq++) {
      const tree = riskTrees[treePointer % riskTrees.length];
      treePointer++;

      const isCompleted = seq <= corr.completedCount;
      const itemId = `wo-item-${corr.id}-${seq}`;
      const streetCode = `${corr.prefix}-${String(seq).padStart(2, '0')}`;
      const milestone = `Số ${seq * 2} ${corr.corridorName}`;
      const itemStatus = isCompleted ? 'COMPLETED' : 'PENDING';
      const completedAt = isCompleted ? now : null;
      const completedBy = isCompleted ? 'Trần Quang Lâm' : null;
      const completedUserId = isCompleted ? '2' : null;

      try {
        await runSql(
          `INSERT INTO work_order_items (
            id, work_order_id, tree_id, tree_street_code, tree_display_name,
            house_milestone, sequence, status, result, reason,
            completed_at, completed_by, completed_by_user_id,
            evidence_before_image_url, evidence_after_image_url,
            notes, created_at
          ) VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?
          )`,
          [
            itemId,
            corr.id,
            tree.id,
            streetCode,
            tree.species || 'Cây Xanh Đô Thị',
            milestone,
            seq,
            itemStatus,
            isCompleted ? 'Đã cắt tỉa hạ ngọn an toàn đón bão' : null,
            'Cây cao/tán vươn rộng nguy cơ gãy đổ mùa mưa bão',
            completedAt,
            completedBy,
            completedUserId,
            'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&w=800&q=80',
            isCompleted ? 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80' : null,
            isCompleted ? 'Đã thi công cắt tỉa đúng quy chuẩn BS 5837' : null,
            now
          ]
        );
      } catch (itemErr) {
        console.error('Lỗi chèn item:', itemId, itemErr);
        throw itemErr;
      }

      // Nếu đã hoàn thành, ghi nhận nhật ký care_records và cập nhật trạng thái cây
      if (isCompleted) {
        try {
          await runSql(
            `INSERT INTO care_records (
              tree_id, tree_code, action_type, notes,
              caretaker_name, health_after, image_after_url,
              action_date, created_at, anchor_status, work_order_id, work_order_code
            ) VALUES (?, ?, 'Cắt tỉa', ?, 'Trần Quang Lâm', 'Tốt', ?, ?, ?, 'VERIFIED', ?, ?)`,
            [
              tree.id,
              tree.tree_code || streetCode,
              `Cắt tỉa hạ tán giải tỏa hiểm họa mùa bão - ${corr.corridorName}`,
              'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=800&q=80',
              now,
              now,
              corr.id,
              corr.code
            ]
          );
        } catch (careErr) {
          console.error('Lỗi chèn care_record cho tree_id:', tree.id, careErr);
          throw careErr;
        }

        await runSql(`UPDATE trees SET health_status = 'Tốt', updated_at = ? WHERE id = ?`, [now, tree.id]);
      }

      totalSeededItems++;
    }

    console.log(`✅ Tuyến [${corr.corridorName}]: Tạo thành công ${corr.count} cây checklist (${corr.completedCount} hoàn tất, ${corr.count - corr.completedCount} đang chờ).`);
  }

  // 4. Cập nhật Campaign Đón Bão
  const totalDetected = 5424;
  const verifiedCount = 40; // Lệnh VVK đã nghiệm thu hoàn thành
  const remaining = totalDetected - verifiedCount;

  await runSql(
    `INSERT OR REPLACE INTO campaigns (
      id, code, name, type, status, target_scope,
      total_detected_trees, assigned_trees, in_progress_trees,
      field_completed_trees, verified_trees, resolved_trees,
      remaining_trees, created_at, updated_at, history_json
    ) VALUES (
      ?, 'CAMP-STORM-2026', 'Chiến Dịch Rà Soát & Cắt Tỉa Hạ Độ Cao Đón Mùa Bão 2026',
      'STORM_PREPARATION', 'IN_PROGRESS', 'ALL_CITY',
      ?, 50, 93, 41, ?, ?,
      ?, ?, ?, ?
    )`,
    [
      campId,
      totalDetected,
      verifiedCount,
      verifiedCount,
      remaining,
      now,
      now,
      JSON.stringify([
        {
          timestamp: now,
          event: 'CITY_SCALE_DISPATCH',
          details: `Đã phân bổ 5 đại công trình cắt tỉa hạ tán trên các trục lộ huyết mạch Ninh Kiều & Bình Thủy với tổng khối lượng ${totalSeededItems} cây.`
        }
      ])
    ]
  );

  console.log(`\n🎉 HOÀN THÀNH SEED DỮ LIỆU THỰC TẾ WAVE 5.0!`);
  console.log(`- Đã khởi tạo 5 Lệnh Công Tác Mùa Bão quy mô lớn: 225 cây checklist thật.`);
  console.log(`- Trực tiếp liên kết khóa ngoại cây, xe thang và 2 tổ cơ giới.`);
  console.log(`- Chiến dịch Bão: 5.424 cây toàn thành, 40 cây đã hoàn thành nghiệm thu, còn tồn 5.384 cây.`);
}

main().catch((err) => {
  console.error('❌ Lỗi khi seed dữ liệu thực tế:', err);
  process.exit(1);
});
