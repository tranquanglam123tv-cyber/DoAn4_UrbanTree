/**
 * UrbanTree - Developer Seed Script for Work Orders, Teams & Equipment
 * Usage: node backend/scripts/seed_work_orders.js
 * Explicitly run by developers; NEVER run automatically on server start.
 */

const sqlite3 = require('../node_modules/sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../urbantree.db');
const db = new sqlite3.Database(dbPath);

console.log('🌱 Seeding initial Teams, Equipment and sample Work Orders into SQLite...');

const TEAMS = [
  {
    id: 'team-prune-1',
    code: 'TEAM-PRUNE-01',
    name: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 1 (Ninh Kiều)',
    leader_user_id: '2',
    leader_name: 'Trần Quang Lâm',
    leader_phone: '0912 345 601',
    member_user_ids: JSON.stringify(['2', '3']),
    capabilities: JSON.stringify(['AERIAL_PLATFORM', 'HEAVY_PRUNING', 'TREE_REMOVAL']),
    assigned_equipment_ids: JSON.stringify(['eq-truck-18m-01']),
    assigned_zone_id: 'zone-ninh-kieu'
  },
  {
    id: 'team-care-1',
    code: 'TEAM-CARE-01',
    name: 'Tổ Chăm Sóc & Dưỡng Hộ Lâm Sinh (Ninh Kiều)',
    leader_user_id: '3',
    leader_name: 'Lê Tuấn Anh',
    leader_phone: '0912 345 602',
    member_user_ids: JSON.stringify(['3']),
    capabilities: JSON.stringify(['WATERING', 'FERTILIZING', 'PEST_CONTROL']),
    assigned_equipment_ids: JSON.stringify(['eq-water-truck-01']),
    assigned_zone_id: 'zone-ninh-kieu'
  },
  {
    id: 'team-prune-2',
    code: 'TEAM-PRUNE-02',
    name: 'Tổ Cơ Giới Cắt Tỉa Hạ Tán Số 2 (Bình Thủy)',
    leader_user_id: '3',
    leader_name: 'Nguyễn Văn Hùng',
    leader_phone: '0912 345 603',
    member_user_ids: JSON.stringify(['3']),
    capabilities: JSON.stringify(['AERIAL_PLATFORM', 'HEAVY_PRUNING', 'PEST_CONTROL']),
    assigned_equipment_ids: JSON.stringify(['eq-truck-14m-02']),
    assigned_zone_id: 'zone-binh-thuy'
  }
];

const EQUIPMENT = [
  {
    id: 'eq-truck-18m-01',
    code: 'EQ-XT-18M-01',
    name: 'Xe Thang Tự Hành Nâng Cao 18m (65A-0892)',
    type: 'AERIAL_LADDER_TRUCK',
    plate_number: '65A-0892',
    status: 'AVAILABLE',
    capabilities: JSON.stringify(['AERIAL_PLATFORM', 'HEAVY_PRUNING']),
    assigned_team_id: 'team-prune-1'
  },
  {
    id: 'eq-water-truck-01',
    code: 'EQ-XB-01',
    name: 'Xe Bồn Phun Áp Lực Tưới Rễ 8m³ (65C-3321)',
    type: 'WATER_TANK_TRUCK',
    plate_number: '65C-3321',
    status: 'AVAILABLE',
    capabilities: JSON.stringify(['WATERING', 'FERTILIZING']),
    assigned_team_id: 'team-care-1'
  },
  {
    id: 'eq-truck-14m-02',
    code: 'EQ-XT-14M-02',
    name: 'Xe Thang Tự Hành Nâng Cao 14m (65A-1104)',
    type: 'AERIAL_LADDER_TRUCK',
    plate_number: '65A-1104',
    status: 'AVAILABLE',
    capabilities: JSON.stringify(['AERIAL_PLATFORM', 'HEAVY_PRUNING']),
    assigned_team_id: 'team-prune-2'
  }
];

db.serialize(() => {
  // 1. Seed Teams
  const teamStmt = db.prepare(`
    INSERT OR REPLACE INTO teams (
      id, code, name, leader_user_id, leader_name, leader_phone,
      member_user_ids, capabilities, assigned_equipment_ids, assigned_zone_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of TEAMS) {
    teamStmt.run([
      t.id, t.code, t.name, t.leader_user_id, t.leader_name, t.leader_phone,
      t.member_user_ids, t.capabilities, t.assigned_equipment_ids, t.assigned_zone_id
    ]);
  }
  teamStmt.finalize();
  console.log(`✅ Seeded ${TEAMS.length} teams.`);

  // 2. Seed Equipment
  const eqStmt = db.prepare(`
    INSERT OR REPLACE INTO equipment (
      id, code, name, type, plate_number, status, capabilities, assigned_team_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const e of EQUIPMENT) {
    eqStmt.run([e.id, e.code, e.name, e.type, e.plate_number, e.status, e.capabilities, e.assigned_team_id]);
  }
  eqStmt.finalize();
  console.log(`✅ Seeded ${EQUIPMENT.length} equipment.`);

  db.close(() => {
    console.log('🎉 Seed completed successfully!');
  });
});

