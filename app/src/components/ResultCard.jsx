import React, { useState, useMemo, useEffect } from 'react';
import { Sparkles, Loader2, Brain, AlertTriangle, Link as LinkIcon, Copy, Check, Star, ThumbsDown, ChevronDown, ChevronUp, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Highlight } from '../utils/Highlight';
import { getGroqDetailSuggestion } from '../utils/ai';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';

const OMIT_CODES_ICD9 = {
  '99.18': 'Omit jika merupakan bagian rutin dari terapi cairan intravena.',
  '99.29': 'Omit jika merupakan bagian dari injeksi obat terapeutik rutin.',
  '99.21': 'Omit jika merupakan bagian dari pemberian antibiotik rutin.',
  '57.94': 'Omit jika pemasangan kateter urin dilakukan secara rutin selama operasi atau persalinan.',
  '96.07': 'Omit jika pemasangan NGT merupakan bagian rutin dari prosedur pembedahan.',
  '86.59': 'Omit jika hanya penutupan luka post-operasi rutin. Kode jika tindakan utama di IGD.',
  '38.93': 'Omit jika kanulasi vena/kateterisasi vena dilakukan untuk jalur infus rutin.',
  '93.94': 'Omit jika pemberian terapi oksigen merupakan bagian dari prosedur anestesi atau pemulihan pasca operasi.',
  '89.52': 'Omit jika perekaman EKG merupakan bagian dari pemeriksaan pra-bedah rutin.'
};

