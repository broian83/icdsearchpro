Berikut adalah rancangan basis pengetahuan (*knowledge base*) komprehensif bagi AI untuk melakukan, menganalisis, dan memberikan referensi kode diagnosis serta tindakan berdasarkan sistem INA-CBGs (ICD-10 dan ICD-9-CM):

### **1. PRINSIP DASAR KODING DALAM SISTEM INA-CBG**
Sistem INA-CBG menggunakan **ICD-10** (Tahun 2008) untuk mengkode diagnosis utama dan diagnosis sekunder, serta **ICD-9-CM** untuk mengkode tindakan/prosedur. Ketepatan koding sangat berpengaruh terhadap hasil *grouper* tarif pelayanan.

*   **Diagnosis Utama:** Diagnosis akhir atau final yang dipilih dokter pada hari terakhir perawatan, dengan kriteria kondisi ini **paling banyak menggunakan sumber daya atau menghabiskan hari rawat paling lama**.
*   **Diagnosis Sekunder:** Kondisi komorbiditas atau komplikasi yang menyertai diagnosis utama pada saat masuk atau yang timbul selama masa pengobatan, serta membutuhkan pelayanan khusus.
*   **Gejala dan Tanda (Kode R dan Z):** Hati-hati dalam mengkode diagnosis utama dengan kode BAB XVIII (Kode R) dan XXI (Kode Z) untuk rawat inap. Kode ini hanya digunakan jika diagnosis spesifik dari suatu penyakit belum dapat ditegakkan hingga akhir perawatan, atau untuk pasien *suspect* yang dapat dikesampingkan sesudah pemeriksaan.

### **2. ATURAN RESELEKSI DIAGNOSIS UTAMA (RULE MB1 - MB5)**
AI harus memeriksa validitas penetapan diagnosis utama menggunakan pedoman *Rule* MB1-MB5:
*   **Rule MB1 (Kondisi minor vs bermakna):** Jika kondisi minor direkam sebagai diagnosis utama sementara kondisi yang jauh lebih bermakna dan memakan sumber daya dicatat sebagai diagnosis sekunder, **reseleksi kondisi yang bermakna sebagai diagnosis utama**.
*   **Rule MB2 (Beberapa kondisi dicatat bersamaan):** Jika ada beberapa kondisi yang tidak bisa dikode bersamaan sebagai diagnosis utama, pilih diagnosis yang ditunjukkan informasinya sebagai diagnosis utama. Jika tidak ada informasi tambahan, **pilih yang disebut pertama**.
*   **Rule MB3 (Gejala vs Penyakit Spesifik):** Jika suatu gejala (Kode R) atau masalah (Kode Z) ditetapkan sebagai kondisi utama, padahal rekam medis juga mencatat kondisi/penyakit spesifik yang lebih menggambarkan keluhan pasien dan mendapatkan terapi, **reseleksi penyakit tersebut sebagai diagnosis utama**.
*   **Rule MB4 (Spesifisitas):** Bila diagnosis utama adalah istilah umum, tetapi ada istilah/diagnosis lain yang memberi informasi lokasi atau sifat dasar penyakit yang **lebih spesifik, reseleksi kondisi spesifik tersebut sebagai diagnosis utama** (contoh: *Cerebrovascular accident* diganti menjadi *Cerebral haemorrhage*).
*   **Rule MB5 (Alternatif diagnosis):** Bila ada dua atau lebih diagnosis dicatat sebagai pilihan kondisi utama (misal: "A atau B"), **pilih diagnosis yang pertama disebut**.

### **3. KAIDAH KODE KHUSUS PADA ICD-10**
*   **Sistem *Dagger* (†) dan *Asterisk* (*):** Jika dokter menegakkan diagnosis yang melibatkan *dagger* (menandakan etiologi) dan *asterisk* (menandakan manifestasi organ spesifik), kode *dagger* harus digunakan sebagai diagnosis utama, sedangkan *asterisk* sebagai diagnosis sekunder. **Kode kombinasi ini wajib dikoding bersamaan**, kecuali diagnosis utamanya sama sekali berbeda.
*   **Kode Kondisi Multipel:** Untuk kasus dengan kondisi multipel (cedera, HIV, dll) tanpa ada satu kondisi menonjol, beri kode "multiple" dan tambahkan kode sekunder untuk kondisi individu (contoh: *HIV disease resulting in multiple infections* B20.7).
*   **Kondisi Akut dan Kronis:** Bila ada kondisi akut dan kronis dari penyakit yang sama tercatat, **pilih kode kondisi akut sebagai diagnosis utama** dan kondisi kronis sebagai sekunder.

### **4. REFERENSI CEPAT KODE DIAGNOSIS SPESIFIK (KASUS MEDIS UMUM)**

