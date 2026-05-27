import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, Users, Key, BarChart3, MessageSquare, Loader2,
  Save, Activity, RefreshCw, TrendingUp, Search, Building2,
  Stethoscope, Star, AlertTriangle, CheckCircle, Eye, EyeOff,
  ChevronRight, Zap, Shield, ArrowUpRight, Hash
} from 'lucide-react';

// ─── Komponen Mini ────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, gradient, delay = 0 }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg"
      style={{
        background: gradient,
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/50" />
        </div>
        <div className="text-3xl font-black tracking-tight mb-1">{value}</div>
        <div className="text-white/70 text-sm font-medium">{label}</div>
        {sub && <div className="text-white/50 text-xs mt-1">{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Belum ada data</div>
  );
  const maxValue = maxVal || Math.max(...data.map(d => d[1]));
  return (
    <div className="space-y-3">
      {data.map(([label, val], idx) => (
        <div key={idx} className="group">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[60%]" title={label}>
              <span className="text-slate-400 dark:text-slate-600 mr-2">#{idx + 1}</span>
              {label}
            </span>
            <span className="text-xs font-bold text-[#2AA79B]">{val}x</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${(val / maxValue) * 100}%`,
                background: idx === 0
                  ? 'linear-gradient(90deg, #2AA79B, #38d9cc)'
                  : idx === 1
                    ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                    : 'linear-gradient(90deg, #8b5cf6, #a78bfa)',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SideNav({ active, onChange }) {
  const items = [
    { id: 'overview', icon: BarChart3, label: 'Ikhtisar' },
    { id: 'searches', icon: Search, label: 'Analitik Pencarian' },
    { id: 'users', icon: Users, label: 'Pengguna' },
    { id: 'demographics', icon: Building2, label: 'Demografi' },
    { id: 'feedback', icon: MessageSquare, label: 'Umpan Balik' },
    { id: 'apikey', icon: Key, label: 'API Config' },
  ];

  return (
    <aside className="w-full md:w-56 shrink-0">
      <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full text-left ${
              active === item.id
                ? 'bg-[#2AA79B] text-white shadow-lg shadow-[#2AA79B]/30'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
            {active === item.id && <ChevronRight className="w-3 h-3 ml-auto hidden md:block" />}
          </button>
        ))}
      </nav>
    </aside>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({ totalUsers: 0, totalSearches: 0, topCodes: [], totalFeedbacks: 0 });
  const [usersList, setUsersList] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [demographics, setDemographics] = useState({ institutions: [], professions: [] });

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: searches } = await supabase.from('search_history').select('query, created_at');
      const { data: fbs } = await supabase.from('ranking_feedback').select('*').order('created_at', { ascending: false }).limit(100);
      const { data: settings } = await supabase.from('settings').select('value').eq('key', 'GEMINI_API_KEY').single();

      if (profiles) {
        setUsersList(profiles);

        // Demographics
        const instCount = {};
        const profCount = {};
        profiles.forEach(p => {
          if (p.institution) instCount[p.institution] = (instCount[p.institution] || 0) + 1;
          if (p.profession) profCount[p.profession] = (profCount[p.profession] || 0) + 1;
        });
        setDemographics({
          institutions: Object.entries(instCount).sort((a, b) => b[1] - a[1]).slice(0, 8),
          professions: Object.entries(profCount).sort((a, b) => b[1] - a[1]).slice(0, 8),
        });
      }

      if (searches) {
        const queryCount = {};
        searches.forEach(s => {
          const q = (s.query || '').trim().toUpperCase();
          if (q) queryCount[q] = (queryCount[q] || 0) + 1;
        });
        const top = Object.entries(queryCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
        setStats({
          totalUsers: profiles?.length || 0,
          totalSearches: searches.length,
          topCodes: top,
          totalFeedbacks: fbs?.length || 0,
        });
      }

      if (settings) setApiKey(settings.value);
      if (fbs) setFeedbacks(fbs);

    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchDashboardData().finally(() => setLoading(false));
    }
  }, [isAdmin, fetchDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      const { error } = await supabase.from('settings').upsert({
        key: 'GEMINI_API_KEY',
        value: apiKey,
        updated_at: new Date(),
      });
      if (error) throw error;
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(false);
    }
  };

  // ─── Akses Ditolak ────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs">
          Halaman ini hanya dapat diakses oleh Administrator ICD Pro.
        </p>
      </div>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <div className="absolute -inset-1 rounded-2xl border-2 border-[#2AA79B] opacity-50 animate-ping" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat Admin Dashboard...</p>
      </div>
    );
  }

  // ─── Konten Per Tab ─────────────────────────────────────────────────────────

  const renderContent = () => {
    switch (activeTab) {

      case 'overview':
        return (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Pengguna" value={stats.totalUsers}
                gradient="linear-gradient(135deg, #2AA79B 0%, #1d7a72 100%)" />
              <StatCard icon={Search} label="Total Pencarian" value={stats.totalSearches.toLocaleString()}
                gradient="linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" delay={100} />
              <StatCard icon={Star} label="Umpan Balik" value={stats.totalFeedbacks}
                gradient="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)" delay={200} />
              <StatCard icon={Zap} label="Kode Unik Dicari" value={stats.topCodes.length > 0 ? `${stats.topCodes.length}+` : '0'}
                gradient="linear-gradient(135deg, #f59e0b 0%, #b45309 100%)" delay={300} />
            </div>

            {/* Top Searches Chart */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#2AA79B]/10 flex items-center justify-center">
                    <Activity className="w-4 h-4 text-[#2AA79B]" />
                  </div>
                  10 Kode Paling Banyak Dicari
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
                  {stats.totalSearches} total
                </span>
              </div>
              <BarChart data={stats.topCodes} />
            </div>

            {/* Quick User Preview */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-500" />
                  </div>
                  Pengguna Terbaru
                </h3>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs text-[#2AA79B] font-bold hover:underline flex items-center gap-1"
                >
                  Lihat Semua <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.slice(0, 5).map((usr) => (
                  <div key={usr.id} className="flex items-center gap-3 py-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2AA79B] to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                      {(usr.full_name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{usr.full_name || 'Tanpa Nama'}</div>
                      <div className="text-xs text-slate-400 truncate">{usr.institution || usr.profession || '-'}</div>
                    </div>
                    <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${usr.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                      {usr.role || 'user'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'searches':
        return (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1">Analitik Pencarian Kode ICD</h3>
              <p className="text-slate-400 text-sm mb-6">Menampilkan agregasi kueri pencarian dari seluruh pengguna.</p>
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-br from-[#2AA79B]/10 to-[#2AA79B]/5 dark:from-[#2AA79B]/20 rounded-xl p-4 border border-[#2AA79B]/20">
                  <div className="text-2xl font-black text-[#2AA79B]">{stats.totalSearches.toLocaleString()}</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Total kueri dikirim</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-50/30 dark:from-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800/30">
                  <div className="text-2xl font-black text-purple-600">
                    {stats.topCodes.length > 0 ? ((stats.topCodes[0][1] / stats.totalSearches) * 100).toFixed(1) : 0}%
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400">Share kueri teratas</div>
                </div>
              </div>
              <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Peringkat 10 Kode Teratas</h4>
              <BarChart data={stats.topCodes} />
            </div>

            {/* Detail table */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" /> Tabel Lengkap
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                    <tr>
                      <th className="px-6 py-3 text-left w-10">#</th>
                      <th className="px-6 py-3 text-left">Kueri</th>
                      <th className="px-6 py-3 text-right">Jumlah</th>
                      <th className="px-6 py-3 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {stats.topCodes.map(([code, count], idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-6 py-3 text-slate-400 font-bold">{idx + 1}</td>
                        <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-200">{code}</td>
                        <td className="px-6 py-3 text-right font-bold text-[#2AA79B]">{count}</td>
                        <td className="px-6 py-3 text-right text-slate-500">
                          {((count / stats.totalSearches) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100">Daftar Pengguna Terdaftar</h3>
                <p className="text-xs text-slate-400 mt-0.5">{usersList.length} pengguna ditemukan</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 text-left">Pengguna</th>
                    <th className="px-6 py-3 text-left">Profesi</th>
                    <th className="px-6 py-3 text-left">Instansi</th>
                    <th className="px-6 py-3 text-left">Kontak</th>
                    <th className="px-6 py-3 text-center">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {usersList.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2AA79B] to-blue-500 flex items-center justify-center text-white font-black text-sm shrink-0">
                            {(usr.full_name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200">{usr.full_name || 'Tanpa Nama'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{usr.profession || <span className="text-slate-300">-</span>}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{usr.institution || <span className="text-slate-300">-</span>}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{usr.whatsapp_number || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          usr.role === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {usr.role || 'user'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'demographics':
        return (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Instansi */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-blue-500" />
                </div>
                Distribusi Instansi
              </h3>
              <p className="text-xs text-slate-400 mb-5">Asal instansi pengguna terdaftar</p>
              {demographics.institutions.length > 0 ? (
                <div className="space-y-3">
                  {demographics.institutions.map(([name, count], idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{name}</span>
                        <span className="text-xs font-bold text-blue-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400"
                          style={{ width: `${(count / demographics.institutions[0][1]) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-6">Belum ada data instansi</p>
              )}
            </div>

            {/* Profesi */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4 text-purple-500" />
                </div>
                Minat Klinis / Profesi
              </h3>
              <p className="text-xs text-slate-400 mb-5">Sebaran profesi dan minat klinis pengguna</p>
              {demographics.professions.length > 0 ? (
                <div className="space-y-3">
                  {demographics.professions.map(([name, count], idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70%]">{name}</span>
                        <span className="text-xs font-bold text-purple-500">{count}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400"
                          style={{ width: `${(count / demographics.professions[0][1]) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm text-center py-6">Belum ada data profesi</p>
              )}
            </div>
          </div>
        );

      case 'feedback':
        return (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 mb-2">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-black text-green-600">{feedbacks.filter(f => f.score >= 4).length}</div>
                  <div className="text-xs text-slate-500">Feedback positif</div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl p-4 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <div>
                  <div className="text-2xl font-black text-red-500">{feedbacks.filter(f => f.score < 4).length}</div>
                  <div className="text-xs text-slate-500">Perlu perhatian</div>
                </div>
              </div>
            </div>

            {feedbacks.length > 0 ? feedbacks.map((fb) => (
              <div key={fb.id} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                      <span className="text-white font-black text-xs">U</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">Pengguna Anonim</div>
                      <div className="text-xs text-slate-400 font-mono">{fb.user_id?.substring(0, 8)}...</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3.5 h-3.5 ${s <= fb.score ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">{new Date(fb.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400 mb-1 font-bold uppercase tracking-wider">Kueri</div>
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{fb.query || '-'}</div>
                </div>
              </div>
            )) : (
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">Belum ada umpan balik dari pengguna</p>
              </div>
            )}
          </div>
        );

      case 'apikey':
        return (
          <div className="max-w-2xl space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-400 mb-1">Keamanan Tinggi</p>
                <p className="text-sm text-amber-700 dark:text-amber-500/80">
                  Kunci API tersimpan terenkripsi di Supabase, dilindungi Row Level Security (RLS). Hanya Admin dan sistem backend yang dapat mengaksesnya.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1">Gemini API Key</h3>
                <p className="text-sm text-slate-400">Kunci ini digunakan oleh fitur Klinik AI (Case Consultation)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Kunci API
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#2AA79B] focus:border-transparent transition-all font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveApiKey}
                disabled={savingKey || !apiKey}
                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2AA79B] to-[#1d7a72] hover:from-[#238c82] hover:to-[#1a6660] text-white px-6 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-[#2AA79B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {savingKey ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {savingKey ? 'Menyimpan...' : 'Simpan & Aktifkan'}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─── Layout Utama ─────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] flex items-center justify-center shadow-lg shadow-[#2AA79B]/30">
            <ShieldAlert className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm">ICD Pro — Pusat Kendali & Analitik</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all hover:border-[#2AA79B] hover:text-[#2AA79B] shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Segarkan</span>
        </button>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex flex-col md:flex-row gap-6">
        <SideNav active={activeTab} onChange={setActiveTab} />
        <main className="flex-1 min-w-0">
          {renderContent()}
        </main>
      </div>

    </div>
  );
}
