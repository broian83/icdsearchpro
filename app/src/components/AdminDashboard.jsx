import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Users, Key, BarChart3, MessageSquare, Loader2, Save, Activity, RefreshCw } from 'lucide-react';

export function AdminDashboard() {
  const { isAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // States
  const [stats, setStats] = useState({ totalUsers: 0, totalSearches: 0, topCodes: [] });
  const [usersList, setUsersList] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Users
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
      if (profiles) setUsersList(profiles);

      // 2. Fetch Top Searches (Aggregation approximation)
      const { data: searches, error: sErr } = await supabase.from('search_history').select('query');
      if (searches) {
        const queryCount = {};
        searches.forEach(s => {
          const q = s.query.trim().toUpperCase();
          if (q) {
            queryCount[q] = (queryCount[q] || 0) + 1;
          }
        });
        const top = Object.entries(queryCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);
        
        setStats({
          totalUsers: profiles?.length || 0,
          totalSearches: searches.length,
          topCodes: top
        });
      }

      // 3. Fetch API Key
      const { data: settings } = await supabase.from('settings').select('value').eq('key', 'GEMINI_API_KEY').single();
      if (settings) {
        setApiKey(settings.value);
      }

      // 4. Fetch Feedback
      const { data: fbs } = await supabase.from('ranking_feedback').select('*').order('created_at', { ascending: false }).limit(50);
      if (fbs) setFeedbacks(fbs);

    } catch (err) {
      console.error("Error fetching admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'GEMINI_API_KEY',
        value: apiKey,
        updated_at: new Date()
      });
      if (error) throw error;
      alert("API Key berhasil disimpan!");
    } catch (err) {
      alert("Gagal menyimpan API Key: " + err.message);
    } finally {
      setSavingKey(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Akses Ditolak</h2>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Anda tidak memiliki hak akses administrator untuk halaman ini.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-[#2AA79B]" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Pusat kendali, analitik, dan manajemen konfigurasi ICD Pro.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </button>
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto pb-2 mb-6 gap-2 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'overview', icon: BarChart3, label: 'Statistik & Penggunaan' },
          { id: 'users', icon: Users, label: 'Manajemen Pengguna' },
          { id: 'apikey', icon: Key, label: 'Konfigurasi Gemini API' },
          { id: 'feedback', icon: MessageSquare, label: 'Umpan Balik' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap text-sm font-bold ${
              activeTab === tab.id 
                ? 'border-[#2AA79B] text-[#2AA79B]' 
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-[#2AA79B] mb-4" />
          <p className="text-slate-500">Memuat data dashboard...</p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Pengguna</div>
                  <div className="text-4xl font-black text-slate-800 dark:text-slate-100">{stats.totalUsers}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Pencarian</div>
                  <div className="text-4xl font-black text-[#2AA79B]">{stats.totalSearches}</div>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                  <div className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Total Feedback</div>
                  <div className="text-4xl font-black text-blue-500">{feedbacks.length}</div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-[#2AA79B]" /> 10 Kode Paling Banyak Dicari
                </h3>
                <div className="space-y-3">
                  {stats.topCodes.length > 0 ? stats.topCodes.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{item[0]}</div>
                      <div className="text-sm font-medium text-slate-500 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">{item[1]} pencarian</div>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-sm">Belum ada data pencarian.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-6 py-4">Nama / Kontak</th>
                      <th className="px-6 py-4">Profesi & Instansi</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Bergabung</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {usersList.map((usr) => (
                      <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{usr.full_name || 'Tanpa Nama'}</div>
                          <div className="text-slate-500 text-xs mt-1">{usr.whatsapp_number || 'Tidak ada WA'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700 dark:text-slate-300">{usr.profession || '-'}</div>
                          <div className="text-slate-500 text-xs mt-1">{usr.institution || '-'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${usr.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                            {usr.role || 'user'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(usr.updated_at).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: API KEY */}
          {activeTab === 'apikey' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl">
              <div className="flex items-start gap-4 mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/50">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold mb-1">Perhatian Keamanan</p>
                  <p>Kunci API Gemini ini sangat rahasia. Dengan menyimpannya di sini, kunci ini akan dienkripsi oleh *Row Level Security* (RLS) di Supabase dan hanya dapat diakses oleh sistem backend (Netlify Functions) dan Admin.</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Gemini API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2AA79B] focus:border-transparent transition-all font-mono"
                  />
                </div>
                <button
                  onClick={handleSaveApiKey}
                  disabled={savingKey}
                  className="flex items-center justify-center gap-2 w-full sm:w-auto bg-[#2AA79B] hover:bg-[#238c82] text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingKey ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  {savingKey ? 'Menyimpan...' : 'Simpan Kunci API'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden p-4 sm:p-6">
               <div className="space-y-4">
                  {feedbacks.length > 0 ? feedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-slate-800 dark:text-slate-200">User ID: <span className="font-mono text-xs text-slate-500">{fb.user_id.substring(0,8)}...</span></div>
                        <div className="text-xs text-slate-500">{new Date(fb.created_at).toLocaleString('id-ID')}</div>
                      </div>
                      <div className="text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-sm">
                        Pertanyaan: {fb.query}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${fb.score > 3 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          Rating: {fb.score}/5
                        </span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-center py-8">Belum ada umpan balik dari pengguna.</p>
                  )}
               </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
