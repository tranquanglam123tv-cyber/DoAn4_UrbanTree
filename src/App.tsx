/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { SporeBackground } from './components/common/SporeBackground';
import { storage } from './db/storage';
import { Tree, User } from './types';

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<User>(storage.getActiveUser());
  const [isDark, setIsDark] = useState<boolean>(() => {
    return localStorage.getItem('urbantree_theme') === 'dark';
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
  const [isAddTreeOpen, setIsAddTreeOpen] = useState(false);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [careModalTreeId, setCareModalTreeId] = useState<string | undefined>(undefined);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [publicTreeModalTree, setPublicTreeModalTree] = useState<Tree | null>(null);
  const [incidentReportTreeId, setIncidentReportTreeId] = useState<string | undefined>(undefined);

  // Notification / Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Automark Lenis Smooth Scroll Engine
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const ticker = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, []);

  // Check URL hash for direct QR code scanning link (e.g. #tree-TREE-001)
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#tree-')) {
        const publicCode = hash.replace('#tree-', '').trim();
        const tree = storage.getTreeByPublicCode(publicCode);
        if (tree) {
          setPublicTreeModalTree(tree);
        }
      }
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, []);

  const handleUserChange = (newUser: User) => {
    storage.setActiveUser(newUser);
    setCurrentUser(newUser);
    showToast(`Đã chuyển vai trò: ${newUser.fullName} (${newUser.role})`);
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
    <div className={`min-h-screen flex flex-col relative transition-colors duration-200 ${
      isDark ? 'dark bg-[#060B08] text-[#E2E8F0]' : 'bg-[#F8FAF9] text-[#0F172A]'
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
        onResetSeed={handleResetSeed}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        {/* Trang Chủ (Landing Page công cộng ai cũng xem được) */}
        {activeTab === 'home' && (
          <HomeLandingView
            onOpenMap={() => setActiveTab('map')}
            onOpenReport={() => setActiveTab('incidents')}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onOpenAdminDashboard={() => setActiveTab('dashboard')}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
          />
        )}

        {/* Dashboard Quản trị dành cho Admin & Staff */}
        {activeTab === 'dashboard' && currentUser.role !== 'CITIZEN' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenAddTree={() => setIsAddTreeOpen(true)}
            onOpenCareModal={handleOpenCareModal}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
          />
        )}

        {/* Nếu Citizen vào dashboard thì điều hướng về Home */}
        {activeTab === 'dashboard' && currentUser.role === 'CITIZEN' && (
          <HomeLandingView
            onOpenMap={() => setActiveTab('map')}
            onOpenReport={() => setActiveTab('incidents')}
            onOpenQrScanner={() => setIsQrScannerOpen(true)}
            onOpenAdminDashboard={() => showToast('Bạn đang ở vai trò Người dân. Vui lòng chuyển vai trò sang Admin hoặc Staff ở góc trên để vào Dashboard Quản Trị.')}
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
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
            onOpenCareModal={handleOpenCareModal}
            onOpenIncidentReport={() => setActiveTab('incidents')}
          />
        )}

        {activeTab === 'care' && currentUser.role !== 'CITIZEN' && (
          <CareRecordsView
            onOpenCareModal={handleOpenCareModal}
            onSelectTree={(tree) => setSelectedTreeForDetail(tree)}
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
      <footer className="border-t border-[#E0EBDD] bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            UrbanTree © 2026 · Hệ thống Quản lý Cây xanh Đô thị tích hợp QR Code & Blockchain
          </div>
          <div className="flex items-center gap-3">
            <span>HĐ EVM: <strong className="font-mono text-[#174B36]">0x71C8...12C8</strong></span>
            <span>·</span>
            <span>Chuẩn: <strong>SHA-256 Canonical v1</strong></span>
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
          onClose={() => {
            setIsAddTreeOpen(false);
            setSelectedTreeForEdit(null);
          }}
          onSaved={() => {
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
              // Citizen: Mở cổng tra cứu công cộng (xem lai lịch & báo cáo sự cố)
              setPublicTreeModalTree(tree);
              showToast(`Đã quét QR [${tree.publicCode}]: Mở thông tin công khai & báo cáo sự cố.`);
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

      {/* 📱 PWA Native Install Banner */}
      <PwaInstallBanner />
    </div>
  );
}
