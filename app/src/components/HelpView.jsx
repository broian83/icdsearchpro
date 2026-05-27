import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Keyboard, Info, BookOpen } from 'lucide-react';

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

const eduGuidelines = [
  {
    title: "Alur Koding Digital (Vol. 3 → Vol. 1)",
    icon: "📖",
    content: (
      <div className="space-y-2 text-xs sm:text-sm">
        <p>Aplikasi ini dirancang khusus untuk mereplikasi alur koding standar WHO/PORMIKI secara digital demi meminimalisir kesalahan:</p>
        <ol className="list-decimal pl-5 space-y-1.5 leading-relaxed text-slate-650 dark:text-slate-300">
          <li><strong>Identifikasi Lead Term</strong>: Ketikkan kata benda kondisi patologis (misalnya <em>"Pneumonia"</em>, <em>"Fracture"</em>) di kolom input pencarian utama.</li>
          <li><strong>Grup Kategori (Index Alfabetis Vol. 3)</strong>: Hasil pencarian otomatis dikelompokkan ke dalam kategori induknya (seperti <code>J18</code> atau <code>S72</code>).</li>
          <li><strong>Verifikasi Subkode (Tabular List Vol. 1)</strong>: Klik tombol <em>"Tampilkan semua subkode"</em> pada grup kartu untuk memverifikasi subkode paling spesifik (seperti <code>J18.9</code> atau <code>S72.0</code>) berdasarkan detail klinis di berkas rekam medis.</li>
        </ol>
      </div>
    )
  },
  {
    title: "Panduan Lencana Badge Peringatan Klinis",
    icon: "🏷️",
    content: (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
        <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/50 rounded-xl">
          <span className="font-bold text-yellow-800 dark:text-yellow-400 text-xs uppercase flex items-center gap-1">⚠ Omit Code (ICD-9)</span>
          <p className="text-slate-600 dark:text-slate-405 mt-1 leading-normal">
            Merupakan tindakan medis rutin yang pengerjaannya sudah inheren/tercakup dalam prosedur utama. Berdasarkan aturan JKN (PMK 76/2016), kode ini <strong>tidak boleh dikode terpisah</strong> untuk klaim BPJS (mis. kanulasi vena rutin atau episiotomi). Keterangan kondisi omit tersedia pada tooltip lencana terkait.
          </p>
        </div>
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50 rounded-xl">
          <span className="font-bold text-purple-800 dark:text-purple-400 text-xs uppercase flex items-center gap-1">🔗 Dagger/Asterisk (ICD-10)</span>
          <p className="text-slate-600 dark:text-slate-405 mt-1 leading-normal">
            Sistem klasifikasi ganda berpasangan. Kode Dagger (tanda †, etiologi penyakit) harus menjadi diagnosis utama, dan wajib diikuti oleh Kode Asterisk (tanda *, manifestasi organ tubuh) sebagai diagnosis sekunder (komorbid).
          </p>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/50 rounded-xl">
          <span className="font-bold text-orange-800 dark:text-orange-400 text-xs uppercase flex items-center gap-1">🚨 External Code / Penyebab Luar</span>
          <p className="text-slate-600 dark:text-slate-405 mt-1 leading-normal">
            Wajib menyertakan kode bab XX (V01-Y98) sebagai diagnosis penunjang jika diagnosis utamanya adalah cedera (S00-T98) atau keracunan. Ini penting untuk melengkapi berkas administrasi dan keabsahan klaim JKN.
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl">
          <span className="font-bold text-blue-800 dark:text-blue-400 text-xs uppercase flex items-center gap-1">🩺 Gejala / Symptoms (Bab R)</span>
          <p className="text-slate-600 dark:text-slate-405 mt-1 leading-normal">
            Berdasarkan kaidah koding WHO (Kaidah MB1), gejala (seperti pingsan R55, nyeri dada R07) tidak boleh dikode sebagai diagnosis utama jika penyakit aslinya (mis. infark miokard PJK) telah ditegakkan oleh dokter.
          </p>
        </div>
      </div>
    )
  },
  {
    title: "Kasus Koding JKN: Hipertensi + Gagal Jantung Kongestif",
    icon: "💡",
    content: (
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl leading-relaxed text-slate-700 dark:text-slate-300">
          <span className="font-bold text-slate-800 dark:text-slate-200">Skenario Resume:</span> Pasien masuk IGD dengan keluhan sesak napas akut. Hasil pemeriksaan menunjukkan efusi pleura dan edema paru akibat gagal jantung. Dokter menulis diagnosis utama: <strong>Hipertensi Primer</strong> dan <strong>Gagal Jantung Kongestif (CHF)</strong>.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-xl">
            <span className="font-bold text-red-700 dark:text-red-400 text-xs flex items-center gap-1">❌ Salah (Koding Terpisah)</span>
            <p className="text-sm font-mono font-bold mt-1">I10 + I50.0</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Mengkoding kedua diagnosis secara terpisah adalah kekeliruan besar. Kausalitas antara hipertensi dan gangguan jantung sudah terikat dalam kode kombinasi. Pemisahan kode berisiko memicu dispute klaim saat diaudit verifikator BPJS.
            </p>
          </div>
          <div className="p-3.5 bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900/50 rounded-xl">
            <span className="font-bold text-green-700 dark:text-green-400 text-xs flex items-center gap-1">✅ Benar (Kode Kombinasi)</span>
            <p className="text-sm font-mono font-bold mt-1">I11.0 (Hypertensive Heart Disease with CHF)</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              <strong>Aturan Resmi (ICD-10 Vol. 1):</strong> Di bawah kelompok kode <code>I11</code>, terdapat instruksi inklusi eksplisit untuk menyatukan gagal jantung (<code>I50.-</code>) akibat hipertensi. Koder wajib menggunakan kode kombinasi tunggal <code>I11.0</code>.
            </p>
          </div>
        </div>
      </div>
    )
  }
];

