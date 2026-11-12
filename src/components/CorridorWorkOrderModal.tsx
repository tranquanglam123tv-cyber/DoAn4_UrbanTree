import React, { useRef } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  Truck,
  Wrench,
  Trees,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  MapPin,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { Tree, User } from '../types';
import { calculateISATraqRating, getTreeMilestone, getTreeStreetCode } from '../utils/treeUtils';

interface CorridorWorkOrderModalProps {
  corridorName: string;
  trees: Tree[];
  currentUser: User;
  onClose: () => void;
}

export const CorridorWorkOrderModal: React.FC<CorridorWorkOrderModalProps> = ({
  corridorName,
  trees,
  currentUser,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const orderNumber = `LC-CT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${trees[0]?.streetCode?.split('-')[0] || 'COR'}`;

  // Sắp xếp cây theo thứ tự liên hoàn
  const sortedTrees = [...trees].sort((a, b) => {
    const seqA = a.sequenceNumber ?? 0;
    const seqB = b.sequenceNumber ?? 0;
    return seqA - seqB;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const headers = [
      'STT',
      'Mã Biển Nhôm',
      'Mã Hệ Thống',
      'Tên Cây / Chủng Loài',
      'Mốc Số Nhà Hiện Trường',
      'Đường Kính (cm)',
      'Chiều Cao (m)',
      'Góc Nghiêng (°)',
      'Rỗng Thân (%)',
      'ISA TRAQ',
      'Hạng Mục Kỹ Thuật Đề Xuất',
    ];

    const rows = sortedTrees.map((t, idx) => {
      const traq = calculateISATraqRating(t);
      const actionProposal =
        traq.rating === 'EXTREME'
          ? 'Hạ thấp khẩn cấp 40% tán đón gió bão, giằng néo cáp chịu lực'
          : traq.rating === 'HIGH'
          ? 'Cắt tỉa cành khô vươn lòng đường, bôi keo sẹo Tree Seal'
          : t.heightM && t.heightM >= 7
          ? 'Hạ tán định kỳ đón mùa bão, phát quang tĩnh không đường dây'
          : 'Làm cỏ bồn rễ, tưới vi sinh kích rễ RPZ';

      return [
        idx + 1,
        getTreeStreetCode(t),
        t.publicCode,
        t.displayName,
        `"${getTreeMilestone(t)}"`,
        t.diameterCm || 30,
        t.heightM || 8,
        t.tiltAngleDeg ?? 0,
        t.hollowRatioPercent ?? 0,
        traq.rating,
        `"${actionProposal}"`,
      ];
    });

    const csvContent =
      '\uFEFF' +
      [`LỆNH CÔNG TÁC CA TRỰC TUYẾN ĐƯỜNG: ${corridorName}`, `Số hiệu: ${orderNumber} - Ngày: ${todayStr}`, '']
        .concat([headers.join(',')])
        .concat(rows.map((r) => r.join(',')))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `LenhCongTac_${corridorName.replace(/\s+/g, '_')}_${todayStr.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
      data-lenis-prevent
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full max-h-[94vh] shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto text-xs"
        data-lenis-prevent
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Modal Toolbar (Không in) */}
        <div className="px-6 py-3.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs">
              <Trees className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Lệnh Công Tác Ca Trực Tuyến Đường Liên Hoàn
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tuyến: <strong className="text-emerald-700 dark:text-emerald-400">{corridorName}</strong> ({sortedTrees.length} cây theo cọc mốc)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Xuất file danh sách CSV cho ca trực"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Xuất CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="In lệnh công tác khổ A4 cho tổ KTV"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>In Phiếu A4</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 📄 BẢN IN PHIẾU LỆNH CÔNG TÁC A4 THỰC CHIẾN */}
        <div ref={printRef} className="p-6 sm:p-10 overflow-y-auto overscroll-contain space-y-6 flex-1 bg-white text-slate-900">
          {/* Quốc hiệu & Tiêu ngữ */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b-2 border-slate-900 text-slate-900">
            <div>
              <div className="font-bold text-xs uppercase tracking-wider">ỦY BAN NHÂN DÂN THÀNH PHỐ CẦN THƠ</div>
              <div className="font-extrabold text-sm uppercase text-emerald-800">SỞ XÂY DỰNG — CÔNG TY CP CÂY XANH ĐÔ THỊ</div>
              <div className="text-[11px] text-slate-600 mt-1 font-mono">Số Lệnh: <strong>{orderNumber}</strong></div>
            </div>
            <div className="text-right">
              <div className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
              <div className="font-semibold text-xs italic underline">Độc lập – Tự do – Hạnh phúc</div>
              <div className="text-[11px] text-slate-600 mt-1 italic">Cần Thơ, ngày {todayStr}</div>
            </div>
          </div>

          {/* Tiêu đề lệnh công tác */}
          <div className="text-center space-y-1">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              PHIẾU LỆNH ĐIỀU ĐỘNG CÔNG TÁC CƠ GIỚI & LÂM SINH
            </h1>
            <p className="text-xs text-slate-600 italic">
              (Thực hiện theo đợt rà soát hạ độ cao tán lá đón mùa mưa bão & chăm sóc định kỳ theo tuyến)
            </p>
          </div>

          {/* Bảng phân công ca trực & thiết bị cơ giới */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-300 text-[11px]">
            <div className="space-y-1">
              <div><strong>Tuyến đường phụ trách:</strong> <span className="text-emerald-800 font-bold uppercase">{corridorName}</span></div>
              <div><strong>Tổ Kỹ thuật phụ trách:</strong> Đội Phản Ứng Nhanh & Xe Thang Lâm Sinh</div>
              <div><strong>Trưởng ca thực địa:</strong> {currentUser.fullName} ({currentUser.staffCode || 'KTV-CT-028'})</div>
              <div><strong>Khung giờ thi công:</strong> 06h00 – 11h30 & 13h30 – 17h00 (Ưu tiên cắt cành lớn giờ thấp điểm)</div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-blue-900 font-semibold">
                <Truck className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                <span><strong>Cơ giới huy động:</strong> Xe thang 18m (BKS 65A-098.22), Xe tải cẩu 5T</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-900 font-semibold">
                <Wrench className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span><strong>Trang bị:</strong> 02 cưa xích Stihl MS-194T trên cao, đai bảo hộ ngực-hông</span>
              </div>
              <div><strong>Vật tư xuất kho:</strong> 05 hộp keo Tree Seal, 20kg vôi sát trùng Bordeaux, cọc chống</div>
              <div><strong>Biện pháp an toàn:</strong> Căng dây cảnh báo bán kính 10m, đặt 06 chóp nón phản quang</div>
            </div>
          </div>

          {/* BẢNG CHI TIẾT DANH SÁCH CÂY THEO TUYẾN */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>DANH SÁCH {sortedTrees.length} CÂY TRÊN TUYẾN THEO THỨ TỰ DI CHUYỂN:</span>
              <span className="text-[11px] text-slate-500 font-normal italic">* KTV kiểm tra đối chiếu mã biển nhôm trước khi cưa tỉa</span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 uppercase font-bold border-b border-slate-300">
                    <th className="p-2 text-center w-8 border-r border-slate-300">STT</th>
                    <th className="p-2 border-r border-slate-300">Biển Nhôm</th>
                    <th className="p-2 border-r border-slate-300">Tên Cây / Loài</th>
                    <th className="p-2 border-r border-slate-300">Mốc Số Nhà Hiện Trường</th>
                    <th className="p-2 text-center border-r border-slate-300">Kích thước</th>
                    <th className="p-2 text-center border-r border-slate-300">Nghiêng / Rỗng</th>
                    <th className="p-2 text-center border-r border-slate-300">ISA TRAQ</th>
                    <th className="p-2 border-r border-slate-300">Nội Dung Xử Lý Đề Xuất</th>
                    <th className="p-2 text-center w-16">Ký Nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sortedTrees.map((tree, idx) => {
                    const traq = calculateISATraqRating(tree);
                    const isExtreme = traq.rating === 'EXTREME';
                    const isHigh = traq.rating === 'HIGH';

                    return (
                      <tr key={tree.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2 text-center font-bold text-slate-500 border-r border-slate-200">
                          {idx + 1}
                        </td>
                        <td className="p-2 font-mono font-black text-slate-900 border-r border-slate-200 whitespace-nowrap">
                          [{getTreeStreetCode(tree)}]
                        </td>
                        <td className="p-2 font-semibold text-slate-800 border-r border-slate-200">
                          {tree.displayName}
                        </td>
                        <td className="p-2 text-slate-700 border-r border-slate-200">
                          <strong>{getTreeMilestone(tree)}</strong>
                        </td>
                        <td className="p-2 text-center font-mono border-r border-slate-200 whitespace-nowrap">
                          {tree.diameterCm || 30}cm · {tree.heightM || 8}m
                        </td>
                        <td className="p-2 text-center font-mono border-r border-slate-200 whitespace-nowrap">
                          <span className={tree.tiltAngleDeg && tree.tiltAngleDeg >= 15 ? 'text-rose-600 font-bold' : ''}>
                            {tree.tiltAngleDeg ?? 0}°
                          </span>
                          {' / '}
                          <span className={tree.hollowRatioPercent && tree.hollowRatioPercent >= 40 ? 'text-rose-600 font-bold' : ''}>
                            {tree.hollowRatioPercent ?? 0}%
                          </span>
                        </td>
                        <td className="p-2 text-center border-r border-slate-200">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              isExtreme
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : isHigh
                                ? 'bg-orange-100 text-orange-800 border border-orange-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {traq.rating}
                          </span>
                        </td>
                        <td className="p-2 text-slate-700 border-r border-slate-200">
                          {isExtreme ? (
                            <span className="text-rose-700 font-bold">
                              ⚠️ Hạ tán khẩn cấp 40%, cưa cành khô sà lòng đường, bôi keo Tree Seal
                            </span>
                          ) : isHigh ? (
                            <span className="text-orange-700 font-semibold">
                              Cắt tỉa hạ ngọn 25% đón bão, quét vôi sát trùng gốc
                            </span>
                          ) : tree.heightM && tree.heightM >= 7 ? (
                            <span>Hạ độ cao tán đón mùa bão, giải tỏa tĩnh không dây điện</span>
                          ) : (
                            <span>Kiểm tra sâu bệnh, tỉa cành la, xới bồn bón vi sinh</span>
                          )}
                        </td>
                        <td className="p-2 text-center border-slate-200">
                          <div className="w-8 h-4 border border-dashed border-slate-400 mx-auto rounded" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Chữ ký 3 bên theo quy chuẩn quản lý đô thị */}
          <div className="grid grid-cols-3 gap-4 pt-6 text-center text-xs">
            <div>
              <div className="font-bold uppercase">KỸ THUẬT VIÊN TRƯỞNG CA</div>
              <div className="text-[10px] text-slate-500 italic">(Ký, ghi rõ họ tên & nghiệm thu)</div>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800">
                {currentUser.fullName}
              </div>
            </div>

            <div>
              <div className="font-bold uppercase">CHỈ HUY CÔNG TRƯỜNG CÂY XANH</div>
              <div className="text-[10px] text-slate-500 italic">(Kiểm tra an toàn cơ giới xe thang)</div>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800">
                KS. Lâm Quang Huy
              </div>
            </div>

            <div>
              <div className="font-bold uppercase">GIÁM SÁT SỞ XÂY DỰNG</div>
              <div className="text-[10px] text-slate-500 italic">(Phê duyệt thanh quyết toán công ích)</div>
              <div className="h-16 flex items-end justify-center font-semibold text-slate-800">
                Đặng Thế Thuận (SXD)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

