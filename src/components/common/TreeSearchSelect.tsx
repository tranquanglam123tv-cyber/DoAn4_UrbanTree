import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X, Trees, MapPin } from 'lucide-react';
import { Tree } from '../types';

interface TreeSearchSelectProps {
  trees: Tree[];
  value: string;
  onChange: (treeId: string) => void;
  label?: string;
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  required?: boolean;
  className?: string;
}

export const TreeSearchSelect: React.FC<TreeSearchSelectProps> = ({
  trees,
  value,
  onChange,
  label,
  placeholder = 'Tìm theo mã cây (HB-01), tên cây hoặc số nhà, tên đường...',
  allowEmpty = false,
  emptyLabel = '-- Không chọn cây cụ thể / Sự cố chung --',
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedTree = useMemo(() => {
    return trees.find((t) => t.id === value);
  }, [trees, value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter trees based on search query
  const filteredTrees = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return trees;
    return trees.filter((t) => {
      const code = (t.publicCode || '').toLowerCase();
      const name = (t.displayName || '').toLowerCase();
      const address = (t.address || '').toLowerCase();
      const treeType = (t.treeTypeId || '').toLowerCase();
      return (
        code.includes(query) ||
        name.includes(query) ||
        address.includes(query) ||
        treeType.includes(query)
      );
    });
  }, [trees, searchQuery]);

  const handleSelect = (treeId: string) => {
    onChange(treeId);
    setIsOpen(false);
    setSearchQuery('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'GOOD':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">Tốt</span>;
      case 'FAIR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400">Bình thường</span>;
      case 'POOR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">Kém</span>;
      case 'CRITICAL':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">Nguy cấp</span>;
      default:
        return null;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 text-xs">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-900 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          isOpen
            ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-6 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0">
            <Trees className="w-3.5 h-3.5" />
          </div>
          {selectedTree ? (
            <div className="min-w-0 flex-1 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  [{selectedTree.publicCode}]
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {selectedTree.displayName}
                </span>
                {getStatusBadge(selectedTree.healthStatus)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                <span className="truncate">{selectedTree.address}</span>
              </div>
            </div>
          ) : (
            <span className="text-xs text-slate-400 dark:text-slate-500 italic">
              {emptyLabel}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu with Live Search */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100 flex flex-col max-h-72">
          {/* Search Box Input */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="mt-1 px-1 flex items-center justify-between text-[10px] text-slate-400">
              <span>Đang hiển thị {filteredTrees.length} / {trees.length} cây</span>
              {searchQuery && <span className="text-emerald-600 font-medium">Lọc theo: "{searchQuery}"</span>}
            </div>
          </div>

          {/* List options */}
          <div className="overflow-y-auto overscroll-contain flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 p-1" data-lenis-prevent>
            {allowEmpty && (
              <button
                type="button"
                onClick={() => handleSelect('')}
                className={`w-full p-2 text-left rounded-lg text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors ${
                  !value ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <span>{emptyLabel}</span>
                {!value && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            )}

            {filteredTrees.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 italic">
                Không tìm thấy cây xanh nào khớp với từ khóa "{searchQuery}"
              </div>
            ) : (
              filteredTrees.map((tree) => {
                const isSelected = tree.id === value;
                return (
                  <button
                    key={tree.id}
                    type="button"
                    onClick={() => handleSelect(tree.id)}
                    className={`w-full p-2 text-left rounded-lg text-xs flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80'
                        : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          [{tree.publicCode}]
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {tree.displayName}
                        </span>
                        {getStatusBadge(tree.healthStatus)}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{tree.address}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
