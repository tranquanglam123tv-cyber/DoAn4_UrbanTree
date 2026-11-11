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
  urlBarText = 'urbantree.saigon.gov.vn/gis/live-radar',
  badgeText = 'RADAR TRỰC TIẾP',
}) => {
  const showcaseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = showcaseRef.current;
    if (!el) return;

    const mm = gsap.matchMedia();

    // Màn hình Desktop (>= 1280px)
    mm.add('(min-width: 1280px)', () => {
      gsap.set(el, { scale: 0.84, rotationX: 12, top: -140 });
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: '15% 95%',
          end: '0% 30%',
          scrub: 1.2, // Damping quán tính cực mượt
        },
        scale: 1,
        rotationX: 0,
        top: 0,
        ease: 'power2.out',
      });
    });

    // Màn hình Mobile/Tablet (< 1280px)
    mm.add('(max-width: 1279px)', () => {
      gsap.set(el, { scale: 0.88, rotationX: 15 });
      gsap.to(el, {
        scrollTrigger: {
          trigger: el,
          start: '15% 95%',
          end: '0% 35%',
          scrub: 1.2,
        },
        scale: 1,
        rotationX: 0,
        ease: 'power2.out',
      });
    });

    return () => mm.revert();
  }, []);

  return (
    <div
      style={{ perspective: '1200px' }}
      className="w-full flex justify-center py-6 px-2 sm:px-4 overflow-hidden"
    >
      <div
        ref={showcaseRef}
        data-gsap-video-showcase
        className="relative w-full max-w-7xl rounded-[32px] sm:rounded-[40px] bg-white border border-slate-200/90 p-2 sm:p-4 shadow-2xl shadow-emerald-950/8"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Thanh điều khiển Radar trung tâm */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3.5 mb-2 sm:mb-3 bg-slate-50/90 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-rose-400" />
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-400" />
            <span className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline-block ml-3 px-3 py-1 text-xs font-mono text-slate-500 bg-white rounded-md border border-slate-200">
              {urlBarText}
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/70">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {badgeText}
          </div>
        </div>

        {/* Nội dung bên trong: Bản đồ Leaflet hoặc Dashboard GIS */}
        <div className="rounded-[24px] sm:rounded-[28px] overflow-hidden border border-emerald-100/60 bg-emerald-50/20">
          {children}
        </div>
      </div>
    </div>
  );
};

