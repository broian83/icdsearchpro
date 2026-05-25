import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#00B4A4]/10 rounded-xl text-[#00B4A4]">
          <HelpCircle className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pusat Bantuan (FAQ)</h2>
          <p className="text-sm text-slate-500 mt-1">Temukan jawaban atas pertanyaan umum seputar ICD Search Pro.</p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`border rounded-xl transition-all duration-200 ${
              openIndex === index ? 'border-[#00B4A4] shadow-sm bg-slate-50' : 'border-slate-200 hover:border-[#00B4A4]/50'
            }`}
          >
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none"
            >
              <span className="font-semibold text-slate-800 pr-4">{faq.question}</span>
              <ChevronDown 
                className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                  openIndex === index ? 'rotate-180 text-[#00B4A4]' : ''
                }`} 
              />
            </button>
            <div 
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed pt-2">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
