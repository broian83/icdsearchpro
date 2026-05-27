import React from 'react';
import { X, Lock, LogIn, LogOut, Brain, Star, Cloud, Settings, HelpCircle, User, Clock, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ 
  isOpen, 
  onClose, 
  onSelectTab, 
  isExpanded, 
  onToggleExpand,
  recentSearches = [],
  onRemoveRecent,
  onClearRecent,
  onSearchSelect,
  activeTab
}) {
  const { user, isLoggedIn, loginWithGoogle, logout } = useAuth();

  const handleTabClick = (tab) => {
    onSelectTab(tab);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const renderRecentSearches = () => {
    if (recentSearches.length === 0) {
      return (
        <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-555 italic">
          Belum ada riwayat
        </div>
      );
    }

    return (
      <div className="space-y-1.5 px-2 max-h-[260px] overflow-y-auto">
        {recentSearches.map((item, idx) => {
          const isObj = item && typeof item === 'object';
          const queryText = isObj ? item.query : item;
          const codeText = isObj ? item.code : null;
          const typeText = isObj ? item.type : 'icd10';

          return (
            <div 
              key={idx} 
              className="flex items-center justify-between group/item rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:translate-x-1 transition-all duration-200 p-1.5"
            >
              <button
                onClick={() => {
                  if (onSearchSelect) onSearchSelect(queryText, typeText);
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-2 min-w-0 flex-grow text-left text-xs font-semibold text-slate-655 dark:text-slate-350 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {codeText && (
                  <span className="px-1.5 py-0.5 text-[9px] font-extrabold bg-[#2AA79B] text-white rounded shrink-0 font-mono">
                    {codeText}
                  </span>
                )}
                <span className="truncate">{queryText}</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRemoveRecent) onRemoveRecent(item);
                }}
                className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-455 hover:text-red-500 rounded transition-opacity"
                title="Hapus"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderContent = (isMobileOrExpanded) => {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-850 transition-colors duration-300">
        
        {/* Header / Brand */}
        <div className="p-4 flex items-center justify-between border-b border-slate-150 dark:border-slate-850 h-[73px]">
          {isMobileOrExpanded ? (
            <div 
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => handleTabClick('icd10')}
            >
              <div className="rounded-xl bg-white p-1.5 border border-slate-100 shadow-sm flex items-center justify-center shrink-0">
                <img 
                  src="/PMIK-id%20Logo.png" 
                  alt="Logo PMIK-id" 
                  className="w-7 h-7 object-contain" 
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight truncate">ICD Search Pro</h2>
                <p className="text-[9px] text-[#2AA79B] font-extrabold tracking-wider">by PMIK-id</p>
              </div>
            </div>
          ) : (
            <div 
              className="flex justify-center w-full cursor-pointer"
              onClick={() => handleTabClick('icd10')}
            >
              <div className="rounded-xl bg-white p-1 border border-slate-100 shadow-sm flex items-center justify-center">
                <img 
                  src="/PMIK-id%20Logo.png" 
                  alt="Logo" 
                  className="w-7 h-7 object-contain" 
                />
              </div>
            </div>
          )}

          {/* Close button on mobile ONLY. No collapse button here to prevent double hamburger */}
          {window.innerWidth < 1024 && (
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 dark:text-slate-555 hover:text-slate-655 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Pencarian Baru Outline/Ghost Button */}
        <div className="p-3 border-b border-slate-150 dark:border-slate-850">
          {isMobileOrExpanded ? (
            <button
              onClick={() => handleTabClick('new_search')}
              className="w-full bg-transparent hover:bg-[#2AA79B]/10 text-[#2AA79B] border-2 border-[#2AA79B] py-2 px-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Pencarian Baru
            </button>
          ) : (
            <button
              onClick={() => handleTabClick('new_search')}
              className="mx-auto w-10 h-10 bg-transparent hover:bg-[#2AA79B]/10 text-[#2AA79B] border-2 border-[#2AA79B] rounded-xl flex items-center justify-center transition-all hover:scale-105 cursor-pointer"
              title="Pencarian Baru"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigations */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {isMobileOrExpanded && (
            <div className="pt-2">
              <div className="px-4 flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-555 uppercase tracking-widest">
                  Riwayat Pencarian
                </span>
                {recentSearches.length > 0 && (
                  <button 
                    onClick={onClearRecent}
                    className="text-[10px] text-red-500 hover:underline font-bold cursor-pointer"
                  >
                    Hapus
                  </button>
                )}
              </div>
              {renderRecentSearches()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity lg:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Mobile Drawer Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </div>

      {/* Desktop Persistent / Collapsible Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full hidden lg:flex flex-col z-30 transition-all duration-300 ${
          isExpanded ? 'w-[280px]' : 'w-[72px]'
        }`}
      >
        {renderContent(isExpanded)}
      </div>
    </>
  );
}
