// Gemini API integration for specific item - v6

export const getGroqDetailSuggestion = async (item, searchType, knowledgeText, daggerAsteriskData) => {
  if (!item || !item.code) return null;

  // API Key sekarang ditangani dengan aman di backend (Netlify Functions)

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
    const hasInjuryKeyword = /\b(accident|injury|fracture|burn|poisoning|trauma)\b/.test(titleLower);
    
    if (isInjuryCode || hasInjuryKeyword) {
      externalCauseContext = "\nPERHATIAN KHUSUS: Ini adalah kasus Cedera/Fraktur/Kecelakaan/Keracunan. Ingatkan pengguna dengan tegas bahwa WAJIB menambahkan External Cause Code (kode V, W, X, atau Y) untuk menjelaskan penyebab dan tempat kejadian.";
    }
  }

  const lang = typeof window !== 'undefined' ? (localStorage.getItem('icd_ai_lang') || 'id') : 'id';
  const style = typeof window !== 'undefined' ? (localStorage.getItem('icd_ai_style') || 'bpjs') : 'bpjs';

  let styleInstruction = "";
  if (style === 'bpjs') {
    styleInstruction = lang === 'en'
      ? "\nINSTRUCTION: Focus primarily on BPJS/INA-CBG coding compliance. Emphasize MB1-MB5 rules and billing accuracy."
      : "\nINSTRUKSI: Berikan fokus utama pada kesesuaian koding BPJS / INA-CBG. Tekankan aturan MB1-MB5 dan ketepatan klaim.";
  } else if (style === 'academic') {
    styleInstruction = lang === 'en'
      ? "\nINSTRUCTION: Provide detailed medical background, pathophysiology of the disease, and clinical aspects of the condition."
      : "\nINSTRUKSI: Sediakan penjelasan medis yang mendalam, patofisiologi penyakit, serta aspek klinis dari penyakit ini.";
  } else if (style === 'concise') {
    styleInstruction = lang === 'en'
      ? "\nINSTRUCTION: Keep your response extremely brief. Provide only the most crucial coding warnings and direct facts."
      : "\nINSTRUKSI: Jawablah sesingkat mungkin. Sediakan hanya peringatan koding paling krusial dan fakta-fakta langsung.";
  }

  const systemPromptId = `Anda adalah asisten medis ahli koding INA-CBG (ICD-10 dan ICD-9-CM).
Tugas Anda adalah memberikan penjelasan spesifik untuk KODE yang dipilih oleh pengguna sesuai gaya analisis berikut.
${styleInstruction}

Jawablah dengan terstruktur dan padat mengikuti poin-poin ini saja. JANGAN menambahkan salam penutup, pembuka, atau narasi tambahan apa pun di luar poin ini:

${searchType === 'icd10' ? `1. **Informasi:** (Penjelasan tentang penyakit/diagnosis tersebut sesuai gaya analisis Anda)
2. **Nama Lain:** (Sebutkan jika ada, atau tulis "Tidak ada spesifik")
3. **Tindakan & ICD-9 Terkait:** (Sebutkan tindakan dan kodenya jika ada, tulis "Tidak ada" jika tidak ada)
4. **Dagger/Asterisk:** (Jawab ada/tidak, sebutkan jika ada berdasar info di bawah)
5. **External Cause:** (Sebutkan apakah butuh external cause code V/W/X/Y, ingatkan user untuk mencarinya jika wajib)`
:
`1. **Informasi:** (Penjelasan tentang tindakan/prosedur tersebut sesuai gaya analisis Anda)
2. **Nama Lain:** (Sebutkan jika ada, atau tulis "Tidak ada spesifik")
3. **ICD-10 Terkait:** (Sebutkan diagnosis ICD-10 yang biasa terkait dengan tindakan ini)`}

Konteks Tambahan untuk kode ini:
${daggerAsteriskContext ? daggerAsteriskContext : "Tidak ada aturan khusus untuk kode ini."}
${externalCauseContext ? externalCauseContext : "Tidak ada."}

Referensi Umum (Pedoman Koding Penuh):
---
${knowledgeText}
---`;

  const systemPromptEn = `You are a medical assistant expert in INA-CBG coding (ICD-10 and ICD-9-CM).
Your task is to provide specific explanation for the CODE selected by the user.
${styleInstruction}

Answer concisely and structured following ONLY these points. DO NOT add greetings, closings, or any additional narrative outside these points:

${searchType === 'icd10' ? `1. **Information:** (Explanation of the disease/diagnosis according to your analysis style)
2. **Other Names:** (Mention if any, or write "None specifically")
3. **Related Procedure & ICD-9:** (Mention procedure and its code if any, write "None" if none)
4. **Dagger/Asterisk:** (Answer yes/no, mention if any based on info below)
5. **External Cause:** (Mention if external cause code V/W/X/Y is needed, remind user to search for it if mandatory)`
:
`1. **Information:** (Explanation of the procedure/action according to your analysis style)
2. **Other Names:** (Mention if any, or write "None specifically")
3. **Related ICD-10:** (Mention ICD-10 diagnosis usually related to this procedure)`}

Additional Context for this code:
${daggerAsteriskContext ? daggerAsteriskContext : "No special rules for this code."}
${externalCauseContext ? externalCauseContext : "None."}

General Reference (Full Coding Guidelines):
---
${knowledgeText}
---`;

  const systemPrompt = lang === 'en' ? systemPromptEn : systemPromptId;

  try {
    const apiUrl = import.meta.env.DEV ? '/api/gemini' : '/.netlify/functions/gemini';
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: `Berikan penjelasan untuk: [${item.code}] - ${item.title}` }] }],
        generationConfig: { temperature: 0.1 }
      })
    });

    if (!response.ok) {
      const ct = response.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gagal menghubungi AI");
      } else {
        throw new Error(`Server error (${response.status}). Pastikan Netlify Function ter-deploy.`);
      }
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Respons kosong dari AI");
    }
  } catch (error) {
    console.error("Netlify Function Error:", error);
    throw error;
  }
};

