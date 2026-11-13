const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../urbantree.db');
const geojsonPath = path.resolve(__dirname, '../../tailieu/exportDuLieuCayXanh.geojson');

console.log('🚀 Đang khởi động tiến trình nạp dữ liệu chuẩn Production cho UrbanTree Database...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Không thể mở database SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Đã kết nối SQLite Database:', dbPath);
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = OFF;'); // Tắt tạm foreign key để seed nhanh
  db.run('BEGIN TRANSACTION;');

  // 1. LOÀI CÂY (tree_types)
  const treeTypes = [
    { id: 1, name: 'Cây Bàng Đài Loan', scientific: 'Terminalia mantaly', desc: 'Cây bóng mát tán tầng, rễ cọc bám sâu, ít gãy đổ mùa mưa bão.' },
    { id: 2, name: 'Cây Me Tây', scientific: 'Samanea saman', desc: 'Tán lá rộng xòe tròn, che mát diện rộng trên các tuyến phố lớn.' },
    { id: 3, name: 'Cây Sao Đen', scientific: 'Hopea odorata', desc: 'Cây gỗ quý bản địa nhóm II, thân thẳng tắp, chịu gió bão ven sông rất tốt.' },
    { id: 4, name: 'Cây Giáng Hương', scientific: 'Pterocarpus macrocarpus', desc: 'Cây đô thị hoa vàng thơm ngát, gỗ tốt, thích hợp cảnh quan trung tâm.' },
    { id: 5, name: 'Cây Dầu Rái', scientific: 'Dipterocarpus alatus', desc: 'Cây cổ thụ cao lớn, sức sống bền bỉ qua hàng trăm năm.' }
  ];

  const stmtType = db.prepare(`
    INSERT OR REPLACE INTO tree_types (id, name, scientific_name, description, status)
    VALUES (?, ?, ?, ?, 'ACTIVE')
  `);
  treeTypes.forEach(t => stmtType.run(t.id, t.name, t.scientific, t.desc));
  stmtType.finalize();
  console.log(`✅ Đã nạp ${treeTypes.length} danh mục loài cây (tree_types).`);

  // 2. TÀI KHOẢN NGƯỜI DÙNG (users)
  const users = [
    {
      id: 1,
      username: 'admin',
      email: 'admin@urbantree.vn',
      fullName: 'Đặng Thế Thuận',
      phone: '0903 123 456',
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    {
      id: 2,
      username: 'staff_lam',
      email: 'lam@urbantree.vn',
      fullName: 'Trần Quang Lâm',
      phone: '0912 345 678',
      role: 'STAFF',
      status: 'ACTIVE'
    },
    {
      id: 3,
      username: 'staff_tuananh',
      email: 'tuananh@urbantree.vn',
      fullName: 'Lê Tuấn Anh',
      phone: '0987 654 321',
      role: 'STAFF',
      status: 'ACTIVE'
    },
    {
      id: 4,
      username: 'citizen_an',
      email: 'nguyenvanan@gmail.com',
      fullName: 'Nguyễn Văn An (Công Dân Xanh)',
      phone: '0903 847 291',
      role: 'CITIZEN',
      status: 'ACTIVE'
    }
  ];

  const stmtUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, email, full_name, phone, role, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  users.forEach(u => stmtUser.run(u.id, u.username, u.email, u.fullName, u.phone, u.role, u.status));
  stmtUser.finalize();
  console.log(`✅ Đã nạp ${users.length} tài khoản người dùng chuẩn (users).`);

  // 3. SỰ CỐ & BÁO CÁO PHẢN ÁNH CỦA NGƯỜI DÂN (incidents & incident_updates)
  const incidents = [
    {
      id: 1,
      tracking_code: 'INC-84920',
      tree_id: 1,
      reporter_name: 'Nguyễn Văn An',
      reporter_phone: '0903847291',
      reporter_email: 'nguyenvanan@gmail.com',
      description: 'Cành cây lớn phía trên vỉa hè trước cổng ĐH Cần Thơ có vết nứt dài và lá héo khô, nguy cơ gãy đổ trúng sinh viên.',
      address: 'Trước cổng ĐH Cần Thơ (Khu II), Đường 3/2, Xuân Khánh, Cần Thơ',
      latitude: 10.031251,
      longitude: 105.76915,
      severity: 'Cao',
      status: 'Đang xử lý',
      assigned_staff_id: 3
    },
    {
      id: 2,
      tracking_code: 'INC-71044',
      tree_id: 2,
      reporter_name: 'Trần Thị Mai',
      reporter_phone: '0918234910',
      reporter_email: 'maitran@gmail.com',
      description: 'Sau đợt mưa dông chiều qua tại đường 30/4, cây me tây nghiêng 15 độ về phía lòng đường, rễ trồi nứt vỉa hè.',
      address: 'Đường 30 Tháng 4 (Gần Vincom Plaza), Quận Ninh Kiều, Cần Thơ',
      latitude: 10.02885,
      longitude: 105.77612,
      severity: 'Khẩn cấp',
      status: 'Đã giải quyết',
      assigned_staff_id: 3
    },
    {
      id: 3,
      tracking_code: 'INC-53219',
      tree_id: 3,
      reporter_name: 'Phạm Hữu Đạt',
      reporter_phone: '0939112233',
      reporter_email: 'datpham@gmail.com',
      description: 'Tổ mối lớn xuất hiện dưới gốc cây bàng tại Công viên Lưu Hữu Phước, cây có hiện tượng bộng ruột.',
      address: 'Công viên Lưu Hữu Phước, Đại lộ Hòa Bình, Ninh Kiều, Cần Thơ',
      latitude: 10.0345,
      longitude: 105.7825,
      severity: 'Trung bình',
      status: 'Đã hoàn thành',
      assigned_staff_id: 2
    }
  ];

  const stmtInc = db.prepare(`
    INSERT OR REPLACE INTO incidents (
      id, tracking_code, tree_id, reporter_name, reporter_phone, reporter_email,
      description, address, latitude, longitude, severity, status, assigned_staff_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  incidents.forEach(inc => {
    stmtInc.run(
      inc.id, inc.tracking_code, inc.tree_id, inc.reporter_name, inc.reporter_phone,
      inc.reporter_email, inc.description, inc.address, inc.latitude, inc.longitude,
      inc.severity, inc.status, inc.assigned_staff_id
    );
  });
  stmtInc.finalize();
  console.log(`✅ Đã nạp ${incidents.length} báo cáo sự cố & phản ánh dân sinh (incidents).`);

  // Diễn biến xử lý sự cố (incident_updates)
  const stmtUpd = db.prepare(`
    INSERT OR REPLACE INTO incident_updates (id, incident_id, actor_id, old_status, new_status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmtUpd.run(1, 1, 1, 'Chờ xử lý', 'Đã tiếp nhận', 'Admin tiếp nhận phản ánh người dân và giao cho KTV Lê Tuấn Anh');
  stmtUpd.run(2, 1, 3, 'Đã tiếp nhận', 'Đang xử lý', 'KTV Lê Tuấn Anh đã có mặt tại hiện trường ĐH Cần Thơ, dựng rào chắn an toàn');
  stmtUpd.run(3, 2, 1, 'Đang xử lý', 'Đã giải quyết', 'Đội cơ giới dùng xe cẩu kéo cây me tây đứng thẳng và cố định 4 cọc thép');
  stmtUpd.finalize();
  console.log(`✅ Đã nạp lịch sử diễn biến xử lý sự cố (incident_updates).`);

  // 4. NHẬT KÝ CHĂM SÓC THỰC ĐỊA (care_records)
  const careRecords = [
    {
      id: 1,
      care_code: 'CARE-2026-001',
      tree_id: 1,
      staff_id: 2,
      caretaker_name: 'Trần Quang Lâm',
      action_type: 'Cắt tỉa',
      health_before: 'Bình thường',
      health_after: 'Tốt',
      notes: 'Đã cắt tỉa cành khô sà thấp, tạo thông thoáng tán lá đón mùa mưa bão theo quy chuẩn.',
      anchor_status: 'CONFIRMED'
    },
    {
      id: 2,
      care_code: 'CARE-2026-002',
      tree_id: 2,
      staff_id: 3,
      caretaker_name: 'Lê Tuấn Anh',
      action_type: 'Trị sâu bệnh',
      health_before: 'Cần chăm sóc',
      health_after: 'Bình thường',
      notes: 'Xử lý mối đất và sâu đục thân bằng chế phẩm sinh học an toàn đô thị Trichoderma.',
      anchor_status: 'CONFIRMED'
    },
    {
      id: 3,
      care_code: 'CARE-2026-003',
      tree_id: 3,
      staff_id: 2,
      caretaker_name: 'Trần Quang Lâm',
      action_type: 'Bón phân',
      health_before: 'Tốt',
      health_after: 'Tốt',
      notes: 'Bón phân hữu cơ vi sinh NPK cung cấp dinh dưỡng kích rễ vùng ven sông.',
      anchor_status: 'CONFIRMED'
    }
  ];

  const stmtCare = db.prepare(`
    INSERT OR REPLACE INTO care_records (
      id, care_code, tree_id, staff_id, caretaker_name, action_type,
      health_before, health_after, notes, anchor_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  careRecords.forEach(c => {
    stmtCare.run(
      c.id, c.care_code, c.tree_id, c.staff_id, c.caretaker_name, c.action_type,
      c.health_before, c.health_after, c.notes, c.anchor_status
    );
  });
  stmtCare.finalize();
  console.log(`✅ Đã nạp ${careRecords.length} nhật ký chăm sóc thực địa (care_records).`);

  // 5. LƯU VẾT BẤT BIẾN BLOCKCHAIN (blockchain_audits)
  const stmtAudit = db.prepare(`
    INSERT OR REPLACE INTO blockchain_audits (
      id, record_type, record_id, data_hash, tx_hash, block_number, status
    ) VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
  `);
  stmtAudit.run(1, 'TREE_PROFILE', 'CT-OSM-0001', 'c7b39cc8da3b129dcded09823c6f7c7b67cdb7eca2f69ad4b9fdd4cbcc8a5d26', '0xf2d53bb58f2ddbc7eb560a0101e2e758097..', 104305);
  stmtAudit.run(2, 'CARE_LOG', 'CARE-2026-001', '98d41fe018e69acbe092b3a1a1f0c43231f79fba4d0cb5f190ab78f237ef3912', '0x88f2a1b9d45e0391cb4567ac89ef01a89b431..', 104306);
  stmtAudit.run(3, 'INCIDENT_REPORT', 'INC-71044', '44ac81920bfe4591a389104fec98120ab8ef34a1b0cd9820f18a209bcdef1298', '0x12a9efb8912304dfbc890123ef4598acb091..', 104307);
  stmtAudit.finalize();
  console.log(`✅ Đã nạp lưu vết kiểm toán Blockchain Smart Contract (blockchain_audits).`);

  db.run('COMMIT;', (err) => {
    if (err) {
      console.error('❌ Lỗi commit transaction:', err.message);
    } else {
      console.log('🎉 TOÀN BỘ CƠ SỞ DỮ LIỆU ĐÃ ĐƯỢC ĐỒNG BỘ VĨNH CỬU XUỐNG Ổ CỨNG SQLITE!');
      console.log('   Sẵn sàng Deploy lên Server mà không cần thay đổi bất kỳ kiến trúc nào!');
    }
    db.run('PRAGMA foreign_keys = ON;');
    db.close();
  });
});

