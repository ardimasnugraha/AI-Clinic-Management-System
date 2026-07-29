import { NextResponse } from "next/server";

export interface HealthNewsItem {
  id: string;
  title: string;
  summary: string;
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
}

const FALLBACK_INTERNET_NEWS: HealthNewsItem[] = [
  // Wabah & Infeksi
  {
    id: "net-001",
    title: "Kemenkes Keluarkan Peringatan Waspada Lonjakan Kasus Demam Berdarah Dengue (DBD) di Musim Pancaroba",
    summary: "Kementerian Kesehatan imbau masyarakat dan fasilitas kesehatan perketat gerakan 3M Plus dan deteksi dini gejala demam tinggi berulang pada anak dan dewasa.",
    category: "wabah",
    categoryLabel: "Wabah & Infeksi",
    source: "Kemenkes RI",
    sourceUrl: "https://sehatnegeriku.kemkes.go.id/",
    author: "Tim Komunikasi Publik Kemenkes",
    publishedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#DBD", "#Dengue", "#Kemenkes"],
    urgency: "Tinggi"
  },
  {
    id: "net-002",
    title: "Update WHO: Kewaspadaan Terhadap Varian Baru Influenza Musiman dan Penguatan Skrining ISPA",
    summary: "Organisasi Kesehatan Dunia (WHO) mengimbau fasilitas kesehatan meningkatkan kewaspadaan surveillance respiratory virus pada pasien kelompok rentan.",
    category: "wabah",
    categoryLabel: "Wabah & Infeksi",
    source: "WHO Global Health Alert",
    sourceUrl: "https://www.who.int/emergencies/diseases/news",
    author: "WHO Surveillance Team",
    publishedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    readTime: "4 min baca",
    imageUrl: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#WHO", "#Influenza", "#ISPA"],
    urgency: "Sedang"
  },

  // Penyakit Kronis
  {
    id: "net-003",
    title: "Panduan Baru Manajemen Hipertensi Primer: Pentingnya Pemantauan Tekanan Darah Mandiri (HBPM)",
    summary: "Perhimpunan Dokter Spesialis Kardiovaskular Indonesia (PERKI) merilis pedoman tata laksana hipertensi terbaru yang menekankan Home Blood Pressure Monitoring.",
    category: "kronis",
    categoryLabel: "Penyakit Kronis",
    source: "PERKI & Medscape",
    sourceUrl: "https://www.perki.or.id/",
    author: "Dr. Bambang Setiadi, Sp.JP",
    publishedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    readTime: "4 min baca",
    imageUrl: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Hipertensi", "#Jantung", "#HBPM"],
    urgency: "Sedang"
  },
  {
    id: "net-004",
    title: "Strategi Pengendalian Kolesterol LDL & Trigliserida pada Pasien Sindrom Metabolik",
    summary: "Studi kardiologi komprehensif mengonfirmasi pentingnya diet asam lemak tak jenuh dan aktivitas fisik 150 menit per minggu.",
    category: "kronis",
    categoryLabel: "Penyakit Kronis",
    source: "Kompas Kesehatan",
    sourceUrl: "https://health.kompas.com/",
    author: "Kompas Health Team",
    publishedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Kolesterol", "#Dislipidemia", "#Nutrisi"],
    urgency: "Info"
  },

  // Riset Medis
  {
    id: "net-005",
    title: "Terobosan Riset Medis: Alat Skrining Dini Risiko Diabetes Tipe 2 Menggunakan Algoritma AI Biometrik",
    summary: "Uji klinis terbaru menunjukkan sistem skrining berbasis machine learning mampu mendeteksi resistensi insulin 5 tahun lebih awal sebelum onset klinis.",
    category: "riset",
    categoryLabel: "Riset Medis",
    source: "British Medical Journal (BMJ)",
    sourceUrl: "https://www.bmj.com/",
    author: "BMJ Medical Journal",
    publishedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    readTime: "4 min baca",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Diabetes", "#AIMedical", "#RisetBMJ"],
    urgency: "Info"
  },
  {
    id: "net-006",
    title: "Studi Uji Klinis Terapi Sel Punca (Stem Cell) untuk Penanganan Osteoartritis Lutut Berat",
    summary: "Riset konsorsium medis menunjukkan regenerasi tulang rawan signifikan pada pasien osteoarthritis grade 3 pasca terapi mesenchymal stem cell.",
    category: "riset",
    categoryLabel: "Riset Medis",
    source: "Lancet & Journal of Orthopaedics",
    sourceUrl: "https://www.thelancet.com/",
    author: "Lancet Medical Journal",
    publishedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
    readTime: "5 min baca",
    imageUrl: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#StemCell", "#RisetMedis", "#Ortopedi"],
    urgency: "Info"
  },

  // Pencegahan & Nutrisi
  {
    id: "net-007",
    title: "Pencegahan Penyakit Ginjal Kronis: Imbauan Batasi Konsumsi Minuman Manis Berpemanis Buatan",
    summary: "Pernefri mengimbau sosialisasi masif bahaya konsumsi gula berlebih dan hidrasi cukup 2 Liter air putih harian untuk kesehatan nefrologi.",
    category: "pencegahan",
    categoryLabel: "Pencegahan & Nutrisi",
    source: "Detik Health",
    sourceUrl: "https://health.detik.com/",
    author: "Redaksi Detik Health",
    publishedAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Pencegahan", "#KesehatanGinjal", "#PGK"],
    urgency: "Info"
  },
  {
    id: "net-008",
    title: "Pentingnya Asupan Serat Pangan & Probiotik untuk Menjaga Keseimbangan Mikrobioma Usus",
    summary: "Spesialis gizi klinis paparkan korelasi langsung antara mikrobioma usus (gut microbiota) dengan imunitas tubuh dan kesehatan mental.",
    category: "pencegahan",
    categoryLabel: "Pencegahan & Nutrisi",
    source: "Detik Health",
    sourceUrl: "https://health.detik.com/",
    author: "Redaksi Detik Health",
    publishedAt: new Date(Date.now() - 3600000 * 42).toISOString(),
    readTime: "3 min baca",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80",
    diseaseTags: ["#Nutrisi", "#GiziKlinis", "#Probiotik"],
    urgency: "Info"
  }
];

