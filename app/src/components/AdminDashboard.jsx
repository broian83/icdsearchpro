import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert, Users, Key, BarChart3, MessageSquare, Loader2,
  Save, Activity, RefreshCw, TrendingUp, Search, Building2,
  Stethoscope, Star, AlertTriangle, CheckCircle, Eye, EyeOff,
  ChevronRight, Zap, Shield, ArrowUpRight, Hash, Home, LogOut,
  Lightbulb, Bug, Heart, HelpCircle, ChevronLeft, Trash2, Check, X
} from 'lucide-react';

// ─── Komponen Stat Card ────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, gradient }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-lg" style={{ background: gradient }}>
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <ArrowUpRight className="w-4 h-4 text-white/40" />
        </div>
        <div className="text-3xl font-black tracking-tight mb-0.5">{value}</div>
        <div className="text-white/70 text-xs font-medium">{label}</div>
      </div>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-24 text-slate-400 text-sm">Belum ada data</div>
  );
  const maxValue = Math.max(...data.map(d => d[1]));
  const colors = [
    'linear-gradient(90deg,#2AA79B,#38d9cc)',
    'linear-gradient(90deg,#3b82f6,#60a5fa)',
    'linear-gradient(90deg,#8b5cf6,#a78bfa)',
    'linear-gradient(90deg,#f59e0b,#fbbf24)',
    'linear-gradient(90deg,#ef4444,#f87171)',
  ];
  return (
    <div className="space-y-3">
      {data.map(([label, val], idx) => (
        <div key={idx}>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate max-w-[65%]">
              <span className="text-slate-300 dark:text-slate-600 mr-2">#{idx + 1}</span>{label}
            </span>
            <span className="text-xs font-black" style={{ color: idx === 0 ? '#2AA79B' : idx === 1 ? '#3b82f6' : '#8b5cf6' }}>{val}×</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${(val / maxValue) * 100}%`, background: colors[idx % colors.length] }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Sidebar Admin ─────────────────────────────────────────────────────────────
function AdminSidebar({ active, onChange, onGoHome, onLogout }) {
  const navItems = [
    { id: 'overview', icon: BarChart3, label: 'Ikhtisar' },
    { id: 'searches', icon: Search, label: 'Analitik Pencarian' },
    { id: 'users', icon: Users, label: 'Pengguna' },
    { id: 'demographics', icon: Building2, label: 'Demografi' },
    { id: 'feedback', icon: MessageSquare, label: 'Umpan Balik' },
    { id: 'apikey', icon: Key, label: 'API Config' },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 min-h-screen bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed left-0 top-0 bottom-0 z-30">
      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] flex items-center justify-center shadow-md">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-black text-slate-800 dark:text-slate-100 text-sm leading-tight">Admin Panel</div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wide">ICD Pro</div>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest px-3 mb-2">Menu</div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all text-left group ${
              active === item.id
                ? 'bg-[#2AA79B] text-white shadow-lg shadow-[#2AA79B]/25'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <item.icon className={`w-4 h-4 shrink-0 ${active === item.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
            {item.label}
            {active === item.id && <ChevronRight className="w-3 h-3 ml-auto text-white/60" />}
          </button>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="px-3 pb-5 space-y-1 border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          onClick={onGoHome}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all text-left"
        >
          <Home className="w-4 h-4 text-slate-400" /> Kembali ke Aplikasi
        </button>
      </div>
    </aside>
  );
}

// ─── Mobile Nav Bar ────────────────────────────────────────────────────────────
function MobileNav({ active, onChange }) {
  const items = [
    { id: 'overview', icon: BarChart3, label: 'Ikhtisar' },
    { id: 'searches', icon: Search, label: 'Pencarian' },
    { id: 'users', icon: Users, label: 'Pengguna' },
    { id: 'demographics', icon: Building2, label: 'Demografi' },
    { id: 'feedback', icon: MessageSquare, label: 'Feedback' },
    { id: 'apikey', icon: Key, label: 'API' },
  ];
  return (
    <div className="lg:hidden flex overflow-x-auto gap-1 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 no-scrollbar">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all ${
            active === item.id
              ? 'bg-[#2AA79B] text-white shadow-md'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <item.icon className="w-3.5 h-3.5" />
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ─── Halaman Utama ─────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [stats, setStats] = useState({ totalUsers: 0, totalSearches: 0, topCodes: [], totalFeedbacks: 0 });
  const [usersList, setUsersList] = useState([]);
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [userSuggestions, setUserSuggestions] = useState([]);
  const [demographics, setDemographics] = useState({ institutions: [], professions: [] });
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const [suggestionsTotal, setSuggestionsTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState(null);
  const [feedbacksPage, setFeedbacksPage] = useState(1);
  const [feedbacksTotal, setFeedbacksTotal] = useState(0);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: profiles } = await supabase.from('profiles').select('*');
      const { data: searches } = await supabase.from('search_history').select('query, created_at');
      const { data: settings } = await supabase.from('settings').select('value').eq('key', 'GEMINI_API_KEY').single();

      if (profiles) {
        setUsersList(profiles);
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
        setStats(prev => ({ ...prev, totalUsers: profiles?.length || 0, totalSearches: searches.length, topCodes: top }));
      }
      if (settings) setApiKey(settings.value);

      // Fetch Rating Hasil Pencarian - PAGE 1 INITIAL
      const { data: fbs, count: fbsCount } = await supabase
        .from('ranking_feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 9);
      if (fbs) {
        setFeedbacks(fbs);
        setFeedbacksTotal(fbsCount || 0);
        setFeedbacksPage(1);
        setStats(prev => ({ ...prev, totalFeedbacks: fbsCount || 0 }));
      }

      // Fetch user suggestions (Kotak Saran) - PAGE 1 INITIAL
      const { data: suggestions, count } = await supabase
        .from('user_feedbacks')
        .select('*, profiles(full_name, institution, profession)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 9);
      if (suggestions) {
        setUserSuggestions(suggestions);
        setSuggestionsTotal(count || 0);
        setSuggestionsPage(1);
      }
    } catch (err) {
      console.error('Admin fetch error:', err);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      setLoading(true);
      fetchDashboardData().finally(() => setLoading(false));
    }
  }, [isAdmin, fetchDashboardData]);

  const fetchFeedbacksPage = async (page) => {
    try {
      const limit = 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data: fbs, count } = await supabase
        .from('ranking_feedback')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (fbs) {
        setFeedbacks(fbs);
        setFeedbacksTotal(count || 0);
        setFeedbacksPage(page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSuggestionsPage = async (page) => {
    try {
      const limit = 10;
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      const { data: suggestions, count } = await supabase
        .from('user_feedbacks')
        .select('*, profiles(full_name, institution, profession)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);
      if (suggestions) {
        setUserSuggestions(suggestions);
        setSuggestionsTotal(count || 0);
        setSuggestionsPage(page);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSuggestionRead = async (id, currentStatus) => {
    setActionLoading(`read-${id}`);
    try {
      const { error } = await supabase.from('user_feedbacks').update({ is_read: !currentStatus }).eq('id', id);
      if (!error) {
        setUserSuggestions(prev => prev.map(s => s.id === id ? { ...s, is_read: !currentStatus } : s));
      }
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const deleteSuggestion = async (id) => {
    if (!window.confirm('Hapus saran ini secara permanen?')) return;
    setActionLoading(`del-${id}`);
    try {
      const { error } = await supabase.from('user_feedbacks').delete().eq('id', id);
      if (!error) {
        fetchSuggestionsPage(suggestionsPage); // Reload current page
      }
    } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  const handleSaveApiKey = async () => {
    setSavingKey(true);
    try {
      const { error } = await supabase.from('settings').upsert({ key: 'GEMINI_API_KEY', value: apiKey, updated_at: new Date() });
      if (!error) { setKeySaved(true); setTimeout(() => setKeySaved(false), 3000); }
    } catch (err) { console.error(err); }
    finally { setSavingKey(false); }
  };

  // ─── Guard ──────────────────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 rounded-3xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-5">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Akses Ditolak</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-xs">Halaman ini hanya dapat diakses oleh Administrator ICD Pro.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-[#0b0f19]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -inset-1 rounded-2xl border-2 border-[#2AA79B] opacity-40 animate-ping" />
          </div>
          <p className="text-slate-400 font-medium">Memuat Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  // ─── Render Konten ──────────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={Users} label="Total Pengguna" value={stats.totalUsers} gradient="linear-gradient(135deg,#2AA79B,#1d7a72)" />
              <StatCard icon={Search} label="Total Pencarian" value={stats.totalSearches.toLocaleString()} gradient="linear-gradient(135deg,#3b82f6,#1d4ed8)" />
              <StatCard icon={Star} label="Umpan Balik" value={stats.totalFeedbacks} gradient="linear-gradient(135deg,#8b5cf6,#6d28d9)" />
              <StatCard icon={Zap} label="Kueri Unik" value={stats.topCodes.length > 0 ? `${stats.topCodes.length}+` : '0'} gradient="linear-gradient(135deg,#f59e0b,#b45309)" />
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#2AA79B]/10 flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-[#2AA79B]" />
                  </div>
                  Kode ICD Paling Sering Dicari
                </h3>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{stats.totalSearches.toLocaleString()} total</span>
              </div>
              <BarChart data={stats.topCodes} />
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  Pengguna Terdaftar
                </h3>
                <button onClick={() => setActiveTab('users')} className="text-xs text-[#2AA79B] font-bold hover:underline flex items-center gap-1">
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
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-[#2AA79B]/10 to-transparent dark:from-[#2AA79B]/20 border border-[#2AA79B]/20 rounded-2xl p-5">
                <div className="text-3xl font-black text-[#2AA79B]">{stats.totalSearches.toLocaleString()}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Total kueri dikirim</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-transparent dark:from-purple-900/20 border border-purple-100 dark:border-purple-800/30 rounded-2xl p-5">
                <div className="text-3xl font-black text-purple-600">
                  {stats.topCodes.length > 0 && stats.totalSearches > 0 ? ((stats.topCodes[0][1] / stats.totalSearches) * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Share kueri teratas</div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h4 className="font-black text-slate-800 dark:text-slate-100 mb-5">Grafik Top 10 Pencarian</h4>
              <BarChart data={stats.topCodes} />
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-400" />
                <h4 className="font-black text-slate-800 dark:text-slate-100">Tabel Lengkap</h4>
              </div>
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
                      <td className="px-6 py-3 text-right font-black text-[#2AA79B]">{count}</td>
                      <td className="px-6 py-3 text-right text-slate-500">{((count / stats.totalSearches) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                          <span className="font-bold text-slate-800 dark:text-slate-200">{usr.full_name || 'Tanpa Nama'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{usr.profession || <span className="text-slate-300">-</span>}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{usr.institution || <span className="text-slate-300">-</span>}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{usr.whatsapp_number || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${usr.role === 'admin' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
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
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
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
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-700"
                          style={{ width: `${(count / demographics.institutions[0][1]) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-sm text-center py-6">Belum ada data instansi</p>}
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-1 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Stethoscope className="w-3.5 h-3.5 text-purple-500" />
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
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-700"
                          style={{ width: `${(count / demographics.professions[0][1]) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-sm text-center py-6">Belum ada data profesi</p>}
            </div>
          </div>
        );

      case 'feedback':
        const catIcons = { saran: Lightbulb, bug: Bug, pujian: Heart, pertanyaan: HelpCircle };
        const catColors = { saran: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20', bug: 'text-red-500 bg-red-50 dark:bg-red-900/20', pujian: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20', pertanyaan: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' };
        const catLabels = { saran: 'Saran & Ide', bug: 'Laporan Bug', pujian: 'Pujian', pertanyaan: 'Pertanyaan' };
        return (
          <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-4 flex items-center gap-3">
                <Lightbulb className="w-7 h-7 text-amber-500 shrink-0" />
                <div>
                  <div className="text-xl font-black text-amber-600">{userSuggestions.filter(s => s.category === 'saran').length}</div>
                  <div className="text-xs text-slate-500">Saran & Ide</div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-2xl p-4 flex items-center gap-3">
                <Bug className="w-7 h-7 text-red-400 shrink-0" />
                <div>
                  <div className="text-xl font-black text-red-500">{userSuggestions.filter(s => s.category === 'bug').length}</div>
                  <div className="text-xs text-slate-500">Laporan Bug</div>
                </div>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-100 dark:border-pink-800/30 rounded-2xl p-4 flex items-center gap-3">
                <Heart className="w-7 h-7 text-pink-500 shrink-0" />
                <div>
                  <div className="text-xl font-black text-pink-500">{userSuggestions.filter(s => s.category === 'pujian').length}</div>
                  <div className="text-xs text-slate-500">Pujian</div>
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle className="w-7 h-7 text-green-500 shrink-0" />
                <div>
                  <div className="text-xl font-black text-green-600">{feedbacks.filter(f => f.score >= 4).length}</div>
                  <div className="text-xs text-slate-500">Rating Positif</div>
                </div>
              </div>
            </div>

            {/* Kotak Saran - TABEL */}
            <div>
              <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#2AA79B]/10 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-[#2AA79B]" />
                </div>
                Kotak Saran Pengguna
                <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{suggestionsTotal}</span>
              </h3>
              
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-4 w-12 text-center">Status</th>
                        <th className="px-5 py-4">Pengguna</th>
                        <th className="px-5 py-4">Kategori</th>
                        <th className="px-5 py-4 min-w-[300px] w-full">Pesan</th>
                        <th className="px-5 py-4">Tanggal</th>
                        <th className="px-5 py-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {userSuggestions.length > 0 ? (
                        userSuggestions.map((s) => {
                          const CatIcon = catIcons[s.category] || MessageSquare;
                          const colorClass = catColors[s.category] || 'text-slate-500 bg-slate-50';
                          const isUnread = !s.is_read;
                          return (
                            <tr key={s.id} className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30 ${isUnread ? 'bg-[#2AA79B]/[0.02] dark:bg-[#2AA79B]/[0.05]' : ''}`}>
                              <td className="px-5 py-4 text-center">
                                <button 
                                  onClick={() => toggleSuggestionRead(s.id, s.is_read)}
                                  disabled={actionLoading === `read-${s.id}`}
                                  className="mx-auto flex items-center justify-center transition-all disabled:opacity-50"
                                  title={s.is_read ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
                                >
                                  {actionLoading === `read-${s.id}` ? (
                                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                                  ) : s.is_read ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <div className="w-3 h-3 rounded-full bg-[#2AA79B] animate-pulse" />
                                  )}
                                </button>
                              </td>
                              <td className="px-5 py-4">
                                <div className={`font-bold text-slate-800 dark:text-slate-200 ${isUnread ? '' : 'font-medium opacity-80'}`}>
                                  {s.profiles?.full_name || 'Anonim'}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {s.profiles?.institution || s.profiles?.profession || '-'}
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase w-fit ${colorClass} ${isUnread ? '' : 'opacity-80'}`}>
                                  <CatIcon className="w-3.5 h-3.5" />
                                  {catLabels[s.category] || s.category}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className={`text-sm truncate max-w-[300px] lg:max-w-[400px] xl:max-w-[600px] ${isUnread ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {s.feedback}
                                </div>
                              </td>
                              <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-xs">
                                {new Date(s.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric'})}
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => deleteSuggestion(s.id)}
                                    disabled={actionLoading === `del-${s.id}`}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all disabled:opacity-50"
                                    title="Hapus"
                                  >
                                    {actionLoading === `del-${s.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-5 py-12 text-center text-slate-400">Belum ada saran dari pengguna</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination Controls */}
                {suggestionsTotal > 10 && (
                  <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
                    <span className="text-xs text-slate-500 font-medium">
                      Menampilkan {(suggestionsPage - 1) * 10 + 1} - {Math.min(suggestionsPage * 10, suggestionsTotal)} dari {suggestionsTotal} saran
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => fetchSuggestionsPage(suggestionsPage - 1)}
                        disabled={suggestionsPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => fetchSuggestionsPage(suggestionsPage + 1)}
                        disabled={suggestionsPage * 10 >= suggestionsTotal}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Rating Feedback */}
            {feedbacks.length > 0 && (
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  Rating Hasil Pencarian
                  <span className="text-xs text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{feedbacksTotal}</span>
                </h3>
                <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {feedbacks.map((fb) => (
                      <div key={fb.id} className="p-4 flex items-center gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <div className="flex gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= fb.score ? 'text-amber-400 fill-amber-400' : 'text-slate-200 dark:text-slate-700'}`} />
                          ))}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate block">{fb.query || '-'}</span>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0">{new Date(fb.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric'})}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {feedbacksTotal > 10 && (
                    <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/20">
                      <span className="text-xs text-slate-500 font-medium">
                        Menampilkan {(feedbacksPage - 1) * 10 + 1} - {Math.min(feedbacksPage * 10, feedbacksTotal)} dari {feedbacksTotal} rating
                      </span>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => fetchFeedbacksPage(feedbacksPage - 1)}
                          disabled={feedbacksPage === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => fetchFeedbacksPage(feedbacksPage + 1)}
                          disabled={feedbacksPage * 10 >= feedbacksTotal}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      case 'apikey':
        return (
          <div className="max-w-xl space-y-5">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl p-5 flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-400 mb-1 text-sm">Keamanan Tinggi</p>
                <p className="text-xs text-amber-700/80 dark:text-amber-500/80 leading-relaxed">
                  Kunci API tersimpan terenkripsi di Supabase dan dilindungi Row Level Security (RLS). Hanya Admin dan sistem backend yang dapat mengaksesnya.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h3 className="font-black text-slate-800 dark:text-slate-100 mb-0.5">Gemini API Key</h3>
                <p className="text-xs text-slate-400">Kunci ini digunakan oleh fitur Klinik AI (Case Consultation)</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Kunci API</label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#2AA79B] focus:border-transparent transition-all font-mono text-sm"
                  />
                  <button type="button" onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleSaveApiKey}
                disabled={savingKey || !apiKey}
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${
                  keySaved ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-gradient-to-r from-[#2AA79B] to-[#1d7a72] text-white shadow-[#2AA79B]/20 hover:from-[#238c82] hover:to-[#1a6660]'
                }`}
              >
                {savingKey ? <Loader2 className="w-5 h-5 animate-spin" /> : keySaved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                {savingKey ? 'Menyimpan...' : keySaved ? 'Tersimpan!' : 'Simpan & Aktifkan'}
              </button>
            </div>
          </div>
        );

      default: return null;
    }
  };

  // ─── Layout ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#0b0f19]">
      {/* Sidebar Permanen Admin (Desktop) */}
      <AdminSidebar
        active={activeTab}
        onChange={setActiveTab}
        onGoHome={() => navigate('/')}
      />

      {/* Area Konten Utama */}
      <div className="flex-1 flex flex-col min-h-screen lg:pl-60">

        {/* Top Bar */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo mini untuk mobile */}
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] flex items-center justify-center lg:hidden shrink-0">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg leading-tight">
                {activeTab === 'overview' && 'Ikhtisar'}
                {activeTab === 'searches' && 'Analitik Pencarian'}
                {activeTab === 'users' && 'Manajemen Pengguna'}
                {activeTab === 'demographics' && 'Demografi Pengguna'}
                {activeTab === 'feedback' && 'Umpan Balik'}
                {activeTab === 'apikey' && 'Konfigurasi API'}
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">ICD Pro — Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all">
              <Home className="w-3.5 h-3.5" /> Ke Aplikasi
            </button>
            <button onClick={handleRefresh} disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all hover:border-[#2AA79B] hover:text-[#2AA79B] shadow-sm disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Segarkan</span>
            </button>
          </div>
        </header>

        {/* Mobile Nav */}
        <MobileNav active={activeTab} onChange={setActiveTab} />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6">
          {renderContent()}
        </main>

      </div>
    </div>
  );
}
