import React, { useState } from 'react';
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
} from 'lucide-react';
import { storage } from '../db/storage';
import { Role, User } from '../types';
import { CAN_THO_ZONES } from '../utils/zoneUtils';

interface StaffManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserListChanged?: () => void;
}

export const StaffManagementModal: React.FC<StaffManagementModalProps> = ({
  isOpen,
  onClose,
  onUserListChanged,
}) => {
  const [users, setUsers] = useState<User[]>(storage.getUsers());
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Active Sub-tab in modal: 'list' (Danh sách & form đơn) vs 'import_file' (Nhập từ file)
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'import_file'>('list');

  // File import state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [parsedStaffFromFile, setParsedStaffFromFile] = useState<Omit<User, 'id'>[]>([]);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Form add/edit state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [phone, setPhone] = useState('');
  const [assignedDistrict, setAssignedDistrict] = useState('Q. Ninh Kiều');
  const [teamName, setTeamName] = useState('Tổ Kỹ Thuật Đô Thị Số 1');
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  const refreshList = () => {
    const list = storage.getUsers();
    setUsers(list);
    if (onUserListChanged) onUserListChanged();
  };

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingUserId(null);
    setFullName('');
    setUsername('');
    setRole('STAFF');
    setPhone('');
    setAssignedDistrict('Q. Ninh Kiều');
    setTeamName('Tổ Kỹ Thuật Đô Thị Tuyến Phố');
    setIsActive(true);
    setError(null);
    setSuccessMsg(null);
  };

  const handleOpenEdit = (user: User) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setUsername(user.username);
    setRole(user.role);
    setPhone(user.phone || '');
    setAssignedDistrict(user.assignedDistrict || 'Q. Ninh Kiều');
    setTeamName(user.teamName || 'Tổ Kỹ Thuật Đô Thị');
    setIsActive(user.isActive);
    setError(null);
    setSuccessMsg(null);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setError(null);
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
      if (editingUserId) {
        // Update
        storage.updateUser(editingUserId, {
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          role,
          phone: phone.trim() || undefined,
          assignedDistrict,
          teamName: teamName.trim() || undefined,
          isActive,
        });
        setSuccessMsg(`Đã cập nhật thông tin nhân sự [${fullName}] thành công!`);
      } else {
        // Create
        // Check username duplication
        if (users.some((u) => u.username.toLowerCase() === username.trim().toLowerCase())) {
          setError('Tên đăng nhập này đã tồn tại trên hệ thống. Vui lòng chọn tên khác.');
          return;
        }

        storage.createUser({
          fullName: fullName.trim(),
          username: username.trim().toLowerCase(),
          role,
          phone: phone.trim() || undefined,
          assignedDistrict,
          teamName: teamName.trim() || undefined,
          isActive: true,
        });
        setSuccessMsg(`Đã thêm mới nhân sự [${fullName}] vào đội ngũ thực địa!`);
      }

      refreshList();
      setIsEditing(false);
      setEditingUserId(null);
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi lưu nhân sự');
    }
  };

  const handleDelete = (user: User) => {
    if (user.id === 'user-admin') {
      alert('Không thể xóa Quản trị viên gốc.');
      return;
    }
    if (confirm(`Bạn có chắc muốn xóa nhân viên [${user.fullName}] khỏi hệ thống?`)) {
      try {
        storage.deleteUser(user.id);
        setSuccessMsg(`Đã xóa nhân viên [${user.fullName}] thành công.`);
        refreshList();
      } catch (err: any) {
        setError(err?.message || 'Không thể xóa');
      }
    }
  };

  // 📁 XỬ LÝ NHẬP FILE EXCEL / CSV NHÂN SỰ
  const handleDownloadSampleStaffCsv = () => {
    const csvContent =
      '\uFEFF' +
      'HoTen,Username,VaiTro,SoDienThoai,DiaBanPhuTrach,TenDoiNhom\n' +
      'Nguyễn Văn An,staff_an,STAFF,0912345601,Quận Ninh Kiều (Đô thị Trung tâm & Di sản),Đội Xe Thang Số 1 - Tuyến Hòa Bình\n' +
      'Trần Minh Bình,staff_binh,STAFF,0912345602,Quận Cái Răng (Đô thị Mới & Cửa ngõ Phía Nam),Tổ Kỹ Thuật Số 2 - Võ Nguyên Giáp\n' +
      'Phạm Quốc Cường,staff_cuong,STAFF,0912345603,Quận Bình Thủy,Tổ Cơ Động Cắt Tỉa Mùa Bão\n' +
      'Lê Hoàng Dũng,staff_dung,STAFF,0912345604,Toàn TP. Cần Thơ (Tất cả 9 quận/huyện),Đội Phản Ứng Nhanh Ban Đêm\n' +
      'Võ Thị Mai Lan,staff_lan,STAFF,0912345605,Quận Ninh Kiều (Đô thị Trung tâm & Di sản),Tổ Kiểm Tra Sức Khỏe Cây Di Sản\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Danh_Sach_Nhan_Vien_KTV_Mau_CanTho.csv');
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
        assignedDistrict: 'Quận Ninh Kiều (Đô thị Trung tâm & Di sản)',
        teamName: 'Đội Xe Thang Số 1 - Tuyến Hòa Bình',
        isActive: true,
      },
      {
        fullName: 'Trần Minh Bình',
        username: 'staff_binh',
        role: 'STAFF',
        phone: '0912 345 602',
        assignedDistrict: 'Quận Cái Răng (Đô thị Mới & Cửa ngõ Phía Nam)',
        teamName: 'Tổ Kỹ Thuật Số 2 - Võ Nguyên Giáp',
        isActive: true,
      },
      {
        fullName: 'Phạm Quốc Cường',
        username: 'staff_cuong',
        role: 'STAFF',
        phone: '0912 345 603',
        assignedDistrict: 'Quận Bình Thủy',
        teamName: 'Tổ Cơ Động Cắt Tỉa Mùa Bão',
        isActive: true,
      },
      {
        fullName: 'Lê Hoàng Dũng',
        username: 'staff_dung',
        role: 'STAFF',
        phone: '0912 345 604',
        assignedDistrict: 'Toàn TP. Cần Thơ (Tất cả 9 quận/huyện)',
        teamName: 'Đội Phản Ứng Nhanh Ban Đêm',
        isActive: true,
      },
      {
        fullName: 'Võ Thị Mai Lan',
        username: 'staff_lan',
        role: 'STAFF',
        phone: '0912 345 605',
        assignedDistrict: 'Quận Ninh Kiều (Đô thị Trung tâm & Di sản)',
        teamName: 'Tổ Kiểm Tra Sức Khỏe Cây Di Sản',
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
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(',').map((p) => p.trim());
          if (parts.length >= 2 && parts[0] && parts[1]) {
            parsed.push({
              fullName: parts[0],
              username: parts[1].toLowerCase(),
              role: (parts[2]?.toUpperCase() as Role) || 'STAFF',
              phone: parts[3] || undefined,
              assignedDistrict: parts[4] || 'Quận Ninh Kiều',
              teamName: parts[5] || 'Tổ Kỹ Thuật Đô Thị',
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
        // If username exists, skip to prevent duplicates
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

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.assignedDistrict && u.assignedDistrict.toLowerCase().includes(search.toLowerCase())) ||
      (u.teamName && u.teamName.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-[#0c1812] rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl border border-slate-200 dark:border-emerald-500/30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs"
        data-lenis-prevent
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/60 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                  Quản Lý Nhân Sự &amp; Đội Ngũ Kỹ Thuật Viên (Staff)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Thêm, phân công địa bàn quản lý quận/huyện và cấp tài khoản điều hành hiện trường.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Sub-tab Navigation: Danh Sách & Thêm Đơn vs Nhập Từ File Excel/CSV */}
        <div className="px-6 pt-3 bg-slate-50/40 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab('list');
              setError(null);
            }}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Danh Sách &amp; Thêm Đơn Lẻ ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab('import_file');
              setError(null);
            }}
            className={`pb-2.5 px-3 font-bold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeSubTab === 'import_file'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>📁 Nhập Nhân Viên Hàng Loạt Bằng File Excel / CSV</span>
            {parsedStaffFromFile.length > 0 && (
              <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded-full text-[10px] font-mono">
                {parsedStaffFromFile.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto overscroll-contain flex-1 space-y-5" data-lenis-prevent>
          {activeSubTab === 'import_file' ? (
            /* PHÂN ĐOẠN: NHẬP NHÂN VIÊN TỪ FILE EXCEL / CSV */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 font-bold">
                  CSV
                </div>
                <div className="space-y-1">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
                    Tiếp Nhận Danh Sách Đội Ngũ Nhân Sự Hàng Loạt
                  </div>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 leading-relaxed">
                    Cho phép Phòng Tổ chức Cán bộ / Đơn vị Công viên Cây xanh nạp toàn bộ danh sách kỹ thuật viên, 
                    phân quyền và gán địa bàn trực thuộc chỉ với 1 click tải file bảng tính Excel (.xlsx) hoặc CSV (.csv).
                  </p>
                </div>
              </div>

              {/* Upload Drop Zone */}
              <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700/60 rounded-2xl p-6 bg-emerald-50/30 dark:bg-emerald-950/20 text-center hover:border-emerald-500 transition-colors">
                <input
                  type="file"
                  id="staff-csv-file-input"
                  accept=".csv,.xlsx,.xls,.txt"
                  onChange={handleStaffFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="staff-csv-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-100">
                    {uploadedFileName ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 justify-center">
                        <CheckCircle2 className="w-4 h-4" /> Đã nạp file: {uploadedFileName}
                      </span>
                    ) : (
                      'Chọn hoặc Kéo thả file Excel (.xlsx), CSV (.csv) danh sách nhân viên vào đây'
                    )}
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    Cột dữ liệu chuẩn: Họ và Tên, Username, Vai trò (STAFF/ADMIN), Số điện thoại, Địa bàn phụ trách, Tên đội nhóm
                  </p>
                </label>

                <div className="mt-4 pt-3 border-t border-emerald-200/60 dark:border-emerald-800/40 flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadSampleStaffCsv}
                    className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tải file Excel / CSV mẫu nhân sự (.csv)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLoadDemoStaffDataset}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>⚡ Nạp 5 KTV mẫu Cần Thơ (Thử nghiệm ngay)</span>
                  </button>
                </div>
              </div>

              {/* Bảng xem trước danh sách nhân sự từ file */}
              {parsedStaffFromFile.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Danh sách nhân sự trích xuất ({parsedStaffFromFile.length} người):</span>
                    </span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      ✓ Đã kiểm tra cấu trúc hợp lệ
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Họ &amp; Tên</th>
                          <th className="p-2">Username</th>
                          <th className="p-2">Vai trò</th>
                          <th className="p-2">Địa bàn phụ trách</th>
                          <th className="p-2">Đội ngũ / SĐT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {parsedStaffFromFile.map((s, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{s.fullName}</td>
                            <td className="p-2 font-mono text-emerald-600 dark:text-emerald-400">@{s.username}</td>
                            <td className="p-2">
                              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                {s.role}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 dark:text-slate-300">{s.assignedDistrict}</td>
                            <td className="p-2 text-slate-600 dark:text-slate-400">
                              {s.teamName} {s.phone ? `· ${s.phone}` : ''}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Nút Submit File Import */}
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleSubmitStaffFileImport}
                      disabled={isImporting || parsedStaffFromFile.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer text-xs"
                    >
                      <Check className="w-4 h-4" />
                      <span>🚀 Lưu {parsedStaffFromFile.length} Nhân Sự Vào Hệ Thống</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isEditing ? (
            /* FORM THÊM / SỬA NHÂN VIÊN */
            <form onSubmit={handleSubmit} className="p-5 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{editingUserId ? 'Chỉnh Sửa Thông Tin Nhân Viên' : 'Thêm Mới Kỹ Thuật Viên / Cán Bộ'}</span>
                </span>
                <span className="text-[11px] text-slate-400 italic">Điền thông tin định danh &amp; phân quyền</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ và Tên Cán Bộ / KTV *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Hậu"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên đăng nhập (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ví dụ: staff_hau"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò hệ thống *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="STAFF">👷 Kỹ thuật viên Thực địa (STAFF - Đi xe thang, nghiệm thu On-Chain)</option>
                    <option value="ADMIN">👮 Quản trị viên Đô thị (ADMIN - Điều phối, kiểm soát toàn quyền)</option>
                    <option value="CITIZEN">👤 Đại diện Tổ dân phố / Cộng tác viên (CITIZEN)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Địa bàn phụ trách chính (Quận/Huyện) *
                  </label>
                  <select
                    value={assignedDistrict}
                    onChange={(e) => setAssignedDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {CAN_THO_ZONES.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tên tổ / Đội kỹ thuật trực thuộc
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="Ví dụ: Đội Xe Thang Số 2 - Q. Ninh Kiều"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
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
                    onClick={handleCancelForm}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingUserId ? 'Lưu Thay Đổi' : 'Tạo Tài Khoản Nhân Viên'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* NÚT THÊM & THANH TÌM KIẾM */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm nhân viên theo tên, username, địa bàn..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                  />
                </div>

                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="ALL">Tất cả vai trò</option>
                  <option value="STAFF">Kỹ thuật viên (STAFF)</option>
                  <option value="ADMIN">Quản trị viên (ADMIN)</option>
                  <option value="CITIZEN">Công dân (CITIZEN)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ Thêm Nhân Viên Mới</span>
              </button>
            </div>
          )}

          {/* DANH SÁCH NHÂN VIÊN */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3">Họ Tên &amp; Tài Khoản</th>
                  <th className="p-3">Vai Trò</th>
                  <th className="p-3">Địa Bàn Phụ Trách</th>
                  <th className="p-3">Đội Ngũ / SĐT</th>
                  <th className="p-3">Trạng Thái</th>
                  <th className="p-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400 italic">
                      Không tìm thấy nhân sự nào phù hợp với bộ lọc.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{user.fullName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{user.username}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                              : user.role === 'STAFF'
                              ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-[180px]">
                            {user.assignedDistrict || 'Toàn TP. Cần Thơ'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                          {user.teamName || 'Tổ kỹ thuật chung'}
                        </div>
                        {user.phone && (
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 font-semibold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            Tạm ngưng
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer"
                            title="Sửa nhân viên"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {user.id !== 'user-admin' && (
                            <button
                              type="button"
                              onClick={() => handleDelete(user)}
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/60 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Xóa nhân viên"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 text-[11px]">
          <span>Tổng số nhân sự: <strong>{users.length}</strong> (Gồm {users.filter((u) => u.role === 'STAFF').length} KTV thực địa)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

