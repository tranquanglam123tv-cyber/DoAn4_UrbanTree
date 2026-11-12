import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  XCircle,
  Shield,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Briefcase,
  AlertCircle,
  X,
  Check,
  Upload,
  FileSpreadsheet,
  Download,
  FileText,
  Sparkles,
  Eye,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  Award,
  Send,
  Calendar,
  Mail,
  KeyRound,
  ShieldAlert,
  ArrowRightLeft,
  Filter,
  UserCheck,
  Activity,
  Flame,
} from 'lucide-react';
import { storage } from '../db/storage';
import { Role, StaffWorkStatus, User } from '../types';
import { CAN_THO_ZONES } from '../utils/zoneUtils';
import { ALL_PERMISSIONS, PermissionKey, hasPermission } from '../utils/permissionUtils';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserListChanged?: () => void;
}

const DEPARTMENTS = [
  'Đội Cây Xanh Môi Trường Đô Thị (Sở Xây Dựng)',
  'Đội Phản Ứng Nhanh Sự Cố Thiên Tai & Mùa Bão',
  'Ban Quản Lý Công Viên & Cây Xanh Di Sản',
  'Phòng Quản Lý Đô Thị & Hạ Tầng Kỹ Thuật',
  'Cộng Đồng Cư Dân & Người Dân Đô Thị',
];

const TEAMS = [
  'Đội Xe Thang Số 1 - Tuyến Hòa Bình & 30/4',
  'Tổ Kỹ Thuật Số 2 - Võ Nguyên Giáp & Cái Răng',
  'Tổ Cơ Động Cắt Tỉa Mùa Bão - Q. Bình Thủy',
  'Đội Phản Ứng Nhanh Ban Đêm Toàn Thành Phố',
  'Tổ Kiểm Tra Sức Khỏe Cây Di Sản & Cổ Thụ',
  'Tổ Giám Định Cây Nghiêng Nguy Hiểm',
];

