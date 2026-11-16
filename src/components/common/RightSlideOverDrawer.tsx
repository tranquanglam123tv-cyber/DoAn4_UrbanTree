import React, { useEffect, useId } from 'react';
import { X } from 'lucide-react';
import { useEscapeOverlay } from '../../hooks/useEscapeOverlay';

interface RightSlideOverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  headerBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClass?: string; // default max-w-xl (576px)
}

export const RightSlideOverDrawer: React.FC<RightSlideOverDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  headerBadge,
  headerActions,
  children,
  footer,
  widthClass = 'max-w-xl',
}) => {
  const drawerId = useId();

  // Đóng bằng phím Escape qua global overlay stack (bảo vệ không đóng nhiều overlay cùng lúc)
  useEscapeOverlay(`drawer-${drawerId}`, isOpen, onClose);

  // Khóa scroll body khi mở drawer trên mobile
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in" aria-modal="true" role="dialog">
      {/* Backdrop mờ nền */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10 pointer-events-none">
        {/* Drawer Container trượt mượt mà từ cạnh phải */}
        <div
          className={`w-screen ${widthClass} pointer-events-auto bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-slide-in-right`}
        >
          {/* Header Drawer */}
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/90 shrink-0">
            <div className="min-w-0 flex-1 pr-3">
              <div className="flex items-center gap-2 flex-wrap">
                {typeof title === 'string' ? (
                  <h3 className="text-base font-bold text-slate-900 dark:text-white truncate">
                    {title}
                  </h3>
                ) : (
                  title
                )}
                {headerBadge}
              </div>
              {subtitle && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {subtitle}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Đóng (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body cuộn mượt mà */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5" data-lenis-prevent>
            {children}
          </div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/80 shrink-0">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

