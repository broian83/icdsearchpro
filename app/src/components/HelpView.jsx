import React from 'react';
import { HelpCircle, Book, MessageCircle, FileText } from 'lucide-react';

export function HelpView() {
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#00B4A4]/10 rounded-xl text-[#00B4A4]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pusat Bantuan</h2>
          <p className="text-sm text-slate-500 mt-1">Temukan jawaban atas pertanyaan Anda di sini.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="#" className="p-4 border border-slate-200 rounded-lg hover:border-[#00B4A4] hover:shadow-md transition-all group">
          <Book className="w-6 h-6 text-slate-400 group-hover:text-[#00B4A4] mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">Panduan Pengguna</h3>
          <p className="text-xs text-slate-500">Pelajari cara menggunakan fitur pencarian dan AI.</p>
        </a>
        <a href="#" className="p-4 border border-slate-200 rounded-lg hover:border-[#00B4A4] hover:shadow-md transition-all group">
          <MessageCircle className="w-6 h-6 text-slate-400 group-hover:text-[#00B4A4] mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">Hubungi Dukungan</h3>
          <p className="text-xs text-slate-500">Kirim pesan kepada tim PMIK-id via email.</p>
        </a>
        <a href="#" className="p-4 border border-slate-200 rounded-lg hover:border-[#00B4A4] hover:shadow-md transition-all group">
          <FileText className="w-6 h-6 text-slate-400 group-hover:text-[#00B4A4] mb-3" />
          <h3 className="font-bold text-slate-800 mb-1">Kebijakan Privasi</h3>
          <p className="text-xs text-slate-500">Baca bagaimana kami melindungi data medis Anda.</p>
        </a>
      </div>
    </div>
  );
}
