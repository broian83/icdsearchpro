import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { MessageSquarePlus, X, Send, Loader2, Lightbulb, Bug, Heart, HelpCircle } from 'lucide-react';

const CATEGORIES = [
  { id: 'saran', label: 'Saran & Ide', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'bug', label: 'Laporan Bug', icon: Bug, color: 'text-red-500' },
  { id: 'pujian', label: 'Pujian', icon: Heart, color: 'text-pink-500' },
  { id: 'pertanyaan', label: 'Pertanyaan', icon: HelpCircle, color: 'text-blue-500' },
];

export function FeedbackModal() {
  const { isLoggedIn, user } = useAuth();
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState('saran');
  const [feedback, setFeedback] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    setSending(true);
    try {
      const { error } = await supabase.from('user_feedbacks').insert({
        user_id: user.id,
        feedback: feedback.trim(),
        category,
      });
      if (error) throw error;
      setSent(true);
      showToast('Terima kasih! Saran Anda telah terkirim.', 'success');
      setTimeout(() => {
        setIsOpen(false);
        setSent(false);
        setFeedback('');
        setCategory('saran');
      }, 2000);
    } catch (err) {
      showToast('Gagal mengirim: ' + err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  if (!isLoggedIn) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] text-white rounded-2xl shadow-lg shadow-[#2AA79B]/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
        title="Kirim Saran"
      >
        <MessageSquarePlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => { if (!sending) setIsOpen(false); }}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2AA79B] to-[#1d7a72] flex items-center justify-center">
                  <MessageSquarePlus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm">Kotak Saran</h3>
                  <p className="text-[10px] text-slate-400">Masukan Anda sangat berarti bagi kami</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sent ? (
              /* Success State */
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-green-500" />
                </div>
                <h4 className="font-black text-slate-800 dark:text-slate-100 mb-1">Terima Kasih!</h4>
                <p className="text-sm text-slate-500">Saran Anda telah diterima oleh tim kami.</p>
              </div>
            ) : (
              /* Form */
              <div className="p-5 space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          category === cat.id
                            ? 'border-[#2AA79B] bg-[#2AA79B]/5 text-[#2AA79B]'
                            : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <cat.icon className={`w-3.5 h-3.5 ${category === cat.id ? 'text-[#2AA79B]' : cat.color}`} />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Text */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Pesan Anda
                  </label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Tulis saran, laporan bug, atau apapun yang ingin Anda sampaikan..."
                    rows={4}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2AA79B] focus:border-transparent transition-all resize-none placeholder:text-slate-400"
                  />
                  <div className="text-right mt-1">
                    <span className={`text-[10px] font-medium ${feedback.length > 500 ? 'text-red-500' : 'text-slate-400'}`}>
                      {feedback.length}/500
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={sending || !feedback.trim() || feedback.length > 500}
                  className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#2AA79B] to-[#1d7a72] hover:from-[#238c82] hover:to-[#1a6660] text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#2AA79B]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? 'Mengirim...' : 'Kirim Saran'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
