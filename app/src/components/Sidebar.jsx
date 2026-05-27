import React from 'react';
import { X, Lock, LogIn, LogOut, Brain, Star, Cloud, Settings, HelpCircle, User, Clock, Plus, Menu, ChevronLeft } from 'lucide-react';
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
        <div className="px-5 py-3 text-xs text-slate-400 dark:text-slate-555 italic">
          Belum ada riwayat
        </div>
      );
    }

    return (
      <div className="space-y-1.5 px-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        {recentSearches.map((item, idx) => {
          const isObj = item && typeof item === 'object';
          const queryText = isObj ? item.query : item;
          const codeText = isObj ? item.code : null;
          const typeText = isObj ? item.type : 'icd10';

          return (
            <div 
              key={idx} 
              className="flex items-center justify-between group/item rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/60 transition-all duration-200 p-2 px-3"
            >
              <button
                onClick={() => {
                  if (onSearchSelect) onSearchSelect(queryText, typeText);
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-3 min-w-0 flex-grow text-left text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
              >
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
                className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-455 hover:text-red-500 rounded-full transition-opacity"
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
      <div 
        className={`flex flex-col h-full bg-[#f0f4f9] dark:bg-[#131722] border-r border-slate-200/60 dark:border-slate-850 transition-colors duration-300 ${!isMobileOrExpanded ? 'cursor-ew-resize' : ''}`}
        onClick={() => {
          if (!isMobileOrExpanded && window.innerWidth >= 1024) {
            onToggleExpand();
          }
        }}
      >
        
        {/* Header / Hamburger */}
        <div className={`pt-4 px-3 pb-2 flex items-center ${isMobileOrExpanded ? 'justify-between' : 'justify-center'}`}>
          {isMobileOrExpanded ? (
            <>
              {/* Icon Tutup Sidebar (Kiri) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.innerWidth < 1024) {
                    onClose();
                  } else {
                    onToggleExpand();
                  }
                }}
                className="p-2.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ml-1"
                title="Tutup menu"
              >
                {window.innerWidth < 1024 ? <X className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              </button>
              
              {/* Logo (Kanan) */}
              <div className="flex items-center pr-2">
                  <img 
                    src="/icdsearchpro_transparan.png" 
                    alt="Logo" 
                    className="w-10 h-10 object-contain cursor-pointer hover:scale-105 transition-transform drop-shadow-sm"
                    onClick={(e) => { e.stopPropagation(); handleTabClick('new_search'); }}
                    title="Kembali ke Beranda"
                  />
              </div>
            </>
          ) : (
            /* Logo Tunggal Saat Tertutup (Tengah) */
            <div className="p-1 rounded-xl transition-all flex items-center justify-center shrink-0">
                <img 
                  src="/icdsearchpro_transparan.png" 
                  alt="Logo" 
                  className="w-10 h-10 object-contain cursor-pointer hover:scale-105 transition-transform drop-shadow-sm"
                  onClick={(e) => { e.stopPropagation(); handleTabClick('new_search'); }}
                  title="Kembali ke Beranda"
                />
            </div>
          )}
        </div>

        {/* Pencarian Baru */}
        <div className="px-3 py-4">
          {isMobileOrExpanded ? (
            <button
              onClick={() => handleTabClick('new_search')}
              className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 px-4 rounded-full text-sm font-semibold flex items-center justify-start gap-3 shadow-sm transition-all cursor-pointer border border-slate-200/50 dark:border-transparent"
            >
              <Plus className="w-5 h-5" /> Pencarian Baru
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleTabClick('new_search'); }}
              className="mx-auto w-11 h-11 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-full flex items-center justify-center shadow-sm transition-all cursor-pointer border border-slate-200/50 dark:border-transparent"
              title="Pencarian Baru"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigations */}
        <div className="flex-1 overflow-y-auto py-2">
          {isMobileOrExpanded && (
            <div className="pt-2">
              <div className="px-6 flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Terbaru
                </span>
                {recentSearches.length > 0 && (
                  <button 
                    onClick={onClearRecent}
                    className="text-[10px] text-slate-400 hover:text-red-500 hover:underline font-bold cursor-pointer"
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
        className={`fixed top-0 left-0 h-full w-[260px] bg-white dark:bg-slate-900 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </div>

      {/* Desktop Persistent / Collapsible Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full hidden lg:flex flex-col z-30 transition-all duration-300 ${
          isExpanded ? 'w-[260px]' : 'w-[76px]'
        }`}
      >
        {renderContent(isExpanded)}
      </div>
    </>
  );
}
