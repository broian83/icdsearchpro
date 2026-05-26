import React, { useState, useEffect } from 'react';
import { Settings, Moon, Globe, Trash2, Database, AlertTriangle, CheckCircle2, Sparkles, Plus, Info, Globe2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function SettingsView({ onAliasesUpdated }) {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  
  // State
  const [aiLang, setAiLang] = useState(() => localStorage.getItem('icd_ai_lang') || 'id');
  const [aiStyle, setAiStyle] = useState(() => localStorage.getItem('icd_ai_style') || 'bpjs');
  const [uiScale, setUiScale] = useState(() => localStorage.getItem('icd_ui_scale') || '16px');
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [clearStatus, setClearStatus] = useState({ type: null, message: '' });
  const [isClearing, setIsClearing] = useState(false);

  // Custom Abbreviations State
  const [customList, setCustomList] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newExpansion, setNewExpansion] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Load custom list
  const loadCustomList = async () => {
    let list = [];
    
    // 1. Ambil dari localStorage
    try {
      const localCustom = JSON.parse(localStorage.getItem('icd_custom_abbreviations')) || {};
      Object.keys(localCustom).forEach(key => {
        list.push({ keyword: key, expansion: localCustom[key], is_local: true, is_public: false });
      });
    } catch (e) {}

    // 2. Ambil dari Supabase (jika login)
    if (isLoggedIn && user) {
      try {
        const { data, error } = await supabase
          .from('custom_abbreviations')
          .select('id, keyword, expansion, is_public')
          .eq('user_id', user.id);
        
        if (!error && data) {
          // Singkirkan duplikat lokal yang memiliki keyword yang sama dengan online
          const onlineKeywords = data.map(d => d.keyword.toUpperCase());
          list = list.filter(item => !onlineKeywords.includes(item.keyword.toUpperCase()));
          
          data.forEach(item => {
            list.push({ id: item.id, keyword: item.keyword, expansion: item.expansion, is_public: item.is_public, is_local: false });
          });
        }
      } catch (err) {
        console.warn("Failed to load custom abbreviations from Supabase:", err);
      }
    }
    setCustomList(list);
  };

  useEffect(() => {
    loadCustomList();
  }, [isLoggedIn, user]);

  const handleAddAbbreviation = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim() || !newExpansion.trim()) return;

    const kw = newKeyword.trim().toUpperCase();
    const exp = newExpansion.trim();
    setIsAdding(true);

    try {
      if (isLoggedIn && user) {
        // Simpan online ke Supabase
        const { error } = await supabase.from('custom_abbreviations').insert({
          user_id: user.id,
          keyword: kw,
          expansion: exp,
          is_public: newIsPublic
        });
        
        if (error) throw error;
      }

      // Selalu simpan ke LocalStorage agar tersedia offline
      const localCustom = JSON.parse(localStorage.getItem('icd_custom_abbreviations')) || {};
      localCustom[kw] = exp;
      localStorage.setItem('icd_custom_abbreviations', JSON.stringify(localCustom));

      setNewKeyword('');
      setNewExpansion('');
      
      const successMsg = isLoggedIn 
        ? 'Singkatan berhasil disimpan & disinkronkan online!' 
        : 'Singkatan berhasil disimpan secara lokal di browser.';
      showToast(successMsg, 'success');

      await loadCustomList();
      if (onAliasesUpdated) onAliasesUpdated();
    } catch (err) {
      console.error("Failed to add abbreviation:", err);
      showToast("Gagal menyimpan singkatan: " + err.message, "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteAbbreviation = async (item) => {
    try {
      if (!item.is_local && isLoggedIn && user) {
        // Hapus dari Supabase
        const { error } = await supabase
          .from('custom_abbreviations')
          .delete()
          .eq('id', item.id);
        if (error) throw error;
      }

      // Hapus dari LocalStorage
      const localCustom = JSON.parse(localStorage.getItem('icd_custom_abbreviations')) || {};
      delete localCustom[item.keyword.toUpperCase()];
      localStorage.setItem('icd_custom_abbreviations', JSON.stringify(localCustom));

      showToast('Singkatan berhasil dihapus!', 'info');
      await loadCustomList();
      if (onAliasesUpdated) onAliasesUpdated();
    } catch (err) {
      console.error("Failed to delete abbreviation:", err);
      showToast("Gagal menghapus singkatan: " + err.message, "error");
    }
  };

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

        {/* Manajemen Singkatan Medis Kustom */}
        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00B4A4]" />
              <h3 className="font-bold text-slate-800 dark:text-slate-100">Kamus Singkatan Medis Kustom</h3>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md">
              Dinamis
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Tambahkan singkatan medis kustom lokal rumah sakit Anda agar otomatis diterjemahkan oleh kolom pencarian utama saat Anda mengetiknya.
          </p>

          {/* Form Tambah */}
          <form onSubmit={handleAddAbbreviation} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Singkatan</label>
              <input
                type="text"
                placeholder="Contoh: CAD"
                required
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#00B4A4] focus:ring-2 focus:ring-[#00B4A4]/10 transition-all font-bold text-slate-800 dark:text-slate-200 uppercase"
              />
            </div>
            <div className="sm:col-span-5 space-y-1.5">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Kepanjangan Medis</label>
              <input
                type="text"
                placeholder="Contoh: Coronary Artery Disease"
                required
                value={newExpansion}
                onChange={(e) => setNewExpansion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:border-[#00B4A4] focus:ring-2 focus:ring-[#00B4A4]/10 transition-all text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="sm:col-span-2 flex items-center justify-start pb-2.5 sm:pb-3 gap-2">
              <input
                type="checkbox"
                id="is_public_abbr"
                checked={newIsPublic}
                onChange={(e) => setNewIsPublic(e.target.checked)}
                disabled={!isLoggedIn}
                className="w-4 h-4 text-[#00B4A4] border-slate-300 rounded focus:ring-[#00B4A4] disabled:opacity-40"
              />
              <label 
                htmlFor="is_public_abbr" 
                className={`text-xs font-semibold cursor-pointer ${isLoggedIn ? 'text-slate-600 dark:text-slate-400' : 'text-slate-400 dark:text-slate-600 line-through'}`}
                title={!isLoggedIn ? 'Login untuk membagikan singkatan online ke komunitas' : ''}
              >
                Publik (Share)
              </label>
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={isAdding}
                className="w-full px-4 py-2 bg-[#00B4A4] hover:bg-[#009B8D] text-white font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Tambah
              </button>
            </div>
          </form>

          {!isLoggedIn && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 rounded-lg flex items-start gap-2 text-xs">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Anda sedang offline/belum login. Singkatan baru akan disimpan secara lokal di browser Anda. Silakan login terlebih dahulu jika ingin mensinkronkan secara online ke cloud dan membagikannya ke komunitas.
              </span>
            </div>
          )}

          {/* Daftar Singkatan Kustom */}
          <div className="mt-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-3">Singkatan Kustom Anda ({customList.length})</h4>
            
            {customList.length === 0 ? (
              <div className="text-center p-6 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400 dark:text-slate-500 text-xs">
                Belum ada singkatan kustom yang dibuat. Tambahkan singkatan pertama Anda di atas!
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">Singkatan</th>
                      <th className="p-3">Kepanjangan</th>
                      <th className="p-3 text-center">Metode</th>
                      <th className="p-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customList.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-[#00B4A4] uppercase">{item.keyword}</td>
                        <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{item.expansion}</td>
                        <td className="p-3 text-center">
                          {item.is_local ? (
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded font-semibold text-[10px]">Lokal</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/20 text-teal-600 dark:text-teal-400 rounded font-semibold text-[10px] flex items-center justify-center gap-1 w-max mx-auto">
                              {item.is_public ? <Globe2 className="w-3 h-3" /> : null}
                              Online
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleDeleteAbbreviation(item)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                            title="Hapus Singkatan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