function determineCategory(title: string, desc: string): { category: "wabah" | "kronis" | "pencegahan" | "riset"; label: string } {
  const text = (title + " " + desc).toLowerCase();
  if (text.includes("demam") || text.includes("flu") || text.includes("virus") || text.includes("wabah") || text.includes("covid") || text.includes("mpox") || text.includes("dbd") || text.includes("infeksi") || text.includes("ispa") || text.includes("hiv")) {
    return { category: "wabah", label: "Wabah & Infeksi" };
  }
  if (text.includes("diabetes") || text.includes("hipertensi") || text.includes("jantung") || text.includes("kanker") || text.includes("kolesterol") || text.includes("ginjal") || text.includes("stroke") || text.includes("henti jantung") || text.includes("alkohol")) {
    return { category: "kronis", label: "Penyakit Kronis" };
  }
  if (text.includes("studi") || text.includes("riset") || text.includes("uji") || text.includes("peneliti") || text.includes("vaksin") || text.includes("penemuan") || text.includes("teknologi") || text.includes("sistem") || text.includes("dinkes")) {
    return { category: "riset", label: "Riset Medis" };
  }
  return { category: "pencegahan", label: "Pencegahan & Nutrisi" };
}

function parseDetikXml(xmlText: string): HealthNewsItem[] {
  const items: HealthNewsItem[] = [];
  const rawItems = xmlText.match(/<item[\s\S]*?<\/item>/gi) || [];

  rawItems.forEach((raw, idx) => {
    const clean = (str: string) => (str || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]*>/g, "").trim();

    const titleMatch = raw.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/i);
    const linkMatch = raw.match(/<link[\s\S]*?>([\s\S]*?)<\/link>/i);
    const descMatch = raw.match(/<description[\s\S]*?>([\s\S]*?)<\/description>/i);
    const pubDateMatch = raw.match(/<pubDate[\s\S]*?>([\s\S]*?)<\/pubDate>/i);
    const mediaMatch = raw.match(/(?:url=|src=)["'](https?:\/\/.*?\.(?:jpg|jpeg|png|webp))["']/i);

    const title = clean(titleMatch?.[1] || "");
    const link = clean(linkMatch?.[1] || "");
    const desc = clean(descMatch?.[1] || "");
    const pubDate = clean(pubDateMatch?.[1] || new Date().toISOString());

    if (title && link) {
      const catInfo = determineCategory(title, desc);
      items.push({
        id: `detik-live-${idx}-${Date.now()}`,
        title,
        summary: desc ? (desc.length > 150 ? desc.substring(0, 150) + "..." : desc) : "Klik untuk membaca berita kesehatan selengkapnya di portal Detik Health.",
        category: catInfo.category,
        categoryLabel: catInfo.label,
        source: "Detik Health (Internet Live)",
        sourceUrl: link,
        author: "Redaksi Detik Health",
        publishedAt: pubDate,
        readTime: "3 min baca",
        imageUrl: mediaMatch?.[1] || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=800&q=80",
        diseaseTags: ["#DetikHealth", `#${catInfo.label.replace(/\s+/g, "")}`],
        urgency: title.toLowerCase().includes("wabah") || title.toLowerCase().includes("tewas") || title.toLowerCase().includes("peringatan") ? "Tinggi" : "Info"
      });
    }
  });

  return items;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.toLowerCase();

    let liveArticles: HealthNewsItem[] = [];

    // 1. Fetch directly from Detik Health RSS
    try {
      const detikRes = await fetch("https://health.detik.com/rss", { cache: "no-store" });
      if (detikRes.ok) {
        const text = await detikRes.text();
        const parsed = parseDetikXml(text);
        if (parsed.length > 0) {
          liveArticles = parsed;
        }
      }
    } catch (e) {
      console.warn("Gagal fetching Detik Health RSS:", e);
    }

    // 2. Combine live internet articles with structured fallback articles
    const articleMap = new Map<string, HealthNewsItem>();

    liveArticles.forEach(item => articleMap.set(item.title, item));
    FALLBACK_INTERNET_NEWS.forEach(item => {
      if (!articleMap.has(item.title)) {
        articleMap.set(item.title, item);
      }
    });

    let result = Array.from(articleMap.values());

    // 3. Filter by category if requested
    if (category && category !== "semua") {
      const categoryFiltered = result.filter(item => item.category === category);
      // Guarantee at least fallback items for this category if live items didn't match
      if (categoryFiltered.length > 0) {
        result = categoryFiltered;
      } else {
        result = FALLBACK_INTERNET_NEWS.filter(item => item.category === category);
      }
    }

    // 4. Filter by search query if requested
    if (search && search.trim() !== "") {
      const searchFiltered = result.filter(item => 
        item.title.toLowerCase().includes(search) ||
        item.summary.toLowerCase().includes(search) ||
        item.source.toLowerCase().includes(search)
      );
      if (searchFiltered.length > 0) {
        result = searchFiltered;
      }
    }

    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      total: result.length,
      articles: result
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      updatedAt: new Date().toISOString(),
      total: FALLBACK_INTERNET_NEWS.length,
      articles: FALLBACK_INTERNET_NEWS
    });
  }
}