export const getGroqCaseConsultation = async (medicalResume, knowledgeText) => {
  // API Key sekarang ditangani dengan aman di backend (Netlify Functions)

  const lang = typeof window !== 'undefined' ? (localStorage.getItem('icd_ai_lang') || 'id') : 'id';
  const style = typeof window !== 'undefined' ? (localStorage.getItem('icd_ai_style') || 'bpjs') : 'bpjs';

  let styleInstruction = "";
  if (style === 'bpjs') {
    styleInstruction = lang === 'en'
      ? "\nINSTRUCTION FOR STYLE: Focus heavily on INA-CBG / BPJS coding guidelines and optimization. Highlight main diagnosis selection criteria based on MB1-MB5 rules."
      : "\nINSTRUKSI GAYA ANALISIS: Berikan fokus mendalam pada pedoman koding INA-CBG / BPJS dan optimalisasinya. Tekankan kriteria pemilihan diagnosis utama sesuai aturan MB1-MB5.";
  } else if (style === 'academic') {
    styleInstruction = lang === 'en'
      ? "\nINSTRUCTION FOR STYLE: Provide detailed medical rationale and clinical justifications for selecting these codes. Briefly explain the clinical links between comorbid conditions and the primary diagnosis."
      : "\nINSTRUKSI GAYA ANALISIS: Sediakan rasional medis yang mendetail serta justifikasi klinis di balik pemilihan kode-kode ini. Jelaskan secara singkat keterkaitan klinis komorbiditas dengan diagnosis utama.";
  } else if (style === 'concise') {
    styleInstruction = lang === 'en'
      ? "\nINSTRUCTION FOR STYLE: Provide only the essential codes and main coding rules. Keep the rules analysis and notes extremely short and to the point."
      : "\nINSTRUKSI GAYA ANALISIS: Berikan hanya draf kode esensial dan aturan koding utama. Buat analisis aturan koding dan catatan sesingkat mungkin dan langsung ke intinya.";
  }

  const systemPromptId = `Anda adalah asisten medis ahli koding INA-CBG (ICD-10 dan ICD-9-CM) tingkat lanjut.
Tugas Anda adalah membaca resume medis (kasus pasien) yang diberikan pengguna, lalu merumuskan kode diagnosis dan tindakan yang tepat berdasarkan aturan koding yang berlaku dengan gaya analisis berikut.
${styleInstruction}

Struktur jawaban WAJIB menggunakan format markdown berikut:

**1. Diagnosis Utama (Primary Diagnosis)**
- [Kode ICD-10] - Nama Penyakit (Alasan pemilihan sesuai aturan MB1-MB5)

**2. Diagnosis Sekunder (Secondary Diagnoses)**
- [Kode ICD-10] - Nama Penyakit (Termasuk kondisi penyerta/komorbid)
- [Kode ICD-10] - External Cause (Jika kasus cedera/kecelakaan)

**3. Tindakan/Prosedur (ICD-9-CM)**
- [Kode ICD-9] - Nama Tindakan

**4. Analisis & Catatan Aturan Koding**
- Berikan analisis koding berdasarkan gaya analisis yang Anda pilih di atas.

Referensi Umum (Pedoman Koding Penuh):
---
${knowledgeText}
---`;

  const systemPromptEn = `You are an advanced medical assistant expert in INA-CBG coding (ICD-10 and ICD-9-CM).
Your task is to read the medical resume (patient case) provided by the user, then formulate the correct diagnosis and procedure codes based on applicable coding rules with the following analysis style.
${styleInstruction}

Your response MUST use the following markdown structure:

**1. Primary Diagnosis**
- [ICD-10 Code] - Disease Name (Reason for selection according to MB1-MB5 rules)

**2. Secondary Diagnoses**
- [ICD-10 Code] - Disease Name (Including comorbidities/underlying conditions)
- [ICD-10 Code] - External Cause (If injury/accident case)

**3. Procedures/Interventions (ICD-9-CM)**
- [ICD-9 Code] - Procedure Name

**4. Analysis & Coding Rules Notes**
- Provide a brief coding analysis based on the analysis style chosen above.

General Reference (Full Coding Guidelines):
---
${knowledgeText}
---`;

  const systemPrompt = lang === 'en' ? systemPromptEn : systemPromptId;

  try {
    const apiUrl = import.meta.env.DEV ? '/api/gemini' : '/.netlify/functions/gemini';
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: lang === 'en' ? `Please create a coding draft for the following medical resume:\n\n"${medicalResume}"` : `Tolong buatkan draft koding untuk resume medis berikut:\n\n"${medicalResume}"` }] }],
        generationConfig: { temperature: 0.2 }
      })
    });

    if (!response.ok) {
      const ct = response.headers.get("content-type");
      if (ct && ct.includes("application/json")) {
        const err = await response.json();
        throw new Error(err.error?.message || "Gagal menghubungi AI");
      } else {
        throw new Error(`Server error (${response.status}). Pastikan Netlify Function ter-deploy.`);
      }
    }

    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      throw new Error("Respons kosong dari AI");
    }
  } catch (error) {
    console.error("Netlify Function Error:", error);
    throw error;
  }
};
