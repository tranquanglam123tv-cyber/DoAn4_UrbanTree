/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Header } from './components/Header';
import { HomeLandingView } from './components/HomeLandingView';
import { DashboardView } from './components/DashboardView';
import { TreeListView } from './components/TreeListView';
import { MapView } from './components/MapView';
import { CareRecordsView } from './components/CareRecordsView';
import { IncidentsView } from './components/IncidentsView';
import { BlockchainVerifyView } from './components/BlockchainVerifyView';
import { TreeQrModal } from './components/TreeQrModal';
import { TreeDetailModal } from './components/TreeDetailModal';
import { TreeFormModal } from './components/TreeFormModal';
import { CareFormModal } from './components/CareFormModal';
import { QRScannerModal } from './components/QRScannerModal';
import { PublicTreeModal } from './components/PublicTreeModal';
import { LoginModal } from './components/LoginModal';
import { CitizenPortalView } from './components/CitizenPortalView';
import { StaffWorkstationView } from './components/StaffWorkstationView';
import { StaffManagementModal } from './components/StaffManagementModal';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { SporeBackground } from './components/common/SporeBackground';
import { storage } from './db/storage';
import { Tree, User } from './types';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User>(storage.getActiveUser());
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('urbantree_theme');
    if (saved) return saved === 'dark';
    return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('urbantree_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('urbantree_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
    showToast(!isDark ? 'Đã bật Chế độ Tối (Dark Mode)' : 'Đã chuyển về Chế độ Sáng (Light Mode)');
  };

  // Modals state
  const [selectedTreeForDetail, setSelectedTreeForDetail] = useState<Tree | null>(null);
  const [selectedTreeForQr, setSelectedTreeForQr] = useState<Tree | null>(null);
  const [selectedTreeForEdit, setSelectedTreeForEdit] = useState<Tree | null>(null);
  const [addTreeCoords, setAddTreeCoords] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [treeVersion, setTreeVersion] = useState<number>(0);
  const [isAddTreeOpen, setIsAddTreeOpen] = useState(false);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [careModalTreeId, setCareModalTreeId] = useState<string | undefined>(undefined);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStaffManagementOpen, setIsStaffManagementOpen] = useState(false);
  const [publicTreeModalTree, setPublicTreeModalTree] = useState<Tree | null>(null);
  const [incidentReportTreeId, setIncidentReportTreeId] = useState<string | undefined>(undefined);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lenis instance ref
  const lenisRef = useRef<Lenis | null>(null);

  // Check if any modal is currently open
  const isAnyModalOpen = Boolean(
    selectedTreeForDetail ||
    selectedTreeForQr ||
    isAddTreeOpen ||
    selectedTreeForEdit ||
    isCareModalOpen ||
    isQrScannerOpen ||
    isLoginModalOpen ||
    isStaffManagementOpen ||
    publicTreeModalTree
  );

  // Automark Lenis Smooth Scroll Engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      prevent: (node: HTMLElement) => {
        if (!node || typeof node.closest !== 'function') return false;
        return Boolean(
          node.hasAttribute('data-lenis-prevent') ||
          node.closest('[data-lenis-prevent]') ||
          node.closest('.overflow-y-auto') ||
          node.closest('.overflow-auto')
        );
      },
    });
    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Lock background scroll and stop Lenis while any modal is open
  useEffect(() => {
    if (isAnyModalOpen) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAnyModalOpen]);

  // Check URL hash for direct QR code scanning link (e.g. #tree-TREE-001 or #report-TREE-001)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && (hash.startsWith('#tree-') || hash.startsWith('#report-'))) {
        const publicCode = hash.replace('#tree-', '').replace('#report-', '').trim();
        const tree = storage.getTreeByPublicCode(publicCode);
        if (tree) {
          if (currentUser.role === 'ADMIN' || currentUser.role === 'STAFF') {
            // Cán bộ mở mã QR -> Mở hồ sơ quản trị thực địa
            setSelectedTreeForDetail(tree);
            showToast(`Nhận diện QR [${tree.publicCode}] cho cán bộ: Mở hồ sơ quản trị.`);
          } else if (hash.startsWith('#report-')) {
            // Link trực tiếp báo cáo sự cố -> Mở thẳng form báo cáo
            handleReportIncidentForTree(tree);
            showToast(`Nhận diện QR [${tree.publicCode}]: Mở form gửi phản ánh sự cố khẩn cấp.`);
          } else {
            // Người dân quét mã QR (#tree-) -> Mở trang thông tin cây công cộng (kèm nút báo cáo sự cố 1-chạm không cần đăng nhập)
            setPublicTreeModalTree(tree);
            showToast(`Tra cứu cây xanh [${tree.publicCode}]: Xem hồ sơ & phản ánh sự cố không cần đăng nhập.`);
          }
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [currentUser]);

  const handleUserChange = (newUser: User) => {
    storage.setActiveUser(newUser);
    setCurrentUser(newUser);
    if (newUser.role === 'STAFF') {
      setActiveTab('staff_workstation');
      showToast(`Đã chuyển vai trò: Kỹ thuật viên ${newUser.fullName} (Bàn làm việc thực địa)`);
    } else if (newUser.role === 'ADMIN') {
      setActiveTab('dashboard');
      showToast(`Đã chuyển vai trò: Quản trị viên ${newUser.fullName} (Dashboard Vĩ mô)`);
    } else {
      setActiveTab('home');
      showToast(`Đã chuyển vai trò: ${newUser.fullName} (${newUser.role})`);
    }
  };

  const handleLoginSuccess = (user: User) => {
    storage.setActiveUser(user);
    setCurrentUser(user);
    if (user.role === 'CITIZEN') {
      setActiveTab('citizen_portal');
      showToast(`Chào mừng ${user.fullName} đến với Cổng Công Dân Xanh!`);
    } else if (user.role === 'STAFF') {
      setActiveTab('staff_workstation');
      showToast(`Đăng nhập thành công! Chào mừng Kỹ thuật viên ${user.fullName} vào Bàn làm việc thực địa.`);
    } else {
      setActiveTab('dashboard');
      showToast(`Đăng nhập thành công! Chào mừng Quản trị viên ${user.fullName}.`);
    }
  };

  const handleLogout = () => {
    const citizenUser: User = {
      id: 'citizen-guest',
      username: 'nguoidan',
      fullName: 'Người dân (Công cộng)',
      role: 'CITIZEN',
      isActive: true,
    };
    storage.setActiveUser(citizenUser);
    setCurrentUser(citizenUser);
    setActiveTab('home');
    showToast('Đã đăng xuất. Bạn đang ở chế độ Người dân công cộng.');
  };

  const handleResetSeed = () => {
    if (window.confirm('Bạn có chắc muốn khôi phục dữ liệu mẫu ban đầu và reset Blockchain?')) {
      storage.resetToDefaults();
      showToast('Đã khôi phục dữ liệu mẫu ban đầu thành công!');
      // re-render by toggling active user
      setCurrentUser({ ...storage.getActiveUser() });
    }
  };

  const handleOpenCareModal = (treeId?: string) => {
    setCareModalTreeId(treeId);
    setIsCareModalOpen(true);
  };

  const handleReportIncidentForTree = (tree: Tree) => {
    setIncidentReportTreeId(tree.id);
    setActiveTab('incidents');
    showToast(`Mở form gửi phản ánh sự cố cho cây ${tree.publicCode}`);
  };

  return (
    <div className={`min-h-screen flex flex-col relative transition-colors duration-300 ${
      isDark ? 'dark bg-[#070e0a] text-slate-100' : 'bg-[#F8FAF9] text-slate-900'
    } selection:bg-emerald-500 selection:text-white`}>
      {/* Ambient Botanical Spore Canvas Particles (Automark) */}
      <SporeBackground isDark={isDark} />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#174B36] text-white px-4 py-2.5 rounded-xl shadow-lg border border-[#347A50] text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Main Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onResetSeed={handleResetSeed}
        onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        {/* Trang Chủ (Landing Page công cộng ai cũng xem được) */}
        {activeTab === 'home' && (
          <HomeLandingView
            currentUser={currentUser}
            onOpenMap={() => setActiveTab('map')}
            onOpenReport={() => {
              setIncidentReportTreeId(undefined);
              setActiveTab('incidents');
            }}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onOpenAdminDashboard={() => {
              if (currentUser.role === 'STAFF') {
                setActiveTab('staff_workstation');
              } else if (currentUser.role === 'ADMIN') {
                setActiveTab('dashboard');
              } else {
                setIsLoginModalOpen(true);
              }
            }}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
          />
        )}

        {/* Bàn Làm Việc Thực Địa (Dành riêng cho Kỹ Thuật Viên Thực Địa - STAFF) */}
        {activeTab === 'staff_workstation' && (
          <StaffWorkstationView
            currentUser={currentUser}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenMap={() => setActiveTab('map')}
          />
        )}

        {/* Dashboard Vĩ Mô Quản Trị dành riêng cho Lãnh Đạo / Cơ Quan Quản Lý (ADMIN) */}
        {activeTab === 'dashboard' && currentUser.role === 'ADMIN' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAddTree={() => setIsAddTreeOpen(true)}
            onOpenCareModal={handleOpenCareModal}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenStaffManagement={() => setIsStaffManagementOpen(true)}
          />
        )}

        {/* Nếu Staff vào dashboard thì đưa về Bàn Làm Việc Thực Địa */}
        {activeTab === 'dashboard' && currentUser.role === 'STAFF' && (
          <StaffWorkstationView
            currentUser={currentUser}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenMap={() => setActiveTab('map')}
          />
        )}

        {/* Nếu Citizen vào dashboard thì điều hướng về Home */}
        {activeTab === 'dashboard' && currentUser.role === 'CITIZEN' && (
          <HomeLandingView
            currentUser={currentUser}
            onOpenMap={() => setActiveTab('map')}
            onOpenReport={() => {
              setIncidentReportTreeId(undefined);
              setActiveTab('incidents');
            }}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onOpenAdminDashboard={() => setIsLoginModalOpen(true)}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
          />
        )}

        {activeTab === 'trees' && currentUser.role !== 'CITIZEN' && (
          <TreeListView
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenQrModal={(tree) => setSelectedTreeForQr(tree)}
            onOpenAddTree={() => setIsAddTreeOpen(true)}
            onOpenEditTree={(tree) => setSelectedTreeForEdit(tree)}
            onOpenCareModal={handleOpenCareModal}
            onOpenPublicView={(tree) => setPublicTreeModalTree(tree)}
          />
        )}

        {activeTab === 'map' && (
          <MapView
            key={`map-view-${treeVersion}`}
            currentUser={currentUser}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenCareModal={handleOpenCareModal}
            onOpenIncidentReport={() => setActiveTab('incidents')}
            onOpenAddTree={(coords) => {
              setAddTreeCoords(coords || null);
              setSelectedTreeForEdit(null);
              setIsAddTreeOpen(true);
            }}
            onOpenEditTree={(tree) => {
              setSelectedTreeForEdit(tree);
              setAddTreeCoords(null);
            }}
            onTreeUpdated={() => setTreeVersion((v) => v + 1)}
          />
        )}

        {activeTab === 'care' && currentUser.role !== 'CITIZEN' && (
          <CareRecordsView
            onOpenCareModal={handleOpenCareModal}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
          />
        )}

        {/* Phân hệ Hồ sơ Công Dân Xanh & Phản ánh của tôi */}
        {activeTab === 'citizen_portal' && (
          <CitizenPortalView
            currentUser={currentUser}
            onNavigateToNewReport={(treeId) => {
              setIncidentReportTreeId(treeId);
              setActiveTab('incidents');
            }}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenMap={() => setActiveTab('map')}
          />
        )}

        {activeTab === 'incidents' && (
          <IncidentsView
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            currentUser={currentUser}
            initialTreeId={incidentReportTreeId}
          />
        )}

        {activeTab === 'blockchain' && currentUser.role === 'ADMIN' && (
          <BlockchainVerifyView />
        )}
      </main>

      {/* Footnote */}
      <footer className="border-t border-[#E0EBDD] dark:border-slate-800 bg-white dark:bg-[#08120d] py-4 mt-auto transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div>
            UrbanTree © 2026 · Hệ thống Quản lý Cây xanh Đô thị tích hợp QR Code & Blockchain
          </div>
          <div className="flex items-center gap-3">
            <span>HĐ EVM: <strong className="font-mono text-[#174B36] dark:text-emerald-400">0x71C8...12C8</strong></span>
            <span>·</span>
            <span>Chuẩn: <strong className="dark:text-slate-300">SHA-256 Canonical v1</strong></span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedTreeForDetail && (
        <TreeDetailModal
          tree={selectedTreeForDetail}
          onClose={() => setSelectedTreeForDetail(null)}
          onOpenQrModal={(tree) => {
            setSelectedTreeForDetail(null);
            setSelectedTreeForQr(tree);
          }}
          onOpenEditModal={(tree) => {
            setSelectedTreeForDetail(null);
            setSelectedTreeForEdit(tree);
          }}
          onOpenCareModal={(treeId) => {
            setSelectedTreeForDetail(null);
            handleOpenCareModal(treeId);
          }}
          onOpenPublicView={(tree) => {
            setSelectedTreeForDetail(null);
            setPublicTreeModalTree(tree);
          }}
          onTreeUpdated={() => {
            const updated = storage.getTreeById(selectedTreeForDetail.id);
            if (updated) setSelectedTreeForDetail({ ...updated });
          }}
        />
      )}

      {selectedTreeForQr && (
        <TreeQrModal
          tree={selectedTreeForQr}
          onClose={() => setSelectedTreeForQr(null)}
          onOpenPublicView={(tree) => {
            setSelectedTreeForQr(null);
            setPublicTreeModalTree(tree);
          }}
        />
      )}

      {(isAddTreeOpen || selectedTreeForEdit) && (
        <TreeFormModal
          tree={selectedTreeForEdit}
          initialCoords={addTreeCoords}
          onClose={() => {
            setIsAddTreeOpen(false);
            setSelectedTreeForEdit(null);
            setAddTreeCoords(null);
          }}
          onSaved={() => {
            setTreeVersion((v) => v + 1);
            showToast(selectedTreeForEdit ? 'Cập nhật cây thành công!' : 'Thêm cây và neo Blockchain thành công!');
          }}
        />
      )}

      {isCareModalOpen && (
        <CareFormModal
          initialTreeId={careModalTreeId}
          onClose={() => setIsCareModalOpen(false)}
          onSaved={() => {
            showToast('Đã lưu nhật ký chăm sóc và neo Smart Contract thành công!');
          }}
        />
      )}

      {isQrScannerOpen && (
        <QRScannerModal
          currentUser={currentUser}
          onClose={() => setIsQrScannerOpen(false)}
          onTreeScanned={(tree, role) => {
            if (role === 'ADMIN' || role === 'STAFF') {
              // Admin & Staff: Mở thẳng hồ sơ quản lý thực địa (ghi nhật ký, sửa, kiểm chứng On-chain)
              setSelectedTreeForDetail(tree);
              showToast(`Đã nhận diện QR [${tree.publicCode}] cho ${role}: Mở hồ sơ quản trị.`);
            } else {
              // Citizen: Ra thẳng luôn form gửi phản ánh sự cố cho cây đó, không cần đăng nhập gì hết!
              handleReportIncidentForTree(tree);
              showToast(`Đã quét QR [${tree.publicCode}]: Mở trực tiếp form gửi phản ánh sự cố (Không cần đăng nhập).`);
            }
          }}
        />
      )}

      {publicTreeModalTree && (
        <PublicTreeModal
          tree={publicTreeModalTree}
          currentUser={currentUser}
          onClose={() => setPublicTreeModalTree(null)}
          onReportIncident={handleReportIncidentForTree}
          onOpenManagement={(tree) => {
            setSelectedTreeForDetail(tree);
          }}
        />
      )}

      {/* Modal Đăng nhập Cán bộ Quản trị / Kỹ thuật viên */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 👥 Modal Quản trị Nhân sự & Đội ngũ KTV (Staff Management) */}
      <StaffManagementModal
        isOpen={isStaffManagementOpen}
        onClose={() => setIsStaffManagementOpen(false)}
        onUserListChanged={() => {
          showToast('Đã đồng bộ danh sách nhân sự thành công!');
        }}
      />

      {/* 📱 PWA Native Install Banner */}
      <PwaInstallBanner />
    </div>
  );
}
