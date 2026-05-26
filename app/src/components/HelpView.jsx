import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Keyboard, Info } from 'lucide-react';

const faqs = [
  {
    question: "Bagaimana cara menggunakan fitur pencarian ICD?",
    answer: "Cukup ketikkan kata kunci diagnosa atau kode pada kolom pencarian di halaman utama. Sistem akan otomatis mencari kecocokan pada database ICD-10 maupun ICD-9."
  },
  {
    question: "Apa itu fitur Klinik AI?",
    answer: "Klinik AI adalah fitur pintar yang dapat membantu Anda menganalisis resume medis pasien dan secara otomatis menyusun draf koding ICD yang sesuai dengan aturan INA-CBG."
  },
  {
    question: "Bagaimana cara menyimpan kode (Bookmark)?",
    answer: "Setelah melakukan pencarian, klik ikon bintang (★) pada hasil pencarian yang diinginkan. Kode tersebut akan otomatis tersimpan di halaman Bookmark Saya dan diamankan di Cloud."
  },
  {
    question: "Apakah data pencarian saya aman?",
    answer: "Ya, kami menggunakan sistem autentikasi dan database modern yang dienkripsi untuk memastikan keamanan data profil dan histori pencarian Anda."
  },
  {
    question: "Bagaimana jika saya menemukan error atau bug?",
    answer: "Anda dapat menghubungi tim dukungan PMIK-id melalui email atau grup komunitas untuk melaporkan error. Kami selalu berusaha memberikan pembaruan rutin untuk menjaga kenyamanan Anda."
  }
];

export function HelpView() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* FAQ Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#00B4A4]/10 rounded-xl text-[#00B4A4]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pusat Bantuan (FAQ)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Temukan jawaban atas pertanyaan umum seputar ICD Search Pro.</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-xl transition-all duration-200 ${
                openIndex === index ? 'border-[#00B4A4] shadow-sm bg-slate-50 dark:bg-slate-800/50' : 'border-slate-200 dark:border-slate-700 hover:border-[#00B4A4]/50'
              }`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100 pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-400 dark:text-slate-500 transition-transform duration-300 shrink-0 ${
                    openIndex === index ? 'rotate-180 text-[#00B4A4]' : ''
                  }`} 
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 text-slate-600 dark:text-slate-300 text-sm leading-relaxed pt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#00B4A4]/10 rounded-xl text-[#00B4A4]">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pintasan Keyboard (Shortcuts)</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Daftar kombinasi tombol pintas untuk efisiensi koding Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* ICD-10 Shortcuts */}
          <div className="border border-slate-100 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#00B4A4] border-b border-slate-100 dark:border-slate-700/50 pb-2">Filter ICD-10 (Alt + Shift + [Huruf])</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Reset / Semua Kategori</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + X</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Infeksi & Parasit (A-B)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Neoplasma / Darah (C-D)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Saraf / Nervous (G)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + G</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Sirkulasi / Kardio (I)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + I</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Pernapasan (J)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + J</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Cedera & Keracunan (S-T)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + S</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Penyebab Eksternal (V-Y)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + V</kbd>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 italic leading-relaxed">
              *Pintasan tersedia untuk seluruh inisial chapter ICD-10 (misalnya Alt+Shift+Z untuk chapter Z).
            </p>
          </div>

          {/* ICD-9 Shortcuts */}
          <div className="border border-slate-100 dark:border-slate-700/80 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#00B4A4] border-b border-slate-100 dark:border-slate-700/50 pb-2">Filter ICD-9 Prosedur (Alt + Shift + [Tombol])</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">Reset / Semua Prosedur</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + X</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">00: Prosedur Lainnya</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + O</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">01-09: Saraf & Endokrin</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 0</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">10-19: Mata & Telinga</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 1</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">30-39: Napas & Jantung</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 3</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">50-59: Cerna (Baw) & Kemih</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 5</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">70-79: Kebidanan & Tulang</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 7</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-300">80-89: Otot, Kulit, Diagnostik</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 8</kbd>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 italic leading-relaxed">
              *Angka 0 s.d 9 memetakan rentang bab (misalnya Alt+Shift+9 untuk bab 90-99).
            </p>
          </div>
        </div>

        {/* Global Shortcuts Info */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#00B4A4] shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">Cara Penggunaan Pintasan:</p>
            <p>Pintasan keyboard filter hanya akan aktif jika Anda **tidak sedang memfokuskan kursor** di kolom pencarian ataupun textarea koding AI. Klik sembarang tempat kosong di layar untuk melepaskan fokus input sebelum menekan pintasan.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
