import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Clock, Loader2, Trash2, Search } from 'lucide-react';

export function HistoryView({ onSearchHistory }) {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const { error } = await supabase.from('search_history').delete().eq('id', id);
      if (error) throw error;
      setHistory((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Error removing history:', err);
    }
  };

  const clearAllHistory = async () => {
    if (!window.confirm("Yakin ingin menghapus semua riwayat pencarian?")) return;
    try {
      const { error } = await supabase.from('search_history').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
      if (error) throw error;
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#00B4A4]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-slate-500">Memuat riwayat pencarian...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Riwayat Pencarian</h2>
            <p className="text-slate-500 text-sm mt-0.5">Daftar pencarian dan konsultasi yang pernah Anda lakukan.</p>
          </div>
        </div>
        {history.length > 0 && (
          <button 
            onClick={clearAllHistory}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Hapus Semua
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="text-center py-16 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-100">
          <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-600">Belum ada riwayat.</p>
          <p className="text-sm mt-1">Riwayat pencarian ICD atau konsultasi AI akan muncul di sini.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {history.map((h) => (
              <div key={h.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => onSearchHistory && onSearchHistory(h.query, h.search_type)}>
                  <Search className="w-5 h-5 text-slate-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-slate-800 font-medium truncate">{h.query}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                        {h.search_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(h.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(h.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none opacity-0 group-hover:opacity-100"
                  title="Hapus"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
