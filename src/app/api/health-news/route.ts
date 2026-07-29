import { NextResponse } from "next/server";

export interface HealthNewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: "wabah" | "kronis" | "pencegahan" | "riset";
  categoryLabel: string;
  source: string;
  sourceUrl: string;
  author: string;
  publishedAt: string;
  readTime: string;
  imageUrl: string;
  diseaseTags: string[];
  urgency: "Tinggi" | "Sedang" | "Info";
  keyTakeaways: string[];
}

const FALLBACK_HEALTH_NEWS: HealthNewsItem[] = [
  {
    id: "news-001",
    title: "Kemenkes Keluarkan Peringatan Waspada Lonjakan Kasus Demam Berdarah Dengue (DBD) di Musim Pancaroba",
    summary: "Kementerian Kesehatan imbau masyarakat dan fasilitas kesehatan perketat gerakan 3M Plus dan deteksi dini gejala demam tinggi berulang pada anak dan dewasa.",
    content: "Kementerian Kesehatan Republik Indonesia merilis imbauan kewaspadaan nasional terkait peningkatan grafik kasus Demam Berdarah Dengue (DBD). Fasilitas kesehatan primer seperti puskesmas dan klinik swasta diminta menyiapkan stok NS1 rapid test dan cairan infus memadai. Gejala khas seperti demam mendadak tinggi di atas 38.5°C selama 2-7 hari, nyeri retro-orbital, dan nyeri sendi harus segera mendapatkan evaluasi hematologi rutin (trombosit & hematokrit).",
    category: "wabah",
    categoryLabel: "Wabah & Infeksi",
    source: "Kemenkes RI",
    sourceUrl: "https://sehatnegeriku.kemkes.go.id/",
    author: "Tim Komunikasi Publik Kemenkes",
    publishedAt: "2026-07-29T08:00:00Z",
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#DBD", "#Dengue", "#Pencegahan3M", "#Kemenkes"],
    urgency: "Tinggi",
    keyTakeaways: [
      "Periksa Trombosit & Hematokrit jika demam > 2 hari.",
      "Siapkan stok Reagen NS1 & Cairan Kristaloid di klinik.",
      "Edukasi pasien mengenai tanda bahaya (warning signs) seperti muntah persisten & perdarahan gusi."
    ]
  },
  {
    id: "news-002",
    title: "Panduan Baru Manajemen Hipertensi Primer 2026: Pentingnya Pemantauan Tekanan Darah Mandiri (HBPM)",
    summary: "Perhimpunan Dokter Spesialis Kardiovaskular Indonesia (PERKI) merilis pedoman tata laksana hipertensi terbaru yang menekankan Home Blood Pressure Monitoring.",
    content: "Studi komprehensif terbaru menunjukkan bahwa pemantauan tekanan darah mandiri di rumah (Home Blood Pressure Monitoring / HBPM) selama 7 hari berturut-turut memberikan akurasi diagnosis lebih tinggi dibanding pembacaan tunggal di ruang praktek (mengeliminasi efek White Coat Hypertension). Target tekanan darah yang direkomendasikan untuk usia < 65 tahun tanpa komorbiditas berat kini berada pada < 130/80 mmHg.",
    category: "kronis",
    categoryLabel: "Penyakit Kronis",
    source: "PERKI & Medscape",
    sourceUrl: "https://www.perki.or.id/",
    author: "Dr. Bambang Setiadi, Sp.JP",
    publishedAt: "2026-07-28T14:30:00Z",
    readTime: "4 min baca",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Hipertensi", "#Jantung", "#Kardiologi", "#HBPM"],
    urgency: "Sedang",
    keyTakeaways: [
      "HBPM 7 hari disarankan sebelum mengubah dosis antihipertensi.",
      "Target normotensi terbaru < 130/80 mmHg untuk populasi dewasa aktif.",
      "Kombinasi pola makan rendah garam (DASH Diet) dan kontrol stres terbukti menurunkan TDS 8-12 mmHg."
    ]
  },
  {
    id: "news-003",
    title: "Update WHO: Kewaspadaan Terhadap Varian Baru Influenza Musiman dan Penguatan Skrining ISPA",
    summary: "Organisasi Kesehatan Dunia (WHO) mengimbau fasilitas kesehatan meningkatkan kewaspadaan surveillance respiratory virus pada pasien kelompok rentan.",
    content: "Dalam laporan epidemiologi berkala terbaru, WHO menyoroti peningkatan tren Infeksi Saluran Pernapasan Akut (ISPA) yang disebabkan oleh sirkulasi simultan Varian H3N2 dan RSV pada balita dan lansia. WHO merekomendasikan penggunaan masker medis di ruang tunggu klinis tertutup serta pemberian vaksinasi influenza tahunan bagi tenaga kesehatan.",
    category: "wabah",
    categoryLabel: "Wabah & Infeksi",
    source: "WHO Global Health Alert",
    sourceUrl: "https://www.who.int/emergencies/diseases/news",
    author: "WHO Surveillance Team",
    publishedAt: "2026-07-27T10:15:00Z",
    readTime: "5 min baca",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#WHO", "#Influenza", "#ISPA", "#Respiratori"],
    urgency: "Sedang",
    keyTakeaways: [
      "Skrining triase ketat untuk pasien batuk demam di ruang tunggu.",
      "Anjurkan vaksin influenza tahunan untuk pasien lansia dan komorbid paru.",
      "Protokol ventilasi udara di ruang konsultasi klinik diperketat."
    ]
  },
  {
    id: "news-004",
    title: "Terobosan Riset Medis: Alat Skrining Dini Risiko Diabetes Tipe 2 Menggunakan Algoritma AI Biometrik",
    summary: "Uji klinis terbaru menunjukkan sistem skrining berbasis machine learning mampu mendeteksi resistensi insulin 5 tahun lebih awal sebelum onset klinis.",
    content: "Peneliti medis internasional meluncurkan studi validasi klinis untuk instrumen skrining non-invasif berbasis AI yang menganalisis parameter variabel biometrik, riwayat keluarga, dan data HbA1c serial. Sistem ini membantu dokter keluarga dan praktisi klinik primer memprediksi risiko neuropati dan nefropati diabetik secara presisi.",
    category: "riset",
    categoryLabel: "Riset Medis",
    source: "British Medical Journal (BMJ)",
    sourceUrl: "https://www.bmj.com/",
    author: "Prof. Sarah Jenkins, MD PhD",
    publishedAt: "2026-07-26T16:45:00Z",
    readTime: "4 min baca",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Diabetes", "#Endokrinologi", "#AIMedical", "#RisetBMJ"],
    urgency: "Info",
    keyTakeaways: [
      "Skrining HbA1c berkala tetap menjadi standar emas diagnosis.",
      "Intervensi gaya hidup pada fase prediyabetes mencegah 60% komplikasi organ.",
      "Penggunaan teknologi pemantauan glukosa kontinu (CGM) semakin terjangkau."
    ]
  },
  {
    id: "news-005",
    title: "Pencegahan Penyakit Ginjal Kronis: Imbauan Batasi Konsumsi Minuman Manis Berpemanis Buatan",
    summary: "Pernefri mengimbau sosialisasi masif bahaya konsumsi gula berlebih dan hidrasi cukup 2 Liter air putih harian untuk kesehatan nefrologi.",
    content: "Perhimpunan Nefrologi Indonesia (PERNEFRI) mengingatkan peningkatan insidensi Penyakit Ginjal Kronis (PGK) pada usia muda di bawah 40 tahun. Penyebab utamanya adalah kombinasi asupan gula cair tinggi, kurang minum air putih, dan konsumsi obat pereda nyeri (NSAID) jangka panjang tanpa pengawasan dokter.",
    category: "pencegahan",
    categoryLabel: "Pencegahan & Nutrisi",
    source: "PERNEFRI & Detik Health",
    sourceUrl: "https://health.detik.com/",
    author: "Tim Edukasi Kesehatan Ginjal",
    publishedAt: "2026-07-25T09:20:00Z",
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#KesehatanGinjal", "#Pencegahan", "#PGK", "#Hidrasi"],
    urgency: "Info",
    keyTakeaways: [
      "Anjurkan pasien minum minimal 2.0-2.5 L air bersih per hari.",
      "Hindari pemakaian berlebihan obat NSAID bebas tanpa indikasi jelas.",
      "Cek berkala fungsi ginjal (Ureum/Kreatinin & eGFR) pada pasien hipertensi/diabetes."
    ]
  },
  {
    id: "news-006",
    title: "Strategi Pengendalian Kolesterol LDL & Trigliserida pada Pasien Sindrom Metabolik",
    summary: "Studi kardiologi komprehensif mengonfirmasi pentingnya diet asam lemak tak jenuh dan aktivitas fisik 150 menit per minggu.",
    content: "Penanganan dislipidemia tidak hanya berfokus pada terapi farmakologi Statin, namun memerlukan pendekatan holistik integratif. Kombinasi suplementasi Omega-3, pengurangan konsumsi lemak trans, dan latihan aerobik teratur terbukti efektif menurunkan kadar Trigliserida hingga 30% serta meningkatkan profil HDL secara bermakna.",
    category: "kronis",
    categoryLabel: "Penyakit Kronis",
    source: "Kompas Kesehatan & Lancet",
    sourceUrl: "https://health.kompas.com/",
    author: "Dr. Sp.GK Rina Hartati",
    publishedAt: "2026-07-24T11:10:00Z",
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Kolesterol", "#Dislipidemia", "#Nutrisi", "#JantungSehat"],
    urgency: "Info",
    keyTakeaways: [
      "Target LDL < 70 mg/dL untuk pasien risiko tinggi kardiovaskular.",
      "Evaluasi profil lipid lengkap setiap 3-6 bulan selama fase titrasi obat.",
      "Resepkan modifikasi gaya hidup terapeutik (TLC) berbarengan dengan medikasi."
    ]
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase();

    let filtered = [...FALLBACK_HEALTH_NEWS];

    if (category && category !== "semua") {
      filtered = filtered.filter(item => item.category === category);
    }

    if (search && search.trim() !== "") {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(search) ||
        item.summary.toLowerCase().includes(search) ||
        item.diseaseTags.some(tag => tag.toLowerCase().includes(search)) ||
        item.source.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      total: filtered.length,
      articles: filtered
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal mengambil data berita kesehatan",
        articles: FALLBACK_HEALTH_NEWS
      },
      { status: 500 }
    );
  }
}
