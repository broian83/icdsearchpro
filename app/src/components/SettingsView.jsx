import React, { useState } from 'react';
import { Settings, Moon, Globe, Trash2, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export function SettingsView() {
  const { isLoggedIn, user } = useAuth();
  
  // State
  const [aiLang, setAiLang] = useState(() => localStorage.getItem('icd_ai_lang') || 'id');
  const [clearStatus, setClearStatus] = useState({ type: null, message: '' });
  const [isClearing, setIsClearing] = useState(false);

  // Handle language change
  const handleLangChange = (e) => {
    const lang = e.target.value;
    setAiLang(lang);
    localStorage.setItem('icd_ai_lang', lang);
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-slate-100 rounded-xl text-slate-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pengaturan</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola preferensi dan akun Anda.</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Fitur AI Language */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white rounded-lg border border-slate-200 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#00B4A4]/10 text-[#00B4A4] rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Preferensi Bahasa AI</h4>
              <p className="text-xs text-slate-500">Bahasa respons untuk fitur Klinik AI dan Penjelasan.</p>
            </div>
          </div>
          <select 
            value={aiLang}
            onChange={handleLangChange}
            className="w-full sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium outline-none focus:border-[#00B4A4] focus:ring-2 focus:ring-[#00B4A4]/20 transition-all cursor-pointer"
          >
            <option value="id">Bahasa Indonesia</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Manajemen Data */}
        <div className="p-5 border border-slate-200 rounded-xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-5 h-5 text-slate-700" />
            <h3 className="font-bold text-slate-800">Manajemen Data & Privasi</h3>
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
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-sm transition-colors"
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

        {/* Mode Gelap - Placeholder for now */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-200 text-slate-500 rounded-lg">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800">Mode Gelap (Dark Mode)</h4>
              <p className="text-xs text-slate-500">Segera hadir di tahap selanjutnya</p>
            </div>
          </div>
          <div className="w-10 h-5 bg-slate-200 rounded-full cursor-not-allowed relative">
            <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] left-[3px]"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
