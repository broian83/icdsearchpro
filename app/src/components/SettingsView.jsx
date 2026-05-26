import React, { useState } from 'react';
import { Settings, Moon, Globe, Trash2, Database, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';

export function SettingsView() {
  const { isLoggedIn, user } = useAuth();
  
  // State
  const [aiLang, setAiLang] = useState(() => localStorage.getItem('icd_ai_lang') || 'id');
  const [aiStyle, setAiStyle] = useState(() => localStorage.getItem('icd_ai_style') || 'bpjs');
  const [uiScale, setUiScale] = useState(() => localStorage.getItem('icd_ui_scale') || '16px');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [clearStatus, setClearStatus] = useState({ type: null, message: '' });
  const [isClearing, setIsClearing] = useState(false);

  // Handle language change
  const handleLangChange = (e) => {
    const lang = e.target.value;
    setAiLang(lang);
    localStorage.setItem('icd_ai_lang', lang);
  };

  // Handle AI style change
  const handleStyleChange = (e) => {
    const style = e.target.value;
    setAiStyle(style);
    localStorage.setItem('icd_ai_style', style);
  };

  // Handle clear local data
  const handleClearLocal = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua riwayat lokal di perangkat ini?')) {
      localStorage.removeItem('icd_recent_searches');
      localStorage.removeItem('icd_case_history');
      setClearStatus({ type: 'local', message: 'Riwayat lokal berhasil dihapus!' });
      setTimeout(() => setClearStatus({ type: null, message: '' }), 3000);
    }
  };

  // Handle clear cloud data
  const handleClearCloud = async () => {
    if (!isLoggedIn || !user) return;
    
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA riwayat pencarian yang tersimpan di Cloud? Data yang dihapus tidak dapat dikembalikan.')) {
      setIsClearing(true);
      try {
        const { error } = await supabase
          .from('search_history')
          .delete()
          .eq('user_id', user.id);
          
        if (error) throw error;
        
        setClearStatus({ type: 'cloud', message: 'Riwayat Cloud berhasil dihapus permanen!' });
      } catch (err) {
        console.error('Error deleting cloud history:', err);
        setClearStatus({ type: 'error', message: 'Gagal menghapus riwayat Cloud.' });
      } finally {
        setIsClearing(false);
        setTimeout(() => setClearStatus({ type: null, message: '' }), 3000);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pengaturan</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola preferensi dan akun Anda.</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Fitur AI Language */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00B4A4]/10 text-[#00B4A4] rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">Preferensi Bahasa AI</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bahasa respons untuk fitur Klinik AI dan Penjelasan.</p>
            </div>
          </div>
          <select 
            value={aiLang}
            onChange={handleLangChange}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-[#00B4A4] focus:ring-2 focus:ring-[#00B4A4]/20 transition-all cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Gaya Analisis AI */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00B4A4]/10 text-[#00B4A4] rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">Gaya Analisis AI</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Menentukan format kedalaman penjelasan koding AI.</p>
            </div>
          </div>
          <select 
            value={aiStyle}
            onChange={handleStyleChange}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-[#00B4A4] focus:ring-2 focus:ring-[#00B4A4]/20 transition-all cursor-pointer text-slate-700 dark:text-slate-200"
          >
            <option value="bpjs">Fokus Klaim BPJS (Default)</option>
            <option value="academic">Akademik & Detail Medis</option>
            <option value="concise">Ringkas & Langsung</option>
          </select>
        </div>

        {/* Manajemen Data */}
        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            <h3 className="font-bold text-slate-800 dark:text-slate-100">Manajemen Data & Privasi</h3>
          </div>
          
          {clearStatus.message && (
            <div className={`p-3 text-sm rounded-lg flex items-center gap-2 ${clearStatus.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              <CheckCircle2 className="w-4 h-4" />
              {clearStatus.message}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
              onClick={handleClearLocal}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg text-sm transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Riwayat Lokal
            </button>
            
            {isLoggedIn && (
              <button 
                onClick={handleClearCloud}
                disabled={isClearing}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {isClearing ? (
                  <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
                Hapus Riwayat Cloud
              </button>
            )}
          </div>
        </div>

        {/* Pengaturan Ukuran Teks / Skala UI */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center font-bold text-lg leading-none w-9 h-9">
              Aa
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">Ukuran Tampilan</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sesuaikan ukuran teks dan elemen aplikasi.</p>
            </div>
          </div>
          <select 
            value={uiScale}
            onChange={(e) => {
              const val = e.target.value;
              localStorage.setItem('icd_ui_scale', val);
              document.documentElement.style.fontSize = val;
              setUiScale(val); 
            }}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all cursor-pointer"
          >
            <option value="14px">Kecil</option>
            <option value="16px">Normal</option>
            <option value="18px">Besar</option>
            <option value="20px">Sangat Besar</option>
          </select>
        </div>

        {/* Mode Gelap */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg flex items-center justify-center w-9 h-9 transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-100">Mode Gelap</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Ubah tampilan menjadi tema gelap.</p>
            </div>
          </div>
          
          <button 
            onClick={() => {
              const html = document.documentElement;
              const isDark = html.classList.toggle('dark');
              localStorage.setItem('icd_dark_mode', isDark ? '1' : '0');
              setIsDarkMode(isDark);
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-purple-600' : 'bg-slate-200 dark:bg-slate-700'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-slate-800 transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

      </div>
    </div>
  );
}