export function HelpView() {
  const [openIndex, setOpenIndex] = useState(null);
  const [eduOpenIndex, setEduOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const toggleEduAccordion = (index) => {
    setEduOpenIndex(eduOpenIndex === index ? null : index);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* JKN Coding Education Center */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#2AA79B]/10 rounded-xl text-[#2AA79B]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pusat Edukasi Koding JKN</h2>
            <p className="text-sm text-slate-555 dark:text-slate-400 mt-1">Panduan klinis praktis, contoh kasus, dan penjelasan badge demi kepatuhan koding JKN.</p>
          </div>
        </div>

        <div className="space-y-3">
          {eduGuidelines.map((item, index) => (
            <div 
              key={index} 
              className={`border rounded-xl transition-all duration-200 ${
                eduOpenIndex === index ? 'border-[#2AA79B] shadow-sm bg-slate-50 dark:bg-slate-800/40' : 'border-slate-200 dark:border-slate-800 hover:border-[#2AA79B]/40'
              }`}
            >
              <button
                onClick={() => toggleEduAccordion(index)}
                className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none cursor-pointer"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2 pr-4 text-sm sm:text-base">
                  <span className="text-lg">{item.icon}</span>
                  {item.title}
                </span>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-450 dark:text-slate-500 transition-transform duration-300 shrink-0 ${
                    eduOpenIndex === index ? 'rotate-180 text-[#2AA79B]' : ''
                  }`} 
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  eduOpenIndex === index ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 text-slate-650 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-2">
                  {item.content}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-[#2AA79B]/10 rounded-xl text-[#2AA79B]">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pertanyaan Umum (FAQ)</h2>
            <p className="text-sm text-slate-555 dark:text-slate-400 mt-1">Temukan jawaban atas pertanyaan teknis operasional ICD Pro.</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border rounded-xl transition-all duration-200 ${
                openIndex === index ? 'border-[#2AA79B] shadow-sm bg-slate-50 dark:bg-slate-800/40' : 'border-slate-200 dark:border-slate-800 hover:border-[#2AA79B]/40'
              }`}
            >
              <button
                onClick={() => toggleAccordion(index)}
                className="w-full text-left px-5 py-4 flex items-center justify-between focus:outline-none cursor-pointer text-sm sm:text-base font-semibold text-slate-850 dark:text-slate-100"
              >
                <span className="pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 text-slate-450 dark:text-slate-500 transition-transform duration-300 shrink-0 ${
                    openIndex === index ? 'rotate-180 text-[#2AA79B]' : ''
                  }`} 
                />
              </button>
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-5 pb-5 text-slate-650 dark:text-slate-300 text-xs sm:text-sm leading-relaxed pt-2">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcuts Section */}
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200/60 dark:border-slate-800 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-[#2AA79B]/10 rounded-xl text-[#2AA79B]">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Pintasan Keyboard (Shortcuts)</h2>
            <p className="text-sm text-slate-555 dark:text-slate-400 mt-1">Daftar kombinasi tombol pintas untuk efisiensi koding Anda.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          {/* ICD-10 Shortcuts */}
          <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#2AA79B] border-b border-slate-150 dark:border-slate-800 pb-2">Filter ICD-10 (Alt + Shift + [Huruf])</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Reset / Semua Kategori</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + X</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Infeksi & Parasit (A-B)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + A</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Neoplasma / Darah (C-D)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + C</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Saraf / Nervous (G)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + G</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Sirkulasi / Kardio (I)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + I</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Pernapasan (J)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + J</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Cedera & Keracunan (S-T)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + S</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Penyebab Eksternal (V-Y)</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + V</kbd>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 italic leading-relaxed">
              *Pintasan tersedia untuk seluruh inisial chapter ICD-10 (misalnya Alt+Shift+Z untuk chapter Z).
            </p>
          </div>

          {/* ICD-9 Shortcuts */}
          <div className="border border-slate-150 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#2AA79B] border-b border-slate-150 dark:border-slate-800 pb-2">Filter ICD-9 Prosedur (Alt + Shift + [Tombol])</h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">Reset / Semua Prosedur</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + X</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">00: Prosedur Lainnya</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + O</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">01-09: Saraf & Endokrin</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 0</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">10-19: Mata & Telinga</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 1</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">30-39: Napas & Jantung</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 3</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">50-59: Cerna (Baw) & Kemih</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 5</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">70-79: Kebidanan & Tulang</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 7</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-650 dark:text-slate-300 text-xs sm:text-sm">80-89: Otot, Kulit, Diagnostik</span>
                <kbd className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md font-mono font-bold text-xs">Alt + Shift + 8</kbd>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 italic leading-relaxed">
              *Angka 0 s.d 9 memetakan rentang bab (misalnya Alt+Shift+9 untuk bab 90-99).
            </p>
          </div>
        </div>

        {/* Global Shortcuts Info */}
        <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-150 dark:border-slate-800 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#2AA79B] shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-600 dark:text-slate-400 leading-relaxed text-xs">
            <p className="font-bold text-slate-800 dark:text-slate-200">Cara Penggunaan Pintasan:</p>
            <p>Pintasan keyboard filter hanya akan aktif jika Anda **tidak sedang memfokuskan kursor** di kolom pencarian ataupun textarea koding AI. Klik sembarang tempat kosong di layar untuk melepaskan fokus input sebelum menekan pintasan.</p>
          </div>
        </div>
      </div>

    </div>
  );
}
