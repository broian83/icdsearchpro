import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Loader2, Brain, AlertTriangle, Link as LinkIcon, Copy, Check, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Highlight } from '../utils/Highlight';
import { getGroqDetailSuggestion } from '../utils/ai';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

export function ResultCard({ item, matches, searchType, knowledgeText, daggerAsteriskData, onRequireAuth, initialBookmarked = false }) {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const [aiResponse, setAiResponse] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [bookmarkId, setBookmarkId] = useState(null);

  useEffect(() => {
    // Cek apakah item ini sudah ada di bookmark saat komponen dimuat
    if (isLoggedIn && user && !initialBookmarked) {
      checkIfBookmarked();
    }
  }, [isLoggedIn, user]);

  const checkIfBookmarked = async () => {
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('code', item.code)
        .maybeSingle();
      
      if (data) {
        setIsBookmarked(true);
        setBookmarkId(data.id);
      }
    } catch (err) {
      // Not found or error
    }
  };

  const handleBookmarkToggle = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    try {
      if (isBookmarked) {
        // Hapus bookmark
        if (bookmarkId) {
          await supabase.from('bookmarks').delete().eq('id', bookmarkId);
        } else {
          // Fallback delete by code if ID not known
          await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('code', item.code);
        }
        setIsBookmarked(false);
        setBookmarkId(null);
        showToast('Berhasil dihapus dari bookmark', 'info');
      } else {
        // Tambah bookmark
        const { data, error } = await supabase.from('bookmarks').insert({
          user_id: user.id,
          code: item.code,
          title: item.title,
          desc: item.desc || null,
          search_type: searchType
        }).select('id').single();

        if (error) throw error;
        setIsBookmarked(true);
        setBookmarkId(data.id);
        showToast('Berhasil disimpan ke bookmark', 'success');
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
      showToast('Gagal mengubah bookmark: ' + err.message, 'error');
    }
  };

  const handleCopyCode = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(item.code);
    setIsCopied(true);
    showToast(`Kode ${item.code} disalin!`, 'success', 2000);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Cek apakah butuh external cause
  const requiresExternalCause = useMemo(() => {
    if (searchType !== 'icd10') return false;
    const char0 = item.code.charAt(0).toUpperCase();
    const titleLower = item.title.toLowerCase();
    const isInjuryCode = ['S', 'T'].includes(char0);
    const hasInjuryKeyword = /\b(accident|injury|fracture|burn|poisoning|trauma)\b/.test(titleLower);
    return isInjuryCode || hasInjuryKeyword;
  }, [item.code, item.title, searchType]);

  // Cek apakah punya relasi Dagger/Asterisk
  const hasDaggerAsterisk = useMemo(() => {
    if (searchType !== 'icd10' || !daggerAsteriskData || !daggerAsteriskData.bab) return false;
    const searchCode = item.code.replace(/[^A-Z0-9.]/g, '');
    for (const b of daggerAsteriskData.bab) {
      if (b.pasangan_dagger_asterisk) {
        for (const pair of b.pasangan_dagger_asterisk) {
          if (pair.dagger.includes(searchCode) || pair.asterisk.includes(searchCode)) {
            return true;
          }
        }
      }
    }
    return false;
  }, [item.code, searchType, daggerAsteriskData]);

  // Cek apakah ini keluhan/gejala (Bab R)
  const isSymptom = useMemo(() => {
    if (searchType !== 'icd10') return false;
    return item.code.toUpperCase().startsWith('R');
  }, [item.code, searchType]);

  const handleAskAI = async () => {
    if (isAIExpanded && aiResponse) {
      setIsAIExpanded(false);
      return;
    }
    
    if (!isAIExpanded && aiResponse) {
      setIsAIExpanded(true);
      return;
    }

    setIsAIExpanded(true);
    setIsAILoading(true);
    setAiResponse('');
    
    try {
      const response = await getGroqDetailSuggestion(item, searchType, knowledgeText, daggerAsteriskData);
      setAiResponse(response);
    } catch (err) {
      setAiResponse("Maaf, terjadi kesalahan saat menghubungi AI: " + err.message);
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 border border-slate-100 dark:border-slate-700/50 transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden">
      
      {/* Top Row: Code, Desc, and AI Button */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex flex-row sm:flex-col items-start gap-3 sm:gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-block px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-mono font-bold rounded-lg text-lg group-hover:bg-[#00B4A4] group-hover:text-white transition-colors">
              <Highlight text={item.code} matches={matches} property="code" />
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-[#00B4A4] hover:bg-[#00B4A4]/10 rounded-lg transition-colors focus:outline-none"
              title="Salin Kode"
            >
              {isCopied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {/* Badges Column under Code (Desktop) / Next to Code (Mobile) */}
          <div className="flex flex-wrap sm:flex-col gap-1.5 w-full mt-0 sm:mt-1 self-center sm:self-start">
            {requiresExternalCause && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                <AlertTriangle className="w-3 h-3" /> External Code
              </span>
            )}
            {hasDaggerAsterisk && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-[10px] font-bold rounded-md whitespace-nowrap">
                <LinkIcon className="w-3 h-3" /> Dagger/Asterisk
              </span>
            )}
            {isSymptom && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-md whitespace-nowrap" title="Berdasarkan Rule MB1, keluhan tidak boleh jadi diagnosis utama jika penyakit aslinya diketahui.">
                <AlertTriangle className="w-3 h-3" /> Gejala
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base sm:text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug">
            <Highlight text={item.title} matches={matches} property="title" />
          </h4>
          {item.desc && (
            <p className="text-slate-600 dark:text-slate-300 mt-1 text-sm line-clamp-2">
              <Highlight text={item.desc} matches={matches} property="desc" />
            </p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-2 sm:self-center w-full sm:w-auto mt-2 sm:mt-0 justify-between sm:justify-start">
          <button 
            onClick={handleBookmarkToggle}
            className="p-2 text-slate-300 hover:text-yellow-400 dark:text-slate-600 dark:hover:text-yellow-400 focus:outline-none transition-colors duration-200"
            title="Simpan Bookmark"
          >
            <Star className={`w-5 h-5 ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
          </button>
          
          <button 
            onClick={handleAskAI}
            disabled={isAILoading}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-95 border ${
              isAIExpanded || isAILoading 
                ? 'bg-[#00B4A4]/10 text-[#00B4A4] border-[#00B4A4]/20 shadow-inner' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-800/50 hover:text-[#00B4A4] hover:border-[#00B4A4]/30'
            }`}
          >
            {isAILoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Tanya AI
          </button>
        </div>
      </div>

      {/* AI Expansion Area */}
      {isAIExpanded && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#00B4A4]/30 bg-gradient-to-br from-[#00B4A4]/5 to-[#D6E400]/5 shadow-inner p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm flex-shrink-0 text-[#00B4A4] mt-0.5">
              <Brain className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                Penjelasan Cerdas AI
                <span className="text-[9px] uppercase tracking-wider bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Gemini 3.5</span>
              </h5>
              
              {isAILoading ? (
                <div className="mt-3 space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-full"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-5/6"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse w-1/2 mt-4"></div>
                </div>
              ) : (
                <div className="text-slate-700 dark:text-slate-200 text-sm mt-2 leading-relaxed">
                  <ReactMarkdown
                    components={{
                      strong: ({node, ...props}) => <span className="font-bold text-slate-900" {...props} />,
                      em: ({node, ...props}) => <span className="italic" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                    }}
                  >
                    {aiResponse}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