**A. Infeksi & Parasit (A00-B99)**
*   **Demam Tifoid (Typhoid Fever):** Gunakan kode **A01.0**. Diare yang merupakan gejala dari tifoid tidak boleh dikode terpisah menjadi Salmonella Enteritis. Jika disertai Pneumonia, kode dengan sistem kombinasi *dagger-asterisk*: A01.0† dan J17.0*. Jika pasien sedang hamil, diagnosis utamanya O98.9 (penyakit ibu penyerta kehamilan) dan A01.0 sebagai sekunder.
*   **Tuberkulosis (TB):** Pengkodean wajib melihat hasil pemeriksaan medis. **A15.1** (Konfirmasi kultur), **A15.2** (Konfirmasi histologis), **A15.3** (Konfirmasi belum spesifik). Jika secara bakteriologis dan histologis negatif, gunakan **A16.0**. TB + HIV harus menggunakan **B20.0** (*HIV disease resulting in mycobacterial infection*) sebagai diagnosis utama.
*   **Sepsis:** Diagnosis syok sepsis menggunakan **A41.9** (Septicaemia) dengan tambahan diagnosis sekunder **R57.2** (Septic shock). 
*   **Dengue:** Dengue Hemorrhagic Fever (DHF) dikode **A91**. Syok hipovolemik (DSS) tidak menggantikan kode A91, tetapi ditambahkan jika ada tata laksana sesuai klinis.

**B. Sistem Endokrin & Metabolik (E00-E90)**
*   **Diabetes Mellitus (E10-E14):** Karakter keempat digunakan untuk mendeskripsikan komplikasi. Contoh: **.0** (dengan koma), **.1** (dengan asidosis), **.2** (dengan komplikasi ginjal), **.5** (dengan komplikasi pembuluh darah perifer/ulkus/gangren), **.7** (dengan multipel komplikasi). 
*   **Ulkus/Gangren Diabetik:** Dikode langsung dengan kombinasi E11.5 (DM Tipe 2 dengan komplikasi pembuluh darah tepi). Ulkus dekubitus yang dipicu oleh faktor lain di luar DM menggunakan L89.

**C. Sistem Kardiovaskular & Pernapasan (I00-J99)**
*   **Hipertensi:** **I10** untuk hipertensi esensial. Jika ada Gagal Jantung Kongestif akibat hipertensi, kode gabungannya **I11.0**. Hipertensi dengan Gagal Ginjal sekaligus Gagal Jantung dikode **I13.2**.
*   **Stroke:** Oklusi/stenosis arteri (*Cerebral Infarction*) dikode **I63**. Perdarahan intracerebral **I61**. Jika jenis tidak spesifik, gunakan **I64**. Jika penyakit merupakan sisa/late effect (*sequelae*), kode **I69.-** harus digunakan.
*   **PPOK (COPD):** PPOK (J44.9) dengan Pneumonia/infeksi napas bawah dikode kombinasi sebagai **J44.0**. Namun, PPOK dengan Eksaserbasi Akut dikode **J44.1**, dan apabila ada Pneumonia menyertai, J18.9 tetap dikode secara terpisah. 

**D. Kehamilan, Melahirkan, dan Nifas (O00-O99)**
*   Kode diagnosis di BAB XV (O00-O99) memiliki prioritas untuk semua kasus yang terjadi saat hamil.
*   **Persalinan dengan Penyulit:** Bila terdapat komplikasi/penyulit, komplikasi menjadi **diagnosis utama**, dan metode persalinan (contoh: *Caesarean section* O82.-) menjadi diagnosis sekunder. **Semua kasus persalinan wajib mencantumkan kode outcome bayi (Z37.-)** sebagai sekunder.
*   **Penyakit penyerta hamil:** Pasien penderita TB/Tifoid/Demam Berdarah yang sedang hamil, maka penyakit maternal tersebut menjadi utama di BAB O (contoh: **O98.5**), lalu penyakitnya menjadi diagnosis sekunder. 

**E. Sistem Genitourinari (N00-N99)**
*   **Batu Saluran Kemih (Urolithiasis):** Batu ginjal adalah **N20.0**. Apabila urolitiasis disertai infeksi (*urinary tract infection*), gunakan hanya satu kode batu saja (N20-N23), atau gunakan kode spesifik **N13.6** (*Pyonephrosis*) hanya bila terbukti batu ginjal/ureter + hidronefrosis + infeksi. 

### **5. PRINSIP PENGKODEAN TINDAKAN/PROSEDUR (ICD-9-CM)**
*   Lakukan koding berdasarkan lokasi anatomi dan instrumen yang digunakan.
*   **Peraturan *Omit Code*:** Jika dalam daftar alfabet tindakan terdapat instruksi "*omit code*", artinya tindakan tersebut secara otomatis sudah menjadi bagian dari prosedur utama dan tidak boleh dikode ganda. Misalnya, tindakan **Adhesiolisis** secara tumpul (*blunt*), manual, digital, mekanik, atau tanpa instrumen dinyatakan sebagai "*omit code*" dan tidak perlu diklaimkan terpisah.
*   **Eksisi Jaringan (*Debridement* / STT):** Pengambilan jaringan superfisial/subkutan menggunakan **86.3**, otot/tendon yang lebih dalam menggunakan **83.39**. Jika dilakukan cek Patologi Anatomi (Biopsi), jangan gunakan kode eksisi, namun gunakan biopsi jaringan **86.11** atau **83.21**. *Debridement* akibat luka bakar atau infeksi secara bedah menggunakan **86.22**, sementara non-eksisi dikode **86.28**.

*Gunakan basis data ini untuk memverifikasi entri diagnosis dokter, menyingkirkan praktik upcoding, menerapkan kaidah reseleksi MB1-MB5 dengan tepat, serta memberikan rujukan kode kombinasi yang sah dalam ekosistem Jaminan Kesehatan Nasional (INA-CBGs).*