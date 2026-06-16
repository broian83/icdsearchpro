import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Bookmark, Loader2, Trash2 } from 'lucide-react';
import { ResultCard } from './ResultCard';

export function BookmarkView() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookmarks(data || []);
    } catch (err) {
      console.error('Error fetching bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    try {
      const { error } = await supabase.from('bookmarks').delete().eq('id', id);
      if (error) throw error;
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error('Error removing bookmark:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#00B4A4]">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-medium text-slate-500 dark:text-slate-400">Memuat bookmark...</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600 shadow-sm border border-yellow-200">
          <Bookmark className="w-6 h-6 fill-yellow-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Kode Tersimpan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Daftar kode ICD yang telah Anda bookmark.</p>
        </div>
      </div>

      {bookmarks.length === 0 ? (
        <div className="text-center py-16 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/50">
          <Bookmark className="w-12 h-12 mx-auto mb-4 text-slate-300" />
          <p className="text-lg font-medium text-slate-600 dark:text-slate-300">Belum ada bookmark.</p>
          <p className="text-sm mt-1">Cari kode dan klik ikon bintang untuk menyimpannya di sini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookmarks.map((b) => (
            <div key={b.id} className="relative group">
              <ResultCard 
                group={{
                  categoryCode: b.code,
                  categoryItem: { code: b.code, title: b.title, desc: b.desc || '' },
                  matchedCodes: [b.code],
                  matchedMatches: {},
                  bestScore: 0,
                  allSubcodes: [{ code: b.code, title: b.title, desc: b.desc || '' }],
                  type: b.search_type || 'icd10'
                }}
                searchType={b.search_type || 'icd10'}
                searchQuery=""
                knowledgeText=""
                daggerAsteriskData={null}
                onRequireAuth={() => {}}
                onSelectDetail={() => {}}
                selectedCode={null}
              />
              <button
                onClick={() => handleRemove(b.id)}
                className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm focus:opacity-100"
                title="Hapus dari Bookmark"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
