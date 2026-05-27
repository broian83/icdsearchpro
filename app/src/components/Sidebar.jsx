import React from 'react';
import { X, Lock, LogIn, LogOut, Search, Brain, Star, Cloud, Settings, HelpCircle, User, ChevronLeft, ChevronRight, Clock, Plus, BookOpen, PenTool } from 'lucide-react';
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
        <div className="px-4 py-3 text-xs text-slate-400 dark:text-slate-500 italic">
          Belum ada riwayat
        </div>
      );
    }

    return (
      <div className="space-y-1 px-2 max-h-[220px] overflow-y-auto">
        {recentSearches.map((item, idx) => {
          const isObj = item && typeof item === 'object';
          const queryText = isObj ? item.query : item;
          const codeText = isObj ? item.code : null;
          const typeText = isObj ? item.type : 'icd10';

          return (
            <div 
              key={idx} 
              className="flex items-center justify-between group/item rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors p-1.5"
            >
              <button
                onClick={() => {
                  if (onSearchSelect) onSearchSelect(queryText, typeText);
                  if (window.innerWidth < 1024) onClose();
                }}
                className="flex items-center gap-2 min-w-0 flex-grow text-left text-xs font-medium text-slate-600 dark:text-slate-350 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]"
              >
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                {codeText && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#2AA79B] text-white rounded shrink-0 font-mono">
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
                className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity"
                title="Hapus"
              >
                <X className="w-3 h-3" />
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
        <div className="p-4 flex items-center justify-between border-b border-slate-150 dark:border-slate-850">
          {isMobileOrExpanded ? (
            <div 
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => handleTabClick('icd10')}
            >
              <img 
                src="/PMIK-id%20Logo.png" 
                alt="Logo PMIK-id" 
                className="w-8 h-8 object-contain shrink-0" 
              />
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">ICD Search Pro</h2>
                <p className="text-[10px] text-[#2AA79B] font-bold">by PMIK-id</p>
              </div>
            </div>
          ) : (
            <div 
              className="flex justify-center w-full cursor-pointer"
              onClick={() => handleTabClick('icd10')}
            >
              <img 
                src="/PMIK-id%20Logo.png" 
                alt="Logo PMIK-id" 
                className="w-8 h-8 object-contain" 
              />
            </div>
          )}

          {/* Close button on mobile, Collapse button on desktop */}
          {window.innerWidth < 1024 ? (
            <button 
              onClick={onClose}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          ) : (
            isMobileOrExpanded && (
              <button 
                onClick={onToggleExpand}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-[#2AA79B] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors hidden lg:block"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )
          )}
        </div>

        {/* Pencarian Baru Button */}
        <div className="p-3 border-b border-slate-150 dark:border-slate-850">
          {isMobileOrExpanded ? (
            <button
              onClick={() => handleTabClick('new_search')}
              className="w-full bg-[#2AA79B]/10 hover:bg-[#2AA79B]/25 text-[#2AA79B] dark:text-[#2AA79B] py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" /> Pencarian Baru
            </button>
          ) : (
            <button
              onClick={() => handleTabClick('new_search')}
              className="mx-auto w-10 h-10 bg-[#2AA79B]/10 hover:bg-[#2AA79B]/25 text-[#2AA79B] rounded-xl flex items-center justify-center transition-all hover:scale-105"
              title="Pencarian Baru"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigations */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div>
            {isMobileOrExpanded && (
              <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Kamus Utama
              </p>
            )}
            <div className="px-2 space-y-1">
              <button 
                onClick={() => handleTabClick('icd10')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                  activeTab === 'icd10' 
                    ? 'bg-[#2AA79B] text-white shadow-sm shadow-[#2AA79B]/25' 
                    : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]'
                }`}
                title="ICD-10"
              >
                <Search className="w-4 h-4 shrink-0" />
                {isMobileOrExpanded && <span>ICD-10 (Penyakit)</span>}
              </button>
              <button 
                onClick={() => handleTabClick('icd9')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                  activeTab === 'icd9' 
                    ? 'bg-[#2AA79B] text-white shadow-sm shadow-[#2AA79B]/25' 
                    : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]'
                }`}
                title="ICD-9"
              >
                <Search className="w-4 h-4 shrink-0" />
                {isMobileOrExpanded && <span>ICD-9 (Prosedur)</span>}
              </button>
            </div>
          </div>

          <div>
            {isMobileOrExpanded && (
              <p className="px-4 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Fitur Pintar
              </p>
            )}
            <div className="px-2 space-y-1">
              <button 
                onClick={() => handleTabClick('case')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold group ${
                  activeTab === 'case' 
                    ? 'bg-[#2AA79B] text-white shadow-sm shadow-[#2AA79B]/25' 
                    : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]'
                }`}
                title="Klinik AI"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Brain className={`w-4 h-4 shrink-0 ${activeTab === 'case' ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-[#2AA79B]'}`} />
                  {isMobileOrExpanded && <span className="truncate">Klinik AI</span>}
                </div>
                {isMobileOrExpanded && !isLoggedIn && <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />}
              </button>
              
              <button 
                onClick={() => handleTabClick('bookmark')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold group ${
                  activeTab === 'bookmark' 
                    ? 'bg-[#2AA79B] text-white shadow-sm shadow-[#2AA79B]/25' 
                    : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]'
                }`}
                title="Bookmark Saya"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Star className="w-4 h-4 shrink-0" />
                  {isMobileOrExpanded && <span className="truncate">Bookmark Saya</span>}
                </div>
                {isMobileOrExpanded && !isLoggedIn && <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />}
              </button>

              <button 
                onClick={() => handleTabClick('history')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all text-xs font-semibold group ${
                  activeTab === 'history' 
                    ? 'bg-[#2AA79B] text-white shadow-sm shadow-[#2AA79B]/25' 
                    : 'text-slate-650 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-[#2AA79B] dark:hover:text-[#2AA79B]'
                }`}
                title="Histori Cloud"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Cloud className="w-4 h-4 shrink-0" />
                  {isMobileOrExpanded && <span className="truncate">Histori Cloud</span>}
                </div>
                {isMobileOrExpanded && !isLoggedIn && <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-500" />}
              </button>
            </div>
          </div>

          {isMobileOrExpanded && (
            <div>
              <div className="px-4 flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Riwayat Pencarian
                </span>
                {recentSearches.length > 0 && (
                  <button 
                    onClick={onClearRecent}
                    className="text-[10px] text-red-500 hover:underline font-bold"
                  >
                    Hapus
                  </button>
                )}
              </div>
              {renderRecentSearches()}
            </div>
          )}
        </div>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
          {isMobileOrExpanded ? (
            <div className="space-y-2">
              {isLoggedIn ? (
                <div className="flex items-center gap-3 p-1.5 bg-slate-100/50 dark:bg-slate-800/40 rounded-xl">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0 border border-[#2AA79B]/35 flex items-center justify-center">
                    {user?.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {user?.user_metadata?.full_name || 'Rekan PMIK'}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => { loginWithGoogle(); if (window.innerWidth < 1024) onClose(); }}
                  className="w-full bg-[#2AA79B] hover:bg-[#208f84] text-white py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] shadow-sm shadow-[#2AA79B]/10"
                >
                  <LogIn className="w-4 h-4" /> Masuk / Daftar
                </button>
              )}

              <div className="grid grid-cols-2 gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <button 
                  onClick={() => handleTabClick('settings')}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 text-left"
                >
                  <Settings className="w-3.5 h-3.5" /> Setelan
                </button>
                <button 
                  onClick={() => handleTabClick('help')}
                  className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> Bantuan
                </button>
              </div>

              {isLoggedIn && (
                <button 
                  onClick={() => { logout(); if (window.innerWidth < 1024) onClose(); }}
                  className="w-full flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" /> Keluar Akun
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              {isLoggedIn ? (
                <div 
                  className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 border border-[#2AA79B]/35 flex items-center justify-center cursor-pointer"
                  onClick={() => handleTabClick('profile')}
                  title="Lihat Profil"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                  )}
                </div>
              ) : (
                <button 
                  onClick={loginWithGoogle}
                  className="w-8 h-8 bg-[#2AA79B] text-white rounded-xl flex items-center justify-center transition-transform hover:scale-105"
                  title="Masuk / Daftar"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              )}

              <button 
                onClick={() => handleTabClick('settings')}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Pengaturan"
              >
                <Settings className="w-4 h-4" />
              </button>
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

        {/* Floating expand toggle button (only visible when collapsed) */}
        {!isExpanded && (
          <button
            onClick={onToggleExpand}
            className="absolute top-1/2 -right-3 transform -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-[#2AA79B] shadow-sm cursor-pointer hover:scale-105 transition-all"
            title="Expand Sidebar"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </>
  );
}