const DEFAULT_SKILLS = [
  'Vận hành xe thang 18m',
  'Cắt tỉa hạ tán đón bão',
  'Siêu âm rễ Arbotom',
  'Xử lý nấm bệnh lâm sinh',
  'An toàn điện cao thế',
  'Gia cố cọc giằng bão',
  'Khai báo Smart Contract',
];

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  onUserListChanged,
}) => {
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'import_file'>('list');

  // Detail Profile Modal
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);

  // Department Transfer & Mission Dispatch Modal
  const [transferModalUser, setTransferModalUser] = useState<User | null>(null);
  const [transferDept, setTransferDept] = useState('');
  const [transferTeam, setTransferTeam] = useState('');
  const [transferDistrict, setTransferDistrict] = useState('');
  const [transferPosition, setTransferPosition] = useState('');
  const [transferWorkStatus, setTransferWorkStatus] = useState<StaffWorkStatus>('ACTIVE');
  const [transferMissionNote, setTransferMissionNote] = useState('');

  // Role & Permissions Modal
  const [permissionsModalUser, setPermissionsModalUser] = useState<User | null>(null);
  const [tempRole, setTempRole] = useState<Role>('STAFF');
  const [tempPermissions, setTempPermissions] = useState<string[]>([]);

  // File import state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedStaffFromFile, setParsedStaffFromFile] = useState<Omit<User, 'id'>[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Form add/edit state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [phone, setPhone] = useState('');
  const [assignedDistrict, setAssignedDistrict] = useState('Quận Ninh Kiều');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [teamName, setTeamName] = useState(TEAMS[0]);
  const [position, setPosition] = useState('Kỹ thuật viên thực địa');
  const [staffCode, setStaffCode] = useState('');
  const [workStatus, setWorkStatus] = useState<StaffWorkStatus>('ACTIVE');
  const [missionNote, setMissionNote] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Vận hành xe thang 18m', 'Cắt tỉa hạ tán đón bão']);
  const [userPermissions, setUserPermissions] = useState<string[]>(['CARE_WRITE', 'INCIDENT_RESOLVE']);
  const [isActive, setIsActive] = useState(true);

  const refreshList = () => {
    const list = storage.getUsers();
    setUsers(list);
    if (onUserListChanged) onUserListChanged();
  };

  // KPI stats
  const staffCount = users.filter((u) => u.role === 'STAFF').length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const citizenCount = users.filter((u) => u.role === 'CITIZEN').length;
  const onMissionCount = users.filter((u) => u.workStatus === 'ON_MISSION').length;

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingUserId(null);
    setFullName('');
    setUsername('');
    setEmail('');
    setRole('STAFF');
    setPhone('');
    setAssignedDistrict('Quận Ninh Kiều');
    setDepartment(DEPARTMENTS[0]);
    setTeamName(TEAMS[0]);
    setPosition('Kỹ thuật viên thực địa');
    setStaffCode(`KTV-CT-${String(users.length + 1).padStart(3, '0')}`);
    setWorkStatus('ACTIVE');
    setMissionNote('');
    setSelectedSkills(['Vận hành xe thang 18m', 'Cắt tỉa hạ tán đón bão']);
    setUserPermissions(['CARE_WRITE', 'INCIDENT_RESOLVE']);
    setIsActive(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setUsername(user.username);
    setEmail(user.email || '');
    setRole(user.role);
    setPhone(user.phone || '');
    setAssignedDistrict(user.assignedDistrict || 'Quận Ninh Kiều');
    setDepartment(user.department || (user.role === 'CITIZEN' ? DEPARTMENTS[4] : DEPARTMENTS[0]));
    setTeamName(user.teamName || (user.role === 'CITIZEN' ? 'Cộng đồng Cư dân Đô thị' : TEAMS[0]));
    setPosition(user.position || (user.role === 'CITIZEN' ? 'Người dân đô thị' : 'Kỹ thuật viên thực địa'));
    setStaffCode(user.staffCode || (user.role === 'STAFF' ? `KTV-CT-${user.id.slice(-3)}` : ''));
    setWorkStatus(user.workStatus || 'ACTIVE');
    setMissionNote(user.missionNote || '');
    setSelectedSkills(user.skills || ['Vận hành xe thang 18m', 'Cắt tỉa hạ tán đón bão']);
    setUserPermissions(user.permissions || ['CARE_WRITE', 'INCIDENT_RESOLVE']);
    setIsActive(user.isActive);
    setError(null);
    setSuccessMsg(null);
  };

  const handleOpenTransferModal = (user: User) => {
    setTransferModalUser(user);
    setTransferDept(user.department || DEPARTMENTS[0]);
    setTransferTeam(user.teamName || TEAMS[0]);
    setTransferDistrict(user.assignedDistrict || 'Quận Ninh Kiều');
    setTransferPosition(user.position || 'Kỹ thuật viên thực địa');
    setTransferWorkStatus(user.workStatus || 'ACTIVE');
    setTransferMissionNote(user.missionNote || '');
  };

  const handleSaveTransfer = () => {
    if (!transferModalUser) return;
    try {
      storage.updateUser(transferModalUser.id, {
        department: transferDept,
        teamName: transferTeam,
        assignedDistrict: transferDistrict,
        position: transferPosition,
        workStatus: transferWorkStatus,
        missionNote: transferWorkStatus === 'ON_MISSION' ? transferMissionNote : undefined,
      });
      setSuccessMsg(`Đã cập nhật lệnh điều chuyển công tác cho [${transferModalUser.fullName}] thành công!`);
      setTransferModalUser(null);
      refreshList();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu điều chuyển');
    }
  };

  const handleOpenPermissionsModal = (user: User) => {
    setPermissionsModalUser(user);
    setTempRole(user.role);
    setTempPermissions(user.permissions || (user.role === 'ADMIN' ? ALL_PERMISSIONS.map((p) => p.key) : ['CARE_WRITE', 'INCIDENT_RESOLVE']));
  };

  const handleSavePermissions = () => {
    if (!permissionsModalUser) return;
    try {
      storage.updateUser(permissionsModalUser.id, {
        role: tempRole,
        permissions: tempPermissions,
        teamName: tempRole === 'CITIZEN' ? undefined : (permissionsModalUser.teamName || TEAMS[0]),
        department: tempRole === 'CITIZEN' ? DEPARTMENTS[4] : (permissionsModalUser.department || DEPARTMENTS[0]),
        position: tempRole === 'CITIZEN' ? 'Người dân đô thị' : (permissionsModalUser.position || 'Kỹ thuật viên thực địa'),
      });
      setSuccessMsg(`Đã cập nhật vai trò và quyền hạn cho [${permissionsModalUser.fullName}] thành công!`);
      setPermissionsModalUser(null);
      refreshList();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật quyền hạn');
    }
  };

  const handleToggleActive = (user: User) => {
    if (user.id === 'user-admin') {
      alert('Không thể khóa Quản trị viên gốc.');
      return;
    }
    const newStatus = !user.isActive;
    storage.updateUser(user.id, { isActive: newStatus });
    setSuccessMsg(`Đã ${newStatus ? 'mở khóa' : 'tạm khóa'} tài khoản [${user.fullName}]`);
    refreshList();
  };

  const handleDelete = (user: User) => {
    if (user.id === 'user-admin') {
      alert('Không thể xóa Quản trị viên gốc.');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa vĩnh viễn nhân sự [${user.fullName}] khỏi hệ thống?`)) {
      try {
        storage.deleteUser(user.id);
        setSuccessMsg(`Đã xóa nhân sự [${user.fullName}] thành công.`);
        refreshList();
      } catch (err: any) {
        setError(err?.message || 'Không thể xóa');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !username.trim()) {
      setError('Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập.');
      return;
    }

    try {
      const userPayload: Partial<User> = {
        fullName: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim() || undefined,
        role,
        phone: phone.trim() || undefined,
        assignedDistrict,
        department: role === 'CITIZEN' ? 'Cộng Đồng Cư Dân & Người Dân Đô Thị' : department,
        teamName: role === 'CITIZEN' ? undefined : teamName.trim(),
        position: role === 'CITIZEN' ? 'Người dân đô thị' : position.trim(),
        staffCode: role === 'STAFF' || role === 'ADMIN' ? staffCode.trim() || `KTV-CT-${Date.now().toString().slice(-4)}` : undefined,
        workStatus: role === 'CITIZEN' ? 'ACTIVE' : workStatus,
        missionNote: workStatus === 'ON_MISSION' ? missionNote.trim() : undefined,
        skills: role !== 'CITIZEN' ? selectedSkills : undefined,
        permissions: userPermissions,
        isActive,
      };

      if (editingUserId) {
        storage.updateUser(editingUserId, userPayload);
        setSuccessMsg(`Đã cập nhật thông tin nhân sự [${fullName}] thành công!`);
      } else {
        if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
          setError('Tên đăng nhập này đã tồn tại trên hệ thống. Vui lòng chọn tên khác.');
          return;
        }
        storage.createUser(userPayload as Omit<User, 'id'>);
        setSuccessMsg(`Đã thêm mới nhân sự [${fullName}] vào đội ngũ thực địa!`);
      }

      refreshList();
      setIsEditing(false);
      setEditingUserId(null);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu nhân sự');
    }
  };

  // 📁 XỬ LÝ NHẬP FILE EXCEL / CSV NHÂN SỰ
  const handleDownloadSampleStaffCsv = () => {
    const csvContent =
      '\uFEFF' +
      'HoTen,Username,VaiTro,SoDienThoai,DiaBanPhuTrach,PhongBan,TenDoiNhom,ChucVu\n' +
      'Nguyễn Văn An,staff_an,STAFF,0912345601,Quận Ninh Kiều,Đội Cây Xanh Môi Trường Đô Thị,Đội Xe Thang Số 1 - Tuyến Hòa Bình,Đội trưởng xe thang\n' +
      'Trần Minh Bình,staff_binh,STAFF,0912345602,Quận Cái Răng,Đội Cây Xanh Môi Trường Đô Thị,Tổ Kỹ Thuật Số 2 - Võ Nguyên Giáp,KTV trưởng ca\n' +
      'Phạm Quốc Cường,staff_cuong,STAFF,0912345603,Quận Bình Thủy,Đội Phản Ứng Nhanh Sự Cố Thiên Tai,Tổ Cơ Động Cắt Tỉa Mùa Bão,Chuyên viên cưa hạ cành\n' +
      'Lê Hoàng Dũng,staff_dung,STAFF,0912345604,Toàn TP. Cần Thơ,Đội Phản Ứng Nhanh Sự Cố Thiên Tai,Đội Phản Ứng Nhanh Ban Đêm,KTV phản ứng nhanh\n' +
      'Võ Thị Mai Lan,staff_lan,STAFF,0912345605,Quận Ninh Kiều,Ban Quản Lý Công Viên & Cây Xanh Di Sản,Tổ Kiểm Tra Sức Khỏe Cây Di Sản,Chuyên viên lâm sinh\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Danh_Sach_Nhan_Vien_KTV_CanTho_Chuan.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadDemoStaffDataset = () => {
    const demoStaff: Omit<User, 'id'>[] = [
      {
        fullName: 'Nguyễn Văn An',
        username: 'staff_an',
        role: 'STAFF',
        phone: '0912 345 601',
        email: 'staff.an@urbantree.cantho.vn',
        assignedDistrict: 'Quận Ninh Kiều',
        department: 'Đội Cây Xanh Môi Trường Đô Thị (Sở Xây Dựng)',
        teamName: 'Đội Xe Thang Số 1 - Tuyến Hòa Bình & 30/4',
        position: 'Đội trưởng xe thang cao độ',
        staffCode: 'KTV-CT-021',
        workStatus: 'ACTIVE',
        skills: ['Vận hành xe thang 18m', 'Cắt tỉa hạ tán đón bão', 'An toàn điện cao thế'],
        permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE'],
        isActive: true,
      },
      {
        fullName: 'Trần Minh Bình',
        username: 'staff_binh',
        role: 'STAFF',
        phone: '0912 345 602',
        email: 'staff.binh@urbantree.cantho.vn',
        assignedDistrict: 'Quận Cái Răng',
        department: 'Đội Cây Xanh Môi Trường Đô Thị (Sở Xây Dựng)',
        teamName: 'Tổ Kỹ Thuật Số 2 - Võ Nguyên Giáp & Cái Răng',
        position: 'Kỹ thuật viên trưởng ca',
        staffCode: 'KTV-CT-022',
        workStatus: 'ON_MISSION',
        missionNote: 'Đang tuần tra xử lý cành sà trên trục Võ Nguyên Giáp',
        skills: ['Cắt tỉa hạ tán đón bão', 'Siêu âm rễ Arbotom'],
        permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE'],
        isActive: true,
      },
      {
        fullName: 'Phạm Quốc Cường',
        username: 'staff_cuong',
        role: 'STAFF',
        phone: '0912 345 603',
        email: 'staff.cuong@urbantree.cantho.vn',
        assignedDistrict: 'Quận Bình Thủy',
        department: 'Đội Phản Ứng Nhanh Sự Cố Thiên Tai & Mùa Bão',
        teamName: 'Tổ Cơ Động Cắt Tỉa Mùa Bão - Q. Bình Thủy',
        position: 'Chuyên viên cưa hạ cành nguy hiểm',
        staffCode: 'KTV-CT-023',
        workStatus: 'ACTIVE',
        skills: ['Cắt tỉa hạ tán đón bão', 'Gia cố cọc giằng bão', 'Vận hành xe thang 18m'],
        permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE'],
        isActive: true,
      },
      {
        fullName: 'Lê Hoàng Dũng',
        username: 'staff_dung',
        role: 'STAFF',
        phone: '0912 345 604',
        email: 'staff.dung@urbantree.cantho.vn',
        assignedDistrict: 'Toàn TP. Cần Thơ',
        department: 'Đội Phản Ứng Nhanh Sự Cố Thiên Tai & Mùa Bão',
        teamName: 'Đội Phản Ứng Nhanh Ban Đêm Toàn Thành Phố',
        position: 'Tổ phó phản ứng nhanh ban đêm',
        staffCode: 'KTV-CT-024',
        workStatus: 'ON_MISSION',
        missionNote: 'Túc trực ca đêm hỗ trợ giải cứu cây bật gốc khi triều cường',
        skills: ['An toàn điện cao thế', 'Gia cố cọc giằng bão', 'Cưa máy công suất cao'],
        permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE'],
        isActive: true,
      },
      {
        fullName: 'Võ Thị Mai Lan',
        username: 'staff_lan',
        role: 'STAFF',
        phone: '0912 345 605',
        email: 'staff.lan@urbantree.cantho.vn',
        assignedDistrict: 'Quận Ninh Kiều',
        department: 'Ban Quản Lý Công Viên & Cây Xanh Di Sản',
        teamName: 'Tổ Kiểm Tra Sức Khỏe Cây Di Sản & Cổ Thụ',
        position: 'Chuyên viên giám định lâm sinh',
        staffCode: 'KTV-CT-025',
        workStatus: 'ACTIVE',
        skills: ['Siêu âm rễ Arbotom', 'Xử lý nấm bệnh lâm sinh', 'Khai báo Smart Contract'],
        permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE', 'EXPORT_REPORT'],
        isActive: true,
      },
    ];

    setUploadedFileName('Danh_Sach_Nhan_Vien_KTV_Mau_CanTho.csv (Dữ liệu thử nghiệm)');
    setParsedStaffFromFile(demoStaff);
    setError(null);
  };

  const handleStaffFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length <= 1) {
          setError('File tải lên không có dòng dữ liệu hợp lệ.');
          return;
        }

        const parsed: Omit<User, 'id'>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            parsed.push({
              fullName: parts[0],
              username: parts[1].toLowerCase(),
              role: (parts[2]?.toUpperCase() as Role) || 'STAFF',
              phone: parts[3] || undefined,
              assignedDistrict: parts[4] || 'Quận Ninh Kiều',
              department: parts[5] || DEPARTMENTS[0],
              teamName: parts[6] || TEAMS[0],
              position: parts[7] || 'Kỹ thuật viên thực địa',
              staffCode: `KTV-CT-${String(100 + i)}`,
              workStatus: 'ACTIVE',
              skills: ['Vận hành xe thang 18m', 'Cắt tỉa hạ tán đón bão'],
              permissions: ['CARE_WRITE', 'INCIDENT_RESOLVE'],
              isActive: true,
            });
          }
        }

        if (parsed.length === 0) {
          setError('Không trích xuất được nhân sự nào từ file. Vui lòng kiểm tra định dạng file mẫu.');
          return;
        }

        setParsedStaffFromFile(parsed);
      } catch (err: any) {
        setError('Lỗi khi đọc file: ' + err.message);
      }
    };

    reader.readAsText(file);
  };

  const handleSubmitStaffFileImport = () => {
    if (parsedStaffFromFile.length === 0) return;

    setIsImporting(true);
    setError(null);
    try {
      let importedCount = 0;
      let skippedCount = 0;

      parsedStaffFromFile.forEach((item) => {
        if (users.some((u) => u.username.toLowerCase() === item.username.toLowerCase())) {
          skippedCount++;
        } else {
          storage.createUser(item);
          importedCount++;
        }
      });

      refreshList();
      setSuccessMsg(
        `🎉 Đã nạp thành công ${importedCount} nhân sự vào hệ thống!` +
          (skippedCount > 0 ? ` (Bỏ qua ${skippedCount} nhân viên do trùng tên đăng nhập).` : '')
      );
      setParsedStaffFromFile([]);
      setUploadedFileName(null);
      setActiveSubTab('list');
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi nạp danh sách nhân sự');
    } finally {
      setIsImporting(false);
    }
  };

  // Multi-Filter logic
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        Boolean(u.fullName && u.fullName.toLowerCase().includes(q)) ||
        Boolean(u.username && u.username.toLowerCase().includes(q)) ||
        Boolean(u.staffCode && u.staffCode.toLowerCase().includes(q)) ||
        Boolean(u.phone && u.phone.includes(q)) ||
        Boolean(u.email && u.email.toLowerCase().includes(q)) ||
        Boolean(u.position && u.position.toLowerCase().includes(q)) ||
        Boolean(u.assignedDistrict && u.assignedDistrict.toLowerCase().includes(q)) ||
        Boolean(u.teamName && u.teamName.toLowerCase().includes(q));

      const matchesRole = filterRole === 'ALL' || u.role === filterRole;
      const assigned = (u.assignedDistrict || '').toLowerCase();
      const target = filterDistrict.toLowerCase();
      const matchesDistrict =
        filterDistrict === 'ALL' ||
        (assigned.length > 0 &&
          (assigned.includes(target) ||
            (target === 'cần thơ' &&
              (assigned.includes('ninh kiều') ||
                assigned.includes('bình thủy') ||
                assigned.includes('cái răng') ||
                assigned.includes('ô môn') ||
                assigned.includes('thốt nốt') ||
                assigned.includes('phong điền')))));
      const matchesDepartment = filterDepartment === 'ALL' || u.department === filterDepartment || u.teamName === filterDepartment;
      const matchesStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'INACTIVE' && !u.isActive) ||
        (u.isActive && u.workStatus === filterStatus) ||
        (filterStatus === 'ACTIVE' && u.isActive && (!u.workStatus || u.workStatus === 'ACTIVE'));

      return matchesSearch && matchesRole && matchesDistrict && matchesDepartment && matchesStatus;
    });
  }, [users, search, filterRole, filterDistrict, filterDepartment, filterStatus]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-6xl w-full max-h-[92vh] shadow-2xl border border-slate-200 dark:border-emerald-500/30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER BAR */}
        <div className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-emerald-50/60 via-transparent to-transparent dark:from-[#091a11] dark:via-[#0c1812] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-[#00FF9D] flex items-center justify-center font-bold border border-emerald-200 dark:border-emerald-500/40 shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                  Quản Lý Nhân Sự & Phân Quyền KTV
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-[#00FF9D] dark:border dark:border-emerald-500/30 shrink-0">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Điều phối địa bàn, giao lệnh thực địa, chuyển tổ đội & kiểm soát phân quyền vận hành GIS 4.0
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QUICK KPI STRIP */}
        <div className="px-6 py-2 bg-slate-50/90 dark:bg-[#07120b] border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none text-[11px] shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 shadow-2xs whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500 dark:text-slate-400">Kỹ thuật viên:</span>
            <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-100">{staffCount} ca trực</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/50 shadow-2xs whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-amber-700 dark:text-amber-300">Đang hiện trường:</span>
            <span className="font-bold font-mono text-xs text-amber-800 dark:text-amber-400">{onMissionCount} KTV</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 shadow-2xs whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-slate-500 dark:text-slate-400">Quản trị viên:</span>
            <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-100">{adminCount}</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800 shadow-2xs whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-slate-500 dark:text-slate-400">Cư dân & CTV:</span>
            <span className="font-bold font-mono text-xs text-slate-800 dark:text-slate-100">{citizenCount}</span>
          </div>
        </div>

        {/* SUB-TABS NAVIGATION */}
        <div className="px-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-[#0c1812] shrink-0">
          <div className="flex items-center gap-2 -mb-px">
            <button
              type="button"
              onClick={() => {
                setActiveSubTab('list');
                setIsEditing(false);
              }}
              className={`py-3 px-3 font-bold border-b-2 text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'list'
                  ? 'border-emerald-600 text-emerald-800 dark:border-[#00FF9D] dark:text-[#00FF9D]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Danh Sách & Điều Hành ({filteredUsers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveSubTab('import_file');
                setIsEditing(false);
              }}
              className={`py-3 px-3 font-bold border-b-2 text-xs transition-all flex items-center gap-2 cursor-pointer ${
                activeSubTab === 'import_file'
                  ? 'border-emerald-600 text-emerald-800 dark:border-[#00FF9D] dark:text-[#00FF9D]'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Nhập File Excel / CSV</span>
            </button>
          </div>

          {!isEditing && activeSubTab === 'list' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="h-8 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95 text-xs shrink-0"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>+ Thêm Nhân Viên Mới</span>
            </button>
          )}
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 flex items-center justify-between text-xs shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-[#00FF9D] flex items-center justify-between text-xs shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* BODY AREA */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1" data-lenis-prevent>
          {activeSubTab === 'import_file' ? (
            /* ================= TAB NHẬP FILE EXCEL / CSV ================= */
            <div className="space-y-4 max-w-2xl mx-auto py-2">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-[#00FF9D] font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Nạp Hàng Loạt Danh Sách Nhân Viên & KTV Thực Địa</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
                  Hỗ trợ tải lên file Excel (CSV) chứa danh sách cán bộ, kỹ thuật viên xe thang, tổ cơ động cắt tỉa.
                  Hệ thống tự động cấp tài khoản, phân quận huyện phụ trách và thiết lập phân quyền ban đầu.
                </p>
                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleStaffCsv}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-[#00FF9D] font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-50 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải File Mẫu Chuẩn Cần Thơ (.csv)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadDemoStaffDataset}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Nạp Sẵn 5 KTV Mẫu Đô Thị Cần Thơ</span>
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-800/80 rounded-2xl p-6 text-center hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-colors relative">
                <input
                  type="file"
                  accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                  onChange={handleStaffFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-[#00FF9D] flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      {uploadedFileName ? uploadedFileName : 'Chọn hoặc Kéo thả file Excel / CSV nhân viên vào đây'}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Định dạng chuẩn: Họ Tên, Username, Vai Trò, Số Điện Thoại, Địa Bàn, Phòng Ban, Tên Đội Nhóm, Chức Vụ
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview extracted staff */}
              {parsedStaffFromFile.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Xem trước danh sách trích xuất ({parsedStaffFromFile.length} nhân sự):
                    </span>
                    <button
                      type="button"
                      onClick={() => setParsedStaffFromFile([])}
                      className="text-red-600 hover:underline text-[11px] cursor-pointer"
                    >
                      Hủy bỏ
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2">Họ Tên</th>
                          <th className="p-2">Username</th>
                          <th className="p-2">Địa Bàn</th>
                          <th className="p-2">Tổ Đội / Chức Vụ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedStaffFromFile.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="p-2 font-semibold text-slate-800 dark:text-slate-200">{item.fullName}</td>
                            <td className="p-2 font-mono text-emerald-700 dark:text-[#00FF9D]">@{item.username}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{item.assignedDistrict}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">{item.teamName} · {item.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setParsedStaffFromFile([])}
                      className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitStaffFileImport}
                      disabled={isImporting}
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isImporting ? 'Đang Nạp...' : `Xác Nhận Nạp ${parsedStaffFromFile.length} Nhân Sự`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isEditing ? (
            /* ================= FORM THÊM / SỬA NHÂN VIÊN ================= */
            <form onSubmit={handleSubmit} className="space-y-4 max-w-3xl mx-auto py-2">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-[#00FF9D] flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                      {editingUserId ? `Chỉnh Sửa Thông Tin Nhân Sự [${fullName}]` : 'Thêm Nhân Viên / Kỹ Thuật Viên Mới'}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Thiết lập hồ sơ thực địa, chỉ định phòng ban, đội ngũ và phân quyền vận hành
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  Quay lại danh sách
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Họ tên */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và Tên Nhân Viên *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ví dụ: Nguyễn Văn An"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Tên đăng nhập */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUserId}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: staff_an"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono disabled:opacity-60"
                  />
                </div>

                {/* Vai trò */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="STAFF">👷 Kỹ thuật viên Thực địa (STAFF - Đi xe thang, nghiệm thu On-Chain)</option>
                    <option value="ADMIN">👮 Quản trị viên Đô thị (ADMIN - Toàn quyền điều hành)</option>
                    <option value="CITIZEN">👤 Người dân / Tình nguyện viên (CITIZEN)</option>
                  </select>
                </div>

                {/* Mã nhân viên */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Mã Thẻ Nhân Viên (Staff Code)
                  </label>
                  <input
                    type="text"
                    value={staffCode}
                    onChange={(e) => setStaffCode(e.target.value)}
                    placeholder="ví dụ: KTV-CT-028"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Số điện thoại */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ví dụ: 0912 345 678"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Email Công Vụ / Liên Hệ
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: staff.an@urbantree.cantho.vn"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Địa bàn phụ trách */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Địa Bàn Phụ Trách (Quận/Huyện) *
                  </label>
                  <select
                    value={assignedDistrict}
                    onChange={(e) => setAssignedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Toàn quốc (Tất cả địa bàn)">🌐 Toàn quốc (Tất cả địa bàn)</option>
                    {CAN_THO_ZONES.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                    <optgroup label="Tỉnh / Thành khác">
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="TP. Đà Nẵng">TP. Đà Nẵng</option>
                      <option value="TP. Hà Nội">TP. Hà Nội</option>
                    </optgroup>
                  </select>
                </div>

                {/* Phòng ban */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Phòng Ban Trực Thuộc
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    disabled={role === 'CITIZEN'}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:opacity-50"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tổ / Đội kỹ thuật */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tổ Đội Kỹ Thuật Hiện Trường
                  </label>
                  {role === 'CITIZEN' ? (
                    <input
                      type="text"
                      disabled
                      value="Cộng đồng Cư dân Đô thị (Không thuộc tổ kỹ thuật)"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-500 italic"
                    />
                  ) : (
                    <select
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    >
                      {TEAMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Chức vụ */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chức Danh / Chức Vụ
                  </label>
                  <input
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="ví dụ: Đội trưởng xe thang, KTV bậc 3"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Kỹ năng nghiệp vụ & Phân quyền */}
              {role !== 'CITIZEN' && (
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kỹ Năng Nghiệp Vụ Thực Địa
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_SKILLS.map((sk) => {
                        const isChecked = selectedSkills.includes(sk);
                        return (
                          <button
                            type="button"
                            key={sk}
                            onClick={() => {
                              setSelectedSkills(
                                isChecked ? selectedSkills.filter((s) => s !== sk) : [...selectedSkills, sk]
                              );
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                            }`}
                          >
                            {isChecked ? '✓ ' : '+ '}
                            {sk}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phân Quyền Thao Tác Hệ Thống
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {ALL_PERMISSIONS.map((perm) => {
                        const isChecked = userPermissions.includes(perm.key);
                        return (
                          <label
                            key={perm.key}
                            className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                              isChecked
                                ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                                : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setUserPermissions(
                                  isChecked
                                    ? userPermissions.filter((p) => p !== perm.key)
                                    : [...userPermissions, perm.key]
                                );
                              }}
                              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                                {perm.label}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">[{perm.group}]</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Status checkbox & Submit buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    Tài khoản đang hoạt động (Cho phép đăng nhập tiếp nhận ca trực)
                  </span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingUserId ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản Nhân Viên'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* ================= BẢNG DANH SÁCH NHÂN VIÊN & BỘ LỌC ================= */
            <div className="space-y-3.5">
              {/* BỘ LỌC ĐA CHIỀU (MULTI-DIMENSIONAL FILTERS) */}
              <div className="p-3 rounded-2xl bg-slate-50/90 dark:bg-[#07130b] border border-slate-200/80 dark:border-slate-800 space-y-2.5 shadow-xs">
                {/* Search Bar + Role Pills */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm theo Tên, Username (@...), Mã KTV, SĐT, Chức vụ..."
                      className="w-full pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs shadow-2xs focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all placeholder:text-slate-400"
                    />
                    {search && (
                      <button
                        type="button"
                        onClick={() => setSearch('')}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Role filter buttons */}
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs shrink-0 overflow-x-auto scrollbar-none">
                    <button
                      type="button"
                      onClick={() => setFilterRole('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        filterRole === 'ALL'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      Tất cả ({users.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterRole('STAFF')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        filterRole === 'STAFF'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>👷</span>
                      <span>KTV ({staffCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterRole('ADMIN')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        filterRole === 'ADMIN'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>👮</span>
                      <span>Admin ({adminCount})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterRole('CITIZEN')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        filterRole === 'CITIZEN'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>👤</span>
                      <span>Cư dân ({citizenCount})</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Filters: District, Department, Status */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70 text-xs">
                  {/* Địa bàn */}
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 absolute left-3 top-2.5 text-emerald-600 dark:text-[#00FF9D] pointer-events-none" />
                    <select
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all truncate"
                    >
                      <option value="ALL">🌐 Địa bàn: Toàn quốc (Tất cả)</option>
                      <optgroup label="📍 TP. Cần Thơ (Địa bàn trọng điểm)">
                        <option value="Cần Thơ">Toàn TP. Cần Thơ</option>
                        <option value="Ninh Kiều">— Quận Ninh Kiều</option>
                        <option value="Bình Thủy">— Quận Bình Thủy</option>
                        <option value="Cái Răng">— Quận Cái Răng</option>
                        <option value="Ô Môn">— Quận Ô Môn</option>
                        <option value="Thốt Nốt">— Quận Thốt Nốt</option>
                        <option value="Phong Điền">— Huyện Phong Điền</option>
                      </optgroup>
                      <optgroup label="🏙️ Các Tỉnh / Thành phố Khác">
                        <option value="Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Đà Nẵng">TP. Đà Nẵng</option>
                        <option value="Hà Nội">TP. Hà Nội</option>
                        <option value="Hải Phòng">TP. Hải Phòng</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Tổ đội / Phòng ban */}
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-blue-600 dark:text-blue-400 pointer-events-none" />
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-2xs truncate cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all"
                    >
                      <option value="ALL">Tổ đội: Tất cả tổ đội & phòng ban</option>
                      {TEAMS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Trạng thái công tác */}
                  <div className="relative">
                    <Activity className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-600 dark:text-amber-400 pointer-events-none" />
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-xs font-medium shadow-2xs cursor-pointer focus:outline-none focus:ring-1.5 focus:ring-emerald-500 transition-all truncate"
                    >
                      <option value="ALL">Trạng thái: Tất cả trạng thái</option>
                      <option value="ACTIVE">🟢 Sẵn sàng trực chiến</option>
                      <option value="ON_MISSION">🟡 Đang đi công tác hiện trường</option>
                      <option value="ON_LEAVE">⚪ Nghỉ phép</option>
                      <option value="INACTIVE">🔴 Tài khoản tạm khóa</option>
                    </select>
                  </div>
                </div>

                {/* HÀNG TRẠNG THÁI BỘ LỌC NẾU CÓ FILTER ĐANG ÁP DỤNG */}
                {(search || filterRole !== 'ALL' || filterDistrict !== 'ALL' || filterDepartment !== 'ALL' || filterStatus !== 'ALL') && (
                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400 px-1">
                    <span>
                      Đang lọc thấy <strong className="text-emerald-700 dark:text-[#00FF9D] font-mono">{filteredUsers.length}</strong> / {users.length} tài khoản
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        setFilterRole('ALL');
                        setFilterDistrict('ALL');
                        setFilterDepartment('ALL');
                        setFilterStatus('ALL');
                      }}
                      className="text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Xóa bộ lọc</span>
                    </button>
                  </div>
                )}
              </div>

              {/* BẢNG DANH SÁCH NHÂN SỰ */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto bg-white dark:bg-slate-900 shadow-xs scrollbar-thin">
                <table className="w-full text-left border-collapse min-w-[980px]">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 w-[240px]">Họ Tên & Tài Khoản</th>
                      <th className="py-3 px-3 w-[120px] whitespace-nowrap">Vai Trò</th>
                      <th className="py-3 px-3 w-[160px] whitespace-nowrap">Địa Bàn Phụ Trách</th>
                      <th className="py-3 px-3 min-w-[190px]">Phòng Ban & Tổ Đội</th>
                      <th className="py-3 px-3 w-[170px] whitespace-nowrap">Trạng Thái Công Tác</th>
                      <th className="py-3 px-4 w-[160px] text-right whitespace-nowrap">Điều Phối & Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                          Không tìm thấy nhân sự nào phù hợp với bộ lọc tìm kiếm.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const isCitizen = user.role === 'CITIZEN';
                        const isAdmin = user.role === 'ADMIN';
                        const isOnMission = user.workStatus === 'ON_MISSION';

                        return (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                          >
                            {/* Cột 1: Tên & Username */}
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 shrink-0 border border-slate-200 dark:border-slate-700">
                                  {(user.fullName || user.username || '?').charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <span className="truncate">{user.fullName}</span>
                                    {user.staffCode && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                                        {user.staffCode}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate">
                                    @{user.username}
                                    {user.phone && <span className="text-slate-500 ml-1.5">· 📞 {user.phone}</span>}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Cột 2: Vai trò */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span
                                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                                  isAdmin
                                    ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                    : isCitizen
                                    ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                    : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-[#00FF9D] border border-emerald-300 dark:border-emerald-800'
                                }`}
                              >
                                {isAdmin ? '👮 QUẢN TRỊ' : isCitizen ? '👤 NGƯỜI DÂN' : '👷 KỸ THUẬT'}
                              </span>
                            </td>

                            {/* Cột 3: Địa bàn */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                <span className="truncate font-medium">
                                  {user.assignedDistrict || 'Toàn TP. Cần Thơ'}
                                </span>
                              </div>
                            </td>

                            {/* Cột 4: Phòng ban & Tổ đội */}
                            <td className="py-3 px-3">
                              {isCitizen ? (
                                <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                  <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span className="font-medium truncate">Cộng đồng Cư dân Đô thị</span>
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <div className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[220px]">
                                    {user.teamName || 'Tổ Kỹ Thuật Đô Thị'}
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate max-w-[220px]">
                                    {user.position || user.department || 'Kỹ thuật viên thực địa'}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Cột 5: Trạng thái công tác */}
                            <td className="py-3 px-3 whitespace-nowrap">
                              {!user.isActive ? (
                                <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[11px] whitespace-nowrap">
                                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>Tạm khóa</span>
                                </span>
                              ) : isCitizen ? (
                                <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold text-[11px] whitespace-nowrap">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>Cư dân hợp lệ</span>
                                </span>
                              ) : isOnMission ? (
                                <div
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 text-[10px] font-bold whitespace-nowrap"
                                  title={user.missionNote || 'Đang công tác hiện trường'}
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                                  <span>Đang công tác</span>
                                </div>
                              ) : user.workStatus === 'ON_LEAVE' ? (
                                <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px] whitespace-nowrap">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                  <span>Nghỉ phép</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-[#00FF9D] font-bold text-[11px] whitespace-nowrap">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                  <span>Sẵn sàng trực chiến</span>
                                </span>
                              )}
                            </td>

                            {/* Cột 6: Thao tác */}
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Xem chi tiết hồ sơ */}
                                <button
                                  type="button"
                                  onClick={() => setSelectedUserForDetail(user)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 dark:hover:text-[#00FF9D] transition-colors cursor-pointer"
                                  title="Xem chi tiết hồ sơ nhân sự"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                {/* Chuyển phòng ban & Điều động công tác */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenTransferModal(user)}
                                  className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/60 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                                  title="Chuyển phòng ban / Lệnh điều động công tác"
                                >
                                  <ArrowRightLeft className="w-4 h-4" />
                                </button>

                                {/* Phân quyền & Vai trò */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenPermissionsModal(user)}
                                  className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/60 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                                  title="Phân quyền vai trò hệ thống"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>

                                {/* Chỉnh sửa */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenEdit(user)}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                                  title="Chỉnh sửa thông tin nhân viên"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Xóa / Vô hiệu */}
                                {user.id !== 'user-admin' && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(user)}
                                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                    title="Xóa nhân viên khỏi hệ thống"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL 1: CHI TIẾT HỒ SƠ NHÂN SỰ (STAFF PROFILE DRAWER) */}
        {selectedUserForDetail && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setSelectedUserForDetail(null)}
          >
            <div
              className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-500/30 space-y-4 animate-in fade-in zoom-in-95 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Profile */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                    {(selectedUserForDetail.fullName || selectedUserForDetail.username || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-base text-slate-900 dark:text-white">
                        {selectedUserForDetail.fullName}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#00FF9D]">
                        {selectedUserForDetail.role}
                      </span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px] mt-0.5">
                      @{selectedUserForDetail.username} · {selectedUserForDetail.staffCode || 'Chưa cấp mã'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#07130b] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Trạng thái công tác</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 text-xs mt-0.5 flex items-center gap-1.5">
                    {selectedUserForDetail.workStatus === 'ON_MISSION' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-amber-600 dark:text-amber-400">Đang công tác hiện trường</span>
                      </>
                    ) : selectedUserForDetail.workStatus === 'ON_LEAVE' ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Tạm nghỉ phép</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-600 dark:text-[#00FF9D]">Sẵn sàng tiếp nhận ca trực</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const u = selectedUserForDetail;
                    setSelectedUserForDetail(null);
                    handleOpenTransferModal(u);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-700 cursor-pointer text-[11px]"
                >
                  Đổi Trạng Thái / Điều Động
                </button>
              </div>

              {/* Mission Note if on mission */}
              {selectedUserForDetail.workStatus === 'ON_MISSION' && selectedUserForDetail.missionNote && (
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  <span className="font-bold">Lệnh công tác chi tiết: </span>
                  {selectedUserForDetail.missionNote}
                </div>
              )}

              {/* Administrative Information Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Phòng ban</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {selectedUserForDetail.department || 'Cây Xanh Môi Trường Đô Thị'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Chức danh / Chức vụ</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {selectedUserForDetail.position || 'Kỹ thuật viên thực địa'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Địa bàn phụ trách</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {selectedUserForDetail.assignedDistrict || 'Toàn TP. Cần Thơ'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Tổ đội kỹ thuật</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                    {selectedUserForDetail.teamName || (selectedUserForDetail.role === 'CITIZEN' ? 'Cộng đồng Cư dân' : 'Tổ Kỹ Thuật Đô Thị')}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Điện thoại liên hệ</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5">
                    {selectedUserForDetail.phone || 'Chưa cập nhật'}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Email</span>
                  <div className="font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 truncate">
                    {selectedUserForDetail.email || 'Chưa cập nhật'}
                  </div>
                </div>
              </div>

              {/* Skills */}
              {selectedUserForDetail.skills && selectedUserForDetail.skills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                    Kỹ năng & Chuyên môn thực địa:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedUserForDetail.skills.map((sk) => (
                      <span
                        key={sk}
                        className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-[#00FF9D] text-[10px] font-semibold"
                      >
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const u = selectedUserForDetail;
                    setSelectedUserForDetail(null);
                    handleOpenEdit(u);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Sửa Hồ Sơ
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: CHUYỂN PHÒNG BAN & ĐIỀU ĐỘNG CÔNG TÁC (TRANSFER MODAL) */}
        {transferModalUser && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setTransferModalUser(null)}
          >
            <div
              className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-500/30 space-y-4 animate-in fade-in zoom-in-95 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                      Điều Động Công Tác & Chuyển Phòng Ban
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Cán bộ: <strong>{transferModalUser.fullName}</strong> (@{transferModalUser.username})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setTransferModalUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Trạng thái công tác */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Trạng Thái Trực / Công Tác *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setTransferWorkStatus('ACTIVE')}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        transferWorkStatus === 'ACTIVE'
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🟢 Sẵn Sàng Trực
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferWorkStatus('ON_MISSION')}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        transferWorkStatus === 'ON_MISSION'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      🟡 Đi Công Tác
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferWorkStatus('ON_LEAVE')}
                      className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        transferWorkStatus === 'ON_LEAVE'
                          ? 'bg-slate-700 text-white border-slate-800 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      ⚪ Nghỉ Phép
                    </button>
                  </div>
                </div>

                {/* Lệnh công tác nếu đi công tác */}
                {transferWorkStatus === 'ON_MISSION' && (
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chi Tiết Lệnh Công Tác / Nhiệm Vụ Hiện Trường *
                    </label>
                    <textarea
                      rows={2}
                      value={transferMissionNote}
                      onChange={(e) => setTransferMissionNote(e.target.value)}
                      placeholder="ví dụ: Tuần tra khẩn cấp xử lý cành gãy đổ sau bão tại đại lộ Hòa Bình & Ninh Kiều"
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                {/* Chuyển phòng ban */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chuyển Đến Phòng Ban
                  </label>
                  <select
                    value={transferDept}
                    onChange={(e) => setTransferDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chuyển tổ kỹ thuật */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Chuyển Đến Tổ Đội Kỹ Thuật
                  </label>
                  <select
                    value={transferTeam}
                    onChange={(e) => setTransferTeam(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {TEAMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Địa bàn phân công */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Điều Động Đến Địa Bàn (Quận/Huyện)
                  </label>
                  <select
                    value={transferDistrict}
                    onChange={(e) => setTransferDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    <option value="Toàn quốc (Tất cả địa bàn)">🌐 Toàn quốc (Tất cả địa bàn)</option>
                    {CAN_THO_ZONES.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                    <optgroup label="Tỉnh / Thành khác">
                      <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                      <option value="TP. Đà Nẵng">TP. Đà Nẵng</option>
                      <option value="TP. Hà Nội">TP. Hà Nội</option>
                    </optgroup>
                  </select>
                </div>

                {/* Chức vụ mới */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Bổ Nhiệm Chức Vụ Mới
                  </label>
                  <input
                    type="text"
                    value={transferPosition}
                    onChange={(e) => setTransferPosition(e.target.value)}
                    placeholder="ví dụ: Đội trưởng cơ động, KTV giám sát"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setTransferModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveTransfer}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Xác Nhận Điều Động</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: PHÂN QUYỀN VAI TRÒ & THĂNG CẤP (PERMISSIONS MODAL) */}
        {permissionsModalUser && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setPermissionsModalUser(null)}
          >
            <div
              className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-emerald-500/30 space-y-4 animate-in fade-in zoom-in-95 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                      Phân Quyền Vai Trò & Thăng Cấp Nhân Sự
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Tài khoản: <strong>{permissionsModalUser.fullName}</strong> (@{permissionsModalUser.username})
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPermissionsModalUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {/* Chọn vai trò */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Thiết Lập Vai Trò (Role)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTempRole('CITIZEN');
                        setTempPermissions([]);
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        tempRole === 'CITIZEN'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      👤 Người Dân
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempRole('STAFF');
                        if (tempPermissions.length === 0) {
                          setTempPermissions(['CARE_WRITE', 'INCIDENT_RESOLVE']);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        tempRole === 'STAFF'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      👷 Kỹ Thuật Viên
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTempRole('ADMIN');
                        setTempPermissions(ALL_PERMISSIONS.map((p) => p.key));
                      }}
                      className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        tempRole === 'ADMIN'
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      👮 Quản Trị Viên
                    </button>
                  </div>
                </div>

                {/* Checklist phân quyền chi tiết */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Các Quyền Hạn Chi Tiết Được Phép Thao Tác
                  </label>
                  <div className="space-y-1.5">
                    {ALL_PERMISSIONS.map((perm) => {
                      const isChecked = tempPermissions.includes(perm.key);
                      return (
                        <label
                          key={perm.key}
                          className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-700'
                              : 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setTempPermissions(
                                  isChecked
                                    ? tempPermissions.filter((p) => p !== perm.key)
                                    : [...tempPermissions, perm.key]
                                );
                              }}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                              {perm.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">[{perm.group}]</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setPermissionsModalUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSavePermissions}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Lưu Phân Quyền</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER BAR */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 text-[11px] shrink-0">
          <span>
            Đang hiển thị: <strong>{filteredUsers.length}</strong> / {users.length} tài khoản trong hệ thống
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 cursor-pointer"
          >
            Đóng Cửa Sổ
          </button>
        </div>
      </div>
    </div>
  );
};
