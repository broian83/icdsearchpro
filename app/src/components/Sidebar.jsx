import React from 'react';
import { X, Lock, LogIn, LogOut, Search, Brain, Star, Cloud, Settings, HelpCircle, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function Sidebar({ isOpen, onClose, onSelectTab }) {
  const { user, isLoggedIn, loginWithGoogle, logout } = useAuth();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-72 sm:w-80 bg-white dark:bg-slate-800 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header (User/Login state) */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-700 rounded-full transition-colors focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>

          {isLoggedIn ? (
            <div className="flex items-center gap-4 mt-2">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border-2 border-[#00B4A4]/20 flex items-center justify-center">
                {user?.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 truncate">{user?.user_metadata?.full_name || 'Pengguna'}</h3>
                <span className="inline-block mt-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 bg-[#00B4A4]/10 text-[#00B4A4] rounded-full">
                  Member Pro
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Masuk ke ICD Search</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Akses Klinik AI dan simpan bookmark di Cloud.</p>
              <button 
                onClick={() => { loginWithGoogle(); onClose(); }}
                className="w-full bg-[#00B4A4] hover:bg-[#009B8D] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <LogIn className="w-4 h-4" /> Masuk / Daftar
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
          <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Kamus</p>
          <button 
            onClick={() => { onSelectTab('icd10'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#00B4A4] rounded-lg transition-colors font-medium text-left"
          >
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" /> ICD-10
          </button>
          <button 
            onClick={() => { onSelectTab('icd9'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#00B4A4] rounded-lg transition-colors font-medium text-left"
          >
            <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" /> ICD-9
          </button>

          <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-6 mb-2">Fitur Pro</p>
          <button 
            onClick={() => { onSelectTab('case'); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#00B4A4] rounded-lg transition-colors font-medium text-left group"
          >
            <div className="flex items-center gap-3">
              <Brain className={`w-5 h-5 ${isLoggedIn ? 'text-[#00B4A4]' : 'text-slate-400 dark:text-slate-500'}`} /> 
              Klinik AI {isLoggedIn && <span className="text-xs">✨</span>}
            </div>
            {!isLoggedIn && <Lock className="w-4 h-4 text-slate-300 group-hover:text-slate-400 dark:text-slate-500" />}
          </button>
          <button 
            onClick={() => { onSelectTab('bookmark'); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#00B4A4] rounded-lg transition-colors font-medium text-left group"
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Bookmark Saya
            </div>
            {!isLoggedIn && <Lock className="w-4 h-4 text-slate-300 group-hover:text-slate-400 dark:text-slate-500" />}
          </button>
          <button 
            onClick={() => { onSelectTab('history'); onClose(); }}
            className="w-full flex items-center justify-between px-3 py-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#00B4A4] rounded-lg transition-colors font-medium text-left group"
          >
            <div className="flex items-center gap-3">
              <Cloud className="w-5 h-5 text-slate-400 dark:text-slate-500" /> Histori Cloud
            </div>
            {!isLoggedIn && <Lock className="w-4 h-4 text-slate-300 group-hover:text-slate-400 dark:text-slate-500" />}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 flex flex-col gap-1">
          <button 
            onClick={() => { onSelectTab('settings'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-slate-900 rounded-lg transition-colors font-medium text-left text-sm"
          >
            <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Pengaturan
          </button>
          {isLoggedIn && (
            <button 
              onClick={() => { onSelectTab('profile'); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-slate-900 rounded-lg transition-colors font-medium text-left text-sm"
            >
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Profil Saya
            </button>
          )}
          <button 
            onClick={() => { onSelectTab('help'); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-slate-900 rounded-lg transition-colors font-medium text-left text-sm"
          >
            <HelpCircle className="w-4 h-4 text-slate-400 dark:text-slate-500" /> Bantuan
          </button>
          
          {isLoggedIn && (
            <button 
              onClick={() => { logout(); onClose(); }}
              className="w-full flex items-center gap-3 px-3 py-2 mt-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium text-left text-sm"
            >
              <LogOut className="w-4 h-4" /> Keluar
            </button>
          )}
        </div>
      </div>
    </>
  );
}
