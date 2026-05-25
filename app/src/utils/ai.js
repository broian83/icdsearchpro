// Gemini API integration for specific item

export const getGroqDetailSuggestion = async (item, searchType, knowledgeText, daggerAsteriskData) => {
  if (!item || !item.code) return null;

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key Gemini tidak ditemukan di .env");
  }

  // Cari relasi dagger/asterisk jika ini ICD-10
  let daggerAsteriskContext = "";
  if (searchType === 'icd10' && daggerAsteriskData && daggerAsteriskData.bab) {
    const matches = [];
    const searchCode = item.code.replace(/[^A-Z0-9.]/g, ''); 
    
    daggerAsteriskData.bab.forEach(b => {
      if (b.pasangan_dagger_asterisk) {
        b.pasangan_dagger_asterisk.forEach(pair => {
          if (pair.dagger.includes(searchCode) || pair.asterisk.includes(searchCode)) {
            matches.push(`Dagger: ${pair.dagger}, Asterisk: ${pair.asterisk} - ${pair.keterangan}`);
          }
        });
      }
    });

    if (matches.length > 0) {
      daggerAsteriskContext = `\nPERHATIAN KHUSUS: Kode ini memiliki aturan Dagger (†) dan Asterisk (*) berikut:\n` + matches.join("\n");
    }
  }

  // Cek external cause
  let externalCauseContext = "";
  if (searchType === 'icd10') {
    const char0 = item.code.charAt(0).toUpperCase();
    const titleLower = item.title.toLowerCase();
    const isInjuryCode = ['S', 'T', 'V', 'W', 'X', 'Y'].includes(char0);
    const hasInjuryKeyword = titleLower.includes('accident') || titleLower.includes('injury') || titleLower.includes('fracture') || titleLower.includes('burn') || titleLower.includes('poisoning') || titleLower.includes('trauma');
    
    if (isInjuryCode || hasInjuryKeyword) {
      externalCauseContext = "\nPERHATIAN KHUSUS: Ini adalah kasus Cedera/Fraktur/Kecelakaan/Keracunan. Ingatkan pengguna dengan tegas bahwa WAJIB menambahkan External Cause Code (kode V, W, X, atau Y) untuk menjelaskan penyebab dan tempat kejadian.";
    }
  }

  const systemPrompt = `Anda adalah asisten medis ahli koding INA-CBG (ICD-10 dan ICD-9-CM).
Tugas Anda adalah memberikan penjelasan spesifik namun SINGKAT untuk KODE yang dipilih oleh pengguna.

Jawablah dengan terstruktur dan padat mengikuti poin-poin ini saja. JANGAN menambahkan salam penutup, pembuka, atau narasi tambahan apa pun di luar poin ini:

${searchType === 'icd10' ? `1. **Informasi:** (Penjelasan singkat tentang penyakit/diagnosis tersebut)
2. **Nama Lain:** (Sebutkan jika ada, atau tulis "Tidak ada spesifik")
3. **Tindakan & ICD-9 Terkait:** (Sebutkan tindakan dan kodenya jika ada, tulis "Tidak ada" jika tidak ada)
4. **Dagger/Asterisk:** (Jawab ada/tidak, sebutkan jika ada berdasar info di bawah)
5. **External Cause:** (Sebutkan apakah butuh external cause code V/W/X/Y, ingatkan user untuk mencarinya jika wajib)`
:
`1. **Informasi:** (Penjelasan singkat tentang tindakan/prosedur tersebut)
2. **Nama Lain:** (Sebutkan jika ada, atau tulis "Tidak ada spesifik")
3. **ICD-10 Terkait:** (Sebutkan diagnosis ICD-10 yang biasa terkait dengan tindakan ini)`}

Konteks Tambahan untuk kode ini:
${daggerAsteriskContext ? daggerAsteriskContext : "Tidak ada aturan khusus untuk kode ini."}
${externalCauseContext ? externalCauseContext : "Tidak ada."}

Referensi Umum (Pedoman Koding Penuh):
---
${knowledgeText}
---`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Berikan penjelasan untuk: [${item.code}] - ${item.title}` }]
          }
        ],
        generationConfig: {
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Gagal menghubungi Gemini API");
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Respons kosong dari Gemini API");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const getGroqCaseConsultation = async (medicalResume, knowledgeText) => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("API Key Gemini tidak ditemukan di .env");
  }

  const systemPrompt = `Anda adalah asisten medis ahli koding INA-CBG (ICD-10 dan ICD-9-CM) tingkat lanjut.
Tugas Anda adalah membaca resume medis (kasus pasien) yang diberikan pengguna, lalu merumuskan kode diagnosis dan tindakan yang tepat berdasarkan aturan koding yang berlaku.

Struktur jawaban WAJIB menggunakan format markdown berikut:

**1. Diagnosis Utama (Primary Diagnosis)**
- [Kode ICD-10] - Nama Penyakit (Alasan pemilihan sesuai aturan MB1-MB5)

**2. Diagnosis Sekunder (Secondary Diagnoses)**
- [Kode ICD-10] - Nama Penyakit (Termasuk kondisi penyerta/komorbid)
- [Kode ICD-10] - External Cause (Jika kasus cedera/kecelakaan)

**3. Tindakan/Prosedur (ICD-9-CM)**
- [Kode ICD-9] - Nama Tindakan

**4. Analisis & Catatan Aturan Koding**
- Berikan analisis singkat mengapa kode-kode tersebut dipilih berdasarkan resume medis dan pedoman.

Referensi Umum (Pedoman Koding Penuh):
---
${knowledgeText}
---`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: "user",
            parts: [{ text: `Tolong buatkan draft koding untuk resume medis berikut:\n\n"${medicalResume}"` }]
          }
        ],
        generationConfig: {
          temperature: 0.2
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || "Gagal menghubungi Gemini API");
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Respons kosong dari Gemini API");
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
