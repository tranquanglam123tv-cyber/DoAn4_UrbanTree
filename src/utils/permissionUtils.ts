import { User } from '../types';

export type PermissionKey =
  | 'CARE_WRITE'
  | 'INCIDENT_RESOLVE'
  | 'TREE_FELL_APPROVE'
  | 'EXPORT_REPORT'
  | 'STAFF_MANAGE';

export interface PermissionDef {
  key: PermissionKey;
  label: string;
  group: 'Thực địa' | 'Sự cố' | 'Pháp lý' | 'Báo cáo' | 'Quản trị';
  description: string;
}

export const ALL_PERMISSIONS: PermissionDef[] = [
  {
    key: 'CARE_WRITE',
    label: 'Ghi nhật ký chăm sóc, bón phân & cắt tỉa',
    group: 'Thực địa',
    description: 'Quyền tạo hồ sơ chăm sóc định kỳ, bón phân vi sinh, cắt tỉa cành và lưu hash On-Chain.',
  },
  {
    key: 'INCIDENT_RESOLVE',
    label: 'Tiếp nhận, xử lý & nghiệm thu sự cố người dân',
    group: 'Sự cố',
    description: 'Quyền chuyển trạng thái sự cố (IN_PROGRESS, RESOLVED), nghiệm thu ảnh chụp hiện trường.',
  },
  {
    key: 'TREE_FELL_APPROVE',
    label: 'Đề xuất & phê duyệt đốn hạ cây Loại 3 nguy cấp',
    group: 'Pháp lý',
    description: 'Quyền ký duyệt giấy phép đốn hạ theo Nghị định 64/2010/NĐ-CP đối với cây sâu mục nguy hiểm.',
  },
  {
    key: 'EXPORT_REPORT',
    label: 'Xuất bản in báo cáo thanh tra Sở Xây Dựng A4',
    group: 'Báo cáo',
    description: 'Quyền mở và in báo cáo khổ chuẩn A4 trình UBND TP và Sở Xây Dựng.',
  },
  {
    key: 'STAFF_MANAGE',
    label: 'Quản trị nhân sự, điều phối lệnh công tác & phân quyền',
    group: 'Quản trị',
    description: 'Quyền thêm/sửa/xóa tài khoản, điều động công tác, phân quyền thao tác cho đội ngũ.',
  },
];

/**
 * 🛡️ Kiểm tra xem một tài khoản có thực sự sở hữu quyền hạn cụ thể hay không
 */
export function hasPermission(
  user: User | null | undefined,
  permission: PermissionKey
): boolean {
  if (!user) return false;

  // Tài khoản Admin cấp cao mặc định có toàn bộ quyền nếu chưa bị giới hạn
  if (user.role === 'ADMIN') {
    if (!user.permissions || user.permissions.length === 0) return true;
    return user.permissions.includes(permission);
  }

  // Người dân thông thường không có các quyền vận hành kỹ thuật & quản trị
  if (user.role === 'CITIZEN') {
    return false;
  }

  // Đối với Kỹ thuật viên (STAFF), kiểm tra danh sách permissions được cấp
  if (Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  // Mặc định KTV có quyền chăm sóc và giải quyết sự cố nếu permissions rỗng
  if (user.role === 'STAFF') {
    return permission === 'CARE_WRITE' || permission === 'INCIDENT_RESOLVE';
  }

  return false;
}

/**
 * ⚠️ Helper kiểm tra quyền và hiển thị thông báo alert nếu bị từ chối
 */
export function assertPermission(
  user: User | null | undefined,
  permission: PermissionKey,
  actionName?: string
): boolean {
  if (hasPermission(user, permission)) {
    return true;
  }
  const permObj = ALL_PERMISSIONS.find((p) => p.key === permission);
  const actionText = actionName || permObj?.label || permission;
  alert(
    `🚫 TRUY CẬP BỊ TỪ CHỐI (403 FORBIDDEN):\n\n` +
      `Tài khoản "${user?.fullName || 'Hiện tại'}" không có quyền [${permission}]:\n"${actionText}".\n\n` +
      `👉 Vui lòng liên hệ Người Quản Trị Hệ Thống (Admin) để được cấp quyền này trong mục "Quản Lý Nhân Sự & Phân Quyền".`
  );
  return false;
}
