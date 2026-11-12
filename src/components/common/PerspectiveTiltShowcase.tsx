import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface PerspectiveTiltShowcaseProps {
  children: React.ReactNode;
  urlBarText?: string;
  badgeText?: string;
}

export const PerspectiveTiltShowcase: React.FC<PerspectiveTiltShowcaseProps> = ({
  children,
  urlBarText = 'urbantree.cantho.gov.vn/gis/live-radar',
  badgeText = 'RADAR TRỰC TIẾP GIS',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = cardRef.current;
    const triggerEl = containerRef.current;
    if (!el || !triggerEl) return;

    // Refresh ScrollTrigger to calculate accurate layout metrics
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 300);

    const mm = gsap.matchMedia();

    // Desktop (>= 1024px): Giữ nguyên góc nghiêng 3D, chỉ bắt đầu lật khi cuộn đến giữa màn hình
    mm.add('(min-width: 1024px)', () => {
      gsap.set(el, {
        transformPerspective: 1400,
        transformOrigin: '50% 20%',
        rotationX: 36, // Độ nghiêng 3D nằm ngửa rõ nét
        scale: 0.84,
        y: -40,
      });

      gsap.to(el, {
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 60%', // 🎯 CHỈ BẮT ĐẦU LẬT KHI LƯỚT TỚI GẦN GIỮA MÀN HÌNH
          end: 'top 15%',   // Hoàn thành dựng đứng thẳng khi thẻ chiếm trọn trung tâm tầm mắt
          scrub: 1.4,       // Mượt mà bám sát con lăn
          invalidateOnRefresh: true,
        },
        rotationX: 0,
        scale: 1,
        y: 0,
        ease: 'power2.out',
      });
    });

    // Mobile / Tablet (< 1024px)
    mm.add('(max-width: 1023px)', () => {
      gsap.set(el, {
        transformPerspective: 1100,
        transformOrigin: '50% 20%',
        rotationX: 28,
        scale: 0.88,
        y: -25,
      });

      gsap.to(el, {
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 65%', // Bắt đầu lật khi thẻ tiến vào nửa giữa màn hình
          end: 'top 20%',
          scrub: 1.4,
          invalidateOnRefresh: true,
        },
        rotationX: 0,
        scale: 1,
        y: 0,
        ease: 'power2.out',
      });
    });

    return () => {
      clearTimeout(timer);
      mm.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ perspective: '1400px' }}
      className="w-full flex justify-center py-6 sm:py-10 px-1 sm:px-4 overflow-visible"
    >
      <div
        ref={cardRef}
        data-gsap-video-showcase
        className="relative w-full max-w-7xl rounded-[32px] sm:rounded-[40px] bg-white dark:bg-[#0c1812] border border-slate-200/90 dark:border-emerald-500/20 p-2 sm:p-4 shadow-2xl shadow-emerald-950/15 dark:shadow-[0_4px_30px_rgba(0,0,0,0.6)] will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'perspective(1400px) rotateX(36deg) scale(0.84) translateY(-40px)',
          transformOrigin: '50% 20%',
        }}
      >
        {/* Thanh điều khiển Radar trung tâm */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 mb-2 sm:mb-3 bg-slate-50/90 dark:bg-slate-900/80 rounded-2xl border border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-rose-400" />
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-400" />
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline-block ml-3 px-3 py-1 text-xs font-mono text-slate-500 dark:text-emerald-400 bg-white dark:bg-[#070e0a] rounded-md border border-slate-200 dark:border-emerald-500/20">
              {urlBarText}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/70 dark:border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {badgeText}
          </div>
        </div>

        {/* Nội dung bên trong: Bản đồ Leaflet hoặc Dashboard GIS */}
        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-emerald-100/60 dark:border-emerald-500/20 bg-emerald-50/20 dark:bg-[#070e0a]/50">
          {children}
        </div>
      </div>
    </div>
  );
};
