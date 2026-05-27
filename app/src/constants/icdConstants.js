export const icd10Chapters = [
  { id: 'all', label: 'Semua Kategori (ICD-10) [Alt+Shift+X]' },
  { id: 'A|B', label: 'A-B: Infeksi & Parasit [Alt+Shift+A]' },
  { id: 'C|D', label: 'C-D: Neoplasma / Darah [Alt+Shift+C]' },
  { id: 'E', label: 'E: Endokrin & Metabolik [Alt+Shift+E]' },
  { id: 'F', label: 'F: Gangguan Mental [Alt+Shift+F]' },
  { id: 'G', label: 'G: Saraf (Nervous) [Alt+Shift+G]' },
  { id: 'H', label: 'H: Mata & Telinga [Alt+Shift+H]' },
  { id: 'I', label: 'I: Sirkulasi (Kardio) [Alt+Shift+I]' },
  { id: 'J', label: 'J: Pernapasan [Alt+Shift+J]' },
  { id: 'K', label: 'K: Pencernaan [Alt+Shift+K]' },
  { id: 'L', label: 'L: Kulit & Jaringan [Alt+Shift+L]' },
  { id: 'M', label: 'M: Otot & Tulang [Alt+Shift+M]' },
  { id: 'N', label: 'N: Genitourinari [Alt+Shift+N]' },
  { id: 'O', label: 'O: Kehamilan & Melahirkan [Alt+Shift+O]' },
  { id: 'P', label: 'P: Perinatal [Alt+Shift+P]' },
  { id: 'Q', label: 'Q: Kelainan Bawaan [Alt+Shift+Q]' },
  { id: 'R', label: 'R: Gejala & Tanda [Alt+Shift+R]' },
  { id: 'S|T', label: 'S-T: Cedera & Keracunan [Alt+Shift+S]' },
  { id: 'V|W|X|Y', label: 'V-Y: Penyebab Eksternal (KLL) [Alt+Shift+V]' },
  { id: 'Z', label: 'Z: Faktor Status Kesehatan [Alt+Shift+Z]' }
];

export const icd9Chapters = [
  { id: 'all', label: 'Semua Kategori (ICD-9) [Alt+Shift+X]' },
  { id: '00', label: '00: Prosedur Lainnya [Alt+Shift+O]' },
  { id: '0', label: '01-09: Saraf & Endokrin [Alt+Shift+0]' },
  { id: '1', label: '10-19: Mata & Telinga [Alt+Shift+1]' },
  { id: '2', label: '20-29: Hidung & Mulut [Alt+Shift+2]' },
  { id: '3', label: '30-39: Napas & Jantung [Alt+Shift+3]' },
  { id: '4', label: '40-49: Cerna (Atas) [Alt+Shift+4]' },
  { id: '5', base: '5', label: '50-59: Cerna (Bawah) & Sal. Kemih [Alt+Shift+5]' },
  { id: '6', label: '60-69: Kelamin (Pria & Wanita) [Alt+Shift+6]' },
  { id: '7', label: '70-79: Kebidanan & Tulang [Alt+Shift+7]' },
  { id: '8', label: '80-89: Otot, Kulit, Diagnostik [Alt+Shift+8]' },
  { id: '9', label: '90-99: Terapi & Diagnostik Lain [Alt+Shift+9]' }
];

export const HIGH_FREQUENCY_ICD10 = {
  'J18.9': 0.001, 'I10': 0.001, 'E11.9': 0.001, 'E11': 0.002,   
  'I64': 0.001, 'K35.8': 0.001, 'K35': 0.001, 'O82': 0.001,   
  'N18.5': 0.001, 'A09': 0.001, 'A09.9': 0.001, 'A09.0': 0.001,
  'J06.9': 0.001, 'T30': 0.001, 'D64.9': 0.01, 'A90': 0.01,   
  'A91': 0.01, 'A01.0': 0.01, 'A01': 0.01, 'B20': 0.01,   
  'I21.9': 0.01, 'I21': 0.01, 'I50.0': 0.01, 'I50.9': 0.01, 
  'I50': 0.01, 'J45.9': 0.01, 'J45': 0.01, 'K80.20': 0.01, 
  'K80.2': 0.01, 'K80': 0.01, 'N18.9': 0.01, 'N18': 0.01,
  'O80': 0.01, 'O80.9': 0.01, 'S72.0': 0.01, 'S72': 0.01,
  'Z38.0': 0.01, 'T14': 0.01, 'T31': 0.01,
};

