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

    // Desktop (>= 1024px)
    mm.add('(min-width: 1024px)', () => {
      gsap.set(el, {
        transformPerspective: 1200,
        transformOrigin: '50% 10%',
        rotationX: 16,
        scale: 0.85,
        y: -40,
      });

      gsap.to(el, {
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 85%',
          end: 'top 20%',
          scrub: 1.2,
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
        transformPerspective: 1000,
        transformOrigin: '50% 10%',
        rotationX: 12,
        scale: 0.9,
      });

      gsap.to(el, {
        scrollTrigger: {
          trigger: triggerEl,
          start: 'top 90%',
          end: 'top 30%',
          scrub: 1.2,
          invalidateOnRefresh: true,
        },
        rotationX: 0,
        scale: 1,
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
        className="relative w-full max-w-7xl rounded-[32px] sm:rounded-[40px] bg-white border border-slate-200/90 p-2 sm:p-4 shadow-2xl shadow-emerald-950/10 will-change-transform"
        style={{
          transformStyle: 'preserve-3d',
          transform: 'perspective(1400px) rotateX(16deg) scale(0.85)',
          transformOrigin: '50% 10%',
        }}
      >
        {/* Thanh điều khiển Radar trung tâm */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 mb-2 sm:mb-3 bg-slate-50/90 rounded-2xl border border-slate-200/60">
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