function SubcodeItem({ sub, isMatched, matches, searchType, knowledgeText, daggerAsteriskData, onRequireAuth, onReportIncorrectOrder, feedbackCount, onSelectDetail, isActive }) {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const [aiResponse, setAiResponse] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [isAIExpanded, setIsAIExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkId, setBookmarkId] = useState(null);

  useEffect(() => {
    if (isLoggedIn && user) {
      checkIfBookmarked();
    } else {
      setIsBookmarked(false);
      setBookmarkId(null);
    }
  }, [isLoggedIn, user, sub.code]);

  const checkIfBookmarked = async () => {
    try {
      const { data } = await supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', user.id)
        .eq('code', sub.code)
        .maybeSingle();
      
      if (data) {
        setIsBookmarked(true);
        setBookmarkId(data.id);
      }
    } catch (err) {
      // ignore
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
        if (bookmarkId) {
          await supabase.from('bookmarks').delete().eq('id', bookmarkId);
        } else {
          await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('code', sub.code);
        }
        setIsBookmarked(false);
        setBookmarkId(null);
        showToast('Berhasil dihapus dari bookmark', 'info');
      } else {
        const { data, error } = await supabase.from('bookmarks').insert({
          user_id: user.id,
          code: sub.code,
          title: sub.title,
          desc: sub.desc || null,
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
    navigator.clipboard.writeText(sub.code);
    setIsCopied(true);
    showToast(`Kode ${sub.code} disalin!`, 'success', 2000);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleAskAI = async (e) => {
    e.stopPropagation();
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
      const response = await getGroqDetailSuggestion(sub, searchType, knowledgeText, daggerAsteriskData);
      setAiResponse(response);
    } catch (err) {
      setAiResponse("Maaf, terjadi kesalahan saat menghubungi AI: " + err.message);
    } finally {
      setIsAILoading(false);
    }
  };

  const handleCardClick = () => {
    if (onSelectDetail) {
      onSelectDetail(sub);
    }
  };

  const requiresExternalCause = useMemo(() => {
    if (searchType !== 'icd10') return false;
    const char0 = sub.code.charAt(0).toUpperCase();
    const titleLower = sub.title.toLowerCase();
    const isInjuryCode = ['S', 'T'].includes(char0);
    const hasInjuryKeyword = /\b(accident|injury|fracture|burn|poisoning|trauma)\b/.test(titleLower);
    return isInjuryCode || hasInjuryKeyword;
  }, [sub.code, sub.title, searchType]);

  const hasDaggerAsterisk = useMemo(() => {
    if (searchType !== 'icd10' || !daggerAsteriskData || !daggerAsteriskData.bab) return false;
    const searchCode = sub.code.replace(/[^A-Z0-9.]/g, '');
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
  }, [sub.code, searchType, daggerAsteriskData]);

  const isSymptom = useMemo(() => {
    if (searchType !== 'icd10') return false;
    return sub.code.toUpperCase().startsWith('R');
  }, [sub.code, searchType]);

  const omitMessage = useMemo(() => {
    if (searchType !== 'icd9') return null;
    const cleanSubCode = sub.code.trim();
    return OMIT_CODES_ICD9[cleanSubCode] || null;
  }, [sub.code, searchType]);

  return (
    <div className="relative pl-6">
      {/* Garis cabang L */}
      <div className="absolute left-0 top-6 w-5 h-[1px] bg-slate-200 dark:bg-slate-700/80" />
      
      <div 
        onClick={handleCardClick}
        className={`p-4 rounded-xl border transition-all duration-300 flex flex-col gap-3 group/sub cursor-pointer ${
          isActive
            ? 'bg-[#2AA79B]/10 dark:bg-[#2AA79B]/20 border-[#2AA79B] shadow-md ring-2 ring-[#2AA79B]/20'
            : isMatched 
              ? 'bg-[#2AA79B]/5 dark:bg-[#2AA79B]/10 border-[#2AA79B]/20 shadow-sm hover:border-[#2AA79B]/40' 
              : 'bg-white dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`inline-block px-2.5 py-1 font-mono font-bold rounded-lg text-sm flex-shrink-0 transition-colors ${
              isActive || isMatched
                ? 'bg-[#2AA79B] text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover/sub:bg-slate-200'
            }`}>
              <Highlight text={sub.code} matches={matches} property="code" />
            </span>
            <button
              onClick={handleCopyCode}
              className="p-1 text-slate-400 dark:text-slate-500 hover:text-[#2AA79B] hover:bg-[#2AA79B]/10 rounded transition-colors focus:outline-none shrink-0"
              title="Salin Kode"
            >
              {isCopied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <div className="min-w-0">
              <h5 className={`text-sm sm:text-base font-semibold leading-snug ${
                isActive || isMatched ? 'text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'
              }`}>
                <Highlight text={sub.title} matches={matches} property="title" />
              </h5>
              {sub.desc && (
                <p className="text-slate-500 dark:text-slate-400 mt-0.5 text-xs line-clamp-2">
                  <Highlight text={sub.desc} matches={matches} property="desc" />
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-start justify-between sm:justify-start w-full sm:w-auto">
            <div className="flex flex-wrap gap-1.5 mr-auto sm:mr-0">
              {omitMessage && (
                <span 
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50 text-[10px] font-bold rounded-md cursor-help"
                  title={omitMessage}
                >
                  <AlertTriangle className="w-3 h-3" /> Omit Code
                </span>
              )}
              {requiresExternalCause && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50 text-[10px] font-bold rounded-md whitespace-nowrap">
                  <AlertTriangle className="w-3 h-3" /> External Code
                </span>
              )}
              {hasDaggerAsterisk && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 text-[10px] font-bold rounded-md whitespace-nowrap">
                  <LinkIcon className="w-3 h-3" /> Dagger/Asterisk
                </span>
              )}
              {isSymptom && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50 text-[10px] font-bold rounded-md whitespace-nowrap" title="Berdasarkan Rule MB1, keluhan tidak boleh jadi diagnosis utama jika penyakit aslinya diketahui.">
                  <AlertTriangle className="w-3 h-3" /> Gejala
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button 
                onClick={handleBookmarkToggle}
                className="p-1.5 text-slate-300 hover:text-yellow-400 dark:text-slate-600 dark:hover:text-yellow-400 focus:outline-none transition-colors duration-200"
                title="Simpan Bookmark"
              >
                <Star className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-400 text-yellow-400' : ''}`} />
              </button>
              
              {onReportIncorrectOrder && isMatched && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onReportIncorrectOrder(sub.code);
                  }}
                  className="p-1.5 text-slate-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-500 focus:outline-none transition-colors duration-200 flex items-center gap-1"
                  title="Urutan kurang pas? Laporkan"
                >
                  <ThumbsDown className="w-4 h-4" />
                  {feedbackCount > 0 && <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-slate-500 dark:text-slate-300">{feedbackCount}</span>}
                </button>
              )}
              
              <button 
                onClick={handleAskAI}
                disabled={isAILoading}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  isAIExpanded || isAILoading 
                    ? 'bg-[#2AA79B]/10 text-[#2AA79B] border-[#2AA79B]/20 shadow-inner' 
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-[#2AA79B] hover:border-[#2AA79B]/30'
                }`}
              >
                {isAILoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Tanya AI
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardClick();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  isActive
                    ? 'bg-[#2AA79B] text-white border-[#2AA79B] shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 hover:text-[#2AA79B] hover:border-[#2AA79B]/30'
                }`}
                title="Lihat Detail Panel"
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Detail</span>
              </button>
            </div>
          </div>
        </div>

        {isAIExpanded && (
          <div className="overflow-hidden rounded-xl border border-[#2AA79B]/25 bg-gradient-to-br from-[#2AA79B]/5 to-[#D6E400]/5 shadow-inner p-4 animate-in fade-in slide-in-from-top-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <div className="bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm flex-shrink-0 text-[#2AA79B] mt-0.5">
                <Brain className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-slate-800 dark:text-slate-100 text-xs sm:text-sm flex items-center gap-2">
                  Penjelasan Cerdas AI
                  <span className="text-[8px] uppercase tracking-wider bg-blue-500 text-white px-1.5 py-0.5 rounded-full">Gemini 3.5</span>
                </h5>
                
                {isAILoading ? (
                  <div className="mt-3 space-y-2">
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-full"></div>
                    <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-5/6"></div>
                  </div>
                ) : (
                  <div className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm mt-2 leading-relaxed">
                    <ReactMarkdown
                      components={{
                        strong: ({node, ...props}) => <span className="font-bold text-slate-900 dark:text-white" {...props} />,
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
    </div>
  );
}

export function ResultCard({ group, searchType, knowledgeText, daggerAsteriskData, onRequireAuth, onReportIncorrectOrder, onSelectDetail, selectedCode }) {
  const defaultExpanded = group.allSubcodes.length <= 8;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [feedbackCounts, setFeedbackCounts] = useState({});

  useEffect(() => {
    setIsExpanded(group.allSubcodes.length <= 8);
  }, [group.categoryCode, group.allSubcodes.length]);

  useEffect(() => {
    fetchFeedbackCounts();
  }, [group.categoryCode, group.allSubcodes]);

  const fetchFeedbackCounts = async () => {
    try {
      const codes = group.allSubcodes.map(sub => sub.code);
      if (codes.length === 0) return;
      
      const { data, error } = await supabase
        .from('ranking_feedback')
        .select('code')
        .in('code', codes);
        
      if (!error && data) {
        const counts = {};
        data.forEach(item => {
          counts[item.code] = (counts[item.code] || 0) + 1;
        });
        setFeedbackCounts(counts);
      }
    } catch (err) {
      console.warn("Failed to batch fetch feedback counts:", err);
    }
  };

  const handleReportFeedback = async (code) => {
    setFeedbackCounts(prev => ({
      ...prev,
      [code]: (prev[code] || 0) + 1
    }));
    
    if (onReportIncorrectOrder) {
      onReportIncorrectOrder(code);
    }
  };

  const visibleSubcodes = useMemo(() => {
    if (isExpanded) return group.allSubcodes;

    const matched = group.allSubcodes.filter(sub => group.matchedCodes.includes(sub.code));
    const nonMatched = group.allSubcodes.filter(sub => !group.matchedCodes.includes(sub.code));
    
    const combined = [...matched, ...nonMatched];
    return combined.slice(0, 3);
  }, [group.allSubcodes, group.matchedCodes, isExpanded]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-4">
      {/* Category Header */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="inline-block px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold rounded-lg text-sm">
            {group.categoryItem.code}
          </span>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
              {group.categoryItem.title}
            </h4>
            {group.categoryItem.desc && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                {group.categoryItem.desc}
              </p>
            )}
          </div>
        </div>
        
        {group.allSubcodes.length > 3 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-[#2AA79B]/10 dark:bg-slate-800 dark:hover:bg-[#2AA79B]/20 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#2AA79B] text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                Sembunyikan <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Tampilkan semua {group.allSubcodes.length} subkode <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Subcodes container with tree visual */}
      <div className="ml-4 pl-4 border-l-2 border-slate-100 dark:border-slate-800/60 space-y-4 relative">
        {visibleSubcodes.map(sub => {
          const isMatched = group.matchedCodes.includes(sub.code);
          const matches = group.matchedMatches[sub.code] || [];
          const isActive = selectedCode === sub.code;
          return (
            <SubcodeItem
              key={sub.code}
              sub={sub}
              isMatched={isMatched}
              matches={matches}
              searchType={searchType}
              knowledgeText={knowledgeText}
              daggerAsteriskData={daggerAsteriskData}
              onRequireAuth={onRequireAuth}
              onReportIncorrectOrder={handleReportFeedback}
              feedbackCount={feedbackCounts[sub.code] || 0}
              onSelectDetail={onSelectDetail}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}