export const HIGH_FREQUENCY_ICD9 = {
  '39.95': 0.001, '74.1': 0.001, '79.3': 0.01, '78.6': 0.01, 
  '47.09': 0.01, '99.25': 0.01, '93.94': 0.01, '88.72': 0.01,
  '90.59': 0.01, '87.44': 0.01, '96.71': 0.01, '96.72': 0.01,
  '88.76': 0.01, '13.71': 0.01, '13.19': 0.01,
};

export const ICD10_UMBRELLA = {
  'CA': { target: 'neoplasma', label: 'Semua Kanker (C00-D48)' },
  'KANKER': { target: 'neoplasma', label: 'Semua Kanker (C00-D48)' },
  'TUMOR': { target: 'neoplasma', label: 'Semua Tumor (C00-D48)' },
  'FRAKTUR': { target: 'fracture', label: 'Semua Fraktur / Patah Tulang' },
  'PATAH TULANG': { target: 'fracture', label: 'Semua Fraktur / Patah Tulang' },
  'INFEKSI': { target: 'infection', label: 'Semua Penyakit Infeksi' },
  'COVID': { target: 'covid', label: 'COVID-19' },
  'CKD': { target: 'chronic kidney disease', label: 'Penyakit Ginjal Kronik (N18)' },
  'GGK': { target: 'chronic kidney disease', label: 'Penyakit Ginjal Kronik (N18)' },
  'TBC': { target: 'tuberculosis', label: 'Tuberkulosis (A15-A19)' }
};

export const ICD9_UMBRELLA = {
  'OPERASI': { target: 'excision', label: 'Tindakan Operasi/Eksisi' },
  'USG': { target: 'ultrasound', label: 'Ultrasonografi (88.7)' },
  'RONTGEN': { target: 'x-ray', label: 'Rontgen / X-Ray (87)' },
  'MRI': { target: 'magnetic resonance', label: 'MRI (88.9)' },
  'CT SCAN': { target: 'cat scan', label: 'CT Scan (87.03, 87.41, 88.01, 88.38)' }
};

// Pemetaan Sinonim / Alias Lokal untuk istilah Puskesmas & awam
export const ICD10_ALIAS = {
  'diabetes tipe 2': 'E11',
  'kencing manis': 'E11',
  'dm tipe 2': 'E11',
  'kusta': 'A30',
  'lepra': 'A30',
  'gigitan ular': 'W57',
  'digigit ular': 'W57',
  'ispa': 'J06.9',
  'radang tenggorokan': 'J02.9',
  'batuk pilek': 'J06.9',
  'maag': 'K30',
  'asam lambung': 'K30',
  'darah tinggi': 'I10',
  'hipertensi': 'I10',
  'sakit gigi': 'K04',
  'gigi berlubang': 'K02',
  'asam urat': 'M10',
  'pegal linu': 'M79.1',
  'gatal gatal': 'L30',
  'gatal': 'L30',
  'eksim': 'L30',
  'mencret': 'A09',
  'diare': 'A09',
  'muntaber': 'A09',
  'demam': 'R50.9',
  'meriang': 'R50.9',
  'tipes': 'A01.0',
  'typus': 'A01.0',
  'usus buntu': 'K35',
  'angin duduk': 'I20',
  'jantung koroner': 'I25',
  'cacar air': 'B01',
  'cangkrang': 'B01',
  'campak': 'B05',
  'tampek': 'B05',
  'dbd': 'A91',
  'demam berdarah': 'A91',
  'cacingan': 'B82',
  'flek paru': 'A15',
  'batu ginjal': 'N20',
  'mata minus': 'H52.1',
  'rabun jauh': 'H52.1'
};

export const ICD9_ALIAS = {
  'appendectomy': '47.0',
  'operasi usus buntu': '47.0',
  'transplantasi hati': '50.5',
  'operasi sesar': '74.1',
  'sc': '74.1',
  'caesar': '74.1'
};

// Boost untuk kode langka / aneh yang relevan agar naik ke atas
export const RARE_ICD10 = {
  'A30': 3.0, 'W57': 3.0, 'W58': 3.0, 'W91.81': 5.0, 'Z00.0': 3.0
};

export const RARE_ICD9 = {
  '47.0': 3.0, '47.01': 3.0, '50.5': 3.0, '37.51': 3.0
};

